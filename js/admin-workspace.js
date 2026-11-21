// Espacio Personal de JNB Workspace: Agenda (#mi-agenda), Estudios (#estudios), Trabajo (#trabajo), Gastos (#gastos),
// Vencimientos (#vencimientos) y Metas (#metas).
// Los datos llegan con el resto del panel (data.workspace) y se guardan con POST /api/admin/workspace.
// Son datos personales: no van en la copia JNB (worker/core/backup-policy.js).
(() => {
    const panel = () => window.JNBPanel;
    const W = () => ({ agenda: [], carrera: [], materia: [], actividad: [], curso: [], trabajo: [], gasto: [], vencimiento: [], meta: [], salud: [], entreno: [], saludtipo: [], ...((panel().data() || {}).workspace || {}) });
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const today = () => (window.JNBHolidays ? window.JNBHolidays.now().date : new Date().toISOString().slice(0, 10));
    const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const WEEK_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const fdate = (iso) => (iso ? WEEK_LONG[new Date(iso + 'T12:00:00Z').getUTCDay()] + ' ' + Number(iso.slice(8)) + ' de ' + MONTHS[Number(iso.slice(5, 7)) - 1] : 'Sin fecha');
    const fshort = (iso) => (iso ? Number(iso.slice(8)) + '/' + Number(iso.slice(5, 7)) + '/' + iso.slice(2, 4) : 'Sin fecha');

    // ---- Opciones (las mismas claves que valida el servidor en worker/core/workspace.js)
    const AGENDA_KIND = { evento: 'Evento', turno: 'Turno', reunion: 'Reunión', recordatorio: 'Recordatorio', cumpleanos: 'Cumpleaños', otro: 'Otro' };
    // Para elegir en la Agenda: "Universidad" son las actividades de Estudios (TPs, parciales, finales…); "Otro" siempre al final
    const AGENDA_PICK = { evento: 'Evento', turno: 'Turno', reunion: 'Reunión', recordatorio: 'Recordatorio', cumpleanos: 'Cumpleaños', universidad: 'Universidad (TPs, exámenes, finales…)', otro: 'Otro' };
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
    const JOB_CONTRACT = { '': 'Sin indicar', indeterminado: 'Por tiempo indeterminado', 'plazo-fijo': 'Plazo fijo', temporada: 'De temporada', eventual: 'Eventual', pasantia: 'Pasantía', 'por-proyecto': 'Por proyecto o freelance', otro: 'Otra' };
    const JOB_REGIME = { '': 'Sin indicar', dependencia: 'Relación de dependencia (recibo de sueldo)', monotributo: 'Monotributo (factura)', 'responsable-inscripto': 'Responsable inscripta (factura)', informal: 'Sin registrar' };
    const EXP_CAT = { super: 'Supermercado', comida: 'Comida y delivery', transporte: 'Transporte', servicios: 'Servicios', alquiler: 'Alquiler', salud: 'Salud', estudio: 'Estudio', ocio: 'Salidas y ocio', ropa: 'Ropa', regalos: 'Regalos', impuestos: 'Impuestos', suscripcion: 'Suscripciones', otros: 'Otros' }; // "Otros" siempre al final
    const EXP_METHOD = { '': 'Sin indicar', efectivo: 'Efectivo', debito: 'Débito', credito: 'Crédito', transferencia: 'Transferencia', mercadopago: 'Mercado Pago' };
    const DL_KIND = { documento: 'Documento', turno: 'Turno', seguro: 'Seguro', impuesto: 'Impuesto', servicio: 'Servicio', suscripcion: 'Suscripción', cuota: 'Cuota', otro: 'Otro' };
    const DL_REPEAT = { '': 'Una sola vez', mensual: 'Todos los meses', anual: 'Todos los años' };
    const GOAL_AUTO = { '': 'Lo actualizo a mano', materias: 'Materias aprobadas (de Estudios)', promedio: 'Promedio (de Estudios)' };
    const COURSE_STATUS = { 'en-curso': 'En curso', finalizado: 'Finalizado', abandonado: 'Abandonado' };
    // Salud y entrenamiento
    const MED_UNIT = { mg: 'mg', '': 'Sin unidad', g: 'g', mcg: 'mcg', ml: 'ml', gotas: 'gotas', comprimido: 'comprimido', capsula: 'cápsula', UI: 'UI', puff: 'puff', sobre: 'sobre' };
    const doseText = (h) => (h.dose ? h.dose + (h.unit ? ' ' + (MED_UNIT[h.unit] || h.unit) + (['comprimido', 'capsula', 'sobre'].includes(h.unit) && !/^1([.,]0+)?$/.test(h.dose) ? 's' : '') : '') : '');
    // Tipos fijos de Salud ("Chequeo" se unió con Consulta); más los que agrega la usuaria (saludtipo), que van como "t:<id>"; "Otro" siempre al final
    const HEALTH_KIND = { consulta: 'Consulta', medicamento: 'Medicamento', estudio: 'Estudio o análisis', vacuna: 'Vacuna', otro: 'Otro' };
    const healthTypes = () => { const own = Object.fromEntries(W().saludtipo.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'es')).map((x) => ['t:' + x.id, x.name]));
        const { otro, ...base } = HEALTH_KIND; return { ...base, ...own, otro }; };
    const typeKey = (h) => (h.subtype && W().saludtipo.some((x) => String(x.id) === String(h.subtype)) ? 't:' + h.subtype : h.kind === 'chequeo' ? 'consulta' : h.kind);
    const typeLabel = (h) => healthTypes()[typeKey(h)] || 'Otro';
    // Dos niveles, iguales en el formulario y en el filtro: primero la actividad (Gimnasio, Natación, Running…) y adentro su tipo:
    // en el gimnasio, la zona (tren superior, inferior, core…); en natación, el estilo; en running, ciclismo y yoga, el tipo de entrenamiento.
    // En la base, "area" es la zona del gimnasio o la actividad misma (natacion, running…) y "style" el tipo.
    const SPORT = { gym: 'Gimnasio', natacion: 'Natación', running: 'Running', ciclismo: 'Ciclismo', caminata: 'Caminata', yoga: 'Yoga o pilates', otro: 'Otro deporte' };
    const GYM_ZONE = { superior: 'Tren superior', inferior: 'Tren inferior', core: 'Core', completo: 'Cuerpo completo', cardio: 'Cardio', movilidad: 'Movilidad y elongación' };
    const SUB = { natacion: { crol: 'Crol', pecho: 'Pecho', espalda: 'Espalda', mariposa: 'Mariposa', combinado: 'Combinado' },
        running: { trote: 'Trote', fondo: 'Fondo', pasadas: 'Pasadas o series', fartlek: 'Fartlek' },
        ciclismo: { ruta: 'Ruta', spinning: 'Spinning o bici fija', montana: 'Montaña' }, yoga: { yoga: 'Yoga', pilates: 'Pilates', stretching: 'Elongación' } };
    const SUB_LABEL = { natacion: 'Estilo', running: 'Tipo de entrenamiento', ciclismo: 'Tipo', yoga: 'Disciplina' };
    const TRAIN_AREA = { ...GYM_ZONE, ...Object.fromEntries(Object.entries(SPORT).filter(([k]) => k !== 'gym')) };
    const GYM = Object.keys(GYM_ZONE); const DIST = ['running', 'ciclismo', 'caminata'];
    const sportOf = (r) => (GYM.includes(r.area) ? 'gym' : r.area || 'gym');
    const subOf = (r) => (sportOf(r) === 'gym' ? GYM_ZONE[r.area] : (SUB[sportOf(r)] || {})[r.style] || '');
    const WEEK = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const EXERCISES = ['Press de banca', 'Press militar', 'Remo con barra', 'Remo con mancuerna', 'Dominadas', 'Jalón al pecho', 'Curl de bíceps', 'Tríceps en polea', 'Fondos', 'Flexiones', 'Vuelos laterales',
        'Sentadilla', 'Peso muerto', 'Peso muerto rumano', 'Estocadas', 'Prensa', 'Hip thrust', 'Sillón de cuádriceps', 'Camilla de femorales', 'Gemelos', 'Abductores',
        'Plancha', 'Plancha lateral', 'Abdominales', 'Crunch en polea', 'Russian twist', 'Elevación de piernas', 'Rueda abdominal', 'Cinta', 'Bicicleta fija', 'Elíptica', 'Soga', 'Escaladora', 'HIIT'];
    const range = (a, b, step) => { const out = []; for (let x = a; x <= b + 1e-9; x += step) out.push(String(Math.round(x * 10) / 10)); return out; };
    const KG = range(0.5, 10, 0.5).concat(range(12.5, 200, 2.5)).map((x) => x.replace('.', ','));
    // Sin mayúsculas, sin acentos y sin espacios de más: "Cardiólogo", "cardiologo" y "CARDIOLOGO " son el mismo
    const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const variants = (list) => { const g = {}; list.filter((x) => norm(x)).forEach((x) => { const k = norm(x); (g[k] = g[k] || []).push(x.trim()); });
        return Object.fromEntries(Object.entries(g).map(([k, v]) => { const best = v.find((x) => /[^\x00-\x7f]/.test(x)) || v[0]; return [k, best.charAt(0).toUpperCase() + best.slice(1)]; })
            .sort((a, b) => a[1].localeCompare(b[1], 'es'))); };
    const GOAL_STATUS = { 'en-curso': 'En curso', cumplida: 'Cumplida', abandonada: 'Abandonada' };
    const subjectName = (id) => { const s = W().materia.find((x) => String(x.id) === String(id)); return s ? s.name : ''; };

    // ---- Formularios: [campo, etiqueta, tipo, opciones]
    const FORMS = {
        agenda: { title: 'evento', fields: [
            ['title', 'Qué', 'line', { required: true, max: 160, wide: true }], ['kind', 'Tipo', 'select', AGENDA_PICK], ['date', 'Fecha', 'date'],
            // Para los cumpleaños no hacen falta hora, lugar ni estado (se repiten todos los años)
            ['time', 'Hora de inicio', 'time', { notBday: true }], ['end', 'Hora de fin', 'time', { notBday: true }], ['place', 'Lugar', 'line', { max: 160, notBday: true }],
            ['done', 'Estado', 'select', { no: 'Pendiente', si: 'Hecho', notBday: true }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        carrera: { title: 'carrera', fields: [
            ['name', 'Carrera', 'line', { required: true, max: 160, wide: true, hint: 'Ingeniería en Sistemas' }], ['institution', 'Universidad o institución', 'line', { max: 160 }],
            ['status', 'Estado', 'select', CAREER_STATUS], ['total', 'Materias del plan', 'line', { max: 4, hint: 'Ej.: 36', mode: 'numeric' }],
            ['promo', 'Nota para promocionar', 'line', { max: 5, hint: '7', mode: 'decimal' }], ['aprueba', 'Nota para aprobar', 'line', { max: 5, hint: '4', mode: 'decimal' }],
            ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        materia: { title: 'materia', fields: [
            ['name', 'Materia', 'line', { required: true, max: 160, wide: true }], ['carrera', 'Carrera', 'career'],
            ['status', 'Estado', 'select', SUBJECT_STATUS], ['term', 'Cursada', 'term'],
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
        // Los campos con job: true se ven solo cuando el tipo es "Empleo"
        curso: { title: 'curso', fields: [
            ['name', 'Curso', 'line', { required: true, max: 160, wide: true, hint: 'Diseño UX/UI' }], ['institution', 'Dónde lo hiciste', 'line', { max: 160, hint: 'Coderhouse, Udemy, Google…' }],
            ['status', 'Estado', 'select', COURSE_STATUS], ['start', 'Desde', 'date'], ['end', 'Hasta', 'date'],
            ['hours', 'Duración o carga horaria', 'line', { max: 20, hint: '40 h' }], ['certificate', 'Link del certificado', 'url', { hint: 'https://…' }],
            ['url', 'Link del curso', 'url', { hint: 'https://…' }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        // Salud: los campos con areas se ven según el tipo (switch: 'kind')
        salud: { title: 'registro', switch: 'kind', fields: [
            ['kind', 'Tipo', 'htype'], ['title', 'Qué', 'line', { required: true, max: 160, wide: true, hint: 'Control anual, Enalapril 10 mg…' }],
            ['specialty', 'Especialidad', 'line', { max: 80, hint: 'Cardiólogo, clínica médica…', areas: ['consulta', 'estudio', 'vacuna', 'otro'] }], ['doctor', 'Profesional', 'line', { max: 120, hint: 'Dra. Pérez', areas: ['consulta', 'estudio', 'vacuna', 'otro'] }],
            ['dose', 'Dosis', 'line', { max: 20, hint: '2,5', mode: 'decimal', areas: ['medicamento'] }], ['unit', 'Unidad', 'select', { ...MED_UNIT, areas: ['medicamento'] }],
            ['hours', 'A qué hora', 'line', { max: 120, hint: '08:00, 20:00', areas: ['medicamento'] }], ['remind', 'Recordatorio', 'select', { no: 'Sin recordatorio', si: 'Mostrar las tomas del día en el Dashboard', areas: ['medicamento'] }],
            ['course', 'Tratamiento', 'select', { cronico: 'Crónico (todos los días)', temporal: 'Por un tiempo (antibiótico…)', areas: ['medicamento'] }],
            ['start', 'Desde', 'date', { areas: ['medicamento'], course: true }], ['end', 'Hasta', 'date', { areas: ['medicamento'], course: true }],
            ['status', 'Estado', 'select', { activo: 'Lo estoy tomando', finalizado: 'Ya no lo tomo', areas: ['medicamento'] }],
            ['date', 'Fecha', 'date', { areas: ['consulta', 'estudio', 'vacuna', 'otro'] }], ['time', 'Hora', 'time', { areas: ['consulta', 'estudio', 'vacuna', 'otro'] }],
            ['place', 'Lugar', 'line', { max: 160, areas: ['consulta', 'estudio', 'vacuna', 'otro'] }],
            ['result', 'Resultado o indicaciones', 'text', { max: 2000, areas: ['consulta', 'estudio', 'vacuna', 'otro'] }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        saludtipo: { title: 'tipo de registro', fields: [['name', 'Nombre del tipo', 'line', { required: true, max: 60, wide: true, hint: 'Kinesiología, Odontología…' }]] },
        // Entrenamiento: según la actividad, series, repeticiones y kilos (gimnasio), estilo y metros (natación), kilómetros y minutos
        entreno: { title: 'ejercicio', switch: '_sport', fields: [
            ['_sport', 'Actividad', 'select', SPORT], ['area', 'Zona', 'select', { ...GYM_ZONE, areas: ['gym'] }],
            ['style', 'Tipo', 'select', { '': 'Sin indicar', areas: Object.keys(SUB) }], ['days', 'Días', 'days'],
            ['exercise', 'Ejercicio', 'line', { max: 120, wide: true, hint: 'Sentadilla', list: EXERCISES, areas: ['gym', 'otro'] }],
            ['sets', 'Series', 'pick', { values: range(1, 10, 1), empty: '—', areas: ['gym'] }], ['reps', 'Repeticiones', 'pick', { values: range(1, 50, 1), empty: '—', areas: ['gym'] }],
            ['kg', 'Kilos', 'pick', { values: KG, empty: 'Sin peso', areas: ['gym'] }],
            ['meters', 'Metros', 'pick', { values: range(25, 5000, 25), empty: '—', areas: ['natacion'] }], ['km', 'Kilómetros', 'line', { max: 8, mode: 'decimal', hint: '5', areas: DIST }],
            ['minutes', 'Duración de la sesión (minutos)', 'pick', { values: range(5, 240, 5), empty: '—', areas: Object.keys(SPORT) }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        trabajo: { title: 'registro', fields: [
            ['kind', 'Tipo', 'select', JOB_KIND], ['title', 'Puesto, búsqueda o curso', 'line', { required: true, max: 160 }],
            ['company', 'Empresa o institución', 'line', { max: 160 }], ['status', 'Estado', 'select', JOB_STATUS],
            ['date', 'Fecha', 'date'], ['time', 'Hora', 'time', { nojob: true }], ['end', 'Fecha de fin', 'date', { job: true }],
            ['days', 'Días', 'line', { max: 120, job: true, hint: 'Sábados, domingos y feriados' }], ['hours', 'Horario', 'line', { max: 80, job: true, hint: '7 a 19 h' }],
            ['address', 'Dirección', 'line', { max: 200, job: true, wide: true }],
            ['contract', 'Contratación', 'select', { ...JOB_CONTRACT, job: true }], ['regime', 'Cómo cobrás', 'select', { ...JOB_REGIME, job: true }],
            ['functions', 'Funciones y tareas (como en un CV)', 'text', { max: 3000, job: true, hint: 'Una por línea: atención al público, caja, reposición…' }],
            ['contact', 'Contacto', 'line', { max: 200 }], ['url', 'Link', 'url', { hint: 'https://…' }],
            ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        gasto: { title: 'gasto', fields: [
            ['concept', 'Concepto', 'line', { required: true, max: 160, wide: true, hint: 'Compra del super' }], ['amount', 'Monto en pesos', 'line', { max: 20, mode: 'decimal', hint: '12500' }],
            ['date', 'Fecha', 'date'], ['category', 'Categoría', 'select', EXP_CAT], ['method', 'Medio de pago', 'select', EXP_METHOD], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        vencimiento: { title: 'vencimiento', fields: [
            ['title', 'Qué vence', 'line', { required: true, max: 160, wide: true, hint: 'Renovar el DNI' }], ['kind', 'Tipo', 'select', DL_KIND],
            ['date', 'Fecha', 'date'], ['repeat', 'Se repite', 'select', DL_REPEAT], ['time', 'Hora', 'time'], ['notice', 'Avisarme por mail (días antes)', 'line', { max: 3, mode: 'numeric', hint: '7' }],
            ['amount', 'Monto a pagar (en pesos)', 'line', { max: 20, mode: 'decimal', hint: 'Vacío si no se paga' }], ['category', 'Categoría en Gastos', 'select', { servicios: EXP_CAT.servicios, ...EXP_CAT }],
            ['place', 'Lugar', 'line', { max: 160 }], ['done', 'Estado', 'select', { no: 'Pendiente', si: 'Pagado o hecho' }], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
        meta: { title: 'meta', fields: [
            ['title', 'Meta', 'line', { required: true, max: 160, wide: true, hint: 'Aprobar 4 materias' }], ['term', 'Período', 'line', { max: 80, hint: '2027 o 1er cuatrimestre 2027' }],
            ['deadline', 'Fecha límite', 'date'], ['auto', 'Avance', 'select', GOAL_AUTO], ['target', 'Objetivo (número)', 'line', { max: 10, mode: 'decimal', hint: '4' }],
            ['progress', 'Avance actual (si es a mano)', 'line', { max: 10, mode: 'decimal' }], ['status', 'Estado', 'select', GOAL_STATUS], ['notes', 'Notas', 'text', { max: 2000 }],
        ] },
    };

    // ---- Estado de cada vista
    const st = { agendaView: 'proximos', agendaKind: '', agMonth: '', agYear: '', bdayMonth: null, studyTab: 'materias', studyGroup: 'todos', subjView: 'cursando', studyCareer: '', studyYear: '', studyHalf: '', corrYear: '', corrHalf: '', studySubject: '', studyView: 'abiertas', jobKind: '', jobView: 'abiertos', expMonth: null, expCat: '', expSort: 'asc', dlView: 'proximos', dlKind: '', goalView: 'en-curso', hKind: '', hSpec: '', hDoc: '', trSport: '', trSub: '', trDay: '', trMonth: '', trView: 'todas' };
    const root = (mod) => document.getElementById('m-' + mod);
    const head = (title, text, buttons) => '<div class="ws-head"><div><h2>' + title + '</h2><p class="small muted">' + text + '</p></div><div class="row">' + buttons + '</div></div>';
    const seg = (key, value, options) => '<nav aria-label="Vista">' + Object.entries(options).map(([v, l]) => '<button type="button" data-ws-set="' + key + '" data-value="' + v + '" aria-pressed="' + (value === v) + '">' + l + '</button>').join('') + '</nav>';
    const select = (key, value, options, label) => '<label><span class="sr-only">' + label + '</span><select data-ws-select="' + key + '">' + Object.entries(options).sort((a, b) => (a[0] === '' ? -1 : b[0] === '' ? 1 : 0)).map(([v, l]) => '<option value="' + esc(v) + '"' + (value === v ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></label>';
    const empty = (text) => '<p class="empty">' + text + '</p>';
    const rowAttrs = (kind, r, extra) => ' tabindex="0" data-ws-open="' + kind + ':' + r.id + '"' + (extra ? ' class="' + extra + '"' : '');

    // Caja compacta que se despliega al tocarla (Agenda, Gastos y Vencimientos): arriba lo principal, adentro el detalle y el botón para editar
    const notesHtml = (t) => (t ? '<p class="small ws-ev-notes">' + esc(t).replace(/\n/g, '<br>') + '</p>' : '');
    const evBox = (cls, top, title, sub, body, openRef, btn, extra, action) => '<details class="ws-ev' + (cls ? ' ' + cls : '') + '"><summary><span class="ws-ev-top">' + top + '</span>'
        + '<strong>' + title + '</strong><span class="small muted">' + (sub || '&nbsp;') + '</span></summary><div class="ws-ev-body">' + body
        + '<div class="ws-ev-actions">' + (action || '') + '<button type="button" data-ws-open="' + openRef + '"' + (extra || '') + '>' + (btn || 'Editar') + '</button></div></div></details>';
    const evGrid = (html) => '<div class="ws-evs">' + html + '</div>';
    // Una sola caja abierta a la vez: al abrir otra, se cierra la anterior
    document.addEventListener('toggle', (e) => { const d = e.target; if (!d.matches || !d.matches('details.ws-ev') || !d.open) return;
        document.querySelectorAll('details.ws-ev[open]').forEach((x) => { if (x !== d) x.open = false; }); }, true);

    // ---- Agenda. Los cumpleaños guardan la fecha de nacimiento y se muestran en el próximo cumpleaños con la edad que cumple
    const isBday = (e) => e.kind === 'cumpleanos' && /^\d{4}-\d{2}-\d{2}$/.test(e.date || '');
    const agendaItems = () => W().agenda.map((e) => (isBday(e) ? { ...e, birth: e.date, date: nextDue(e.date, 'anual', today()), done: 'no', time: '', end: '' } : e))
        .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '').localeCompare(b.time || '') || a.id - b.id);
    const ageOf = (e) => (e.birth ? Number(e.date.slice(0, 4)) - Number(e.birth.slice(0, 4)) : 0); // la edad que cumple en el próximo cumpleaños
    const ageNow = (e) => ageOf(e) - (e.date === today() ? 0 : 1); // la que tiene hoy: hasta el día anterior al cumpleaños, la de antes
    const renderAgenda = () => {
        const t = today();
        // Cumpleaños: cajas compactas una al lado de la otra (quién, cuándo y la edad que cumple), fuera de las tablas por día
        const k = st.agendaKind; // filtro por tipo ('' = todos; 'universidad' = las actividades con fecha de Estudios)
        const bdays = st.agendaView === 'pasados' || (k && k !== 'cumpleanos') ? [] : agendaItems().filter((e) => e.birth);
        const bdayBox = (e) => { const n = daysTo(e.date);
            return '<button type="button" class="ws-bday' + (n === 0 ? ' is-today' : '') + '" data-ws-open="agenda:' + e.id + '"><span class="ws-bday-i" aria-hidden="true">🎂</span>'
                + '<strong>' + esc(e.title) + '</strong><span class="small ws-bday-when">' + (n === 0 ? '¡Es hoy!' : n === 1 ? 'Mañana' : Number(e.date.slice(8)) + ' de ' + MONTHS[Number(e.date.slice(5, 7)) - 1]) + '</span>'
                + '<span class="small muted">' + (ageOf(e) > 0 ? (n === 0 ? 'Cumple ' + ageOf(e) : ageNow(e) + (ageNow(e) === 1 ? ' año' : ' años')) : 'Cumpleaños') + (n > 1 && n <= 30 ? ' · faltan ' + n + ' días' : '') + '</span></button>'; };
        // Ordenados como un calendario (enero a diciembre, por día), con un título por mes y una lista para ver un solo mes.
        // Los meses van como 'm01'…'m12': con números solos, JavaScript pone 10, 11 y 12 primero
        const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
        const byMonth = {}; bdays.slice().sort((a, b) => a.birth.slice(5).localeCompare(b.birth.slice(5)) || String(a.title).localeCompare(String(b.title), 'es'))
            .forEach((e) => { const m = 'm' + e.birth.slice(5, 7); (byMonth[m] = byMonth[m] || []).push(e); });
        // Calendario del año: los doce meses de enero a diciembre (también los que no tienen cumpleaños); el mes actual resaltado.
        // Con la lista se ve un solo mes, con las cajas grandes de cada cumpleaños
        const nowM = 'm' + t.slice(5, 7);
        const bdayRow = (e) => { const n = daysTo(e.date);
            return '<button type="button" class="ws-cal-row' + (n === 0 ? ' is-today' : '') + '" data-ws-open="agenda:' + e.id + '"><span class="ws-cal-day">' + Number(e.birth.slice(8)) + '</span>'
                + '<span class="ws-cal-who">' + esc(e.title) + '</span><span class="small muted">' + (n === 0 ? '🎂 ¡Hoy!' : ageOf(e) > 0 ? ageNow(e) + (ageNow(e) === 1 ? ' año' : ' años') : '') + '</span></button>'; };
        const year = MONTHS.map((x, i) => 'm' + String(i + 1).padStart(2, '0')).map((m) => '<div class="ws-cal-month' + (m === nowM ? ' is-now' : '') + '"><p class="ws-cal-title">' + cap(MONTHS[Number(m.slice(1)) - 1])
            + (byMonth[m] ? ' <span class="small muted">' + byMonth[m].length + '</span>' : '') + '</p>' + (byMonth[m] ? byMonth[m].map(bdayRow).join('') : '<p class="small muted ws-cal-none">Sin cumpleaños</p>') + '</div>').join('');
        // Un mes como calendario (lunes a domingo, con los cumpleaños en su día); por defecto, el mes actual. "Todo el año" muestra los doce meses
        if (st.bdayMonth === null) st.bdayMonth = nowM;
        const monthCal = (m) => { const mo = Number(m.slice(1)); const y = Number(t.slice(0, 4)) + (mo < Number(t.slice(5, 7)) ? 1 : 0); // el próximo
            const lead = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7; const nd = new Date(Date.UTC(y, mo, 0)).getUTCDate(); const l = byMonth[m] || [];
            return '<div class="ws-cal">' + ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((x) => '<span class="ws-cal-h">' + x + '</span>').join('') + '<span class="ws-cal-d is-empty"></span>'.repeat(lead)
                + [...Array(nd)].map((_, i) => { const iso = y + '-' + String(mo).padStart(2, '0') + '-' + String(i + 1).padStart(2, '0'); const who = l.filter((e) => Number(e.birth.slice(8)) === i + 1);
                    return '<span class="ws-cal-d' + (who.length ? ' has-bday' : '') + (iso === t ? ' is-today' : '') + '"><span class="ws-cal-n">' + (i + 1) + '</span>'
                        + (who.length ? '<span class="ws-cal-c">🎂' + (who.length > 1 ? who.length : '') + '</span>' + who.map((e) => '<span class="ws-cal-i">🎂 ' + esc(e.title) + '</span>').join('')
                            + '<button type="button" class="ws-cal-more" data-ws-bday="' + who.map((e) => e.id).join(',') + '" aria-label="Ver los cumpleaños del ' + (i + 1) + '">Ver más</button>' : '') + '</span>'; }).join('') + '</div>'
                + (l.length ? '<div class="ws-bdays">' + l.map(bdayBox).join('') + '</div>' : empty('No hay cumpleaños en ' + MONTHS[mo - 1] + '.')); };
        const bdayHtml = bdays.length ? '<p class="ws-day">Cumpleaños</p><div class="ws-filters">' + select('bdayMonth', st.bdayMonth, { ...Object.fromEntries(MONTHS.map((x, i) => { const key = 'm' + String(i + 1).padStart(2, '0'); return [key, cap(x) + (byMonth[key] ? ' (' + byMonth[key].length + ')' : '')]; })), '': 'Todo el año' }, 'Mes del cumpleaños') + '</div>'
            + (!st.bdayMonth ? '<div class="ws-year">' + year + '</div>' : monthCal(st.bdayMonth)) : '';
        // Exámenes de Estudios (con fecha) en el calendario; se abren y se editan en su ficha de actividad
        const exams = W().actividad.filter((a) => a.date)
            .map((a) => ({ id: a.id, exam: a, kind: 'universidad', title: a.title, subject: subjectName(a.subject), date: a.date, time: a.time || '', notes: a.notes || '', done: ACT_OPEN.includes(actStatus(a)) ? 'no' : 'si' }));
        let list = agendaItems().filter((e) => !e.birth).concat(exams).filter((e) => !k || e.kind === k)
            .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '').localeCompare(b.time || '') || a.id - b.id);
        if (st.agendaView === 'proximos') list = list.filter((e) => e.done !== 'si' && (!e.date || e.date >= t));
        if (st.agendaView === 'pasados') list = list.filter((e) => e.date && e.date < t).reverse();
        // Filtros de mes y año; los eventos van agrupados por mes, como un calendario
        const years = [...new Set(list.map((e) => (e.date || '').slice(0, 4)).filter(Boolean).concat(t.slice(0, 4)))].sort();
        if (st.agYear && !years.includes(st.agYear)) st.agYear = '';
        list = list.filter((e) => (!st.agYear || (e.date || '').slice(0, 4) === st.agYear) && (!st.agMonth || 'm' + (e.date || '').slice(5, 7) === st.agMonth));
        const capM = (x) => x.charAt(0).toUpperCase() + x.slice(1);
        const days = [];
        list.forEach((e) => { const k = (e.date || '').slice(0, 7); const g = days.find((d) => d.k === k); if (g) g.items.push(e); else days.push({ k, items: [e] }); });
        if (st.agendaView === 'proximos') days.sort((a, b) => (a.k === '' ? 1 : b.k === '' ? -1 : 0));
        const WD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const when = (e) => (e.date ? (e.date === t ? 'Hoy' : WD[new Date(e.date + 'T12:00:00Z').getUTCDay()] + ' ' + Number(e.date.slice(8)) + '/' + Number(e.date.slice(5, 7))) : 'Sin fecha')
            + (e.time ? ' · ' + esc(e.time) + (e.end ? '–' + esc(e.end) : '') + ' h' : '');
        // Cada evento es una caja compacta (hora, qué y tipo); al tocarla se despliega con el resto: estado, lugar, notas y el botón para editar
        const boxes = (items) => '<div class="ws-evs">' + items.map((e) => {
            const type = e.exam ? 'Universidad · ' + ACT_KIND[e.exam.kind] : AGENDA_KIND[e.kind] || e.kind;
            const state = e.exam ? tag(actStatus(e.exam), ACT_STATUS) : e.done === 'si' ? tag('aprobado', { aprobado: 'Hecho' }) : tag('pendiente', { pendiente: 'Pendiente' });
            return '<details class="ws-ev' + (e.exam ? ' is-exam' : '') + (e.done === 'si' ? ' ws-done' : e.date === t ? ' is-soon' : '') + '"><summary><span class="ws-ev-top"><span class="small ws-ev-time">' + when(e) + '</span></span>'
                + '<strong>' + esc(e.title) + '</strong><span class="small muted">' + esc(type) + '</span></summary><div class="ws-ev-body">' + state
                + (e.exam ? '<span class="small">📚 ' + esc(e.subject || 'Estudios') + '</span>' : '') + (e.place ? '<span class="small">📍 ' + esc(e.place) + '</span>' : '')
                + (e.notes ? '<p class="small ws-ev-notes">' + esc(e.notes).replace(/\n/g, '<br>') + '</p>' : '')
                + '<div class="ws-ev-actions">' + (!e.exam && e.done !== 'si' && e.date && e.date <= t ? '<button type="button" class="primary" data-ws-take="agenda:' + e.id + '">✓ Hecho</button>' : '')
                + '<button type="button" data-ws-open="' + (e.exam ? 'actividad' : 'agenda') + ':' + e.id + '">' + (e.exam ? 'Abrir en Estudios' : 'Editar') + '</button></div></div></details>'; }).join('') + '</div>';
        const table = (items) => '<table class="ws-table ws-agenda"><thead><tr><th>Hora</th><th>Qué</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>'
            + items.map((e) => '<tr' + rowAttrs(e.exam ? 'actividad' : 'agenda', e, e.done === 'si' ? 'ws-done' : '') + '><td class="ws-nowrap" data-label="Hora">' + (e.time ? esc(e.time) + (e.end ? '–' + esc(e.end) : '') + ' h' : 'Todo el día') + '</td>'
                + '<td data-label="Qué"><strong>' + (e.birth ? '🎂 ' : '') + esc(e.title) + '</strong>' + (e.exam ? '<br><span class="small muted">📚 ' + esc(e.subject || 'Estudios') + '</span>' : '') + (e.place && !e.birth ? '<br><span class="small muted">📍 ' + esc(e.place) + '</span>' : '') + (e.birth ? '<br><span class="small muted">Nació el ' + Number(e.birth.slice(8)) + '/' + Number(e.birth.slice(5, 7)) + '/' + e.birth.slice(0, 4) + '</span>' : '') + '</td>'
                + '<td data-label="Tipo">' + esc(e.exam ? 'Universidad · ' + ACT_KIND[e.exam.kind] : AGENDA_KIND[e.kind] || e.kind) + '</td><td data-label="Estado">' + (e.exam ? tag(actStatus(e.exam), ACT_STATUS) : e.birth ? (ageOf(e) > 0 ? tag('en-curso', { 'en-curso': (e.date === t ? 'Hoy cumple ' : 'Cumple ') + ageOf(e) }) : tag('en-curso', { 'en-curso': e.date === t ? '¡Hoy!' : 'Cumpleaños' })) : e.done === 'si' ? tag('aprobado', { aprobado: 'Hecho' }) : tag('pendiente', { pendiente: 'Pendiente' })) + '</td></tr>').join('')
            + '</tbody></table>';
        root('mi-agenda').innerHTML = head('Agenda', 'Turnos, reuniones, eventos, recordatorios, cumpleaños (se repiten todos los años) y las fechas de la universidad, que se cargan y se ven también en Estudios.', '<button type="button" class="primary" data-ws-new="agenda">+ Nuevo evento</button>')
            + '<div class="ws-filters">' + seg('agendaView', st.agendaView, { proximos: 'Próximos', pasados: 'Pasados', todos: 'Todos' })
                + select('agendaKind', k, { '': 'Todos los tipos', ...AGENDA_PICK, universidad: 'Universidad' }, 'Tipo')
                + select('agMonth', st.agMonth, { '': 'Todos los meses', ...Object.fromEntries(MONTHS.map((x, i) => ['m' + String(i + 1).padStart(2, '0'), capM(x)])) }, 'Mes')
                + select('agYear', st.agYear, Object.fromEntries([['', 'Todos los años']].concat(years.map((y) => [y, y]))), 'Año') + '</div>'
            + bdayHtml
            + (days.length ? days.map((d) => '<p class="ws-day' + (d.k === t.slice(0, 7) ? ' is-today' : '') + '">' + (d.k ? capM(MONTHS[Number(d.k.slice(5)) - 1]) + ' ' + d.k.slice(0, 4) : 'Sin fecha') + '</p>' + boxes(d.items)).join('')
                : bdays.length ? '' : empty(st.agMonth || st.agYear ? 'No hay eventos en ese período.' : k ? 'No hay ' + (k === 'universidad' ? 'fechas de la universidad' : 'eventos de este tipo') + (st.agendaView === 'proximos' ? ' próximos.' : st.agendaView === 'pasados' ? ' pasados.' : '.') : st.agendaView === 'proximos' ? 'No tenés eventos próximos. Agregá el primero con “Nuevo evento”.' : 'No hay eventos para mostrar.'));
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
    // Correlativas (de cursar o de final) que todavía no están aprobadas: con alguna pendiente la materia no promociona
    const owedFinals = (s, depth) => (depth > 6 ? [] : [...new Set(codesOf(s.corrCursar).concat(codesOf(s.corrRendir)))]
        .map((c) => ({ c, m: byCode(s, c) })).filter((o) => !o.m || !study(o.m, depth + 1).approved)
        .map((o) => (o.m ? (o.m.code ? o.m.code + ' ' : '') + o.m.name : o.c)));
    const study = (s, depth = 0) => {
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
        let owed = [];
        if (final === null && given.length === 2) {
            const min = Math.min(...given);
            owed = min >= L.promo && tpOk ? owedFinals(s, depth) : [];
            if (min >= L.promo && tpOk && owed.length) { cond = 'Final: debe correlativas'; tone = 'warn'; } // primero tiene que aprobar el final de la correlativa
            else if (min >= L.promo && tpOk) { cond = 'Promociona'; tone = 'ok'; }
            else if (min >= L.aprueba && tpOk) { cond = 'Regular: rinde final'; tone = 'warn'; }
            else { cond = !tpOk ? 'TP desaprobado' : recup !== null ? 'Recursa' : 'Tiene que recuperar'; tone = 'bad'; } // con el recuperatorio ya rendido y desaprobado, se recursa
        }
        const approved = s.status === 'aprobada' || (s.status === 'promocionada' && !owed.length) || (final !== null && final >= L.aprueba);
        const grade = final !== null ? final : (s.status === 'promocionada' || cond === 'Promociona' ? cursada : null);
        return { parts, given, cursada, tps, tpAvg: avg(tpNums), tpOk, final, cond, tone, approved, grade, owed };
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
        const regular = info.filter((i) => !i.x.approved && (i.s.status === 'regular' || i.x.cond === 'Regular: rinde final' || i.x.cond === 'Final: debe correlativas'));
        const enrolled = subjects.reduce((n, s) => n + finalsOf(s).filter((a) => a.status === 'inscripta').length, 0);
        const c = cid ? w.carrera.find((x) => String(x.id) === String(cid)) : null;
        const total = num(c && c.total);
        return { subjects, passed: passed.length, total, left: total !== null ? Math.max(total - passed.length, 0) : null,
            avg: avg(grades), avgAll: avg(grades.concat(failedFinals)), finalsTaken, finalsLeft: regular.length, enrolled,
            current: subjects.filter((s) => ['inscripta', 'cursando'].includes(s.status)).length,
            pending: info.filter((i) => i.s.status === 'pendiente' && !i.x.approved).length }; // cargadas como pendientes: todavía no las cursó
    };
    // Año y cuatrimestre se leen del texto de la cursada ("1er cuatrimestre 2026", "2.º cuatrimestre 2025", "Segundo cuatrimestre 2026")
    const termYear = (s) => { const m = String(s.term || '').match(/\b(19|20)\d{2}\b/); return m ? m[0] : ''; };
    const termHalf = (s) => { const t = String(s.term || '').toLowerCase();
        if (/\b(1|primer|primero)\s*(\.?\s*(er|ero|ro|º|°|o))?\s*(cuatri|c\b)/.test(t)) return '1'; // también "1er C 2026" y "1C 2026"
        if (/\b(2|segundo)\s*(\.?\s*(do|º|°|o))?\s*(cuatri|c\b)/.test(t)) return '2';
        if (/\banual\b/.test(t)) return 'A';
        return ''; };
    const folded = new Set(); // materias abiertas en el celular
    // Cursada corta: "1C 2026", "2C 2026", "Anual 2026" o el año solo
    const termLabel = (s) => { const y = termYear(s); const h = termHalf(s); return y ? (h === 'A' ? 'Anual ' : h ? h + 'C ' : '') + y : ''; };
    const termText = (half, year) => (half === '1' ? '1er cuatrimestre ' : half === '2' ? '2do cuatrimestre ' : half === 'A' ? 'Anual ' : '') + year;
    // Carrera abreviada con sus iniciales ("Tecnicatura universitaria web" → TUW); el nombre completo queda al pasar el mouse
    // Abreviatura con iniciales ("Programación web I" → PW I); el número o romano del final se conserva
    const initials = (name) => { const w = String(name || '').split(/\s+/).filter((x) => x && !/^(a|al|de|del|en|la|las|el|los|y|e|para|con)$/i.test(x));
        const num = w.length > 1 && /^([ivx]+|\d+)$/i.test(w[w.length - 1]) ? ' ' + w.pop().toUpperCase() : '';
        return (w.length > 1 ? w.map((x) => x[0].toUpperCase()).join('') : (String(w[0] || name || '').length <= 8 ? String(w[0] || name || '') : String(w[0] || name || '').slice(0, 4) + '.')) + num; }; // una sola palabra: entera si es corta
    const abbr = (name) => '<abbr title="' + esc(name) + '">' + esc(initials(name)) + '</abbr>';
    const careerShort = (c) => abbr(c.name);
    const inTerm = (period) => { const y = termYear(period); const h = termHalf(period); return (s) => (!y || termYear(s) === y) && (!h || termHalf(s) === h); };

    // Correlativas: códigos separados por coma. Para cursar alcanza con tenerlas regularizadas; para rendir el final, aprobadas
    const codeKey = (v) => String(v || '').trim().toUpperCase();
    const codesOf = (v) => String(v || '').split(/[,;]+/).map(codeKey).filter(Boolean);
    const byCode = (s, c) => { const all = W().materia.filter((x) => codeKey(x.code) === c); return all.find((x) => String(x.carrera || '') === String(s.carrera || '')) || all[0] || null; };
    const isRegular = (s) => { const x = study(s); return x.approved || s.status === 'regular' || x.cond === 'Regular: rinde final' || x.cond === 'Final: debe correlativas' || x.cond === 'Promociona'; };
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
    // Grilla de cuadros sin cuadros huérfanos: 4 o 3 columnas según cuántos haya (fila final completa o de 2 o más)
    const kpiGrid = (items) => { const l = items.filter(Boolean); const n = l.length;
        const cols = n <= 4 ? n : [4, 3].find((c) => n % c === 0) || [4, 3].find((c) => n % c >= 2) || 4;
        return '<div class="ws-kpis ws-kpis-fit" style="--cols:' + cols + '">' + l.join('') + '</div>'; };
    const kpi = (n, label) => '<div class="ws-kpi"><span class="ws-kpi-n">' + n + '</span><span class="ws-kpi-l">' + label + '</span></div>';

    const renderStudies = () => {
        const t = today();
        const w = W();
        const tabs = seg('studyTab', st.studyTab, { materias: 'Materias', actividades: 'TPs, exámenes y finales', horario: 'Horario', correlativas: 'Correlativas', carreras: 'Carreras y cursos' });
        const careers = { '': 'Todas las carreras', ...Object.fromEntries(w.carrera.map((c) => [String(c.id), c.name])) };
        if (w.carrera.length < 2) st.studyCareer = ''; // con una sola carrera no hay filtro
        let body;
        const coursesHtml = () => {
            // Cursos: una caja por curso (dónde, desde y hasta, duración) con el link del certificado; los en curso primero
            const span = (c) => { if (!c.start) return c.end ? 'Hasta el ' + fshort(c.end) : '';
                const months = c.end ? Math.max(0, Math.round((new Date(c.end) - new Date(c.start)) / 2629746e3)) : null;
                return fshort(c.start) + ' – ' + (c.end ? fshort(c.end) : 'hoy') + (months ? ' (' + months + (months === 1 ? ' mes' : ' meses') + ')' : ''); };
            const list = w.curso.slice().sort((a, b) => (a.status === 'en-curso' ? 0 : 1) - (b.status === 'en-curso' ? 0 : 1) || (b.end || b.start || '').localeCompare(a.end || a.start || ''));
            return list.length ? evGrid(list.map((c) => evBox(c.status === 'en-curso' ? 'is-soon' : c.status === 'abandonado' ? 'ws-done' : '',
                '<span class="small ws-ev-time">' + esc(span(c) || 'Sin fechas') + '</span>' + tag(c.status === 'finalizado' ? 'aprobado' : c.status === 'abandonado' ? 'desaprobado' : 'en-curso', { aprobado: 'Finalizado', desaprobado: 'Abandonado', 'en-curso': 'En curso' }),
                esc(c.name), [c.institution, c.hours].filter(Boolean).map(esc).join(' · '),
                (c.institution ? '<span class="small">🏫 ' + esc(c.institution) + '</span>' : '') + (c.hours ? '<span class="small">⏱ ' + esc(c.hours) + '</span>' : '')
                    + (c.certificate ? '<a class="small" href="' + esc(c.certificate) + '" target="_blank" rel="noopener">📜 Ver el certificado</a>' : c.status === 'finalizado' ? '<span class="small muted">Sin link del certificado</span>' : '')
                    + (c.url ? '<a class="small" href="' + esc(c.url) + '" target="_blank" rel="noopener">🔗 Página del curso</a>' : '') + notesHtml(c.notes),
                'curso:' + c.id)).join(''))
                : empty('Todavía no cargaste cursos. Sumá el primero con “Nuevo curso”: dónde lo hiciste, desde y hasta cuándo y el link del certificado.');
        };
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
                    + kpiGrid([
                        kpi(k.passed + (k.total !== null ? ' <small>de ' + k.total + '</small>' : ''), 'Materias aprobadas'),
                        kpi(fmt(k.avg), 'Promedio' + (k.avgAll !== null && k.avgAll !== k.avg ? ' <small>(con aplazos ' + fmt(k.avgAll) + ')</small>' : '')),
                        kpi(k.current, 'Cursando o inscripta'),
                        kpi(k.pending, 'Materias pendientes'),
                        kpi(k.finalsTaken, 'Finales rendidos'),
                        kpi(k.finalsLeft, 'Finales que te quedan'),
                        kpi(k.enrolled, 'Inscripciones a finales'),
                        k.left !== null ? kpi(k.left, 'Materias que faltan') : '',
                    ]) + progress(k) + '</div>';
            };
            // Con al menos una carrera cargada, no se muestra la tarjeta "Materias sin carrera": solo un aviso con cuáles son
            const loose = w.materia.filter((s) => !s.carrera);
            body = w.carrera.length || loose.length ? '<div class="ws-careers">' + w.carrera.map(card).join('') + (loose.length && !w.carrera.length ? card(null) : '') + '</div>'
                + (loose.length && w.carrera.length ? '<p class="small muted ws-note">' + (loose.length === 1 ? 'Esta materia no tiene carrera' : 'Estas materias no tienen carrera') + ' y no se cuentan: ' + loose.map((s) => '<button type="button" class="ws-inline" data-ws-open="materia:' + s.id + '">' + esc(s.name) + '</button>').join(', ') + '. Abrila y elegí la carrera.</p>' : '')
                : empty('Empezá cargando tu carrera con “Nueva carrera”. Si cursás dos en simultáneo, cargá las dos.');
            // Lista para agrupar: solo carreras, solo cursos o las dos cosas
            const g = st.studyGroup;
            body = '<div class="ws-filters">' + select('studyGroup', g, { todos: 'Carreras y cursos', carreras: 'Solo carreras', cursos: 'Solo cursos' }, 'Qué ver') + '</div>'
                + (g !== 'cursos' ? (g === 'todos' ? '<p class="ws-day">Carreras</p>' : '') + body : '')
                + (g !== 'carreras' ? (g === 'todos' ? '<p class="ws-day">Cursos</p>' : '') + coursesHtml() : '');
        } else if (st.studyTab === 'materias') {
            const view = st.subjView; // lista desplegable: en curso, pendientes, aprobadas o todas
            // Cursando (inscriptas o en curso) y Pendientes (todavía no cursadas) van sin filtro de año ni cuatrimestre; Aprobadas y Todas, con filtros
            const now = view === 'cursando' || view === 'pendientes';
            const pick = { cursando: (s) => ['inscripta', 'cursando'].includes(s.status), pendientes: (s) => s.status === 'pendiente' && !study(s).approved, aprobadas: (s) => study(s).approved }[view] || (() => true);
            const years = [...new Set(w.materia.map(termYear).filter(Boolean))].sort();
            const list = w.materia.filter((s) => (!st.studyCareer || String(s.carrera) === st.studyCareer)
                && pick(s) && (now || ((!st.studyYear || termYear(s) === st.studyYear) && (!st.studyHalf || termHalf(s) === st.studyHalf))))
                .sort((a, b) => (termYear(a) || '9999').localeCompare(termYear(b) || '9999') || (termHalf(a) || '9').localeCompare(termHalf(b) || '9') || String(a.name).localeCompare(String(b.name), 'es'));
            const n = (v) => (num(v) === null ? '—' : fmt(num(v)));
            body = '<div class="ws-filters">' + select('subjView', view, { cursando: 'En curso', pendientes: 'Pendientes', aprobadas: 'Aprobadas', todas: 'Todas' }, 'Qué materias ver')
                + (w.carrera.length > 1 ? select('studyCareer', st.studyCareer, careers, 'Carrera') : '')
                + (now ? '' : select('studyYear', st.studyYear, { '': 'Todos los años', ...Object.fromEntries(years.map((y) => [y, y])) }, 'Año')
                + select('studyHalf', st.studyHalf, { '': 'Los dos cuatrimestres', 1: '1er cuatrimestre', 2: '2do cuatrimestre' }, 'Cuatrimestre')) + '</div>'
                + (list.length ? '<div class="table-wrap"><table class="ws-table ws-grades"><thead><tr><th>Materia</th><th>Estado</th><th class="n">1.er parcial</th><th class="n">2.º parcial</th><th class="n">Recup.</th><th class="n">TPs</th><th class="n">Nota</th><th class="n">Final</th><th>Condición</th></tr></thead><tbody>'
                    + list.map((s) => { const x = study(s); const c = careerOf(s);
                        // TPs sin nota: Desaprob. si alguno se desaprobó, Aprob. solo si todos están aprobados, Ent. si ya se entregaron y Pend. si falta entregar
                        const tpDone = (a) => a.result === 'aprobado' || a.status === 'aprobado';
                        const tpWord = !x.tpOk ? 'Desaprob.' : x.tps.every(tpDone) ? 'Aprob.' : x.tps.every((a) => tpDone(a) || a.status === 'entregado') ? '<abbr title="Entregado, sin nota todavía">Ent.</abbr>' : '<abbr title="Falta entregar">Pend.</abbr>';
                        const tpTxt = x.tps.length ? (x.tpAvg !== null ? fmt(x.tpAvg) : tpWord) + ' <span class="small muted">(' + x.tps.length + ')</span>' : '—';
                        const isOpen = folded.has(s.id);
                        return '<tr' + rowAttrs('materia', s, isOpen ? 'is-open' : '') + '><td data-label="Materia"><button type="button" class="ws-fold" data-ws-fold="' + s.id + '" aria-expanded="' + isOpen + '" aria-label="Ver notas de ' + esc(s.name) + '"></button><strong>' + esc(s.name) + '</strong>' + ((c && !st.studyCareer) || s.term || s.code ?'<br><span class="small muted ws-sub">' + [s.code ? esc(s.code) : '', s.term ? esc(termLabel(s) || s.term) : '', c && !st.studyCareer ? careerShort(c) : ''].filter(Boolean).join(' · ') + '</span>' : '') + linksOf(s) + '</td>'
                            + '<td data-label="Estado">' + (s.status === 'pendiente' ? tag('por-cursar', { 'por-cursar': 'Pendiente' }) : tag(s.status, SUBJECT_STATUS)) + '</td>'
                            + '<td class="n" data-label="1.er parcial">' + n(s.p1) + '</td><td class="n" data-label="2.º parcial">' + n(s.p2) + '</td><td class="n" data-label="Recuperatorio">' + n(s.recup) + '</td>'
                            + '<td class="n" data-label="TPs">' + tpTxt + '</td><td class="n" data-label="Nota de la materia"><strong>' + fmt(x.final ?? x.cursada) + '</strong></td><td class="n" data-label="Final">' + n(s.final) + '</td>'
                            + '<td data-label="Condición">' + tag(x.tone === 'ok' ? 'aprobado' : x.tone === 'bad' ? 'desaprobado' : x.tone === 'warn' ? 'regular' : x.tone === 'muted' ? 'por-cursar' : 'en-curso', { aprobado: x.cond, desaprobado: x.cond, regular: x.cond, 'en-curso': x.cond, 'por-cursar': x.cond }) + (x.owed.length ? '<br><span class="small muted">Primero rendí el final de: ' + esc(x.owed.join(', ')) + '</span>' : '') + '</td></tr>'; }).join('')
                    + '</tbody></table></div><p class="small muted ws-note">El recuperatorio reemplaza al parcial más bajo. La nota de la materia es la del final si lo rendiste; si no, el promedio de los parciales, redondeado al entero (7,5 → 8). Promoción y aprobación según las notas de cada carrera (por defecto 7 y 4). Los TPs se cargan como actividades de tipo “Trabajo práctico”.</p>'
                    : empty(view === 'cursando' ? 'No estás cursando ninguna materia ahora. Las que tengan el estado “Inscripta” o “Cursando” aparecen acá.' : view === 'pendientes' ? 'No tenés materias pendientes. Cargá las que te faltan cursar con el estado “Pendiente”.' : view === 'aprobadas' ? 'Todavía no hay materias aprobadas' + (st.studyYear || st.studyHalf ? ' en este período' : '') + '.' : 'Todavía no hay materias' + (st.studyCareer ? ' en esta carrera' : '') + '. Inscribite con “Nueva materia”.'));
        } else if (st.studyTab === 'correlativas') {
            // Filtros de año y cuatrimestre propios de esta pestaña (no cambian los de Materias)
            const corrYears = [...new Set(w.materia.map(termYear).filter(Boolean))].sort();
            const period = st.corrYear || st.corrHalf;
            const mine = w.materia.filter((s) => (!st.studyCareer || String(s.carrera) === st.studyCareer)
                && (!st.corrYear || termYear(s) === st.corrYear) && (!st.corrHalf || termHalf(s) === st.corrHalf));
            const sub = (s) => '<strong>' + esc(s.name) + '</strong>' + (s.code || s.term ? '<br><span class="small muted">' + [s.code, termLabel(s) || s.term].filter(Boolean).map(esc).join(' · ') + '</span>' : '');
            const table = (list, which, okTxt, badTxt) => '<table class="ws-table ws-corr"><thead><tr><th>Materia</th><th>Estado</th></tr></thead><tbody>'
                + list.map((s) => { const m = corr(s)[which];
                    return '<tr' + rowAttrs('materia', s) + '><td data-label="Materia">' + sub(s) + '</td><td data-label="Estado">' + (m.length ? tag('desaprobado', { desaprobado: badTxt }) : tag('aprobado', { aprobado: okTxt })) + '</td></tr>'; }).join('')
                + '</tbody></table>';
            // Agrupadas por cuatrimestre, del más viejo al más nuevo (las que no tienen cursada, al final)
            const termKey = (s) => (termYear(s) || '9999') + ({ '1': '1', '2': '2', A: '0' }[termHalf(s)] || '3');
            const rows = (list, ...rest) => { const groups = [];
                list.slice().sort((a, b) => termKey(a).localeCompare(termKey(b)) || String(a.code || a.name).localeCompare(String(b.code || b.name), 'es', { numeric: true }))
                    .forEach((s) => { const k = termKey(s); const g = groups.find((x) => x.k === k); if (g) g.items.push(s); else groups.push({ k, s, items: [s] }); });
                return groups.map((g) => '<p class="ws-term">' + esc(termYear(g.s) ? termText(termHalf(g.s), termYear(g.s)) : 'Sin cuatrimestre cargado') + '</p>' + table(g.items, ...rest)).join(''); };
            const toTake = mine.filter((s) => ['pendiente', 'inscripta'].includes(s.status) && !study(s).approved);
            const toFinal = mine.filter((s) => isRegular(s) && !study(s).approved);
            body = '<div class="ws-filters">' + (w.carrera.length > 1 ? select('studyCareer', st.studyCareer, careers, 'Carrera') : '')
                + select('corrYear', st.corrYear, { '': 'Todos los años', ...Object.fromEntries(corrYears.map((y) => [y, y])) }, 'Año')
                + select('corrHalf', st.corrHalf, { '': 'Todos los cuatrimestres', 1: '1er cuatrimestre', 2: '2do cuatrimestre', A: 'Anual' }, 'Cuatrimestre') + '</div>'
                + (period || mine.some((s) => s.code) ? '' : '<p class="small muted ws-note">Para que funcione, cargá en la ficha de cada materia su código y los códigos de sus correlativas. Las materias que todavía no cursás se cargan con el estado “Pendiente”.</p>')
                + '<p class="ws-day">Para cursar · alcanza con las correlativas regularizadas</p>'
                + (toTake.length ? rows(toTake, 'cursar', 'Habilitada', 'Bloqueada') : empty(period ? 'No hay materias pendientes en este período.' : 'No hay materias pendientes. Cargá las del próximo cuatrimestre con el estado “Pendiente”.'))
                + '<p class="ws-day">Para rendir el final · las correlativas tienen que estar aprobadas</p>'
                + (toFinal.length ? rows(toFinal, 'rendir', 'Puede rendir', 'Todavía no') : empty(period ? 'No tenés materias regulares con el final pendiente en este período.' : 'No tenés materias regulares con el final pendiente.'));
        } else if (st.studyTab === 'horario') {
            const mine = w.materia.filter((s) => ['inscripta', 'cursando'].includes(s.status) && (!st.studyCareer || String(s.carrera) === st.studyCareer));
            const blocks = mine.flatMap((s) => parseSchedule(s.schedule).map((b) => ({ ...b, s })));
            const clash = (b) => blocks.some((o) => o !== b && o.s !== b.s && o.day === b.day && o.from < b.to && b.from < o.to);
            const unread = mine.filter((s) => !parseSchedule(s.schedule).length);
            body = '<div class="ws-filters">' + (w.carrera.length > 1 ? select('studyCareer', st.studyCareer, careers, 'Carrera') : '') + '</div>'
                + (blocks.length ? '<div class="ws-week">' + WEEKDAYS.map(([k, label]) => { const day = blocks.filter((b) => b.day === k).sort((a, b) => a.from.localeCompare(b.from));
                    return '<div class="ws-wday' + (day.length ? '' : ' is-empty') + '"><p class="ws-day">' + label + '</p>' + (day.length ? day.map((b) => '<button type="button" class="ws-slot" data-ws-open="materia:' + b.s.id + '"><span class="small">' + b.from + '–' + b.to + '</span><strong>' + abbr(b.s.name) + '</strong>' + (clash(b) ? tag('desaprobado', { desaprobado: 'Se superpone' }) : '') + '</button>').join('') : '<p class="small muted">Libre</p>') + '</div>'; }).join('') + '</div>'
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
        root('estudios').innerHTML = head('Estudios', 'Carreras, materias, notas, promedios, TPs, exámenes, finales y cursos.',
            '<button type="button" data-ws-new="carrera">+ Nueva carrera</button><button type="button" data-ws-new="materia">+ Nueva materia</button><button type="button" data-ws-new="curso">+ Nuevo curso</button><button type="button" class="primary" data-ws-new="actividad">+ Nueva actividad</button>')
            + '<div class="ws-filters">' + tabs + '</div>' + body;
    };

    // ---- Trabajo: postulaciones, entrevistas, empleos y capacitaciones
    const renderJobs = () => {
        const t = today();
        let list = W().trabajo.slice();
        if (st.jobKind) list = list.filter((j) => j.kind === st.jobKind);
        if (st.jobView === 'abiertos') list = list.filter((j) => JOB_OPEN.includes(j.status));
        // Empleos activos: una tarjeta con todos sus datos (puesto, lugar, días y horario, contratación, cómo cobra y funciones)
        const jobs = W().trabajo.filter((j) => j.kind === 'empleo' && j.status === 'activo' && (!st.jobKind || st.jobKind === 'empleo'));
        const line = (label, value) => (value ? '<p class="ws-job-l"><span class="small muted">' + label + '</span>' + esc(value) + '</p>' : '');
        const cards = jobs.length ? '<div class="ws-careers ws-jobs">' + jobs.map((j) => '<div class="card ws-career"><div class="ws-career-head"><div><h3>' + esc(j.title) + '</h3><p class="small muted">' + [j.company, j.date ? 'desde el ' + fshort(j.date) : '', j.end ? 'hasta el ' + fshort(j.end) : ''].filter(Boolean).map(esc).join(' · ') + '</p></div><button type="button" data-ws-open="trabajo:' + j.id + '">Editar</button></div>'
            + line('Días y horario', [j.days, j.hours].filter(Boolean).join(' · ')) + line('Dirección', j.address) + line('Contratación', j.contract ? JOB_CONTRACT[j.contract] : '') + line('Cómo cobrás', j.regime ? JOB_REGIME[j.regime] : '')
            + (j.functions ? '<div class="ws-job-l"><span class="small muted">Funciones</span><ul class="ws-job-f">' + j.functions.split(/\n+/).map((x) => x.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '')
            + '</div>').join('') + '</div>' : '';
        list = list.filter((j) => !jobs.includes(j)); // los activos ya están en su tarjeta
        root('trabajo').innerHTML = head('Trabajo', 'Tus empleos, entrevistas, postulaciones y capacitaciones fuera de JNB.', '<button type="button" class="primary" data-ws-new="trabajo">+ Nuevo registro</button>')
            + '<div class="ws-filters">' + seg('jobView', st.jobView, { abiertos: 'En curso', todos: 'Todos' }) + select('jobKind', st.jobKind, { '': 'Todos los tipos', ...JOB_KIND }, 'Tipo') + '</div>'
            + cards + (cards && list.length ? '<p class="ws-day">Otros registros</p>' : '')
            + (list.length ? '<table class="ws-table"><thead><tr><th>Fecha</th><th>Qué</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>'
                + list.map((j) => '<tr' + rowAttrs('trabajo', j) + '><td class="ws-nowrap" data-label="Fecha">' + esc(fshort(j.date)) + (j.time ? '<br><span class="small muted">' + esc(j.time) + ' h</span>' : '') + (j.date === t ? '<br>' + tag('en-curso', { 'en-curso': 'Hoy' }) : '') + '</td>'
                    + '<td data-label="Qué"><strong>' + esc(j.title) + '</strong>' + (j.company || j.days || j.hours ? '<br><span class="small muted">' + [j.company, j.kind === 'empleo' ? [j.days, j.hours].filter(Boolean).join(' ') : ''].filter(Boolean).map(esc).join(' · ') + '</span>' : '') + '</td>'
                    + '<td data-label="Tipo">' + esc(JOB_KIND[j.kind] || j.kind) + '</td><td data-label="Estado">' + tag(j.status, JOB_STATUS) + '</td></tr>').join('')
                + '</tbody></table>' : cards ? '' : empty(st.jobView === 'abiertos' ? 'No tenés empleos, postulaciones, entrevistas ni capacitaciones en curso.' : 'No hay registros para mostrar.'));
    };

    // ---- Gastos personales: total del mes, por categoría y lista (en pesos)
    // Vencimientos con monto que caen en el mes (AAAA-MM): suman en Gastos con su categoría. Los mensuales, todos los meses desde
    // su fecha; los anuales, en su mes; los de una vez, en el suyo. Uno que se repite y se marcó "Hecho" deja de sumar desde ese mes.
    // Monto de un mes: el último cargado desde ese mes o antes (los servicios aumentan y se actualizan mes a mes sin tocar los anteriores)
    const amountsOf = (v) => Object.fromEntries(String(v.amounts || '').split(';').map((x) => x.split('=')).filter(([m, a]) => /^\d{4}-\d{2}$/.test(m || '') && money(a) !== null));
    const amountFor = (v, m) => { const h = amountsOf(v); const keys = Object.keys(h).sort(); if (!keys.length) return v.amount;
        const k = keys.filter((x) => x <= m).pop(); return h[k || keys[0]]; };
    const monthAfter = (m) => { const d = new Date(m + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 7); };
    let editMonth = ''; // mes del monto que se edita (al abrir un vencimiento desde Gastos)
    const dlIn = (v, m) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date || '') || money(amountFor(v, m)) === null || m < v.date.slice(0, 7)) return '';
        if (!v.repeat) return v.date.slice(0, 7) === m ? v.date : '';
        if (v.repeat === 'anual' && m.slice(5) !== v.date.slice(5, 7)) return '';
        if (v.done === 'si' && v.updated && m > String(v.updated).slice(0, 7)) return '';
        return m + '-' + String(Math.min(Number(v.date.slice(8)), new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5)), 0)).getUTCDate())).padStart(2, '0'); };
    const fixedIn = (m) => W().vencimiento.map((v) => { const d = dlIn(v, m); return d ? { id: v.id, dl: true, month: m, concept: v.title, amount: amountFor(v, m), category: v.category || 'otros', date: d, repeat: v.repeat } : null; }).filter(Boolean);
    const renderExpenses = () => {
        const all = W().gasto;
        const month = today().slice(0, 7);
        if (st.expMonth === null) st.expMonth = month;
        // Meses con gastos, el actual y los meses en que corre algún vencimiento con monto (hasta 2 años atrás)
        const dlMonths = []; for (let m = month, i = 0; i < 24; i++) { if (W().vencimiento.some((v) => dlIn(v, m))) dlMonths.push(m); const d = new Date(m + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); m = d.toISOString().slice(0, 7); }
        const months = [...new Set(all.map((g) => (g.date || '').slice(0, 7)).filter(Boolean).concat(month, dlMonths))].sort().reverse();
        const mLabel = (m) => MONTHS[Number(m.slice(5)) - 1].replace(/^./, (c) => c.toUpperCase()) + ' ' + m.slice(0, 4);
        const inMonth = (m) => all.filter((g) => !m || (g.date || '').slice(0, 7) === m).concat(m ? fixedIn(m) : months.flatMap(fixedIn));
        const list = inMonth(st.expMonth).filter((g) => !st.expCat || g.category === st.expCat).sort((a, b) => (st.expSort === 'asc' ? (a.date || '').localeCompare(b.date || '') : (b.date || '').localeCompare(a.date || '')) || a.id - b.id); // por fecha del gasto
        const sum = (l) => l.reduce((n, g) => n + (money(g.amount) || 0), 0);
        const total = sum(list);
        const prevKey = st.expMonth ? (() => { const d = new Date(st.expMonth + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); })() : '';
        const prev = prevKey ? sum(inMonth(prevKey).filter((g) => !st.expCat || g.category === st.expCat)) : null;
        const monthList = inMonth(st.expMonth);
        const cats = Object.keys(EXP_CAT).map((k) => ({ k, n: sum(monthList.filter((g) => g.category === k)) })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
        root('gastos').innerHTML = head('Gastos', 'Tus gastos personales en pesos, separados de los números de JNB.', '<button type="button" class="primary" data-ws-new="gasto">+ Nuevo gasto</button>')
            + '<div class="ws-filters">' + select('expMonth', st.expMonth, { '': 'Todos los meses', ...Object.fromEntries(months.map((m) => [m, mLabel(m)])) }, 'Mes') + select('expCat', st.expCat, { '': 'Todas las categorías', ...EXP_CAT }, 'Categoría') + select('expSort', st.expSort, { asc: 'Por fecha: del 1 al 31', desc: 'Por fecha: los más recientes primero' }, 'Orden') + '</div>'
            + '<div class="ws-kpis ws-kpis-top">' + kpi(ars(total), (st.expMonth ? 'Total de ' + mLabel(st.expMonth).toLowerCase() : 'Total') + (st.expCat ? ' en ' + esc(EXP_CAT[st.expCat].toLowerCase()) : '')) + kpi(list.length, list.length === 1 ? 'Gasto' : 'Gastos') + (list.some((g) => g.dl) ? kpi(ars(sum(list.filter((g) => g.dl))), 'De vencimientos <small>(incluido en el total)</small>') : '')
                + (prev !== null ? kpi(ars(prev), 'Mes anterior' + (prev ? ' <small>(' + (total >= prev ? '+' : '−') + Math.abs(Math.round((total - prev) / prev * 100)) + ' %)</small>' : '')) : '') + '</div>'
            // Totales por categoría: tocar una filtra la lista por esa categoría (y tocarla de nuevo vuelve a todas)
            + (cats.length > 1 ? '<div class="ws-cats">' + cats.map((c) => '<button type="button" class="ws-cat" data-ws-set="expCat" data-value="' + (st.expCat === c.k ? '' : c.k) + '" aria-pressed="' + (st.expCat === c.k) + '"><span>' + esc(EXP_CAT[c.k]) + '</span>' + bar(c.n / cats[0].n) + '<span class="ws-cat-n">' + ars(c.n) + '</span></button>').join('') + '</div>' : '')
            + (list.length ? evGrid(list.map((g) => evBox(g.dl ? 'is-fixed' : '',
                '<span class="small ws-ev-time">' + esc(fshort(g.date)) + '</span><span class="ws-ev-amt">' + (money(g.amount) === null ? '—' : ars(money(g.amount))) + '</span>',
                (g.dl ? '🔁 ' : '') + esc(g.concept), esc(EXP_CAT[g.category] || g.category),
                (g.dl ? '<span class="small">De Vencimientos' + (g.repeat === 'mensual' ? ' · todos los meses' : g.repeat === 'anual' ? ' · todos los años' : '') + '</span>' : '')
                    + (g.method ? '<span class="small">💳 ' + esc(EXP_METHOD[g.method] || '') + '</span>' : '') + (g.dl ? '' : notesHtml(g.notes)),
                (g.dl ? 'vencimiento:' : 'gasto:') + g.id, g.dl ? 'Cambiar el monto de este mes' : 'Editar', g.dl ? ' data-ws-month="' + g.month + '"' : '')).join(''))
                : empty('No hay gastos ' + (st.expMonth ? 'en ' + mLabel(st.expMonth).toLowerCase() : 'cargados') + '. Sumá el primero con “Nuevo gasto”.'));
    };

    // ---- Vencimientos personales: DNI, carnet, seguro, turnos; aviso por mail "notice" días antes (por defecto 7)
    const noticeOf = (v) => (/^\d{1,3}$/.test(String(v.notice || '')) ? Number(v.notice) : 7);
    const daysTo = (iso) => Math.round((new Date(iso + 'T12:00:00Z') - new Date(today() + 'T12:00:00Z')) / 864e5);
    // Los que se repiten (mensual o anual) pasan solos a la próxima fecha: el mismo día de cada mes o de cada año (igual que el aviso por mail)
    const nextDue = (date, repeat, t) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !DL_REPEAT[repeat] || !repeat) return date || '';
        const day = Number(date.slice(8)); let y = Number(date.slice(0, 4)); let m = Number(date.slice(5, 7));
        const make = () => y + '-' + String(m).padStart(2, '0') + '-' + String(Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, '0');
        let d = make();
        for (let i = 0; d < t && i < 1200; i++) { if (repeat === 'anual') y++; else if (++m > 12) { m = 1; y++; } d = make(); }
        return d; };
    // Pagos: "paid" guarda las fechas pagadas. En los que se repiten y tienen monto, si el último vencimiento (de hasta un mes atrás)
    // quedó sin pagar, se muestra ese, como vencido, hasta que se marque como pagado; si no, el próximo.
    const paidOf = (v) => String(v.paid || '').split(';').filter(Boolean);
    const isPaid = (v, d) => !!d && paidOf(v).includes(d);
    const prevDue = (v, next) => { if (!v.repeat || !next) return '';
        const day = Number(v.date.slice(8)); let y = Number(next.slice(0, 4)); let m = Number(next.slice(5, 7));
        if (v.repeat === 'anual') y--; else if (--m < 1) { m = 12; y--; }
        const d = y + '-' + String(m).padStart(2, '0') + '-' + String(Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, '0');
        return d >= v.date ? d : ''; };
    const dueOf = (v) => { if (v.done === 'si' || !v.repeat) return v.date;
        const next = nextDue(v.date, v.repeat, today()); const prev = prevDue(v, next);
        return prev && !isPaid(v, prev) && daysTo(prev) >= -31 && money(amountFor(v, prev.slice(0, 7))) !== null ? prev : next; };
    const repeatText = (v) => (v.repeat === 'mensual' && v.date ? 'Todos los ' + Number(v.date.slice(8)) + ' de cada mes' : v.repeat === 'anual' && v.date ? 'Todos los años el ' + Number(v.date.slice(8)) + '/' + Number(v.date.slice(5, 7)) : '');
    const renderDeadlines = () => {
        let list = W().vencimiento.map((v) => ({ ...v, date: dueOf(v), first: v.date }));
        if (st.dlKind) list = list.filter((v) => v.kind === st.dlKind);
        list.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.id - b.id);
        if (st.dlView === 'proximos') list = list.filter((v) => v.done !== 'si');
        if (st.dlView === 'hechos') list = list.filter((v) => v.done === 'si' || (v.repeat && isPaid(v, v.date))).reverse();
        root('vencimientos').innerHTML = head('Vencimientos', 'DNI, carnet, seguros, impuestos, cuotas mensuales y turnos. Te llega un mail a tu casilla de contacto los días antes que elijas (por defecto, 7).', '<button type="button" class="primary" data-ws-new="vencimiento">+ Nuevo vencimiento</button>')
            + '<div class="ws-filters">' + seg('dlView', st.dlView, { proximos: 'Pendientes', hechos: 'Pagados o hechos', todos: 'Todos' }) + select('dlKind', st.dlKind, { '': 'Todos los tipos', ...DL_KIND }, 'Tipo') + '</div>'
            + (list.length ? evGrid(list.map((v) => { const n = v.date ? daysTo(v.date) : null;
                    const pays = money(amountFor(v, (v.date || today()).slice(0, 7))) !== null; const paid = isPaid(v, v.date);
                    const state = v.done === 'si' ? tag(v.repeat ? 'pendiente' : 'aprobado', { pendiente: 'Dado de baja', aprobado: pays ? 'Pagado' : 'Hecho' })
                        : paid ? tag('aprobado', { aprobado: 'Pagado' }) : n === null ? tag('pendiente', { pendiente: 'Sin fecha' })
                        : n < 0 ? tag('desaprobado', { desaprobado: pays ? 'Vencido · sin pagar' : 'Vencido' }) : tag(n <= noticeOf(v) ? 'regular' : 'en-curso', { regular: n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : 'Faltan ' + n + ' días', 'en-curso': 'Faltan ' + n + ' días' });
                    const rep = repeatText({ ...v, date: v.first }); const amt = money(amountFor(v, today().slice(0, 7)));
                    // Botón para marcar el pago de esta fecha (o "hecho" si no se paga); en los que se repiten, cada mes por separado
                    const payBtn = v.done === 'si' || !v.date || (!pays && v.repeat) ? '' : '<button type="button" class="' + (paid ? '' : 'primary') + '" data-ws-pay="' + v.id + '|' + v.date + '" title="' + (paid ? 'Desmarcar el pago' : pays ? 'Marcar como pagado' + (v.repeat ? ' el de ' + MONTHS[Number(v.date.slice(5, 7)) - 1] : '') : 'Marcar como hecho') + '">'
                        + (paid ? 'Desmarcar' : pays ? '✓ Pagado' : '✓ Hecho') + '</button>';
                    return evBox(v.done === 'si' || paid ? 'ws-done' : n !== null && n < 0 ? 'is-late' : n !== null && n <= noticeOf(v) ? 'is-soon' : '',
                        '<span class="small ws-ev-time">' + esc(fshort(v.date)) + (v.time ? ' · ' + esc(v.time) + ' h' : '') + '</span>' + state,
                        (rep ? '🔁 ' : '') + esc(v.title), esc(DL_KIND[v.kind] || v.kind) + (amt !== null ? ' · ' + ars(amt) : ''),
                        (rep ? '<span class="small">🔁 ' + esc(rep) + '</span>' : '') + (amt !== null ? '<span class="small">💲 ' + ars(amt) + ' este mes · suma en Gastos (' + esc((EXP_CAT[v.category] || EXP_CAT.otros).toLowerCase()) + ')</span>' : '')
                            + (v.place ? '<span class="small">📍 ' + esc(v.place) + '</span>' : '') + (v.done !== 'si' && !paid ? '<span class="small muted">Aviso por mail ' + noticeOf(v) + (noticeOf(v) === 1 ? ' día' : ' días') + ' antes</span>' : '') + notesHtml(v.notes),
                        'vencimiento:' + v.id, '', '', payBtn); }).join(''))
                : empty(st.dlView === 'proximos' ? 'No tenés vencimientos pendientes. Cargá el primero con “Nuevo vencimiento”.' : 'No hay vencimientos para mostrar.'));
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

    // ---- Salud: medicamentos que tomás (con sus horarios) y chequeos, consultas, estudios y vacunas; filtros por tipo, especialidad y profesional
    const renderHealth = () => {
        const all = W().salud; const t = today();
        const specs = variants(all.map((h) => h.specialty)); const docs = variants(all.map((h) => h.doctor));
        if (st.hSpec && !specs[st.hSpec]) st.hSpec = ''; if (st.hDoc && !docs[st.hDoc]) st.hDoc = '';
        if (st.hKind && !healthTypes()[st.hKind]) st.hKind = '';
        const list = all.filter((h) => (!st.hKind || typeKey(h) === st.hKind) && (!st.hSpec || norm(h.specialty) === st.hSpec) && (!st.hDoc || norm(h.doctor) === st.hDoc));
        const who = (h) => [h.specialty ? specs[norm(h.specialty)] : '', h.doctor ? docs[norm(h.doctor)] : ''].filter(Boolean).map(esc).join(' · ');
        const hoursOf = (h) => String(h.hours || '').split(/\s*(?:,|;|\by\b|\/)\s*/).map((x) => x.trim()).filter(Boolean);
        const meds = list.filter((h) => h.kind === 'medicamento' && h.status !== 'finalizado').sort((a, b) => String(a.title).localeCompare(String(b.title), 'es'));
        const oldMeds = list.filter((h) => h.kind === 'medicamento' && h.status === 'finalizado');
        const rest = list.filter((h) => h.kind !== 'medicamento').sort((a, b) => { const fa = (a.date || '') >= t; const fb = (b.date || '') >= t;
            return fa !== fb ? (fa ? -1 : 1) : fa ? (a.date || '').localeCompare(b.date || '') : (b.date || '').localeCompare(a.date || ''); });
        const takes = meds.flatMap((h) => hoursOf(h).map((x) => ({ x, h }))).sort((a, b) => a.x.localeCompare(b.x, 'es', { numeric: true }));
        const medBox = (h) => evBox(h.status === 'finalizado' ? 'ws-done' : '', '<span class="small ws-ev-time">' + (hoursOf(h).length ? esc(hoursOf(h).join(' · ')) : 'Sin horario') + '</span>' + (h.status === 'finalizado' ? tag('pendiente', { pendiente: 'Ya no lo tomo' }) : ''),
            '💊 ' + esc(h.title), [esc(doseText(h)), h.course === 'temporal' ? 'Por un tiempo' : 'Crónico'].filter(Boolean).join(' · ') + (h.remind === 'si' ? ' · 🔔' : ''),
            (doseText(h) ? '<span class="small">Dosis: ' + esc(doseText(h)) + '</span>' : '') + (who(h) ? '<span class="small">🩺 Lo indicó: ' + who(h) + '</span>' : '')
                + '<span class="small">' + (h.remind === 'si' ? '🔔 Aparece en el Dashboard a la hora de tomarlo' : '🔕 Sin recordatorio') + '</span>'
                + (h.course === 'temporal' && (h.start || h.end) ? '<span class="small">📅 ' + (h.start ? 'Desde el ' + esc(fshort(h.start)) : '') + (h.end ? (h.start ? ' hasta el ' : 'Hasta el ') + esc(fshort(h.end)) : '') + '</span>' : '') + notesHtml(h.notes), 'salud:' + h.id);
        const recBox = (h) => { const n = h.date ? daysTo(h.date) : null;
            return evBox(n !== null && n >= 0 && n <= 7 ? 'is-soon' : n !== null && n < 0 ? 'ws-done' : '', '<span class="small ws-ev-time">' + esc(fshort(h.date)) + (h.time ? ' · ' + esc(h.time) + ' h' : '') + '</span>'
                + (n === null ? '' : n < 0 ? tag('aprobado', { aprobado: 'Hecho' }) : tag(n <= 7 ? 'regular' : 'en-curso', { regular: n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : 'Faltan ' + n + ' días', 'en-curso': 'Faltan ' + n + ' días' })),
                esc(h.title), [esc(typeLabel(h)), who(h)].filter(Boolean).join(' · '),
                (who(h) ? '<span class="small">🩺 ' + who(h) + '</span>' : '') + (h.place ? '<span class="small">📍 ' + esc(h.place) + '</span>' : '')
                    + (h.result ? '<p class="small ws-ev-notes"><strong>Resultado:</strong> ' + esc(h.result).replace(/\n/g, '<br>') + '</p>' : '') + notesHtml(h.notes), 'salud:' + h.id); };
        // Tipos propios: se agregan, se cambian de nombre o se borran (los fijos no se tocan)
        const typesPanel = st.hTypes ? '<div class="ws-types card"><p class="small muted">Los tipos fijos son Consulta, Medicamento, Estudio o análisis, Vacuna y Otro. Podés sumar los tuyos y cambiarles el nombre o borrarlos; los registros de un tipo borrado pasan a “Otro”.</p><div class="ws-type-list">'
            + W().saludtipo.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'es')).map((x) => '<button type="button" class="ws-type" data-ws-open="saludtipo:' + x.id + '" title="Cambiar el nombre o borrar">' + esc(x.name) + ' <span aria-hidden="true">✎</span></button>').join('')
            + '<button type="button" class="ws-type is-new" data-ws-new="saludtipo">+ Agregar tipo</button></div></div>' : '';
        root('salud').innerHTML = head('Salud', 'Consultas, estudios, vacunas y los medicamentos que tomás, con sus horarios y quién te los indicó.', '<button type="button" data-ws-set="hTypes" data-value="' + (st.hTypes ? '' : '1') + '" aria-pressed="' + !!st.hTypes + '">Tipos</button><button type="button" class="primary" data-ws-new="salud">+ Nuevo registro</button>')
            + typesPanel
            + '<div class="ws-filters">' + select('hKind', st.hKind, { '': 'Todos los tipos', ...healthTypes() }, 'Tipo') + (Object.keys(specs).length ? select('hSpec', st.hSpec, { '': 'Todas las especialidades', ...specs }, 'Especialidad') : '')
                + (Object.keys(docs).length ? select('hDoc', st.hDoc, { '': 'Todos los profesionales', ...docs }, 'Profesional') : '') + '</div>'
            + (!all.length ? empty('Todavía no cargaste nada. Sumá un chequeo o un medicamento con “Nuevo registro”.') : !list.length ? empty('No hay registros con estos filtros.') : '')
            + (meds.length ? '<p class="ws-day">Medicamentos que tomás</p>' + (takes.length ? '<p class="small ws-note">⏰ ' + takes.map((k) => '<strong>' + esc(k.x) + '</strong> ' + esc(k.h.title) + (doseText(k.h) ? ' ' + esc(doseText(k.h)) : '')).join(' · ') + '</p>' : '') + evGrid(meds.map(medBox).join('')) : '')
            + (rest.length ? '<p class="ws-day">Chequeos, consultas y estudios</p>' + evGrid(rest.map(recBox).join('')) : '')
            + (oldMeds.length ? '<p class="ws-day">Medicamentos que ya no tomás</p>' + evGrid(oldMeds.map(medBox).join('')) : '');
    };

    // ---- Entrenamiento: rutina por día; cada ejercicio se marca como hecho y queda anotado el día (log)
    const DOW = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const weekStart = () => { const d = new Date(today() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
    const logOf = (r) => String(r.log || '').split(';').filter(Boolean);
    const doneWeek = (r) => logOf(r).some((x) => x >= weekStart() && x <= today());
    const trainDays = (r) => (r.days ? String(r.days).split(',').filter((k) => WEEK[k]) : r.weekday ? [r.weekday] : []);
    const dayDate = (k) => { const d = new Date(weekStart() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + Object.keys(WEEK).indexOf(k)); return d.toISOString().slice(0, 10); }; // fecha de ese día en esta semana
    // Historial por mes: calendario con los días entrenados (de lo anotado con "Lo hice hoy") y, debajo, qué se hizo cada día
    const trainName = (r) => (['gym', 'otro'].includes(sportOf(r)) && r.exercise ? r.exercise : SPORT[sportOf(r)] + (subOf(r) ? ' · ' + subOf(r) : ''));
    const trainingHistory = (items) => {
        const t = today(); const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
        const months = [...new Set(items.flatMap((r) => logOf(r).map((x) => x.slice(0, 7))).concat(t.slice(0, 7)))].sort().reverse();
        if (!months.includes(st.trMonth)) st.trMonth = t.slice(0, 7);
        const m = st.trMonth; const y = Number(m.slice(0, 4)); const mo = Number(m.slice(5));
        const byDay = {}; items.forEach((r) => logOf(r).filter((x) => x.slice(0, 7) === m).forEach((x) => { (byDay[x] = byDay[x] || []).push(r); }));
        const all = Object.values(byDay).flat();
        const sum = (f) => all.reduce((n, r) => n + (Number(String(r[f] || '').replace(',', '.')) || 0), 0);
        const lead = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7; const nd = new Date(Date.UTC(y, mo, 0)).getUTCDate();
        const cells = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((x) => '<span class="ws-cal-h">' + x + '</span>').join('')
            + '<span class="ws-cal-d is-empty"></span>'.repeat(lead)
            + [...Array(nd)].map((_, i) => { const iso = m + '-' + String(i + 1).padStart(2, '0'); const l = byDay[iso] || [];
                return '<span class="ws-cal-d' + (l.length ? ' has' : '') + (iso === t ? ' is-today' : '') + '"><span class="ws-cal-n">' + (i + 1) + '</span>'
                    + (l.length ? '<span class="ws-cal-c">' + l.length + '</span>' + l.slice(0, 2).map((r) => '<span class="ws-cal-i">' + esc(trainName(r)) + '</span>').join('') + (l.length > 2 ? '<span class="ws-cal-i muted">+' + (l.length - 2) + ' más</span>' : '') : '') + '</span>'; }).join('');
        const days = Object.keys(byDay).sort().reverse();
        return '<div class="ws-filters">' + select('trMonth', m, Object.fromEntries(months.map((x) => [x, cap(MONTHS[Number(x.slice(5)) - 1]) + ' ' + x.slice(0, 4)])), 'Mes') + '</div>'
            + kpiGrid([kpi(days.length, days.length === 1 ? 'Día entrenado' : 'Días entrenados'), kpi(all.length, 'Ejercicios hechos'), sum('minutes') ? kpi(sum('minutes') + ' <small>min</small>', 'Minutos') : '',
                sum('meters') ? kpi(sum('meters').toLocaleString('es-AR') + ' <small>m</small>', 'Metros nadados') : '', sum('km') ? kpi(fmt(sum('km')) + ' <small>km</small>', 'Kilómetros') : ''])
            + '<div class="ws-cal">' + cells + '</div>'
            + (days.length ? days.map((d) => '<p class="ws-term">' + esc(fdate(d)) + '</p><ul class="ws-cal-list">' + byDay[d].map((r) => '<li><button type="button" class="ws-inline" data-ws-open="entreno:' + r.id + '">' + esc(trainName(r)) + '</button>'
                + (r.sets || r.kg || r.meters || r.km || r.minutes ? ' <span class="small muted">' + esc([r.sets && r.reps ? r.sets + ' × ' + r.reps : '', r.kg ? r.kg + ' kg' : '', r.meters ? r.meters + ' m' : '', r.km ? r.km + ' km' : '', r.minutes ? r.minutes + ' min' : ''].filter(Boolean).join(' · ')) + '</span>' : '') + '</li>').join('') + '</ul>').join('')
                : empty('No anotaste entrenamientos en ' + MONTHS[mo - 1] + ' de ' + y + '. Se anotan con “✓ Lo hice hoy” en cada ejercicio.'));
    };
    const renderTraining = () => {
        const all = W().entreno; const t = today(); const todayKey = DOW[new Date(t + 'T12:00:00Z').getUTCDay()];
        const subOpts = st.trSport === 'gym' ? GYM_ZONE : SUB[st.trSport] || null;
        if (!subOpts || !(st.trSub in subOpts)) st.trSub = '';
        const areaOk = (r) => (!st.trSport || sportOf(r) === st.trSport) && (!st.trSub || (st.trSport === 'gym' ? r.area === st.trSub : r.style === st.trSub));
        // Cada ejercicio aparece en cada uno de sus días; "hecho" es por día (la fecha de ese día en esta semana). Sin día fijo: hecho si se hizo en la semana
        const scope = all.filter((r) => areaOk(r) && (!st.trDay || trainDays(r).includes(st.trDay)));
        const slots = scope.flatMap((r) => (trainDays(r).length ? trainDays(r).filter((k) => !st.trDay || k === st.trDay).map((k) => ({ r, k, date: dayDate(k) })) : [{ r, k: '', date: '' }]))
            .map((x) => ({ ...x, done: x.date ? logOf(x.r).includes(x.date) : doneWeek(x.r) }));
        let list = slots; if (st.trView === 'pendientes') list = list.filter((x) => !x.done); if (st.trView === 'hechas') list = list.filter((x) => x.done);
        const doneN = slots.filter((x) => x.done).length;
        const sumWeek = (f) => scope.reduce((n, r) => n + logOf(r).filter((x) => x >= weekStart() && x <= t).length * (Number(String(r[f] || '').replace(',', '.')) || 0), 0);
        const mins = sumWeek('minutes'); const meters = sumWeek('meters'); const km = sumWeek('km');
        const detail = (r) => [r.sets && r.reps ? r.sets + ' × ' + r.reps : r.sets ? r.sets + ' series' : r.reps ? r.reps + ' rep.' : '', r.kg ? r.kg + ' kg' : '',
            r.meters ? r.meters + ' m' : '', r.km ? r.km + ' km' : '', r.minutes ? r.minutes + ' min' : ''].filter(Boolean).join(' · ');
        const box = ({ r, k, date, done }) => { const last = logOf(r).slice(-1)[0]; const mark = date || t; // el día que marca el botón
            const btn = date && date > t ? '<span class="small muted">Te toca el ' + WEEK[k].toLowerCase() + '</span>'
                : '<button type="button" class="' + (logOf(r).includes(mark) ? '' : 'primary') + '" data-ws-train="' + r.id + '|' + mark + '">' + (logOf(r).includes(mark) ? 'Desmarcar' : '✓ Lo hice ' + (mark === t ? 'hoy' : 'el ' + WEEK[k].toLowerCase())) + '</button>';
            return evBox(done ? 'is-train-done' : '', tag(done ? 'aprobado' : 'en-curso', { aprobado: '✓ Hecho', 'en-curso': SPORT[sportOf(r)] }) + '<span class="small muted">' + esc(done ? SPORT[sportOf(r)] + (sportOf(r) === 'gym' ? ' · ' + subOf(r) : '') : sportOf(r) === 'gym' ? subOf(r) : '') + '</span>',
                esc(['gym', 'otro'].includes(sportOf(r)) && r.exercise ? r.exercise : sportOf(r) === 'gym' ? subOf(r) : subOf(r) || SPORT[sportOf(r)]), esc(detail(r)),
                (detail(r) ? '<span class="small">' + esc(detail(r)) + '</span>' : '') + '<span class="small muted">' + (last ? 'Última vez: ' + esc(fshort(last)) + ' · ' + logOf(r).length + (logOf(r).length === 1 ? ' vez' : ' veces') : 'Todavía no lo hiciste') + '</span>' + notesHtml(r.notes)
                    + (trainDays(r).length > 1 ? '<span class="small muted">📅 ' + (trainDays(r).length === 7 ? 'Todos los días' : trainDays(r).map((x) => WEEK[x]).join(', ')) + '</span>' : ''), 'entreno:' + r.id, '', '', btn); };
        const days = Object.keys(WEEK).concat('').map((k) => ({ k, items: list.filter((x) => x.k === k) })).filter((g) => g.items.length);
        const top = head('Entrenamiento', 'Tu rutina por día: tren superior, inferior, core, cardio, natación y otros deportes. Marcá lo que hiciste y queda anotado el día.', '<button type="button" class="primary" data-ws-new="entreno">+ Nuevo ejercicio</button>')
            + '<div class="ws-filters">' + seg('trView', st.trView, { todas: 'Toda la rutina', pendientes: 'Pendientes de la semana', hechas: 'Hechas esta semana', historial: 'Historial por mes' })
                + select('trSport', st.trSport, { '': 'Todas las actividades', ...SPORT }, 'Actividad')
                + (subOpts ? select('trSub', st.trSub, { '': st.trSport === 'gym' ? 'Todas las zonas' : 'Todos los tipos', ...subOpts }, 'Tipo') : '')
                + select('trDay', st.trDay, { '': 'Todos los días', ...WEEK }, 'Día') + '</div>';
        if (st.trView === 'historial') { root('entrenamiento').innerHTML = top + trainingHistory(scope); return; }
        root('entrenamiento').innerHTML = top
            + (scope.length ? kpiGrid([kpi(doneN + ' <small>de ' + slots.length + '</small>', 'Hechos esta semana'), mins ? kpi(mins + ' <small>min</small>', 'Minutos esta semana') : '',
                meters ? kpi(meters.toLocaleString('es-AR') + ' <small>m</small>', 'Metros nadados esta semana') : '', km ? kpi(fmt(km) + ' <small>km</small>', 'Kilómetros esta semana') : '']) : '')
            + (days.length ? days.map((g) => '<p class="ws-day' + (g.k === todayKey ? ' is-today' : '') + '">' + (g.k === todayKey ? 'Hoy · ' : '') + (g.k ? WEEK[g.k] : 'Sin día fijo') + '</p>' + evGrid(g.items.map(box).join(''))).join('')
                : empty(all.length ? 'No hay ejercicios con estos filtros.' : 'Armá tu rutina con “Nuevo ejercicio”: elegí la actividad, el día y, si querés, series, repeticiones y kilos.'));
    };

    const RENDER = { 'mi-agenda': renderAgenda, salud: renderHealth, entrenamiento: renderTraining, estudios: renderStudies, trabajo: renderJobs, gastos: renderExpenses, vencimientos: renderDeadlines, metas: renderGoals };
    const MOD_OF = { agenda: 'mi-agenda', carrera: 'estudios', materia: 'estudios', actividad: 'estudios', curso: 'estudios', trabajo: 'trabajo', gasto: 'gastos', vencimiento: 'vencimientos', salud: 'salud', saludtipo: 'salud', entreno: 'entrenamiento', meta: 'metas' };
    let current = '';

    // ---- Contadores del menú: agenda de hoy, entregas y exámenes de los próximos 7 días (o vencidos), entrevistas próximas
    const badges = () => {
        const t = today(); const week = addDays(t, 7); const w = W();
        const set = (id, n, title) => { const b = document.getElementById('n-' + id); if (b) { b.textContent = n || ''; b.title = n ? title : ''; } };
        const ag = agendaItems().filter((e) => e.done !== 'si' && e.date === t).length;
        const st7 = w.actividad.filter((a) => ACT_OPEN.includes(actStatus(a)) && a.date && a.date <= week).length;
        const jb = w.trabajo.filter((j) => JOB_OPEN.includes(j.status) && j.date && j.date >= t && j.date <= week).length;
        const dl = w.vencimiento.filter((v) => v.done !== 'si' && v.date && !isPaid(v, dueOf(v)) && daysTo(dueOf(v)) <= noticeOf(v)).length;
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
        const wide = (type === 'text' || o.wide ? ' class="wide"' : '') + (o.course ? ' data-ws-course' : '') + (o.job ? ' data-ws-job' : o.nojob ? ' data-ws-nojob' : '') + (o.notBday ? ' data-ws-nobday' : '') + (o.areas ? ' data-ws-areas="' + o.areas.join(' ') + '"' : '');
        if (type === 'days') { const sel = trainDays(r); // casillas: uno, varios o todos los días
            // Ocho botones iguales en la misma fila: Lun… Dom y "Todos" (en el celular, dos filas de cuatro: ninguno queda solo)
            const short = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom' };
            return '<fieldset class="wide ws-days"><legend>' + label + '</legend><div class="ws-days-row">'
                + Object.entries(WEEK).map(([k, l]) => '<label class="ws-day-chip" title="' + l + '"><input type="checkbox" name="_day" value="' + k + '" aria-label="' + l + '"' + (sel.includes(k) ? ' checked' : '') + '><span>' + short[k] + '</span></label>').join('')
                + '<label class="ws-day-chip ws-day-all" title="Todos los días"><input type="checkbox" data-ws-alldays aria-label="Todos los días"' + (sel.length === 7 ? ' checked' : '') + '><span>Todos</span></label></div></fieldset>'; }
        if (type === 'htype') { const cur = r.id ? typeKey(r) : (r.kind || 'consulta');
            return '<label' + wide + '>' + label + '<select name="' + name + '">' + Object.entries(healthTypes()).map(([k, l]) => '<option value="' + esc(k) + '"' + (k === cur ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></label>'; }
        if (type === 'pick') return '<label' + wide + '>' + label + '<select name="' + name + '"><option value="">' + esc(o.empty || '—') + '</option>' + o.values.map((x) => '<option' + (x === String(v) ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + (v && !o.values.includes(String(v)) ? '<option selected>' + esc(v) + '</option>' : '') + '</select></label>';
        if (type === 'line' && o.list) return '<label' + wide + '>' + label + '<input type="text" name="' + name + '" value="' + esc(v) + '" list="ws-list-' + name + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.hint ? ' placeholder="' + esc(o.hint) + '"' : '') + '><datalist id="ws-list-' + name + '">' + o.list.map((x) => '<option value="' + esc(x) + '">').join('') + '</datalist></label>';
        if (type === 'select') return '<label' + wide + '>' + label + '<select name="' + name + '">' + Object.entries(o).filter(([k]) => typeof o[k] === 'string' && k !== 'hint').map(([k, l]) => '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></label>';
        if (type === 'career') return '<label' + wide + '>' + label + '<select name="' + name + '"><option value="">Sin carrera</option>' + W().carrera.map((c) => '<option value="' + c.id + '"' + (String(c.id) === String(v) ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></label>';
        if (type === 'term') { // dos listas: cuatrimestre y año (se guarda como "1er cuatrimestre 2026")
            const y0 = Number(today().slice(0, 4)); const ry = termYear(r); const rh = termHalf(r);
            const years = [...new Set([...Array(9)].map((_, i) => String(y0 - 4 + i)).concat(ry ? [ry] : []))].sort();
            return '<label>' + label + ': cuatrimestre<select name="_half"><option value="">Sin cuatrimestre</option>' + [['1', '1er cuatrimestre'], ['2', '2do cuatrimestre'], ['A', 'Anual']].map(([k, l]) => '<option value="' + k + '"' + (k === rh ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>'
                + '<label>' + label + ': año<select name="_year"><option value="">Sin año</option>' + years.map((y) => '<option' + (y === (ry || (r.id ? '' : String(y0))) ? ' selected' : '') + '>' + y + '</option>').join('') + '<option value="otro">Otro año…</option></select></label>'
                + '<label data-ws-year-other hidden>Escribí el año<input type="text" name="_yearOther" inputmode="numeric" maxlength="4" pattern="(19|20)[0-9]{2}" placeholder="2031"></label>';
        }
        if (type === 'subject') return '<label' + wide + '>' + label + '<select name="' + name + '"><option value="">Sin materia</option>' + W().materia.map((s) => '<option value="' + s.id + '"' + (String(s.id) === String(v) ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></label>';
        if (type === 'text') return '<label' + wide + '>' + label + '<textarea name="' + name + '" rows="3" maxlength="' + o.max + '"' + (o.hint ? ' placeholder="' + esc(o.hint) + '"' : '') + '>' + esc(v) + '</textarea></label>';
        const input = type === 'line' ? 'text' : type;
        return '<label' + wide + '>' + label + '<input type="' + input + '" name="' + name + '" value="' + esc(v) + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.required ? ' required' : '') + (o.hint ? ' placeholder="' + esc(o.hint) + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + '></label>';
    };
    const open = (kind, rec, preset) => {
        const f = FORMS[kind];
        const r = rec || { id: 0, updated: '', ...(preset || {}) };
        editing = { kind, id: r.id || 0, updated: r.updated || '' };
        const d = dialog();
        d.innerHTML = '<form method="dialog" class="task-form ws-form"><div class="task-form-head"><strong>' + (r.id ? 'Editar ' : ['agenda', 'trabajo', 'gasto', 'vencimiento', 'curso', 'salud', 'entreno', 'saludtipo'].includes(kind) ? 'Nuevo ' : 'Nueva ') + f.title + '</strong>'
            + '<button type="button" class="task-icon-btn" data-ws-close aria-label="Cerrar">×</button></div>'
            + '<div class="task-form-body"><div class="task-form-grid">' + f.fields.map(fieldHtml(r)).join('') + '</div></div>'
            + '<div class="task-form-foot">' + (r.id ? '<button type="button" data-ws-delete>Eliminar</button>' : '<span></span>')
            + '<div class="row"><button type="button" data-ws-close>Cancelar</button><button type="submit" class="primary">Guardar</button></div></div></form>';
        if (kind === 'actividad') { // "Inscripta" solo para finales
            const k = d.querySelector('[name="kind"]'); const s = d.querySelector('[name="status"]'); const o = s.querySelector('option[value="inscripta"]');
            const sync = () => { const fin = k.value === 'final'; o.hidden = o.disabled = !fin; if (!fin && s.value === 'inscripta') s.value = 'pendiente'; };
            k.addEventListener('change', sync); sync();
        }
        if (kind === 'entreno') { // "Todos los días" marca o desmarca los siete
            const all = d.querySelector('[data-ws-alldays]'); const boxes = [...d.querySelectorAll('[name="_day"]')];
            all.addEventListener('change', () => boxes.forEach((b) => { b.checked = all.checked; }));
            boxes.forEach((b) => b.addEventListener('change', () => { all.checked = boxes.every((x) => x.checked); }));
            const sp = d.querySelector('[name="_sport"]'); if (r.area) sp.value = sportOf(r);
            const stl = d.querySelector('[name="style"]'); const cur = r.style || '';
            const sync = () => { const opts = SUB[sp.value]; if (!opts) return;
                stl.innerHTML = '<option value="">Sin indicar</option>' + Object.entries(opts).map(([k, l]) => '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + l + '</option>').join('');
                stl.previousSibling.textContent = SUB_LABEL[sp.value]; };
            sp.addEventListener('change', sync); sync();
        }
        if (f.switch) { // campos que dependen de otro (tipo de registro de salud, actividad del entrenamiento)
            const sw = d.querySelector('[name="' + f.switch + '"]');
            const sync = () => { const v = sw.value.startsWith('t:') ? 'otro' : sw.value; // los tipos propios se comportan como "Otro"
                d.querySelectorAll('[data-ws-areas]').forEach((x) => { x.hidden = !x.dataset.wsAreas.split(' ').includes(v); }); };
            sw.addEventListener('change', sync); sync();
            const course = d.querySelector('[name="course"]');
            if (course) { const syncCourse = () => d.querySelectorAll('[data-ws-course]').forEach((x) => { x.hidden = sw.value !== 'medicamento' || course.value !== 'temporal'; });
                sw.addEventListener('change', syncCourse); course.addEventListener('change', syncCourse); syncCourse(); }
        }
        if (kind === 'trabajo') { // los datos del empleo aparecen solo con el tipo "Empleo"; un empleo nuevo arranca como "Activo"
            const k = d.querySelector('[name="kind"]'); const s = d.querySelector('[name="status"]');
            const sync = () => { const job = k.value === 'empleo';
                d.querySelectorAll('[data-ws-job]').forEach((x) => { x.hidden = !job; }); d.querySelectorAll('[data-ws-nojob]').forEach((x) => { x.hidden = job; });
                d.querySelector('[name="date"]').previousSibling.textContent = job ? 'Fecha de inicio' : 'Fecha';
                d.querySelector('[name="title"]').previousSibling.textContent = job ? 'Puesto' : 'Puesto, búsqueda o curso';
                if (!r.id && job && s.value === 'pendiente') s.value = 'activo'; };
            k.addEventListener('change', sync); sync();
        }
        if (kind === 'vencimiento') { // estado: "Pagado o hecho" en los de una vez; "Dado de baja" en los que se repiten (cada mes se paga con el botón de la caja)
            const rp = d.querySelector('[name="repeat"]'); const ds = d.querySelector('[name="done"]');
            const sync = () => { ds.options[0].text = rp.value ? 'Activo' : 'Pendiente'; ds.options[1].text = rp.value ? 'Dado de baja (deja de repetirse y de avisar)' : 'Pagado o hecho'; };
            rp.addEventListener('change', sync); sync();
        }
        if (kind === 'vencimiento') { // el monto es el de un mes: el que se abrió desde Gastos o el actual; los meses anteriores no cambian
            const m = editMonth || today().slice(0, 7); const a = d.querySelector('[name="amount"]');
            a.value = r.id ? (amountFor(r, m) || '') : a.value;
            a.previousSibling.textContent = 'Monto de ' + MONTHS[Number(m.slice(5)) - 1] + ' ' + m.slice(0, 4) + ' (en pesos)';
            editing.month = m;
        }
        if (kind === 'agenda') { // cumpleaños: nombre y fecha de nacimiento; sin hora, lugar ni estado
            const k = d.querySelector('[name="kind"]');
            const uni = k.querySelector('option[value="universidad"]');
            if (r.id) uni.remove(); // un evento ya guardado no se pasa a Estudios
            else k.addEventListener('change', () => { if (k.value !== 'universidad') return; // se guarda en Estudios y aparece en las dos
                const val = (n) => d.querySelector('[name="' + n + '"]').value;
                const pre = { title: val('title'), date: val('date'), time: val('time'), notes: val('notes'), kind: 'tp' };
                d.close(); editing = null; open('actividad', null, pre); });
            const sync = () => { const b = k.value === 'cumpleanos';
                d.querySelectorAll('[data-ws-nobday]').forEach((x) => { x.hidden = b; });
                d.querySelector('[name="date"]').previousSibling.textContent = b ? 'Fecha de nacimiento' : 'Fecha';
                d.querySelector('[name="title"]').previousSibling.textContent = b ? 'Quién' : 'Qué'; };
            k.addEventListener('change', sync); sync();
        }
        const ys = d.querySelector('[name="_year"]'); // "Otro año…": aparece el campo para escribirlo
        if (ys) { const box = d.querySelector('[data-ws-year-other]'); const sync = () => { box.hidden = ys.value !== 'otro'; box.querySelector('input').required = !box.hidden; }; ys.addEventListener('change', sync); sync(); }
        if (d.open) d.close(); // si venía de otra ventana (la info de un cumpleaños), se reemplaza
        d.showModal();
        const first = d.querySelector('input, select, textarea'); if (first) first.focus();
    };
    const close = () => { const d = document.getElementById('ws-dialog'); if (d && d.open) d.close(); editing = null; editMonth = ''; };
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
        if (nw) { const kind = nw.dataset.wsNew; open(kind, null, kind === 'actividad' && st.studySubject ? { subject: st.studySubject } : kind === 'materia' && (st.studyCareer || W().carrera.length === 1) ? { carrera: st.studyCareer || String(W().carrera[0].id) } : kind === 'salud' ? { unit: 'mg' } : kind === 'gasto' ? { date: today(), ...(st.expCat ? { category: st.expCat } : {}) } : null); return; }
        if (e.target.closest('a[href]')) return; // los links de una materia se abren sin abrir la ficha
        // Dashboard: tocar una toma de medicamento la marca como tomada hoy (vuelve a aparecer mañana)
        const bd = e.target.closest('[data-ws-bday]');
        if (bd) { const ids = bd.dataset.wsBday.split(',').map(Number); const people = agendaItems().filter((x) => x.birth && ids.includes(x.id)); if (!people.length) return;
            const d = dialog(); editing = null;
            d.innerHTML = '<div class="task-form ws-form"><div class="task-form-head"><strong>🎂 ' + (people.length === 1 ? 'Cumpleaños' : 'Cumpleaños del día') + '</strong><button type="button" class="task-icon-btn" data-ws-close aria-label="Cerrar">×</button></div><div class="task-form-body">'
                + people.map((p) => { const n = daysTo(p.date); const when = Number(p.date.slice(8)) + ' de ' + MONTHS[Number(p.date.slice(5, 7)) - 1];
                    return '<div class="ws-bday-info"><h3>' + esc(p.title) + '</h3>'
                        + '<p>' + (n === 0 ? '<strong>¡Hoy cumple ' + ageOf(p) + '!</strong>' : ageOf(p) > 0 ? 'Tiene <strong>' + ageNow(p) + (ageNow(p) === 1 ? ' año' : ' años') + '</strong> · cumple ' + ageOf(p) + ' el ' + when : 'Cumple el ' + when) + (n > 0 ? ' (' + (n === 1 ? 'mañana' : 'faltan ' + n + ' días') + ')' : '') + '</p>'
                        + '<p class="small muted">Nació el ' + Number(p.birth.slice(8)) + '/' + Number(p.birth.slice(5, 7)) + '/' + p.birth.slice(0, 4) + '</p>' + notesHtml(p.notes)
                        + '<button type="button" data-ws-open="agenda:' + p.id + '">Editar</button></div>'; }).join('')
                + '</div></div>';
            d.showModal(); return; }
        const tk = e.target.closest('[data-ws-take]');
        if (tk && tk.dataset.wsTake.startsWith('agenda:')) { const rec = W().agenda.find((x) => x.id === Number(tk.dataset.wsTake.slice(7))); if (!rec) return;
            send({ action: 'save', kind: 'agenda', id: rec.id, updated: rec.updated || '', item: { ...rec, done: 'si' } }, '✓ Listo: ' + rec.title); return; }
        if (tk) { const [hid, at] = tk.dataset.wsTake.split('|'); const rec = W().salud.find((x) => x.id === Number(hid)); if (!rec) return;
            const key = today() + ' ' + at; const keep = String(rec.taken || '').split(';').filter((x) => x && x >= addDays(today(), -7)); // solo la última semana
            send({ action: 'save', kind: 'salud', id: rec.id, updated: rec.updated || '', item: { ...rec, taken: keep.concat(key).join(';') } }, '💊 Listo: ' + rec.title + ' tomado'); return; }
        const tr = e.target.closest('[data-ws-train]');
        if (tr) { const [tid, tday] = tr.dataset.wsTrain.split('|'); const rec = W().entreno.find((x) => x.id === Number(tid)); if (!rec) return; const t = tday || today();
            const on = !logOf(rec).includes(t); const dates = (on ? logOf(rec).concat(t) : logOf(rec).filter((x) => x !== t)).sort().slice(-300);
            send({ action: 'save', kind: 'entreno', id: rec.id, updated: rec.updated || '', item: { ...rec, log: dates.join(';') } }, on ? '¡Bien! Quedó anotado' : 'Desmarcado'); return; }
        const pay = e.target.closest('[data-ws-pay]');
        if (pay) { const [id, day] = pay.dataset.wsPay.split('|'); const rec = W().vencimiento.find((x) => x.id === Number(id)); if (!rec) return;
            const on = !isPaid(rec, day); const dates = (on ? paidOf(rec).concat(day) : paidOf(rec).filter((x) => x !== day)).sort().slice(-60);
            const item = { ...rec, paid: dates.join(';') }; if (!rec.repeat) item.done = on ? 'si' : 'no';
            send({ action: 'save', kind: 'vencimiento', id: rec.id, updated: rec.updated || '', item }, on ? 'Marcado como pagado' : 'Pago desmarcado'); return; }
        const op = e.target.closest('[data-ws-open]');
        if (op) { const [kind, id] = op.dataset.wsOpen.split(':'); const rec = W()[kind].find((x) => x.id === Number(id)); editMonth = op.dataset.wsMonth || ''; if (rec) open(kind, rec); return; }
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
        const prev = editing.id ? (W()[editing.kind] || []).find((x) => x.id === editing.id) : null;
        const item = { ...(prev || {}), ...Object.fromEntries(new FormData(e.target)) };
        if (e.target.querySelector('[name="_day"]')) { item.days = new FormData(e.target).getAll('_day').join(','); item.weekday = ''; delete item._day; }
        if (editing.kind === 'salud') { if (String(item.kind || '').startsWith('t:')) { item.subtype = item.kind.slice(2); item.kind = 'otro'; } else item.subtype = ''; }
        if ('_sport' in item) { if (item._sport !== 'gym') item.area = item._sport; if (!SUB[item._sport]) item.style = ''; delete item._sport; } // fuera del gimnasio, la actividad va en "area"
        if ('_year' in item) { const y = item._year === 'otro' ? String(item._yearOther || '').trim() : item._year; item.term = termText(item._half, /^(19|20)\d{2}$/.test(y) ? y : '').trim(); delete item._half; delete item._year; delete item._yearOther; }
        if (editing.kind === 'curso') { st.studyTab = 'carreras'; if (st.studyGroup === 'carreras') st.studyGroup = 'todos'; } // para ver el curso recién guardado
        if (editing.kind === 'vencimiento') { // guarda el monto en el historial desde ese mes, sin cambiar los anteriores
            const rec = W().vencimiento.find((x) => x.id === editing.id); const m = editing.month || today().slice(0, 7);
            const h = rec ? amountsOf(rec) : {};
            if (rec && !Object.keys(h).length && money(rec.amount) !== null) h[(rec.date || m).slice(0, 7) < m ? rec.date.slice(0, 7) : m] = rec.amount; // lo que había, desde el principio
            const before = rec ? amountFor(rec, m) : '';
            if (String(item.amount || '') !== String(before || '')) {
                const next = monthAfter(m);
                if (rec && m < today().slice(0, 7) && !(next in h) && Object.keys(h).length) h[next] = amountFor({ amounts: Object.entries(h).map((x) => x.join('=')).join(';') }, next); // corregir un mes pasado no cambia los siguientes
                if (money(item.amount) !== null) h[m] = item.amount; else if (m in h) delete h[m];
            }
            const keys = Object.keys(h).sort();
            item.amounts = keys.map((k) => k + '=' + h[k]).join(';');
            item.amount = keys.length ? h[keys[keys.length - 1]] : item.amount; // el más reciente
        }
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
            w.salud.filter((h) => hit(h.title, h.specialty, h.doctor, h.notes, h.result)).forEach((h) => out.push({ go: 'salud|salud:' + h.id, title: (h.kind === 'medicamento' ? '💊 ' : '🩺 ') + h.title, sub: typeLabel(h) + (h.doctor ? ' · ' + h.doctor : ''), scope: 'personal' }));
            w.entreno.filter((r) => hit(r.exercise, TRAIN_AREA[r.area], r.notes)).forEach((r) => out.push({ go: 'entrenamiento|entreno:' + r.id, title: '🏋️ ' + (r.exercise || TRAIN_AREA[r.area]), sub: 'Entrenamiento · ' + (TRAIN_AREA[r.area] || ''), scope: 'personal' }));
            w.curso.filter((c) => hit(c.name, c.institution, c.notes)).forEach((c) => out.push({ go: 'estudios|curso:' + c.id, title: '🎓 ' + c.name, sub: 'Curso' + (c.institution ? ' · ' + c.institution : ''), scope: 'estudios' }));
            w.actividad.filter((a) => hit(a.title, a.notes, subjectName(a.subject))).forEach((a) => out.push({ go: 'estudios|actividad:' + a.id, title: '📝 ' + a.title, sub: (ACT_KIND[a.kind] || '') + (subjectName(a.subject) ? ' · ' + subjectName(a.subject) : '') + (a.date ? ' · ' + fshort(a.date) : ''), scope: 'estudios' }));
            w.trabajo.filter((j) => hit(j.title, j.company, j.contact, j.notes, j.address, j.functions)).forEach((j) => out.push({ go: 'trabajo|trabajo:' + j.id, title: '💼 ' + j.title, sub: (JOB_KIND[j.kind] || '') + (j.company ? ' · ' + j.company : ''), scope: 'trabajo' }));
            return out;
        },
        badges,
        // Para el Dashboard: lo personal con fecha (agenda pendiente desde hoy, actividades y trabajo abiertos)
        upcoming: () => {
            const t = today(); const w = W(); const out = [];
            agendaItems().filter((e) => e.done !== 'si' && e.date && e.date >= t).forEach((e) => out.push({ ...(e.date === t && !e.birth ? { take: 'agenda:' + e.id, takeText: 'Tocá cuando lo hagas' } : {}), section: 'Agenda', text: e.birth ? '🎂 ' + e.title + (ageOf(e) > 0 ? ' cumple ' + ageOf(e) + ' años' : ' cumple años') : (AGENDA_KIND[e.kind] && e.kind !== 'evento' ? AGENDA_KIND[e.kind] + ': ' : '') + e.title + (e.place ? ' · ' + e.place : ''), date: e.date, time: e.time || '', scope: 'personal', go: 'mi-agenda', noPast: true }));
            // Medicamentos con recordatorio: cada toma del día (los de "por un tiempo", solo entre su desde y hasta)
            w.salud.filter((h) => h.kind === 'medicamento' && h.status !== 'finalizado' && h.remind === 'si' && (h.course !== 'temporal' || ((!h.start || h.start <= t) && (!h.end || h.end >= t))))
                .forEach((h) => String(h.hours || '').split(/\s*(?:,|;|\/|\by\b)\s*/).map((x) => x.trim()).filter(Boolean)
                    .filter((x) => !String(h.taken || '').split(';').includes(t + ' ' + x)) // la que ya se tomó hoy no aparece
                    .forEach((x) => out.push({ section: 'Salud', text: '💊 Tomar ' + h.title + (doseText(h) ? ' ' + doseText(h) : ''), date: t, time: x, scope: 'personal', go: 'salud', take: h.id + '|' + x })));
            w.salud.filter((h) => h.kind !== 'medicamento' && h.date && h.date >= t).forEach((h) => out.push({ section: 'Salud', text: typeLabel(h) + ': ' + h.title + (h.doctor ? ' · ' + h.doctor : ''), date: h.date, time: h.time || '', scope: 'personal', go: 'salud', noPast: true }));
            w.vencimiento.filter((v) => v.done !== 'si' && v.date && !isPaid(v, dueOf(v))).forEach((v) => out.push({ section: 'Vencimientos', text: (DL_KIND[v.kind] && v.kind !== 'otro' ? DL_KIND[v.kind] + ': ' : '') + v.title, date: dueOf(v), time: v.time || '', scope: 'personal', go: 'vencimientos' }));
            w.actividad.filter((a) => ACT_OPEN.includes(actStatus(a)) && a.date).forEach((a) => out.push({ section: 'Estudios', text: (ACT_KIND[a.kind] || '') + ': ' + a.title + (subjectName(a.subject) ? ' · ' + subjectName(a.subject) : ''), date: a.date, time: a.time || '', scope: 'estudios', go: 'estudios' }));
            w.trabajo.filter((j) => JOB_OPEN.includes(j.status) && j.date && j.kind !== 'empleo').forEach((j) => out.push({ section: 'Trabajo', text: (JOB_KIND[j.kind] || '') + ': ' + j.title + (j.company ? ' · ' + j.company : ''), date: j.date, time: j.time || '', scope: 'trabajo', go: 'trabajo' }));
            return out;
        },
        // Resumen para las tarjetas del Dashboard personal
        summary: () => {
            const t = today(); const week = addDays(t, 7); const w = W();
            return {
                agenda: agendaItems().filter((e) => e.done !== 'si' && e.date && e.date >= t && e.date <= week).length,
                materias: w.materia.filter((s) => ['inscripta', 'cursando'].includes(s.status)).length,
                entregas: w.actividad.filter((a) => ACT_OPEN.includes(actStatus(a)) && a.date && a.date <= week).length,
                trabajo: w.trabajo.filter((j) => JOB_OPEN.includes(j.status)).length,
            };
        },
    };
})();
