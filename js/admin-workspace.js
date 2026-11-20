// Espacio Personal de JNB Workspace: Agenda (#mi-agenda), Estudios (#estudios), Trabajo (#trabajo), Gastos (#gastos),
// Vencimientos (#vencimientos) y Metas (#metas).
// Los datos llegan con el resto del panel (data.workspace) y se guardan con POST /api/admin/workspace.
// Son datos personales: no van en la copia JNB (worker/core/backup-policy.js).
(() => {
    const panel = () => window.JNBPanel;
    const W = () => ({ agenda: [], carrera: [], materia: [], actividad: [], trabajo: [], gasto: [], vencimiento: [], meta: [], ...((panel().data() || {}).workspace || {}) });
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const today = () => (window.JNBHolidays ? window.JNBHolidays.now().date : new Date().toISOString().slice(0, 10));
    const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const WEEK_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const fdate = (iso) => (iso ? WEEK_LONG[new Date(iso + 'T12:00:00Z').getUTCDay()] + ' ' + Number(iso.slice(8)) + ' de ' + MONTHS[Number(iso.slice(5, 7)) - 1] : 'Sin fecha');
    const fshort = (iso) => (iso ? Number(iso.slice(8)) + '/' + Number(iso.slice(5, 7)) + '/' + iso.slice(2, 4) : 'Sin fecha');

    // ---- Opciones (las mismas claves que valida el servidor en worker/core/workspace.js)
    const AGENDA_KIND = { evento: 'Evento', turno: 'Turno', reunion: 'Reunión', recordatorio: 'Recordatorio', otro: 'Otro' };
    const CAREER_STATUS = { cursando: 'Cursando', pausada: 'En pausa', finalizada: 'Finalizada' };
    const SUBJECT_STATUS = { inscripta: 'Inscripta', cursando: 'Cursando', regular: 'Regular (debe final)', promocionada: 'Promocionada', aprobada: 'Aprobada', libre: 'Libre', abandonada: 'Abandonada', pendiente: 'Pendiente' };
    const ACT_KIND = { tp: 'Trabajo práctico', parcial: 'Parcial', final: 'Final', recuperatorio: 'Recuperatorio', entrega: 'Entrega', fecha: 'Fecha importante' };
    const ACT_STATUS = { pendiente: 'Pendiente', inscripta: 'Inscripta', 'en-curso': 'En curso', entregado: 'Entregado', aprobado: 'Aprobado', desaprobado: 'Desaprobado' };
    const ACT_RESULT = { '': 'Sin resultado', aprobado: 'Aprobado', desaprobado: 'Desaprobado' };
    const JOB_KIND = { postulacion: 'Postulación', entrevista: 'Entrevista', empleo: 'Empleo', capacitacion: 'Capacitación' };
    const JOB_STATUS = { pendiente: 'Pendiente', enviada: 'Enviada', 'en-proceso': 'En proceso', aceptada: 'Aceptada', rechazada: 'Rechazada', activo: 'Activo', finalizado: 'Finalizado' };
    const TONE = { 'por-cursar': 'todo', inscripta: 'info', promocionada: 'ok', finalizada: 'ok', pausada: 'warn', cursando: 'info', regular: 'warn', aprobada: 'ok', aprobado: 'ok', libre: 'bad', abandonada: 'bad', desaprobado: 'bad', 'en-curso': 'info', entregado: 'ok', enviada: 'info', 'en-proceso': 'warn', aceptada: 'ok', rechazada: 'bad', activo: 'ok' };
    const tag = (value, labels) => '<span class="ws-tag ws-t-' + (TONE[value] || 'muted') + '">' + esc(labels[value] || value) + '</span>';
    // Lo que sigue abierto (para filtros, contadores y el Dashboard)
    const ACT_OPEN = ['pendiente', 'inscripta', 'en-curso'];
    // Solo los finales llevan inscripción: un TP, parcial o entrega guardado como "Inscripta" cuenta como pendiente (o con su resultado)
    const actStatus = (a) => (a.kind !== 'final' && a.status === 'inscripta' ? (a.result || 'pendiente') : a.status);
    const JOB_OPEN = ['pendiente', 'enviada', 'en-proceso', 'activo'];
    const EXP_CAT = { super: 'Supermercado', comida: 'Comida y delivery', transporte: 'Transporte', servicios: 'Servicios', alquiler: 'Alquiler', salud: 'Salud', estudio: 'Estudio', ocio: 'Salidas y ocio', ropa: 'Ropa', regalos: 'Regalos', impuestos: 'Impuestos', otros: 'Otros' };
    const EXP_METHOD = { '': 'Sin indicar', efectivo: 'Efectivo', debito: 'Débito', credito: 'Crédito', transferencia: 'Transferencia', mercadopago: 'Mercado Pago' };
    const DL_KIND = { documento: 'Documento', turno: 'Turno', seguro: 'Seguro', impuesto: 'Impuesto', servicio: 'Servicio', otro: 'Otro' };
    const GOAL_AUTO = { '': 'Lo actualizo a mano', materias: 'Materias aprobadas (de Estudios)', promedio: 'Promedio (de Estudios)' };
    const GOAL_STATUS = { 'en-curso': 'En curso', cumplida: 'Cumplida', abandonada: 'Abandonada' };
    const subjectName = (id) => { const s = W().materia.find((x) => String(x.id) === String(id)); return s ? s.name : ''; };

    // ---- Formularios: [campo, etiqueta, tipo, opciones]
    const FORMS = {
        agenda: { title: 'evento', fields: [
            ['title', 'Qué', 'line', { required: true, max: 160, wide: true }], ['kind', 'Tipo', 'select', AGENDA_KIND], ['date', 'Fecha', 'date'],
            ['time', 'Hora de inicio', 'time'], ['end', 'Hora de fin', 'time'], ['place', 'Lugar', 'line', { max: 160 }],
            ['done', 'Estado', 'select', { no: 'Pendiente', si: 'Hecho' }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        carrera: { title: 'carrera', fields: [
            ['name', 'Carrera', 'line', { required: true, max: 160, wide: true, hint: 'Ingeniería en Sistemas' }], ['institution', 'Universidad o institución', 'line', { max: 160 }],
            ['status', 'Estado', 'select', CAREER_STATUS], ['total', 'Materias del plan', 'line', { max: 4, hint: 'Ej.: 36', mode: 'numeric' }],
            ['promo', 'Nota para promocionar', 'line', { max: 5, hint: '7', mode: 'decimal' }], ['aprueba', 'Nota para aprobar', 'line', { max: 5, hint: '4', mode: 'decimal' }],
            ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        materia: { title: 'materia', fields: [
            ['name', 'Materia', 'line', { required: true, max: 160, wide: true }], ['carrera', 'Carrera', 'career'],
            ['status', 'Estado', 'select', SUBJECT_STATUS], ['term', 'Cursada (cuatrimestre o año)', 'line', { max: 80, hint: '1.er cuatrimestre 2026' }],
            ['schedule', 'Horario', 'line', { max: 200, hint: 'Lun 18-20, Mié 14:30-16' }], ['teacher', 'Docente', 'line', { max: 160 }],
            ['code', 'Código de la materia', 'line', { max: 20, hint: 'PW1' }], ['corrCursar', 'Correlativas para cursar (regularizadas)', 'line', { max: 300, hint: 'Códigos separados por coma: PB1, MB' }],
            ['corrRendir', 'Correlativas para rendir el final (aprobadas)', 'line', { max: 300, wide: true, hint: 'Códigos separados por coma' }],
            ['aula', 'Aula virtual', 'url', { hint: 'https://…' }], ['drive', 'Drive', 'url', { hint: 'https://…' }],
            ['apuntes', 'Apuntes', 'url', { hint: 'https://…' }], ['whatsapp', 'Grupo de WhatsApp', 'url', { hint: 'https://chat.whatsapp.com/…' }],
            ['p1', 'Nota 1.er parcial', 'line', { max: 10, mode: 'decimal' }], ['p2', 'Nota 2.º parcial', 'line', { max: 10, mode: 'decimal' }],
            ['recup', 'Nota del recuperatorio', 'line', { max: 10, mode: 'decimal', hint: 'Reemplaza al parcial más bajo' }], ['final', 'Nota del final', 'line', { max: 10, mode: 'decimal', hint: 'Vacío si promocionás' }],
            ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        actividad: { title: 'actividad', fields: [
            ['title', 'Qué', 'line', { required: true, max: 160, wide: true, hint: 'TP 2: análisis de casos' }], ['kind', 'Tipo', 'select', ACT_KIND],
            ['subject', 'Materia', 'subject'], ['date', 'Fecha', 'date'], ['time', 'Hora', 'time'], ['status', 'Estado', 'select', ACT_STATUS],
            ['grade', 'Nota (número)', 'line', { max: 10, mode: 'decimal' }], ['result', 'O resultado', 'select', ACT_RESULT], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        trabajo: { title: 'registro', fields: [
            ['kind', 'Tipo', 'select', JOB_KIND], ['title', 'Puesto, búsqueda o curso', 'line', { required: true, max: 160 }],
            ['company', 'Empresa o institución', 'line', { max: 160 }], ['date', 'Fecha', 'date'], ['time', 'Hora', 'time'],
            ['status', 'Estado', 'select', JOB_STATUS], ['contact', 'Contacto', 'line', { max: 200 }], ['url', 'Link', 'url', { hint: 'https://…' }],
            ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        gasto: { title: 'gasto', fields: [
            ['concept', 'Concepto', 'line', { required: true, max: 160, wide: true, hint: 'Compra del super' }], ['amount', 'Monto en pesos', 'line', { max: 20, mode: 'decimal', hint: '12500' }],
            ['date', 'Fecha', 'date'], ['category', 'Categoría', 'select', EXP_CAT], ['method', 'Medio de pago', 'select', EXP_METHOD], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        vencimiento: { title: 'vencimiento', fields: [
            ['title', 'Qué vence', 'line', { required: true, max: 160, wide: true, hint: 'Renovar el DNI' }], ['kind', 'Tipo', 'select', DL_KIND],
            ['date', 'Fecha', 'date'], ['time', 'Hora', 'time'], ['notice', 'Avisarme por mail (días antes)', 'line', { max: 3, mode: 'numeric', hint: '7' }],
            ['place', 'Lugar', 'line', { max: 160 }], ['done', 'Estado', 'select', { no: 'Pendiente', si: 'Hecho' }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        meta: { title: 'meta', fields: [
            ['title', 'Meta', 'line', { required: true, max: 160, wide: true, hint: 'Aprobar 4 materias' }], ['term', 'Período', 'line', { max: 80, hint: '2027 o 1er cuatrimestre 2027' }],
            ['deadline', 'Fecha límite', 'date'], ['auto', 'Avance', 'select', GOAL_AUTO], ['target', 'Objetivo (número)', 'line', { max: 10, mode: 'decimal', hint: '4' }],
            ['progress', 'Avance actual (si es a mano)', 'line', { max: 10, mode: 'decimal' }], ['status', 'Estado', 'select', GOAL_STATUS], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
    };

    // ---- Estado de cada vista
    const st = { agendaView: 'proximos', studyTab: 'carreras', studyCareer: '', studyYear: '', studyHalf: '', studySubject: '', studyView: 'abiertas', jobKind: '', jobView: 'abiertos', expMonth: null, expCat: '', dlView: 'proximos', goalView: 'en-curso' };
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

    // ---- Estudios: carreras, materias (inscripción, notas y condición) y actividades (TPs, exámenes, finales y fechas)
    // Cálculos: el recuperatorio reemplaza al parcial más bajo; promociona si los dos parciales llegan a la nota de promoción
    // y los TPs están aprobados; queda regular (debe final) si llegan a la nota de aprobación. La nota de la materia es la del
    // final o, si promocionó, el promedio de los parciales. Las notas mínimas se toman de la carrera (por defecto 7 y 4).
    const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
    const fmt = (n) => (n === null || n === undefined ? '—' : (Math.round(n * 100) / 100).toLocaleString('es-AR'));
    const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
    const careerOf = (s) => W().carrera.find((c) => String(c.id) === String(s.carrera)) || null;
    const limits = (s) => { const c = careerOf(s); return { promo: num(c && c.promo) ?? 7, aprueba: num(c && c.aprueba) ?? 4 }; };
    const tpsOf = (s) => W().actividad.filter((a) => a.kind === 'tp' && String(a.subject) === String(s.id));
    const finalsOf = (s) => W().actividad.filter((a) => a.kind === 'final' && String(a.subject) === String(s.id));
    const study = (s) => {
        const L = limits(s);
        const parts = [num(s.p1), num(s.p2)];
        const recup = num(s.recup);
        if (recup !== null) { const known = parts.filter((n) => n !== null); const low = known.length ? Math.min(...known) : null; const i = parts.indexOf(low); parts[i >= 0 ? i : parts.indexOf(null)] = recup; }
        const given = parts.filter((n) => n !== null);
        const cursada = given.length ? Math.round(avg(given)) : null; // 7,5 → 8; 9,5 → 10
        const tps = tpsOf(s);
        const tpNums = tps.map((t) => num(t.grade)).filter((n) => n !== null);
        const tpBad = tps.some((t) => t.result === 'desaprobado' || (num(t.grade) !== null && num(t.grade) < L.aprueba));
        const tpOk = !tpBad;
        const final = num(s.final);
        let cond = s.status === 'pendiente' ? 'Por cursar' : 'En curso'; let tone = s.status === 'pendiente' ? 'muted' : 'info'; // pendiente = todavía no la cursó
        if (final !== null) { cond = final >= L.aprueba ? 'Aprobada con final' : 'Final desaprobado'; tone = final >= L.aprueba ? 'ok' : 'bad'; }
        else if (given.length === 2) {
            const min = Math.min(...given);
            if (min >= L.promo && tpOk) { cond = 'Promociona'; tone = 'ok'; }
            else if (min >= L.aprueba && tpOk) { cond = 'Regular: rinde final'; tone = 'warn'; }
            else { cond = !tpOk ? 'TP desaprobado' : recup !== null ? 'Recursa' : 'Tiene que recuperar'; tone = 'bad'; } // con el recuperatorio ya rendido y desaprobado, se recursa
        }
        const approved = ['aprobada', 'promocionada'].includes(s.status) || (final !== null && final >= L.aprueba);
        const grade = final !== null ? final : (s.status === 'promocionada' || cond === 'Promociona' ? cursada : null);
        return { parts, given, cursada, tps, tpAvg: avg(tpNums), tpOk, final, cond, tone, approved, grade };
    };
    // Resumen de una carrera (o de las materias sin carrera, con id vacío)
    const careerStats = (cid) => {
        const w = W();
        const subjects = w.materia.filter((s) => String(s.carrera || '') === String(cid || ''));
        const info = subjects.map((s) => ({ s, x: study(s) }));
        const passed = info.filter((i) => i.x.approved);
        const grades = passed.map((i) => i.x.grade).filter((n) => n !== null);
        const failedFinals = subjects.flatMap((s) => finalsOf(s).filter((a) => a.status === 'desaprobado' || a.result === 'desaprobado').map((a) => num(a.grade)).filter((n) => n !== null));
        const finalsTaken = subjects.reduce((n, s) => { const f = finalsOf(s).filter((a) => ['aprobado', 'desaprobado'].includes(a.status) || a.result); return n + Math.max(f.length, num(s.final) !== null ? 1 : 0); }, 0);
        const regular = info.filter((i) => !i.x.approved && (i.s.status === 'regular' || i.x.cond === 'Regular: rinde final'));
        const enrolled = subjects.reduce((n, s) => n + finalsOf(s).filter((a) => a.status === 'inscripta').length, 0);
        const c = cid ? w.carrera.find((x) => String(x.id) === String(cid)) : null;
        const total = num(c && c.total);
        return { subjects, passed: passed.length, total, left: total !== null ? Math.max(total - passed.length, 0) : null,
            avg: avg(grades), avgAll: avg(grades.concat(failedFinals)), finalsTaken, finalsLeft: regular.length, enrolled,
            current: subjects.filter((s) => ['inscripta', 'cursando'].includes(s.status)).length };
    };
    // Año y cuatrimestre se leen del texto de la cursada ("1er cuatrimestre 2026", "2.º cuatrimestre 2025", "Segundo cuatrimestre 2026")
    const termYear = (s) => { const m = String(s.term || '').match(/\b(19|20)\d{2}\b/); return m ? m[0] : ''; };
    const termHalf = (s) => { const t = String(s.term || '').toLowerCase();
        if (/\b(1|primer|primero)\s*(\.?\s*(er|ero|ro|º|°|o))?\s*cuatri/.test(t)) return '1';
        if (/\b(2|segundo)\s*(\.?\s*(do|º|°|o))?\s*cuatri/.test(t)) return '2';
        return ''; };
    const folded = new Set(); // materias abiertas en el celular
    const termLabel = (s) => { const y = termYear(s); const h = termHalf(s); return y ? (h ? h + 'C ' : '') + y : ''; };
    const inTerm = (period) => { const y = termYear(period); const h = termHalf(period); return (s) => (!y || termYear(s) === y) && (!h || termHalf(s) === h); };

    // Correlativas: códigos separados por coma. Para cursar alcanza con tenerlas regularizadas; para rendir el final, aprobadas
    const codeKey = (v) => String(v || '').trim().toUpperCase();
    const codesOf = (v) => String(v || '').split(/[,;]+/).map(codeKey).filter(Boolean);
    const byCode = (s, c) => { const all = W().materia.filter((x) => codeKey(x.code) === c); return all.find((x) => String(x.carrera || '') === String(s.carrera || '')) || all[0] || null; };
    const isRegular = (s) => { const x = study(s); return x.approved || s.status === 'regular' || x.cond === 'Regular: rinde final' || x.cond === 'Promociona'; };
    const corr = (s) => {
        const miss = (list, ok) => list.map((c) => ({ c, m: byCode(s, c) })).filter((o) => !o.m || !ok(o.m)).map((o) => (o.m ? o.m.name : o.c + ' (no cargada)'));
        return { cursar: miss(codesOf(s.corrCursar), isRegular), rendir: miss(codesOf(s.corrRendir), (m) => study(m).approved) };
    };

    // Horario: se lee del texto de la materia ("Lun 18-20, Mié 14:30-16", "Lunes y miércoles 18 a 20")
    const WEEKDAYS = [['lun', 'Lunes', /\blun(es)?\b/g], ['mar', 'Martes', /\bmar(tes)?\b/g], ['mie', 'Miércoles', /\bmie(rcoles)?\b/g], ['jue', 'Jueves', /\bjue(ves)?\b/g], ['vie', 'Viernes', /\bvie(rnes)?\b/g], ['sab', 'Sábado', /\bsab(ado)?\b/g]];
    const hhmm = (h, m) => (Number(h) <= 23 && Number(m || 0) <= 59 ? String(h).padStart(2, '0') + ':' + (m || '00') : '');
    const parseSchedule = (text) => {
        const t = String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const marks = [];
        WEEKDAYS.forEach(([k, , re]) => { for (const m of t.matchAll(re)) marks.push({ at: m.index, day: k }); });
        for (const m of t.matchAll(/(\d{1,2})(?:[:.](\d{2}))?\s*(?:h|hs)?\s*(?:a|-|–|hasta)\s*(\d{1,2})(?:[:.](\d{2}))?/g)) marks.push({ at: m.index, from: hhmm(m[1], m[2]), to: hhmm(m[3], m[4]) });
        marks.sort((a, b) => a.at - b.at);
        const out = []; let pending = []; let last = [];
        marks.forEach((m) => {
            if (m.day) { pending.push(m.day); return; }
            const days = pending.length ? pending : last;
            if (m.from && m.to && m.from < m.to) days.forEach((d) => out.push({ day: d, from: m.from, to: m.to }));
            if (pending.length) { last = pending; pending = []; }
        });
        return out;
    };

    // Montos en pesos: acepta "12500", "12.500", "12.500,50" y "$ 12500"
    const money = (v) => { let t = String(v ?? '').replace(/[$\s]/g, ''); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); const n = parseFloat(t); return Number.isFinite(n) ? n : null; };
    const ars = (n) => { const v = Math.round((n || 0) * 100) / 100; return '$ ' + v.toLocaleString('es-AR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
    const LINKS = [['aula', 'Aula virtual'], ['drive', 'Drive'], ['apuntes', 'Apuntes'], ['whatsapp', 'WhatsApp']];
    const linksOf = (s) => { const l = LINKS.filter(([k]) => s[k]); return l.length ? '<span class="ws-links">' + l.map(([k, label]) => '<a href="' + esc(s[k]) + '" target="_blank" rel="noopener">' + label + '</a>').join('') + '</span>' : ''; };
    const bar = (pct) => '<span class="ws-bar"><span style="width:' + Math.round(Math.max(0, Math.min(1, pct)) * 100) + '%"></span></span>';
    const kpi = (n, label) => '<div class="ws-kpi"><span class="ws-kpi-n">' + n + '</span><span class="ws-kpi-l">' + label + '</span></div>';

    const renderStudies = () => {
        const t = today();
        const w = W();
        const tabs = seg('studyTab', st.studyTab, { carreras: 'Carreras', materias: 'Materias y notas', correlativas: 'Correlativas', horario: 'Horario', actividades: 'TPs, exámenes y finales' });
        const careers = { '': 'Todas las carreras', ...Object.fromEntries(w.carrera.map((c) => [String(c.id), c.name])) };
        let body;
        if (st.studyTab === 'carreras') {
            // Avance: porcentaje del plan aprobado y promedio de las materias aprobadas en cada cuatrimestre
            const progress = (k) => {
                const pct = k.total ? k.passed / k.total : null;
                const groups = {};
                k.subjects.forEach((s) => { const x = study(s); const l = termLabel(s); if (x.approved && x.grade !== null && l) { const key = termYear(s) + (termHalf(s) || '0'); (groups[key] = groups[key] || { l, g: [] }).g.push(x.grade); } });
                const cols = Object.keys(groups).sort().map((key) => ({ l: groups[key].l, n: groups[key].g.length, a: avg(groups[key].g) }));
                return (pct !== null ? '<div class="ws-progress">' + bar(pct) + '<span class="small muted">' + Math.round(pct * 100) + ' % de la carrera aprobada</span></div>' : '')
                    + (cols.length ? '<div class="ws-chart" role="img" aria-label="Promedio por cuatrimestre: ' + esc(cols.map((c) => c.l + ' ' + fmt(c.a)).join('; ')) + '"><p class="ws-chart-t">Promedio por cuatrimestre</p><div class="ws-bars">'
                        + cols.map((c) => '<div class="ws-bar-col" title="' + esc(c.l) + ': promedio ' + fmt(c.a) + ' (' + c.n + (c.n === 1 ? ' materia' : ' materias') + ')"><span class="ws-bar-v">' + fmt(c.a) + '</span><span class="ws-bar-track"><span class="ws-bar-f" style="height:' + Math.round(c.a * 10) + '%"></span></span><span class="ws-bar-l">' + esc(c.l) + '</span></div>').join('')
                        + '</div></div>' : '');
            };
            const card = (c) => {
                const k = careerStats(c ? c.id : '');
                return '<div class="card ws-career"><div class="ws-career-head"><div><h3>' + esc(c ? c.name : 'Materias sin carrera') + '</h3>'
                    + (c && (c.institution || c.status) ? '<p class="small muted">' + esc(c.institution || '') + (c.institution ? ' · ' : '') + esc(CAREER_STATUS[c.status] || '') + '</p>' : '') + '</div>'
                    + (c ? '<button type="button" data-ws-open="carrera:' + c.id + '">Editar</button>' : '') + '</div>'
                    + '<div class="ws-kpis">'
                    + kpi(k.passed + (k.total !== null ? ' <small>de ' + k.total + '</small>' : ''), 'Materias aprobadas')
                    + kpi(fmt(k.avg), 'Promedio' + (k.avgAll !== null && k.avgAll !== k.avg ? ' <small>(con aplazos ' + fmt(k.avgAll) + ')</small>' : ''))
                    + kpi(k.current, 'Cursando o inscripta')
                    + kpi(k.finalsTaken, 'Finales rendidos')
                    + kpi(k.finalsLeft, 'Finales que te quedan')
                    + kpi(k.enrolled, 'Inscripciones a finales')
                    + (k.left !== null ? kpi(k.left, 'Materias que faltan') : '')
                    + '</div>' + progress(k) + '</div>';
            };
            const loose = w.materia.some((s) => !s.carrera);
            body = w.carrera.length || loose ? '<div class="ws-careers">' + w.carrera.map(card).join('') + (loose ? card(null) : '') + '</div>'
                : empty('Empezá cargando tu carrera con “Nueva carrera”. Si cursás dos en simultáneo, cargá las dos.');
        } else if (st.studyTab === 'materias') {
            const years = [...new Set(w.materia.map(termYear).filter(Boolean))].sort();
            const list = w.materia.filter((s) => (!st.studyCareer || String(s.carrera) === st.studyCareer)
                && (!st.studyYear || termYear(s) === st.studyYear) && (!st.studyHalf || termHalf(s) === st.studyHalf))
                .sort((a, b) => (termYear(a) || '9999').localeCompare(termYear(b) || '9999') || (termHalf(a) || '9').localeCompare(termHalf(b) || '9') || String(a.name).localeCompare(String(b.name), 'es'));
            const n = (v) => (num(v) === null ? '—' : fmt(num(v)));
            body = '<div class="ws-filters">' + (w.carrera.length ? select('studyCareer', st.studyCareer, careers, 'Carrera') : '')
                + select('studyYear', st.studyYear, { '': 'Todos los años', ...Object.fromEntries(years.map((y) => [y, y])) }, 'Año')
                + select('studyHalf', st.studyHalf, { '': 'Los dos cuatrimestres', 1: '1.er cuatrimestre', 2: '2.º cuatrimestre' }, 'Cuatrimestre') + '</div>'
                + (list.length ? '<div class="table-wrap"><table class="ws-table ws-grades"><thead><tr><th>Materia</th><th>Estado</th><th class="n">1.er parcial</th><th class="n">2.º parcial</th><th class="n">Recup.</th><th class="n">TPs</th><th class="n">Nota</th><th class="n">Final</th><th>Condición</th></tr></thead><tbody>'
                    + list.map((s) => { const x = study(s); const c = careerOf(s);
                        const tpTxt = x.tps.length ? (x.tpAvg !== null ? fmt(x.tpAvg) : (x.tpOk ? 'Aprob.' : 'Desaprob.')) + ' <span class="small muted">(' + x.tps.length + ')</span>' : '—';
                        const isOpen = folded.has(s.id);
                        return '<tr' + rowAttrs('materia', s, isOpen ? 'is-open' : '') + '><td data-label="Materia"><button type="button" class="ws-fold" data-ws-fold="' + s.id + '" aria-expanded="' + isOpen + '" aria-label="Ver notas de ' + esc(s.name) + '"></button><strong>' + esc(s.name) + '</strong>' + ((c && !st.studyCareer) || s.term || s.code ?'<br><span class="small muted ws-sub">' + [s.code ? esc(s.code) : '', s.term ? esc(s.term) : '', c && !st.studyCareer ? esc(c.name) : ''].filter(Boolean).join(' · ') + '</span>' : '') + linksOf(s) + '</td>'
                            + '<td data-label="Estado">' + (s.status === 'pendiente' ? tag('por-cursar', { 'por-cursar': 'Pendiente' }) : tag(s.status, SUBJECT_STATUS)) + '</td>'
                            + '<td class="n" data-label="1.er parcial">' + n(s.p1) + '</td><td class="n" data-label="2.º parcial">' + n(s.p2) + '</td><td class="n" data-label="Recuperatorio">' + n(s.recup) + '</td>'
                            + '<td class="n" data-label="TPs">' + tpTxt + '</td><td class="n" data-label="Nota de la materia"><strong>' + fmt(x.final ?? x.cursada) + '</strong></td><td class="n" data-label="Final">' + n(s.final) + '</td>'
                            + '<td data-label="Condición">' + tag(x.tone === 'ok' ? 'aprobado' : x.tone === 'bad' ? 'desaprobado' : x.tone === 'warn' ? 'regular' : x.tone === 'muted' ? 'por-cursar' : 'en-curso', { aprobado: x.cond, desaprobado: x.cond, regular: x.cond, 'en-curso': x.cond, 'por-cursar': x.cond }) + '</td></tr>'; }).join('')
                    + '</tbody></table></div><p class="small muted ws-note">El recuperatorio reemplaza al parcial más bajo. La nota de la materia es la del final si lo rendiste; si no, el promedio de los parciales, redondeado al entero (7,5 → 8). Promoción y aprobación según las notas de cada carrera (por defecto 7 y 4). Los TPs se cargan como actividades de tipo “Trabajo práctico”.</p>'
                    : empty('Todavía no hay materias' + (st.studyCareer ? ' en esta carrera' : '') + '. Inscribite con “Nueva materia”.'));
        } else if (st.studyTab === 'correlativas') {
            const mine = w.materia.filter((s) => !st.studyCareer || String(s.carrera) === st.studyCareer);
            const sub = (s) => '<strong>' + esc(s.name) + '</strong>' + (s.code || s.term ? '<br><span class="small muted">' + [s.code, s.term].filter(Boolean).map(esc).join(' · ') + '</span>' : '');
            const rows = (list, which, okTxt, badTxt, missTxt) => '<table class="ws-table"><thead><tr><th>Materia</th><th>Estado</th></tr></thead><tbody>'
                + list.map((s) => { const m = corr(s)[which];
                    return '<tr' + rowAttrs('materia', s) + '><td data-label="Materia">' + sub(s) + '</td><td data-label="Estado">' + (m.length ? tag('desaprobado', { desaprobado: badTxt }) + '<br><span class="small muted">' + missTxt + ': ' + esc(m.join(', ')) + '</span>' : tag('aprobado', { aprobado: okTxt })) + '</td></tr>'; }).join('')
                + '</tbody></table>';
            const toTake = mine.filter((s) => ['pendiente', 'inscripta'].includes(s.status) && !study(s).approved);
            const toFinal = mine.filter((s) => isRegular(s) && !study(s).approved);
            body = '<div class="ws-filters">' + (w.carrera.length ? select('studyCareer', st.studyCareer, careers, 'Carrera') : '') + '</div>'
                + (mine.some((s) => s.code) ? '' : '<p class="small muted ws-note">Para que funcione, cargá en la ficha de cada materia su código y los códigos de sus correlativas. Las materias que todavía no cursás se cargan con el estado “Pendiente”.</p>')
                + '<p class="ws-day">Para cursar · alcanza con las correlativas regularizadas</p>'
                + (toTake.length ? rows(toTake, 'cursar', 'Habilitada', 'Bloqueada', 'Falta regularizar') : empty('No hay materias pendientes. Cargá las del próximo cuatrimestre con el estado “Pendiente”.'))
                + '<p class="ws-day">Para rendir el final · las correlativas tienen que estar aprobadas</p>'
                + (toFinal.length ? rows(toFinal, 'rendir', 'Puede rendir', 'Todavía no', 'Falta aprobar') : empty('No tenés materias regulares con el final pendiente.'));
        } else if (st.studyTab === 'horario') {
            const mine = w.materia.filter((s) => ['inscripta', 'cursando'].includes(s.status) && (!st.studyCareer || String(s.carrera) === st.studyCareer));
            const blocks = mine.flatMap((s) => parseSchedule(s.schedule).map((b) => ({ ...b, s })));
            const clash = (b) => blocks.some((o) => o !== b && o.s !== b.s && o.day === b.day && o.from < b.to && b.from < o.to);
            const unread = mine.filter((s) => !parseSchedule(s.schedule).length);
            body = '<div class="ws-filters">' + (w.carrera.length ? select('studyCareer', st.studyCareer, careers, 'Carrera') : '') + '</div>'
                + (blocks.length ? '<div class="ws-week">' + WEEKDAYS.map(([k, label]) => { const day = blocks.filter((b) => b.day === k).sort((a, b) => a.from.localeCompare(b.from));
                    return '<div class="ws-wday' + (day.length ? '' : ' is-empty') + '"><p class="ws-day">' + label + '</p>' + (day.length ? day.map((b) => '<button type="button" class="ws-slot" data-ws-open="materia:' + b.s.id + '"><span class="small">' + b.from + '–' + b.to + '</span><strong>' + esc(b.s.name) + '</strong>' + (clash(b) ? tag('desaprobado', { desaprobado: 'Se superpone' }) : '') + '</button>').join('') : '<p class="small muted">Libre</p>') + '</div>'; }).join('') + '</div>'
                    : empty(mine.length ? 'Ninguna materia en curso tiene un horario que pueda leer.' : 'No tenés materias inscriptas o en curso.'))
                + (unread.length ? '<p class="small muted ws-note">Sin horario reconocido: ' + unread.map((s) => esc(s.name) + (s.schedule ? ' («' + esc(s.schedule) + '»)' : '')).join(', ') + '. Escribilo en la ficha como “Lun 18-20, Mié 14:30-16”.</p>' : '');
        } else {
            let list = w.actividad.slice();
            if (st.studySubject) list = list.filter((a) => String(a.subject) === st.studySubject);
            if (st.studyView === 'abiertas') list = list.filter((a) => ACT_OPEN.includes(actStatus(a)));
            const subjects = { '': 'Todas las materias', ...Object.fromEntries(w.materia.map((s) => [String(s.id), s.name])) };
            body = '<div class="ws-filters">' + seg('studyView', st.studyView, { abiertas: 'Pendientes e inscripciones', todas: 'Todas' }) + select('studySubject', st.studySubject, subjects, 'Materia') + '</div>'
                + (list.length ? '<table class="ws-table"><thead><tr><th>Fecha</th><th>Qué</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>'
                    + list.map((a) => { const late = a.date && a.date < t && ['pendiente', 'en-curso'].includes(a.status);
                        const res = (num(a.grade) !== null ? ' <span class="small muted">Nota ' + esc(a.grade) + '</span>' : '') + (a.result && a.result !== actStatus(a) ? ' ' + tag(a.result, ACT_RESULT) : '');
                        return '<tr' + rowAttrs('actividad', a) + '><td class="ws-nowrap" data-label="Fecha">' + esc(fshort(a.date)) + (a.time ? '<br><span class="small muted">' + esc(a.time) + ' h</span>' : '') + (late ? '<br>' + tag('desaprobado', { desaprobado: 'Vencida' }) : '') + '</td>'
                            + '<td data-label="Qué"><strong>' + esc(a.title) + '</strong>' + (subjectName(a.subject) ? '<br><span class="small muted">' + esc(subjectName(a.subject)) + '</span>' : '') + '</td>'
                            + '<td data-label="Tipo">' + esc(ACT_KIND[a.kind] || a.kind) + '</td><td data-label="Estado">' + tag(actStatus(a), ACT_STATUS) + res + '</td></tr>'; }).join('')
                    + '</tbody></table>' : empty(st.studyView === 'abiertas' ? 'No tenés TPs, exámenes ni inscripciones a finales pendientes.' : 'No hay actividades para mostrar.'));
        }
        root('estudios').innerHTML = head('Estudios', 'Carreras, materias, notas, promedios, TPs, exámenes y finales.',
            '<button type="button" data-ws-new="carrera">+ Nueva carrera</button><button type="button" data-ws-new="materia">+ Nueva materia</button><button type="button" class="primary" data-ws-new="actividad">+ Nueva actividad</button>')
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

    // ---- Gastos personales: total del mes, por categoría y lista (en pesos)
    const renderExpenses = () => {
        const all = W().gasto;
        const month = today().slice(0, 7);
        if (st.expMonth === null) st.expMonth = month;
        const months = [...new Set(all.map((g) => (g.date || '').slice(0, 7)).filter(Boolean).concat(month))].sort().reverse();
        const mLabel = (m) => MONTHS[Number(m.slice(5)) - 1].replace(/^./, (c) => c.toUpperCase()) + ' ' + m.slice(0, 4);
        const inMonth = (m) => all.filter((g) => !m || (g.date || '').slice(0, 7) === m);
        const list = inMonth(st.expMonth).filter((g) => !st.expCat || g.category === st.expCat).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
        const sum = (l) => l.reduce((n, g) => n + (money(g.amount) || 0), 0);
        const total = sum(list);
        const prevKey = st.expMonth ? (() => { const d = new Date(st.expMonth + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); })() : '';
        const prev = prevKey ? sum(inMonth(prevKey).filter((g) => !st.expCat || g.category === st.expCat)) : null;
        const cats = Object.keys(EXP_CAT).map((k) => ({ k, n: sum(list.filter((g) => g.category === k)) })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
        root('gastos').innerHTML = head('Gastos', 'Tus gastos personales en pesos, separados de los números de JNB.', '<button type="button" class="primary" data-ws-new="gasto">+ Nuevo gasto</button>')
            + '<div class="ws-filters">' + select('expMonth', st.expMonth, { '': 'Todos los meses', ...Object.fromEntries(months.map((m) => [m, mLabel(m)])) }, 'Mes') + select('expCat', st.expCat, { '': 'Todas las categorías', ...EXP_CAT }, 'Categoría') + '</div>'
            + '<div class="ws-kpis ws-kpis-top">' + kpi(ars(total), st.expMonth ? 'Total de ' + mLabel(st.expMonth).toLowerCase() : 'Total') + kpi(list.length, list.length === 1 ? 'Gasto' : 'Gastos')
                + (prev !== null ? kpi(ars(prev), 'Mes anterior' + (prev ? ' <small>(' + (total >= prev ? '+' : '−') + Math.abs(Math.round((total - prev) / prev * 100)) + ' %)</small>' : '')) : '') + '</div>'
            + (cats.length > 1 ? '<div class="ws-cats">' + cats.map((c) => '<div class="ws-cat"><span>' + esc(EXP_CAT[c.k]) + '</span>' + bar(c.n / cats[0].n) + '<span class="ws-cat-n">' + ars(c.n) + '</span></div>').join('') + '</div>' : '')
            + (list.length ? '<table class="ws-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th class="n">Monto</th></tr></thead><tbody>'
                + list.map((g) => '<tr' + rowAttrs('gasto', g) + '><td class="ws-nowrap" data-label="Fecha">' + esc(fshort(g.date)) + '</td><td data-label="Concepto"><strong>' + esc(g.concept) + '</strong>' + (g.method ? '<br><span class="small muted">' + esc(EXP_METHOD[g.method] || '') + '</span>' : '') + '</td>'
                    + '<td data-label="Categoría">' + esc(EXP_CAT[g.category] || g.category) + '</td><td class="n" data-label="Monto"><strong>' + (money(g.amount) === null ? '—' : ars(money(g.amount))) + '</strong></td></tr>').join('')
                + '</tbody></table>' : empty('No hay gastos ' + (st.expMonth ? 'en ' + mLabel(st.expMonth).toLowerCase() : 'cargados') + '. Sumá el primero con “Nuevo gasto”.'));
    };

    // ---- Vencimientos personales: DNI, carnet, seguro, turnos; aviso por mail "notice" días antes (por defecto 7)
    const noticeOf = (v) => (/^\d{1,3}$/.test(String(v.notice || '')) ? Number(v.notice) : 7);
    const daysTo = (iso) => Math.round((new Date(iso + 'T12:00:00Z') - new Date(today() + 'T12:00:00Z')) / 864e5);
    const renderDeadlines = () => {
        let list = W().vencimiento.slice();
        if (st.dlView === 'proximos') list = list.filter((v) => v.done !== 'si');
        if (st.dlView === 'hechos') list = list.filter((v) => v.done === 'si').reverse();
        root('vencimientos').innerHTML = head('Vencimientos', 'DNI, carnet, seguros, impuestos y turnos. Te llega un mail a tu casilla de contacto los días antes que elijas (por defecto, 7).', '<button type="button" class="primary" data-ws-new="vencimiento">+ Nuevo vencimiento</button>')
            + '<div class="ws-filters">' + seg('dlView', st.dlView, { proximos: 'Pendientes', hechos: 'Hechos', todos: 'Todos' }) + '</div>'
            + (list.length ? '<table class="ws-table"><thead><tr><th>Fecha</th><th>Qué</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>'
                + list.map((v) => { const n = v.date ? daysTo(v.date) : null;
                    const state = v.done === 'si' ? tag('aprobado', { aprobado: 'Hecho' }) : n === null ? tag('pendiente', { pendiente: 'Sin fecha' })
                        : n < 0 ? tag('desaprobado', { desaprobado: 'Vencido' }) : tag(n <= noticeOf(v) ? 'regular' : 'en-curso', { regular: n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : 'Faltan ' + n + ' días', 'en-curso': 'Faltan ' + n + ' días' });
                    return '<tr' + rowAttrs('vencimiento', v, v.done === 'si' ? 'ws-done' : '') + '><td class="ws-nowrap" data-label="Fecha">' + esc(fshort(v.date)) + (v.time ? '<br><span class="small muted">' + esc(v.time) + ' h</span>' : '') + '</td>'
                        + '<td data-label="Qué"><strong>' + esc(v.title) + '</strong>' + (v.place ? '<br><span class="small muted">📍 ' + esc(v.place) + '</span>' : '') + '</td>'
                        + '<td data-label="Tipo">' + esc(DL_KIND[v.kind] || v.kind) + '</td><td data-label="Estado">' + state + (v.done !== 'si' ? '<br><span class="small muted">Aviso ' + noticeOf(v) + (noticeOf(v) === 1 ? ' día' : ' días') + ' antes</span>' : '') + '</td></tr>'; }).join('')
                + '</tbody></table>' : empty(st.dlView === 'proximos' ? 'No tenés vencimientos pendientes. Cargá el primero con “Nuevo vencimiento”.' : 'No hay vencimientos para mostrar.'));
    };

    // ---- Metas: avance a mano o calculado desde Estudios (materias aprobadas o promedio del período)
    const goalValue = (g) => {
        if (!g.auto) return num(g.progress);
        const passed = W().materia.filter(inTerm(g)).map((s) => study(s)).filter((x) => x.approved);
        if (g.auto === 'materias') return passed.length;
        return avg(passed.map((x) => x.grade).filter((n) => n !== null));
    };
    const renderGoals = () => {
        let list = W().meta.slice();
        if (st.goalView !== 'todas') list = list.filter((g) => g.status === st.goalView);
        list.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || a.id - b.id);
        root('metas').innerHTML = head('Metas', 'Objetivos del cuatrimestre o del año. Las de materias aprobadas y promedio se calculan solas desde Estudios.', '<button type="button" class="primary" data-ws-new="meta">+ Nueva meta</button>')
            + '<div class="ws-filters">' + seg('goalView', st.goalView, { 'en-curso': 'En curso', cumplida: 'Cumplidas', todas: 'Todas' }) + '</div>'
            + (list.length ? '<div class="ws-careers">' + list.map((g) => {
                const v = goalValue(g); const target = num(g.target);
                const pct = v !== null && target ? v / target : null;
                const reached = pct !== null && pct >= 1 && g.status === 'en-curso';
                const n = g.deadline ? daysTo(g.deadline) : null;
                const when = [g.term, g.deadline ? 'hasta el ' + fshort(g.deadline) + (g.status === 'en-curso' && n !== null ? (n < 0 ? ' (venció)' : n === 0 ? ' (hoy)' : ' (faltan ' + n + ' días)') : '') : ''].filter(Boolean).map(esc).join(' · ');
                return '<div class="card ws-career"><div class="ws-career-head"><div><h3>' + esc(g.title) + '</h3><p class="small muted">' + (when || 'Sin plazo') + '</p></div><button type="button" data-ws-open="meta:' + g.id + '">Editar</button></div>'
                    + (pct !== null ? '<div class="ws-progress">' + bar(pct) + '<span class="small muted">' + fmt(v) + ' de ' + fmt(target) + (g.auto === 'promedio' ? ' de promedio' : '') + ' · ' + Math.min(100, Math.round(pct * 100)) + ' %</span></div>'
                        : '<p class="small muted">' + (v !== null ? 'Llevás ' + fmt(v) + '. ' : '') + (target ? '' : 'Poné un objetivo con número para ver el avance.') + '</p>')
                    + '<p>' + tag(g.status === 'cumplida' ? 'aprobado' : g.status === 'abandonada' ? 'desaprobado' : 'en-curso', { aprobado: 'Cumplida', desaprobado: 'Abandonada', 'en-curso': 'En curso' }) + (reached ? ' ' + tag('aprobado', { aprobado: '¡Lograda! Marcala como cumplida' }) : '') + (g.auto ? ' <span class="small muted">' + esc(GOAL_AUTO[g.auto]) + '</span>' : '') + '</p></div>';
            }).join('') + '</div>' : empty(st.goalView === 'en-curso' ? 'No tenés metas en curso. Sumá la primera con “Nueva meta”.' : 'No hay metas para mostrar.'));
    };

    const RENDER = { 'mi-agenda': renderAgenda, estudios: renderStudies, trabajo: renderJobs, gastos: renderExpenses, vencimientos: renderDeadlines, metas: renderGoals };
    const MOD_OF = { agenda: 'mi-agenda', carrera: 'estudios', materia: 'estudios', actividad: 'estudios', trabajo: 'trabajo', gasto: 'gastos', vencimiento: 'vencimientos', meta: 'metas' };
    let current = '';

    // ---- Contadores del menú: agenda de hoy, entregas y exámenes de los próximos 7 días (o vencidos), entrevistas próximas
    const badges = () => {
        const t = today(); const week = addDays(t, 7); const w = W();
        const set = (id, n, title) => { const b = document.getElementById('n-' + id); if (b) { b.textContent = n || ''; b.title = n ? title : ''; } };
        const ag = w.agenda.filter((e) => e.done !== 'si' && e.date === t).length;
        const st7 = w.actividad.filter((a) => ACT_OPEN.includes(actStatus(a)) && a.date && a.date <= week).length;
        const jb = w.trabajo.filter((j) => JOB_OPEN.includes(j.status) && j.date && j.date >= t && j.date <= week).length;
        const dl = w.vencimiento.filter((v) => v.done !== 'si' && v.date && daysTo(v.date) <= noticeOf(v)).length;
        set('vencimientos', dl, dl + (dl === 1 ? ' vencimiento cerca o vencido' : ' vencimientos cerca o vencidos'));
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
        if (type === 'career') return '<label' + wide + '>' + label + '<select name="' + name + '"><option value="">Sin carrera</option>' + W().carrera.map((c) => '<option value="' + c.id + '"' + (String(c.id) === String(v) ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></label>';
        if (type === 'subject') return '<label' + wide + '>' + label + '<select name="' + name + '"><option value="">Sin materia</option>' + W().materia.map((s) => '<option value="' + s.id + '"' + (String(s.id) === String(v) ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></label>';
        if (type === 'text') return '<label' + wide + '>' + label + '<textarea name="' + name + '" rows="3" maxlength="' + o.max + '">' + esc(v) + '</textarea></label>';
        const input = type === 'line' ? 'text' : type;
        return '<label' + wide + '>' + label + '<input type="' + input + '" name="' + name + '" value="' + esc(v) + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.required ? ' required' : '') + (o.hint ? ' placeholder="' + esc(o.hint) + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + '></label>';
    };
    const open = (kind, rec, preset) => {
        const f = FORMS[kind];
        const r = rec || { id: 0, updated: '', ...(preset || {}) };
        editing = { kind, id: r.id || 0, updated: r.updated || '' };
        const d = dialog();
        d.innerHTML = '<form method="dialog" class="task-form ws-form"><div class="task-form-head"><strong>' + (r.id ? 'Editar ' : ['agenda', 'trabajo', 'gasto', 'vencimiento'].includes(kind) ? 'Nuevo ' : 'Nueva ') + f.title + '</strong>'
            + '<button type="button" class="task-icon-btn" data-ws-close aria-label="Cerrar">×</button></div>'
            + '<div class="task-form-body"><div class="task-form-grid">' + f.fields.map(fieldHtml(r)).join('') + '</div></div>'
            + '<div class="task-form-foot">' + (r.id ? '<button type="button" data-ws-delete>Eliminar</button>' : '<span></span>')
            + '<div class="row"><button type="button" data-ws-close>Cancelar</button><button type="submit" class="primary">Guardar</button></div></div></form>';
        if (kind === 'actividad') { // "Inscripta" solo para finales
            const k = d.querySelector('[name="kind"]'); const s = d.querySelector('[name="status"]'); const o = s.querySelector('option[value="inscripta"]');
            const sync = () => { const fin = k.value === 'final'; o.hidden = o.disabled = !fin; if (!fin && s.value === 'inscripta') s.value = 'pendiente'; };
            k.addEventListener('change', sync); sync();
        }
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
        const fold = e.target.closest('[data-ws-fold]');
        if (fold) { const id = Number(fold.dataset.wsFold); const on = !folded.has(id); if (on) folded.add(id); else folded.delete(id);
            fold.closest('tr').classList.toggle('is-open', on); fold.setAttribute('aria-expanded', on); return; }
        const set = e.target.closest('[data-ws-set]');
        if (set) { st[set.dataset.wsSet] = set.dataset.value; if (RENDER[current]) RENDER[current](); return; }
        const nw = e.target.closest('[data-ws-new]');
        if (nw) { const kind = nw.dataset.wsNew; open(kind, null, kind === 'actividad' && st.studySubject ? { subject: st.studySubject } : kind === 'materia' && st.studyCareer ? { carrera: st.studyCareer } : kind === 'gasto' ? { date: today(), ...(st.expCat ? { category: st.expCat } : {}) } : null); return; }
        if (e.target.closest('a[href]')) return; // los links de una materia se abren sin abrir la ficha
        const op = e.target.closest('[data-ws-open]');
        if (op) { const [kind, id] = op.dataset.wsOpen.split(':'); const rec = W()[kind].find((x) => x.id === Number(id)); if (rec) open(kind, rec); return; }
        if (e.target.closest('[data-ws-close]')) { close(); return; }
        if (e.target.closest('[data-ws-delete]') && editing) {
            if (!confirm('¿Eliminar este registro? No se puede deshacer.')) return;
            send({ action: 'delete', kind: editing.kind, id: editing.id }, 'Eliminado');
        }
    });
    document.addEventListener('keydown', (e) => {
        const op = e.key === 'Enter' && e.target.closest && !e.target.closest('button') && e.target.closest('tr[data-ws-open]');
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
            w.gasto.filter((g) => hit(g.concept, g.notes, EXP_CAT[g.category])).forEach((g) => out.push({ go: 'gastos|gasto:' + g.id, title: '💸 ' + g.concept, sub: 'Gasto' + (money(g.amount) !== null ? ' · ' + ars(money(g.amount)) : '') + (g.date ? ' · ' + fshort(g.date) : ''), scope: 'personal' }));
            w.vencimiento.filter((v) => hit(v.title, v.place, v.notes)).forEach((v) => out.push({ go: 'vencimientos|vencimiento:' + v.id, title: '⏰ ' + v.title, sub: 'Vencimiento' + (v.date ? ' · ' + fshort(v.date) : ''), scope: 'personal' }));
            w.meta.filter((g) => hit(g.title, g.term, g.notes)).forEach((g) => out.push({ go: 'metas|meta:' + g.id, title: '🎯 ' + g.title, sub: 'Meta' + (g.term ? ' · ' + g.term : ''), scope: 'personal' }));
            w.materia.filter((m) => hit(m.name, m.code, m.teacher, m.notes)).forEach((m) => out.push({ go: 'estudios|materia:' + m.id, title: '📚 ' + m.name, sub: 'Materia' + (m.term ? ' · ' + m.term : ''), scope: 'estudios' }));
            w.actividad.filter((a) => hit(a.title, a.notes, subjectName(a.subject))).forEach((a) => out.push({ go: 'estudios|actividad:' + a.id, title: '📝 ' + a.title, sub: (ACT_KIND[a.kind] || '') + (subjectName(a.subject) ? ' · ' + subjectName(a.subject) : '') + (a.date ? ' · ' + fshort(a.date) : ''), scope: 'estudios' }));
            w.trabajo.filter((j) => hit(j.title, j.company, j.contact, j.notes)).forEach((j) => out.push({ go: 'trabajo|trabajo:' + j.id, title: '💼 ' + j.title, sub: (JOB_KIND[j.kind] || '') + (j.company ? ' · ' + j.company : ''), scope: 'trabajo' }));
            return out;
        },
        badges,
        // Para el Dashboard: lo personal con fecha (agenda pendiente desde hoy, actividades y trabajo abiertos)
        upcoming: () => {
            const t = today(); const w = W(); const out = [];
            w.agenda.filter((e) => e.done !== 'si' && e.date && e.date >= t).forEach((e) => out.push({ section: 'Agenda', text: (AGENDA_KIND[e.kind] && e.kind !== 'evento' ? AGENDA_KIND[e.kind] + ': ' : '') + e.title + (e.place ? ' · ' + e.place : ''), date: e.date, time: e.time || '', scope: 'personal', go: 'mi-agenda', noPast: true }));
            w.vencimiento.filter((v) => v.done !== 'si' && v.date).forEach((v) => out.push({ section: 'Vencimientos', text: (DL_KIND[v.kind] && v.kind !== 'otro' ? DL_KIND[v.kind] + ': ' : '') + v.title, date: v.date, time: v.time || '', scope: 'personal', go: 'vencimientos' }));
            w.actividad.filter((a) => ACT_OPEN.includes(actStatus(a)) && a.date).forEach((a) => out.push({ section: 'Estudios', text: (ACT_KIND[a.kind] || '') + ': ' + a.title + (subjectName(a.subject) ? ' · ' + subjectName(a.subject) : ''), date: a.date, time: a.time || '', scope: 'estudios', go: 'estudios' }));
            w.trabajo.filter((j) => JOB_OPEN.includes(j.status) && j.date && j.kind !== 'empleo').forEach((j) => out.push({ section: 'Trabajo', text: (JOB_KIND[j.kind] || '') + ': ' + j.title + (j.company ? ' · ' + j.company : ''), date: j.date, time: j.time || '', scope: 'trabajo', go: 'trabajo' }));
            return out;
        },
        // Resumen para las tarjetas del Dashboard personal
        summary: () => {
            const t = today(); const week = addDays(t, 7); const w = W();
            return {
                agenda: w.agenda.filter((e) => e.done !== 'si' && e.date && e.date >= t && e.date <= week).length,
                materias: w.materia.filter((s) => ['inscripta', 'cursando'].includes(s.status)).length,
                entregas: w.actividad.filter((a) => ACT_OPEN.includes(actStatus(a)) && a.date && a.date <= week).length,
                trabajo: w.trabajo.filter((j) => JOB_OPEN.includes(j.status)).length,
            };
        },
    };
})();
