// Datos del estudio: consultas, pedidos de presupuesto, reseñas de clientes y seguimiento de proyectos.
//
// Público (lo usan las páginas del sitio):
//   POST /api/consultas                       guarda una consulta o un pedido de presupuesto → { code, link?, mailed }
//   GET  /api/presupuestos/<token>            el pedido y, cuando Jimena la carga, su propuesta
//   GET  /api/resenas                         reseñas aprobadas (lista vacía hasta que haya al menos 3)
//   GET  /api/resenas/invitacion/<token>      si el link para dejar una reseña sirve
//   POST /api/resenas/invitacion/<token>      el cliente deja su reseña (queda pendiente hasta que Jimena la aprueba)
//   GET  /api/proyectos/<token>               en qué etapa está el proyecto de un cliente
//
// Privado (panel de Jimena en /api/admin, con la clave ADMIN_CLAVE de Cloudflare):
//   GET  /api/admin                           el panel
//   GET  /api/admin/datos                     todo lo guardado
//   GET  /api/admin/mail/<code>               cómo se ve el mail de confirmación de esa consulta
//   POST /api/admin/presupuestos/<token>      estado y propuesta de un presupuesto
//   POST /api/admin/resenas/invitar           crea un link para que un cliente deje su reseña
//   POST /api/admin/resenas/<id>              aprobar, ocultar o borrar una reseña
//   POST /api/admin/proyectos                 crea el seguimiento de un proyecto
//   POST /api/admin/proyectos/<token>         cambia etapa, fecha estimada o nota; o lo borra
//
// Todo vive en un Durable Object (base SQLite chiquita de Cloudflare). Nada de esto se publica sin que Jimena lo apruebe.
// El mail de confirmación sale por Resend solo si en Cloudflare están RESEND_API_KEY y MAIL_FROM; si no, se guarda igual.

import { DurableObject } from 'cloudflare:workers';
import { adminPage } from './admin-page.js';
import { confirmationMail, briefInviteMail, briefReceivedMail, briefUpdatedMail, launchMail, proposalMail, stageMail } from './mail.js';

