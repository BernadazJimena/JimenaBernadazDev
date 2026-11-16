// Vista previa del brief en el panel (/api/admin, módulo #brief). Solo lectura: muestra las preguntas que ve cada plan.
// Las preguntas viven en js/brief.js (window.JNBBriefSchema); acá no se edita ni se guarda nada.
(() => {
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PLANS = [['emprendedor', 'Emprendedor (tienda)'], ['basico', 'Básico (landing)'], ['premium', 'Premium (web completa)'], ['medida', 'Plan a medida']];
    const TYPES = { text: 'Texto corto', textarea: 'Texto largo', radio: 'Una opción', checkbox: 'Varias opciones', check: 'Casilla', file: 'Archivos', select: 'Lista', email: 'Mail', tel: 'Teléfono', url: 'Link', date: 'Fecha' };
    let plan = 'premium';
    let previewLang = 'es';

    // Los textos pueden ser funciones según el plan: se calculan con un cliente sin respuestas ni adicionales
    // Para ver las condicionales: "todos los adicionales pedidos" (x) y "respondió que sí a todo" (a)
    const ALL = new Proxy({}, { get: () => true });
    const YES = new Proxy({}, { get: () => 'yes' });
    // Plan a medida: el brief lo trata como web (premium) y suma las preguntas de las funciones que elija el cliente
    const MEDIDA_X = () => Object.fromEntries(((window.JNBBriefSchema || {}).FEATURES || []).map((k) => [k, true]));
    const ctx = (x = {}, a = {}) => ({ a, lang: previewLang, knownPlan: true, plan: plan === 'medida' ? 'premium' : plan, x: plan === 'medida' && !Object.keys(x).length ? MEDIDA_X() : x });
    const val = (v) => { try { return typeof v === 'function' ? v(ctx()) : v; } catch (e) { return ''; } };
    const test = (item, c) => { try { return !item.when || Boolean(item.when(c)); } catch (e) { return false; } };
    const shows = (item) => test(item, ctx());
    const withExtras = (item) => test(item, ctx(ALL));
    const withAnswers = (item) => test(item, ctx({}, YES)) || test(item, ctx(ALL, YES));

    const render = () => {
        const root = document.getElementById('m-brief');
        const schema = window.JNBBriefSchema;
        if (!root) return;
        if (!schema) { root.innerHTML = '<h2>Brief</h2><p class="empty">No se pudo cargar el brief.</p>'; return; }
        const sections = schema.SECTIONS.filter((s) => shows(s) || withExtras(s) || withAnswers(s));
        let n = 0;
        root.innerHTML = '<h2>Brief</h2>' + sendBox() + '<h3 style="margin-top:1.5rem">Vista previa de las preguntas</h3>'
            + '<nav class="subtabs">' + Object.entries(LANG_NAMES).map(([k, v]) => '<button type="button" data-brief-lang="' + k + '" aria-pressed="' + (previewLang === k) + '">' + v + '</button>').join('') + '</nav>'
            + '<p class="muted">Vista previa de solo lectura de las preguntas que ve cada cliente según su plan. Para cambiar preguntas hay que editar <code>js/brief.js</code>.</p>'
            + '<nav class="subtabs">' + PLANS.map(([k, label]) => '<button type="button" data-brief-plan="' + k + '" aria-pressed="' + (plan === k) + '">' + label + '</button>').join('') + '</nav>'
            + '<p class="small muted">Las preguntas marcadas "Según respuestas" o "Si pidió adicionales" aparecen solo en esos casos.</p>'
            + sections.map((s) => {
                const qs = s.questions.filter((q) => shows(q) || withExtras(q) || withAnswers(q));
                return '<section class="card"><h3>' + esc(val(s[previewLang] || s.es)) + '</h3><ol class="brief-preview">' + qs.map((q) => {
                    n += 1;
                    const t = q[previewLang] || q.es || [];
                    const opts = Array.isArray(t[2]) ? t[2] : [];
                    const cond = !q.when || shows(q) ? '' : withExtras(q) ? 'Si pidió adicionales' : 'Según respuestas';
                    return '<li><p style="margin:0"><strong>' + esc(val(t[0])) + '</strong></p>'
                        + (t[1] ? '<p class="small muted" style="margin:.2rem 0 0">' + esc(val(t[1])) + '</p>' : '')
                        + (opts.length ? '<p class="small" style="margin:.2rem 0 0">Opciones: ' + opts.map(esc).join(' · ') + '</p>' : '')
                        + '<p class="small" style="margin:.2rem 0 .6rem">' + esc(TYPES[q.type] || q.type) + (val(q.req) ? ' · Obligatoria' : ' · Opcional') + (cond ? ' · <em>' + cond + '</em>' : '') + '</p></li>';
                }).join('') + '</ol></section>';
            }).join('')
            + '<p class="small muted">' + n + ' preguntas en total para este plan (contando las condicionales).</p>';
    };

    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-brief-plan]');
        if (!b) return;
        plan = b.dataset.briefPlan;
        render();
    });

    // ---- Mandar el brief a un cliente: se crea su proyecto (etapa Reserva) y su link propio al brief, en su idioma
    const panel = () => window.JNBPanel;
    const SITE = 'https://jnbcreativestudio.com.ar';
    const TYPES_WEB = [['Plan Emprendedor (tienda)', 'Tienda online (Plan Emprendedor)'], ['Plan Básico (landing)', 'Landing (Plan Básico)'], ['Plan Premium', 'Web completa (Plan Premium)'], ['Plan a medida', 'Plan a medida']];
    // Adicionales: el texto sigue el formato del pedido de presupuesto, así el brief suma sus preguntas (EXTRAS en js/brief.js)
    const ADDONS = [['secciones extra', 'Secciones extra'], ['páginas secundarias', 'Páginas secundarias'], ['modo claro / oscuro', 'Modo claro / oscuro'], ['abierto / cerrado', 'Indicador abierto / cerrado'], ['tienda online en', 'Tienda online sumada'], ['segunda plataforma', 'Tienda en una segunda plataforma'], ['landing page además', 'Landing además de la tienda'],
        ['catálogo de productos', 'Catálogo de productos'], ['carrito de pedidos', 'Carrito por WhatsApp'], ['formulario de pedidos', 'Formulario de pedidos'], ['menú digital', 'Menú digital QR'], ['sistema de reservas', 'Reservas o turnos'],
        ['calculadora de presupuestos', 'Calculadora'], ['test de recomendación', 'Test de recomendación'], ['portfolio filtrable', 'Portfolio'], ['antes y después', 'Antes y después'], ['tarjeta digital', 'Tarjeta de contacto'],
        ['cupones promocionales', 'Cupones'], ['comparador de planes', 'Comparador'], ['agregar al calendario', 'Agregar al calendario']];
    const LANG_NAMES = { es: 'Español', en: 'Inglés', pt: 'Portugués' };
    const linkOf = (p) => SITE + '/mi-proyecto/' + (p.lang === 'es' ? '' : p.lang) + '?c=' + p.token + '#brief';
    const MSG = {
        es: (n, l) => '¡Hola, ' + n + '! Para empezar con tu web necesito conocer tu proyecto. Completá tu brief acá (se guarda solo, podés seguir otro día): ' + l,
        en: (n, l) => 'Hi, ' + n + '! To start your website I need to know about your project. Please fill in your brief here (it saves automatically): ' + l,
        pt: (n, l) => 'Olá, ' + n + '! Para começar o seu site preciso conhecer o seu projeto. Preencha o seu briefing aqui (salva sozinho): ' + l,
    };
    let lastToken = '';
    const BRIEF = { enviado: ['ok', 'Respondido ✓'], borrador: ['warn', 'En curso'] };
    const linkRow = (p, client) => {
        const l = linkOf(p);
        const name = (client ? client.name : p.client).split(' ')[0];
        const wa = 'https://wa.me/' + (client && client.phone ? client.phone.replace(/[^0-9]/g, '') : '') + '?text=' + encodeURIComponent((MSG[p.lang] || MSG.es)(name, l));
        return '<div class="linkbox" style="margin:.5rem 0">' + esc(l) + '</div><div class="row"><button type="button" data-bf-copy="' + esc(l) + '">Copiar link</button>'
            + '<a class="btn" target="_blank" rel="noopener" href="' + esc(wa) + '">Mandar por WhatsApp ↗</a>'
            + (client && client.email ? '<button type="button" data-bf-mail="' + esc(p.token) + '">📧 Mandar por mail a ' + esc(client.email) + '</button>' : '<span class="small muted">Sin mail en la ficha del cliente</span>') + '</div>';
    };
    const sendBox = () => {
        const d = panel().data() || {};
        const clients = d.clients || [];
        const byId = (id) => clients.find((c) => c.id === id);
        const fresh = lastToken && (d.projects || []).find((p) => p.token === lastToken);
        const open = (d.projects || []).filter((p) => p.briefStatus !== 'enviado' && p.stage < 2).slice(0, 30);
        return '<section class="card bf-card"><h3>📨 Mandar el brief a un cliente</h3><p class="small muted">Se crea su proyecto (etapa Reserva) con un link propio, en su idioma: ahí completa el brief y después ve cómo avanza su web. Lo que responde queda guardado en su proyecto.</p>'
            + '<form id="bf-send"><div class="grid"><label>Cliente<select name="clientId"><option value="">➕ Cliente nuevo</option>' + clients.map((c) => '<option value="' + c.id + '">' + esc(c.code + ' · ' + c.name) + '</option>').join('') + '</select></label>'
            + '<label class="bf-new">Nombre y apellido<input name="fullName" maxlength="100"></label><label class="bf-new">Mail<input name="email" type="email"></label><label class="bf-new">WhatsApp<input name="phone" inputmode="tel"></label>'
            + '<label>Tipo de web (define las preguntas)<select name="project">' + TYPES_WEB.map(([v, t]) => '<option value="' + esc(v) + '">' + t + '</option>').join('') + '</select></label>'
            + '<label>Idioma del brief<select name="lang">' + Object.entries(LANG_NAMES).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select></label></div>'
            + '<fieldset class="bf-addons"><legend class="small">Adicionales y funciones que pidió (suman sus preguntas al brief)</legend>' + ADDONS.map(([v, t]) => '<label class="check-line"><input type="checkbox" name="addon" value="' + esc(v) + '"> ' + t + '</label>').join('') + '</fieldset>'
            + '<button class="primary" style="margin-top:.75rem">Crear link del brief</button></form>'
            + (fresh ? '<div class="alert" style="margin-top:.75rem">✓ Listo: link de ' + esc((byId(fresh.clientId) || {}).name || fresh.client) + ' (' + esc(fresh.code) + ' · ' + LANG_NAMES[fresh.lang] + ')' + linkRow(fresh, byId(fresh.clientId)) + '</div>' : '')
            + (open.length ? '<details style="margin-top:1rem"><summary>Briefs sin responder (' + open.length + ')</summary>' + open.map((p) => { const c = byId(p.clientId); const st = BRIEF[p.briefStatus] || ['warn', 'Sin empezar']; return '<div style="border-top:1px solid var(--line);padding:.6rem 0"><p style="margin:0"><strong>' + esc(c ? c.name : p.client) + '</strong> · ' + esc(p.code) + ' · ' + LANG_NAMES[p.lang] + ' · <span class="chip ' + st[0] + '">' + st[1] + '</span></p>' + linkRow(p, c) + '</div>'; }).join('') + '</details>' : '')
            + '</section>';
    };
    document.addEventListener('submit', async (e) => {
        if (e.target.getAttribute('id') !== 'bf-send') return;
        e.preventDefault();
        const form = new FormData(e.target);
        const v = Object.fromEntries(form.entries());
        const addons = form.getAll('addon');
        const client = (panel().data().clients || []).find((c) => String(c.id) === v.clientId);
        if (!client && !v.fullName.trim()) { panel().toast('Cargá el nombre del cliente nuevo'); return; }
        try {
            const res = await panel().api('proyectos', { client: (client ? client.name : v.fullName).trim().split(' ')[0], project: v.project, lang: v.lang, clientId: client ? client.id : 0, fullName: v.fullName, email: v.email, phone: v.phone,
                request: addons.length ? 'Quiero sumar o actualizar: ' + addons.join(', ') : '' });
            lastToken = res.token;
            await panel().reload();
            panel().toast('Link del brief listo');
        } catch (err) { panel().toast('No se pudo crear: revisá el mail'); }
    });
    document.addEventListener('click', async (e) => {
        const lb = e.target.closest('#m-brief [data-brief-lang]');
        if (lb) { previewLang = lb.dataset.briefLang; render(); return; }
        const b = e.target.closest('#m-brief [data-bf-copy], #m-brief [data-bf-mail]');
        if (!b) return;
        if (b.dataset.bfCopy) { navigator.clipboard.writeText(b.dataset.bfCopy).then(() => panel().toast('Link copiado'), () => window.prompt('Copiá el link:', b.dataset.bfCopy)); return; }
        b.disabled = true;
        try { const r = await panel().api('brief-invitar', { token: b.dataset.bfMail }); panel().toast(r.ok ? 'Mail enviado ✓' : 'No salió el mail (revisá Configuración → Mails)'); } catch (err) { panel().toast('No salió el mail'); }
        b.disabled = false;
    });

    window.JNBBriefPreview = { show: render };
})();
