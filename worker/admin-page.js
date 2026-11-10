// Panel privado de Jimena (/api/admin). La página se carga sin datos; los datos llegan solo con la clave ADMIN_CLAVE,
// que se escribe una vez y queda guardada en esta pestaña (sessionStorage) hasta cerrarla.

export const adminPage = () => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Panel | JNB Creative Studio</title>
<link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">
<style>
  :root { color-scheme: light; --bg: #f3ebf6; --card: #ecdff4; --soft: #e2d0f0; --text: #211632; --muted: #625970; --line: #d9c6e8;
    --accent: #7543d6; --accent-ink: #5d31b8; --on-accent: #f3ebf6; --ok: #1f7a4d; --warn: #9a5b00; }
  @media (prefers-color-scheme: dark) { :root { color-scheme: dark; --bg: #100b1d; --card: #211938; --soft: #2a2047; --text: #f4f0ff;
    --muted: #b6aecf; --line: #2f2549; --accent: #9b6dff; --accent-ink: #b9a0ff; --on-accent: #100b1d; --ok: #6fd3a0; --warn: #f2b45c; } }
  * { box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font: 15px/1.5 Manrope, system-ui, sans-serif; margin: 0; }
  .wrap { margin: 0 auto; max-width: 60rem; padding: 1.25rem 1rem 4rem; }
  header { align-items: center; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: space-between; margin-bottom: 1rem; }
  .brand { align-items: center; display: flex; font-weight: 800; gap: .5rem; }
  .mark { background: #24185a; border-radius: .5rem; color: #f3ebf6; font-size: .8rem; padding: .35rem .45rem; }
  h1 { font-size: 1.35rem; margin: 0; } h2 { font-size: 1.1rem; margin: 0 0 .75rem; } h3 { font-size: 1rem; margin: 0; }
  p { margin: 0 0 .5rem; } .muted { color: var(--muted); } .small { font-size: .85rem; }
  nav { display: flex; flex-wrap: wrap; gap: .4rem; margin: 0 0 1.25rem; }
  button, .btn { background: var(--card); border: 1px solid var(--line); border-radius: 999px; color: var(--text); cursor: pointer;
    font: inherit; font-size: .875rem; font-weight: 700; padding: .45rem .9rem; text-decoration: none; }
  button:hover, .btn:hover { border-color: var(--accent); color: var(--accent-ink); }
  button.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  nav button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .badge { background: var(--soft); border-radius: 999px; font-size: .75rem; font-weight: 800; margin-left: .3rem; padding: .05rem .5rem; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 1rem; margin-bottom: .75rem; padding: 1rem 1.1rem; }
  .row { align-items: center; display: flex; flex-wrap: wrap; gap: .5rem .75rem; }
  .row.space { justify-content: space-between; }
  .chip { background: var(--soft); border-radius: 999px; font-size: .75rem; font-weight: 800; padding: .15rem .6rem; }
  .chip.ok { color: var(--ok); } .chip.warn { color: var(--warn); }
  .code { color: var(--accent-ink); font-weight: 800; letter-spacing: .03em; }
  .message { border-left: 3px solid var(--line); margin: .6rem 0; padding-left: .75rem; white-space: pre-wrap; }
  label { display: grid; font-size: .85rem; font-weight: 700; gap: .25rem; }
  input, select, textarea { background: var(--bg); border: 1px solid var(--line); border-radius: .6rem; color: var(--text); font: inherit; padding: .5rem .65rem; width: 100%; }
  textarea { min-height: 5rem; resize: vertical; }
  .grid { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); margin: .75rem 0; }
  details > summary { cursor: pointer; font-weight: 700; margin-top: .5rem; }
  table { border-collapse: collapse; width: 100%; } th, td { border-bottom: 1px solid var(--line); padding: .45rem .4rem; text-align: left; }
  td.n, th.n { text-align: right; }
  .linkbox { background: var(--soft); border-radius: .6rem; font-size: .85rem; margin: .6rem 0; overflow-wrap: anywhere; padding: .55rem .75rem; }
  .empty { color: var(--muted); padding: 1rem 0; }
  .login { margin: 15vh auto 0; max-width: 22rem; }
  .stepper { display: grid; gap: .4rem; grid-template-columns: repeat(5, minmax(0, 1fr)); margin-bottom: .25rem; }
  .step { align-items: center; border-radius: .8rem; display: flex; flex-direction: column; gap: .3rem; padding: .6rem .35rem; text-align: center; }
  .step-num { align-items: center; background: var(--bg); border: 1px solid var(--line); border-radius: 50%; display: flex; font-size: .8rem;
    height: 1.7rem; justify-content: center; width: 1.7rem; }
  .step-name { font-size: .75rem; line-height: 1.25; }
  .step.is-done { color: var(--muted); }
  .step.is-done .step-num { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .step[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .step[aria-pressed="true"] .step-num { background: var(--on-accent); border-color: var(--on-accent); color: var(--accent); }
  .step:disabled { cursor: progress; opacity: .7; }
  @media (max-width: 560px) { .stepper { grid-template-columns: 1fr; } .step { flex-direction: row; justify-content: flex-start; padding: .45rem .7rem; text-align: left; } .step-name { font-size: .85rem; } }
  .toast { background: var(--accent); border-radius: 999px; bottom: 1.25rem; color: var(--on-accent); font-weight: 800; left: 50%;
    padding: .55rem 1.1rem; position: fixed; transform: translateX(-50%); }
  dialog.brief-view { background: var(--bg); border: 1px solid var(--line); border-radius: 1rem; color: var(--text); max-height: 90vh; max-width: 46rem; padding: 0; width: calc(100% - 2rem); }
  dialog.brief-view::backdrop { background: rgba(16, 11, 29, .55); }
  .brief-view-head { align-items: center; background: var(--card); border-bottom: 1px solid var(--line); display: flex; gap: .75rem; justify-content: space-between; padding: .9rem 1.1rem; position: sticky; top: 0; }
  .brief-view-body { padding: 1rem 1.1rem 1.5rem; }
  .brief-view-section { color: var(--accent-ink); font-size: .75rem; font-weight: 800; letter-spacing: .08em; margin: 1.4rem 0 .5rem; text-transform: uppercase; }
  .brief-view-q { font-size: .85rem; font-weight: 800; margin: .8rem 0 .15rem; }
  .brief-view-a { margin: 0; white-space: pre-line; }
  .brief-files-list { display: grid; gap: .4rem; list-style: none; margin: .5rem 0 0; padding: 0; }
  .brief-files-list li { align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: .6rem; display: flex; gap: .6rem; padding: .45rem .7rem; }
  .brief-files-list span { flex: 1; overflow-wrap: anywhere; }
  .alert { background: #fff1d6; border: 1px solid #f2b45c; border-radius: .8rem; color: #5c3a00; font-weight: 700; margin-bottom: .9rem; padding: .7rem .9rem; }
  @media (prefers-color-scheme: dark) { .alert { background: #3a2a10; border-color: #9a6a1f; color: #ffd99a; } }
  .chip.alert-chip { background: #f2b45c; color: #3a2400; }
  .brief-view-a.is-changed { background: color-mix(in srgb, #f2b45c 22%, transparent); border-radius: .4rem; padding: .2rem .4rem; }
  .brief-view-prev { color: var(--muted); font-size: .85rem; margin: .2rem 0 0; text-decoration: line-through; white-space: pre-line; }
  .tag-edit { background: #f2b45c; border-radius: 999px; color: #3a2400; font-size: .7rem; font-weight: 800; margin-left: .35rem; padding: .05rem .45rem; vertical-align: .1em; }
  .avail-options { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin: .75rem 0; }
  .avail-option { align-items: flex-start; background: var(--bg); border: 1px solid var(--line); border-radius: .8rem; cursor: pointer; display: flex; font-weight: 700; gap: .55rem; padding: .7rem .8rem; }
  .avail-option:has(input:checked) { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .avail-option input { accent-color: var(--accent); margin-top: .2rem; width: auto; }
  .avail-dot { border-radius: 50%; display: inline-block; flex-shrink: 0; height: .65rem; margin-top: .4rem; width: .65rem; }
  .avail-preview { background: var(--bg); border: 1px dashed var(--line); border-radius: .8rem; margin: .5rem 0 .75rem; padding: .6rem .8rem; }
  [hidden] { display: none !important; }
</style></head>
<body><div class="wrap">
  <form class="card login" id="login" hidden>
    <div class="brand" style="margin-bottom:.75rem"><span class="mark">JNB</span> Panel</div>
    <label>Clave del panel<input type="password" id="key" autocomplete="current-password" required></label>
    <p class="small muted" id="login-error" style="margin-top:.5rem" hidden>La clave no es correcta.</p>
    <button class="primary" style="margin-top:.75rem">Entrar</button>
  </form>

  <div id="app" hidden>
    <header>
      <div class="brand"><span class="mark">JNB</span><h1>Panel</h1></div>
      <div class="row"><a class="btn" href="/" target="_blank">Ver el sitio ↗</a><button id="logout">Salir</button></div>
    </header>
    <section id="availability"></section>
    <nav id="tabs">
      <button data-tab="consultas" aria-pressed="true">Consultas <span class="badge" id="n-consultas"></span></button>
      <button data-tab="resenas" aria-pressed="false">Reseñas <span class="badge" id="n-resenas"></span></button>
      <button data-tab="proyectos" aria-pressed="false">Proyectos <span class="badge" id="n-proyectos"></span></button>
      <button data-tab="faq" aria-pressed="false">Preguntas frecuentes</button>
    </nav>
    <section id="tab-consultas"></section>
    <section id="tab-resenas" hidden></section>
    <section id="tab-proyectos" hidden></section>
    <section id="tab-faq" hidden></section>
  </div>
  <dialog class="brief-view" id="brief-view"><div class="brief-view-head"><strong id="brief-view-title">Brief</strong><div class="row"><button type="button" id="brief-view-print">Imprimir</button><button type="button" id="brief-view-close">Cerrar</button></div></div><div class="brief-view-body" id="brief-view-body"></div></dialog>
  <div class="toast" id="toast" role="status" hidden></div>
</div>
<script>
(() => {
  const STAGES = ['Reserva y confirmación', 'Recepción de materiales', 'Diseño y desarrollo', 'Revisión y ajustes', 'Publicación y entrega'];
  const STATUS = { recibido: 'Recibido', preparando: 'Preparando', enviado: 'Enviado', aceptado: 'Aceptado' };
  const SENT = ['enviado', 'aceptado'];
  // Condiciones sugeridas para cada presupuesto, sacadas de lo que ya dicen Términos y Preguntas frecuentes.
  // Se completan solas según el plan y el idioma del cliente; se pueden editar en cada presupuesto.
  const defaultConditions = (plan, lang) => {
    const isStore = /emprendedor|empreendedor/i.test(plan);
    const isPlan = /b[aá]sico|basic|premium|emprendedor|empreendedor/i.test(plan);
    const rounds = /premium/i.test(plan) ? 3 : 1;
    const T = {
      es: [
        'El trabajo empieza cuando se confirma el anticipo o la compra en mi tienda.',
        'El plazo de entrega se cuenta desde que recibo todo el material: textos, fotos, logo, colores y datos de contacto.',
        isPlan ? (rounds === 1 ? 'Incluye 1 ronda de ajustes' : 'Incluye 3 rondas de ajustes') + (isStore ? ' mientras armo tu tienda.' : ' mientras armo tu web.') + ' Los cambios que amplían lo acordado se cotizan aparte.' : '',
        isStore ? 'El dominio se gestiona desde tu plan de Tiendanube o Empretienda.' : 'El dominio se registra a tu nombre y su costo está a tu cargo. La publicación en mi cuenta de Cloudflare no tiene costo para vos.',
      ],
      en: [
        'Work starts once the deposit is confirmed.',
        'The delivery time starts once I receive all the content: texts, photos, logo, colors and contact details.',
        isPlan ? (rounds === 1 ? 'Includes 1 round of adjustments' : 'Includes 3 rounds of adjustments') + (isStore ? ' while I build your store.' : ' while I build your website.') + ' Changes that go beyond what we agreed are quoted separately.' : '',
        isStore ? 'The domain is managed from your Tiendanube or Empretienda plan.' : 'The domain is registered in your name and you cover its cost. Publishing on my Cloudflare account is free for you.',
      ],
      pt: [
        'O trabalho começa quando o sinal ou a compra na minha loja é confirmado.',
        'O prazo de entrega é contado a partir do recebimento de todo o material: textos, fotos, logo, cores e dados de contato.',
        isPlan ? (rounds === 1 ? 'Inclui 1 rodada de ajustes' : 'Inclui 3 rodadas de ajustes') + (isStore ? ' enquanto monto a sua loja.' : ' enquanto monto o seu site.') + ' Mudanças que ampliam o combinado são orçadas à parte.' : '',
        isStore ? 'O domínio é gerenciado pelo seu plano da Tiendanube (Nuvemshop) ou Empretienda.' : 'O domínio é registrado no seu nome e o custo é seu. A publicação na minha conta da Cloudflare não tem custo para você.',
      ],
    }[lang] || [];
    return T.filter(Boolean).join('\\n'); // doble barra: esta página se arma dentro de un texto del Worker
  };
  const LANG = { es: 'Español', en: 'Inglés', pt: 'Portugués' };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const date = (iso) => iso ? new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const day = (iso) => iso ? iso.split('-').reverse().join('/') : '';
  const clientLink = (page, lang, token) => location.origin + '/' + page + '/' + (lang === 'es' ? '' : lang) + '?c=' + token;
  const $ = (id) => document.getElementById(id);
  // Un solo link por cliente: si el proyecto salió de un presupuesto, se usa el link del presupuesto (muestra las dos cosas)
  const projectLink = (p) => (p.quote ? clientLink('mi-presupuesto', p.lang, p.quote) : clientLink('mi-proyecto', p.lang, p.token));
  const SHARE = {
    es: (name, link) => '¡Hola, ' + name + '! Acá podés ver tu presupuesto y seguir el avance de tu proyecto: ' + link,
    en: (name, link) => 'Hi, ' + name + '! Here you can see your quote and follow your project: ' + link,
    pt: (name, link) => 'Olá, ' + name + '! Aqui você pode ver seu orçamento e acompanhar o seu projeto: ' + link,
  };
  const linkBox = (link, lang, name) => '<div class="linkbox"><span class="small muted">Link del cliente</span><br>' + esc(link) + '</div>'
    + '<div class="row"><button type="button" data-copy="' + esc(link) + '">Copiar link</button>'
    + '<a class="btn" target="_blank" href="' + esc('https://wa.me/?text=' + encodeURIComponent((SHARE[lang] || SHARE.es)(name, link))) + '">Mandar por WhatsApp ↗</a>'
    + '<a class="btn" target="_blank" href="' + esc(link) + '">Abrir ↗</a></div>';

  let key = '';
  try { key = sessionStorage.getItem('jnb-admin') || ''; } catch (e) {}
  let data = null;

  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2200); };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast('Link copiado'); } catch (e) { prompt('Copiá el link:', text); } };

  const api = async (path, body) => {
    const res = await fetch('/api/admin/' + path, body === undefined
      ? { headers: { 'x-clave': key } }
      : { method: 'POST', headers: { 'x-clave': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (res.status === 401) { showLogin(true); throw new Error('clave'); }
    if (!res.ok) throw new Error(res.status);
    return res.headers.get('content-type')?.includes('json') ? res.json() : res.text();
  };

  const showLogin = (wrong) => { $('app').hidden = true; $('login').hidden = false; $('login-error').hidden = !wrong; $('key').focus(); };

  const load = async () => {
    data = await api('datos');
    try { data.faq = await api('faq'); } catch (e) { data.faq = null; }
    $('login').hidden = true; $('app').hidden = false;
    render();
  };

  // ---- Consultas y presupuestos
  const renderInquiries = () => {
    const list = data.inquiries;
    $('n-consultas').textContent = list.filter((q) => q.kind === 'presupuesto' && !SENT.includes(q.status)).length || '';
    const mailNote = data.mailReady ? '' : '<p class="small muted">El mail de confirmación todavía no se envía: faltan cargar RESEND_API_KEY y MAIL_FROM en Cloudflare. Las consultas se guardan igual.</p>';
    $('tab-consultas').innerHTML = '<h2>Consultas y pedidos de presupuesto</h2>' + mailNote + (list.length ? list.map((q) => {
      const isQuote = q.kind === 'presupuesto';
      const p = q.proposal || {};
      return '<article class="card" data-token="' + esc(q.token) + '">'
        + '<div class="row space"><div class="row"><span class="code">' + esc(q.code) + '</span>'
        + '<span class="chip">' + (isQuote ? 'Presupuesto' : 'Consulta') + '</span>'
        + (isQuote ? '<span class="chip ' + (SENT.includes(q.status) ? 'ok' : 'warn') + '">' + STATUS[q.status] + '</span>' : '')
        + '</div><span class="small muted">' + date(q.created) + ' · ' + LANG[q.lang] + '</span></div>'
        + '<p style="margin-top:.5rem"><strong>' + esc(q.name) + '</strong> · <a href="mailto:' + esc(q.email) + '?subject=' + encodeURIComponent(q.code) + '">' + esc(q.email) + '</a>'
        + (q.plan ? ' · ' + esc(q.plan) : '') + '</p>'
        + '<div class="message">' + esc(q.message) + '</div>'
        + '<div class="row small"><span class="muted">' + (q.mailed ? 'Mail de confirmación enviado ✓' : 'Sin mail de confirmación') + '</span>'
        + '<a class="btn" href="#" data-mail="' + esc(q.code) + '">Ver el mail</a>'
        + '</div>'
        + (isQuote ? linkBox(clientLink('mi-presupuesto', q.lang, q.token), q.lang, q.name.split(' ')[0])
          + (q.status === 'aceptado' ? '<p class="small" style="margin-top:.5rem">✓ Ya tiene seguimiento en <strong>Proyectos</strong>. El cliente lo ve en este mismo link, en la pestaña "Estado del proyecto".</p>' : '') : '')
        + (isQuote ? '<details' + (!SENT.includes(q.status) ? ' open' : '') + '><summary>Cargar la propuesta</summary><form class="quote-form">'
          + '<div class="grid"><label>Estado<select name="status">' + Object.entries(STATUS).map(([v, l]) => '<option value="' + v + '"' + (q.status === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>'
          + '<label>Precio<input name="price" placeholder="Ej.: ARS 450.000 o USD 380" value="' + esc(p.price) + '"></label>'
          + '<label>Válido hasta<input type="date" name="validUntil" value="' + esc(p.validUntil) + '"></label></div>'
          + '<label>Qué incluye (uno por renglón; para sumar una descripción, separala con un guion largo: Galería de tortas — Fotos ampliables)<textarea name="includes" rows="6">' + esc(p.includes) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Condiciones de contratación (una por renglón; vienen sugeridas según el plan, podés editarlas)<textarea name="conditions" rows="5">' + esc(q.proposal ? p.conditions : defaultConditions(q.plan, q.lang)) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Nota para el cliente (opcional)<textarea name="note">' + esc(p.note) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Link para pagar en cuotas en tu tienda (dejalo vacío si este presupuesto no se puede pagar ahí)'
          + '<input name="storeLink" placeholder="https://jnbcreativestudio.mitiendanube.com/productos/..." value="' + esc(q.proposal ? p.storeLink : (q.lang === 'en' ? '' : 'https://jnbcreativestudio.mitiendanube.com/')) + '"></label>'
          + '<p class="small muted" style="margin-top:.5rem">El cliente ve la propuesta cuando el estado es "Enviado". Cuando te confirme por WhatsApp, pasalo a "Aceptado": se crea solo el seguimiento del proyecto y el cliente lo ve en este mismo link.</p>'
          + '<button class="primary">Guardar</button></form></details>' : '')
        + '</article>';
    }).join('') : '<p class="empty">Todavía no hay consultas.</p>');
  };

  // ---- Reseñas
  const renderReviews = () => {
    const approved = data.reviews.filter((r) => r.status === 'aprobada').length;
    const pending = data.reviews.filter((r) => r.status === 'pendiente').length;
    $('n-resenas').textContent = pending || '';
    const visible = approved >= data.minPublicReviews
      ? 'La sección de reseñas se ve en el inicio (' + approved + ' aprobadas).'
      : 'La sección de reseñas aparece en el inicio cuando haya ' + data.minPublicReviews + ' aprobadas (hoy: ' + approved + ').';
    $('tab-resenas').innerHTML = '<h2>Reseñas de clientes</h2><p class="muted">' + visible + '</p>'
      + '<form class="card" id="invite"><h3>Pedirle una reseña a un cliente</h3><div class="grid">'
      + '<label>Cliente (solo lo ves vos)<input name="client" required placeholder="Ej.: Ana, pastelería"></label>'
      + '<label>Idioma del link<select name="lang"><option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option></select></label></div>'
      + '<button class="primary">Crear link</button><div id="invite-result"></div></form>'
      + (data.reviews.length ? data.reviews.map((r) => '<article class="card" data-review="' + r.id + '">'
        + '<div class="row space"><div class="row"><strong>' + esc(r.name) + '</strong><span class="muted">' + esc(r.business) + '</span></div>'
        + '<span class="chip ' + (r.status === 'aprobada' ? 'ok' : 'warn') + '">' + esc(r.status) + '</span></div>'
        + '<div class="message">' + esc(r.body) + '</div><div class="row">'
        + (r.status !== 'aprobada' ? '<button class="primary" data-set="aprobada">Aprobar y publicar</button>' : '<button data-set="oculta">Ocultar</button>')
        + '<button data-set="borrar">Borrar</button><span class="small muted">' + date(r.created) + ' · ' + LANG[r.lang] + '</span></div></article>').join('')
        : '<p class="empty">Todavía no hay reseñas.</p>')
      + (data.invitations.length ? '<h2 style="margin-top:1.5rem">Links enviados</h2><table><thead><tr><th>Cliente</th><th>Creado</th><th>Estado</th><th></th></tr></thead><tbody>'
        + data.invitations.map((i) => '<tr><td>' + esc(i.client) + '</td><td>' + date(i.created) + '</td><td>' + (i.used ? 'Respondió' : 'Esperando') + '</td>'
        + '<td class="n">' + (i.used ? '' : '<button data-copy="' + esc(clientLink('resena', 'es', i.token)) + '">Copiar link</button>') + '</td></tr>').join('') + '</tbody></table>' : '');
  };

  // ---- Proyectos
  const renderProjects = () => {
    const editedBriefs = data.projects.filter((p) => p.briefEditUnseen);
    $('n-proyectos').textContent = editedBriefs.length ? '⚠ ' + editedBriefs.length : (data.projects.filter((p) => p.stage < STAGES.length - 1).length || '');
    $('tab-proyectos').innerHTML = '<h2>Seguimiento de proyectos</h2>'
      + (editedBriefs.length ? '<div class="alert">⚠ ' + (editedBriefs.length === 1 ? esc(editedBriefs[0].client) + ' editó su brief después de enviarlo.' : editedBriefs.length + ' clientes editaron su brief después de enviarlo: ' + editedBriefs.map((p) => esc(p.client)).join(', ') + '.') + ' Abrilo con "Ver brief" para ver qué cambió.</div>' : '')
      + '<p class="muted">Los proyectos de presupuestos aceptados se crean solos. Acá podés crear uno a mano para clientes que no pidieron presupuesto por la web (por ejemplo, por WhatsApp).</p>'
      + '<form class="card" id="new-project"><h3>Nuevo proyecto</h3><div class="grid">'
      + '<label>Nombre del cliente (lo ve el cliente)<input name="client" required placeholder="Ej.: Ana"></label>'
      + '<label>Proyecto<input name="project" required placeholder="Ej.: Landing · Plan Básico"></label>'
      + '<label>Idioma<select name="lang"><option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option></select></label>'
      + '<label>Entrega estimada<input type="date" name="due"></label></div><button class="primary">Crear</button></form>'
      + (data.projects.length ? data.projects.map((p) => '<article class="card" data-project="' + esc(p.token) + '">'
        + '<div class="row space"><div class="row"><strong>' + esc(p.client) + '</strong><span class="muted">' + esc(p.project) + '</span></div>'
        + '<div class="row">' + (p.quoteCode ? '<span class="chip">Presupuesto ' + esc(p.quoteCode) + '</span>' : '') + '<span class="chip">' + STAGES[p.stage] + '</span></div></div>'
        + linkBox(projectLink(p), p.lang, p.client)
        + '<div class="row" style="margin-top:.6rem"><span class="chip ' + (p.briefStatus === 'enviado' ? 'ok' : 'warn') + '">'
        + (p.briefStatus === 'enviado' ? 'Brief enviado ✓ ' + date(p.briefSent) : p.briefStatus === 'borrador' ? 'Brief en curso' : 'Brief sin empezar') + '</span>'
        + (p.briefEditUnseen ? '<span class="chip alert-chip">⚠ Editó el brief · ' + date(p.briefEdited) + '</span>' : '')
        + (p.briefStatus ? '<button type="button" data-brief="' + esc(p.quote || p.token) + '">Ver brief' + (p.briefFiles ? ' y archivos (' + p.briefFiles + ')' : '') + '</button>' : '')
        + '<button type="button" data-copy="' + esc(projectLink(p) + '#brief') + '">Copiar link del brief</button>'
        + (p.quote ? '<button type="button" data-brief-mail="' + esc(p.quote) + '">Mandar link del brief por mail</button>' : '')
        + '</div>'
        + '<form class="project-form">'
        // Etapas como botones: tocar una la guarda al instante y el cliente la ve al recargar su página
        + '<p class="small muted" style="margin:.75rem 0 .4rem">Etapa actual (tocá la que corresponda; se guarda sola)</p>'
        + '<div class="stepper" role="group" aria-label="Etapa del proyecto">' + STAGES.map((s, i) => '<button type="button" class="step' + (i < p.stage ? ' is-done' : '') + '" data-stage="' + i + '" aria-pressed="' + (p.stage === i) + '"><span class="step-num">' + (i < p.stage ? '✓' : i + 1) + '</span><span class="step-name">' + s + '</span></button>').join('') + '</div>'
        + '<input type="hidden" name="stage" value="' + p.stage + '">'
        + '<div class="grid"><label>Entrega estimada<input type="date" name="due" value="' + esc(p.due) + '"></label></div>'
        + '<label>Tu próximo paso (opcional: si lo dejás vacío, se muestra el texto de la etapa)<input name="next" maxlength="400" placeholder="Ej.: Todavía necesito tu logo y los textos de la sección Servicios." value="' + esc(p.next) + '"></label>'
        + '<label style="margin-top:.75rem">Link de vista previa (opcional)<input name="preview" placeholder="https://..." value="' + esc(p.preview) + '"></label>'
        + '<label style="margin-top:.75rem">Nota para el cliente (opcional)<textarea name="note" placeholder="Ej.: Ya tengo tus fotos. Esta semana te mando la primera versión.">' + esc(p.note) + '</textarea></label>'
        + '<div class="row" style="margin-top:.75rem"><button class="primary">Guardar</button>'
        + '<button type="button" data-remove>Borrar</button>'
        + '<span class="small muted">Actualizado ' + date(p.updated) + '</span></div></form></article>').join('')
        : '<p class="empty">Todavía no hay proyectos.</p>');
  };

  // ---- Preguntas frecuentes
  const renderFaq = () => {
    const faq = data.faq;
    if (!faq) { $('tab-faq').innerHTML = '<p class="empty">No se pudieron cargar los datos.</p>'; return; }
    $('tab-faq').innerHTML = '<h2>¿Te sirvió esta respuesta?</h2><p class="muted">Arriba quedan las que más "No" tienen: son las que conviene reescribir.</p>'
      + '<table><thead><tr><th>Pregunta</th><th class="n">Sí</th><th class="n">No</th></tr></thead><tbody>'
      + (faq.votes.map((v) => '<tr><td><a href="/preguntas-frecuentes/#' + esc(v.question) + '" target="_blank">' + esc(v.question) + '</a></td><td class="n">' + v.yes + '</td><td class="n">' + v.no + '</td></tr>').join('') || '<tr><td colspan="3" class="muted">Todavía no hay votos.</td></tr>')
      + '</tbody></table><h2 style="margin-top:1.5rem">Búsquedas que no encontraron nada</h2><p class="muted">Ideas de preguntas para agregar.</p>'
      + '<table><thead><tr><th>Búsqueda</th><th>Idioma</th><th class="n">Veces</th><th>Última vez</th></tr></thead><tbody>'
      + (faq.searches.map((s) => '<tr><td>' + esc(s.term) + '</td><td>' + esc(s.lang) + '</td><td class="n">' + s.times + '</td><td>' + day(s.last) + '</td></tr>').join('') || '<tr><td colspan="4" class="muted">Todavía no hay búsquedas sin resultado.</td></tr>')
      + '</tbody></table>';
  };

  // ---- Ver un brief: respuestas por sección y archivos para descargar
  const openBrief = async (token) => {
    const b = await api('brief/' + token);
    const size = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
    $('brief-view-title').textContent = 'Brief · ' + (b.client || '') + (b.code ? ' · ' + b.code : '');
    let section = '';
    // Cambios de la última edición: comparando con lo que había antes
    const prev = new Map((b.prevSummary || []).map((r) => [r.s + '|' + r.q, r.a]));
    const hasPrev = Boolean(b.edited && prev.size);
    const rows = (b.summary || []).map((r) => {
      const head = r.s && r.s !== section ? '<p class="brief-view-section">' + esc(r.s) + '</p>' : '';
      section = r.s || section;
      const before = prev.get(r.s + '|' + r.q);
      const changed = hasPrev && before !== r.a;
      return head + '<p class="brief-view-q">' + esc(r.q) + (changed ? '<span class="tag-edit">' + (before === undefined ? 'Nuevo' : 'Editado') + '</span>' : '') + '</p>'
        + '<p class="brief-view-a' + (changed ? ' is-changed' : '') + '">' + esc(r.a) + '</p>'
        + (changed && before !== undefined ? '<p class="brief-view-prev">Antes: ' + esc(before) + '</p>' : '');
    }).join('');
    const current = new Set((b.summary || []).map((r) => r.s + '|' + r.q));
    const removed = hasPrev ? (b.prevSummary || []).filter((r) => !current.has(r.s + '|' + r.q)) : [];
    const removedHtml = removed.length ? '<p class="brief-view-section">Respuestas que quitó</p>' + removed.map((r) => '<p class="brief-view-q">' + esc(r.q) + '</p><p class="brief-view-prev">' + esc(r.a) + '</p>').join('') : '';
    const editNote = b.edited ? '<div class="alert">' + (b.editUnseen ? '⚠ ' : '') + 'El cliente editó el brief después de enviarlo (última edición: ' + date(b.edited) + '). Lo que cambió está marcado.</div>' : '';
    const files = (b.files || []).length
      ? '<p class="brief-view-section">Archivos</p><ul class="brief-files-list">' + b.files.map((f) => '<li><span>📎 ' + esc(f.name) + ' <small class="muted">' + size(f.size) + '</small></span><button type="button" data-file="' + f.id + '" data-name="' + esc(f.name) + '">Descargar</button></li>').join('') + '</ul>'
      : '';
    const state = b.status === 'enviado' ? 'Enviado el ' + date(b.sent) : b.status === 'borrador' ? 'Todavía no lo envió (en curso, actualizado ' + date(b.updated) + ')' : 'Todavía no empezó';
    $('brief-view-body').innerHTML = editNote + '<p class="muted small">' + esc(b.planText || '') + ' · ' + LANG[b.lang] + ' · ' + state + '</p>' + files + (rows || '<p class="empty">Todavía no hay respuestas.</p>') + removedHtml;
    $('brief-view').showModal();
    // Abrirlo cuenta como "visto": se va la alerta
    if (b.editUnseen) { const fresh = await api('datos'); data.projects = fresh.projects; renderProjects(); }
  };
  $('brief-view-close').addEventListener('click', () => $('brief-view').close());
  $('brief-view-print').addEventListener('click', () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc($('brief-view-title').textContent) + '</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:44rem;margin:2rem auto;padding:0 1rem;color:#211632}.brief-view-section{color:#5d31b8;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:1.4rem 0 .4rem}.brief-view-q{font-weight:800;margin:.8rem 0 .1rem}.brief-view-a{margin:0;white-space:pre-line}button{display:none}ul{padding-left:1rem}</style><h1>' + esc($('brief-view-title').textContent) + '</h1>' + $('brief-view-body').innerHTML);
    w.document.close();
    w.print();
  });

  // ---- Cartel "Disponible para nuevos proyectos" del inicio
  const AVAIL = [
    ['abierto', '#2fa36b', 'Disponible para nuevos proyectos', 'Punto verde.'],
    ['agenda', '#e0a12b', 'Agenda completa este mes', 'Punto amarillo y "Reservá tu lugar para {mes}", que abre tu agenda de Google.'],
    ['cerrado', '#d0453f', 'Por ahora no tomo proyectos nuevos', 'Punto rojo y "Escribime y te aviso cuando haya lugar", que lleva al contacto.'],
  ];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const nextMonth = () => MONTHS[(new Date().getMonth() + 1) % 12];
  const availPreview = (estado, month) => {
    const m = month ? MONTHS[Number(month) - 1] : nextMonth();
    if (estado === 'agenda') return 'Agenda completa este mes · Reservá tu lugar para ' + m;
    if (estado === 'cerrado') return 'Por ahora no tomo proyectos nuevos · Escribime y te aviso cuando haya lugar';
    return 'Disponible para nuevos proyectos';
  };
  const renderAvailability = () => {
    const a = data.availability || { estado: 'abierto', reservaDesde: '' };
    $('availability').innerHTML = '<form class="card" id="availability-form"><div class="row space"><h2 style="margin:0">Cartel del inicio</h2>'
      + (a.updated ? '<span class="small muted">Guardado ' + date(a.updated) + '</span>' : '') + '</div>'
      + '<p class="small muted" style="margin:.4rem 0 0">Lo que se ve arriba en el inicio, en los tres idiomas. Elegí una opción y tocá Guardar.</p>'
      + '<div class="avail-options">' + AVAIL.map(([v, color, title, hint]) => '<label class="avail-option"><input type="radio" name="estado" value="' + v + '"' + (a.estado === v ? ' checked' : '') + '>'
        + '<span class="avail-dot" style="background:' + color + '"></span><span>' + title + '<br><span class="small muted" style="font-weight:500">' + esc(hint.replace('{mes}', 'el mes que elijas')) + '</span></span></label>').join('') + '</div>'
      + '<label id="avail-month"' + (a.estado === 'agenda' ? '' : ' hidden') + '>Reservas desde<select name="reservaDesde"><option value="">El mes que viene (' + nextMonth() + ')</option>'
        + MONTHS.map((m, i) => '<option value="' + (i + 1) + '"' + (String(a.reservaDesde) === String(i + 1) ? ' selected' : '') + '>' + m.charAt(0).toUpperCase() + m.slice(1) + '</option>').join('') + '</select></label>'
      + '<p class="avail-preview"><span class="small muted">Así se ve en el inicio:</span><br><strong id="avail-preview">' + esc(availPreview(a.estado, a.reservaDesde)) + '</strong></p>'
      + '<div class="row"><button class="primary">Guardar</button><a class="btn" href="/" target="_blank">Ver el inicio ↗</a></div></form>';
  };
  document.addEventListener('change', (e) => {
    const form = e.target.closest('#availability-form');
    if (!form) return;
    const values = Object.fromEntries(new FormData(form));
    $('avail-month').hidden = values.estado !== 'agenda';
    $('avail-preview').textContent = availPreview(values.estado, values.reservaDesde);
  });

  const render = () => { renderAvailability(); renderInquiries(); renderReviews(); renderProjects(); renderFaq(); };

  // ---- Acciones
  $('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    key = $('key').value.trim();
    try { sessionStorage.setItem('jnb-admin', key); } catch (err) {}
    load().catch(() => {});
  });
  $('logout').addEventListener('click', () => { key = ''; try { sessionStorage.removeItem('jnb-admin'); } catch (e) {} showLogin(false); });

  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    document.querySelectorAll('#tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    ['consultas', 'resenas', 'proyectos', 'faq'].forEach((t) => { $('tab-' + t).hidden = t !== b.dataset.tab; });
  });

  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) { e.preventDefault(); copy(copyBtn.dataset.copy); return; }
    const mail = e.target.closest('[data-mail]');
    if (mail) {
      e.preventDefault();
      const html = await api('mail/' + mail.dataset.mail);
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
      return;
    }
    const briefBtn = e.target.closest('[data-brief]');
    if (briefBtn) { openBrief(briefBtn.dataset.brief); return; }
    const briefMail = e.target.closest('[data-brief-mail]');
    if (briefMail) {
      if (!confirm('¿Mandarle al cliente el link del brief por mail?')) return;
      const r = await api('brief-mail/' + briefMail.dataset.briefMail, {});
      toast(r.ok ? 'Mail enviado' : 'No se pudo enviar el mail');
      return;
    }
    const fileBtn = e.target.closest('[data-file]');
    if (fileBtn) {
      fileBtn.disabled = true;
      try {
        const res = await fetch('/api/admin/archivo/' + fileBtn.dataset.file, { headers: { 'x-clave': key } });
        if (!res.ok) throw new Error(res.status);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileBtn.dataset.name;
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } catch (err) { toast('No se pudo descargar'); }
      fileBtn.disabled = false;
      return;
    }
    const set = e.target.closest('[data-set]');
    if (set) {
      if (set.dataset.set === 'borrar' && !confirm('¿Borrar esta reseña? No se puede deshacer.')) return;
      await api('resenas/' + set.closest('[data-review]').dataset.review, { status: set.dataset.set });
      toast('Listo'); load();
      return;
    }
    // Etapa del proyecto: un toque la guarda (junto con lo que esté escrito en ese proyecto)
    const step = e.target.closest('.step[data-stage]');
    if (step) {
      const form = step.closest('.project-form');
      if (step.getAttribute('aria-pressed') === 'true') return;
      form.querySelectorAll('.step').forEach((b) => { b.disabled = true; });
      form.elements.stage.value = step.dataset.stage;
      const values = Object.fromEntries(new FormData(form));
      try {
        await api('proyectos/' + form.closest('[data-project]').dataset.project, { stage: Number(values.stage), due: values.due, note: values.note, next: values.next, preview: values.preview });
        toast('Etapa: ' + STAGES[Number(values.stage)] + '. El cliente ya la ve.');
        load();
      } catch (err) {
        form.querySelectorAll('.step').forEach((b) => { b.disabled = false; });
        toast('No se pudo guardar');
      }
      return;
    }
    const remove = e.target.closest('[data-remove]');
    if (remove) {
      if (!confirm('¿Borrar este proyecto? El link del cliente deja de funcionar.')) return;
      await api('proyectos/' + remove.closest('[data-project]').dataset.project, { remove: true });
      toast('Proyecto borrado'); load();
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target;
    const values = Object.fromEntries(new FormData(form));
    if (form.classList.contains('quote-form')) {
      e.preventDefault();
      if (SENT.includes(values.status) && !values.price.trim()) { toast('Falta el precio'); return; }
      const saved = await api('presupuestos/' + form.closest('[data-token]').dataset.token, values);
      toast(saved.created ? (saved.briefMailed ? 'Aceptado: se creó el proyecto y le mandé el link del brief por mail' : 'Aceptado: se creó el proyecto (copiá el link del brief en Proyectos)') : 'Propuesta guardada');
      load();
    } else if (form.id === 'invite') {
      e.preventDefault();
      const { token } = await api('resenas/invitar', { client: values.client });
      const link = clientLink('resena', values.lang, token);
      const wa = 'https://wa.me/?text=' + encodeURIComponent('¡Hola! Me ayudaría mucho que me dejes tu opinión sobre el trabajo que hicimos juntos: ' + link);
      $('invite-result').innerHTML = '<div class="linkbox">' + esc(link) + '</div><div class="row"><button type="button" data-copy="' + esc(link) + '">Copiar link</button><a class="btn" target="_blank" href="' + esc(wa) + '">Mandar por WhatsApp ↗</a></div>';
      form.reset();
      const fresh = await api('datos'); data.invitations = fresh.invitations;
    } else if (form.id === 'availability-form') {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      data.availability = await api('disponibilidad', { estado: values.estado, reservaDesde: values.estado === 'agenda' ? values.reservaDesde : '' });
      renderAvailability();
      toast('Guardado: el inicio ya muestra "' + availPreview(data.availability.estado, data.availability.reservaDesde) + '"');
    } else if (form.id === 'new-project') {
      e.preventDefault();
      await api('proyectos', values);
      toast('Proyecto creado'); load();
    } else if (form.classList.contains('project-form')) {
      e.preventDefault();
      await api('proyectos/' + form.closest('[data-project]').dataset.project, { stage: Number(values.stage), due: values.due, note: values.note, next: values.next, preview: values.preview });
      toast('Guardado'); load();
    }
  });

  if (key) load().catch(() => {}); else showLogin(false);
})();
</script>
</body></html>`;
