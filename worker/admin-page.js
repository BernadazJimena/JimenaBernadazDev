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
  .bv-top { align-items: center; background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, var(--card)), var(--card)); border: 1px solid var(--line); border-radius: .9rem; display: flex; flex-wrap: wrap; gap: .6rem; justify-content: space-between; margin-bottom: .9rem; padding: .9rem 1rem; }
  .bv-client { font-size: 1.15rem; font-weight: 800; margin: 0; }
  .bv-card { background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--bv); border-radius: .9rem; margin: 0 0 .9rem; padding: .3rem 1rem .8rem; }
  .bv-head { align-items: center; color: var(--bv); display: flex; font-size: .8rem; gap: .5rem; letter-spacing: .08em; margin: .6rem 0 .3rem; text-transform: uppercase; }
  .bv-icon { align-items: center; background: color-mix(in srgb, var(--bv) 16%, transparent); border-radius: .6rem; display: inline-flex; font-size: 1rem; height: 1.9rem; justify-content: center; width: 1.9rem; }
  .bv-row { border-top: 1px solid var(--line); padding: .55rem 0 .2rem; }
  .bv-row:first-of-type { border-top: 0; }
  .bv-row .brief-view-q { color: var(--muted); font-size: .8rem; margin: 0 0 .2rem; }
  .bv-row.is-changed { background: color-mix(in srgb, #f2b45c 10%, transparent); border-radius: .5rem; margin: 0 -.5rem; padding-left: .5rem; padding-right: .5rem; }
  .ans-chip { border-radius: 999px; display: inline-block; font-size: .8rem; font-weight: 800; padding: .15rem .6rem; }
  .ans-yes { background: color-mix(in srgb, #2fa36b 18%, transparent); color: #1f7a4d; }
  .ans-no { background: color-mix(in srgb, var(--muted) 18%, transparent); color: var(--muted); }
  @media (prefers-color-scheme: dark) { .ans-yes { color: #6fd3a0; } }
  .bv-file-icon { font-size: 1.1rem; }
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
  .away-box { margin-top: .75rem; } .away-box summary { display: inline-flex; list-style: none; } .away-box summary::-webkit-details-marker { display: none; } .away-box[open] summary { margin-bottom: .5rem; }
  .avail-options { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin: .75rem 0; }
  .avail-option { align-items: flex-start; background: var(--bg); border: 1px solid var(--line); border-radius: .8rem; cursor: pointer; display: flex; font-weight: 700; gap: .55rem; padding: .7rem .8rem; }
  .avail-option:has(input:checked) { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .avail-option input { accent-color: var(--accent); margin-top: .2rem; width: auto; }
  .avail-dot { border-radius: 50%; display: inline-block; flex-shrink: 0; height: .65rem; margin-top: .4rem; width: .65rem; }
  .avail-preview { background: var(--bg); border: 1px dashed var(--line); border-radius: .8rem; margin: .5rem 0 .75rem; padding: .6rem .8rem; }
  .client-group-title { color: var(--muted); font-size: .75rem; font-weight: 800; letter-spacing: .08em; margin: 1rem 0 .4rem; text-transform: uppercase; }
  .client-list { display: grid; gap: .5rem; }
  .client-row { align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: .9rem; display: grid; gap: .5rem .9rem; grid-template-columns: minmax(10rem, 1fr) auto 1rem; padding: .75rem 1rem; text-align: left; width: 100%; }
  .client-row:hover { border-color: var(--accent); }
  .client-row-main { display: flex; flex-direction: column; gap: .1rem; }
  .client-row-main strong { font-size: 1rem; }
  .client-row-tags { display: flex; flex-wrap: wrap; gap: .3rem; justify-content: flex-end; }
  .client-row-go { color: var(--accent-ink); font-size: 1.4rem; font-weight: 800; }
  @media (max-width: 640px) { .client-row { grid-template-columns: 1fr 1rem; } .client-row-tags { grid-column: 1; justify-content: flex-start; grid-row: 2; } .client-row-go { grid-row: 1 / span 2; grid-column: 2; } }
  .subtabs { border-bottom: 1px solid var(--line); display: flex; gap: .3rem; margin: .5rem 0 1rem; overflow-x: auto; padding-bottom: .5rem; }
  .subtabs button { flex-shrink: 0; }
  .subtabs button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .timeline { list-style: none; margin: 0; padding: 0; position: relative; }
  .timeline li { display: grid; gap: .75rem; grid-template-columns: 2.2rem 1fr; padding-bottom: 1rem; position: relative; }
  .timeline li:not(:last-child)::before { background: var(--line); bottom: 0; content: ""; left: 1.05rem; position: absolute; top: 2.3rem; width: 2px; }
  .tl-icon { align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 50%; display: flex; height: 2.2rem; justify-content: center; width: 2.2rem; }
  .tl-text { font-weight: 700; margin: .35rem 0 .1rem; }
  .coupon-code { border: 2px dashed var(--accent); border-radius: .8rem; font-size: 1.4rem; font-weight: 800; letter-spacing: .1em; margin: .3rem 0 .6rem; padding: .5rem; text-align: center; }
  .check-line { align-items: center; display: flex; font-size: .9rem; gap: .5rem; margin: .75rem 0; }
  .check-line input { accent-color: var(--accent); width: auto; }
  .price-row { display: grid; gap: .5rem; grid-template-columns: 7.5rem 1fr; }
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
    <section id="hours"></section>
    <section id="mail-check"></section>
    <nav id="tabs">
      <button data-tab="consultas" aria-pressed="true">Consultas <span class="badge" id="n-consultas"></span></button>
      <button data-tab="resenas" aria-pressed="false">Reseñas <span class="badge" id="n-resenas"></span></button>
      <button data-tab="proyectos" aria-pressed="false">Clientes <span class="badge" id="n-proyectos"></span></button>
      <button data-tab="cupones" aria-pressed="false">Cupones <span class="badge" id="n-cupones"></span></button>
      <button data-tab="faq" aria-pressed="false">Preguntas frecuentes</button>
      <button data-tab="newsletter" aria-pressed="false">Newsletter <span class="badge" id="n-newsletter"></span></button>
    </nav>
    <section id="tab-consultas"></section>
    <section id="tab-resenas" hidden></section>
    <section id="tab-proyectos" hidden></section>
    <section id="tab-cupones" hidden></section>
    <section id="tab-faq" hidden></section>
    <section id="tab-newsletter" hidden></section>
  </div>
  <dialog class="brief-view" id="brief-view"><div class="brief-view-head"><strong id="brief-view-title">Brief</strong><div class="row"><button type="button" id="brief-view-print">Imprimir</button><button type="button" id="brief-view-close">Cerrar</button></div></div><div class="brief-view-body" id="brief-view-body"></div></dialog>
  <div class="toast" id="toast" role="status" hidden></div>
</div>
<script src="/js/holidays.js"></script>
<script src="/js/availability.js"></script>
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
    try { data.newsletter = await api('newsletter'); } catch (e) { data.newsletter = null; }
    $('login').hidden = true; $('app').hidden = false;
    render();
  };

  // ---- Precio de la propuesta: moneda ($ o USD) y monto con puntos de miles (200.000)
  const priceFields = (price, q) => {
    // Doble barra: esta página se arma dentro de un texto del Worker
    const m = String(price || '').match(/^(USD|US\\$|ARS|\\$)\\s*(.*)$/i);
    const fromCountry = !q.country ? (q.lang === 'es' ? '$' : 'USD') : (/argentina/i.test(q.country) ? '$' : 'USD');
    const currency = m ? (/usd|us\\$/i.test(m[1]) ? 'USD' : '$') : fromCountry;
    const amount = m ? m[2] : String(price || '');
    return '<label>Precio' + (q.country ? ' <span class="small muted">(' + esc(q.country) + ')</span>' : '') + '<div class="price-row">'
      + '<select name="currency"><option value="$"' + (currency === '$' ? ' selected' : '') + '>$ Pesos</option><option value="USD"' + (currency === 'USD' ? ' selected' : '') + '>USD Dólares</option></select>'
      + '<input name="amount" class="amount-input" inputmode="numeric" placeholder="200.000" value="' + esc(amount) + '"></div></label>';
  };
  const formatAmount = (value) => {
    const digits = String(value).replace(/[^0-9]/g, '');
    return digits ? Number(digits).toLocaleString('es-AR') : '';
  };
  document.addEventListener('input', (e) => {
    if (!e.target.classList || !e.target.classList.contains('amount-input')) return;
    const formatted = formatAmount(e.target.value);
    if (formatted !== e.target.value) e.target.value = formatted;
  });

  // ---- Consultas y presupuestos
  // Tarjeta de un pedido (en Consultas y en la ficha del cliente, pestaña Presupuesto)
  const inquiryCard = (q, inClient) => {
      const isQuote = q.kind === 'presupuesto';
      const p = q.proposal || {};
      return '<article class="card" data-token="' + esc(q.token) + '">'
        + '<div class="row space"><div class="row"><span class="code">' + esc(q.code) + '</span>'
        + '<span class="chip">' + (isQuote ? 'Presupuesto' : 'Consulta') + '</span>'
        + (isQuote ? '<span class="chip ' + (SENT.includes(q.status) ? 'ok' : 'warn') + '">' + STATUS[q.status] + '</span>' : '')
        + '</div><span class="small muted">' + date(q.created) + ' · ' + LANG[q.lang] + '</span></div>'
        + '<p style="margin-top:.5rem"><strong>' + esc(q.name) + '</strong> · <a href="mailto:' + esc(q.email) + '?subject=' + encodeURIComponent(q.code) + '">' + esc(q.email) + '</a>'
        + (q.plan ? ' · ' + esc(q.plan) : '') + (q.country ? ' · 📍 ' + esc(q.country) : '') + '</p>'
        + '<div class="message">' + esc(q.message) + '</div>'
        + '<div class="row small"><span class="muted">' + (q.mailed ? 'Mail de confirmación enviado ✓' : 'Sin mail de confirmación') + '</span>'
        + '<a class="btn" href="#" data-mail="' + esc(q.code) + '">Ver el mail</a>'
        + '<button type="button" data-resend="' + esc(q.code) + '">📧 ' + (q.mailed ? 'Reenviar' : 'Enviar') + ' el mail al cliente</button>'
        + '</div>'
        + (q.coupon ? '<div class="alert" style="margin-top:.6rem">🎁 Usa el cupón <strong>' + esc(q.coupon) + '</strong>: aplicá 20 % de descuento en la propuesta. Queda usado cuando lo pases a "Aceptado".</div>' : '')
        + (isQuote ? linkBox(clientLink('mi-presupuesto', q.lang, q.token), q.lang, q.name.split(' ')[0])
          + (q.status === 'aceptado' && inClient !== true ? '<p class="small" style="margin-top:.5rem">✓ Ya es un proyecto en marcha. <button type="button" data-open-quote="' + esc(q.token) + '">Abrir la ficha del cliente</button></p>' : '') : '')
        + (isQuote ? '<details' + (!SENT.includes(q.status) ? ' open' : '') + '><summary>Cargar la propuesta</summary><form class="quote-form">'
          + '<div class="grid"><label>Estado<select name="status">' + Object.entries(STATUS).map(([v, l]) => '<option value="' + v + '"' + (q.status === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>'
          + priceFields(p.price, q)
          + '<label>Válido hasta<input type="date" name="validUntil" value="' + esc(p.validUntil) + '"></label></div>'
          + '<label>Qué incluye (uno por renglón; para sumar una descripción, separala con un guion largo: Galería de tortas — Fotos ampliables)<textarea name="includes" rows="6">' + esc(p.includes) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Condiciones de contratación (una por renglón; vienen sugeridas según el plan, podés editarlas)<textarea name="conditions" rows="5">' + esc(q.proposal ? p.conditions : defaultConditions(q.plan, q.lang)) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Nota para el cliente (opcional)<textarea name="note">' + esc(p.note) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Link para pagar en cuotas en tu tienda (dejalo vacío si este presupuesto no se puede pagar ahí)'
          + '<input name="storeLink" placeholder="https://jnbcreativestudio.mitiendanube.com/productos/..." value="' + esc(q.proposal ? p.storeLink : (q.lang === 'en' ? '' : 'https://jnbcreativestudio.mitiendanube.com/')) + '"></label>'
          + '<p class="small muted" style="margin-top:.5rem">El cliente ve la propuesta cuando el estado es "Enviado". Cuando te confirme por WhatsApp, pasalo a "Aceptado": se crea solo el seguimiento del proyecto y el cliente lo ve en este mismo link.</p>'
          + '<label class="check-line"><input type="checkbox" name="notify" checked> 📧 Avisarle por mail al cliente cuando el estado sea "Enviado"</label>'
          + '<button class="primary">Guardar</button></form></details>' : '')
        + '</article>';
  };

  const renderInquiries = () => {
    const list = data.inquiries;
    $('n-consultas').textContent = list.filter((q) => q.kind === 'presupuesto' && !SENT.includes(q.status)).length || '';
    const mailNote = data.mailReady ? '' : '<p class="small muted">El mail de confirmación todavía no se envía: faltan cargar RESEND_API_KEY y MAIL_FROM en Cloudflare. Las consultas se guardan igual.</p>';
    $('tab-consultas').innerHTML = '<h2>Consultas y pedidos de presupuesto</h2>' + mailNote + (list.length ? list.map((q) => inquiryCard(q, false)).join('') : '<p class="empty">Todavía no hay consultas.</p>');
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

  // ---- Clientes: lista compacta y, al tocar un nombre, su ficha con pestañas
  let selected = '';      // proyecto abierto
  let subTab = 'estado';  // pestaña de la ficha
  let clientFilter = '';
  const SUBTABS = [['estado', '📍 Estado'], ['presupuesto', '💬 Presupuesto'], ['brief', '📝 Brief'], ['resena', '⭐ Reseña y cupón'], ['historial', '🕓 Historial']];
  const briefLabel = (p) => (p.briefStatus === 'enviado' ? '📝 Brief ✓' : p.briefStatus === 'borrador' ? '📝 Brief en curso' : '📝 Sin brief');

  const clientRow = (p) => '<button type="button" class="client-row" data-open="' + esc(p.token) + '">'
    + '<span class="client-row-main"><strong>' + esc(p.client) + '</strong><span class="small muted">' + esc(p.project) + (p.quoteCode ? ' · ' + esc(p.quoteCode) : '') + '</span></span>'
    + '<span class="client-row-tags">' + (p.briefEditUnseen ? '<span class="chip alert-chip">⚠ Editó el brief</span>' : '')
    + '<span class="chip">' + (p.stage + 1) + '. ' + STAGES[p.stage] + '</span>'
    + '<span class="chip ' + (p.briefStatus === 'enviado' ? 'ok' : 'warn') + '">' + briefLabel(p) + '</span>'
    + (p.coupon ? '<span class="chip">🎁</span>' : '') + (p.reviewDone ? '<span class="chip ok">⭐</span>' : '') + '</span>'
    + '<span class="client-row-go" aria-hidden="true">›</span></button>';

  const renderProjects = () => {
    const editedBriefs = data.projects.filter((p) => p.briefEditUnseen);
    $('n-proyectos').textContent = editedBriefs.length ? '⚠ ' + editedBriefs.length : (data.projects.filter((p) => p.stage < STAGES.length - 1).length || '');
    const p = data.projects.find((x) => x.token === selected);
    if (!p) { selected = ''; renderClientList(editedBriefs); } else { renderClient(p); }
  };

  const renderClientList = (editedBriefs) => {
    const q = clientFilter.trim().toLowerCase();
    const list = data.projects.filter((p) => !q || (p.client + ' ' + p.project + ' ' + (p.quoteCode || '')).toLowerCase().includes(q));
    const active = list.filter((p) => p.stage < STAGES.length - 1);
    const done = list.filter((p) => p.stage >= STAGES.length - 1);
    $('tab-proyectos').innerHTML = '<div class="row space"><h2 style="margin:0">Clientes</h2><span class="small muted">' + data.projects.length + ' en total</span></div>'
      + (editedBriefs.length ? '<div class="alert" style="margin-top:.75rem">⚠ ' + (editedBriefs.length === 1 ? esc(editedBriefs[0].client) + ' editó su brief después de enviarlo.' : editedBriefs.length + ' clientes editaron su brief después de enviarlo: ' + editedBriefs.map((x) => esc(x.client)).join(', ') + '.') + ' Abrí su ficha, pestaña Brief, para ver qué cambió.</div>' : '')
      + '<input type="search" id="client-search" placeholder="Buscar cliente o código" value="' + esc(clientFilter) + '" style="margin:.75rem 0">'
      + (active.length ? '<p class="client-group-title">En curso (' + active.length + ')</p><div class="client-list">' + active.map(clientRow).join('') + '</div>' : '')
      + (done.length ? '<p class="client-group-title">Publicados (' + done.length + ')</p><div class="client-list">' + done.map(clientRow).join('') + '</div>' : '')
      + (!list.length ? '<p class="empty">' + (q ? 'No hay clientes con esa búsqueda.' : 'Todavía no hay clientes. Se crean solos al aceptar un presupuesto.') + '</p>' : '')
      + '<details class="card" style="margin-top:1rem"><summary>➕ Crear un proyecto a mano</summary>'
      + '<p class="small muted">Para clientes que no pidieron presupuesto por la web (por ejemplo, por WhatsApp).</p>'
      + '<form id="new-project"><div class="grid">'
      + '<label>Nombre del cliente (lo ve el cliente)<input name="client" required placeholder="Ej.: Ana"></label>'
      + '<label>Proyecto<input name="project" required placeholder="Ej.: Landing · Plan Básico"></label>'
      + '<label>Idioma<select name="lang"><option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option></select></label>'
      + '<label>Entrega estimada<input type="date" name="due"></label></div><button class="primary">Crear</button></form></details>';
  };

  // Historial: lo guardado por el sitio más el pedido y la propuesta (que son anteriores al proyecto)
  const historyOf = (p) => {
    const items = (data.events || []).filter((e) => e.project === p.token).map((e) => ({ at: e.at, icon: e.icon, text: e.text }));
    const q = p.quote ? data.inquiries.find((x) => x.token === p.quote) : null;
    if (q) {
      items.push({ at: q.created, icon: '📩', text: 'Pidió presupuesto (' + q.code + ')' + (q.coupon ? ' con el cupón ' + q.coupon : '') });
      if (q.mailed) items.push({ at: q.created, icon: '✉️', text: 'Le llegó el mail de confirmación con su link' });
      if (q.proposal && q.proposal.issued) items.push({ at: q.proposal.issued, icon: '💬', text: 'Le enviaste la propuesta (' + q.proposal.price + ')' });
    }
    if (p.briefStatus === 'borrador' && p.briefUpdated) items.push({ at: p.briefUpdated, icon: '✏️', text: 'Está completando el brief (último guardado)' });
    return items.sort((a, b) => (a.at < b.at ? 1 : -1));
  };

  const renderClient = (p) => {
    const q = p.quote ? data.inquiries.find((x) => x.token === p.quote) : null;
    const head = '<button type="button" class="btn" data-back>← Todos los clientes</button>'
      + '<div class="bv-top" style="margin-top:.75rem"><div><p class="bv-client">' + esc(p.client) + '</p><p class="small muted" style="margin:0">' + esc(p.project) + (p.quoteCode ? ' · ' + esc(p.quoteCode) : '') + ' · ' + LANG[p.lang] + '</p></div>'
      + '<div class="row"><span class="chip">' + (p.stage + 1) + '. ' + STAGES[p.stage] + '</span>' + (p.briefEditUnseen ? '<span class="chip alert-chip">⚠ Editó el brief</span>' : '') + '</div></div>'
      + '<nav class="subtabs">' + SUBTABS.map(([id, label]) => '<button type="button" data-sub="' + id + '" aria-pressed="' + (subTab === id) + '">' + label + (id === 'brief' && p.briefEditUnseen ? ' ⚠' : '') + '</button>').join('') + '</nav>';
    let body = '';
    if (subTab === 'estado') {
      body = linkBox(projectLink(p), p.lang, p.client)
        + '<form class="project-form card" style="margin-top:.75rem">'
        + '<label class="check-line" style="margin-bottom:.5rem"><input type="checkbox" id="stage-notify" checked> 📧 Avisarle por mail al cliente cada vez que cambio la etapa</label>'
        + '<p class="small muted" style="margin:0 0 .4rem">Etapa actual (tocá la que corresponda; se guarda sola)</p>'
        + '<div class="stepper" role="group" aria-label="Etapa del proyecto">' + STAGES.map((st, i) => '<button type="button" class="step' + (i < p.stage ? ' is-done' : '') + '" data-stage="' + i + '" aria-pressed="' + (p.stage === i) + '"><span class="step-num">' + (i < p.stage ? '✓' : i + 1) + '</span><span class="step-name">' + st + '</span></button>').join('') + '</div>'
        + '<input type="hidden" name="stage" value="' + p.stage + '">'
        + '<div class="grid"><label>Entrega estimada<input type="date" name="due" value="' + esc(p.due) + '"></label></div>'
        + '<label>Tu próximo paso (opcional: si lo dejás vacío, se muestra el texto de la etapa)<input name="next" maxlength="400" placeholder="Ej.: Todavía necesito tu logo y los textos de la sección Servicios." value="' + esc(p.next) + '"></label>'
        + '<label style="margin-top:.75rem">Link de vista previa (opcional)<input name="preview" placeholder="https://..." value="' + esc(p.preview) + '"></label>'
        + '<label style="margin-top:.75rem">Nota para el cliente (opcional)<textarea name="note" placeholder="Ej.: Ya tengo tus fotos. Esta semana te mando la primera versión.">' + esc(p.note) + '</textarea></label>'
        + '<div class="row" style="margin-top:.75rem"><button class="primary">Guardar</button><button type="button" data-remove>Borrar proyecto</button>'
        + '<span class="small muted">Actualizado ' + date(p.updated) + '</span></div></form>';
    } else if (subTab === 'presupuesto') {
      body = q ? inquiryCard(q, true) : '<p class="empty">Este proyecto se creó a mano: no tiene un pedido de presupuesto en el sitio.</p>';
    } else if (subTab === 'brief') {
      const lockChip = p.briefStatus === 'enviado' && (p.stage === 2 || p.stage === 4) ? '<span class="chip">🔒 Cerrado para cambios</span>' : (p.briefStatus === 'enviado' ? '<span class="chip">🔓 El cliente puede editarlo</span>' : '');
      body = '<div class="row" style="margin-bottom:.75rem">' + lockChip
        + '<button type="button" data-copy="' + esc(projectLink(p) + '#brief') + '">Copiar link del brief</button>'
        + (p.quote ? '<button type="button" data-brief-mail="' + esc(p.quote) + '">Mandar link del brief por mail</button>' : '')
        + (p.briefStatus ? '<button type="button" id="brief-print">🖨 Imprimir</button>' : '') + '</div>'
        + '<div id="brief-inline"><p class="muted">Cargando el brief...</p></div>';
    } else if (subTab === 'resena') {
      const today = new Date().toISOString().slice(0, 10);
      const c = (data.coupons || []).find((x) => x.code === p.coupon);
      const cState = c ? (c.usedBy ? '✓ Usado en ' + c.usedBy : (c.expires < today ? 'Vencido' : 'Vigente')) : '';
      body = (p.coupon
        ? '<section class="bv-card" style="--bv:#7543d6"><h3 class="bv-head"><span class="bv-icon">🎁</span>Cupón de descuento</h3>'
          + '<p class="coupon-code">' + esc(p.coupon) + '</p><table><tbody>'
          + '<tr><td>Descuento</td><td class="n">' + (c ? c.percent : 20) + ' % en la próxima actualización</td></tr>'
          + '<tr><td>Entregado</td><td class="n">' + (c ? date(c.created) : '') + '</td></tr>'
          + '<tr><td>Vence</td><td class="n">' + (c ? day(c.expires) : '') + '</td></tr>'
          + '<tr><td>Estado</td><td class="n"><span class="chip ' + (cState === 'Vigente' ? 'warn' : 'ok') + '">' + esc(cState) + '</span></td></tr></tbody></table></section>'
        : '<p class="empty">El cupón se crea solo cuando pasás el proyecto a "Publicación y entrega".</p>')
        + (p.reviewToken
          ? '<section class="bv-card" style="--bv:#e0a12b"><h3 class="bv-head"><span class="bv-icon">⭐</span>Reseña</h3>'
            + (p.reviewDone ? '<p>✓ Dejó su reseña. La aprobás en la pestaña <strong>Reseñas</strong>.</p>' : '<p>Se la pedimos al publicar. Todavía no respondió.</p><div class="row"><button type="button" data-copy="' + esc(clientLink('resena', p.lang, p.reviewToken)) + '">Copiar link de la reseña</button></div>')
            + '</section>'
          : '');
    } else if (subTab === 'historial') {
      const items = historyOf(p);
      body = items.length ? '<ol class="timeline">' + items.map((it) => '<li><span class="tl-icon">' + it.icon + '</span><div><p class="tl-text">' + esc(it.text) + '</p><p class="small muted">' + date(it.at) + '</p></div></li>').join('') + '</ol>'
        : '<p class="empty">Todavía no hay movimientos.</p>';
    }
    $('tab-proyectos').innerHTML = '<article data-project="' + esc(p.token) + '">' + head + '<div class="client-body">' + body + '</div></article>';
    if (subTab === 'brief') loadBriefInline(p);
  };

  const openClient = (token, tab) => {
    selected = token; subTab = tab || 'estado';
    document.querySelectorAll('#tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.tab === 'proyectos')));
    ['consultas', 'resenas', 'proyectos', 'cupones', 'faq', 'newsletter'].forEach((t) => { $('tab-' + t).hidden = t !== 'proyectos'; });
    renderProjects();
    window.scrollTo({ top: 0 });
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

  // ---- Brief de un cliente: respuestas por sección y archivos para descargar (en su ficha, pestaña Brief)
  let briefFiles = [];
  let briefClient = '';
  const loadBriefInline = async (p) => {
    const token = p.quote || p.token;
    const box = $('brief-inline');
    if (!p.briefStatus) { box.innerHTML = '<p class="empty">Todavía no empezó el brief. Mandale el link con los botones de arriba.</p>'; return; }
    const b = await api('brief/' + token);
    briefFiles = b.files || [];
    briefClient = b.client || p.client;
    const size = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
    // Cambios de la última edición: comparando con lo que había antes
    const prev = new Map((b.prevSummary || []).map((r) => [r.s + '|' + r.q, r.a]));
    const hasPrev = Boolean(b.edited && prev.size);
    // Cada sección en su tarjeta, con ícono y color (sirve en los tres idiomas)
    const SECTION_LOOK = [
      [/antes|before|começar/i, '📋', '#7543d6'], [/vos y|you and|você e/i, '👤', '#5b8def'], [/marca|brand/i, '🎨', '#c06bd6'],
      [/tienda|store|loja/i, '🛍️', '#e0a12b'], [/web a medida|custom|sob medida/i, '🖥️', '#3fa58a'], [/landing/i, '📄', '#3fa58a'],
      [/contenido|content|conteúdo/i, '✍️', '#d0659b'], [/terminar|finish/i, '✅', '#2fa36b'],
    ];
    const look = (title) => (SECTION_LOOK.find(([re]) => re.test(title)) || [null, '•', '#7543d6']).slice(1);
    const YES = /^(sí|si|yes|sim)$/i;
    const NO = /^(no|não)$/i;
    const answer = (a, changed) => {
      if (YES.test(a)) return '<span class="ans-chip ans-yes">✓ ' + esc(a) + '</span>';
      if (NO.test(a)) return '<span class="ans-chip ans-no">' + esc(a) + '</span>';
      return '<p class="brief-view-a' + (changed ? ' is-changed' : '') + '">' + esc(a) + '</p>';
    };
    const groups = [];
    (b.summary || []).forEach((r) => {
      if (!groups.length || groups[groups.length - 1].s !== r.s) groups.push({ s: r.s, rows: [] });
      groups[groups.length - 1].rows.push(r);
    });
    const rows = groups.map((g) => {
      const [icon, color] = look(g.s);
      return '<section class="bv-card" style="--bv:' + color + '"><h3 class="bv-head"><span class="bv-icon">' + icon + '</span>' + esc(g.s) + '</h3>'
        + g.rows.map((r) => {
          const before = prev.get(r.s + '|' + r.q);
          const changed = hasPrev && before !== r.a;
          return '<div class="bv-row' + (changed ? ' is-changed' : '') + '"><p class="brief-view-q">' + esc(r.q) + (changed ? '<span class="tag-edit">' + (before === undefined ? 'Nuevo' : 'Editado') + '</span>' : '') + '</p>'
            + answer(r.a, changed)
            + (changed && before !== undefined ? '<p class="brief-view-prev">Antes: ' + esc(before) + '</p>' : '') + '</div>';
        }).join('') + '</section>';
    }).join('');
    const current = new Set((b.summary || []).map((r) => r.s + '|' + r.q));
    const removed = hasPrev ? (b.prevSummary || []).filter((r) => !current.has(r.s + '|' + r.q)) : [];
    const removedHtml = removed.length ? '<section class="bv-card" style="--bv:#d0453f"><h3 class="bv-head"><span class="bv-icon">🗑️</span>Respuestas que quitó</h3>' + removed.map((r) => '<div class="bv-row"><p class="brief-view-q">' + esc(r.q) + '</p><p class="brief-view-prev">' + esc(r.a) + '</p></div>').join('') + '</section>' : '';
    const editNote = b.edited ? '<div class="alert">' + (b.editUnseen ? '⚠ ' : '✏️ ') + 'El cliente editó el brief después de enviarlo (última edición: ' + date(b.edited) + '). Lo que cambió está marcado en amarillo.</div>' : '';
    // Doble barra: esta página se arma dentro de un texto del Worker
    const fileIcon = (name) => (/\\.(png|jpe?g|webp|gif|svg|heic|heif)$/i.test(name) ? '🖼️' : /\\.pdf$/i.test(name) ? '📕' : /\\.(xlsx?|ods|csv)$/i.test(name) ? '📊' : /\\.zip$/i.test(name) ? '🗜️' : '📝');
    const files = (b.files || []).length
      ? '<section class="bv-card" style="--bv:#5b8def"><h3 class="bv-head"><span class="bv-icon">📎</span>Archivos (' + b.files.length + ')</h3><p class="small muted" style="margin:0 0 .5rem">Se descargan a la carpeta Descargas de tu compu.</p><div class="row" style="margin-bottom:.5rem"><button type="button" class="primary" id="zip-all">⬇ Descargar todos (.zip)</button></div><ul class="brief-files-list">' + b.files.map((f) => '<li><span class="bv-file-icon">' + fileIcon(f.name) + '</span><span>' + esc(f.name) + ' <small class="muted">' + size(f.size) + '</small></span><button type="button" data-file="' + f.id + '" data-name="' + esc(f.name) + '">⬇ Descargar</button></li>').join('') + '</ul></section>'
      : '';
    const stateChip = b.status === 'enviado' ? '<span class="chip ok">✓ Enviado el ' + date(b.sent) + '</span>' : b.status === 'borrador' ? '<span class="chip warn">✏️ En curso · ' + date(b.updated) + '</span>' : '<span class="chip">Sin empezar</span>';
    const summaryCard = '<div class="bv-top"><div><p class="bv-client">' + esc(b.client || '') + '</p><p class="small muted" style="margin:0">' + esc(b.planText || '') + '</p></div><div class="row">' + stateChip + '<span class="chip">🌐 ' + LANG[b.lang] + '</span></div></div>';
    if (!$('brief-inline')) return;
    $('brief-inline').innerHTML = summaryCard + editNote + files + (rows || '<p class="empty">Todavía no hay respuestas.</p>') + removedHtml;
    // Abrirlo cuenta como "visto": se va la alerta (se actualiza la lista sin volver a dibujar el brief)
    if (b.editUnseen) { const fresh = await api('datos'); data.projects = fresh.projects; const pr = data.projects.find((x) => x.token === p.token); if (pr) { $('n-proyectos').textContent = ''; } }
  };
  const printBrief = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const title = 'Brief · ' + briefClient;
    w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:44rem;margin:2rem auto;padding:0 1rem;color:#211632}.brief-view-section{color:#5d31b8;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:1.4rem 0 .4rem}.brief-view-q{font-weight:800;margin:.8rem 0 .1rem}.brief-view-a{margin:0;white-space:pre-line}button{display:none}ul{padding-left:1rem}.bv-card{border:1px solid #d9c6e8;border-radius:12px;padding:4px 14px 10px;margin:0 0 12px}.bv-head{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5d31b8}</style><h1>' + esc(title) + '</h1>' + $('brief-inline').innerHTML);
    w.document.close();
    w.print();
  };

  // Todos los archivos del brief en un .zip (la herramienta JSZip se carga recién al tocar el botón, con su huella de seguridad)
  const loadZip = () => (window.JSZip ? Promise.resolve() : new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    sc.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
    sc.crossOrigin = 'anonymous';
    sc.referrerPolicy = 'no-referrer';
    sc.onload = resolve; sc.onerror = reject;
    document.head.append(sc);
  }));
  const zipAll = async (btn) => {
    btn.disabled = true;
    const label = btn.textContent;
    try {
      await loadZip();
      const zip = new window.JSZip();
      const used = new Set();
      for (let k = 0; k < briefFiles.length; k += 1) {
        const f = briefFiles[k];
        btn.textContent = 'Preparando ' + (k + 1) + ' de ' + briefFiles.length + '...';
        const res = await fetch('/api/admin/archivo/' + f.id, { headers: { 'x-clave': key } });
        if (!res.ok) throw new Error(res.status);
        let name = f.name;
        while (used.has(name)) name = (k + 1) + '-' + name;
        used.add(name);
        zip.file(name, await res.blob());
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'brief-' + briefClient.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, '-').replace(/^-|-$/g, '') + '.zip';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Listo: el .zip quedó en tu carpeta Descargas');
    } catch (err) { toast('No se pudo armar el .zip. Descargalos de a uno.'); }
    btn.disabled = false;
    btn.textContent = label;
  };

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
  // ---- Horario de atención: "Disponible ahora / Fuera de horario" del inicio.
  // El horario habitual (días hábiles de 9 a 17) lo calcula js/availability.js, el mismo que usa el inicio.
  const HOURS_DATE = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' });
  const AWAY_GROUPS = [['mismo', 'Vuelvo hoy', 'Elegís la hora de regreso.'], ['dia', 'Vuelvo el próximo día hábil', 'Elegís la hora; el día lo calcula solo (saltea fines de semana y feriados).'], ['sin', 'Sin hora de regreso', 'Sigue cerrado hasta que lo reabras o hasta la próxima apertura habitual.']];
  const pad = (n) => String(n).padStart(2, '0');
  const defaultHour = (group) => {
    if (group === 'dia') return '09:00';
    const t = new Date(Date.now() + 60 * 60 * 1000);
    const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(t);
    const h = Number(parts.find((x) => x.type === 'hour').value);
    const m = Number(parts.find((x) => x.type === 'minute').value);
    return m <= 30 ? pad(h) + ':30' : pad((h + 1) % 24) + ':00';
  };
  // Lo que se va a guardar con lo elegido en el formulario de ausencia
  const awayPlan = (values) => {
    const H = window.JNBHours;
    const group = values.grupo || 'sin';
    const mensaje = values.mensaje && values.mensaje.startsWith(group + '-') ? values.mensaje : group + '-1';
    if (group === 'sin') return { mensaje, hasta: H.manualUntil('cerrado'), regreso: false };
    if (!/^[0-9]{2}:[0-9]{2}$/.test(values.hora || '')) return { mensaje, error: 'Elegí la hora de regreso.' };
    const day = group === 'mismo' ? H.today() : H.nextBusinessDay();
    if (!day) return { mensaje, error: 'No se pudo calcular el próximo día hábil.' };
    const hasta = new Date(day + 'T' + values.hora + ':00-03:00');
    if (hasta <= new Date()) return { mensaje, error: 'Esa hora ya pasó: elegí una más tarde.' };
    return { mensaje, hasta, regreso: true };
  };
  const awayOptions = (group) => Object.keys(window.JNBHours.AWAY).filter((id) => id.startsWith(group + '-'))
    .map((id) => '<option value="' + id + '">' + esc(window.JNBHours.AWAY[id].es.replace('{hora}', '[hora]').replace('{cuando}', 'mañana')) + '</option>').join('');
  const awayPreview = (form) => {
    const values = Object.fromEntries(new FormData(form));
    const plan = awayPlan(values);
    $('away-hora').hidden = values.grupo === 'sin';
    $('away-preview').textContent = window.JNBHours.awayText(plan.mensaje, plan.regreso && plan.hasta ? plan.hasta : null, 'es');
    $('away-until').textContent = plan.error ? '⚠ ' + plan.error
      : plan.regreso ? 'Vuelve a abrir solo el ' + HOURS_DATE.format(plan.hasta) + '.'
        : 'Sigue cerrado hasta que lo reabras o, si no, hasta la próxima apertura habitual (' + HOURS_DATE.format(plan.hasta) + ').';
  };
  let hoursEditing = false;
  const renderHours = () => {
    const H = window.JNBHours;
    if (!H) { $('hours').innerHTML = ''; return; }
    hoursEditing = false;
    const h = data.hours || {};
    const manual = h.modo && new Date(h.hasta) > new Date() ? h.modo : '';
    const scheduledOpen = H.isOpenAt(new Date());
    const away = manual === 'cerrado' && scheduledOpen;
    const open = manual === 'abierto' || (scheduledOpen && !away);
    const until = manual ? HOURS_DATE.format(new Date(h.hasta)) : '';
    const awayNow = manual === 'cerrado' ? H.awayText(h.mensaje, h.regreso ? new Date(h.hasta) : null, 'es') : '';
    const group = 'mismo';
    const form = '<details class="away-box"><summary class="btn primary">Cerrar ahora (ausencia)</summary><form id="away-form">'
      + '<div class="avail-options">' + AWAY_GROUPS.map(([v, title, hint]) => '<label class="avail-option"><input type="radio" name="grupo" value="' + v + '"' + (v === group ? ' checked' : '') + '><span>' + title + '<br><span class="small muted" style="font-weight:500">' + hint + '</span></span></label>').join('') + '</div>'
      + '<div class="grid"><label>Mensaje<select name="mensaje">' + awayOptions(group) + '</select></label>'
      + '<label id="away-hora">Hora de regreso<input type="time" name="hora" step="900" value="' + defaultHour(group) + '"></label></div>'
      + '<p class="avail-preview"><span class="small muted">Así se ve en el inicio:</span><br><strong id="away-preview"></strong><br><span class="small muted" id="away-until"></span></p>'
      + '<p class="small muted" style="margin:0 0 .75rem">El mensaje de ausencia se ve solo de 9 a 17 en días hábiles. Fuera de ese horario se ve siempre el mensaje habitual de "Fuera de horario".</p>'
      + '<button class="primary">Activar ausencia</button></form></details>';
    $('hours').innerHTML = '<div class="card"><div class="row space"><h2 style="margin:0">Horario de atención</h2>'
      + '<span class="chip ' + (open ? 'ok' : 'warn') + '">' + (open ? 'Disponible ahora' : away ? 'Ausente' : 'Fuera de horario') + '</span></div>'
      + '<p class="small muted" style="margin:.4rem 0 .75rem">El cartel de la sección Disponibilidad del inicio, en los tres idiomas. Horario habitual: lunes a viernes de 9 a 17, sin feriados.</p>'
      + (manual === 'cerrado'
        ? '<div class="alert" style="margin-bottom:.75rem">🔴 Ausencia activa: <strong>“' + esc(awayNow) + '”</strong><br>'
          + (h.regreso ? 'Vuelve a abrir solo el ' : 'Sigue cerrado hasta que lo reabras o hasta la próxima apertura habitual: ') + esc(until) + '.'
          + (scheduledOpen ? '' : '<br>Ahora es fuera de horario, así que el inicio muestra el mensaje habitual de "Fuera de horario".') + '</div>'
        : manual === 'abierto'
          ? '<div class="alert" style="margin-bottom:.75rem">🟢 Abierto a mano hasta el ' + esc(until) + '. Ahí vuelve solo el horario habitual.</div>'
          : '<p style="margin:0 0 .75rem">Funciona con el horario habitual.</p>')
      + '<div class="row">'
      + (manual === 'cerrado' ? '<button type="button" class="primary" data-hours="">' + (scheduledOpen ? 'Reabrir ahora' : 'Cancelar la ausencia') + '</button>' : '')
      + (manual === 'abierto' ? '<button type="button" data-hours="">Volver al horario habitual</button>' : '')
      + (!manual && !scheduledOpen ? '<button type="button" class="primary" data-hours="abierto">Abrir ahora</button>' : '')
      + '</div>'
      + (manual !== 'cerrado' && (scheduledOpen || manual === 'abierto') ? form : '')
      + '</div>';
    if ($('away-form')) awayPreview($('away-form'));
  };
  document.addEventListener('input', (e) => {
    const form = e.target.closest('#away-form');
    if (!form) return;
    hoursEditing = true;
    if (e.target.name === 'grupo') {
      form.elements.mensaje.innerHTML = awayOptions(e.target.value);
      form.elements.hora.value = defaultHour(e.target.value);
    }
    awayPreview(form);
  });
  document.addEventListener('toggle', (e) => { if (e.target.classList && e.target.classList.contains('away-box')) hoursEditing = e.target.open; }, true);
  // Cada minuto se actualiza (por ejemplo, cuando termina una ausencia), salvo mientras completás el formulario
  setInterval(() => { if (data && !hoursEditing) renderHours(); }, 60 * 1000);

  document.addEventListener('change', (e) => {
    const form = e.target.closest('#availability-form');
    if (!form) return;
    const values = Object.fromEntries(new FormData(form));
    $('avail-month').hidden = values.estado !== 'agenda';
    $('avail-preview').textContent = availPreview(values.estado, values.reservaDesde);
  });

  // ---- Cupones: 20 % para la próxima actualización, se entregan al publicar un proyecto
  const couponState = (c) => {
    const today = new Date().toISOString().slice(0, 10);
    if (c.usedBy) return ['ok', '✓ Usado en ' + c.usedBy + (c.usedAt ? ' · ' + date(c.usedAt) : '')];
    if (c.expires && c.expires < today) return ['', 'Vencido'];
    return ['warn', 'Vigente'];
  };
  const renderCoupons = () => {
    const list = data.coupons || [];
    const active = list.filter((c) => couponState(c)[1] === 'Vigente').length;
    $('n-cupones').textContent = active || '';
    $('tab-cupones').innerHTML = '<h2>Cupones de descuento</h2>'
      + '<p class="muted">Se entregan solos al pasar un proyecto a "Publicación y entrega": 20 % en la próxima actualización, un solo uso, válido por 3 meses. El cliente lo usa en el pedido de presupuesto ("Actualizar una web o tienda").</p>'
      + (list.length ? '<table><thead><tr><th>Cupón</th><th>Cliente</th><th>Entregado</th><th>Vence</th><th>Estado</th></tr></thead><tbody>'
        + list.map((c) => { const [cls, label] = couponState(c); return '<tr><td><strong class="code">' + esc(c.code) + '</strong><br><span class="small muted">' + c.percent + ' %</span></td>'
          + '<td>' + esc(c.client) + (c.email ? '<br><span class="small muted">' + esc(c.email) + '</span>' : '') + '</td>'
          + '<td>' + date(c.created) + '</td><td>' + day(c.expires) + '</td><td><span class="chip ' + cls + '">' + esc(label) + '</span></td></tr>'; }).join('')
        + '</tbody></table>' : '<p class="empty">Todavía no hay cupones. Se crea uno cuando publicás un proyecto.</p>');
  };

  // ---- Mails: estado, último error y prueba de envío (con lo que significa cada respuesta de Resend)
  const explainMail = (r) => {
    const e = String(r.error || '').toLowerCase();
    if (!r.status && /faltan/.test(e)) return 'Faltan claves en Cloudflare: cargá RESEND_API_KEY y MAIL_FROM como Secret (Workers → jimenabernadazdev → Settings → Variables and Secrets).';
    if (r.status === 401 || /api key is invalid|invalid api key|missing api key/.test(e)) return 'La clave de Resend no sirve: creá una nueva en Resend (API keys → Create API key, permiso Sending access) y reemplazá RESEND_API_KEY en Cloudflare.';
    if (/only send testing emails|testing emails to your own/.test(e)) return 'MAIL_FROM está usando la dirección de prueba de Resend. Cambiala por: JNB Creative Studio <hola@jnbcreativestudio.com.ar>';
    if (/not verified|verify a domain|domain is not/.test(e)) return 'El dominio de MAIL_FROM no está verificado en Resend. Revisá que MAIL_FROM termine en @jnbcreativestudio.com.ar y que en Resend → Domains diga Verified.';
    if (r.status === 403 && /restricted|permission|not allowed/.test(e)) return 'La clave de Resend no tiene permiso para este dominio: creá una con permiso Sending access para jnbcreativestudio.com.ar (o Full access) y reemplazala.';
    if (r.status === 422 || /from/.test(e)) return 'MAIL_FROM está mal escrito. Tiene que quedar exactamente así, sin comillas: JNB Creative Studio <hola@jnbcreativestudio.com.ar>';
    if (r.status === 429) return 'Se mandaron muchos mails seguidos. Esperá un minuto y probá de nuevo.';
    return 'Resend no aceptó el envío. Copiame el mensaje de arriba y lo reviso.';
  };
  const renderMailCheck = () => {
    const err = data.mailError;
    $('mail-check').innerHTML = '<details class="card"' + (data.mailReady && !err ? '' : ' open') + '><summary>📧 Mails al cliente: '
      + (data.mailReady ? '<span class="chip ok">claves cargadas</span>' : '<span class="chip warn">faltan claves</span>') + (err ? ' <span class="chip alert-chip">hubo un error</span>' : '') + '</summary>'
      + (err ? '<div class="alert" style="margin-top:.75rem">Último error (' + date(err.at) + ', a ' + esc(err.to || '') + '): <strong>' + esc(err.error) + '</strong><br>' + esc(explainMail(err)) + '</div>' : '')
      + '<form id="mail-test" class="row" style="margin-top:.75rem"><input type="email" name="to" required placeholder="Tu mail, por ejemplo jnb.creativestudio@gmail.com" style="flex:1;min-width:14rem"><button class="primary">Probar envío de mail</button></form>'
      + '<div id="mail-test-result"></div></details>';
  };

  // ---- Newsletter del blog: suscriptores y avisos de artículos nuevos
  const renderNewsletter = () => {
    const n = data.newsletter;
    if (!n) { $('tab-newsletter').innerHTML = '<p class="empty">No se pudieron cargar los datos.</p>'; return; }
    const active = n.subscribers.filter((s) => s.status === 'activo');
    const waiting = n.subscribers.length - active.length;
    $('n-newsletter').textContent = active.length || '';
    $('tab-newsletter').innerHTML = '<h2>Newsletter del blog</h2>'
      + '<p class="muted">Quien deja su mail en el blog recibe un mail para confirmar; recién ahí queda anotado. Cuando se publica un artículo, a la hora siguiente le llega a cada suscriptor un aviso con la foto, el resumen y el link. Cada aviso trae su link para darse de baja.</p>'
      + '<p><strong>' + active.length + '</strong> ' + (active.length === 1 ? 'suscriptor confirmado' : 'suscriptores confirmados') + (waiting ? ' · <span class="muted">' + waiting + ' sin confirmar (se borran solos a los 7 días)</span>' : '') + '</p>'
      + '<form id="newsletter-test" class="row" style="margin:.75rem 0 1.25rem"><input type="email" name="to" required placeholder="Tu mail, para ver cómo llega el aviso del último artículo" style="flex:1;min-width:14rem"><button class="primary">Mandarme una prueba</button></form>'
      + (n.subscribers.length ? '<table><thead><tr><th>Mail</th><th>Estado</th><th>Desde</th><th></th></tr></thead><tbody>'
        + n.subscribers.map((s) => '<tr><td>' + esc(s.email) + '</td><td><span class="chip ' + (s.status === 'activo' ? 'ok' : 'warn') + '">' + (s.status === 'activo' ? 'Confirmado' : 'Sin confirmar') + '</span></td>'
          + '<td>' + date(s.confirmed || s.created) + '</td><td class="n"><button type="button" data-unsub="' + esc(s.email) + '">Quitar</button></td></tr>').join('')
        + '</tbody></table>' : '<p class="empty">Todavía no hay suscriptores.</p>')
      + '<h2 style="margin-top:1.5rem">Avisos enviados</h2>'
      + (n.sent.filter((x) => !x.silent).length ? '<table><thead><tr><th>Artículo</th><th>Enviado</th><th class="n">Llegaron a Resend</th></tr></thead><tbody>'
        + n.sent.filter((x) => !x.silent).map((x) => '<tr><td><a href="/blog/' + esc(x.slug) + '/" target="_blank">' + esc(x.title) + '</a>' + (x.error ? '<br><span class="small" style="color:#d0453f">' + esc(x.error) + '</span>' : '') + '</td><td>' + date(x.at) + '</td><td class="n">' + x.ok + ' de ' + x.total + '</td></tr>').join('')
        + '</tbody></table>' : '<p class="empty">Todavía no salió ningún aviso. Los artículos que ya estaban publicados no se avisan; sale uno con cada artículo nuevo.</p>');
  };

  const render = () => { renderAvailability(); renderHours(); renderMailCheck(); renderInquiries(); renderReviews(); renderProjects(); renderCoupons(); renderFaq(); renderNewsletter(); };

  // ---- Acciones
  $('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    key = $('key').value.trim();
    try { sessionStorage.setItem('jnb-admin', key); } catch (err) {}
    load().catch(() => {});
  });
  $('logout').addEventListener('click', () => { key = ''; try { sessionStorage.removeItem('jnb-admin'); } catch (e) {} showLogin(false); });

  document.addEventListener('input', (e) => {
    if (e.target.id !== 'client-search') return;
    clientFilter = e.target.value;
    const pos = e.target.selectionStart;
    renderProjects();
    const again = $('client-search'); again.focus(); again.setSelectionRange(pos, pos);
  });

  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    document.querySelectorAll('#tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    ['consultas', 'resenas', 'proyectos', 'cupones', 'faq', 'newsletter'].forEach((t) => { $('tab-' + t).hidden = t !== b.dataset.tab; });
    if (b.dataset.tab === 'proyectos') { selected = ''; renderProjects(); }
  });

  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) { e.preventDefault(); copy(copyBtn.dataset.copy); return; }
    const resend = e.target.closest('[data-resend]');
    if (resend) {
      if (!confirm('¿Mandarle al cliente el mail de confirmación con sus respuestas?')) return;
      resend.disabled = true;
      const r = await api('reenviar/' + resend.dataset.resend, {}).catch(() => ({ ok: false }));
      toast(r.ok ? 'Mail enviado al cliente' : 'No se pudo enviar el mail');
      if (r.ok) load(); else resend.disabled = false;
      return;
    }
    const mail = e.target.closest('[data-mail]');
    if (mail) {
      e.preventDefault();
      const html = await api('mail/' + mail.dataset.mail);
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
      return;
    }
    const openBtn = e.target.closest('[data-open]');
    if (openBtn) { openClient(openBtn.dataset.open); return; }
    const openQuote = e.target.closest('[data-open-quote]');
    if (openQuote) { const pr = data.projects.find((x) => x.quote === openQuote.dataset.openQuote); if (pr) openClient(pr.token, 'presupuesto'); return; }
    if (e.target.closest('[data-back]')) { selected = ''; renderProjects(); return; }
    const sub = e.target.closest('[data-sub]');
    if (sub) { subTab = sub.dataset.sub; renderProjects(); return; }
    if (e.target.closest('#brief-print')) { printBrief(); return; }
    const zipBtn = e.target.closest('#zip-all');
    if (zipBtn) { zipAll(zipBtn); return; }
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
        const notify = Boolean($('stage-notify') && $('stage-notify').checked);
        const r = await api('proyectos/' + form.closest('[data-project]').dataset.project, { stage: Number(values.stage), due: values.due, note: values.note, next: values.next, preview: values.preview, notify });
        toast(r.launched
          ? (r.launchMailed ? '¡Publicado! Le mandé el mail con la reseña y su cupón ' + r.coupon : '¡Publicado! Se creó el cupón ' + r.coupon + ' y el pedido de reseña (el mail no salió: revisá que tenga mail)')
          : 'Etapa: ' + STAGES[Number(values.stage)] + '. ' + (r.stageMailed ? 'Le avisé por mail.' : (notify ? 'El cliente la ve en su link (el mail no salió).' : 'El cliente la ve en su link.')));
        load();
      } catch (err) {
        form.querySelectorAll('.step').forEach((b) => { b.disabled = false; });
        toast('No se pudo guardar');
      }
      return;
    }
    const hoursBtn = e.target.closest('[data-hours]');
    if (hoursBtn) {
      const modo = hoursBtn.dataset.hours;
      const hasta = modo ? window.JNBHours.manualUntil(modo) : null;
      if (modo && !hasta) { toast('No se pudo calcular el próximo horario'); return; }
      hoursBtn.disabled = true;
      try {
        data.hours = await api('horario', { modo, hasta: hasta ? hasta.toISOString() : '' });
        renderHours();
        toast(!modo ? 'Listo: vuelve el horario habitual' : 'Abierto hasta el ' + HOURS_DATE.format(hasta));
      } catch (err) { hoursBtn.disabled = false; toast('No se pudo guardar'); }
      return;
    }
    const unsub = e.target.closest('[data-unsub]');
    if (unsub) {
      if (!confirm('¿Quitar ' + unsub.dataset.unsub + ' del newsletter? No le llegan más avisos.')) return;
      await api('newsletter/borrar', { email: unsub.dataset.unsub });
      data.newsletter = await api('newsletter'); renderNewsletter(); toast('Quitado del newsletter');
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
      values.price = values.amount && values.amount.trim() ? values.currency + ' ' + values.amount.trim() : '';
      values.notify = values.notify === 'on';
      if (SENT.includes(values.status) && !values.price) { toast('Falta el precio'); return; }
      const saved = await api('presupuestos/' + form.closest('[data-token]').dataset.token, values);
      toast(saved.created ? (saved.briefMailed ? 'Aceptado: se creó el proyecto y le mandé el link del brief por mail' : 'Aceptado: se creó el proyecto (copiá el link del brief en Clientes)')
        : (saved.proposalMailed ? 'Propuesta guardada y le avisé por mail' : 'Propuesta guardada'));
      load();
    } else if (form.id === 'invite') {
      e.preventDefault();
      const { token } = await api('resenas/invitar', { client: values.client });
      const link = clientLink('resena', values.lang, token);
      const wa = 'https://wa.me/?text=' + encodeURIComponent('¡Hola! Me ayudaría mucho que me dejes tu opinión sobre el trabajo que hicimos juntos: ' + link);
      $('invite-result').innerHTML = '<div class="linkbox">' + esc(link) + '</div><div class="row"><button type="button" data-copy="' + esc(link) + '">Copiar link</button><a class="btn" target="_blank" href="' + esc(wa) + '">Mandar por WhatsApp ↗</a></div>';
      form.reset();
      const fresh = await api('datos'); data.invitations = fresh.invitations;
    } else if (form.id === 'mail-test') {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = 'Enviando...';
      const to = new FormData(form).get('to');
      const r = await api('probar-mail', { to }).catch(() => ({ ok: false, status: 0, error: 'No se pudo conectar con el sitio.' }));
      $('mail-test-result').innerHTML = r.ok
        ? '<div class="alert" style="margin-top:.75rem;background:color-mix(in srgb,#2fa36b 15%,var(--card));border-color:#2fa36b;color:inherit">✓ Resend aceptó el mail. Revisá ' + esc(to) + ' (y la carpeta de spam). Si llegó, los avisos a los clientes ya funcionan.</div>'
        : '<div class="alert" style="margin-top:.75rem">✗ No salió. Respuesta de Resend' + (r.status ? ' (' + r.status + ')' : '') + ': <strong>' + esc(r.error || '') + '</strong><br><br>👉 ' + esc(explainMail(r))
          + '<br><br><span class="small">Lo que tiene cargado el sitio: MAIL_FROM = <code>' + esc(r.from || '(vacío)') + '</code> · MAIL_REPLY_TO = <code>' + esc(r.replyTo || '(vacío)') + '</code> · RESEND_API_KEY ' + (r.hasKey ? 'cargada (empieza con ' + esc(r.keyStart) + '…)' : 'vacía') + '</span>'
          + (r.hasKey && !r.keyLooksRight ? '<br><br>⚠ La clave cargada no empieza con <code>re_</code>: las claves de Resend siempre empiezan así. Copiá de nuevo la clave desde Resend y pegá solo eso en RESEND_API_KEY.' : '') + '</div>';
      btn.disabled = false; btn.textContent = 'Probar envío de mail';
      if (!r.ok) { const fresh = await api('datos'); data.mailError = fresh.mailError; }
    } else if (form.id === 'newsletter-test') {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      const r = await api('newsletter/probar', { to: new FormData(form).get('to') }).catch(() => ({ ok: false, error: 'No se pudo conectar con el sitio.' }));
      toast(r.ok ? 'Te mandé el aviso de "' + r.title + '"' : 'No salió: ' + (r.error || 'revisá los mails en "Mails al cliente"'));
      btn.disabled = false;
    } else if (form.id === 'away-form') {
      e.preventDefault();
      const plan = awayPlan(Object.fromEntries(new FormData(form)));
      if (plan.error || !plan.hasta) { toast(plan.error || 'No se pudo calcular el horario'); return; }
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        data.hours = await api('horario', { modo: 'cerrado', hasta: plan.hasta.toISOString(), mensaje: plan.mensaje });
        renderHours();
        toast('Ausencia activada');
      } catch (err) { btn.disabled = false; toast('No se pudo guardar'); }
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
