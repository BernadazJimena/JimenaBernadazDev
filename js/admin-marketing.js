// Marketing Digital & Contenidos (#marketing en /api/admin): planificación de Instagram, plan editorial del blog y banco de ideas.
// Solo organiza: no se conecta con Instagram ni publica nada. Los datos se guardan en el Durable Object (POST /api/admin/marketing)
// y llegan con el resto del panel en data.marketing (window.JNBPanel).
(() => {
    const panel = () => window.JNBPanel;
    const M = () => (panel().data() || {}).marketing || { posts: [], articles: [], ideas: [] };
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = (n) => String(n).padStart(2, '0');
    const today = () => (window.JNBHolidays ? window.JNBHolidays.now().date : new Date().toISOString().slice(0, 10));
    const thisMonth = () => today().slice(0, 7);
    const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const WEEK_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const monthName = (ym) => { const [y, m] = ym.split('-').map(Number); return MONTHS[m - 1] + ' ' + y; };
    const shiftMonth = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1); };
    const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay(); // 0 = domingo
    const fdate = (iso) => (iso ? WEEK_LONG[dow(iso)] + ' ' + Number(iso.slice(8)) + ' de ' + MONTHS[Number(iso.slice(5, 7)) - 1] : 'Sin fecha');
    const fshort = (iso) => (iso ? Number(iso.slice(8)) + '/' + Number(iso.slice(5, 7)) + '/' + iso.slice(2, 4) : 'Sin fecha');
    // Días del blog: lunes y martes (getUTCDay: 1 y 2)
    const BLOG_DAYS = [1, 2];

    // ---- Opciones de cada tipo (las mismas claves que valida el servidor en MK, worker/studio.js)
    const POST_STATUS = { idea: 'Idea', pendiente: 'Pendiente de planificación', preparacion: 'En preparación', listo: 'Listo para publicar', publicado: 'Publicado' };
    const ART_STATUS = { idea: 'Idea', planificado: 'Planificado', redaccion: 'En redacción', revision: 'En revisión', listo: 'Listo para publicar', publicado: 'Publicado' };
    const IDEA_STATUS = { pendiente: 'Pendiente', seleccionada: 'Seleccionada', desarrollada: 'Desarrollada' };
    const FORMATS = { reel: 'Reel', carrusel: 'Carrusel', historia: 'Historia', imagen: 'Imagen' };
    const GOALS = { reconocimiento: 'Reconocimiento de marca', educacion: 'Educación', interaccion: 'Interacción', captacion: 'Captación de clientes', venta: 'Venta' };
    const KINDS = { instagram: 'Instagram', blog: 'Blog', ambos: 'Instagram y blog' };
    const TONE = { idea: 'muted', pendiente: 'info', planificado: 'info', seleccionada: 'info', preparacion: 'warn', redaccion: 'warn', revision: 'warn', listo: 'ready', publicado: 'ok', desarrollada: 'ok' };
    const ALL_STATUS = { ...POST_STATUS, ...ART_STATUS };
    const statusTag = (s, labels) => '<span class="mk-tag mk-' + (TONE[s] || 'muted') + '">' + esc(labels[s] || s) + '</span>';

    // ---- Campos de cada formulario: [nombre, etiqueta, tipo, opciones/ayuda]
    const FORMS = {
        post: {
            title: 'publicación', labels: POST_STATUS, fields: [
                ['title', 'Título de la publicación', 'line', { required: true, max: 160 }], ['status', 'Estado', 'select', POST_STATUS],
                ['date', 'Fecha programada', 'date'], ['time', 'Hora programada', 'time'],
                ['format', 'Formato', 'select', FORMATS], ['goal', 'Objetivo', 'select', GOALS],
                ['topic', 'Tema o idea principal', 'line', { max: 200, wide: true }],
                ['description', 'Qué quiero comunicar', 'text', { rows: 3, max: 3000 }], ['copy', 'Copy o texto tentativo', 'text', { rows: 4, max: 5000 }],
                ['hashtags', 'Hashtags', 'text', { rows: 2, max: 1000, hint: '#webdesign #emprendedoras' }], ['refs', 'Referencias visuales', 'text', { rows: 2, max: 2000, hint: 'Links, colores, ideas de imagen' }],
                ['notes', 'Notas adicionales', 'text', { rows: 2, max: 2000 }],
            ],
        },
        article: {
            title: 'artículo', labels: ART_STATUS, fields: [
                ['title', 'Título tentativo', 'line', { required: true, max: 200 }], ['status', 'Estado', 'select', ART_STATUS],
                ['date', 'Fecha prevista de publicación', 'date'], ['category', 'Categoría', 'line', { max: 120 }],
                ['topic', 'Tema principal', 'line', { max: 200 }], ['goal', 'Objetivo del artículo', 'line', { max: 300 }],
                ['summary', 'Breve resumen de lo que vamos a desarrollar', 'text', { rows: 3, max: 3000 }],
                ['keyword', 'Palabra clave principal (SEO)', 'line', { max: 120 }], ['keywords', 'Palabras clave secundarias', 'line', { max: 500, hint: 'Separadas por coma' }],
                ['meta', 'Meta descripción', 'text', { rows: 2, max: 320, hint: 'Ideal: entre 120 y 160 caracteres', counter: true }],
                ['url', 'URL definitiva (cuando se publique)', 'url', { hint: 'https://jnbcreativestudio.com.ar/blog/...' }],
                ['notes', 'Notas adicionales', 'text', { rows: 2, max: 2000 }],
            ],
        },
        idea: {
            title: 'idea', labels: IDEA_STATUS, fields: [
                ['title', 'Título', 'line', { required: true, max: 160 }], ['status', 'Estado', 'select', IDEA_STATUS],
                ['kind', 'Tipo de contenido', 'select', KINDS], ['category', 'Categoría temática', 'line', { max: 120 }],
                ['goal', 'Objetivo', 'line', { max: 300, wide: true }],
                ['description', 'Descripción breve', 'text', { rows: 3, max: 2000 }], ['notes', 'Notas', 'text', { rows: 2, max: 2000 }],
            ],
        },
    };

    // ---- Estado de la vista (no se guarda: los datos están en el servidor)
    const st = {
        tab: '', calMonth: thisMonth(), calIg: true, calBlog: true, calStatus: '',
        igView: 'cal', igMonth: thisMonth(), igStatus: '', igFormat: '', blogMonth: thisMonth(), ideaStatus: '', ideaKind: '',
    };
    const TABS = [['', 'Resumen'], ['calendario', 'Calendario de contenidos'], ['redes', 'Redes sociales'], ['blog', 'Plan editorial del blog'], ['ideas', 'Banco de ideas']];

    // ---- Indicadores
    const counts = () => {
        const { posts, articles, ideas } = M();
        const ym = thisMonth();
        return {
            pending: posts.filter((p) => ['idea', 'pendiente', 'preparacion'].includes(p.status)).length,
            ready: posts.filter((p) => p.status === 'listo').length,
            month: articles.filter((a) => a.date.startsWith(ym)).length,
            ideas: ideas.filter((i) => i.status === 'pendiente').length,
        };
    };
    const badge = () => {
        const el = document.getElementById('n-marketing');
        if (!el) return;
        const n = counts().ready;
        el.textContent = n || '';
        el.title = n ? n + ' listas para publicar' : '';
    };

    // ---- Calendario mensual (semanas de lunes a domingo). items: [{date, html}]
    const monthNav = (key, ym) => '<div class="mk-monthnav"><button type="button" data-mk-month="' + key + '" data-step="-1" aria-label="Mes anterior">‹</button>'
        + '<strong>' + esc(monthName(ym)) + '</strong><button type="button" data-mk-month="' + key + '" data-step="1" aria-label="Mes siguiente">›</button>'
        + '<input type="month" data-mk-monthpick="' + key + '" value="' + ym + '" aria-label="Elegir mes">'
        + (ym !== thisMonth() ? '<button type="button" data-mk-month="' + key + '" data-step="0">Hoy</button>' : '') + '</div>';
    const calendar = (ym, items) => {
        const [y, m] = ym.split('-').map(Number);
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const lead = (dow(ym + '-01') + 6) % 7;
        const byDate = {};
        items.forEach((it) => { (byDate[it.date] = byDate[it.date] || []).push(it.html); });
        const t = today();
        let grid = '<div class="mk-cal" role="grid">' + WEEK.map((d) => '<div class="mk-cal-h" role="columnheader">' + d + '</div>').join('');
        for (let i = 0; i < lead; i++) grid += '<div class="mk-cal-d is-out" aria-hidden="true"></div>';
        let agenda = '';
        for (let d = 1; d <= days; d++) {
            const iso = ym + '-' + pad(d);
            const list = byDate[iso] || [];
            grid += '<div class="mk-cal-d' + (iso === t ? ' is-today' : '') + ([0, 6].includes(dow(iso)) ? ' is-weekend' : '') + '" role="gridcell"><span class="mk-cal-n">' + d + '</span>' + list.join('') + '</div>';
            if (list.length) agenda += '<li' + (iso === t ? ' class="is-today"' : '') + '><span class="mk-ag-day">' + esc(fdate(iso)) + '</span>' + list.join('') + '</li>';
        }
        const tail = (7 - ((lead + days) % 7)) % 7;
        for (let i = 0; i < tail; i++) grid += '<div class="mk-cal-d is-out" aria-hidden="true"></div>';
        return grid + '</div><ul class="mk-agenda">' + (agenda || '<li class="empty">No hay contenidos en este mes.</li>') + '</ul>';
    };
    const chip = (kind, r) => {
        const labels = kind === 'post' ? POST_STATUS : ART_STATUS;
        return '<button type="button" class="mk-chip mk-chip-' + (kind === 'post' ? 'ig' : 'blog') + ' mk-s-' + (TONE[r.status] || 'muted') + '" data-mk-open="' + kind + ':' + r.id + '" title="' + esc(labels[r.status]) + '">'
            + '<span class="mk-chip-k">' + (kind === 'post' ? 'IG' + (r.time ? ' ' + esc(r.time) : '') : 'Blog') + '</span><span class="mk-chip-t">' + esc(r.title) + '</span></button>';
    };

    // ---- Vistas
    const head = () => '<div class="mk-head"><div><h2>Marketing Digital & Contenidos</h2><p class="small muted">Planificá tus publicaciones de Instagram, los artículos del blog y las ideas para más adelante.</p></div>'
        + '<div class="row"><button type="button" class="primary" data-mk-new="post">+ Publicación</button><button type="button" data-mk-new="article">+ Artículo</button><button type="button" data-mk-new="idea">+ Idea</button></div></div>'
        + '<nav class="subtabs mk-tabs" aria-label="Secciones de marketing">' + TABS.map(([k, l]) => '<button type="button" data-mk-tab="' + k + '" aria-pressed="' + (st.tab === k) + '">' + l + '</button>').join('') + '</nav>';

    const summaryView = () => {
        const c = counts();
        const { posts, articles } = M();
        const t = today();
        const limit = window.JNBHolidays ? window.JNBHolidays.addDays(t, 14) : '9999';
        const next = [...posts.map((r) => ({ kind: 'post', r })), ...articles.map((r) => ({ kind: 'article', r }))]
            .filter(({ r }) => r.date && r.date >= t && r.date <= limit && r.status !== 'publicado')
            .sort((a, b) => (a.r.date + (a.r.time || '') < b.r.date + (b.r.time || '') ? -1 : 1));
        const stat = (n, label, tab) => '<button type="button" class="mk-stat" data-mk-tab="' + tab + '"><span class="mk-stat-n">' + n + '</span><span class="mk-stat-l">' + label + '</span></button>';
        const section = (tab, icon, title, text) => '<button type="button" class="mk-section" data-mk-tab="' + tab + '"><span class="mk-section-ico" aria-hidden="true">' + icon + '</span><strong>' + title + '</strong><span class="small muted">' + text + '</span></button>';
        return '<div class="mk-stats">' + stat(c.pending, 'Publicaciones pendientes', 'redes') + stat(c.ready, 'Listas para publicar', 'redes')
            + stat(c.month, 'Artículos del blog en ' + MONTHS[Number(thisMonth().slice(5)) - 1], 'blog') + stat(c.ideas, 'Ideas pendientes de desarrollar', 'ideas') + '</div>'
            + '<div class="mk-sections">' + section('calendario', '🗓️', 'Calendario de contenidos', 'Instagram y blog en una misma vista')
            + section('redes', '📸', 'Redes sociales', 'Publicaciones de Instagram') + section('blog', '✍️', 'Plan editorial del blog', 'Lunes y martes de cada mes')
            + section('ideas', '💡', 'Banco de ideas', 'Ideas para convertir en contenido') + '</div>'
            + '<div class="card"><h3>Próximos 14 días</h3>' + (next.length ? '<ul class="mk-list">' + next.map(({ kind, r }) => '<li>' + chip(kind, r) + '<span class="small muted">' + esc(fdate(r.date)) + '</span>' + statusTag(r.status, kind === 'post' ? POST_STATUS : ART_STATUS) + '</li>').join('') + '</ul>' : '<p class="empty">No hay contenidos programados para los próximos 14 días.</p>') + '</div>';
    };

    const calendarView = () => {
        const { posts, articles } = M();
        const ok = (r) => !st.calStatus || r.status === st.calStatus;
        const items = [...(st.calIg ? posts.filter(ok).map((r) => ({ date: r.date, html: chip('post', r) })) : []),
            ...(st.calBlog ? articles.filter(ok).map((r) => ({ date: r.date, html: chip('article', r) })) : [])].filter((x) => x.date.startsWith(st.calMonth));
        return '<div class="mk-filters">' + monthNav('cal', st.calMonth)
            + '<label class="check-line mk-k-ig"><input type="checkbox" data-mk-set="calIg"' + (st.calIg ? ' checked' : '') + '> Instagram</label>'
            + '<label class="check-line mk-k-blog"><input type="checkbox" data-mk-set="calBlog"' + (st.calBlog ? ' checked' : '') + '> Blog</label>'
            + '<select data-mk-set="calStatus" aria-label="Filtrar por estado"><option value="">Todos los estados</option>' + Object.entries(ALL_STATUS).map(([k, v]) => '<option value="' + k + '"' + (st.calStatus === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></div>'
            + calendar(st.calMonth, items);
    };

    const postsView = () => {
        const { posts } = M();
        const f = posts.filter((r) => (!st.igStatus || r.status === st.igStatus) && (!st.igFormat || r.format === st.igFormat));
        const filters = '<select data-mk-set="igStatus" aria-label="Estado"><option value="">Todos los estados</option>' + Object.entries(POST_STATUS).map(([k, v]) => '<option value="' + k + '"' + (st.igStatus === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>'
            + '<select data-mk-set="igFormat" aria-label="Formato"><option value="">Todos los formatos</option>' + Object.entries(FORMATS).map(([k, v]) => '<option value="' + k + '"' + (st.igFormat === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>';
        const toggle = '<div class="mk-seg" role="group" aria-label="Vista"><button type="button" data-mk-igview="cal" aria-pressed="' + (st.igView === 'cal') + '">Calendario</button><button type="button" data-mk-igview="list" aria-pressed="' + (st.igView === 'list') + '">Listado</button></div>';
        if (st.igView === 'cal') {
            return '<div class="mk-filters">' + toggle + monthNav('ig', st.igMonth) + filters + '</div>'
                + calendar(st.igMonth, f.filter((r) => r.date.startsWith(st.igMonth)).map((r) => ({ date: r.date, html: chip('post', r) })))
                + (f.some((r) => !r.date) ? '<div class="card"><h3>Sin fecha</h3><ul class="mk-list">' + f.filter((r) => !r.date).map((r) => '<li>' + chip('post', r) + statusTag(r.status, POST_STATUS) + '</li>').join('') + '</ul></div>' : '');
        }
        const months = [...new Set(posts.map((r) => r.date.slice(0, 7)).filter(Boolean))].sort();
        const list = f.filter((r) => !st.igListMonth || (st.igListMonth === 'sin' ? !r.date : r.date.startsWith(st.igListMonth)));
        return '<div class="mk-filters">' + toggle + filters
            + '<select data-mk-set="igListMonth" aria-label="Mes"><option value="">Todos los meses</option><option value="sin"' + (st.igListMonth === 'sin' ? ' selected' : '') + '>Sin fecha</option>' + months.map((m) => '<option value="' + m + '"' + (st.igListMonth === m ? ' selected' : '') + '>' + monthName(m) + '</option>').join('') + '</select></div>'
            + (list.length ? '<div class="mk-table"><table><thead><tr><th>Fecha</th><th>Publicación</th><th>Formato</th><th>Objetivo</th><th>Estado</th></tr></thead><tbody>'
                + list.map((r) => '<tr data-mk-open="post:' + r.id + '"><td class="mk-nowrap">' + esc(fshort(r.date)) + (r.time ? '<br><span class="small muted">' + esc(r.time) + ' h</span>' : '') + '</td><td><strong>' + esc(r.title) + '</strong>' + (r.topic ? '<br><span class="small muted">' + esc(r.topic) + '</span>' : '') + '</td><td>' + FORMATS[r.format] + '</td><td class="small">' + GOALS[r.goal] + '</td><td>' + statusTag(r.status, POST_STATUS) + '</td></tr>').join('')
                + '</tbody></table></div>' : '<p class="empty">' + (posts.length ? 'No hay publicaciones con esos filtros.' : 'Todavía no cargaste publicaciones. Empezá con “+ Publicación”.') + '</p>');
    };

    const blogView = () => {
        const { articles } = M();
        const ym = st.blogMonth;
        const [y, m] = ym.split('-').map(Number);
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const inMonth = articles.filter((a) => a.date.startsWith(ym));
        const slots = [];
        for (let d = 1; d <= days; d++) { const iso = ym + '-' + pad(d); if (BLOG_DAYS.includes(dow(iso))) slots.push(iso); }
        const row = (a) => '<div class="mk-art">' + chip('article', a) + statusTag(a.status, ART_STATUS) + (a.keyword ? '<span class="small muted">🔑 ' + esc(a.keyword) + '</span>' : '') + '</div>';
        const t = today();
        const others = inMonth.filter((a) => !BLOG_DAYS.includes(dow(a.date)));
        const undated = articles.filter((a) => !a.date);
        return '<div class="mk-filters">' + monthNav('blog', ym) + '<span class="small muted">' + inMonth.length + ' artículo' + (inMonth.length === 1 ? '' : 's') + ' en ' + esc(monthName(ym)) + '</span></div>'
            + '<ul class="mk-slots">' + slots.map((iso) => {
                const list = inMonth.filter((a) => a.date === iso);
                return '<li class="mk-slot' + (iso < t ? ' is-past' : '') + (iso === t ? ' is-today' : '') + '"><div class="mk-slot-day"><span class="mk-slot-n">' + Number(iso.slice(8)) + '</span><span>' + WEEK_LONG[dow(iso)] + '</span></div>'
                    + '<div class="mk-slot-body">' + (list.length ? list.map(row).join('') : '<span class="small muted">Sin artículo planificado</span>')
                    + '<button type="button" class="mk-add" data-mk-new="article" data-date="' + iso + '">+ Agregar artículo</button></div></li>';
            }).join('') + '</ul>'
            + (others.length ? '<div class="card"><h3>Otros días de ' + esc(monthName(ym)) + '</h3>' + others.map((a) => '<p class="small muted" style="margin:.5rem 0 .2rem">' + esc(fdate(a.date)) + '</p>' + row(a)).join('') + '</div>' : '')
            + (undated.length ? '<div class="card"><h3>Artículos sin fecha</h3>' + undated.map(row).join('') + '</div>' : '');
    };

    const ideasView = () => {
        const { ideas, posts, articles } = M();
        const list = ideas.filter((i) => (!st.ideaStatus || i.status === st.ideaStatus) && (!st.ideaKind || i.kind === st.ideaKind));
        const uses = (id) => posts.filter((p) => p.idea_id === id).length + articles.filter((a) => a.idea_id === id).length;
        return '<div class="mk-filters"><select data-mk-set="ideaStatus" aria-label="Estado"><option value="">Todos los estados</option>' + Object.entries(IDEA_STATUS).map(([k, v]) => '<option value="' + k + '"' + (st.ideaStatus === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>'
            + '<select data-mk-set="ideaKind" aria-label="Tipo"><option value="">Instagram y blog</option>' + Object.entries(KINDS).map(([k, v]) => '<option value="' + k + '"' + (st.ideaKind === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></div>'
            + (list.length ? '<div class="mk-ideas">' + list.map((i) => '<article class="card mk-idea"><div class="mk-idea-top">' + statusTag(i.status, IDEA_STATUS) + '<span class="mk-tag mk-k-' + i.kind + '">' + KINDS[i.kind] + '</span></div>'
                + '<h3>' + esc(i.title) + '</h3>' + (i.description ? '<p class="small">' + esc(i.description) + '</p>' : '')
                + '<p class="small muted">' + [i.category, 'Creada el ' + fshort(i.created.slice(0, 10)), uses(i.id) ? '→ ' + uses(i.id) + ' contenido' + (uses(i.id) === 1 ? '' : 's') : ''].filter(Boolean).map(esc).join(' · ') + '</p>'
                + '<div class="row mk-idea-act"><button type="button" data-mk-open="idea:' + i.id + '">Ver y editar</button>'
                + (i.kind !== 'blog' ? '<button type="button" data-mk-convert="post:' + i.id + '">→ Publicación</button>' : '')
                + (i.kind !== 'instagram' ? '<button type="button" data-mk-convert="article:' + i.id + '">→ Artículo</button>' : '') + '</div></article>').join('') + '</div>'
                : '<p class="empty">' + (ideas.length ? 'No hay ideas con esos filtros.' : 'Todavía no hay ideas guardadas. Sumá la primera con “+ Idea”.') + '</p>');
    };

    const render = () => {
        const el = document.getElementById('m-marketing');
        badge();
        if (!el || el.hidden) return;
        const view = { '': summaryView, calendario: calendarView, redes: postsView, blog: blogView, ideas: ideasView }[st.tab] || summaryView;
        el.innerHTML = head() + '<div class="mk-body">' + view() + '</div>';
    };

    // ---- Formulario en ventana (crear, ver y editar)
    let dlg = null;
    let editing = null; // { kind, id, ideaId, updated }
    let dirty = false;
    const dialog = () => {
        if (dlg) return dlg;
        dlg = document.createElement('dialog');
        dlg.className = 'mk-dialog';
        dlg.setAttribute('aria-labelledby', 'mk-dlg-title');
        document.body.appendChild(dlg);
        dlg.addEventListener('cancel', (e) => { if (!confirmClose()) e.preventDefault(); });
        dlg.addEventListener('input', (e) => {
            dirty = true;
            const c = e.target.dataset && e.target.dataset.mkCount;
            if (c !== undefined) { const out = dlg.querySelector('[data-mk-counter="' + e.target.name + '"]'); if (out) out.textContent = e.target.value.length + ' caracteres'; }
        });
        dlg.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (e.target === dlg || (b && b.dataset.mkClose !== undefined)) { if (confirmClose()) dlg.close(); return; }
            if (b && b.dataset.mkDelete !== undefined) remove();
        });
        dlg.addEventListener('submit', (e) => { e.preventDefault(); save(e.target); });
        return dlg;
    };
    const confirmClose = () => !dirty || confirm('Tenés cambios sin guardar. ¿Cerrar igual?');
    const field = ([name, label, type, opt], v) => {
        const o = opt || {};
        const id = 'mk-f-' + name;
        const lab = '<label for="' + id + '">' + label + (o.required ? ' *' : '') + '</label>';
        let input;
        if (type === 'select') input = '<select id="' + id + '" name="' + name + '">' + Object.entries(opt).map(([k, l]) => '<option value="' + k + '"' + (v === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
        else if (type === 'text') input = '<textarea id="' + id + '" name="' + name + '" rows="' + (o.rows || 3) + '" maxlength="' + o.max + '"' + (o.hint ? ' placeholder="' + esc(o.hint) + '"' : '') + (o.counter ? ' data-mk-count' : '') + '>' + esc(v) + '</textarea>'
            + (o.counter ? '<span class="small muted" data-mk-counter="' + name + '">' + String(v || '').length + ' caracteres</span>' : '');
        else input = '<input id="' + id + '" name="' + name + '" type="' + (type === 'line' ? 'text' : type) + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.required ? ' required' : '') + (o.hint ? ' placeholder="' + esc(o.hint) + '"' : '') + ' value="' + esc(v) + '">';
        const wide = type === 'text' || o.wide;
        return '<div class="mk-field' + (wide ? ' mk-wide' : '') + '">' + lab + input + '</div>';
    };
    const open = (kind, rec, extra) => {
        const spec = FORMS[kind];
        const r = rec || {};
        editing = { kind, id: r.id || 0, ideaId: (extra && extra.ideaId) || 0, updated: r.updated || '' };
        dirty = Boolean(extra && extra.ideaId);
        const v = { ...r, ...((extra && extra.values) || {}) };
        const idea = editing.ideaId ? M().ideas.find((i) => i.id === editing.ideaId) : (r.idea_id ? M().ideas.find((i) => i.id === r.idea_id) : null);
        const d = dialog();
        d.innerHTML = '<form novalidate><div class="mk-dlg-head"><h3 id="mk-dlg-title">' + (r.id ? 'Editar ' : kind === 'article' ? 'Nuevo ' : 'Nueva ') + spec.title + '</h3><button type="button" class="mk-x" data-mk-close aria-label="Cerrar">✕</button></div>'
            + (idea ? '<p class="small mk-from">💡 Desde la idea “' + esc(idea.title) + '”</p>' : '')
            + (kind === 'idea' && r.created ? '<p class="small muted">Creada el ' + esc(fdate(r.created.slice(0, 10))) + '</p>' : '')
            + '<p class="mk-error" role="alert" hidden></p>'
            + '<div class="mk-grid">' + spec.fields.map((f) => field(f, v[f[0]] ?? (f[2] === 'select' ? Object.keys(f[3])[0] : ''))).join('') + '</div>'
            + '<div class="mk-dlg-foot">' + (r.id ? '<button type="button" class="mk-danger" data-mk-delete>Eliminar</button>' : '<span></span>')
            + '<div class="row"><button type="button" data-mk-close>Cancelar</button><button class="primary">' + (r.id ? 'Guardar cambios' : 'Guardar') + '</button></div></div></form>';
        if (!d.open) d.showModal();
        const first = d.querySelector('input, select, textarea');
        if (first && !r.id) first.focus();
    };
    const showError = (msg) => { const p = dlg.querySelector('.mk-error'); p.textContent = msg; p.hidden = !msg; if (msg) p.scrollIntoView({ block: 'nearest' }); };
    const save = async (form) => {
        const item = Object.fromEntries(new FormData(form).entries());
        if (!String(item.title || '').trim()) { showError('Completá el título.'); form.querySelector('[name="title"]').focus(); return; }
        if (item.url && !/^https?:\/\/\S+$/i.test(item.url.trim())) { showError('La URL tiene que empezar con https://'); return; }
        const btn = form.querySelector('button.primary');
        btn.disabled = true;
        showError('');
        try {
            const res = await panel().api('marketing', { action: 'save', kind: editing.kind, id: editing.id, ideaId: editing.ideaId, updated: editing.updated, item });
            panel().data().marketing = res.marketing;
            dirty = false;
            dlg.close();
            panel().toast('Guardado');
            render();
        } catch (e) {
            const code = String(e.message);
            if (code === '409') {
                // Otro dispositivo lo cambió: se traen los datos nuevos, pero lo que escribiste queda en el formulario
                try { const fresh = await panel().api('datos'); panel().data().marketing = fresh.marketing; } catch (err) { /* se reintenta al guardar */ }
                const now = M()[editing.kind + 's'].find((x) => x.id === editing.id);
                if (now) editing.updated = now.updated;
                showError('Este registro se modificó desde otro lugar. Revisá tus cambios y tocá “Guardar” de nuevo para reemplazarlo.');
                render();
            } else if (code === '404') showError('Este registro ya no existe (se eliminó desde otro lugar).');
            else if (code === '400') showError('Revisá los datos: falta el título o alguna fecha, hora o URL no es válida.');
            else if (code !== 'clave') showError('No se pudo guardar. Revisá la conexión e intentá de nuevo: lo que escribiste sigue acá.');
        } finally { btn.disabled = false; }
    };
    const remove = async () => {
        const name = FORMS[editing.kind].title;
        if (!confirm('¿Eliminar ' + (editing.kind === 'article' ? 'este ' : 'esta ') + name + '? No se puede deshacer.')) return;
        try {
            const res = await panel().api('marketing', { action: 'delete', kind: editing.kind, id: editing.id });
            panel().data().marketing = res.marketing;
            dirty = false;
            dlg.close();
            panel().toast('Eliminado');
            render();
        } catch (e) { showError(String(e.message) === '404' ? 'Ya se había eliminado.' : 'No se pudo eliminar. Intentá de nuevo.'); }
    };
    // Convierte una idea: copia su información en el formulario del nuevo formato
    const convert = (kind, ideaId) => {
        const i = M().ideas.find((x) => x.id === ideaId);
        if (!i) return;
        const extraNotes = [i.goal && 'Objetivo de la idea: ' + i.goal, i.notes].filter(Boolean).join('\n');
        const values = kind === 'post'
            ? { title: i.title, topic: i.category, description: i.description, notes: extraNotes, status: 'pendiente' }
            : { title: i.title, category: i.category, topic: i.category, summary: i.description, goal: i.goal, notes: i.notes, status: 'planificado' };
        open(kind, null, { ideaId, values });
    };

    // ---- Eventos
    document.addEventListener('click', (e) => {
        const root = e.target.closest('#m-marketing');
        if (!root) return;
        const b = e.target.closest('[data-mk-tab], [data-mk-new], [data-mk-open], [data-mk-convert], [data-mk-month], [data-mk-igview]');
        if (!b) return;
        const ds = b.dataset;
        if (ds.mkTab !== undefined) panel().go('marketing', ds.mkTab);
        else if (ds.mkNew) open(ds.mkNew, null, ds.date ? { values: { date: ds.date, status: 'planificado' } } : null);
        else if (ds.mkOpen) { const [k, id] = ds.mkOpen.split(':'); const r = M()[k + 's'].find((x) => x.id === Number(id)); if (r) open(k, r); }
        else if (ds.mkConvert) { const [k, id] = ds.mkConvert.split(':'); convert(k, Number(id)); }
        else if (ds.mkIgview) { st.igView = ds.mkIgview; render(); }
        else if (ds.mkMonth) {
            const key = ds.mkMonth + 'Month';
            st[key] = Number(ds.step) === 0 ? thisMonth() : shiftMonth(st[key], Number(ds.step));
            render();
        }
    });
    document.addEventListener('change', (e) => {
        const t = e.target;
        if (!t.closest('#m-marketing')) return;
        if (t.dataset.mkSet) { st[t.dataset.mkSet] = t.type === 'checkbox' ? t.checked : t.value; render(); }
        else if (t.dataset.mkMonthpick && /^\d{4}-\d{2}$/.test(t.value)) { st[t.dataset.mkMonthpick + 'Month'] = t.value; render(); }
    });

    window.JNBMarketing = {
        show: (tab) => { st.tab = TABS.some(([k]) => k === tab) ? tab : ''; render(); },
        refresh: () => render(),
        counts,
    };
})();
