// Qué entra en la copia comercial (JNB) del panel.
// Toda tabla de la base y toda clave de "settings" tiene que estar clasificada acá. Si aparece una sin clasificar,
// la copia no se genera (así nada nuevo se cuela por accidente en un mail o una descarga).

// Ámbitos de tareas que pertenecen al espacio Personal: nunca van en la copia JNB
export const PERSONAL_SCOPES = ['personal', 'estudios', 'trabajo', 'tramites', 'otros'];

// Tablas comerciales que van completas
export const JNB_INCLUDE = [
  'inquiries', 'invitations', 'clients', 'projects', 'project_events', 'payments', 'briefs',
  'brief_files', // solo los datos de cada archivo (nombre, tamaño); el contenido está en brief_chunks, que no va
  'coupons', 'reviews', 'renewals', 'quote_features', 'giveaways', 'giveaway_winners', 'giveaway_events',
  'mk_posts', 'mk_articles', 'mk_ideas',
];

// Tablas que van filtradas (ver jnbRows)
export const JNB_FILTER = ['tasks', 'task_categories', 'settings'];

// Tablas que nunca van en la copia JNB
export const JNB_EXCLUDE = ['brief_chunks', 'admin_sessions', 'rate_limits', 'security_log', 'change_log',
  // Espacio Personal (worker/core/workspace.js): Agenda, materias, actividades de estudio y Trabajo. Solo van en la copia completa cifrada.
  'ws_agenda', 'ws_subjects', 'ws_study_items', 'ws_jobs',
];

// Claves de "settings" que van en la copia JNB
export const JNB_SETTINGS_INCLUDE = [
  'availability', 'horario', 'monotributo', 'noDuplicados', 'seqProyecto', 'copiaMail',
  'cotizadorSeed', 'cotizadorTr', 'cotizadorDolar', 'cotizadorHora', 'marketingSeed', 'tareasCategorias', 'sorteoBorrador2026',
];

// Claves de "settings" que no van: el ámbito por defecto de las tareas (puede ser personal) y el último error de Resend
export const JNB_SETTINGS_EXCLUDE = ['tareasAmbito', 'mailError'];

export class UnclassifiedError extends Error {
  constructor(kind, name) {
    super(`${kind} sin clasificar: ${name}`);
    this.kind = kind;
    this.item = name;
  }
}

const known = new Set([...JNB_INCLUDE, ...JNB_FILTER, ...JNB_EXCLUDE]);

// Una tarea entra solo si su ámbito es exactamente "jnb" (cualquier otro valor, vacío o desconocido, queda afuera)
export const isJnbTask = (task) => task && task.scope === 'jnb';

// Categorías que entran: las que usa alguna tarea JNB o las que no usa ninguna tarea personal
export function jnbCategoryIds(categories, tasks) {
  const byJnb = new Set();
  const byPersonal = new Set();
  for (const t of tasks) {
    if (t.category == null) continue;
    (isJnbTask(t) ? byJnb : byPersonal).add(t.category);
  }
  return new Set(categories.filter((c) => byJnb.has(c.id) || !byPersonal.has(c.id)).map((c) => c.id));
}

// Revisa que todas las tablas y claves estén clasificadas. Si no, lanza UnclassifiedError.
export function checkClassified(tableNames, settingsKeys) {
  for (const name of tableNames) if (!known.has(name)) throw new UnclassifiedError('tabla', name);
  const keys = new Set([...JNB_SETTINGS_INCLUDE, ...JNB_SETTINGS_EXCLUDE]);
  for (const key of settingsKeys) if (!keys.has(key)) throw new UnclassifiedError('clave', key);
}

// Arma la copia JNB. readAll(nombre) devuelve todas las filas de una tabla.
export function buildJnbCopy(tableNames, readAll) {
  const settings = tableNames.includes('settings') ? readAll('settings') : [];
  checkClassified(tableNames, settings.map((s) => s.key));
  const tasks = tableNames.includes('tasks') ? readAll('tasks') : [];
  const out = { formato: 'jnb', version: 1, created: new Date().toISOString(), tables: {} };
  for (const name of JNB_INCLUDE) if (tableNames.includes(name)) out.tables[name] = readAll(name);
  if (tableNames.includes('tasks')) out.tables.tasks = tasks.filter(isJnbTask);
  if (tableNames.includes('task_categories')) {
    const categories = readAll('task_categories');
    const ids = jnbCategoryIds(categories, tasks);
    out.tables.task_categories = categories.filter((c) => ids.has(c.id));
  }
  if (tableNames.includes('settings')) out.tables.settings = settings.filter((s) => JNB_SETTINGS_INCLUDE.includes(s.key));
  return out;
}

// Deja en una copia (nueva o vieja) solo lo que la política JNB permite restaurar
export function jnbPartOfCopy(tables) {
  const out = {};
  for (const name of JNB_INCLUDE) if (Array.isArray(tables[name])) out[name] = tables[name];
  const tasks = Array.isArray(tables.tasks) ? tables.tasks : [];
  if (Array.isArray(tables.tasks)) out.tasks = tasks.filter(isJnbTask);
  if (Array.isArray(tables.task_categories)) {
    const ids = jnbCategoryIds(tables.task_categories, tasks);
    out.task_categories = tables.task_categories.filter((c) => ids.has(c.id));
  }
  if (Array.isArray(tables.settings)) out.settings = tables.settings.filter((s) => s && JNB_SETTINGS_INCLUDE.includes(s.key));
  return out;
}
