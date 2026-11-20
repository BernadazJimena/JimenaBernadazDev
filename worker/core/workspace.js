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
    kind: [['evento', 'turno', 'reunion', 'recordatorio', 'otro', 'cumpleanos']], // cumpleanos: date es la fecha de nacimiento y se repite todos los años
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
    // Código de la materia y correlativas (códigos separados por coma): para cursar alcanza con regularizarlas; para rendir el final, aprobadas
    code: ['line', 20], corrCursar: ['line', 300], corrRendir: ['line', 300],
    // Links de la materia
    aula: ['url'], drive: ['url'], apuntes: ['url'], whatsapp: ['url'],
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
    // Datos del empleo (tipo "empleo"): fecha de fin, dirección, días y horario, contratación, cómo cobra y funciones (como en un CV)
    end: ['date'], address: ['line', 200], days: ['line', 120], hours: ['line', 80],
    contract: [['', 'indeterminado', 'plazo-fijo', 'temporada', 'eventual', 'pasantia', 'por-proyecto', 'otro']],
    regime: [['', 'dependencia', 'monotributo', 'responsable-inscripto', 'informal']], functions: ['text', 3000],
  } },
  // Gastos personales (en pesos), separados de los números de JNB
  gasto: { table: 'ws_expenses', required: 'concept', fields: {
    date: ['date'], concept: ['line', 160], amount: ['line', 20],
    category: [['otros', 'super', 'comida', 'transporte', 'servicios', 'alquiler', 'salud', 'estudio', 'ocio', 'ropa', 'regalos', 'impuestos']],
    method: [['', 'efectivo', 'debito', 'credito', 'transferencia', 'mercadopago']], notes: ['text', 2000],
  } },
  // Vencimientos personales (DNI, carnet, seguro, turnos): aviso por mail "notice" días antes (vacío = 7).
  // repeat: '' (una vez), 'mensual' o 'anual'; los que se repiten pasan solos a la próxima fecha (nextDue)
  vencimiento: { table: 'ws_deadlines', required: 'title', fields: {
    title: ['line', 160], kind: [['documento', 'turno', 'seguro', 'impuesto', 'servicio', 'cuota', 'otro']],
    date: ['date'], time: ['time'], notice: ['line', 3], place: ['line', 160], done: [['no', 'si']], notes: ['text', 2000],
    repeat: [['', 'mensual', 'anual']],
  } },
  // Metas: avance a mano o calculado desde Estudios (materias aprobadas o promedio del período "term")
  meta: { table: 'ws_goals', required: 'title', fields: {
    title: ['line', 160], term: ['line', 80], deadline: ['date'], auto: [['', 'materias', 'promedio']],
    target: ['line', 10], progress: ['line', 10], status: [['en-curso', 'cumplida', 'abandonada']], notes: ['text', 2000],
  } },
};

// Próxima fecha de un vencimiento que se repite: el mismo día de cada mes (o de cada año) desde la fecha cargada.
// Si el mes es más corto (un 31 en abril), queda el último día del mes. Sin repetición devuelve la fecha tal cual.
export function nextDue(date, repeat, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !['mensual', 'anual'].includes(repeat)) return date || '';
  const day = Number(date.slice(8));
  let y = Number(date.slice(0, 4)); let m = Number(date.slice(5, 7));
  const make = () => `${y}-${String(m).padStart(2, '0')}-${String(Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, '0')}`;
  let d = make();
  for (let i = 0; d < today && i < 1200; i++) { if (repeat === 'anual') y++; else if (++m > 12) { m = 1; y++; } d = make(); }
  return d;
}

export const WS_TABLES = Object.values(WS).map((s) => s.table);