const SITE = 'https://jnbcreativestudio.com.ar';
const LANGS = new Set(['es', 'en', 'pt']);
const TOKEN = /^[A-Za-z0-9]{20,40}$/;
const CODE = /^JNB-\d{4}-[A-Z0-9]{4}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const STORE_LINK = /^https:\/\/jnbcreativestudio\.mitiendanube\.com(\/[^\s"<>]*)?$/;
const DAY = 24 * 60 * 60 * 1000;
const KEEP_INQUIRIES_DAYS = 365;     // las consultas se borran solas al año
const MIN_PUBLIC_REVIEWS = 3;        // la sección de reseñas no aparece con menos de esto
const STAGES = 5;                    // etapas del seguimiento (los nombres están en js/client-pages.js)
const MAX_BRIEF_FILES = 30;                 // archivos por brief
const MAX_FILE_BYTES = 8 * 1024 * 1024;     // 8 MB por archivo
const MAX_BRIEF_BYTES = 60 * 1024 * 1024;   // 60 MB por brief
const CHUNK = 1024 * 1024;
// Archivos que se pueden subir al brief: imágenes, PDF, documentos, planillas y comprimidos (se mira la extensión)
const FILE_EXT = /\.(png|jpe?g|webp|gif|svg|heic|heif|pdf|docx?|xlsx?|pptx|odt|ods|txt|csv|zip)$/i;
// Plan del cliente según el texto del presupuesto o del proyecto (el brief cambia según el plan)
const planKey = (text) => {
  const t = String(text || '');
  if (/emprendedor|empreendedor|tienda|loja|store/i.test(t)) return 'emprendedor';
  if (/premium|a medida|custom|sob medida/i.test(t)) return 'premium';
  if (/b[aá]sico|basic|landing/i.test(t)) return 'basico';
  return '';
};
const SHOWN_STATUSES = ['enviado', 'aceptado'];
const LAUNCH_STAGE = 4;          // "Publicación y entrega" (contando desde 0)
const STAGE_NAMES = ['Reserva y confirmación', 'Recepción de materiales', 'Diseño y desarrollo', 'Revisión y ajustes', 'Publicación y entrega'];
const COUPON_PERCENT = 20;       // descuento para la próxima actualización
const COUPON_MONTHS = 3;         // vence a los 3 meses de entregado; se usa una sola vez
const newCouponCode = () => `GRACIAS-${randomFrom(SAFE_LETTERS, 5)}`;
const BRIEF_LOCKED_STAGES = [2, 4]; // Diseño y desarrollo, Publicación (contando desde 0)
// Cambios entre dos versiones del brief (por pregunta)
const diffSummary = (before, after) => {
  const key = (row) => `${row.s}|${row.q}`;
  const old = new Map(before.map((row) => [key(row), row.a]));
  const now = new Set(after.map(key));
  const changes = after.filter((row) => old.get(key(row)) !== row.a)
    .map((row) => ({ s: row.s, q: row.q, before: old.has(key(row)) ? old.get(key(row)) : '', after: row.a }));
  before.filter((row) => !now.has(key(row))).forEach((row) => changes.push({ s: row.s, q: row.q, before: row.a, after: '' }));
  return changes.slice(0, 100);
}; // estados del presupuesto en los que el cliente ve la propuesta

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const notFound = () => json({ error: 'not found' }, 404);
const badRequest = () => json({ error: 'bad request' }, 400);

const SAFE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I/L, para que se dicten sin confusión
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const randomFrom = (alphabet, length) => Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => alphabet[b % alphabet.length]).join('');
const newToken = () => randomFrom(ALNUM, 24);
// Número de consulta: JNB-<año><mes>-XXXX. No es correlativo, así no deja ver cuántas consultas hubo.
const newCode = (now) => `JNB-${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}-${randomFrom(SAFE_LETTERS, 4)}`;

// Gestor de tareas: columnas del tablero y prioridades
const TASK_STATUSES = ['inbox', 'todo', 'doing', 'review', 'done'];
const TASK_PRIORITIES = ['baja', 'media', 'alta'];
// Sorteos de Instagram: etapas del ganador (contando desde 0) y la fecha que se guarda la primera vez que llega a cada paso
const GIVEAWAY_STATUSES = ['borrador', 'activo', 'finalizado'];
const WINNER_STAGES = ['Ganador anunciado', 'Pendiente de contacto', 'Contactado', 'Brief enviado', 'Brief recibido', 'Material pendiente',
  'Material recibido', 'Diseño en proceso', 'En revisión', 'Correcciones', 'Finalizado', 'Premio entregado'];
const WINNER_STAGE_DATES = { 2: 'contacted_at', 3: 'brief_sent_at', 4: 'brief_done_at', 6: 'materials_at', 11: 'delivered_at' };
const WINNER_MARKS = { contacted_at: 'Contactado', brief_sent_at: 'Brief enviado', brief_done_at: 'Brief completado', materials_at: 'Materiales recibidos', delivered_at: 'Premio entregado' };
const INSTAGRAM_URL = /^https:\/\/(www\.)?instagram\.com\/[^\s"<>]*$/i;
const HTTPS_URL = /^https:\/\/[^\s"<>]+$/;
// Agenda: tipos de vencimiento que carga Jimena y de dónde vino cada cliente (lo marca ella; los del sorteo se marcan solos)
const RENEWAL_KINDS = ['dominio', 'soporte', 'hosting', 'otro'];
const CLIENT_SOURCES = ['instagram', 'sorteo', 'upwork', 'recomendacion', 'google', 'otro'];
// Fecha de hoy en Argentina (AAAA-MM-DD)
const arToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
// Premio con proyecto web: nombre del proyecto (planKey lo usa para elegir las preguntas del brief)
// Cotizador: catálogo inicial de las funcionalidades "a cotizar" del Plan a medida ([nombre, descripción, categoría, horas]).
// Precio inicial = horas × $18.990 (hora del tarifario 2026), redondeado hacia arriba a $x.990. Después se editan en el panel.
const QUOTE_CATEGORIES = ['Desarrollo y estructura web', 'Diseño y personalización', 'Automatizaciones', 'Administración', 'Marketing y difusión'];
const QUOTE_SEED = [
  ['Galería de productos', 'Catálogo con categorías o filtros, sin carrito.', 0, 4], ['Catálogo de productos filtrable', 'Fotos, categorías, filtros y buscador.', 0, 5],
  ['Buscador interno', 'Encuentra productos, servicios o contenidos de la web.', 0, 2], ['Portfolio filtrable', 'Trabajos por categorías, con fotos y enlaces.', 0, 3],
  ['Sistema de reservas propio', 'Reservas con disponibilidad real (con base de datos).', 0, 12],
  ['Galería de imágenes ampliable', 'Fotos que se abren en grande y se recorren con flechas.', 1, 1], ['Comparador antes y después', 'Dos fotos que se comparan deslizando.', 1, 1],
  ['Menú digital con código QR', 'Carta con categorías, fotos, precios y QR.', 1, 3], ['Tarjeta digital de contacto', 'Tarjeta para compartir o descargar.', 1, 2],
  ['Carrito de pedidos por WhatsApp', 'Arma el mensaje del pedido con productos y cantidades.', 2, 4], ['Formulario de pedidos', 'Pedidos con los datos que necesitás.', 2, 2.5],
  ['Selector de turnos por WhatsApp', 'Servicio, día y horario por WhatsApp.', 2, 3.5], ['Calculadora de presupuestos', 'Importe estimado según servicios y opciones.', 2, 4],
  ['Calculadora de cuotas', 'Cuotas e importes estimados.', 2, 1.5], ['Test de recomendación', 'Preguntas que recomiendan el servicio ideal.', 2, 3],
  ['Agregar al calendario', 'Guarda un evento en el celular o la compu.', 2, 0.5],
  ['Cupones promocionales', 'Códigos de descuento abiertos.', 3, 1.5], ['Comparador de planes o servicios', 'Tabla interactiva para comparar opciones.', 3, 2],
  ['Botones para compartir', 'Por WhatsApp, redes o copiando el enlace.', 4, 0.5], ['Botón "Guardar contacto" (vCard)', 'Guarda tus datos en la agenda del teléfono.', 4, 0.5],
];
// Traducciones del catálogo inicial (inglés y portugués): [nombre en, descripción en, nombre pt, descripción pt]
const QUOTE_SEED_TR = {
  "Galería de productos": [
    "Product gallery",
    "Catalog with categories or filters, no cart.",
    "Galeria de produtos",
    "Catálogo com categorias ou filtros, sem carrinho."
  ],
  "Catálogo de productos filtrable": [
    "Filterable product catalog",
    "Photos, categories, filters and search.",
    "Catálogo de produtos filtrável",
    "Fotos, categorias, filtros e busca."
  ],
  "Buscador interno": [
    "Site search",
    "Finds products, services or content on your site.",
    "Busca interna",
    "Encontra produtos, serviços ou conteúdos do site."
  ],
  "Portfolio filtrable": [
    "Filterable portfolio",
    "Your work by category, with photos and links.",
    "Portfólio filtrável",
    "Trabalhos por categoria, com fotos e links."
  ],
  "Sistema de reservas propio": [
    "Custom booking system",
    "Bookings with real availability (with a database).",
    "Sistema de reservas próprio",
    "Reservas com disponibilidade real (com banco de dados)."
  ],
  "Galería de imágenes ampliable": [
    "Expandable image gallery",
    "Photos that open full size and can be browsed with arrows.",
    "Galeria de imagens ampliável",
    "Fotos que abrem em tamanho grande e se navegam com setas."
  ],
  "Comparador antes y después": [
    "Before and after slider",
    "Two photos compared by sliding.",
    "Comparador antes e depois",
    "Duas fotos comparadas deslizando."
  ],
  "Menú digital con código QR": [
    "Digital menu with QR code",
    "Menu with categories, photos, prices and QR.",
    "Cardápio digital com QR code",
    "Cardápio com categorias, fotos, preços e QR."
  ],
  "Tarjeta digital de contacto": [
    "Digital business card",
    "A card to share or download.",
    "Cartão digital de contato",
    "Cartão para compartilhar ou baixar."
  ],
  "Carrito de pedidos por WhatsApp": [
    "WhatsApp order cart",
    "Builds the order message with products and quantities.",
    "Carrinho de pedidos pelo WhatsApp",
    "Monta a mensagem do pedido com produtos e quantidades."
  ],
  "Formulario de pedidos": [
    "Order form",
    "Orders with the details you need.",
    "Formulário de pedidos",
    "Pedidos com os dados de que você precisa."
  ],
  "Selector de turnos por WhatsApp": [
    "WhatsApp appointment picker",
    "Service, day and time via WhatsApp.",
    "Seletor de horários pelo WhatsApp",
    "Serviço, dia e horário pelo WhatsApp."
  ],
  "Calculadora de presupuestos": [
    "Quote calculator",
    "Estimated amount based on services and options.",
    "Calculadora de orçamentos",
    "Valor estimado conforme serviços e opções."
  ],
  "Calculadora de cuotas": [
    "Installment calculator",
    "Estimated installments and amounts.",
    "Calculadora de parcelas",
    "Parcelas e valores estimados."
  ],
  "Test de recomendación": [
    "Recommendation quiz",
    "Questions that recommend the ideal service.",
    "Teste de recomendação",
    "Perguntas que recomendam o serviço ideal."
  ],
  "Agregar al calendario": [
    "Add to calendar",
    "Saves an event on the phone or computer.",
    "Adicionar à agenda",
    "Salva um evento no celular ou no computador."
  ],
  "Cupones promocionales": [
    "Promo codes",
    "Open discount codes.",
    "Cupons promocionais",
    "Códigos de desconto abertos."
  ],
  "Comparador de planes o servicios": [
    "Plan or service comparison",
    "Interactive table to compare options.",
    "Comparador de planos ou serviços",
    "Tabela interativa para comparar opções."
  ],
  "Botones para compartir": [
    "Share buttons",
    "Via WhatsApp, social media or by copying the link.",
    "Botões de compartilhar",
    "Pelo WhatsApp, redes ou copiando o link."
  ],
  "Botón \"Guardar contacto\" (vCard)": [
    "\"Save contact\" button (vCard)",
    "Saves your details to the phone's contacts.",
    "Botão \"Salvar contato\" (vCard)",
    "Salva os seus dados nos contatos do celular."
  ]
};
const QUOTE_RATE = 1580.90; // misma cotización inicial que js/pricing.js; después se edita en el panel
const QUOTE_HOUR = 18990;   // valor de la hora (tarifario 2026); se edita en el panel
// Precio = horas × valor de la hora, redondeado hacia arriba a $x.990; USD = pesos / cotización
const quoteArs = (hours, hour) => (hours > 0 ? Math.ceil((hours * hour) / 1000) * 1000 - 10 : 0);
const WINNER_PROJECTS = { premium: 'Plan Premium', basico: 'Plan Básico', emprendedor: 'Plan Emprendedor (tienda)' };
const text = (value, max) => (typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');
const oneLine = (value, max) => text(value, max).replace(/\s+/g, ' ');
const isoDate = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '');
// Mail normalizado (sin espacios y en minúsculas): dos pedidos con el mismo mail son del mismo cliente
const normEmail = (value) => {
  const mail = String(value || '').trim().toLowerCase();
  return EMAIL.test(mail) ? mail.slice(0, 160) : '';
};
const clientCode = (id) => `JNB-CLI-${String(id).padStart(4, '0')}`;
const CLIENT_STATUSES = ['', 'contacto', 'presupuesto', 'activo', 'publicado', 'inactivo'];

export class StudioData extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS inquiries (
      code TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      created TEXT NOT NULL,
      lang TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      plan TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'recibido',
      proposal TEXT,
      mailed INTEGER NOT NULL DEFAULT 0
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS invitations (
      token TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      created TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation TEXT NOT NULL,
      created TEXT NOT NULL,
      lang TEXT NOT NULL,
      name TEXT NOT NULL,
      business TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendiente'
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS projects (
      token TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      project TEXT NOT NULL,
      lang TEXT NOT NULL,
      stage INTEGER NOT NULL DEFAULT 0,
      due TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      next TEXT NOT NULL DEFAULT '',
      preview TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL,
      updated TEXT NOT NULL
    )`);
    // Columnas sumadas después: próximo paso del cliente y link de vista previa
    const columns = this.sql.exec('PRAGMA table_info(projects)').toArray().map((c) => c.name);
    if (!columns.includes('next')) this.sql.exec("ALTER TABLE projects ADD COLUMN next TEXT NOT NULL DEFAULT ''");
    if (!columns.includes('preview')) this.sql.exec("ALTER TABLE projects ADD COLUMN preview TEXT NOT NULL DEFAULT ''");
    // Presupuesto del que salió el proyecto: así el cliente sigue todo con un solo link (el del presupuesto)
    if (!columns.includes('quote')) this.sql.exec("ALTER TABLE projects ADD COLUMN quote TEXT NOT NULL DEFAULT ''");
    // Brief del cliente: respuestas (y un resumen ya armado en su idioma) y archivos que sube, partidos en pedazos
    this.sql.exec(`CREATE TABLE IF NOT EXISTS briefs (
      token TEXT PRIMARY KEY,
      lang TEXT NOT NULL DEFAULT 'es',
      answers TEXT NOT NULL DEFAULT '{}',
      summary TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'borrador',
      updated TEXT NOT NULL,
      sent TEXT NOT NULL DEFAULT ''
    )`);
    // Ediciones después de enviado: cuándo editó, si Jimena ya lo vio y cómo estaba antes (para marcar los cambios)
    const briefColumns = this.sql.exec('PRAGMA table_info(briefs)').toArray().map((c) => c.name);
    if (!briefColumns.includes('edited')) this.sql.exec("ALTER TABLE briefs ADD COLUMN edited TEXT NOT NULL DEFAULT ''");
    if (!briefColumns.includes('edit_seen')) this.sql.exec('ALTER TABLE briefs ADD COLUMN edit_seen INTEGER NOT NULL DEFAULT 1');
    if (!briefColumns.includes('prev_summary')) this.sql.exec("ALTER TABLE briefs ADD COLUMN prev_summary TEXT NOT NULL DEFAULT '[]'");
    // Versión que el cliente envió por última vez y lista de cambios de su último envío (para el mail y para marcarle lo actualizado)
    if (!briefColumns.includes('sent_summary')) this.sql.exec("ALTER TABLE briefs ADD COLUMN sent_summary TEXT NOT NULL DEFAULT '[]'");
    if (!briefColumns.includes('last_changes')) this.sql.exec("ALTER TABLE briefs ADD COLUMN last_changes TEXT NOT NULL DEFAULT '[]'");
    if (!briefColumns.includes('resent')) this.sql.exec("ALTER TABLE briefs ADD COLUMN resent TEXT NOT NULL DEFAULT ''");
    // Cupones de descuento: se crean al publicar un proyecto (20 % en la próxima actualización, un solo uso)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      project TEXT NOT NULL,
      client TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      lang TEXT NOT NULL,
      percent INTEGER NOT NULL,
      created TEXT NOT NULL,
      used_inquiry TEXT NOT NULL DEFAULT '',
      used_at TEXT NOT NULL DEFAULT ''
    )`);
    const couponColumns = this.sql.exec('PRAGMA table_info(coupons)').toArray().map((c) => c.name);
    if (!couponColumns.includes('expires')) this.sql.exec("ALTER TABLE coupons ADD COLUMN expires TEXT NOT NULL DEFAULT ''");
    const projectColumns = this.sql.exec('PRAGMA table_info(projects)').toArray().map((c) => c.name);
    if (!projectColumns.includes('review_token')) this.sql.exec("ALTER TABLE projects ADD COLUMN review_token TEXT NOT NULL DEFAULT ''");
    if (!projectColumns.includes('coupon')) this.sql.exec("ALTER TABLE projects ADD COLUMN coupon TEXT NOT NULL DEFAULT ''");
    const inquiryColumns = this.sql.exec('PRAGMA table_info(inquiries)').toArray().map((c) => c.name);
    if (!inquiryColumns.includes('coupon')) this.sql.exec("ALTER TABLE inquiries ADD COLUMN coupon TEXT NOT NULL DEFAULT ''");
    // País del cliente (del formulario de presupuesto): define la moneda sugerida en el panel
    if (!inquiryColumns.includes('country')) this.sql.exec("ALTER TABLE inquiries ADD COLUMN country TEXT NOT NULL DEFAULT ''");
    // Historial de cada cliente: lo que va pasando con su proyecto (lo ve Jimena en la ficha del cliente)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS project_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL,
      at TEXT NOT NULL,
      icon TEXT NOT NULL,
      text TEXT NOT NULL
    )`);
    // Ajustes del sitio que Jimena cambia desde el panel (por ejemplo, el cartel de disponibilidad del inicio)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS brief_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      field TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created TEXT NOT NULL
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS brief_chunks (
      file INTEGER NOT NULL,
      idx INTEGER NOT NULL,
      data BLOB NOT NULL,
      PRIMARY KEY (file, idx)
    )`);
    // ---- Fichas de cliente (una por persona). La clave técnica es id; el código JNB-CLI-0001 sale del id y no cambia nunca
    // (AUTOINCREMENT no reutiliza números, aunque se una o se borre una ficha). El mail se guarda normalizado y no se repite.
    this.sql.exec(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL
    )`);
    // Cada pedido y cada proyecto apunta a su cliente; los datos personales viven solo en clients
    const crmInquiryColumns = this.sql.exec('PRAGMA table_info(inquiries)').toArray().map((c) => c.name);
    if (!crmInquiryColumns.includes('client_id')) this.sql.exec('ALTER TABLE inquiries ADD COLUMN client_id INTEGER REFERENCES clients(id)');
    // Consultas nuevas (sin ver): las que ya existían cuentan como vistas
    if (!crmInquiryColumns.includes('seen')) this.sql.exec('ALTER TABLE inquiries ADD COLUMN seen INTEGER NOT NULL DEFAULT 1');
    const crmProjectColumns = this.sql.exec('PRAGMA table_info(projects)').toArray().map((c) => c.name);
    if (!crmProjectColumns.includes('client_id')) this.sql.exec('ALTER TABLE projects ADD COLUMN client_id INTEGER REFERENCES clients(id)');
    // Código del proyecto (JNB-PRY-0001): distinto del código del cliente y del número de solicitud JNB-AAMM-XXXX
    if (!crmProjectColumns.includes('code')) this.sql.exec('ALTER TABLE projects ADD COLUMN code TEXT');
    this.sql.exec('CREATE UNIQUE INDEX IF NOT EXISTS projects_code ON projects(code)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS inquiries_client ON inquiries(client_id)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS projects_client ON projects(client_id)');
    // Pagos de cada proyecto (los carga Jimena a mano: anticipo, saldo, cuotas). Sin fecha de pago = pendiente.
    this.sql.exec(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL REFERENCES projects(token),
      concept TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount INTEGER NOT NULL,
      due TEXT NOT NULL DEFAULT '',
      paid TEXT NOT NULL DEFAULT '',
      method TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL
    )`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS payments_project ON payments(project)');
    // Gestor de tareas de Jimena (tablero tipo Kanban). Las subtareas van como JSON: [{ "text": "...", "done": false }]
    this.sql.exec(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category INTEGER,
      priority TEXT NOT NULL DEFAULT 'media',
      status TEXT NOT NULL DEFAULT 'inbox',
      position REAL NOT NULL DEFAULT 0,
      due TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      subtasks TEXT NOT NULL DEFAULT '[]',
      archived INTEGER NOT NULL DEFAULT 0,
      created TEXT NOT NULL,
      updated TEXT NOT NULL,
      done_at TEXT NOT NULL DEFAULT ''
    )`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS tasks_status ON tasks(archived, status, position)');
    this.sql.exec(`CREATE TABLE IF NOT EXISTS task_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    )`);
    if (!this.sql.exec('SELECT 1 FROM task_categories LIMIT 1').toArray().length && !this.sql.exec("SELECT 1 FROM settings WHERE key = 'tareasCategorias'").toArray().length) {
      ['Desarrollo web', 'Diseño', 'Marketing y redes sociales', 'SEO', 'Clientes y presupuestos', 'Administración', 'Ideas y proyectos', 'Estudio y formación']
        .forEach((name, i) => this.sql.exec('INSERT INTO task_categories (name, position) VALUES (?, ?)', name, i));
      this.sql.exec("INSERT INTO settings (key, value) VALUES ('tareasCategorias', '1')");
    }
    // ---- Sorteos de Instagram (módulo #sorteos del panel). Los ganadores se cargan a mano; nada se conecta con Instagram.
    // Un sorteo no se borra: se archiva. Etapas del ganador (0 a 11): anunciado, pendiente de contacto, contactado, brief enviado,
    // brief recibido, material pendiente, material recibido, diseño, revisión, correcciones, finalizado, premio entregado.
    this.sql.exec(`CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      post TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      starts TEXT NOT NULL DEFAULT '',
      ends TEXT NOT NULL DEFAULT '',
      prize TEXT NOT NULL DEFAULT '',
      conditions TEXT NOT NULL DEFAULT '',
      draw_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'borrador',
      archived INTEGER NOT NULL DEFAULT 0,
      created TEXT NOT NULL,
      updated TEXT NOT NULL
    )`);
    // Usuario de Instagram guardado sin @ y en minúsculas: un mismo usuario no gana dos veces el mismo sorteo
    this.sql.exec(`CREATE TABLE IF NOT EXISTS giveaway_winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      giveaway_id INTEGER NOT NULL REFERENCES giveaways(id),
      name TEXT NOT NULL,
      instagram TEXT NOT NULL,
      profile_url TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '',
      prize TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT '',
      announced TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      internal_notes TEXT NOT NULL DEFAULT '',
      stage INTEGER NOT NULL DEFAULT 0,
      stage_at TEXT NOT NULL DEFAULT '',
      contacted_at TEXT NOT NULL DEFAULT '',
      brief_link TEXT NOT NULL DEFAULT '',
      brief_sent_at TEXT NOT NULL DEFAULT '',
      brief_done_at TEXT NOT NULL DEFAULT '',
      materials_at TEXT NOT NULL DEFAULT '',
      delivered_at TEXT NOT NULL DEFAULT '',
      msg_congrats TEXT NOT NULL DEFAULT '',
      msg_brief TEXT NOT NULL DEFAULT '',
      next_task TEXT NOT NULL DEFAULT '',
      follow_up TEXT NOT NULL DEFAULT '',
      task_id INTEGER,
      client_id INTEGER REFERENCES clients(id),
      project_token TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL,
      updated TEXT NOT NULL,
      UNIQUE (giveaway_id, instagram)
    )`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS winners_giveaway ON giveaway_winners(giveaway_id)');
    this.sql.exec(`CREATE TABLE IF NOT EXISTS giveaway_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      winner_id INTEGER NOT NULL REFERENCES giveaway_winners(id),
      at TEXT NOT NULL,
      icon TEXT NOT NULL,
      text TEXT NOT NULL
    )`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS giveaway_events_winner ON giveaway_events(winner_id)');
    // Origen del proyecto ('' = comercial; 'sorteo-instagram' = premio: sin presupuesto, sin pagos y sin cupón al publicar)
    const giveawayProjectColumns = this.sql.exec('PRAGMA table_info(projects)').toArray().map((c) => c.name);
    if (!giveawayProjectColumns.includes('origin')) this.sql.exec("ALTER TABLE projects ADD COLUMN origin TEXT NOT NULL DEFAULT ''");
    if (!giveawayProjectColumns.includes('winner_id')) this.sql.exec('ALTER TABLE projects ADD COLUMN winner_id INTEGER');
    // Tareas creadas desde la ficha de un ganador: quedan vinculadas a él y a su proyecto (una tarea abierta por ganador)
    const giveawayTaskColumns = this.sql.exec('PRAGMA table_info(tasks)').toArray().map((c) => c.name);
    if (!giveawayTaskColumns.includes('winner_id')) this.sql.exec('ALTER TABLE tasks ADD COLUMN winner_id INTEGER');
    if (!giveawayTaskColumns.includes('project')) this.sql.exec("ALTER TABLE tasks ADD COLUMN project TEXT NOT NULL DEFAULT ''");
    // Fecha en que llegó todo el material del proyecto: desde ahí corre el plazo de entrega (se completa sola al pasar a Diseño)
    const agendaProjectColumns = this.sql.exec('PRAGMA table_info(projects)').toArray().map((c) => c.name);
    // Adicionales pedidos en un proyecto creado desde el panel (módulo Brief): el brief suma sus preguntas
    if (!agendaProjectColumns.includes('request')) this.sql.exec("ALTER TABLE projects ADD COLUMN request TEXT NOT NULL DEFAULT ''");
    if (!agendaProjectColumns.includes('materials_at')) this.sql.exec("ALTER TABLE projects ADD COLUMN materials_at TEXT NOT NULL DEFAULT ''");
    const agendaClientColumns = this.sql.exec('PRAGMA table_info(clients)').toArray().map((c) => c.name);
    if (!agendaClientColumns.includes('source')) this.sql.exec("ALTER TABLE clients ADD COLUMN source TEXT NOT NULL DEFAULT ''");
    // Lo que respondió el cliente en "¿Cómo me conociste?" del formulario de presupuesto
    const agendaInquiryColumns = this.sql.exec('PRAGMA table_info(inquiries)').toArray().map((c) => c.name);
    if (!agendaInquiryColumns.includes('sent_at')) this.sql.exec("ALTER TABLE inquiries ADD COLUMN sent_at TEXT NOT NULL DEFAULT ''");
    if (!agendaInquiryColumns.includes('followup_at')) this.sql.exec("ALTER TABLE inquiries ADD COLUMN followup_at TEXT NOT NULL DEFAULT ''");
    if (!agendaInquiryColumns.includes('source')) this.sql.exec("ALTER TABLE inquiries ADD COLUMN source TEXT NOT NULL DEFAULT ''");
    // Vencimientos de los clientes (dominio, soporte mensual, hosting...): los carga Jimena a mano
    this.sql.exec(`CREATE TABLE IF NOT EXISTS renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id),
      project TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'otro',
      label TEXT NOT NULL DEFAULT '',
      due TEXT NOT NULL,
      amount TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      done_at TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL
    )`);
    // Cotizador del panel: funcionalidades con precio y horas (el catálogo inicial se carga una sola vez)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS quote_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      ars INTEGER NOT NULL DEFAULT 0,
      usd INTEGER NOT NULL DEFAULT 0,
      hours REAL NOT NULL DEFAULT 0,
      created TEXT NOT NULL
    )`);
    if (!this.sql.exec("SELECT 1 FROM settings WHERE key = 'cotizadorSeed'").toArray().length) {
      const now = new Date().toISOString();
      for (const [name, description, cat, hours] of QUOTE_SEED) {
        const ars = quoteArs(hours, QUOTE_HOUR);
        this.sql.exec('INSERT INTO quote_features (name, description, category, ars, usd, hours, created) VALUES (?, ?, ?, ?, ?, ?, ?)',
          name, description, QUOTE_CATEGORIES[cat], ars, Math.round(ars / QUOTE_RATE), hours, now);
      }
      this.sql.exec("INSERT INTO settings (key, value) VALUES ('cotizadorSeed', '1')");
    }
    // Nombre y descripción en inglés y portugués (para propuestas a clientes en esos idiomas); se cargan una vez para el catálogo inicial
    const quoteColumns = this.sql.exec('PRAGMA table_info(quote_features)').toArray().map((c) => c.name);
    for (const col of ['name_en', 'name_pt', 'desc_en', 'desc_pt']) if (!quoteColumns.includes(col)) this.sql.exec(`ALTER TABLE quote_features ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`);
    if (!this.sql.exec("SELECT 1 FROM settings WHERE key = 'cotizadorTr'").toArray().length) {
      for (const [name, [ne, de, np, dp]] of Object.entries(QUOTE_SEED_TR)) {
        this.sql.exec("UPDATE quote_features SET name_en = ?, desc_en = ?, name_pt = ?, desc_pt = ? WHERE name = ? AND name_en = ''", ne, de, np, dp, name);
      }
      this.sql.exec("INSERT INTO settings (key, value) VALUES ('cotizadorTr', '1')");
    }
    this.linkClients();
  }

  // ---- Clientes
  // Asocia los pedidos y proyectos que todavía no tienen cliente (los que ya existían antes de las fichas).
  // Se recorre todo por fecha, así JNB-CLI-0001 es el cliente más antiguo. Se puede correr las veces que sea: solo toca lo que falta.
  linkClients() {
    const pending = [
      ...this.sql.exec('SELECT code AS ref, created, name, email FROM inquiries WHERE client_id IS NULL').toArray().map((r) => ({ ...r, type: 'inquiry' })),
      ...this.sql.exec('SELECT token AS ref, created, client AS name, quote FROM projects WHERE client_id IS NULL').toArray().map((r) => ({ ...r, type: 'project' })),
    ].sort((a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : (a.type === 'inquiry' ? -1 : 1)));
    const noCode = this.sql.exec('SELECT token FROM projects WHERE code IS NULL ORDER BY created').toArray();
    if (!pending.length && !noCode.length) return;
    this.ctx.storage.transactionSync(() => {
      for (const row of pending) {
        if (row.type === 'inquiry') {
          this.sql.exec('UPDATE inquiries SET client_id = ? WHERE code = ?', this.clientFor(row.email, row.name, row.created), row.ref);
          continue;
        }
        let id = null;
        if (row.quote) {
          const quote = this.sql.exec('SELECT client_id, email, name, created FROM inquiries WHERE token = ?', row.quote).toArray()[0];
          if (quote) id = quote.client_id || this.clientFor(quote.email, quote.name, quote.created);
        }
        // Proyecto creado a mano (o cuyo pedido ya no está): el mail que puso en el brief, si lo hay
        if (!id) id = this.clientFor(this.briefEmail(row.quote || row.ref), row.name, row.created);
        this.sql.exec('UPDATE projects SET client_id = ? WHERE token = ?', id, row.ref);
      }
      for (const row of noCode) this.sql.exec('UPDATE projects SET code = ? WHERE token = ?', this.nextProjectCode(), row.token);
    });
  }

  briefEmail(token) {
    const brief = token ? this.sql.exec('SELECT answers FROM briefs WHERE token = ?', token).toArray()[0] : null;
    if (!brief) return '';
    try { return normEmail(JSON.parse(brief.answers).email); } catch { return ''; }
  }

  // El cliente de ese mail (normalizado) o, si no hay, una ficha nueva. Sin mail siempre es una ficha nueva:
  // nunca se une a nadie por el nombre (si coincide, aparece en "Posibles duplicados" para que Jimena decida).
  clientFor(email, name, created = new Date().toISOString()) {
    const mail = normEmail(email);
    if (mail) {
      const row = this.sql.exec('SELECT id FROM clients WHERE email = ?', mail).toArray()[0];
      if (row) return row.id;
    }
    this.sql.exec('INSERT INTO clients (name, email, created) VALUES (?, ?, ?)', oneLine(name, 100) || 'Sin nombre', mail || null, created);
    const id = this.sql.exec('SELECT last_insert_rowid() AS id').one().id;
    this.sql.exec('UPDATE clients SET code = ? WHERE id = ?', clientCode(id), id);
    return id;
  }

  clientExists(id) {
    return Boolean(this.sql.exec('SELECT 1 FROM clients WHERE id = ?', id).toArray().length);
  }

  addClient(data) {
    const mail = normEmail(data.email);
    if (mail && this.sql.exec('SELECT 1 FROM clients WHERE email = ?', mail).toArray().length) return { error: 'email' };
    const id = this.clientFor(mail, data.name);
    this.sql.exec('UPDATE clients SET phone = ?, note = ? WHERE id = ?', data.phone || '', data.note || '', id);
    return { id, code: clientCode(id) };
  }

  setClient(id, data) {
    if (!this.clientExists(id)) return { error: 'not found' };
    const mail = normEmail(data.email);
    if (mail && this.sql.exec('SELECT 1 FROM clients WHERE email = ? AND id != ?', mail, id).toArray().length) return { error: 'email' };
    this.sql.exec('UPDATE clients SET name = ?, email = ?, phone = ?, status = ?, note = ? WHERE id = ?',
      data.name, mail || null, data.phone, data.status, data.note, id);
    return { ok: true };
  }

  // Unir dos fichas (solo cuando Jimena lo confirma): todo pasa a "into" y la ficha "from" deja de existir.
  // El código de "from" no se vuelve a usar.
  mergeClients(from, into) {
    if (from === into || !this.clientExists(from) || !this.clientExists(into)) return false;
    this.ctx.storage.transactionSync(() => {
      const source = this.sql.exec('SELECT code, email, phone, note FROM clients WHERE id = ?', from).one();
      const target = this.sql.exec('SELECT email, phone, note FROM clients WHERE id = ?', into).one();
      this.sql.exec('UPDATE inquiries SET client_id = ? WHERE client_id = ?', into, from);
      this.sql.exec('UPDATE projects SET client_id = ? WHERE client_id = ?', into, from);
      this.sql.exec('UPDATE giveaway_winners SET client_id = ? WHERE client_id = ?', into, from);
      this.sql.exec('UPDATE renewals SET client_id = ? WHERE client_id = ?', into, from);
      this.sql.exec('DELETE FROM clients WHERE id = ?', from);
      const note = [target.note, source.note].filter(Boolean).join('\n');
      this.sql.exec('UPDATE clients SET email = ?, phone = ?, note = ? WHERE id = ?',
        target.email || source.email || null, target.phone || source.phone, note, into);
      const merged = `Se unió la ficha ${source.code}${source.email && source.email !== target.email ? ` (${source.email})` : ''}`;
      for (const p of this.sql.exec('SELECT token FROM projects WHERE client_id = ?', into).toArray()) this.logEvent(p.token, '🔗', merged);
    });
    return true;
  }

  // Pares que Jimena marcó como "no son la misma persona"
  notDuplicates() {
    const row = this.sql.exec("SELECT value FROM settings WHERE key = 'noDuplicados'").toArray()[0];
    return row ? JSON.parse(row.value) : [];
  }

  dismissDuplicate(a, b) {
    const pair = [a, b].sort((x, y) => x - y).join('-');
    const list = [...new Set([...this.notDuplicates(), pair])];
    this.sql.exec(`INSERT INTO settings (key, value) VALUES ('noDuplicados', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`, JSON.stringify(list));
  }

  // Archivos de todos los briefs de un cliente (sin marcar el brief como visto)
  clientFiles(id) {
    return this.sql.exec(`SELECT f.id, f.name, f.size, f.created, p.code AS projectCode, p.project
      FROM brief_files f JOIN projects p ON f.token = (CASE WHEN p.quote != '' THEN p.quote ELSE p.token END)
      WHERE p.client_id = ? ORDER BY f.created DESC`, id).toArray();
  }

  nextProjectCode() {
    const row = this.sql.exec("SELECT value FROM settings WHERE key = 'seqProyecto'").toArray()[0];
    const n = (row ? Number(row.value) : 0) + 1;
    this.sql.exec(`INSERT INTO settings (key, value) VALUES ('seqProyecto', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`, String(n));
    return `JNB-PRY-${String(n).padStart(4, '0')}`;
  }

  // ---- Pagos
  addPayment(data) {
    if (!this.sql.exec('SELECT 1 FROM projects WHERE token = ?', data.project).toArray().length) return false;
    this.sql.exec('INSERT INTO payments (project, concept, currency, amount, due, paid, method, note, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      data.project, data.concept, data.currency, data.amount, data.due, data.paid, data.method, data.note, new Date().toISOString());
    this.logEvent(data.project, '💳', `${data.paid ? 'Pago registrado' : 'Pago pendiente'}: ${data.concept} · ${data.currency} ${data.amount.toLocaleString('es-AR')}`);
    return true;
  }

  setPayment(id, data) {
    const row = this.sql.exec('SELECT project, concept, paid FROM payments WHERE id = ?', id).toArray()[0];
    if (!row) return false;
    if (data.remove) {
      this.sql.exec('DELETE FROM payments WHERE id = ?', id);
      this.logEvent(row.project, '🗑️', `Se borró el pago: ${row.concept}`);
      return true;
    }
    this.sql.exec('UPDATE payments SET concept = ?, currency = ?, amount = ?, due = ?, paid = ?, method = ?, note = ? WHERE id = ?',
      data.concept, data.currency, data.amount, data.due, data.paid, data.method, data.note, id);
    if (data.paid && !row.paid) this.logEvent(row.project, '💳', `Pagó: ${data.concept} · ${data.currency} ${data.amount.toLocaleString('es-AR')}`);
    return true;
  }

  // ---- Gestor de tareas
  tasksData() {
    return {
      categories: this.sql.exec('SELECT id, name, position FROM task_categories ORDER BY position, id').toArray(),
      tasks: this.sql.exec('SELECT * FROM tasks ORDER BY archived, status, position, id').toArray()
        .map((t) => ({ ...t, subtasks: JSON.parse(t.subtasks || '[]'), archived: Boolean(t.archived) })),
    };
  }

  // Crea o actualiza una tarea. Al crear, va al final de su columna.
  saveTask(t) {
    const now = new Date().toISOString();
    const category = t.category && this.sql.exec('SELECT 1 FROM task_categories WHERE id = ?', t.category).toArray().length ? t.category : null;
    const subtasks = JSON.stringify(t.subtasks);
    if (t.id) {
      const old = this.sql.exec('SELECT status, done_at FROM tasks WHERE id = ?', t.id).toArray()[0];
      if (!old) return false;
      const doneAt = t.status === 'done' ? (old.status === 'done' ? old.done_at : now) : '';
      this.sql.exec(`UPDATE tasks SET title = ?, description = ?, category = ?, priority = ?, status = ?, due = ?, notes = ?, subtasks = ?,
        updated = ?, done_at = ? WHERE id = ?`, t.title, t.description, category, t.priority, t.status, t.due, t.notes, subtasks, now, doneAt, t.id);
      if (old.status !== t.status) this.sql.exec('UPDATE tasks SET position = ? WHERE id = ?', this.lastTaskPosition(t.status) + 1, t.id);
      return true;
    }
    this.sql.exec(`INSERT INTO tasks (title, description, category, priority, status, position, due, notes, subtasks, created, updated, done_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, t.title, t.description, category, t.priority, t.status,
    this.lastTaskPosition(t.status) + 1, t.due, t.notes, subtasks, now, now, t.status === 'done' ? now : '');
    return true;
  }

  lastTaskPosition(status) {
    return this.sql.exec('SELECT COALESCE(MAX(position), 0) AS p FROM tasks WHERE status = ? AND archived = 0', status).one().p;
  }

  // Arrastrar y soltar: la tarea pasa a otra columna (o a otro lugar de la misma) y se reordena esa columna
  moveTask(id, status, order) {
    const row = this.sql.exec('SELECT status, done_at FROM tasks WHERE id = ?', id).toArray()[0];
    if (!row) return false;
    const now = new Date().toISOString();
    this.ctx.storage.transactionSync(() => {
      const doneAt = status === 'done' ? (row.status === 'done' ? row.done_at : now) : '';
      this.sql.exec('UPDATE tasks SET status = ?, done_at = ?, updated = ? WHERE id = ?', status, doneAt, now, id);
      order.forEach((taskId, i) => this.sql.exec('UPDATE tasks SET position = ? WHERE id = ? AND status = ?', i + 1, taskId, status));
    });
    return true;
  }

  duplicateTask(id) {
    const t = this.sql.exec('SELECT * FROM tasks WHERE id = ?', id).toArray()[0];
    if (!t) return false;
    const subtasks = JSON.parse(t.subtasks || '[]').map((s) => ({ text: s.text, done: false }));
    return this.saveTask({ ...t, id: 0, title: `${t.title} (copia)`.slice(0, 160), status: t.status === 'done' ? 'todo' : t.status, subtasks });
  }

  archiveTasks(ids, archived) {
    for (const id of ids) this.sql.exec('UPDATE tasks SET archived = ?, updated = ? WHERE id = ?', archived ? 1 : 0, new Date().toISOString(), id);
    return true;
  }

  deleteTask(id) {
    this.sql.exec('DELETE FROM tasks WHERE id = ?', id);
    this.sql.exec('UPDATE giveaway_winners SET task_id = NULL WHERE task_id = ?', id);
    return true;
  }

  // Categorías: la lista completa en el orden elegido. Las que se quitan dejan sus tareas "sin categoría".
  saveTaskCategories(list) {
    this.ctx.storage.transactionSync(() => {
      const keep = list.filter((c) => c.id).map((c) => c.id);
      const current = this.sql.exec('SELECT id FROM task_categories').toArray().map((r) => r.id);
      for (const id of current.filter((x) => !keep.includes(x))) {
        this.sql.exec('UPDATE tasks SET category = NULL WHERE category = ?', id);
        this.sql.exec('DELETE FROM task_categories WHERE id = ?', id);
      }
      list.forEach((c, i) => {
        if (c.id && current.includes(c.id)) this.sql.exec('UPDATE task_categories SET name = ?, position = ? WHERE id = ?', c.name, i, c.id);
        else this.sql.exec('INSERT INTO task_categories (name, position) VALUES (?, ?)', c.name, i);
      });
    });
    return true;
  }

  // ---- Consultas nuevas
  // ---- Sorteos de Instagram. Nada se borra: los sorteos se archivan y el historial de cada ganador solo suma registros.
  logWinner(id, icon, text) {
    this.sql.exec('INSERT INTO giveaway_events (winner_id, at, icon, text) VALUES (?, ?, ?, ?)', id, new Date().toISOString(), icon, text);
  }

  saveGiveaway(g) {
    const now = new Date().toISOString();
    if (g.id) {
      if (!this.sql.exec('SELECT 1 FROM giveaways WHERE id = ?', g.id).toArray().length) return { error: 'not found' };
      this.sql.exec(`UPDATE giveaways SET name = ?, post = ?, url = ?, starts = ?, ends = ?, prize = ?, conditions = ?, draw_date = ?, status = ?, updated = ? WHERE id = ?`,
        g.name, g.post, g.url, g.starts, g.ends, g.prize, g.conditions, g.drawDate, g.status, now, g.id);
      return { id: g.id };
    }
    this.sql.exec(`INSERT INTO giveaways (name, post, url, starts, ends, prize, conditions, draw_date, status, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      g.name, g.post, g.url, g.starts, g.ends, g.prize, g.conditions, g.drawDate, g.status, now, now);
    return { id: this.sql.exec('SELECT last_insert_rowid() AS id').one().id };
  }

  // Archivar (o volver a mostrar) solo cambia la marca: ganadores, proyectos e historial quedan como están
  archiveGiveaway(id, archived) {
    if (!this.sql.exec('SELECT 1 FROM giveaways WHERE id = ?', id).toArray().length) return { error: 'not found' };
    this.sql.exec('UPDATE giveaways SET archived = ?, updated = ? WHERE id = ?', archived ? 1 : 0, new Date().toISOString(), id);
    return { id };
  }

  // Alta o edición de los datos de un ganador (la etapa se cambia aparte, con su fecha e historial)
  saveWinner(w) {
    const now = new Date().toISOString();
    if (!this.sql.exec('SELECT 1 FROM giveaways WHERE id = ?', w.giveawayId).toArray().length) return { error: 'giveaway' };
    if (this.sql.exec('SELECT 1 FROM giveaway_winners WHERE giveaway_id = ? AND instagram = ? AND id != ?', w.giveawayId, w.instagram, w.id || 0).toArray().length) return { error: 'duplicate' };
    if (w.id) {
      const old = this.sql.exec('SELECT giveaway_id FROM giveaway_winners WHERE id = ?', w.id).toArray()[0];
      if (!old) return { error: 'not found' };
      this.sql.exec(`UPDATE giveaway_winners SET giveaway_id = ?, name = ?, instagram = ?, profile_url = ?, email = ?, whatsapp = ?, prize = ?, plan = ?, announced = ?, note = ?, updated = ? WHERE id = ?`,
        w.giveawayId, w.name, w.instagram, w.profileUrl, w.email, w.whatsapp, w.prize, w.plan, w.announced, w.note, now, w.id);
      this.logWinner(w.id, '✏️', 'Datos del ganador actualizados');
      return { id: w.id };
    }
    this.sql.exec(`INSERT INTO giveaway_winners (giveaway_id, name, instagram, profile_url, email, whatsapp, prize, plan, announced, note, stage, stage_at, created, updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    w.giveawayId, w.name, w.instagram, w.profileUrl, w.email, w.whatsapp, w.prize, w.plan, w.announced, w.note, now, now, now);
    const id = this.sql.exec('SELECT last_insert_rowid() AS id').one().id;
    this.logWinner(id, '🏆', `Ganador anunciado: ${w.prize || 'premio sin cargar'}`);
    return { id };
  }

  // Cambio de etapa: guarda la fecha y, la primera vez que llega a ciertas etapas, la fecha de ese paso
  setWinnerStage(id, stage) {
    const old = this.sql.exec('SELECT stage FROM giveaway_winners WHERE id = ?', id).toArray()[0];
    if (!old) return { error: 'not found' };
    if (old.stage === stage) return { id };
    const now = new Date().toISOString();
    this.sql.exec('UPDATE giveaway_winners SET stage = ?, stage_at = ?, updated = ? WHERE id = ?', stage, now, now, id);
    const mark = WINNER_STAGE_DATES[stage];
    if (mark) this.sql.exec(`UPDATE giveaway_winners SET ${mark} = ? WHERE id = ? AND ${mark} = ''`, now, id);
    this.logWinner(id, '📍', `Etapa: ${WINNER_STAGES[stage]}`);
    return { id };
  }

  // Seguimiento: notas internas, próxima tarea, fecha de seguimiento, mensajes editados y link del brief
  trackWinner(id, t) {
    const old = this.sql.exec('SELECT next_task, follow_up, brief_link FROM giveaway_winners WHERE id = ?', id).toArray()[0];
    if (!old) return { error: 'not found' };
    this.sql.exec(`UPDATE giveaway_winners SET internal_notes = ?, next_task = ?, follow_up = ?, msg_congrats = ?, msg_brief = ?, brief_link = ?, updated = ? WHERE id = ?`,
      t.internalNotes, t.nextTask, t.followUp, t.msgCongrats, t.msgBrief, t.briefLink || old.brief_link, new Date().toISOString(), id);
    if (t.nextTask && (t.nextTask !== old.next_task || t.followUp !== old.follow_up)) {
      this.logWinner(id, '🗓️', `Próxima tarea: ${t.nextTask}${t.followUp ? ` (${t.followUp})` : ''}`);
      // Si ya tiene una tarea abierta en el Gestor, se actualiza con la nueva próxima tarea y fecha
      const w = this.winnerRow(id);
      if (w.task_id && this.sql.exec("SELECT 1 FROM tasks WHERE id = ? AND archived = 0 AND status != 'done'", w.task_id).toArray().length) this.winnerTask(id);
    }
    return { id };
  }

  // Registrar a mano la fecha de un paso (contacto, brief enviado, completado, materiales, premio entregado)
  markWinner(id, field, date) {
    if (!WINNER_MARKS[field]) return { error: 'field' };
    if (!this.sql.exec('SELECT 1 FROM giveaway_winners WHERE id = ?', id).toArray().length) return { error: 'not found' };
    this.sql.exec(`UPDATE giveaway_winners SET ${field} = ?, updated = ? WHERE id = ?`, date, new Date().toISOString(), id);
    this.logWinner(id, '✅', date ? `${WINNER_MARKS[field]}: ${date.slice(0, 10)}` : `${WINNER_MARKS[field]}: fecha quitada`);
    return { id };
  }

  // ---- Agenda: vencimientos y fecha de material completo
  saveRenewal(r) {
    if (r.clientId && !this.clientExists(r.clientId)) return { error: 'client' };
    if (r.project && !this.sql.exec('SELECT 1 FROM projects WHERE token = ?', r.project).toArray().length) return { error: 'project' };
    if (r.id) {
      if (!this.sql.exec('SELECT 1 FROM renewals WHERE id = ?', r.id).toArray().length) return { error: 'not found' };
      this.sql.exec('UPDATE renewals SET client_id = ?, project = ?, kind = ?, label = ?, due = ?, amount = ?, note = ? WHERE id = ?',
        r.clientId || null, r.project, r.kind, r.label, r.due, r.amount, r.note, r.id);
      return { id: r.id };
    }
    this.sql.exec('INSERT INTO renewals (client_id, project, kind, label, due, amount, note, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      r.clientId || null, r.project, r.kind, r.label, r.due, r.amount, r.note, new Date().toISOString());
    return { id: this.sql.exec('SELECT last_insert_rowid() AS id').one().id };
  }

  renewalDone(id, done) {
    if (!this.sql.exec('SELECT 1 FROM renewals WHERE id = ?', id).toArray().length) return { error: 'not found' };
    this.sql.exec('UPDATE renewals SET done_at = ? WHERE id = ?', done ? arToday() : '', id);
    return { id };
  }

  deleteRenewal(id) {
    if (!this.sql.exec('SELECT 1 FROM renewals WHERE id = ?', id).toArray().length) return { error: 'not found' };
    this.sql.exec('DELETE FROM renewals WHERE id = ?', id);
    return { id };
  }

  setMaterials(token, date) {
    if (!this.sql.exec('SELECT 1 FROM projects WHERE token = ?', token).toArray().length) return { error: 'not found' };
    this.sql.exec('UPDATE projects SET materials_at = ? WHERE token = ?', date, token);
    this.logEvent(token, '📦', date ? `Material completo recibido: ${date}` : 'Se quitó la fecha de material completo');
    return { ok: true };
  }

  // "Ya le escribí" en un presupuesto sin respuesta: el aviso vuelve a contar desde hoy
  quoteFollowup(token) {
    if (!this.sql.exec("SELECT 1 FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray().length) return { error: 'not found' };
    this.sql.exec('UPDATE inquiries SET followup_at = ? WHERE token = ?', new Date().toISOString(), token);
    this.logQuoteEvent(token, '💬', 'Le escribiste para hacer seguimiento del presupuesto');
    return { ok: true };
  }

  // Copia de seguridad semanal por mail: cuándo salió la última
  backupMailedAt() {
    const row = this.sql.exec("SELECT value FROM settings WHERE key = 'copiaMail'").toArray()[0];
    return row ? row.value : '';
  }

  markBackupMailed() {
    this.sql.exec("INSERT INTO settings (key, value) VALUES ('copiaMail', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", new Date().toISOString());
  }

  setClientSource(id, source) {
    if (!this.clientExists(id)) return { error: 'not found' };
    this.sql.exec('UPDATE clients SET source = ? WHERE id = ?', source, id);
    return { ok: true };
  }

  // Tope anual de la categoría del monotributo (en pesos) y cotización del dólar para sumar los cobros en USD
  monotributo() {
    const row = this.sql.exec("SELECT value FROM settings WHERE key = 'monotributo'").toArray()[0];
    try { return { desde: '2026-12', ...(row ? JSON.parse(row.value) : { tope: 0, cotizacion: 0 }) }; } catch { return { tope: 0, cotizacion: 0, desde: '2026-12' }; }
  }

  setMonotributo(tope, cotizacion, desde = '2026-12') {
    this.sql.exec("INSERT INTO settings (key, value) VALUES ('monotributo', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", JSON.stringify({ tope, cotizacion, desde }));
    return { ok: true };
  }

  // ---- Cotizador
  cotizadorData() {
    const get = (key, fallback) => { const row = this.sql.exec('SELECT value FROM settings WHERE key = ?', key).toArray()[0]; return row ? Number(row.value) : fallback; };
    return { rate: get('cotizadorDolar', QUOTE_RATE), hour: get('cotizadorHora', QUOTE_HOUR), categories: QUOTE_CATEGORIES,
      features: this.sql.exec('SELECT id, name, description, category, ars, usd, hours, name_en AS nameEn, desc_en AS descEn, name_pt AS namePt, desc_pt AS descPt FROM quote_features ORDER BY category, name').toArray() };
  }

  saveFeature(f) {
    const { rate, hour } = this.cotizadorData();
    f.ars = quoteArs(f.hours, hour);
    f.usd = Math.round(f.ars / rate);
    if (f.id) {
      if (!this.sql.exec('SELECT 1 FROM quote_features WHERE id = ?', f.id).toArray().length) return { error: 'not found' };
      this.sql.exec('UPDATE quote_features SET name = ?, description = ?, category = ?, ars = ?, usd = ?, hours = ?, name_en = ?, desc_en = ?, name_pt = ?, desc_pt = ? WHERE id = ?', f.name, f.description, f.category, f.ars, f.usd, f.hours, f.nameEn, f.descEn, f.namePt, f.descPt, f.id);
      return { id: f.id };
    }
    if (this.sql.exec('SELECT 1 FROM quote_features WHERE lower(name) = lower(?)', f.name).toArray().length) return { error: 'duplicate' };
    this.sql.exec('INSERT INTO quote_features (name, description, category, ars, usd, hours, name_en, desc_en, name_pt, desc_pt, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', f.name, f.description, f.category, f.ars, f.usd, f.hours, f.nameEn, f.descEn, f.namePt, f.descPt, new Date().toISOString());
    return { id: this.sql.exec('SELECT last_insert_rowid() AS id').one().id };
  }

  deleteFeature(id) {
    if (!this.sql.exec('SELECT 1 FROM quote_features WHERE id = ?', id).toArray().length) return { error: 'not found' };
    this.sql.exec('DELETE FROM quote_features WHERE id = ?', id);
    return { id };
  }

  // Cotización del dólar y valor de la hora: al cambiarlos se recalculan los precios de todo el catálogo
  setQuoteRate(rate, hour) {
    for (const [key, value] of [['cotizadorDolar', rate], ['cotizadorHora', hour]]) {
      this.sql.exec('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value', key, String(value));
    }
    for (const row of this.sql.exec('SELECT id, hours FROM quote_features').toArray()) {
      const ars = quoteArs(row.hours, hour);
      this.sql.exec('UPDATE quote_features SET ars = ?, usd = ? WHERE id = ?', ars, Math.round(ars / rate), row.id);
    }
    return { ok: true };
  }

  // Datos para mandar el link del brief de un proyecto (mail y nombre salen de la ficha del cliente)
  projectInvite(token) {
    const row = this.sql.exec('SELECT p.lang, p.client, c.email, c.name FROM projects p LEFT JOIN clients c ON c.id = p.client_id WHERE p.token = ?', token).toArray()[0];
    return row ? { lang: row.lang, email: row.email || '', name: (row.name || row.client || '').split(' ')[0] } : null;
  }

  logInvite(token) {
    this.logEvent(token, '📧', 'Le mandaste por mail el link para completar su brief');
  }

  winnerRow(id) {
    return this.sql.exec('SELECT w.*, g.name AS giveaway_name FROM giveaway_winners w JOIN giveaways g ON g.id = w.giveaway_id WHERE w.id = ?', id).toArray()[0];
  }

  // Pasar el ganador a Clientes: si su mail ya tiene ficha, se usa esa (clientFor); nunca se crea dos veces para el mismo ganador
  winnerToClient(id) {
    const w = this.winnerRow(id);
    if (!w) return { error: 'not found' };
    if (w.client_id && this.clientExists(w.client_id)) return { id, clientId: w.client_id };
    const mail = normEmail(w.email);
    const existed = mail ? this.sql.exec('SELECT id FROM clients WHERE email = ?', mail).toArray()[0] : null;
    const clientId = this.clientFor(mail, w.name);
    if (w.whatsapp) this.sql.exec("UPDATE clients SET phone = ? WHERE id = ? AND phone = ''", w.whatsapp, clientId);
    if (!existed) this.sql.exec("UPDATE clients SET source = 'sorteo' WHERE id = ? AND source = ''", clientId);
    if (!existed) this.sql.exec("UPDATE clients SET note = ? WHERE id = ? AND note = ''", `Ganador del sorteo "${w.giveaway_name}" (@${w.instagram})`, clientId);
    this.sql.exec('UPDATE giveaway_winners SET client_id = ?, updated = ? WHERE id = ?', clientId, new Date().toISOString(), id);
    this.logWinner(id, '👤', `${existed ? 'Vinculado con la ficha que ya existía' : 'Ficha de cliente creada'}: ${clientCode(clientId)}`);
    return { id, clientId };
  }

  // Proyecto del premio (origen sorteo-instagram): sin presupuesto ni pagos; el brief es el del sitio, con el link del proyecto
  winnerProject(id) {
    const w = this.winnerRow(id);
    if (!w) return { error: 'not found' };
    if (w.project_token && this.sql.exec('SELECT 1 FROM projects WHERE token = ?', w.project_token).toArray().length) return { id, token: w.project_token };
    if (!WINNER_PROJECTS[w.plan]) return { error: 'plan' };
    const { clientId } = this.winnerToClient(id);
    const token = this.addProject({ client: w.name.split(' ')[0], project: `${WINNER_PROJECTS[w.plan]} · Premio de sorteo`, lang: 'es', due: '', clientId });
    this.sql.exec("UPDATE projects SET origin = 'sorteo-instagram', winner_id = ? WHERE token = ?", id, token);
    this.logEvent(token, '🎁', `ORIGEN: SORTEO DE INSTAGRAM · "${w.giveaway_name}" (@${w.instagram})`);
    const code = this.sql.exec('SELECT code FROM projects WHERE token = ?', token).one().code;
    this.sql.exec('UPDATE giveaway_winners SET project_token = ?, brief_link = ?, updated = ? WHERE id = ?', token, `${projectLink('es', token)}#brief`, new Date().toISOString(), id);
    if (w.task_id) this.sql.exec('UPDATE tasks SET project = ? WHERE id = ?', token, w.task_id);
    this.logWinner(id, '📁', `Proyecto creado: ${code} (link del brief guardado)`);
    return { id, token };
  }

  // Próxima tarea → Gestor de tareas. Una sola tarea abierta por ganador: si ya existe, se actualiza
  winnerTask(id) {
    const w = this.winnerRow(id);
    if (!w) return { error: 'not found' };
    if (!w.next_task) return { error: 'next' };
    const now = new Date().toISOString();
    const title = `${w.next_task} · ${w.name}`.slice(0, 160);
    const open = w.task_id ? this.sql.exec("SELECT id FROM tasks WHERE id = ? AND archived = 0 AND status != 'done'", w.task_id).toArray()[0] : null;
    if (open) {
      this.sql.exec('UPDATE tasks SET title = ?, due = ?, project = ?, winner_id = ?, updated = ? WHERE id = ?', title, w.follow_up, w.project_token, id, now, open.id);
      this.logWinner(id, '🗂️', 'Tarea del Gestor actualizada');
      return { id, taskId: open.id, updated: true };
    }
    const category = this.sql.exec("SELECT id FROM task_categories WHERE name = 'Clientes y presupuestos'").toArray()[0];
    this.saveTask({ id: 0, title, description: `Ganador del sorteo "${w.giveaway_name}" (@${w.instagram}). Ficha en el panel: Sorteos.`,
      category: category ? category.id : null, priority: 'media', status: 'todo', due: w.follow_up, notes: '', subtasks: [] });
    const taskId = this.sql.exec('SELECT last_insert_rowid() AS id').one().id;
    this.sql.exec('UPDATE tasks SET winner_id = ?, project = ? WHERE id = ?', id, w.project_token, taskId);
    this.sql.exec('UPDATE giveaway_winners SET task_id = ?, updated = ? WHERE id = ?', taskId, now, id);
    this.logWinner(id, '🗂️', 'Tarea creada en el Gestor de tareas');
    return { id, taskId };
  }

  giveawaysData() {
    return {
      stages: WINNER_STAGES,
      giveaways: this.sql.exec(`SELECT g.*, (SELECT COUNT(*) FROM giveaway_winners w WHERE w.giveaway_id = g.id) AS winnerCount
        FROM giveaways g ORDER BY g.archived, g.created DESC`).toArray(),
      winners: this.sql.exec(`SELECT w.*, g.name AS giveaway_name, c.code AS client_code, p.code AS project_code, p.stage AS project_stage,
        t.status AS task_status, t.archived AS task_archived
        FROM giveaway_winners w JOIN giveaways g ON g.id = w.giveaway_id
        LEFT JOIN clients c ON c.id = w.client_id
        LEFT JOIN projects p ON p.token = w.project_token AND w.project_token != ''
        LEFT JOIN tasks t ON t.id = w.task_id
        ORDER BY w.created DESC`).toArray(),
      events: this.sql.exec('SELECT winner_id, at, icon, text FROM giveaway_events ORDER BY at DESC, id DESC LIMIT 3000').toArray(),
    };
  }

  markSeen(codes) {
    if (codes === 'all') this.sql.exec('UPDATE inquiries SET seen = 1 WHERE seen = 0');
    else for (const code of codes) this.sql.exec('UPDATE inquiries SET seen = 1 WHERE code = ?', code);
  }

  // ---- Reiniciar en cero (lo pide Jimena desde Configuración, escribiendo REINICIAR): borra clientes, pedidos, proyectos,
  // briefs y archivos, pagos, cupones, reseñas e historial, y los códigos vuelven a empezar. Quedan el cartel y el horario.
  resetAll() {
    this.ctx.storage.transactionSync(() => {
      for (const table of ['renewals', 'giveaway_events', 'giveaway_winners', 'giveaways', 'brief_chunks', 'brief_files', 'briefs', 'payments', 'project_events', 'coupons', 'reviews', 'invitations', 'projects', 'inquiries', 'clients']) {
        this.sql.exec(`DELETE FROM ${table}`);
      }
      // Las tareas no se borran, pero dejan de apuntar a ganadores y proyectos que ya no existen
      this.sql.exec("UPDATE tasks SET winner_id = NULL, project = '' WHERE winner_id IS NOT NULL OR project != ''");
      this.sql.exec("DELETE FROM settings WHERE key IN ('mailError', 'seqProyecto', 'noDuplicados')");
      this.sql.exec("DELETE FROM sqlite_sequence WHERE name IN ('clients', 'reviews', 'project_events', 'brief_files', 'payments', 'giveaways', 'giveaway_winners', 'giveaway_events', 'renewals')");
    });
    return true;
  }

  // ---- Copia de seguridad: todas las tablas (los archivos del brief van solo con su nombre y tamaño; se bajan desde cada proyecto)
  backup() {
    const tables = this.sql.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name != 'brief_chunks' ORDER BY name").toArray();
    const out = { created: new Date().toISOString(), tables: {} };
    for (const { name } of tables) out.tables[name] = this.sql.exec(`SELECT * FROM "${name}"`).toArray();
    return out;
  }

  // ---- Consultas y pedidos de presupuesto
  addInquiry(data) {
    const now = new Date();
    // Al año se borran solas las consultas que no llegaron a ser un proyecto (las de un proyecto quedan en la ficha del cliente),
    // y también las fichas que quedaron sin pedidos ni proyectos (salvo que Jimena les haya puesto estado o nota)
    const cutoff = new Date(now - KEEP_INQUIRIES_DAYS * DAY).toISOString();
    this.sql.exec("DELETE FROM inquiries WHERE created < ? AND token NOT IN (SELECT quote FROM projects WHERE quote != '')", cutoff);
    this.sql.exec(`DELETE FROM clients WHERE created < ? AND status = '' AND note = ''
      AND NOT EXISTS (SELECT 1 FROM inquiries i WHERE i.client_id = clients.id) AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.client_id = clients.id)`, cutoff);
    // Freno para envíos automáticos: como mucho 5 por mail por hora
    const lastHour = new Date(now - DAY / 24).toISOString();
    if (this.sql.exec('SELECT COUNT(*) AS n FROM inquiries WHERE email = ? AND created > ?', data.email, lastHour).one().n >= 5) return null;
    let code = newCode(now);
    while (this.sql.exec('SELECT 1 FROM inquiries WHERE code = ?', code).toArray().length) code = newCode(now);
    const token = newToken();
    // El cupón se guarda solo si es válido en este momento
    const coupon = data.coupon && this.couponState(data.coupon).valid ? data.coupon : '';
    // Mismo mail = mismo cliente: no se crea una ficha nueva por cada pedido
    const clientId = this.clientFor(data.email, data.name, now.toISOString());
    this.sql.exec(`INSERT INTO inquiries (code, token, kind, created, lang, name, email, plan, message, coupon, country, client_id, seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, code, token, data.kind, now.toISOString(), data.lang, data.name, data.email, data.plan, data.message, coupon, data.country || '', clientId);
    if (data.source) {
      this.sql.exec('UPDATE inquiries SET source = ? WHERE code = ?', data.source, code);
      this.sql.exec("UPDATE clients SET source = ? WHERE id = ? AND source = ''", data.source, clientId);
    }
    return { code, token, created: now.toISOString(), coupon };
  }

  // Mail, nombre e idioma del cliente de un proyecto (del presupuesto o, si se creó a mano, del brief)
  contactOf(project, token) {
    const linkToken = project.quote || token;
    const fromQuote = project.quote ? this.sql.exec('SELECT email, name FROM inquiries WHERE token = ?', project.quote).toArray()[0] : null;
    const brief = this.sql.exec('SELECT answers FROM briefs WHERE token = ?', linkToken).toArray()[0];
    const briefEmail = brief ? (JSON.parse(brief.answers).email || '') : '';
    return {
      email: (fromQuote && fromQuote.email) || (typeof briefEmail === 'string' ? briefEmail.trim() : ''),
      name: (fromQuote && fromQuote.name) || project.client,
      lang: project.lang, linkToken, fromQuote: Boolean(project.quote), store: planKey(project.project) === 'emprendedor',
    };
  }

  // ---- Historial
  logEvent(project, icon, text) {
    if (project) this.sql.exec('INSERT INTO project_events (project, at, icon, text) VALUES (?, ?, ?, ?)', project, new Date().toISOString(), icon, text);
  }

  // Proyecto de un link de cliente (el del presupuesto o el del proyecto)
  projectOf(token) {
    const row = this.sql.exec("SELECT token FROM projects WHERE quote = ? OR (token = ? AND quote = '')", token, token).toArray()[0];
    return row ? row.token : '';
  }

  // ---- Cupones
  couponState(code) {
    const row = this.sql.exec('SELECT percent, used_inquiry, expires FROM coupons WHERE code = ?', String(code || '').toUpperCase()).toArray()[0];
    if (!row) return { valid: false, reason: 'unknown' };
    if (row.used_inquiry) return { valid: false, reason: 'used' };
    if (row.expires && row.expires < new Date().toISOString().slice(0, 10)) return { valid: false, reason: 'expired', expires: row.expires };
    return { valid: true, percent: row.percent, expires: row.expires };
  }

  markMailed(code) {
    this.sql.exec('UPDATE inquiries SET mailed = 1 WHERE code = ?', code);
  }

  inquiryByCode(code) {
    return this.sql.exec('SELECT * FROM inquiries WHERE code = ?', code).toArray()[0] || null;
  }

  // El cliente elige una opción: el precio y lo que incluye pasan a ser los de esa opción (Jimena lo ve como consulta nueva)
  chooseOption(token, index) {
    const row = this.sql.exec("SELECT code, name, status, proposal FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0];
    if (!row || !row.proposal) return null;
    if (row.status !== 'enviado') return { error: 'closed' };
    const proposal = JSON.parse(row.proposal);
    const option = (proposal.options || [])[index];
    if (!Number.isInteger(index) || !option) return { error: 'option' };
    Object.assign(proposal, { price: option.price, priceUsd: option.priceUsd || '', includes: option.includes, chosen: index });
    this.sql.exec('UPDATE inquiries SET proposal = ?, seen = 0 WHERE token = ?', JSON.stringify(proposal), token);
    return { code: row.code, name: row.name, option: option.name, price: option.price };
  }

  quote(token) {
    const row = this.sql.exec("SELECT * FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0];
    if (!row) return null;
    // La propuesta se ve cuando está enviada o ya aceptada
    const proposal = SHOWN_STATUSES.includes(row.status) && row.proposal ? JSON.parse(row.proposal) : null;
    return {
      code: row.code,
      created: row.created,
      lang: row.lang,
      firstName: row.name.split(' ')[0],
      plan: row.plan,
      summary: row.message,
      status: row.status,
      proposal,
      // Cuando el presupuesto se acepta, el mismo link muestra también el avance del proyecto
      project: this.withBrief(this.withLaunch(this.sql.exec('SELECT client, project, lang, stage, due, note, next, preview, updated, review_token, coupon FROM projects WHERE quote = ?', token).toArray()[0] || null), token),
    };
  }

  setQuote(token, status, proposal) {
    const row = this.sql.exec("SELECT proposal, name, plan, lang, client_id FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0];
    if (!row) return false;
    // Al aceptarlo se crea solo el seguimiento del proyecto, vinculado a este presupuesto (una sola vez)
    if (status === 'aceptado') {
      const used = this.sql.exec("SELECT code, coupon FROM inquiries WHERE token = ? AND coupon != ''", token).toArray()[0];
      if (used && this.couponState(used.coupon).valid) {
        this.sql.exec("UPDATE coupons SET used_inquiry = ?, used_at = ? WHERE code = ? AND used_inquiry = ''", used.code, new Date().toISOString(), used.coupon);
        const owner = this.sql.exec('SELECT project FROM coupons WHERE code = ?', used.coupon).toArray()[0];
        if (owner) this.logEvent(owner.project, '🎁', `Usó su cupón ${used.coupon} en el presupuesto ${used.code}`);
      }
    }
    let created = false;
    if (status === 'aceptado' && !this.sql.exec('SELECT 1 FROM projects WHERE quote = ?', token).toArray().length) {
      this.addProject({ client: row.name.split(' ')[0], project: row.plan || '—', lang: row.lang, due: '', quote: token, clientId: row.client_id });
      created = true;
    }
    // La fecha de emisión se fija la primera vez que se envía y no cambia al corregir la propuesta
    if (proposal) proposal.issued = (row.proposal && JSON.parse(row.proposal).issued) || new Date().toISOString();
    this.sql.exec('UPDATE inquiries SET status = ?, proposal = ? WHERE token = ?', status, proposal ? JSON.stringify(proposal) : null, token);
    // Cuándo se envió la propuesta (la primera vez): desde ahí se cuentan los días sin respuesta
    if (status === 'enviado') this.sql.exec("UPDATE inquiries SET sent_at = ? WHERE token = ? AND sent_at = ''", new Date().toISOString(), token);
    // Si recién se aceptó, se devuelven los datos para mandarle al cliente el mail con el link del brief
    if (!created) return true;
    const email = this.sql.exec('SELECT email FROM inquiries WHERE token = ?', token).one().email;
    return { created, name: row.name, email, lang: row.lang, plan: row.plan };
  }

  // ---- Reseñas
  invite(client) {
    const token = newToken();
    this.sql.exec('INSERT INTO invitations (token, client, created) VALUES (?, ?, ?)', token, client, new Date().toISOString());
    return token;
  }

  invitation(token) {
    return this.sql.exec('SELECT client, used FROM invitations WHERE token = ?', token).toArray()[0] || null;
  }

  addReview(token, review) {
    const invitation = this.invitation(token);
    if (!invitation || invitation.used) return false;
    this.sql.exec(`INSERT INTO reviews (invitation, created, lang, name, business, body) VALUES (?, ?, ?, ?, ?, ?)`,
      token, new Date().toISOString(), review.lang, review.name, review.business, review.body);
    this.sql.exec('UPDATE invitations SET used = 1 WHERE token = ?', token);
    const project = this.sql.exec('SELECT token FROM projects WHERE review_token = ?', token).toArray()[0];
    if (project) this.logEvent(project.token, '⭐', 'Dejó su reseña');
    return true;
  }

  publicReviews() {
    const rows = this.sql.exec("SELECT name, business, body, lang FROM reviews WHERE status = 'aprobada' ORDER BY created DESC LIMIT 9").toArray();
    return rows.length >= MIN_PUBLIC_REVIEWS ? rows : [];
  }

  setReview(id, status) {
    if (status === 'borrar') this.sql.exec('DELETE FROM reviews WHERE id = ?', id);
    else this.sql.exec('UPDATE reviews SET status = ? WHERE id = ?', status, id);
  }

  // ---- Seguimiento de proyectos
  addProject(project) {
    const token = newToken();
    const now = new Date().toISOString();
    // Cliente: el del presupuesto, el elegido en el panel o, si es nuevo, una ficha con el mail que se cargó
    const clientId = project.clientId && this.clientExists(project.clientId)
      ? project.clientId : this.clientFor(project.email, project.fullName || project.client, now);
    if (project.phone) this.sql.exec("UPDATE clients SET phone = ? WHERE id = ? AND phone = ''", project.phone, clientId);
    this.sql.exec(`INSERT INTO projects (token, client, project, lang, due, quote, created, updated, client_id, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      token, project.client, project.project, project.lang, project.due, project.quote || '', now, now, clientId, this.nextProjectCode());
    if (project.request) this.sql.exec('UPDATE projects SET request = ? WHERE token = ?', project.request, token);
    this.logEvent(token, '🤝', project.quote ? 'Aceptó el presupuesto: se creó el proyecto y se le pidió el brief' : 'Proyecto creado a mano');
    return token;
  }

  project(token) {
    const row = this.sql.exec('SELECT client, project, lang, stage, due, note, next, preview, updated, review_token, coupon FROM projects WHERE token = ?', token).toArray()[0];
    return this.withBrief(this.withLaunch(row || null), token);
  }

  setProject(token, changes) {
    if (changes.remove) {
      // Un proyecto con pagos cargados no se borra (primero hay que borrar sus pagos): así no quedan pagos sueltos
      if (this.sql.exec('SELECT 1 FROM payments WHERE project = ?', token).toArray().length) return { error: 'payments' };
      this.sql.exec('DELETE FROM projects WHERE token = ?', token);
      // El ganador y la tarea que apuntaban a este proyecto quedan sin proyecto (no se borran)
      this.sql.exec("UPDATE giveaway_winners SET project_token = '' WHERE project_token = ?", token);
      this.sql.exec("UPDATE tasks SET project = '' WHERE project = ?", token);
      this.sql.exec("UPDATE renewals SET project = '' WHERE project = ?", token);
      return true;
    }
    const project = this.sql.exec('SELECT stage, client, lang, quote, coupon, project, origin, review_token, client_id FROM projects WHERE token = ?', token).toArray()[0];
    if (!project) return false;
    this.sql.exec('UPDATE projects SET stage = ?, due = ?, note = ?, next = ?, preview = ?, updated = ? WHERE token = ?',
      changes.stage, changes.due, changes.note, changes.next, changes.preview, new Date().toISOString(), token);
    const stageChanged = changes.stage !== project.stage;
    if (stageChanged && changes.stage >= 2) this.sql.exec("UPDATE projects SET materials_at = ? WHERE token = ? AND materials_at = ''", arToday(), token);
    if (stageChanged) this.logEvent(token, '📍', `Etapa: ${STAGE_NAMES[changes.stage] || changes.stage}`);
    // Premio de un sorteo de Instagram: al publicarse se pide la reseña, pero no se genera el cupón del 20 %
    if (project.origin === 'sorteo-instagram' && changes.stage === LAUNCH_STAGE) {
      if (project.review_token) return stageChanged ? { stageChanged, stage: changes.stage, ...this.contactOf(project, token) } : true;
      const contact = this.contactOf(project, token);
      if (!contact.email && project.client_id) contact.email = (this.sql.exec('SELECT email FROM clients WHERE id = ?', project.client_id).toArray()[0] || {}).email || '';
      const reviewToken = this.invite(contact.name);
      this.sql.exec('UPDATE projects SET review_token = ? WHERE token = ?', reviewToken, token);
      this.logEvent(token, '🎉', 'Publicado: se pidió la reseña (premio de sorteo: sin cupón de descuento)');
      return { launched: true, coupon: '', expires: '', reviewToken, ...contact };
    }
    if (changes.stage !== LAUNCH_STAGE || project.coupon) return stageChanged ? { stageChanged, stage: changes.stage, ...this.contactOf(project, token) } : true;
    // Recién publicado: cupón de descuento y link para la reseña, y los datos para mandarle el mail
    const now = new Date();
    let code = newCouponCode();
    while (this.sql.exec('SELECT 1 FROM coupons WHERE code = ?', code).toArray().length) code = newCouponCode();
    const linkToken = project.quote || token;
    const fromQuote = project.quote ? this.sql.exec('SELECT email, name FROM inquiries WHERE token = ?', project.quote).toArray()[0] : null;
    const brief = this.sql.exec('SELECT answers FROM briefs WHERE token = ?', linkToken).toArray()[0];
    const briefEmail = brief ? (JSON.parse(brief.answers).email || '') : '';
    const email = (fromQuote && fromQuote.email) || (typeof briefEmail === 'string' ? briefEmail.trim() : '');
    const name = (fromQuote && fromQuote.name) || project.client;
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + COUPON_MONTHS);
    const expires = expiry.toISOString().slice(0, 10);
    this.sql.exec('INSERT INTO coupons (code, project, client, email, lang, percent, created, expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      code, token, name, email, project.lang, COUPON_PERCENT, now.toISOString(), expires);
    const reviewToken = this.invite(name);
    this.sql.exec('UPDATE projects SET coupon = ?, review_token = ? WHERE token = ?', code, reviewToken, token);
    this.logEvent(token, '🎉', `Publicado: se entregó el cupón ${code} (vence ${expires}) y se pidió la reseña`);
    return { launched: true, coupon: code, expires, reviewToken, email, name, lang: project.lang, linkToken, fromQuote: Boolean(project.quote), store: planKey(project.project) === 'emprendedor' };
  }

  // ---- Último error al mandar un mail (para el panel)
  setMailError(value) {
    this.sql.exec(`INSERT INTO settings (key, value) VALUES ('mailError', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`, JSON.stringify(value));
  }

  mailError() {
    const row = this.sql.exec("SELECT value FROM settings WHERE key = 'mailError'").toArray()[0];
    return row ? JSON.parse(row.value) : null;
  }

  // ---- Cartel de disponibilidad del inicio ('abierto', 'agenda' o 'cerrado'; mes desde el que se reserva, 1 a 12 o vacío)
  availability() {
    const row = this.sql.exec("SELECT value FROM settings WHERE key = 'availability'").toArray()[0];
    const saved = row ? JSON.parse(row.value) : {};
    return { estado: saved.estado || 'abierto', reservaDesde: saved.reservaDesde || '', updated: saved.updated || '' };
  }

  setAvailability(estado, reservaDesde) {
    const value = JSON.stringify({ estado, reservaDesde, updated: new Date().toISOString() });
    this.sql.exec(`INSERT INTO settings (key, value) VALUES ('availability', ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value`, value);
    return this.availability();
  }

  // ---- "Cerrar ahora" / "Abrir ahora" del horario de atención (cartel "Disponible ahora / Fuera de horario").
  // Dura hasta "hasta" (lo calcula el panel con el horario habitual); después vuelve solo el horario habitual.
  hours() {
    const row = this.sql.exec("SELECT value FROM settings WHERE key = 'horario'").toArray()[0];
    const saved = row ? JSON.parse(row.value) : null;
    return saved && saved.modo && new Date(saved.hasta) > new Date() ? saved : { modo: '', hasta: '', desde: '' };
  }

  // mensaje: id del mensaje de ausencia (ver js/availability.js); regreso: true si "hasta" es la hora de regreso elegida
  setHours(modo, hasta, mensaje = '', regreso = false) {
    if (!modo) this.sql.exec("DELETE FROM settings WHERE key = 'horario'");
    else {
      const value = JSON.stringify({ modo, hasta, desde: new Date().toISOString(), mensaje, regreso });
      this.sql.exec(`INSERT INTO settings (key, value) VALUES ('horario', ?)
        ON CONFLICT (key) DO UPDATE SET value = excluded.value`, value);
    }
    return this.hours();
  }

  logQuoteEvent(quoteToken, icon, text) {
    const project = this.sql.exec('SELECT token FROM projects WHERE quote = ?', quoteToken).toArray()[0];
    if (project) this.logEvent(project.token, icon, text);
  }

  quoteContact(token) {
    return this.sql.exec("SELECT name, email, lang FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0] || null;
  }

  // ---- Brief
  // El brief se abre con el link del cliente: el del presupuesto (si ya tiene proyecto) o el del proyecto creado a mano
  // Una vez enviado, el brief se puede editar solo antes de empezar a diseñar (etapas 1 y 2) y en la revisión (etapa 4).
  // Mientras diseño (etapa 3) y después de publicar (etapa 5) queda cerrado, para no recibir cambios constantes.
  briefLocked(token) {
    const brief = this.sql.exec('SELECT status FROM briefs WHERE token = ?', token).toArray()[0];
    if (!brief || brief.status !== 'enviado') return false;
    const project = this.sql.exec("SELECT stage FROM projects WHERE quote = ? OR (token = ? AND quote = '')", token, token).toArray()[0];
    return Boolean(project && BRIEF_LOCKED_STAGES.includes(project.stage));
  }

  briefTarget(token) {
    const fromQuote = this.sql.exec(`SELECT i.plan, i.lang, i.name, i.code, i.message FROM inquiries i JOIN projects p ON p.quote = i.token
      WHERE i.token = ? AND i.kind = 'presupuesto'`, token).toArray()[0];
    if (fromQuote) return { planText: fromQuote.plan, lang: fromQuote.lang, client: fromQuote.name, code: fromQuote.code, request: fromQuote.message };
    const project = this.sql.exec("SELECT project, lang, client, request FROM projects WHERE token = ? AND quote = ''", token).toArray()[0];
    return project ? { planText: project.project, lang: project.lang, client: project.client, code: '', request: project.request || '' } : null;
  }

  // Al publicar: link de la reseña (si todavía no la dejó) y el cupón (con su estado)
  withLaunch(project) {
    if (!project) return null;
    const { review_token: reviewToken, coupon, ...rest } = project;
    const invitation = reviewToken ? this.invitation(reviewToken) : null;
    const couponRow = coupon ? this.sql.exec('SELECT percent, used_inquiry, expires FROM coupons WHERE code = ?', coupon).toArray()[0] : null;
    return {
      ...rest,
      reviewToken: invitation && !invitation.used ? reviewToken : '',
      reviewDone: Boolean(invitation && invitation.used),
      coupon: couponRow ? {
        code: coupon, percent: couponRow.percent, used: Boolean(couponRow.used_inquiry), expires: couponRow.expires,
        expired: Boolean(couponRow.expires && couponRow.expires < new Date().toISOString().slice(0, 10)),
      } : null,
    };
  }

  withBrief(project, token) {
    if (!project) return null;
    const brief = this.sql.exec('SELECT status, sent FROM briefs WHERE token = ?', token).toArray()[0];
    return { ...project, briefStatus: brief ? brief.status : '', briefSent: brief ? brief.sent : '' };
  }

  brief(token) {
    const target = this.briefTarget(token);
    if (!target) return null;
    const row = this.sql.exec('SELECT answers, status, sent, updated, edited, resent, last_changes FROM briefs WHERE token = ?', token).toArray()[0];
    return {
      edited: row ? row.edited : '',
      resent: row ? row.resent : '',
      lastChanges: row ? JSON.parse(row.last_changes || '[]') : [],
      locked: this.briefLocked(token),
      plan: planKey(target.planText),
      // Lo que pidió en el presupuesto: el brief suma preguntas solo para los adicionales que eligió
      request: target.request || '',
      planText: target.planText,
      status: row ? row.status : '',
      sent: row ? row.sent : '',
      updated: row ? row.updated : '',
      answers: row ? JSON.parse(row.answers) : {},
      files: this.sql.exec('SELECT id, field, name, type, size FROM brief_files WHERE token = ? ORDER BY id', token).toArray(),
    };
  }

  saveBrief(token, data) {
    const target = this.briefTarget(token);
    if (!target) return null;
    if (this.briefLocked(token)) return { locked: true };
    const now = new Date().toISOString();
    const before = this.sql.exec('SELECT status, sent, answers, summary, edited, edit_seen, prev_summary, sent_summary, last_changes, resent FROM briefs WHERE token = ?', token).toArray()[0];
    const wasSent = Boolean(before && before.status === 'enviado');
    const answers = JSON.stringify(data.answers);
    const summary = JSON.stringify(data.summary);
    const changed = wasSent && (before.answers !== answers || before.summary !== summary);
    // La fecha de envío es la del primer envío; las ediciones posteriores se registran aparte
    const status = data.send || wasSent ? 'enviado' : (before ? before.status : 'borrador');
    const sent = wasSent ? before.sent : (data.send ? now : (before ? before.sent : ''));
    const edited = changed ? now : (before ? before.edited : '');
    const editSeen = changed ? 0 : (before ? before.edit_seen : 1);
    // "Antes" = lo último que vio Jimena: si ya había visto la edición anterior, la base pasa a ser lo que había
    const prevSummary = changed ? (before.edit_seen ? before.summary : before.prev_summary) : (before ? before.prev_summary : '[]');
    // Cada envío guarda la versión enviada; si ya había uno antes, se anotan los cambios respecto de esa versión
    let sentSummary = before ? before.sent_summary : '[]';
    let lastChanges = before ? before.last_changes : '[]';
    let resent = before ? before.resent : '';
    let changes = [];
    if (data.send) {
      if (wasSent) {
        changes = diffSummary(JSON.parse(before.sent_summary || '[]'), data.summary);
        lastChanges = JSON.stringify(changes);
        resent = now;
      }
      sentSummary = summary;
    }
    this.sql.exec(`INSERT INTO briefs (token, lang, answers, summary, status, updated, sent, edited, edit_seen, prev_summary, sent_summary, last_changes, resent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (token) DO UPDATE SET lang = excluded.lang, answers = excluded.answers, summary = excluded.summary,
      status = excluded.status, updated = excluded.updated, sent = excluded.sent, edited = excluded.edited,
      edit_seen = excluded.edit_seen, prev_summary = excluded.prev_summary, sent_summary = excluded.sent_summary,
      last_changes = excluded.last_changes, resent = excluded.resent`,
    token, data.lang, answers, summary, status, now, sent, edited, editSeen, prevSummary, sentSummary, lastChanges, resent);
    if (data.send) this.logEvent(this.projectOf(token), wasSent ? '✏️' : '📝', wasSent ? `Actualizó el brief (${changes.length} ${changes.length === 1 ? 'cambio' : 'cambios'})` : 'Envió el brief');
    // Mail del cliente: el del presupuesto o, si el proyecto se creó a mano, el que puso en el brief
    const contact = this.sql.exec("SELECT email, name FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0];
    const clientEmail = (contact && contact.email) || (typeof data.answers.email === 'string' ? data.answers.email.trim() : '');
    return { status, sent, edited, wasSent, changes, resent, clientEmail, client: target.client, code: target.code, planText: target.planText };
  }

  addFile(token, field, name, type, bytes) {
    if (!this.briefTarget(token)) return { error: 'not found' };
    if (this.briefLocked(token)) return { error: 'locked' };
    const totals = this.sql.exec('SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS total FROM brief_files WHERE token = ?', token).one();
    if (totals.n >= MAX_BRIEF_FILES) return { error: 'too many' };
    if (totals.total + bytes.byteLength > MAX_BRIEF_BYTES) return { error: 'too big' };
    this.sql.exec('INSERT INTO brief_files (token, field, name, type, size, created) VALUES (?, ?, ?, ?, ?, ?)',
      token, field, name, type, bytes.byteLength, new Date().toISOString());
    const id = this.sql.exec('SELECT last_insert_rowid() AS id').one().id;
    this.markEdited(token);
    // Se guarda en pedazos de 1 MB (la base no acepta valores más grandes)
    const data = new Uint8Array(bytes);
    for (let start = 0, idx = 0; start < data.length; start += CHUNK, idx += 1) {
      this.sql.exec('INSERT INTO brief_chunks (file, idx, data) VALUES (?, ?, ?)', id, idx, data.slice(start, start + CHUNK));
    }
    return { id, name, size: bytes.byteLength, type, field };
  }

  markEdited(token) {
    const row = this.sql.exec('SELECT status, edit_seen, summary FROM briefs WHERE token = ?', token).toArray()[0];
    if (!row || row.status !== 'enviado') return;
    const now = new Date().toISOString();
    if (row.edit_seen) this.sql.exec('UPDATE briefs SET edited = ?, edit_seen = 0, prev_summary = summary WHERE token = ?', now, token);
    else this.sql.exec('UPDATE briefs SET edited = ? WHERE token = ?', now, token);
  }

  removeFile(token, id) {
    if (this.briefLocked(token)) return 'locked';
    const found = this.sql.exec('SELECT 1 FROM brief_files WHERE id = ? AND token = ?', id, token).toArray().length;
    if (!found) return false;
    this.sql.exec('DELETE FROM brief_chunks WHERE file = ?', id);
    this.sql.exec('DELETE FROM brief_files WHERE id = ?', id);
    this.markEdited(token);
    return true;
  }

  readFile(id) {
    const file = this.sql.exec('SELECT name, type, size FROM brief_files WHERE id = ?', id).toArray()[0];
    if (!file) return null;
    const out = new Uint8Array(file.size);
    let offset = 0;
    for (const chunk of this.sql.exec('SELECT data FROM brief_chunks WHERE file = ? ORDER BY idx', id)) {
      const part = new Uint8Array(chunk.data);
      out.set(part, offset);
      offset += part.length;
    }
    return { ...file, data: out };
  }

  briefForAdmin(token) {
    const target = this.briefTarget(token);
    const row = this.sql.exec('SELECT lang, summary, status, sent, updated, edited, edit_seen, prev_summary FROM briefs WHERE token = ?', token).toArray()[0];
    if (!target && !row) return null;
    if (row && !row.edit_seen) this.sql.exec('UPDATE briefs SET edit_seen = 1 WHERE token = ?', token);
    return {
      edited: row ? row.edited : '',
      editUnseen: Boolean(row && !row.edit_seen),
      prevSummary: row && row.edited ? JSON.parse(row.prev_summary) : [],
      client: target ? target.client : '',
      code: target ? target.code : '',
      planText: target ? target.planText : '',
      lang: row ? row.lang : (target ? target.lang : 'es'),
      status: row ? row.status : '',
      sent: row ? row.sent : '',
      updated: row ? row.updated : '',
      summary: row ? JSON.parse(row.summary) : [],
      files: this.sql.exec('SELECT id, field, name, type, size FROM brief_files WHERE token = ? ORDER BY id', token).toArray(),
    };
  }

  // ---- Panel
  everything() {
    return {
      clients: this.sql.exec(`SELECT c.id, c.code, c.name, c.email, c.phone, c.status, c.note, c.created, c.source,
        (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS projectCount,
        (SELECT COUNT(*) FROM inquiries i WHERE i.client_id = c.id) AS inquiryCount
        FROM clients c ORDER BY c.id DESC`).toArray(),
      notDuplicates: this.notDuplicates(),
      payments: this.sql.exec(`SELECT y.id, y.project, y.concept, y.currency, y.amount, y.due, y.paid, y.method, y.note, y.created, p.code AS projectCode, p.client_id AS clientId
        FROM payments y JOIN projects p ON p.token = y.project ORDER BY (y.paid = '') DESC, COALESCE(NULLIF(y.paid, ''), y.due, y.created) DESC`).toArray(),
      inquiries: this.sql.exec(`SELECT code, token, kind, created, lang, name, email, plan, message, status, proposal, mailed, coupon, country, client_id AS clientId, seen, sent_at AS sentAt, followup_at AS followupAt
        FROM inquiries ORDER BY created DESC LIMIT 3000`).toArray()
        .map((row) => ({ ...row, proposal: row.proposal ? JSON.parse(row.proposal) : null })),
      invitations: this.sql.exec('SELECT token, client, created, used FROM invitations ORDER BY created DESC LIMIT 200').toArray(),
      reviews: this.sql.exec('SELECT id, created, lang, name, business, body, status FROM reviews ORDER BY created DESC').toArray(),
      projects: this.sql.exec(`SELECT p.token, p.code, p.client_id AS clientId, p.client, p.project, p.lang, p.stage, p.due, p.note, p.next, p.preview, p.created, p.updated,
        p.origin, p.winner_id AS winnerId, p.materials_at AS materialsAt, p.coupon, (SELECT used_inquiry FROM coupons c WHERE c.code = p.coupon) AS couponUsedBy,
        p.review_token AS reviewToken, (SELECT used FROM invitations v WHERE v.token = p.review_token) AS reviewDone,
        p.quote, i.code AS quoteCode, b.status AS briefStatus, b.sent AS briefSent, b.updated AS briefUpdated,
        b.edited AS briefEdited, CASE WHEN b.edit_seen = 0 THEN 1 ELSE 0 END AS briefEditUnseen,
        (SELECT COUNT(*) FROM brief_files f WHERE f.token = (CASE WHEN p.quote != '' THEN p.quote ELSE p.token END)) AS briefFiles
        FROM projects p
        LEFT JOIN inquiries i ON i.token = p.quote AND p.quote != ''
        LEFT JOIN briefs b ON b.token = (CASE WHEN p.quote != '' THEN p.quote ELSE p.token END)
        ORDER BY p.updated DESC`).toArray(),
      coupons: this.sql.exec(`SELECT c.code, (SELECT client_id FROM projects p WHERE p.token = c.project) AS clientId, c.client, c.email, c.lang, c.percent, c.created, c.expires, c.used_inquiry AS usedBy, c.used_at AS usedAt
        FROM coupons c ORDER BY c.created DESC`).toArray(),
      events: this.sql.exec('SELECT project, at, icon, text FROM project_events ORDER BY at DESC LIMIT 3000').toArray(),
      renewals: this.sql.exec("SELECT id, client_id AS clientId, project, kind, label, due, amount, note, done_at AS doneAt, created FROM renewals ORDER BY (done_at != ''), due").toArray(),
      minPublicReviews: MIN_PUBLIC_REVIEWS,
    };
  }
}

// ---- Envío de mails (Resend). Sin claves cargadas, no se manda nada.
// Cada envío fallido queda guardado (lo ve Jimena en el panel, en "Probar envío de mail") con la respuesta de Resend.
let mailStore = null; // se completa en cada pedido, para poder guardar el último error

// Los valores cargados en Cloudflare se limpian: espacios y comillas de más son un error común al pegarlos
const cleanEnv = (value) => String(value || '').trim().replace(/^["'“”]+|["'“”]+$/g, '').trim();

// ---- Copia de seguridad semanal: los lunes desde las 9 (hora de Argentina) llega por mail a MAIL_REPLY_TO, con el .json adjunto.
// La corre el cron de cada hora (worker/index.js); si el envío falla, lo vuelve a intentar a la hora siguiente.
export async function weeklyBackup(env) {
  const to = cleanEnv(env.MAIL_REPLY_TO);
  if (!to) return;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date()).map((p) => [p.type, p.value]));
  if (parts.weekday !== 'Mon' || Number(parts.hour) < 9) return;
  const store = env.STUDIO.get(env.STUDIO.idFromName('studio'));
  const last = await store.backupMailedAt();
  if (last && Date.now() - new Date(last).getTime() < 5 * DAY) return;
  const copy = await store.backup();
  const bytes = new TextEncoder().encode(JSON.stringify(copy, null, 1));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const day = copy.created.slice(0, 10);
  const count = (t) => (copy.tables[t] || []).length;
  const summary = `${count('clients')} clientes, ${count('projects')} proyectos, ${count('inquiries')} consultas y presupuestos, ${count('payments')} pagos`;
  mailStore = store;
  const result = await resendSend(env, to, {
    subject: `Copia de seguridad semanal · ${day}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#211632"><p>Hola, Jimena:</p><p>Te llega la copia de seguridad semanal del panel (${summary}).</p><p>El archivo adjunto tiene datos privados de tus clientes: guardalo en un lugar seguro. Los archivos que subieron los clientes al brief no van en la copia (se descargan desde cada proyecto).</p><p style="color:#625970;font-size:13px">JNB Creative Studio · copia automática de los lunes</p></div>`,
    text: `Hola, Jimena:\n\nTe llega la copia de seguridad semanal del panel (${summary}).\nEl archivo adjunto tiene datos privados de tus clientes: guardalo en un lugar seguro.`,
    attachments: [{ filename: `jnb-panel-copia-${day}.json`, content: btoa(binary) }],
  });
  if (result.ok) await store.markBackupMailed();
}

export async function resendSend(env, to, mail) {
  // Si la clave quedó pegada con otro texto (por ejemplo "RESEND_API_KEY=re_..."), se usa solo la parte "re_..."
  const rawKey = cleanEnv(env.RESEND_API_KEY);
  const key = (rawKey.match(/re_[A-Za-z0-9_]+/) || [rawKey])[0];
  const from = cleanEnv(env.MAIL_FROM);
  const replyTo = cleanEnv(env.MAIL_REPLY_TO);
  if (!key || !from) return { ok: false, status: 0, error: 'Faltan RESEND_API_KEY o MAIL_FROM en Cloudflare.' };
  if (!to) return { ok: false, status: 0, error: 'El cliente no tiene mail cargado.' };
  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: replyTo || undefined, subject: mail.subject, html: mail.html, text: mail.text, attachments: mail.attachments }),
    });
  } catch (networkError) {
    return remember({ ok: false, status: 0, error: `No se pudo conectar con Resend: ${networkError.message}` }, to, mail);
  }
  if (res.ok) return { ok: true, status: res.status };
  const detail = await res.text().catch(() => '');
  let message = detail;
  try { message = JSON.parse(detail).message || detail; } catch { /* no era JSON */ }
  console.error('Resend rechazó el mail', res.status, message);
  return remember({ ok: false, status: res.status, error: String(message).slice(0, 500) }, to, mail);
}

