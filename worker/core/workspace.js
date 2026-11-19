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
  // Carreras (puede haber varias en simultáneo). total: materias del plan; promo y aprueba: notas mínimas (vacío = 7 y 4)
  carrera: { table: 'ws_careers', required: 'name', fields: {
    name: ['line', 160], institution: ['line', 160], total: ['line', 4], promo: ['line', 5], aprueba: ['line', 5],
    status: [['cursando', 'pausada', 'finalizada']], notes: ['text', 2000],
  } },
  // Materias: inscripción, cursada y notas (parciales, recuperatorio y final). Los TPs son actividades de tipo "tp".
  materia: { table: 'ws_subjects', required: 'name', fields: {
    name: ['line', 160], carrera: ['ref'], term: ['line', 80], schedule: ['line', 200], teacher: ['line', 160],
    status: [['inscripta', 'cursando', 'regular', 'promocionada', 'aprobada', 'libre', 'abandonada', 'pendiente']],
    p1: ['line', 10], p2: ['line', 10], recup: ['line', 10], final: ['line', 10], notes: ['text', 2000],
  } },
  actividad: { table: 'ws_study_items', required: 'title', fields: {
    title: ['line', 160], subject: ['ref'], kind: [['tp', 'parcial', 'final', 'recuperatorio', 'entrega', 'fecha']],
    date: ['date'], time: ['time'], status: [['pendiente', 'inscripta', 'en-curso', 'entregado', 'aprobado', 'desaprobado']],
    grade: ['line', 10], result: [['', 'aprobado', 'desaprobado']], notes: ['text', 2000],
  } },
  trabajo: { table: 'ws_jobs', required: 'title', fields: {
    kind: [['postulacion', 'entrevista', 'empleo', 'capacitacion']], title: ['line', 160], company: ['line', 160],
    date: ['date'], time: ['time'],
    status: [['pendiente', 'enviada', 'en-proceso', 'aceptada', 'rechazada', 'activo', 'finalizado']],
    contact: ['line', 200], url: ['url'], notes: ['text', 2000],
  } },
};

export const WS_TABLES = Object.values(WS).map((s) => s.table);
