// Niveles de acceso del panel, en un solo lugar.
//   Nivel 1: sesión abierta con la clave del panel (ADMIN_CLAVE).
//   Nivel 2: nivel 1 + segundo factor (passkey, TOTP o código de recuperación).
//
// Hoy NO existe ninguna forma de obtener el nivel 2: el segundo factor llega en la entrega 1.6 de JNB Workspace.
// Por eso toda ruta de ROUTE_LEVELS con nivel 2 responde 403 a cualquier sesión. Este archivo no tiene
// atajos ni permisos de prueba: las pruebas locales simulan el nivel 2 desde fuera del repositorio.
//
// Integración prevista en la entrega 1.6:
//   1. admin_sessions guarda el nivel de cada sesión (columna "level") y el momento en que se verificó el segundo factor.
//   2. Al verificar la passkey / TOTP / código, el servidor sube esa sesión a nivel 2 (nunca el navegador).
//   3. sessionLevelFromRow() deja de devolver siempre 1 y pasa a leer ese nivel (con su vencimiento).
//   4. adminGate() no cambia: ya usa requiredLevel() y sessionLevel() para todas las rutas.

export const LEVEL_KEY = 1;
export const LEVEL_SECOND_FACTOR = 2;

// Rutas que exigen más que la clave. Se comparan sin barras finales y para cualquier método.
export const ROUTE_LEVELS = [
  { path: '/api/admin/copia-completa', level: LEVEL_SECOND_FACTOR }, // copia completa (incluye datos personales)
];

const normalize = (path) => String(path || '').replace(/\/+$/, '') || '/';

export function requiredLevel(path) {
  const p = normalize(path);
  let level = LEVEL_KEY;
  for (const r of ROUTE_LEVELS) if (p === r.path || p.startsWith(r.path + '/')) level = Math.max(level, r.level);
  return level;
}

// Nivel de una sesión válida según su fila en admin_sessions. Hasta la entrega 1.6 siempre es 1.
export function sessionLevelFromRow(_row) {
  return LEVEL_KEY;
}

// El nivel que adminGate() comprobó para este pedido (0 si no pasó por el control)
const verified = new WeakMap();
export function markVerified(request, level) {
  verified.set(request, level);
}
export function sessionLevel(request) {
  return verified.get(request) || 0;
}
