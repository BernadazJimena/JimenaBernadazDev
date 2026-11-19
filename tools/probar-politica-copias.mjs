#!/usr/bin/env node
// Pruebas de la política de copias (worker/core/backup-policy.js) con datos inventados:
// lo personal (tareas de otros ámbitos y tablas del espacio Personal) nunca entra en la copia JNB.
// Uso: node tools/probar-politica-copias.mjs
import { buildJnbCopy, jnbPartOfCopy, JNB_INCLUDE, JNB_FILTER, JNB_EXCLUDE, PERSONAL_SCOPES, UnclassifiedError } from '../worker/core/backup-policy.js';
import { WS_TABLES } from '../worker/core/workspace.js';

let failed = 0;
const ok = (cond, name) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed++; };

ok(WS_TABLES.every((t) => JNB_EXCLUDE.includes(t)), 'todas las tablas del espacio Personal están excluidas de la copia JNB');
ok(!WS_TABLES.some((t) => JNB_INCLUDE.includes(t) || JNB_FILTER.includes(t)), 'ninguna tabla personal figura como incluida o filtrada');

const tables = [...JNB_INCLUDE, ...JNB_FILTER, ...JNB_EXCLUDE];
const tasks = [{ id: 1, scope: 'jnb', title: 'JNB' }, ...PERSONAL_SCOPES.map((sc, i) => ({ id: i + 2, scope: sc, title: 'CANARIO-' + sc, category: 9 }))];
const read = (name) => (name === 'tasks' ? tasks : name === 'settings' ? [{ key: 'horario', value: '{}' }, { key: 'tareasAmbito', value: 'personal' }]
  : name === 'task_categories' ? [{ id: 1, name: 'Diseño' }, { id: 9, name: 'CANARIO-categoria' }] : [{ id: 1, title: 'CANARIO-' + name }]);
const copy = buildJnbCopy(tables, read);
const text = JSON.stringify(copy);
ok(!/CANARIO-(personal|estudios|trabajo|tramites|otros|categoria|ws_)/.test(text), 'la copia JNB no tiene tareas, categorías ni registros personales');
ok(Object.keys(copy.tables).sort().join() === [...JNB_INCLUDE, ...JNB_FILTER].sort().join(), 'la copia JNB tiene exactamente las tablas permitidas');
ok(copy.tables.tasks.length === 1 && copy.tables.tasks[0].scope === 'jnb', 'solo entran tareas con ámbito exactamente "jnb"');
ok(!copy.tables.settings.some((s) => s.key === 'tareasAmbito'), 'no entra el ámbito por defecto de las tareas');

const old = jnbPartOfCopy({ tasks, ws_agenda: [{ id: 1, title: 'CANARIO-ws_agenda' }], clients: [{ id: 1 }] });
ok(!('ws_agenda' in old) && old.tasks.length === 1, 'restaurar una copia vieja completa solo toma la parte JNB');

let threw = false;
try { buildJnbCopy([...tables, 'tabla_nueva'], read); } catch (e) { threw = e instanceof UnclassifiedError; }
ok(threw, 'una tabla nueva sin clasificar frena la copia');

console.log(failed ? `\n✘ ${failed} prueba(s) fallaron` : '\n✓ Todas las pruebas pasaron');
process.exit(failed ? 1 : 0);