// Varios mails en un solo pedido a Resend (hasta 100 por vez). Lo usa el newsletter del blog.
// Cada mail: { to, subject, html, text, headers? }. Devuelve cuántos aceptó Resend.
export async function resendBatch(env, mails) {
  const rawKey = cleanEnv(env.RESEND_API_KEY);
  const key = (rawKey.match(/re_[A-Za-z0-9_]+/) || [rawKey])[0];
  const from = cleanEnv(env.MAIL_FROM);
  const replyTo = cleanEnv(env.MAIL_REPLY_TO);
  if (!key || !from) return { ok: 0, error: 'Faltan RESEND_API_KEY o MAIL_FROM en Cloudflare.' };
  let ok = 0;
  let error = '';
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100).map((m) => ({ from, to: [m.to], reply_to: replyTo || undefined, subject: m.subject, html: m.html, text: m.text, headers: m.headers }));
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (res.ok) ok += chunk.length;
      else error = `${res.status} ${(await res.text().catch(() => '')).slice(0, 300)}`;
    } catch (networkError) {
      error = `No se pudo conectar con Resend: ${networkError.message}`;
    }
    if (i + 100 < mails.length) await new Promise((r) => setTimeout(r, 600)); // Resend acepta pocos pedidos por segundo
  }
  if (error) console.error('Resend rechazó parte del newsletter', error);
  return { ok, error };
}

