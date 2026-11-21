// Registro de módulos del panel (JNB Workspace). El menú lateral, las secciones nuevas y la lista de direcciones (#modulo)
// se arman desde acá: para sumar un módulo se agrega una línea, sin tocar el HTML del menú.
//   id:     dirección del módulo (#id) y su sección (id="m-<id>")
//   space:  'todo' (se ve siempre), 'jnb' (comercial: se oculta en Personal) o 'personal' (se oculta en JNB)
//   badge:  si muestra el contador del menú (id="n-<id>")
//   level:  nivel de sesión que exige (1 = clave; 2 = segundo factor, todavía no existe)
//   status: 'activo' u 'oculto' (los ocultos no aparecen en el menú)
//   section: true si su <section> se crea desde el registro (los módulos comerciales ya tienen la suya en el HTML)
export const GROUPS = [
  { name: 'General', space: 'todo' },
  { name: 'Personal', space: 'personal' },
  { name: 'Comercial', space: 'jnb' },
  { name: 'Marketing y comunicación', space: 'jnb' },
  { name: 'Gestión y seguimiento', space: 'jnb' },
  { name: 'Servicios y cotización', space: 'jnb' },
  { name: 'Sitio web', space: 'jnb' },
  { name: 'Configuración', space: 'todo' },
];

const m = (id, label, icon, group, space, extra = {}) => ({ id, label, icon, group, space, badge: false, level: 1, status: 'activo', section: false, ...extra });

export const MODULES = [
  m('dashboard', 'Dashboard', 'dashboard', 'General', 'todo'),
  m('tareas', 'Gestor de tareas', 'kanban', 'General', 'todo', { badge: true }),
  m('mi-agenda', 'Agenda', 'calendar', 'Personal', 'personal', { badge: true, section: true }),
  m('estudios', 'Estudios', 'book', 'Personal', 'personal', { badge: true, section: true }),
  m('trabajo', 'Trabajo', 'briefcase', 'Personal', 'personal', { badge: true, section: true }),
  m('gastos', 'Gastos', 'card', 'Personal', 'personal', { section: true }),
  m('vencimientos', 'Vencimientos', 'clock', 'Personal', 'personal', { badge: true, section: true }),
  m('metas', 'Metas', 'star', 'Personal', 'personal', { section: true }),
  m('salud', 'Salud', 'heart', 'Personal', 'personal', { section: true }),
  m('entrenamiento', 'Entrenamiento', 'activity', 'Personal', 'personal', { section: true }),
  m('clientes', 'Clientes', 'users', 'Comercial', 'jnb', { badge: true }),
  m('consultas', 'Consultas', 'mail', 'Comercial', 'jnb', { badge: true }),
  m('presupuestos', 'Presupuestos', 'file', 'Comercial', 'jnb', { badge: true }),
  m('proyectos', 'Proyectos', 'folder', 'Comercial', 'jnb', { badge: true }),
  m('pagos', 'Pagos', 'card', 'Comercial', 'jnb', { badge: true }),
  m('marketing', 'Marketing Digital', 'megaphone', 'Marketing y comunicación', 'jnb', { badge: true }),
  m('sorteos', 'Sorteos de Instagram', 'gift', 'Marketing y comunicación', 'jnb', { badge: true }),
  m('cupones', 'Cupones', 'ticket', 'Marketing y comunicación', 'jnb', { badge: true }),
  m('newsletter', 'Newsletter', 'news', 'Marketing y comunicación', 'jnb', { badge: true }),
  m('numeros', 'Ingresos y origen', 'dashboard', 'Marketing y comunicación', 'jnb'),
  m('resenas', 'Reseñas', 'star', 'Marketing y comunicación', 'jnb', { badge: true }),
  m('brief', 'Brief', 'file', 'Gestión y seguimiento', 'jnb'),
  m('agenda', 'Plazos y vencimientos', 'clock', 'Gestión y seguimiento', 'jnb', { badge: true }),
  m('cotizador', 'Funcionalidades y cotizador', 'card', 'Servicios y cotización', 'jnb'),
  m('cartel', 'Cartel del inicio', 'megaphone', 'Sitio web', 'jnb'),
  m('horario', 'Horario de atención', 'clock', 'Sitio web', 'jnb'),
  m('faq', 'Preguntas frecuentes', 'help', 'Sitio web', 'jnb'),
  m('config', 'Configuración', 'settings', 'Configuración', 'todo', { badge: true }),
];

const attr = (space) => (space === 'todo' ? '' : ` data-space-only="${space}"`);

// Menú lateral (mismo HTML que tenía escrito a mano)
export function navHtml() {
  return GROUPS.map((g) => {
    const items = MODULES.filter((x) => x.group === g.name && x.status === 'activo');
    if (!items.length) return '';
    return `          <p class="side-group"${attr(g.space)}>${g.name}</p>\n` + items.map((x) => `          <a${attr(x.space)} href="#${x.id}" data-mod="${x.id}"><svg class="ico" aria-hidden="true"><use href="#i-${x.icon}"/></svg><span class="side-label">${x.label}</span>${x.badge ? `<span class="badge" id="n-${x.id}"${x.id === 'tareas' ? ' title=""' : ''}></span>` : ''}</a>\n`).join('');
  }).join('');
}

// Secciones de los módulos que se crean desde el registro
export const sectionsHtml = () => MODULES.filter((x) => x.section).map((x) => `        <section class="module" id="m-${x.id}" hidden></section>\n`).join('');

// Para el JavaScript del panel: id → espacio, en el orden del menú
export const moduleSpaces = () => Object.fromEntries(MODULES.map((x) => [x.id, x.space]));
