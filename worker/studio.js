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
import { confirmationMail, briefInviteMail, briefReceivedMail, briefUpdatedMail, launchMail } from './mail.js';

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

const text = (value, max) => (typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');
const oneLine = (value, max) => text(value, max).replace(/\s+/g, ' ');
const isoDate = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '');

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
  }

  // ---- Consultas y pedidos de presupuesto
  addInquiry(data) {
    const now = new Date();
    this.sql.exec('DELETE FROM inquiries WHERE created < ?', new Date(now - KEEP_INQUIRIES_DAYS * DAY).toISOString());
    // Freno para envíos automáticos: como mucho 5 por mail por hora
    const lastHour = new Date(now - DAY / 24).toISOString();
    if (this.sql.exec('SELECT COUNT(*) AS n FROM inquiries WHERE email = ? AND created > ?', data.email, lastHour).one().n >= 5) return null;
    let code = newCode(now);
    while (this.sql.exec('SELECT 1 FROM inquiries WHERE code = ?', code).toArray().length) code = newCode(now);
    const token = newToken();
    // El cupón se guarda solo si es válido en este momento
    const coupon = data.coupon && this.couponState(data.coupon).valid ? data.coupon : '';
    this.sql.exec(`INSERT INTO inquiries (code, token, kind, created, lang, name, email, plan, message, coupon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, code, token, data.kind, now.toISOString(), data.lang, data.name, data.email, data.plan, data.message, coupon);
    return { code, token, created: now.toISOString(), coupon };
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
    const row = this.sql.exec("SELECT proposal, name, plan, lang FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0];
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
      this.addProject({ client: row.name.split(' ')[0], project: row.plan || '—', lang: row.lang, due: '', quote: token });
      created = true;
    }
    // La fecha de emisión se fija la primera vez que se envía y no cambia al corregir la propuesta
    if (proposal) proposal.issued = (row.proposal && JSON.parse(row.proposal).issued) || new Date().toISOString();
    this.sql.exec('UPDATE inquiries SET status = ?, proposal = ? WHERE token = ?', status, proposal ? JSON.stringify(proposal) : null, token);
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
    this.sql.exec(`INSERT INTO projects (token, client, project, lang, due, quote, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      token, project.client, project.project, project.lang, project.due, project.quote || '', now, now);
    this.logEvent(token, '🤝', project.quote ? 'Aceptó el presupuesto: se creó el proyecto y se le pidió el brief' : 'Proyecto creado a mano');
    return token;
  }

  project(token) {
    const row = this.sql.exec('SELECT client, project, lang, stage, due, note, next, preview, updated, review_token, coupon FROM projects WHERE token = ?', token).toArray()[0];
    return this.withBrief(this.withLaunch(row || null), token);
  }

  setProject(token, changes) {
    if (changes.remove) {
      this.sql.exec('DELETE FROM projects WHERE token = ?', token);
      return true;
    }
    const project = this.sql.exec('SELECT stage, client, lang, quote, coupon, project FROM projects WHERE token = ?', token).toArray()[0];
    if (!project) return false;
    this.sql.exec('UPDATE projects SET stage = ?, due = ?, note = ?, next = ?, preview = ?, updated = ? WHERE token = ?',
      changes.stage, changes.due, changes.note, changes.next, changes.preview, new Date().toISOString(), token);
    if (changes.stage !== project.stage) this.logEvent(token, '📍', `Etapa: ${STAGE_NAMES[changes.stage] || changes.stage}`);
    if (changes.stage !== LAUNCH_STAGE || project.coupon) return true;
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
    const project = this.sql.exec("SELECT project, lang, client FROM projects WHERE token = ? AND quote = ''", token).toArray()[0];
    return project ? { planText: project.project, lang: project.lang, client: project.client, code: '', request: '' } : null;
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
      inquiries: this.sql.exec(`SELECT code, token, kind, created, lang, name, email, plan, message, status, proposal, mailed, coupon
        FROM inquiries ORDER BY created DESC LIMIT 300`).toArray()
        .map((row) => ({ ...row, proposal: row.proposal ? JSON.parse(row.proposal) : null })),
      invitations: this.sql.exec('SELECT token, client, created, used FROM invitations ORDER BY created DESC LIMIT 200').toArray(),
      reviews: this.sql.exec('SELECT id, created, lang, name, business, body, status FROM reviews ORDER BY created DESC').toArray(),
      projects: this.sql.exec(`SELECT p.token, p.client, p.project, p.lang, p.stage, p.due, p.note, p.next, p.preview, p.created, p.updated,
        p.coupon, (SELECT used_inquiry FROM coupons c WHERE c.code = p.coupon) AS couponUsedBy,
        p.review_token AS reviewToken, (SELECT used FROM invitations v WHERE v.token = p.review_token) AS reviewDone,
        p.quote, i.code AS quoteCode, b.status AS briefStatus, b.sent AS briefSent, b.updated AS briefUpdated,
        b.edited AS briefEdited, CASE WHEN b.edit_seen = 0 THEN 1 ELSE 0 END AS briefEditUnseen,
        (SELECT COUNT(*) FROM brief_files f WHERE f.token = (CASE WHEN p.quote != '' THEN p.quote ELSE p.token END)) AS briefFiles
        FROM projects p
        LEFT JOIN inquiries i ON i.token = p.quote AND p.quote != ''
        LEFT JOIN briefs b ON b.token = (CASE WHEN p.quote != '' THEN p.quote ELSE p.token END)
        ORDER BY p.updated DESC`).toArray(),
      coupons: this.sql.exec(`SELECT c.code, c.client, c.email, c.lang, c.percent, c.created, c.expires, c.used_inquiry AS usedBy, c.used_at AS usedAt
        FROM coupons c ORDER BY c.created DESC`).toArray(),
      events: this.sql.exec('SELECT project, at, icon, text FROM project_events ORDER BY at DESC LIMIT 3000').toArray(),
      minPublicReviews: MIN_PUBLIC_REVIEWS,
    };
  }
}