async function remember(result, to, mail) {
  try { if (mailStore) await mailStore.setMailError({ at: new Date().toISOString(), status: result.status, error: result.error, to, subject: mail.subject }); } catch { /* sin registro */ }
  return result;
}

async function sendMail(env, inquiry, link) {
  return (await resendSend(env, inquiry.email, confirmationMail(inquiry, link))).ok;
}

const quoteLink = (lang, token) => `${SITE}/mi-presupuesto/${lang === 'es' ? '' : lang}?c=${token}`;
const projectLink = (lang, token) => `${SITE}/mi-proyecto/${lang === 'es' ? '' : lang}?c=${token}`;

// Mail cualquiera por Resend (sin claves cargadas, no hace nada)
async function sendAnyMail(env, to, mail) {
  return (await resendSend(env, to, mail)).ok;
}

// La clave del panel se compara sin dar pistas por el tiempo de respuesta.
export function isAdmin(request, env) {
  const key = env.ADMIN_CLAVE;
  const given = request.headers.get('x-clave') || '';
  if (!key || !given) return false;
  const a = new TextEncoder().encode(key);
  const b = new TextEncoder().encode(given);
  if (a.length !== b.length) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

export async function handleStudio(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const store = env.STUDIO.get(env.STUDIO.idFromName('studio'));
  mailStore = store;
  let match;

  // ---- Consultas (formulario del inicio) y pedidos de presupuesto
  if (path === '/api/consultas' && request.method === 'POST') {
    const body = await readJson(request);
    if (!body || body.botcheck) return badRequest();
    const data = {
      kind: body.kind === 'presupuesto' ? 'presupuesto' : 'consulta',
      lang: LANGS.has(body.lang) ? body.lang : 'es',
      name: oneLine(body.name, 100),
      email: oneLine(body.email, 160).toLowerCase(),
      plan: oneLine(body.plan, 100),
      message: text(body.message, 5000),
      coupon: typeof body.coupon === 'string' ? body.coupon.trim().toUpperCase().slice(0, 30) : '',
      country: oneLine(body.country, 60),
      // ¿Cómo me conociste? (opcional; 'recomendacao' es la opción en portugués)
      source: CLIENT_SOURCES.includes(body.source) ? body.source : (body.source === 'recomendacao' ? 'recomendacion' : ''),
    };
    if (!data.name || !EMAIL.test(data.email) || !data.message) return badRequest();
    const saved = await store.addInquiry(data);
    if (!saved) return json({ error: 'too many' }, 429);
    const link = data.kind === 'presupuesto' ? quoteLink(data.lang, saved.token) : null;
    let mailed = false;
    try {
      mailed = await sendMail(env, { ...data, code: saved.code, created: saved.created }, link);
      if (mailed) await store.markMailed(saved.code);
    } catch { /* si el mail falla, la consulta igual quedó guardada */ }
    return json({ code: saved.code, link: link && new URL(link).pathname + new URL(link).search, mailed, coupon: saved.coupon });
  }

  if ((match = path.match(/^\/api\/presupuestos\/([^/]+)$/)) && request.method === 'GET') {
    if (!TOKEN.test(match[1])) return notFound();
    const quote = await store.quote(match[1]);
    return quote ? json(quote) : notFound();
  }

  // ---- Reseñas
  // El cliente elige una de las opciones de su propuesta (solo mientras está "Enviado"); a Jimena le llega un aviso
  if ((match = path.match(/^\/api\/presupuestos\/([^/]+)\/elegir$/)) && request.method === 'POST') {
    if (!TOKEN.test(match[1])) return notFound();
    const body = (await readJson(request)) || {};
    const result = await store.chooseOption(match[1], Number(body.option));
    if (!result) return notFound();
    if (result.error) return json(result, 409);
    if (env.MAIL_REPLY_TO) {
      const msg = `${result.name} (${result.code}) eligió la opción "${result.option}" (${result.price}). Cuando te confirme, pasá el presupuesto a Aceptado: ${SITE}/api/admin#presupuestos/${result.code}`;
      try { await sendAnyMail(env, cleanEnv(env.MAIL_REPLY_TO), { subject: `${result.name} eligió su opción · ${result.code}`, html: `<p style="font-family:Arial,sans-serif">${msg}</p>`, text: msg }); } catch { /* la elección quedó guardada igual */ }
    }
    return json(await store.quote(match[1]));
  }

  if (path === '/api/resenas' && request.method === 'GET') {
    return json({ reviews: await store.publicReviews() });
  }

  if ((match = path.match(/^\/api\/resenas\/invitacion\/([^/]+)$/))) {
    if (!TOKEN.test(match[1])) return notFound();
    if (request.method === 'GET') {
      const invitation = await store.invitation(match[1]);
      return invitation ? json({ used: Boolean(invitation.used) }) : notFound();
    }
    if (request.method === 'POST') {
      const body = await readJson(request);
      if (!body || body.consent !== true) return badRequest();
      const review = {
        lang: LANGS.has(body.lang) ? body.lang : 'es',
        name: oneLine(body.name, 80),
        business: oneLine(body.business, 100),
        body: text(body.body, 800),
      };
      if (!review.name || !review.business || review.body.length < 20) return badRequest();
      return (await store.addReview(match[1], review)) ? json({ ok: true }) : json({ error: 'used' }, 409);
    }
  }

  // ---- Cupón (lo valida el formulario de presupuesto mientras se escribe)
  if ((match = path.match(/^\/api\/cupon\/([A-Za-z0-9-]{4,30})$/)) && request.method === 'GET') {
    return json(await store.couponState(match[1]));
  }

  // ---- Cartel de disponibilidad (lo lee js/intake.js en el inicio)
  if (path === '/api/disponibilidad' && request.method === 'GET') {
    const { estado, reservaDesde } = await store.availability();
    const { modo, hasta, mensaje, regreso } = await store.hours();
    return new Response(JSON.stringify({ estado, reservaDesde, horario: modo ? { modo, hasta, mensaje: mensaje || '', regreso: Boolean(regreso) } : null }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  // ---- Brief del cliente (se abre con su link: el del presupuesto aceptado o el del proyecto)
  if ((match = path.match(/^\/api\/brief\/([^/]+)(?:\/archivo(?:\/(\d+))?)?$/))) {
    const token = match[1];
    if (!TOKEN.test(token)) return notFound();
    const isFiles = path.includes('/archivo');

    if (!isFiles && request.method === 'GET') {
      const brief = await store.brief(token);
      return brief ? json(brief) : notFound();
    }

    if (!isFiles && request.method === 'POST') {
      const raw = await request.text();
      if (raw.length > 300000) return json({ error: 'too big' }, 413);
      let body;
      try { body = JSON.parse(raw); } catch { return badRequest(); }
      if (!body || typeof body.answers !== 'object' || Array.isArray(body.answers) || !Array.isArray(body.summary)) return badRequest();
      const summary = body.summary.slice(0, 200).map((row) => ({
        s: oneLine(row && row.s, 120), q: text(row && row.q, 400), a: text(row && row.a, 6000),
      }));
      const saved = await store.saveBrief(token, {
        lang: LANGS.has(body.lang) ? body.lang : 'es', answers: body.answers, summary, send: body.send === true,
      });
      if (!saved) return notFound();
      if (saved.locked) return json({ error: 'locked' }, 423);
      // Aviso a Jimena cuando el cliente lo envía
      if (body.send === true && env.MAIL_REPLY_TO) {
        const panel = `${SITE}/api/admin`;
        try { await sendAnyMail(env, env.MAIL_REPLY_TO, briefReceivedMail({ ...saved, summary, panel, edited: saved.wasSent, changes: saved.changes })); } catch { /* el brief quedó guardado igual */ }
      }
      // Al cliente: copia de lo que actualizó
      if (body.send === true && saved.wasSent && saved.clientEmail) {
        const target = await store.quoteContact(token);
        const clientLink = target ? `${quoteLink(target.lang, token)}#brief` : `${projectLink(LANGS.has(body.lang) ? body.lang : 'es', token)}#brief`;
        try { await sendAnyMail(env, saved.clientEmail, briefUpdatedMail({ lang: LANGS.has(body.lang) ? body.lang : 'es', name: saved.client, changes: saved.changes, link: clientLink })); } catch { /* quedó guardado igual */ }
      }
      return json({ ok: true, status: saved.status, sent: saved.sent, edited: saved.edited, resent: saved.resent, lastChanges: saved.changes });
    }

    if (isFiles && !match[2] && request.method === 'POST') {
      const name = oneLine(url.searchParams.get('nombre'), 140).replace(/[\\/:*?"<>|]/g, '_');
      const field = oneLine(url.searchParams.get('campo'), 40);
      const type = (request.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim().toLowerCase();
      if (!name || !FILE_EXT.test(name) || !/^[a-zA-Z]+$/.test(field)) return json({ error: 'type' }, 415);
      const length = Number(request.headers.get('content-length') || 0);
      if (length > MAX_FILE_BYTES) return json({ error: 'too big' }, 413);
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > MAX_FILE_BYTES) return json({ error: 'too big' }, 413);
      const saved = await store.addFile(token, field, name, type, bytes);
      if (saved.error === 'not found') return notFound();
      if (saved.error === 'locked') return json(saved, 423);
      if (saved.error) return json(saved, 413);
      return json(saved);
    }

    if (isFiles && match[2] && request.method === 'DELETE') {
      const removed = await store.removeFile(token, Number(match[2]));
      if (removed === 'locked') return json({ error: 'locked' }, 423);
      return removed ? json({ ok: true }) : notFound();
    }
    return notFound();
  }

  // ---- Seguimiento de proyectos
  if ((match = path.match(/^\/api\/proyectos\/([^/]+)$/)) && request.method === 'GET') {
    if (!TOKEN.test(match[1])) return notFound();
    const project = await store.project(match[1]);
    return project ? json({ ...project, stages: STAGES }) : notFound();
  }

  // ---- Panel privado
  if (path === '/api/admin' && request.method === 'GET') {
    return new Response(adminPage(), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
        'x-frame-options': 'DENY',
        'referrer-policy': 'no-referrer',
      },
    });
  }

  if (path.startsWith('/api/admin/')) {
    if (!env.ADMIN_CLAVE) return notFound();
    if (!isAdmin(request, env)) return json({ error: 'clave' }, 401);

    if ((match = path.match(/^\/api\/admin\/brief\/([^/]+)$/)) && request.method === 'GET') {
      if (!TOKEN.test(match[1])) return notFound();
      const brief = await store.briefForAdmin(match[1]);
      return brief ? json(brief) : notFound();
    }

    if ((match = path.match(/^\/api\/admin\/archivo\/(\d+)$/)) && request.method === 'GET') {
      const file = await store.readFile(Number(match[1]));
      if (!file) return notFound();
      return new Response(file.data, {
        headers: {
          'content-type': file.type || 'application/octet-stream',
          'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      });
    }

    if ((match = path.match(/^\/api\/admin\/brief-mail\/([^/]+)$/)) && request.method === 'POST') {
      if (!TOKEN.test(match[1])) return notFound();
      const inquiry = await store.quoteContact(match[1]);
      if (!inquiry) return notFound();
      const mailed = await sendAnyMail(env, inquiry.email, briefInviteMail({ lang: inquiry.lang, name: inquiry.name, link: `${quoteLink(inquiry.lang, match[1])}#brief` }));
      return json({ ok: mailed });
    }

    if (path === '/api/admin/probar-mail' && request.method === 'POST') {
      const body = (await readJson(request)) || {};
      const to = oneLine(body.to, 160).toLowerCase();
      if (!EMAIL.test(to)) return badRequest();
      const result = await resendSend(env, to, {
        subject: 'Prueba de envío · JNB Creative Studio',
        html: '<p style="font-family:Arial,sans-serif">Si te llegó este mail, los envíos del sitio funcionan. ✓</p>',
        text: 'Si te llegó este mail, los envíos del sitio funcionan.',
      });
      return json({
        ...result,
        from: cleanEnv(env.MAIL_FROM),
        replyTo: cleanEnv(env.MAIL_REPLY_TO),
        hasKey: Boolean(cleanEnv(env.RESEND_API_KEY)),
        keyStart: cleanEnv(env.RESEND_API_KEY).slice(0, 3),
        keyLooksRight: /re_[A-Za-z0-9_]{10,}/.test(cleanEnv(env.RESEND_API_KEY)),
      });
    }

    if (path === '/api/admin/disponibilidad' && request.method === 'POST') {
      const body = (await readJson(request)) || {};
      if (!['abierto', 'agenda', 'cerrado'].includes(body.estado)) return badRequest();
      const month = String(body.reservaDesde || '');
      if (month && !/^([1-9]|1[0-2])$/.test(month)) return badRequest();
      return json(await store.setAvailability(body.estado, month));
    }

    // Cerrar ahora / Abrir ahora / Volver al horario habitual (modo vacío)
    if (path === '/api/admin/horario' && request.method === 'POST') {
      const body = (await readJson(request)) || {};
      const modo = ['abierto', 'cerrado'].includes(body.modo) ? body.modo : '';
      const hasta = new Date(body.hasta || '');
      if (modo && (Number.isNaN(hasta.getTime()) || hasta <= new Date() || hasta - new Date() > 45 * DAY)) return badRequest();
      // Mensaje de ausencia (solo al cerrar): mismo-1..3 y dia-1..3 llevan hora de regreso; sin-1..3 no
      const mensaje = modo === 'cerrado' && /^(mismo|dia|sin)-[123]$/.test(body.mensaje || '') ? body.mensaje : '';
      const regreso = Boolean(mensaje) && !mensaje.startsWith('sin-');
      return json(await store.setHours(modo, modo ? hasta.toISOString() : '', mensaje, regreso));
    }

    if (path === '/api/admin/datos' && request.method === 'GET') {
      const data = await store.everything();
      data.availability = await store.availability();
      data.hours = await store.hours();
      data.mailReady = Boolean(cleanEnv(env.RESEND_API_KEY) && cleanEnv(env.MAIL_FROM));
      data.mailError = await store.mailError();
      data.sorteos = await store.giveawaysData();
      data.monotributo = await store.monotributo();
      data.backupMailed = await store.backupMailedAt();
      data.cotizador = await store.cotizadorData();
      return json(data);
    }

    if ((match = path.match(/^\/api\/admin\/reenviar\/([^/]+)$/)) && request.method === 'POST') {
      if (!CODE.test(match[1])) return notFound();
      const inquiry = await store.inquiryByCode(match[1]);
      if (!inquiry) return notFound();
      const link = inquiry.kind === 'presupuesto' ? quoteLink(inquiry.lang, inquiry.token) : null;
      const mailed = await sendMail(env, inquiry, link);
      if (mailed) await store.markMailed(inquiry.code);
      return json({ ok: mailed });
    }

    if ((match = path.match(/^\/api\/admin\/mail\/([^/]+)$/)) && request.method === 'GET') {
      if (!CODE.test(match[1])) return notFound();
      const inquiry = await store.inquiryByCode(match[1]);
      if (!inquiry) return notFound();
      const link = inquiry.kind === 'presupuesto' ? quoteLink(inquiry.lang, inquiry.token) : null;
      return new Response(confirmationMail(inquiry, link).html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }

    // Copia de seguridad de todo lo guardado (se descarga como archivo .json)
    if (path === '/api/admin/copia' && request.method === 'GET') {
      const copy = await store.backup();
      return new Response(JSON.stringify(copy, null, 1), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition': `attachment; filename="jnb-panel-copia-${copy.created.slice(0, 10)}.json"`,
          'cache-control': 'no-store',
        },
      });
    }

    if ((match = path.match(/^\/api\/admin\/clientes\/(\d+)\/archivos$/)) && request.method === 'GET') {
      return json({ files: await store.clientFiles(Number(match[1])) });
    }

    // ---- Gestor de tareas
    if (path === '/api/admin/tareas' && request.method === 'GET') return json(await store.tasksData());

    if (request.method !== 'POST') return notFound();
    const body = (await readJson(request)) || {};

    if (path === '/api/admin/tareas') {
      const id = Number(body.id) || 0;
      const ids = (list) => (Array.isArray(list) ? list.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 2000) : []);
      let ok = false;
      if (body.action === 'save') {
        const t = body.task || {};
        const task = {
          id: Number(t.id) || 0,
          title: text(t.title, 160),
          description: text(t.description, 4000),
          category: Number(t.category) || null,
          priority: TASK_PRIORITIES.includes(t.priority) ? t.priority : 'media',
          status: TASK_STATUSES.includes(t.status) ? t.status : 'inbox',
          due: /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') ? t.due : '',
          notes: text(t.notes, 4000),
          subtasks: (Array.isArray(t.subtasks) ? t.subtasks : []).slice(0, 100)
            .map((x) => ({ text: text(x && x.text, 300), done: Boolean(x && x.done) })).filter((x) => x.text),
        };
        if (!task.title) return badRequest();
        ok = await store.saveTask(task);
      } else if (body.action === 'move') {
        if (!id || !TASK_STATUSES.includes(body.status)) return badRequest();
        ok = await store.moveTask(id, body.status, ids(body.order));
      } else if (body.action === 'duplicate') {
        ok = await store.duplicateTask(id);
      } else if (body.action === 'archive') {
        ok = await store.archiveTasks(ids(body.ids), body.archived !== false);
      } else if (body.action === 'delete') {
        ok = await store.deleteTask(id);
      } else if (body.action === 'categories') {
        const list = (Array.isArray(body.categories) ? body.categories : []).slice(0, 40)
          .map((c) => ({ id: Number(c && c.id) || 0, name: text(c && c.name, 60) })).filter((c) => c.name);
        if (!list.length) return badRequest();
        ok = await store.saveTaskCategories(list);
      } else return badRequest();
      return ok ? json(await store.tasksData()) : notFound();
    }

    // ---- Sorteos de Instagram (sin conexión con Instagram: todo se carga a mano)
    if (path === '/api/admin/sorteos') {
      let saved;
      if (body.action === 'save') {
        const g = body.giveaway || {};
        const giveaway = {
          id: Number(g.id) || 0,
          name: oneLine(g.name, 120),
          post: text(g.post, 500),
          url: oneLine(g.url, 300),
          starts: isoDate(g.starts),
          ends: isoDate(g.ends),
          prize: text(g.prize, 500),
          conditions: text(g.conditions, 4000),
          drawDate: isoDate(g.drawDate),
          status: GIVEAWAY_STATUSES.includes(g.status) ? g.status : 'borrador',
        };
        if (!giveaway.name || (giveaway.url && !INSTAGRAM_URL.test(giveaway.url))) return badRequest();
        if (giveaway.starts && giveaway.ends && giveaway.ends < giveaway.starts) return badRequest();
        saved = await store.saveGiveaway(giveaway);
      } else if (body.action === 'archive') {
        saved = await store.archiveGiveaway(Number(body.id) || 0, body.archived !== false);
      } else return badRequest();
      if (saved.error === 'not found') return notFound();
      return json({ ...saved, ...(await store.giveawaysData()) });
    }

    if (path === '/api/admin/sorteos/ganadores') {
      const id = Number(body.id) || 0;
      let saved;
      if (body.action === 'save') {
        const w = body.winner || {};
        const instagram = oneLine(w.instagram, 40).replace(/^@/, '').toLowerCase();
        const winner = {
          id: Number(w.id) || 0,
          giveawayId: Number(w.giveawayId) || 0,
          name: oneLine(w.name, 100),
          instagram,
          profileUrl: oneLine(w.profileUrl, 300) || (instagram ? `https://www.instagram.com/${instagram}/` : ''),
          email: oneLine(w.email, 160),
          whatsapp: oneLine(w.whatsapp, 40),
          prize: oneLine(w.prize, 200),
          plan: ['premium', 'basico', 'emprendedor'].includes(w.plan) ? w.plan : '',
          announced: isoDate(w.announced),
          note: text(w.note, 2000),
        };
        if (!winner.name || !/^[a-z0-9._]{1,30}$/.test(instagram) || !winner.giveawayId || !INSTAGRAM_URL.test(winner.profileUrl)) return badRequest();
        if (winner.email) {
          if (!normEmail(winner.email)) return badRequest();
          winner.email = normEmail(winner.email);
        }
        if (winner.whatsapp && !/^\+?[0-9 ()-]{6,25}$/.test(winner.whatsapp)) return badRequest();
        saved = await store.saveWinner(winner);
      } else if (body.action === 'stage') {
        const stage = Number(body.stage);
        if (!Number.isInteger(stage) || stage < 0 || stage >= WINNER_STAGES.length) return badRequest();
        saved = await store.setWinnerStage(id, stage);
      } else if (body.action === 'track') {
        const briefLink = oneLine(body.briefLink, 300);
        if (briefLink && !HTTPS_URL.test(briefLink)) return badRequest();
        saved = await store.trackWinner(id, {
          internalNotes: text(body.internalNotes, 4000),
          nextTask: oneLine(body.nextTask, 200),
          followUp: isoDate(body.followUp),
          msgCongrats: text(body.msgCongrats, 2000),
          msgBrief: text(body.msgBrief, 2000),
          briefLink,
        });
      } else if (body.action === 'mark') {
        const date = body.date === '' ? '' : (isoDate(body.date) || new Date().toISOString().slice(0, 10));
        saved = await store.markWinner(id, String(body.field || ''), date);
      } else if (body.action === 'client') {
        saved = await store.winnerToClient(id);
      } else if (body.action === 'project') {
        saved = await store.winnerProject(id);
      } else if (body.action === 'task') {
        saved = await store.winnerTask(id);
      } else return badRequest();
      if (saved.error === 'not found' || saved.error === 'giveaway') return notFound();
      if (saved.error === 'duplicate') return json(saved, 409);
      if (saved.error) return badRequest();
      return json({ ...saved, ...(await store.giveawaysData()) });
    }

    // ---- Agenda: vencimientos de clientes y fecha de material completo de cada proyecto
    if (path === '/api/admin/agenda') {
      let saved;
      if (body.action === 'renewal') {
        const r = body.renewal || {};
        const item = {
          id: Number(r.id) || 0,
          clientId: Number(r.clientId) || 0,
          project: TOKEN.test(r.project || '') ? r.project : '',
          kind: RENEWAL_KINDS.includes(r.kind) ? r.kind : 'otro',
          label: oneLine(r.label, 120),
          due: isoDate(r.due),
          amount: oneLine(r.amount, 40),
          note: text(r.note, 1000),
        };
        if (!item.due || (item.kind === 'otro' && !item.label)) return badRequest();
        saved = await store.saveRenewal(item);
      } else if (body.action === 'renewal-done') {
        saved = await store.renewalDone(Number(body.id) || 0, body.done !== false);
      } else if (body.action === 'renewal-delete') {
        saved = await store.deleteRenewal(Number(body.id) || 0);
      } else if (body.action === 'quote-followup') {
        if (!TOKEN.test(body.token || '')) return badRequest();
        saved = await store.quoteFollowup(body.token);
      } else if (body.action === 'material') {
        if (!TOKEN.test(body.project || '')) return badRequest();
        saved = await store.setMaterials(body.project, body.date === '' ? '' : (isoDate(body.date) || arToday()));
      } else return badRequest();
      if (saved.error === 'not found') return notFound();
      if (saved.error) return badRequest();
      return json({ ok: true, ...saved });
    }

    // ---- Números: origen de cada cliente y datos del monotributo
    if (path === '/api/admin/numeros') {
      if (body.action === 'source') {
        const saved = await store.setClientSource(Number(body.clientId) || 0, CLIENT_SOURCES.includes(body.source) ? body.source : '');
        return saved.error ? notFound() : json(saved);
      }
      if (body.action === 'monotributo') {
        const num = (v) => Math.min(Number(String(v || '').replace(/[^0-9]/g, '')) || 0, 1e12);
        // Mes desde el que se cuentan los ingresos (AAAA-MM); por defecto diciembre 2026
        const desde = /^\d{4}-(0[1-9]|1[0-2])$/.test(body.desde || '') ? body.desde : '2026-12';
        return json(await store.setMonotributo(num(body.tope), num(body.cotizacion), desde));
      }
      return badRequest();
    }

    // ---- Cotizador: catálogo de funcionalidades y cotización del dólar
    if (path === '/api/admin/cotizador') {
      let saved;
      // Montos con puntos de miles (18.990) y decimales con coma o punto (2,5 · 1580.90)
      const num = (v, max) => { let t = String(v ?? '').trim(); if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); const n = Number(t.replace(',', '.')); return t !== '' && Number.isFinite(n) && n >= 0 && n <= max ? n : NaN; };
      if (body.action === 'save') {
        const f = body.feature || {};
        const item = { id: Number(f.id) || 0, name: oneLine(f.name, 120), description: text(f.description, 600),
          category: QUOTE_CATEGORIES.includes(f.category) ? f.category : '', hours: num(f.hours, 1000),
          nameEn: oneLine(f.nameEn, 120), descEn: text(f.descEn, 600), namePt: oneLine(f.namePt, 120), descPt: text(f.descPt, 600) };
        if (!item.name || !item.category || !(item.hours > 0)) return badRequest();
        saved = await store.saveFeature(item);
      } else if (body.action === 'delete') {
        saved = await store.deleteFeature(Number(body.id) || 0);
      } else if (body.action === 'rate') {
        const rate = num(body.rate, 1e6);
        const hour = num(body.hour, 1e8);
        if (!(rate > 0) || !(hour > 0)) return badRequest();
        saved = await store.setQuoteRate(rate, Math.round(hour));
      } else return badRequest();
      if (saved.error === 'not found') return notFound();
      if (saved.error) return json(saved, 409);
      return json({ ...saved, cotizador: await store.cotizadorData() });
    }

    // ---- Brief: mandarle por mail a un cliente el link de su brief (proyecto creado desde el módulo Brief)
    if (path === '/api/admin/brief-invitar') {
      if (!TOKEN.test(body.token || '')) return badRequest();
      const c = await store.projectInvite(body.token);
      if (!c) return notFound();
      if (!c.email) return json({ ok: false, error: 'email' });
      const mailed = await sendAnyMail(env, c.email, briefInviteMail({ lang: c.lang, name: c.name, link: `${projectLink(c.lang, body.token)}#brief` }));
      if (mailed) await store.logInvite(body.token);
      return json({ ok: mailed });
    }

    if (path === '/api/admin/reiniciar') {
      if (body.confirm !== 'REINICIAR') return badRequest();
      await store.resetAll();
      return json({ ok: true });
    }

    // ---- Clientes
    const clientData = () => ({
      name: oneLine(body.name, 100),
      email: oneLine(body.email, 160),
      phone: oneLine(body.phone, 40),
      status: CLIENT_STATUSES.includes(body.status) ? body.status : '',
      note: text(body.note, 2000),
    });
    if (path === '/api/admin/clientes') {
      const data = clientData();
      if (!data.name || (data.email && !normEmail(data.email))) return badRequest();
      const saved = await store.addClient(data);
      return saved.error ? json(saved, 409) : json(saved);
    }
    if ((match = path.match(/^\/api\/admin\/clientes\/(\d+)$/))) {
      const data = clientData();
      if (!data.name || (data.email && !normEmail(data.email))) return badRequest();
      const saved = await store.setClient(Number(match[1]), data);
      if (saved.error === 'not found') return notFound();
      return saved.error ? json(saved, 409) : json(saved);
    }
    if ((match = path.match(/^\/api\/admin\/clientes\/(\d+)\/unir$/))) {
      const into = Number(body.into);
      if (!Number.isInteger(into)) return badRequest();
      return (await store.mergeClients(Number(match[1]), into)) ? json({ ok: true }) : notFound();
    }
    if (path === '/api/admin/duplicados/descartar') {
      const a = Number(body.a);
      const b = Number(body.b);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return badRequest();
      await store.dismissDuplicate(a, b);
      return json({ ok: true });
    }

    // ---- Pagos
    const paymentData = () => ({
      project: String(body.project || ''),
      concept: oneLine(body.concept, 60),
      currency: body.currency === 'USD' ? 'USD' : '$',
      amount: Number(String(body.amount || '').replace(/[^0-9]/g, '')),
      due: isoDate(body.due),
      paid: isoDate(body.paid),
      method: oneLine(body.method, 40),
      note: text(body.note, 500),
      remove: body.remove === true,
    });
    if (path === '/api/admin/pagos') {
      const data = paymentData();
      if (!TOKEN.test(data.project) || !data.concept || !data.amount) return badRequest();
      return (await store.addPayment(data)) ? json({ ok: true }) : notFound();
    }
    if ((match = path.match(/^\/api\/admin\/pagos\/(\d+)$/))) {
      const data = paymentData();
      if (!data.remove && (!data.concept || !data.amount)) return badRequest();
      return (await store.setPayment(Number(match[1]), data)) ? json({ ok: true }) : notFound();
    }

    // ---- Consultas nuevas: marcar como vistas (una, varias o todas)
    if (path === '/api/admin/consultas/vistas') {
      const codes = body.all === true ? 'all' : (Array.isArray(body.codes) ? body.codes.filter((c) => CODE.test(c)).slice(0, 500) : []);
      await store.markSeen(codes);
      return json({ ok: true });
    }

    if ((match = path.match(/^\/api\/admin\/presupuestos\/([^/]+)$/))) {
      if (!TOKEN.test(match[1])) return notFound();
      const status = ['recibido', 'preparando', 'enviado', 'aceptado'].includes(body.status) ? body.status : 'recibido';
      const proposal = SHOWN_STATUSES.includes(status) ? {
        price: oneLine(body.price, 80),
        // Referencia en dólares junto al precio en pesos (clientes en español)
        priceUsd: oneLine(body.priceUsd, 40),
        includes: text(body.includes, 2000),
        validUntil: isoDate(body.validUntil),
        note: text(body.note, 1500),
        conditions: text(body.conditions, 2000),
        // Link del plan en la tienda de Tiendanube (para pagar en cuotas). Solo se aceptan links de la tienda.
        storeLink: typeof body.storeLink === 'string' && STORE_LINK.test(body.storeLink.trim()) ? body.storeLink.trim() : '',
      } : null;
      if (proposal && !proposal.price) return badRequest();
      // Opciones para que el cliente compare y elija (las arma el cotizador): hasta 3, cada una con nombre, precio y qué incluye
      if (proposal) {
        let options = body.options;
        if (typeof options === 'string') { try { options = JSON.parse(options || '[]'); } catch { options = []; } }
        proposal.options = (Array.isArray(options) ? options : []).slice(0, 3)
          .map((o) => ({ name: oneLine(o && o.name, 80), price: oneLine(o && o.price, 80), priceUsd: oneLine(o && o.priceUsd, 40), includes: text(o && o.includes, 2000), recommended: Boolean(o && o.recommended) }))
          .filter((o) => o.name && o.price);
        if (proposal.options.length < 2) delete proposal.options;
        const chosen = Number(body.chosen);
        if (proposal.options && body.chosen !== '' && body.chosen !== undefined && Number.isInteger(chosen) && chosen >= 0 && chosen < proposal.options.length) proposal.chosen = chosen;
      }
      const result = await store.setQuote(match[1], status, proposal);
      if (!result) return notFound();
      // Recién aceptado: se crea el proyecto y le llega al cliente el link para completar su brief
      let briefMailed = false;
      if (result.created) {
        try {
          briefMailed = await sendAnyMail(env, result.email, briefInviteMail({ lang: result.lang, name: result.name, link: `${quoteLink(result.lang, match[1])}#brief` }));
        } catch { /* el proyecto quedó creado igual */ }
      }
      // Propuesta lista: aviso por mail con el link (si Jimena lo dejó marcado)
      let proposalMailed = false;
      if (body.notify === true && status === 'enviado') {
        const contact = await store.quoteContact(match[1]);
        if (contact) {
          try { proposalMailed = await sendAnyMail(env, contact.email, proposalMail({ lang: contact.lang, name: contact.name, link: quoteLink(contact.lang, match[1]) })); } catch { /* la propuesta quedó guardada */ }
          if (proposalMailed) await store.logQuoteEvent(match[1], '📧', 'Le avisaste por mail que su propuesta está lista');
        }
      }
      return json({ ok: true, created: Boolean(result.created), briefMailed, proposalMailed });
    }

    if (path === '/api/admin/resenas/invitar') {
      const client = oneLine(body.client, 100);
      if (!client) return badRequest();
      return json({ token: await store.invite(client) });
    }

    if ((match = path.match(/^\/api\/admin\/resenas\/(\d+)$/))) {
      if (!['aprobada', 'oculta', 'pendiente', 'borrar'].includes(body.status)) return badRequest();
      await store.setReview(Number(match[1]), body.status);
      return json({ ok: true });
    }

    if (path === '/api/admin/proyectos') {
      const project = {
        client: oneLine(body.client, 80),
        project: oneLine(body.project, 120),
        lang: LANGS.has(body.lang) ? body.lang : 'es',
        due: isoDate(body.due),
        // Cliente existente (clientId) o uno nuevo: nombre completo, mail y teléfono (si el mail ya existe, se usa esa ficha)
        clientId: Number.isInteger(Number(body.clientId)) && Number(body.clientId) > 0 ? Number(body.clientId) : 0,
        fullName: oneLine(body.fullName, 100),
        email: oneLine(body.email, 160),
        phone: oneLine(body.phone, 40),
        request: text(body.request, 2000),
      };
      if (!project.client || !project.project) return badRequest();
      if (project.email && !normEmail(project.email)) return badRequest();
      return json({ token: await store.addProject(project) });
    }

    if ((match = path.match(/^\/api\/admin\/proyectos\/([^/]+)$/))) {
      if (!TOKEN.test(match[1])) return notFound();
      const stage = Number(body.stage);
      const changes = {
        remove: body.remove === true,
        stage: Number.isInteger(stage) && stage >= 0 && stage < STAGES ? stage : 0,
        due: isoDate(body.due),
        note: text(body.note, 1000),
        next: text(body.next, 400),
        // Vista previa: solo links https (por ejemplo la demo en Vercel)
        preview: typeof body.preview === 'string' && /^https:\/\/[^\s"<>]+$/.test(body.preview.trim()) ? body.preview.trim().slice(0, 300) : '',
      };
      const result = await store.setProject(match[1], changes);
      if (!result) return notFound();
      if (result.error) return json(result, 409);
      // Recién publicado: mail al cliente con la reseña (opcional) y su cupón
      let launchMailed = false;
      if (result.launched && result.email) {
        const lang = result.lang;
        const page = result.fromQuote ? quoteLink(lang, result.linkToken) : projectLink(lang, result.linkToken);
        try {
          launchMailed = await sendAnyMail(env, result.email, launchMail({
            lang, name: result.name, page,
            reviewLink: `${SITE}/resena/${lang === 'es' ? '' : lang}?c=${result.reviewToken}`,
            coupon: result.coupon, percent: COUPON_PERCENT, store: result.store, expires: result.expires,
            budgetLink: `${SITE}/presupuesto/${lang === 'es' ? '' : lang}?plan=update&cupon=${result.coupon}`,
          }));
        } catch { /* el cupón y la reseña quedaron creados igual */ }
      }
      let stageMailed = false;
      if (result.stageChanged && body.notify === true && result.email) {
        const page = result.fromQuote ? quoteLink(result.lang, result.linkToken) : projectLink(result.lang, result.linkToken);
        try { stageMailed = await sendAnyMail(env, result.email, stageMail({ lang: result.lang, name: result.name, link: page, stage: result.stage, store: result.store })); } catch { /* la etapa quedó guardada */ }
      }
      return json({ ok: true, launched: Boolean(result.launched), launchMailed, stageMailed, coupon: result.coupon || '' });
    }
  }

  return notFound();
}
