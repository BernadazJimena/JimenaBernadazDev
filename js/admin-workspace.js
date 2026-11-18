// Espacio Personal de JNB Workspace: Agenda (#mi-agenda), Estudios (#estudios) y Trabajo (#trabajo).
// Los datos llegan con el resto del panel (data.workspace) y se guardan con POST /api/admin/workspace.
// Son datos personales: no van en la copia JNB (worker/core/backup-policy.js).
(() => {
    const panel = () => window.JNBPanel;
    const W = () => (panel().data() || {}).workspace || { agenda: [], materia: [], actividad: [], trabajo: [] };
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const today = () => (window.JNBHolidays ? window.JNBHolidays.now().date : new Date().toISOString().slice(0, 10));
    const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const WEEK_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const fdate = (iso) => (iso ? WEEK_LONG[new Date(iso + 'T12:00:00Z').getUTCDay()] + ' ' + Number(iso.slice(8)) + ' de ' + MONTHS[Number(iso.slice(5, 7)) - 1] : 'Sin fecha');
    const fshort = (iso) => (iso ? Number(iso.slice(8)) + '/' + Number(iso.slice(5, 7)) + '/' + iso.slice(2, 4) : 'Sin fecha');

    // ---- Opciones (las mismas claves que valida el servidor en worker/core/workspace.js)
    const AGENDA_KIND = { evento: 'Evento', turno: 'Turno', reunion: 'Reunión', recordatorio: 'Recordatorio', otro: 'Otro' };
    const SUBJECT_STATUS = { cursando: 'Cursando', pendiente: 'Pendiente', regular: 'Regular', aprobada: 'Aprobada', libre: 'Libre', abandonada: 'Abandonada' };
    const ACT_KIND = { tp: 'Trabajo práctico', parcial: 'Parcial', final: 'Final', recuperatorio: 'Recuperatorio', entrega: 'Entrega', fecha: 'Fecha importante' };
    const ACT_STATUS = { pendiente: 'Pendiente', 'en-curso': 'En curso', entregado: 'Entregado', aprobado: 'Aprobado', desaprobado: 'Desaprobado' };
    const JOB_KIND = { postulacion: 'Postulación', entrevista: 'Entrevista', empleo: 'Empleo', capacitacion: 'Capacitación' };
    const JOB_STATUS = { pendiente: 'Pendiente', enviada: 'Enviada', 'en-proceso': 'En proceso', aceptada: 'Aceptada', rechazada: 'Rechazada', activo: 'Activo', finalizado: 'Finalizado' };
    const TONE = { cursando: 'info', regular: 'warn', aprobada: 'ok', aprobado: 'ok', libre: 'bad', abandonada: 'bad', desaprobado: 'bad', 'en-curso': 'info', entregado: 'ok', enviada: 'info', 'en-proceso': 'warn', aceptada: 'ok', rechazada: 'bad', activo: 'ok' };
    const tag = (value, labels) => '<span class="ws-tag ws-t-' + (TONE[value] || 'muted') + '">' + esc(labels[value] || value) + '</span>';
    // Lo que sigue abierto (para filtros, contadores y el Dashboard)
    const ACT_OPEN = ['pendiente', 'en-curso'];
    const JOB_OPEN = ['pendiente', 'enviada', 'en-proceso', 'activo'];
    const subjectName = (id) => { const s = W().materia.find((x) => String(x.id) === String(id)); return s ? s.name : ''; };

    // ---- Formularios: [campo, etiqueta, tipo, opciones]
    const FORMS = {
        agenda: { title: 'evento', fields: [
            ['title', 'Qué', 'line', { required: true, max: 160, wide: true }], ['kind', 'Tipo', 'select', AGENDA_KIND], ['date', 'Fecha', 'date'],
            ['time', 'Hora de inicio', 'time'], ['end', 'Hora de fin', 'time'], ['place', 'Lugar', 'line', { max: 160 }],
            ['done', 'Estado', 'select', { no: 'Pendiente', si: 'Hecho' }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        materia: { title: 'materia', fields: [
            ['name', 'Materia', 'line', { required: true, max: 160, wide: true }], ['career', 'Carrera o curso', 'line', { max: 160 }],
            ['term', 'Cursada (cuatrimestre o año)', 'line', { max: 80, hint: '1.er cuatrimestre 2026' }], ['schedule', 'Horario', 'line', { max: 200, hint: 'Lunes y miércoles 18 a 20' }],
            ['teacher', 'Docente', 'line', { max: 160 }], ['status', 'Estado', 'select', SUBJECT_STATUS], ['grade', 'Calificación', 'line', { max: 10 }],
            ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        actividad: { title: 'actividad', fields: [
            ['title', 'Qué', 'line', { required: true, max: 160, wide: true, hint: 'TP 2: análisis de casos' }], ['kind', 'Tipo', 'select', ACT_KIND],
            ['subject', 'Materia', 'subject'], ['date', 'Fecha', 'date'], ['time', 'Hora', 'time'], ['status', 'Estado', 'select', ACT_STATUS],
            ['grade', 'Calificación', 'line', { max: 10 }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        trabajo: { title: 'registro', fields: [
            ['kind', 'Tipo', 'select', JOB_KIND], ['title', 'Puesto, búsqueda o curso', 'line', { required: true, max: 160 }],
            ['company', 'Empresa o institución', 'line', { max: 160 }], ['date', 'Fecha', 'date'], ['time', 'Hora', 'time'],
            ['status', 'Estado', 'select', JOB_STATUS], ['contact', 'Contacto', 'line', { max: 200 }], ['url', 'Link', 'url', { hint: 'https://…' }],
            ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
    };

    // ---- Estado de cada vista
    const st = { agendaView: 'proximos', studyTab: 'materias', studySubject: '', studyView: 'abiertas', jobKind: '', jobView: 'abiertos' };
    const root = (mod) => document.getElementById('m-' + mod);
    const head = (title, text, buttons) => '<div class="ws-head"><div><h2>' + title + '</h2><p class="small muted">' + text + '</p></div><div class="row">' + buttons + '</div></div>';
    const seg = (key, value, options) => '<nav aria-label="Vista">' + Object.entries(options).map(([v, l]) => '<button type="button" data-ws-set="' + key + '" data-value="' + v + '" aria-pressed="' + (value === v) + '">' + l + '</button>').join('') + '</nav>';
    const select = (key, value, options, label) => '<label><span class="sr-only">' + label + '</span><select data-ws-select="' + key + '">' + Object.entries(options).map(([v, l]) => '<option value="' + esc(v) + '"' + (value === v ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></label>';
    const empty = (text) => '<p class="empty">' + text + '</p>';
    const rowAttrs = (kind, r, extra) => ' tabindex="0" data-ws-open="' + kind + ':' + r.id + '"' + (extra ? ' class="' + extra + '"' : '');

    // ---- Agenda
    const renderAgenda = () => {
        const t = today();
        let list = W().agenda.slice();
        if (st.agendaView === 'proximos') list = list.filter((e) => e.done !== 'si' && (!e.date || e.date >= t));
        if (st.agendaView === 'pasados') list = list.filter((e) => e.date && e.date < t).reverse();
        const days = [];
        list.forEach((e) => { const k = e.date || ''; const g = days.find((d) => d.k === k); if (g) g.items.push(e); else days.push({ k, items: [e] }); });
        if (st.agendaView === 'proximos') days.sort((a, b) => (a.k === '' ? 1 : b.k === '' ? -1 : 0));
        const table = (items) => '<table class="ws-table ws-agenda"><thead><tr><th>Hora</th><th>Qué</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>'
            + items.map((e) => '<tr' + rowAttrs('agenda', e, e.done === 'si' ? 'ws-done' : '') + '><td class="ws-nowrap" data-label="Hora">' + (e.time ? esc(e.time) + (e.end ? '–' + esc(e.end) : '') + ' h' : 'Todo el día') + '</td>'
                + '<td data-label="Qué"><strong>' + esc(e.title) + '</strong>' + (e.place ? '<br><span class="small muted">📍 ' + esc(e.place) + '</span>' : '') + '</td>'
                + '<td data-label="Tipo">' + esc(AGENDA_KIND[e.kind] || e.kind) + '</td><td data-label="Estado">' + (e.done === 'si' ? tag('aprobado', { aprobado: 'Hecho' }) : tag('pendiente', { pendiente: 'Pendiente' })) + '</td></tr>').join('')
            + '</tbody></table>';
        root('mi-agenda').innerHTML = head('Agenda', 'Turnos, reuniones, eventos y recordatorios personales.', '<button type="button" class="primary" data-ws-new="agenda">+ Nuevo evento</button>')
            + '<div class="ws-filters">' + seg('agendaView', st.agendaView, { proximos: 'Próximos', pasados: 'Pasados', todos: 'Todos' }) + '</div>'
            + (days.length ? days.map((d) => '<p class="ws-day' + (d.k === t ? ' is-today' : '') + '">' + (d.k === t ? 'Hoy · ' : '') + esc(fdate(d.k)) + '</p>' + table(d.items)).join('')
                : empty(st.agendaView === 'proximos' ? 'No tenés eventos próximos. Agregá el primero con “Nuevo evento”.' : 'No hay eventos para mostrar.'));
    };

    // ---- Estudios: materias y actividades (TPs, exámenes y fechas importantes)
    const renderStudies = () => {
        const t = today();
        const w = W();
        const tabs = seg('studyTab', st.studyTab, { materias: 'Materias', actividades: 'TPs, exámenes y fechas' });
        let body;
        if (st.studyTab === 'materias') {
            const pending = (id) => w.actividad.filter((a) => String(a.subject) === String(id) && ACT_OPEN.includes(a.status)).length;
            body = w.materia.length ? '<table class="ws-table"><thead><tr><th>Materia</th><th>Cursada</th><th>Horario</th><th>Estado</th><th>Pendientes</th></tr></thead><tbody>'
                + w.materia.map((s) => '<tr' + rowAttrs('materia', s) + '><td data-label="Materia"><strong>' + esc(s.name) + '</strong>' + (s.career ? '<br><span class="small muted">' + esc(s.career) + '</span>' : '') + (s.teacher ? '<br><span class="small muted">' + esc(s.teacher) + '</span>' : '') + '</td>'
                    + '<td data-label="Cursada">' + esc(s.term) + '</td><td data-label="Horario">' + esc(s.schedule) + '</td>'
                    + '<td data-label="Estado">' + tag(s.status, SUBJECT_STATUS) + (s.grade ? ' <span class="small muted">Nota ' + esc(s.grade) + '</span>' : '') + '</td><td data-label="Pendientes">' + (pending(s.id) || '—') + '</td></tr>').join('')
                + '</tbody></table>' : empty('Todavía no cargaste materias. Agregá la primera con “Nueva materia”.');
        } else {
            let list = w.actividad.slice();
            if (st.studySubject) list = list.filter((a) => String(a.subject) === st.studySubject);
            if (st.studyView === 'abiertas') list = list.filter((a) => ACT_OPEN.includes(a.status));
            const subjects = { '': 'Todas las materias', ...Object.fromEntries(w.materia.map((s) => [String(s.id), s.name])) };
            body = '<div class="ws-filters">' + seg('studyView', st.studyView, { abiertas: 'Pendientes', todas: 'Todas' }) + select('studySubject', st.studySubject, subjects, 'Materia') + '</div>'
                + (list.length ? '<table class="ws-table"><thead><tr><th>Fecha</th><th>Qué</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>'
                    + list.map((a) => { const late = a.date && a.date < t && ACT_OPEN.includes(a.status);
                        return '<tr' + rowAttrs('actividad', a) + '><td class="ws-nowrap" data-label="Fecha">' + esc(fshort(a.date)) + (a.time ? '<br><span class="small muted">' + esc(a.time) + ' h</span>' : '') + (late ? '<br>' + tag('desaprobado', { desaprobado: 'Vencida' }) : '') + '</td>'
                            + '<td data-label="Qué"><strong>' + esc(a.title) + '</strong>' + (subjectName(a.subject) ? '<br><span class="small muted">' + esc(subjectName(a.subject)) + '</span>' : '') + '</td>'
                            + '<td data-label="Tipo">' + esc(ACT_KIND[a.kind] || a.kind) + '</td><td data-label="Estado">' + tag(a.status, ACT_STATUS) + (a.grade ? ' <span class="small muted">Nota ' + esc(a.grade) + '</span>' : '') + '</td></tr>'; }).join('')
                    + '</tbody></table>' : empty(st.studyView === 'abiertas' ? 'No tenés TPs, exámenes ni fechas pendientes.' : 'No hay actividades para mostrar.'));
        }
        root('estudios').innerHTML = head('Estudios', 'Materias, cursadas, trabajos prácticos, exámenes y fechas importantes.',
            '<button type="button" data-ws-new="materia">+ Nueva materia</button><button type="button" class="primary" data-ws-new="actividad">+ Nueva actividad</button>')
            + '<div class="ws-filters">' + tabs + '</div>' + body;
    };

    // ---- Trabajo: postulaciones, entrevistas, empleos y capacitaciones
    const renderJobs = () => {
        const t = today();
        let list = W().trabajo.slice();
        if (st.jobKind) list = list.filter((j) => j.kind === st.jobKind);
        if (st.jobView === 'abiertos') list = list.filter((j) => JOB_OPEN.includes(j.status));
        root('trabajo').innerHTML = head('Trabajo', 'Empleos, entrevistas, postulaciones y capacitaciones fuera de JNB.', '<button type="button" class="primary" data-ws-new="trabajo">+ Nuevo registro</button>')
            + '<div class="ws-filters">' + seg('jobView', st.jobView, { abiertos: 'En curso', todos: 'Todos' }) + select('jobKind', st.jobKind, { '': 'Todos los tipos', ...JOB_KIND }, 'Tipo') + '</div>'
            + (list.length ? '<table class="ws-table"><thead><tr><th>Fecha</th><th>Qué</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>'
                + list.map((j) => '<tr' + rowAttrs('trabajo', j) + '><td class="ws-nowrap" data-label="Fecha">' + esc(fshort(j.date)) + (j.time ? '<br><span class="small muted">' + esc(j.time) + ' h</span>' : '') + (j.date === t ? '<br>' + tag('en-curso', { 'en-curso': 'Hoy' }) : '') + '</td>'
                    + '<td data-label="Qué"><strong>' + esc(j.title) + '</strong>' + (j.company ? '<br><span class="small muted">' + esc(j.company) + '</span>' : '') + '</td>'
                    + '<td data-label="Tipo">' + esc(JOB_KIND[j.kind] || j.kind) + '</td><td data-label="Estado">' + tag(j.status, JOB_STATUS) + '</td></tr>').join('')
                + '</tbody></table>' : empty(st.jobView === 'abiertos' ? 'No tenés postulaciones, entrevistas ni capacitaciones en curso.' : 'No hay registros para mostrar.'));
    };

    const RENDER = { 'mi-agenda': renderAgenda, estudios: renderStudies, trabajo: renderJobs };
    const MOD_OF = { agenda: 'mi-agenda', materia: 'estudios', actividad: 'estudios', trabajo: 'trabajo' };
    let current = '';

    // ---- Contadores del menú: agenda de hoy, entregas y exámenes de los próximos 7 días (o vencidos), entrevistas próximas
    const badges = () => {
        const t = today(); const week = addDays(t, 7); const w = W();
        const set = (id, n, title) => { const b = document.getElementById('n-' + id); if (b) { b.textContent = n || ''; b.title = n ? title : ''; } };
        const ag = w.agenda.filter((e) => e.done !== 'si' && e.date === t).length;
        const st7 = w.actividad.filter((a) => ACT_OPEN.includes(a.status) && a.date && a.date <= week).length;
        const jb = w.trabajo.filter((j) => JOB_OPEN.includes(j.status) && j.date && j.date >= t && j.date <= week).length;
        set('mi-agenda', ag, ag + ' para hoy'); set('estudios', st7, st7 + ' en los próximos 7 días o vencidas'); set('trabajo', jb, jb + ' en los próximos 7 días');
    };

    // ---- Editor (mismo diálogo que el gestor de tareas)
    let editing = null; // { kind, id, updated }
    const dialog = () => {
        let d = document.getElementById('ws-dialog');
        if (!d) { d = document.createElement('dialog'); d.id = 'ws-dialog'; d.className = 'task-dialog'; document.body.appendChild(d); }
        return d;
    };
    const fieldHtml = (r) => ([name, label, type, opt]) => {
        const o = opt || {}; const v = r[name] ?? '';
        const wide = type === 'text' || o.wide ? ' class="wide"' : '';
        if (type === 'select') return '<label' + wide + '>' + label + '<select name="' + name + '">' + Object.entries(o).filter(([k]) => typeof o[k] === 'string').map(([k, l]) => '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></label>';
        if (type === 'subject') return '<label' + wide + '>' + label + '<select name="' + name + '"><option value="">Sin materia</option>' + W().materia.map((s) => '<option value="' + s.id + '"' + (String(s.id) === String(v) ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></label>';
        if (type === 'text') return '<label' + wide + '>' + label + '<textarea name="' + name + '" rows="3" maxlength="' + o.max + '">' + esc(v) + '</textarea></label>';
        const input = type === 'line' ? 'text' : type;
        return '<label' + wide + '>' + label + '<input type="' + input + '" name="' + name + '" value="' + esc(v) + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.required ? ' required' : '') + (o.hint ? ' placeholder="' + esc(o.hint) + '"' : '') + '></label>';
    };
    const open = (kind, rec, preset) => {
        const f = FORMS[kind];
        const r = rec || { id: 0, updated: '', ...(preset || {}) };
        editing = { kind, id: r.id || 0, updated: r.updated || '' };
        const d = dialog();
        d.innerHTML = '<form method="dialog" class="task-form ws-form"><div class="task-form-head"><strong>' + (r.id ? 'Editar ' : kind === 'agenda' || kind === 'trabajo' ? 'Nuevo ' : 'Nueva ') + f.title + '</strong>'
            + '<button type="button" class="task-icon-btn" data-ws-close aria-label="Cerrar">×</button></div>'
            + '<div class="task-form-body"><div class="task-form-grid">' + f.fields.map(fieldHtml(r)).join('') + '</div></div>'
            + '<div class="task-form-foot">' + (r.id ? '<button type="button" data-ws-delete>Eliminar</button>' : '<span></span>')
            + '<div class="row"><button type="button" data-ws-close>Cancelar</button><button type="submit" class="primary">Guardar</button></div></div></form>';
        d.showModal();
        const first = d.querySelector('input, select, textarea'); if (first) first.focus();
    };
    const close = () => { const d = document.getElementById('ws-dialog'); if (d && d.open) d.close(); editing = null; };
    const changed = (workspace) => {
        panel().data().workspace = workspace;
        if (current && RENDER[current]) RENDER[current]();
        badges();
        document.dispatchEvent(new CustomEvent('jnb-workspace-change'));
    };
    const send = async (body, okMsg) => {
        try {
            const res = await panel().api('workspace', body);
            changed(res.workspace); close(); panel().toast(okMsg);
        } catch (err) {
            panel().toast(err.message === '409' ? 'Este registro cambió en otra pestaña: cerrá y volvé a abrirlo' : err.message === '400' ? 'Revisá los datos: falta el título o hay una fecha, hora o link no válidos' : 'No se pudo guardar');
        }
    };

    document.addEventListener('click', (e) => {
        const set = e.target.closest('[data-ws-set]');
        if (set) { st[set.dataset.wsSet] = set.dataset.value; if (RENDER[current]) RENDER[current](); return; }
        const nw = e.target.closest('[data-ws-new]');
        if (nw) { const kind = nw.dataset.wsNew; open(kind, null, kind === 'actividad' && st.studySubject ? { subject: st.studySubject } : null); return; }
        const op = e.target.closest('[data-ws-open]');
        if (op) { const [kind, id] = op.dataset.wsOpen.split(':'); const rec = W()[kind].find((x) => x.id === Number(id)); if (rec) open(kind, rec); return; }
        if (e.target.closest('[data-ws-close]')) { close(); return; }
        if (e.target.closest('[data-ws-delete]') && editing) {
            if (!confirm('¿Eliminar este registro? No se puede deshacer.')) return;
            send({ action: 'delete', kind: editing.kind, id: editing.id }, 'Eliminado');
        }
    });
    document.addEventListener('keydown', (e) => {
        const op = e.key === 'Enter' && e.target.closest && e.target.closest('tr[data-ws-open]');
        if (op) op.click();
    });
    document.addEventListener('change', (e) => {
        const sel = e.target.closest('[data-ws-select]');
        if (sel) { st[sel.dataset.wsSelect] = sel.value; if (RENDER[current]) RENDER[current](); }
    });
    document.addEventListener('submit', (e) => {
        if (!e.target.classList.contains('ws-form') || !editing) return;
        e.preventDefault();
        const item = Object.fromEntries(new FormData(e.target));
        send({ action: 'save', kind: editing.kind, id: editing.id, updated: editing.updated, item }, 'Guardado');
    });

    window.JNBWorkspace = {
        show: (mod) => { current = mod; if (RENDER[mod]) RENDER[mod](); },
        // Desde la búsqueda general: abre la ficha de un registro
        open: (kind, id) => { const rec = (W()[kind] || []).find((x) => x.id === id); if (rec) open(kind, rec); },
        // Para la búsqueda general (hit compara sin tildes ni mayúsculas)
        search: (hit) => {
            const w = W(); const out = [];
            w.agenda.filter((e) => hit(e.title, e.place, e.notes)).forEach((e) => out.push({ go: 'mi-agenda|agenda:' + e.id, title: '📅 ' + e.title, sub: 'Agenda' + (e.date ? ' · ' + fshort(e.date) : ''), scope: 'personal' }));
            w.materia.filter((m) => hit(m.name, m.career, m.teacher, m.notes)).forEach((m) => out.push({ go: 'estudios|materia:' + m.id, title: '📚 ' + m.name, sub: 'Materia' + (m.term ? ' · ' + m.term : ''), scope: 'estudios' }));
            w.actividad.filter((a) => hit(a.title, a.notes, subjectName(a.subject))).forEach((a) => out.push({ go: 'estudios|actividad:' + a.id, title: '📝 ' + a.title, sub: (ACT_KIND[a.kind] || '') + (subjectName(a.subject) ? ' · ' + subjectName(a.subject) : '') + (a.date ? ' · ' + fshort(a.date) : ''), scope: 'estudios' }));
            w.trabajo.filter((j) => hit(j.title, j.company, j.contact, j.notes)).forEach((j) => out.push({ go: 'trabajo|trabajo:' + j.id, title: '💼 ' + j.title, sub: (JOB_KIND[j.kind] || '') + (j.company ? ' · ' + j.company : ''), scope: 'trabajo' }));
            return out;
        },
        badges,
        // Para el Dashboard: lo personal con fecha (agenda pendiente desde hoy, actividades y trabajo abiertos)
        upcoming: () => {
            const t = today(); const w = W(); const out = [];
            w.agenda.filter((e) => e.done !== 'si' && e.date && e.date >= t).forEach((e) => out.push({ section: 'Agenda', text: (AGENDA_KIND[e.kind] && e.kind !== 'evento' ? AGENDA_KIND[e.kind] + ': ' : '') + e.title + (e.place ? ' · ' + e.place : ''), date: e.date, time: e.time || '', scope: 'personal', go: 'mi-agenda', noPast: true }));
            w.actividad.filter((a) => ACT_OPEN.includes(a.status) && a.date).forEach((a) => out.push({ section: 'Estudios', text: (ACT_KIND[a.kind] || '') + ': ' + a.title + (subjectName(a.subject) ? ' · ' + subjectName(a.subject) : ''), date: a.date, time: a.time || '', scope: 'estudios', go: 'estudios' }));
            w.trabajo.filter((j) => JOB_OPEN.includes(j.status) && j.date && j.kind !== 'empleo').forEach((j) => out.push({ section: 'Trabajo', text: (JOB_KIND[j.kind] || '') + ': ' + j.title + (j.company ? ' · ' + j.company : ''), date: j.date, time: j.time || '', scope: 'trabajo', go: 'trabajo' }));
            return out;
        },
        // Resumen para las tarjetas del Dashboard personal
        summary: () => {
            const t = today(); const week = addDays(t, 7); const w = W();
            return {
                agenda: w.agenda.filter((e) => e.done !== 'si' && e.date && e.date >= t && e.date <= week).length,
                materias: w.materia.filter((s) => s.status === 'cursando').length,
                entregas: w.actividad.filter((a) => ACT_OPEN.includes(a.status) && a.date && a.date <= week).length,
                trabajo: w.trabajo.filter((j) => JOB_OPEN.includes(j.status)).length,
            };
        },
    };
})();
