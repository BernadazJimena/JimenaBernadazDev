#!/usr/bin/env node
// Verificador de publicación: qué archivos subiría Wrangler como assets del sitio y qué archivos van dentro del Worker.
// No despliega nada. Compara dos fuentes: el cálculo propio de este script y una simulación real de Wrangler
// (`wrangler deploy --dry-run`, versión fija), en dos escenarios:
//   1. "git":   solo lo que Git puede ver (como lo recibe Workers Builds desde GitHub).
//   2. "disco": todo lo que hay en la carpeta, incluidos archivos no versionados (como un deploy desde la computadora).
// Ante cualquier diferencia o duda, falla y explica qué encontró.
//
// Uso:  node tools/verificar-publicacion.mjs                 (verificación completa)
//       node tools/verificar-publicacion.mjs --sin-wrangler  (solo el cálculo propio; el resultado queda INCOMPLETO)
//       node tools/verificar-publicacion.mjs --mostrar-lista (imprime la lista de assets calculada)

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const WRANGLER = 'wrangler@4.164.0';           // misma versión que usa Workers Builds hoy; si cambia allá, se cambia acá
const MAX_ASSET_SIZE = 25 * 1024 * 1024;         // límites de Wrangler (workers-shared/utils/constants.ts)
const MAX_ASSET_COUNT = 100_000;
const DEFAULT_IGNORES = ['/.assetsignore', '/_redirects', '/_headers']; // Wrangler los excluye siempre

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const problems = [];
const notes = [];
const fail = (msg) => problems.push(msg);
const posix = (p) => p.split(sep).join('/').replace(/\\/g, '/');

// Nombres que nunca pueden publicarse
const FORBIDDEN_PATHS = [
  [/(^|\/)\.dev\.vars/i, 'secretos locales (.dev.vars)'],
  [/(^|\/)\.env/i, 'variables de entorno (.env)'],
  [/\.(pem|key|p12|pfx)$/i, 'clave o certificado'],
  [/(^|\/)\.claude\//, 'carpeta .claude'],
  [/(^|\/)(sorteo-2026|imagenes-tiendanube|muestras-upwork|cotizaciones)\//, 'carpeta privada'],
  [/(^|\/)assets\/images\/demo-cocinera-[^/]*\.png$/, 'imagen demo sin aprobar'],
  [/(^|\/)jnb-panel-copia[^/]*\.json$/i, 'copia del panel'],
  [/(^|\/)(wrangler\.jsonc?|wrangler\.toml|package(-lock)?\.json)$/, 'configuración del proyecto'],
  [/^(worker|tools|docs|\.git|\.wrangler|node_modules)\//, 'carpeta que no es parte del sitio'],
];
// Contenido que delata un secreto
const SECRET_CONTENT = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clave privada'],
  [/\bre_[A-Za-z0-9]{20,}/, 'posible clave de Resend'],
  [/\b(ADMIN_CLAVE|RESEND_API_KEY|PERSONAL_BACKUP_KEY\w*|MFA_KEY\w*|ADMIN_MFA_RESET|PRIVACY_HMAC_KEY\w*)\s*[=:]\s*["']?[A-Za-z0-9+/_-]{8,}/, 'secreto con valor'],
];
const TEXT_EXT = /\.(html?|js|mjs|css|json|txt|md|xml|svg|webmanifest|toml|ya?ml|csv|map)$/i;

// ---- wrangler.jsonc: se quitan los comentarios respetando los textos entre comillas
function readJsonc(file) {
  const src = readFileSync(file, 'utf8');
  let out = ''; let inStr = false; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (inStr) { out += c; if (c === '\\') { out += src[i + 1]; i += 2; continue; } if (c === '"') inStr = false; i++; continue; }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; if (i < 2) throw new Error('comentario sin cerrar'); continue; }
    out += c; i++;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

// ---- Reglas de .assetsignore (mismo formato que .gitignore). Solo se acepta la sintaxis que se interpreta con certeza.
function compileRules(lines, origin) {
  const rules = [];
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const trimmed = line.replace(/\s+$/, '');
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (/^\s/.test(line)) { fail(`${origin}: la regla "${line}" empieza con espacios; no sé interpretarla con certeza.`); continue; }
    if (/[!?[\]\\{}]|\*\*/.test(trimmed)) { fail(`${origin}: la regla "${trimmed}" usa una sintaxis que este script no interpreta (!, ?, [], \\, {} o **). Se detiene por precaución.`); continue; }
    let pat = trimmed;
    const dirOnly = pat.endsWith('/');
    if (dirOnly) pat = pat.slice(0, -1);
    const anchored = pat.includes('/');
    if (pat.startsWith('/')) pat = pat.slice(1);
    const re = new RegExp('^' + pat.split('/').map((seg) => seg.split('*').map((s) => s.replace(/[.+^$()|]/g, '\\$&')).join('[^/]*')).join('/') + '$');
    rules.push({ text: trimmed, re, anchored, dirOnly });
  }
  return rules;
}
// Una ruta queda excluida si ella o alguna carpeta que la contiene coincide con una regla
function isIgnored(rel, isDir, rules) {
  const segs = rel.split('/');
  for (let i = 1; i <= segs.length; i++) {
    const sub = segs.slice(0, i).join('/');
    const subIsDir = i < segs.length || isDir;
    for (const r of rules) {
      if (r.dirOnly && !subIsDir) continue;
      if (r.anchored ? r.re.test(sub) : r.re.test(segs[i - 1])) return true;
    }
  }
  return false;
}

// ---- Recorrido del disco (como readdir recursivo de Wrangler)
function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = lstatSync(abs);
    const rel = posix(relative(base, abs));
    out.push({ rel, isDir: st.isDirectory(), isLink: st.isSymbolicLink(), size: st.size });
    if (st.isDirectory()) walk(abs, base, out);
  }
  return out;
}

function ownManifest(assetsDir) {
  const ignoreFile = join(assetsDir, '.assetsignore');
  const lines = [...DEFAULT_IGNORES, ...(existsSync(ignoreFile) ? readFileSync(ignoreFile, 'utf8').split('\n') : [])];
  if (!existsSync(ignoreFile)) fail('No existe .assetsignore en la carpeta de assets.');
  const rules = compileRules(lines, '.assetsignore');
  const entries = walk(assetsDir);
  const assets = entries.filter((e) => !e.isDir && !e.isLink && !isIgnored(e.rel, false, rules));
  return { assets, entries };
}

// ---- Archivos que entran en el bundle del Worker, siguiendo los import desde "main"
function bundleFiles(mainAbs) {
  const seen = new Set(); const external = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    if (!existsSync(file)) { fail(`El Worker importa un archivo que no existe: ${posix(relative(ROOT, file))}`); return; }
    seen.add(file);
    const code = readFileSync(file, 'utf8');
    const specs = [...code.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g)].map((m) => m[1] || m[2] || m[3]);
    for (const spec of specs) {
      if (spec.startsWith('.')) visit(resolve(dirname(file), spec));
      else external.add(spec);
    }
  };
  visit(mainAbs);
  return { files: [...seen].map((f) => posix(relative(ROOT, f))).sort(), external: [...external].sort() };
}

