// Módulos del espacio Personal de JNB Workspace: Agenda, Estudios y Trabajo.
// Mismo formato que los módulos de Marketing (MK en worker/studio.js): cada tipo tiene su tabla, el campo obligatorio
// y los campos con su validación. Las tablas se crean solas en StudioData y son PERSONALES:
// worker/core/backup-policy.js las deja fuera de la copia JNB (solo van en la copia completa cifrada).
//
// Tipos de campo: 'line' (una línea, con largo máximo), 'text' (varias líneas), 'date' (AAAA-MM-DD), 'time' (HH:MM),
// 'url' (http/https), 'ref' (id numérico de otro registro o vacío) y una lista de opciones (la primera es la de por defecto).
export const WS = {
  agenda: { table: 'ws_agenda', required: 'title', fields: {
    title: ['line', 160], date: ['date'], time: ['time'], end: ['time'],
    kind: [['evento', 'turno', 'reunion', 'recordatorio', 'otro']],
    place: ['line', 160], notes: ['text', 2000], done: [['no', 'si']],
  } },
  materia: { table: 'ws_subjects', required: 'name', fields: {
    name: ['line', 160], career: ['line', 160], term: ['line', 80], schedule: ['line', 200], teacher: ['line', 160],
    status: [['cursando', 'pendiente', 'regular', 'aprobada', 'libre', 'abandonada']], grade: ['line', 10], notes: ['text', 2000],
  } },
  actividad: { table: 'ws_study_items', required: 'title', fields: {
    title: ['line', 160], subject: ['ref'], kind: [['tp', 'parcial', 'final', 'recuperatorio', 'entrega', 'fecha']],
    date: ['date'], time: ['time'], status: [['pendiente', 'en-curso', 'entregado', 'aprobado', 'desaprobado']],
    grade: ['line', 10], notes: ['text', 2000],
  } },
  trabajo: { table: 'ws_jobs', required: 'title', fields: {
    kind: [['postulacion', 'entrevista', 'empleo', 'capacitacion']], title: ['line', 160], company: ['line', 160],
    date: ['date'], time: ['time'],
    status: [['pendiente', 'enviada', 'en-proceso', 'aceptada', 'rechazada', 'activo', 'finalizado']],
    contact: ['line', 200], url: ['url'], notes: ['text', 2000],
  } },
};

export const WS_TABLES = Object.values(WS).map((s) => s.table);
