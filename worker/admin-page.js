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
  .toast { background: var(--accent); border-radius: 999px; bottom: 1.25rem; color: var(--on-accent); font-weight: 800; left: 50%;
    padding: .55rem 1.1rem; position: fixed; transform: translateX(-50%); }
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
  <div class="toast" id="toast" role="status" hidden></div>
</div>
<script>
(() => {
  const STAGES = ['Confirmación y pago', 'Material recibido', 'Diseño', 'Revisión', 'Publicación'];
  const STATUS = { recibido: 'Recibido', preparando: 'Preparando', enviado: 'Enviado' };
  const LANG = { es: 'Español', en: 'Inglés', pt: 'Portugués' };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const date = (iso) => iso ? new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const day = (iso) => iso ? iso.split('-').reverse().join('/') : '';
  const clientLink = (page, lang, token) => location.origin + '/' + page + '/' + (lang === 'es' ? '' : lang) + '?c=' + token;
  const $ = (id) => document.getElementById(id);

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
    $('n-consultas').textContent = list.filter((q) => q.kind === 'presupuesto' && q.status !== 'enviado').length || '';
    const mailNote = data.mailReady ? '' : '<p class="small muted">El mail de confirmación todavía no se envía: faltan cargar RESEND_API_KEY y MAIL_FROM en Cloudflare. Las consultas se guardan igual.</p>';
    $('tab-consultas').innerHTML = '<h2>Consultas y pedidos de presupuesto</h2>' + mailNote + (list.length ? list.map((q) => {
      const isQuote = q.kind === 'presupuesto';
      const p = q.proposal || {};
      return '<article class="card" data-token="' + esc(q.token) + '">'
        + '<div class="row space"><div class="row"><span class="code">' + esc(q.code) + '</span>'
        + '<span class="chip">' + (isQuote ? 'Presupuesto' : 'Consulta') + '</span>'
        + (isQuote ? '<span class="chip ' + (q.status === 'enviado' ? 'ok' : 'warn') + '">' + STATUS[q.status] + '</span>' : '')
        + '</div><span class="small muted">' + date(q.created) + ' · ' + LANG[q.lang] + '</span></div>'
        + '<p style="margin-top:.5rem"><strong>' + esc(q.name) + '</strong> · <a href="mailto:' + esc(q.email) + '?subject=' + encodeURIComponent(q.code) + '">' + esc(q.email) + '</a>'
        + (q.plan ? ' · ' + esc(q.plan) : '') + '</p>'
        + '<div class="message">' + esc(q.message) + '</div>'
        + '<div class="row small"><span class="muted">' + (q.mailed ? 'Mail de confirmación enviado ✓' : 'Sin mail de confirmación') + '</span>'
        + '<a class="btn" href="#" data-mail="' + esc(q.code) + '">Ver el mail</a>'
        + (isQuote ? '<button data-copy="' + esc(clientLink('mi-presupuesto', q.lang, q.token)) + '">Copiar link del cliente</button>'
          + '<a class="btn" target="_blank" href="' + esc(clientLink('mi-presupuesto', q.lang, q.token)) + '">Abrir ↗</a>' : '') + '</div>'
        + (isQuote ? '<details' + (q.status !== 'enviado' ? ' open' : '') + '><summary>Cargar la propuesta</summary><form class="quote-form">'
          + '<div class="grid"><label>Estado<select name="status">' + Object.entries(STATUS).map(([v, l]) => '<option value="' + v + '"' + (q.status === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>'
          + '<label>Precio<input name="price" placeholder="Ej.: ARS 450.000 o USD 380" value="' + esc(p.price) + '"></label>'
          + '<label>Válido hasta<input type="date" name="validUntil" value="' + esc(p.validUntil) + '"></label></div>'
          + '<label>Qué incluye (uno por renglón)<textarea name="includes">' + esc(p.includes) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Nota para el cliente (opcional)<textarea name="note">' + esc(p.note) + '</textarea></label>'
          + '<p class="small muted" style="margin-top:.5rem">El cliente ve la propuesta solo cuando el estado es "Enviado".</p>'
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
    $('n-proyectos').textContent = data.projects.filter((p) => p.stage < STAGES.length - 1).length || '';
    $('tab-proyectos').innerHTML = '<h2>Seguimiento de proyectos</h2>'
      + '<form class="card" id="new-project"><h3>Nuevo proyecto</h3><div class="grid">'
      + '<label>Nombre del cliente (lo ve el cliente)<input name="client" required placeholder="Ej.: Ana"></label>'
      + '<label>Proyecto<input name="project" required placeholder="Ej.: Landing · Plan Básico"></label>'
      + '<label>Idioma<select name="lang"><option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option></select></label>'
      + '<label>Entrega estimada<input type="date" name="due"></label></div><button class="primary">Crear</button></form>'
      + (data.projects.length ? data.projects.map((p) => '<article class="card" data-project="' + esc(p.token) + '">'
        + '<div class="row space"><div class="row"><strong>' + esc(p.client) + '</strong><span class="muted">' + esc(p.project) + '</span></div>'
        + '<span class="chip">' + STAGES[p.stage] + '</span></div>'
        + '<form class="project-form"><div class="grid"><label>Etapa<select name="stage">' + STAGES.map((s, i) => '<option value="' + i + '"' + (p.stage === i ? ' selected' : '') + '>' + (i + 1) + '. ' + s + '</option>').join('') + '</select></label>'
        + '<label>Entrega estimada<input type="date" name="due" value="' + esc(p.due) + '"></label></div>'
        + '<label>Nota para el cliente (opcional)<textarea name="note" placeholder="Ej.: Ya tengo tus fotos. Esta semana te mando la primera versión.">' + esc(p.note) + '</textarea></label>'
        + '<div class="row" style="margin-top:.75rem"><button class="primary">Guardar</button>'
        + '<button type="button" data-copy="' + esc(clientLink('mi-proyecto', p.lang, p.token)) + '">Copiar link del cliente</button>'
        + '<a class="btn" target="_blank" href="' + esc(clientLink('mi-proyecto', p.lang, p.token)) + '">Abrir ↗</a>'
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

  const render = () => { renderInquiries(); renderReviews(); renderProjects(); renderFaq(); };

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
    const set = e.target.closest('[data-set]');
    if (set) {
      if (set.dataset.set === 'borrar' && !confirm('¿Borrar esta reseña? No se puede deshacer.')) return;
      await api('resenas/' + set.closest('[data-review]').dataset.review, { status: set.dataset.set });
      toast('Listo'); load();
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
      if (values.status === 'enviado' && !values.price.trim()) { toast('Falta el precio'); return; }
      await api('presupuestos/' + form.closest('[data-token]').dataset.token, values);
      toast('Propuesta guardada'); load();
    } else if (form.id === 'invite') {
      e.preventDefault();
      const { token } = await api('resenas/invitar', { client: values.client });
      const link = clientLink('resena', values.lang, token);
      const wa = 'https://wa.me/?text=' + encodeURIComponent('¡Hola! Me ayudaría mucho que me dejes tu opinión sobre el trabajo que hicimos juntos: ' + link);
      $('invite-result').innerHTML = '<div class="linkbox">' + esc(link) + '</div><div class="row"><button type="button" data-copy="' + esc(link) + '">Copiar link</button><a class="btn" target="_blank" href="' + esc(wa) + '">Mandar por WhatsApp ↗</a></div>';
      form.reset();
      const fresh = await api('datos'); data.invitations = fresh.invitations;
    } else if (form.id === 'new-project') {
      e.preventDefault();
      await api('proyectos', values);
      toast('Proyecto creado'); load();
    } else if (form.classList.contains('project-form')) {
      e.preventDefault();
      await api('proyectos/' + form.closest('[data-project]').dataset.project, { stage: Number(values.stage), due: values.due, note: values.note });
      toast('Guardado'); load();
    }
  });

  if (key) load().catch(() => {}); else showLogin(false);
})();
</script>
</body></html>`;