// ---- Envío del mail de confirmación (Resend). Sin claves cargadas, no se manda y no pasa nada.
async function sendMail(env, inquiry, link) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return false;
  const mail = confirmationMail(inquiry, link);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [inquiry.email],
      reply_to: env.MAIL_REPLY_TO || undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  return res.ok;
}

const quoteLink = (lang, token) => `${SITE}/mi-presupuesto/${lang === 'es' ? '' : lang}?c=${token}`;
const projectLink = (lang, token) => `${SITE}/mi-proyecto/${lang === 'es' ? '' : lang}?c=${token}`;

// Mail cualquiera por Resend (sin claves cargadas, no hace nada)
async function sendAnyMail(env, to, mail) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !to) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], reply_to: env.MAIL_REPLY_TO || undefined, subject: mail.subject, html: mail.html, text: mail.text }),
  });
  return res.ok;
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
    return new Response(JSON.stringify({ estado, reservaDesde }), {
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

    if (path === '/api/admin/disponibilidad' && request.method === 'POST') {
      const body = (await readJson(request)) || {};
      if (!['abierto', 'agenda', 'cerrado'].includes(body.estado)) return badRequest();
      const month = String(body.reservaDesde || '');
      if (month && !/^([1-9]|1[0-2])$/.test(month)) return badRequest();
      return json(await store.setAvailability(body.estado, month));
    }

    if (path === '/api/admin/datos' && request.method === 'GET') {
      const data = await store.everything();
      data.availability = await store.availability();
      data.mailReady = Boolean(env.RESEND_API_KEY && env.MAIL_FROM);
      return json(data);
    }

    if ((match = path.match(/^\/api\/admin\/mail\/([^/]+)$/)) && request.method === 'GET') {
      if (!CODE.test(match[1])) return notFound();
      const inquiry = await store.inquiryByCode(match[1]);
      if (!inquiry) return notFound();
      const link = inquiry.kind === 'presupuesto' ? quoteLink(inquiry.lang, inquiry.token) : null;
      return new Response(confirmationMail(inquiry, link).html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }

    if (request.method !== 'POST') return notFound();
    const body = (await readJson(request)) || {};

    if ((match = path.match(/^\/api\/admin\/presupuestos\/([^/]+)$/))) {
      if (!TOKEN.test(match[1])) return notFound();
      const status = ['recibido', 'preparando', 'enviado', 'aceptado'].includes(body.status) ? body.status : 'recibido';
      const proposal = SHOWN_STATUSES.includes(status) ? {
        price: oneLine(body.price, 80),
        includes: text(body.includes, 2000),
        validUntil: isoDate(body.validUntil),
        note: text(body.note, 1500),
        conditions: text(body.conditions, 2000),
        // Link del plan en la tienda de Tiendanube (para pagar en cuotas). Solo se aceptan links de la tienda.
        storeLink: typeof body.storeLink === 'string' && STORE_LINK.test(body.storeLink.trim()) ? body.storeLink.trim() : '',
      } : null;
      if (proposal && !proposal.price) return badRequest();
      const result = await store.setQuote(match[1], status, proposal);
      if (!result) return notFound();
      // Recién aceptado: se crea el proyecto y le llega al cliente el link para completar su brief
      let briefMailed = false;
      if (result.created) {
        try {
          briefMailed = await sendAnyMail(env, result.email, briefInviteMail({ lang: result.lang, name: result.name, link: `${quoteLink(result.lang, match[1])}#brief` }));
        } catch { /* el proyecto quedó creado igual */ }
      }
      return json({ ok: true, created: Boolean(result.created), briefMailed });
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
      };
      if (!project.client || !project.project) return badRequest();
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
      return json({ ok: true, launched: Boolean(result.launched), launchMailed, coupon: result.coupon || '' });
    }
  }

  return notFound();
}
