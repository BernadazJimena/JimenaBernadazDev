#!/usr/bin/env node
// Pruebas del formato "jnb-completa-cifrada" v1: cifra con js/backup-crypto.js (lo que usa el panel) y descifra
// tanto con ese módulo como con el descifrador independiente (tools/descifrar-copia.html). Solo usa datos inventados.
// Uso: node tools/probar-copia-cifrada.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
createRequire(import.meta.url)(join(ROOT, 'js', 'backup-crypto.js'));
const C = globalThis.JNBCopiaCifrada;
const html = readFileSync(join(ROOT, 'tools', 'descifrar-copia.html'), 'utf8');
const src = html.slice(html.indexOf('// <descifrar>'), html.indexOf('// </descifrar>'));
const descifrarCopia = new Function(`${src}; return descifrarCopia;`)();

let failed = 0;
const ok = (cond, name) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed++; };
const rejects = async (p, code, name) => { try { await p; ok(false, `${name} (no falló)`); } catch (e) { ok(e.message === code, `${name} → ${e.message}`); } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const b64flip = (b64, at) => { const bin = Buffer.from(b64, 'base64'); bin[at] ^= 1; return bin.toString('base64'); };

const FRASE = 'una frase de prueba larga';
const copia = { formato: 'jnb-completa', version: 1, created: '2026-11-18T12:00:00.000Z', tables: {
  tasks: [{ id: 1, scope: 'jnb', title: 'CANARIO-jnb' }, { id: 2, scope: 'personal', title: 'CANARIO-personal ñandú ✓' }],
  settings: [{ key: 'tareasAmbito', value: 'personal' }],
} };
const plano = JSON.stringify(copia);

const t0 = Date.now();
const file = await C.encryptBackup(plano, FRASE);
console.log(`(cifrar: ${Date.now() - t0} ms)`);
ok(file.formato === 'jnb-completa-cifrada' && file.version === 1, 'formato y versión');
ok(file.kdf.nombre === 'PBKDF2' && file.kdf.hash === 'SHA-256' && file.kdf.iteraciones === 600000, 'PBKDF2-SHA-256 con 600.000 iteraciones');
ok(Buffer.from(file.kdf.salt, 'base64').length === 16, 'salt aleatorio de 16 bytes');
ok(file.cifrado.nombre === 'AES-GCM' && file.cifrado.largoClave === 256 && file.cifrado.etiquetaBits === 128, 'AES-256-GCM con etiqueta de 128 bits');
ok(Buffer.from(file.cifrado.iv, 'base64').length === 12, 'IV aleatorio de 12 bytes');
ok(!JSON.stringify(file).includes('CANARIO') && !JSON.stringify(file).includes(FRASE), 'el archivo no deja ver el contenido ni la frase');
const file2 = await C.encryptBackup(plano, FRASE);
ok(file2.kdf.salt !== file.kdf.salt && file2.cifrado.iv !== file.cifrado.iv && file2.datos !== file.datos, 'salt e IV distintos en cada copia');

ok(await C.decryptBackup(file, FRASE) === plano, 'cifrar y descifrar con el módulo del panel');
ok(await descifrarCopia(file, FRASE) === plano, 'descifrar con el descifrador independiente');
const reorder = (o) => (o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).reverse().map((k) => [k, reorder(o[k])])) : o);
const portable = JSON.parse(JSON.stringify(reorder(file), null, 2));
ok(await descifrarCopia(portable, FRASE) === plano, 'portable: otro orden de campos y otro espaciado siguen descifrando');
ok(JSON.parse(await descifrarCopia(file, FRASE)).tables.tasks.some((t) => t.scope === 'personal'), 'la copia completa incluye los datos personales');

await rejects(C.decryptBackup(file, 'otra frase incorrecta'), 'frase-o-alterado', 'frase incorrecta (panel)');
await rejects(descifrarCopia(file, 'otra frase incorrecta'), 'frase-o-alterado', 'frase incorrecta (descifrador)');
const alt = clone(file); alt.datos = b64flip(alt.datos, 5);
await rejects(descifrarCopia(alt, FRASE), 'frase-o-alterado', 'datos alterados');
const altTag = clone(file); altTag.datos = b64flip(altTag.datos, Buffer.from(altTag.datos, 'base64').length - 1);
await rejects(descifrarCopia(altTag, FRASE), 'frase-o-alterado', 'etiqueta alterada');
const altMeta = clone(file); altMeta.contenido.creada = '2020-01-01T00:00:00.000Z';
await rejects(descifrarCopia(altMeta, FRASE), 'frase-o-alterado', 'metadatos alterados (fecha)');
const altIter = clone(file); altIter.kdf.iteraciones = 600001;
await rejects(descifrarCopia(altIter, FRASE), 'frase-o-alterado', 'metadatos alterados (iteraciones)');
const altIv = clone(file); altIv.cifrado.iv = b64flip(altIv.cifrado.iv, 0);
await rejects(descifrarCopia(altIv, FRASE), 'frase-o-alterado', 'IV alterado');
const pocas = clone(file); pocas.kdf.iteraciones = 1000;
await rejects(descifrarCopia(pocas, FRASE), 'parametros', 'menos iteraciones que las acordadas');
const corto = clone(file); corto.datos = corto.datos.slice(0, Math.floor(corto.datos.length / 2 / 4) * 4);
await rejects(descifrarCopia(corto, FRASE), 'frase-o-alterado', 'archivo incompleto (datos cortados)');
const sinDatos = clone(file); delete sinDatos.datos;
await rejects(descifrarCopia(sinDatos, FRASE), 'incompleto', 'archivo incompleto (sin datos)');
const sinKdf = clone(file); delete sinKdf.kdf;
await rejects(C.decryptBackup(sinKdf, FRASE), 'parametros', 'archivo incompleto (sin parámetros)');
await rejects(descifrarCopia({ formato: 'jnb', tables: {} }, FRASE), 'no-es-copia', 'una copia JNB no se toma como cifrada');
const v2 = clone(file); v2.version = 2;
await rejects(descifrarCopia(v2, FRASE), 'version-desconocida', 'versión futura desconocida');
let cortado = false; try { JSON.parse(JSON.stringify(file).slice(0, 200)); } catch { cortado = true; }
ok(cortado, 'archivo cortado a la mitad: no es JSON válido (el descifrador lo informa como incompleto)');
await rejects(C.encryptBackup(plano, 'corta'), 'frase-corta', 'frase de menos de 12 caracteres');
await rejects(C.encryptBackup(JSON.stringify({ formato: 'jnb', tables: {} }), FRASE), 'copia-invalida', 'solo cifra copias completas');

console.log(failed ? `\n✘ ${failed} prueba(s) fallaron` : '\n✓ Todas las pruebas pasaron');
process.exit(failed ? 1 : 0);