// ---- Simulación con Wrangler en una copia temporal
function simulate(label, sourceFiles, config) {
  const tmp = mkdtempSync(join(tmpdir(), `jnb-verificar-${label}-`));
  const site = join(tmp, 'sitio');
  try {
    for (const rel of sourceFiles) {
      const from = join(ROOT, rel);
      if (!existsSync(from)) continue; // borrado en la carpeta de trabajo
      const to = join(site, rel);
      cpSync(from, to, { recursive: false, force: true, dereference: false });
    }
    // La configuración se copia tal cual (Wrangler la necesita), aunque no esté entre los archivos simulados
    cpSync(join(ROOT, 'wrangler.jsonc'), join(site, 'wrangler.jsonc'));
    const out = join(tmp, 'salida');
    const meta = join(tmp, 'meta.json');
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const run = spawnSync(npx, ['--yes', WRANGLER, 'deploy', '--dry-run', '--outdir', out, '--metafile', meta], {
      cwd: site, encoding: 'utf8', shell: process.platform === 'win32', timeout: 300_000,
      env: { ...process.env, WRANGLER_LOG: 'debug', WRANGLER_SEND_METRICS: 'false', CI: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    const log = `${run.stdout || ''}\n${run.stderr || ''}`;
    if (run.error || run.status !== 0) {
      fail(`[${label}] Wrangler no terminó bien (código ${run.status ?? 'sin código'}). No se puede confirmar la lista: se detiene la verificación.\n${log.split('\n').filter((l) => /error|✘/i.test(l)).slice(0, 8).join('\n')}`);
      return null;
    }
    const lines = log.split(/\r?\n/).map((l) => l.replace(/\x1b\[[0-9;]*m/g, ''));
    const readLine = lines.findIndex((l) => /Read (\d+) files? from the assets directory/.test(l));
    if (readLine < 0) { fail(`[${label}] No encontré en el registro de Wrangler la línea "Read N files from the assets directory". Puede haber cambiado su formato: se detiene la verificación.`); return null; }
    const count = Number(lines[readLine].match(/Read (\d+) files?/)[1]);
    const read = [];
    for (let i = readLine + 1; i < lines.length && read.length < count; i++) {
      const m = lines[i].match(/^\s*(?:\[[^\]]*\]\s*)?(\/.*)$/);
      if (m) read.push(posix(m[1].slice(1)));
    }
    if (read.length !== count) { fail(`[${label}] Wrangler dijo haber leído ${count} entradas pero el registro solo lista ${read.length}. Se detiene la verificación.`); return null; }
    const ignored = new Set(lines.map((l) => l.match(/Ignoring asset:\s*(.+)$/)).filter(Boolean).map((m) => posix(m[1].trim())));
    const published = read.filter((rel) => !ignored.has(rel)).filter((rel) => {
      const st = lstatSync(join(site, rel));
      return !st.isDirectory() && !st.isSymbolicLink();
    }).sort();
    let bundle = null;
    if (existsSync(meta)) {
      const inputs = Object.keys(JSON.parse(readFileSync(meta, 'utf8')).inputs || {});
      bundle = inputs.map((p) => posix(p)).filter((p) => !p.startsWith('..') && !p.includes('node_modules/wrangler') && !/^(cloudflare|node):/.test(p))
        .map((p) => p.replace(/^.*?sitio\//, '')).sort();
    } else fail(`[${label}] Wrangler no generó el metafile del bundle: no se puede confirmar qué va dentro del Worker.`);
    return { published, bundle, siteDir: site };
  } finally {
    try { rmSync(tmp, { recursive: true, force: true }); } catch { /* carpeta temporal */ }
  }
}

const diff = (a, b) => ({ onlyA: a.filter((x) => !b.includes(x)), onlyB: b.filter((x) => !a.includes(x)) });
const sample = (list) => list.slice(0, 15).join('\n    ') + (list.length > 15 ? `\n    … y ${list.length - 15} más` : '');

// ================= Verificación =================
const config = readJsonc(join(ROOT, 'wrangler.jsonc'));
const assetsDir = resolve(ROOT, (config.assets && config.assets.directory) || '');
if (!config.assets || !config.assets.directory) fail('wrangler.jsonc no define assets.directory.');
if (posix(relative(ROOT, assetsDir)) !== '') notes.push(`La carpeta de assets es ${posix(relative(ROOT, assetsDir))} (no la raíz).`);
const mainAbs = resolve(ROOT, config.main || '');
console.log(`Carpeta de assets: ${assetsDir}\nWorker (main): ${posix(relative(ROOT, mainAbs))}\n`);

const tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean));
const gitVisible = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);

// 1. Cálculo propio sobre el disco real
const own = ownManifest(assetsDir);
const ownList = own.assets.map((a) => posix(relative(ROOT, join(assetsDir, a.rel)))).sort();
if (ownList.length > MAX_ASSET_COUNT) fail(`Hay ${ownList.length} assets: Wrangler acepta como máximo ${MAX_ASSET_COUNT}.`);
for (const a of own.assets) if (a.size > MAX_ASSET_SIZE) fail(`Archivo demasiado grande para publicarse (más de 25 MiB): ${a.rel}`);

// 2. Nada no versionado puede quedar entre los assets
const untrackedAssets = ownList.filter((rel) => !tracked.has(rel));
if (untrackedAssets.length) fail(`Estos archivos NO están en Git pero se publicarían en un deploy desde la computadora:\n    ${sample(untrackedAssets)}`);

// 3. Nombres prohibidos y contenido sensible
for (const rel of ownList) {
  for (const [re, why] of FORBIDDEN_PATHS) if (re.test(rel)) fail(`Se publicaría un archivo prohibido (${why}): ${rel}`);
  if (TEXT_EXT.test(rel)) {
    const abs = join(ROOT, rel);
    if (statSync(abs).size <= 2 * 1024 * 1024) {
      const text = readFileSync(abs, 'utf8');
      for (const [re, why] of SECRET_CONTENT) if (re.test(text)) fail(`Posible ${why} dentro de un archivo que se publicaría: ${rel}`);
    }
  }
}

// 4. Bundle del Worker separado de los assets
const bundle = bundleFiles(mainAbs);
const bundleInAssets = bundle.files.filter((f) => ownList.includes(f));
if (bundleInAssets.length) fail(`Archivos del Worker que además se publicarían como assets:\n    ${sample(bundleInAssets)}`);
const unexpectedExternal = bundle.external.filter((s) => !/^(cloudflare|node):/.test(s));
if (unexpectedExternal.length) notes.push(`El Worker usa paquetes externos: ${unexpectedExternal.join(', ')}`);

// 5. Lista esperada
const expectedFile = join(ROOT, 'tools', 'assets-esperados.txt');
if (!existsSync(expectedFile)) fail('Falta tools/assets-esperados.txt.');
else {
  const expected = readFileSync(expectedFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).sort();
  const d = diff(ownList, expected);
  if (d.onlyA.length) fail(`Se publicarían archivos que no están en tools/assets-esperados.txt:\n    ${sample(d.onlyA)}`);
  if (d.onlyB.length) fail(`Faltan archivos que tools/assets-esperados.txt espera publicar:\n    ${sample(d.onlyB)}`);
}

// 6. Simulación con Wrangler (dos escenarios) y comparación con el cálculo propio
let complete = true;
if (args.has('--sin-wrangler')) {
  complete = false;
  notes.push('Se pidió --sin-wrangler: no hubo simulación con Wrangler, así que la verificación queda INCOMPLETA.');
} else {
  const diskFiles = own.entries.filter((e) => !e.isDir).map((e) => posix(relative(ROOT, join(assetsDir, e.rel))));
  for (const [label, files] of [['git', gitVisible], ['disco', diskFiles]]) {
    console.log(`Simulando con ${WRANGLER} (escenario "${label}", ${files.length} archivos)…`);
    const sim = simulate(label, files, config);
    if (!sim) { complete = false; continue; }
    // Lo que el cálculo propio publicaría en este mismo escenario
    const fileSet = new Set(files);
    const ownScenario = ownList.filter((f) => fileSet.has(f));
    const d = diff(sim.published, ownScenario);
    if (d.onlyA.length || d.onlyB.length) {
      complete = false;
      fail(`[${label}] Wrangler y este script NO coinciden en lo que se publicaría.`
        + (d.onlyA.length ? `\n  Solo según Wrangler:\n    ${sample(d.onlyA)}` : '')
        + (d.onlyB.length ? `\n  Solo según el script:\n    ${sample(d.onlyB)}` : ''));
    } else console.log(`  ✓ Coinciden: ${sim.published.length} assets.`);
    if (sim.bundle) {
      const ownBundle = bundle.files.filter((f) => fileSet.has(f) || label === 'disco');
      const db = diff(sim.bundle, ownBundle);
      if (db.onlyA.length || db.onlyB.length) {
        fail(`[${label}] El bundle del Worker según Wrangler no coincide con los import encontrados.`
          + (db.onlyA.length ? `\n  Solo según Wrangler:\n    ${sample(db.onlyA)}` : '')
          + (db.onlyB.length ? `\n  Solo según el script:\n    ${sample(db.onlyB)}` : ''));
      } else console.log(`  ✓ Bundle del Worker: ${sim.bundle.length} archivos (${sim.bundle.join(', ')}).`);
      const overlap = sim.bundle.filter((f) => sim.published.includes(f));
      if (overlap.length) fail(`[${label}] Archivos del Worker que Wrangler también publicaría como assets:\n    ${sample(overlap)}`);
    }
  }
}

// ================= Informe =================
if (args.has('--mostrar-lista')) console.log(`\nAssets (${ownList.length}):\n  ${ownList.join('\n  ')}`);
console.log(`\nResumen: ${ownList.length} assets se publicarían; ${bundle.files.length} archivos van dentro del Worker.`);
for (const n of notes) console.log(`ℹ ${n}`);
if (problems.length) {
  console.log(`\n✘ La verificación FALLÓ (${problems.length} problema${problems.length === 1 ? '' : 's'}):`);
  problems.forEach((p, i) => console.log(`\n${i + 1}. ${p}`));
  process.exit(1);
}
if (!complete) { console.log('\n⚠ Verificación INCOMPLETA: no se publica hasta correrla completa.'); process.exit(2); }
console.log('\n✓ Verificación completa: nada inesperado, privado ni secreto se publicaría, y Wrangler coincide con el cálculo propio.');
