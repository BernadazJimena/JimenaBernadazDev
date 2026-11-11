// Worker del sitio: sirve las páginas tal cual y agrega dos cosas chicas que se guardan:
// los "me gusta" del blog y las respuestas de las preguntas frecuentes (más abajo, "Preguntas frecuentes").
// Consultas, presupuestos, reseñas, proyectos y el panel privado están en studio.js.
//
//   GET  /api/likes?slugs=landing-web-o-tienda,otro   → { "landing-web-o-tienda": 3, "otro": 0 }
//   POST /api/likes/landing-web-o-tienda  { "visitor": "<id>", "liked": true|false } → { "count": 4 }
//
// Los números se guardan en un Durable Object (base SQLite chiquita de Cloudflare).
// Cada navegador manda un identificador al azar que guarda en su localStorage,
// así un mismo navegador no suma dos veces el mismo artículo. No se guarda la IP ni nada personal.

import { DurableObject } from 'cloudflare:workers';
import { handleStudio, isAdmin } from './studio.js';
import { handleNewsletter, notifyNewArticles } from './newsletter.js';

export { StudioData } from './studio.js';
export { Newsletter } from './newsletter.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VISITOR = /^[a-zA-Z0-9-]{16,64}$/;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export class BlogLikes extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS likes (
      slug TEXT NOT NULL,
      visitor TEXT NOT NULL,
      PRIMARY KEY (slug, visitor)
    )`);
  }

  counts(slugs) {
    const out = Object.fromEntries(slugs.map((s) => [s, 0]));
    const marks = slugs.map(() => '?').join(',');
    for (const row of this.sql.exec(`SELECT slug, COUNT(*) AS n FROM likes WHERE slug IN (${marks}) GROUP BY slug`, ...slugs)) {
      out[row.slug] = row.n;
    }
    return out;
  }

  setLike(slug, visitor, liked) {
    if (liked) this.sql.exec('INSERT OR IGNORE INTO likes (slug, visitor) VALUES (?, ?)', slug, visitor);
    else this.sql.exec('DELETE FROM likes WHERE slug = ? AND visitor = ?', slug, visitor);
    return this.counts([slug])[slug];
  }
}

// Solo se aceptan artículos que existen de verdad en /blog/<slug>/.
async function articleExists(env, url, slug) {
  const res = await env.ASSETS.fetch(new Request(new URL(`/blog/${slug}/`, url), { method: 'HEAD' }));
  return res.ok;
}

async function handleLikes(request, env) {
  const url = new URL(request.url);
  const store = env.BLOG_LIKES.get(env.BLOG_LIKES.idFromName('blog'));

  if (request.method === 'GET' && url.pathname === '/api/likes') {
    const slugs = [...new Set((url.searchParams.get('slugs') || '').split(','))].filter((s) => SLUG.test(s)).slice(0, 50);
    if (!slugs.length) return json({});
    return json(await store.counts(slugs));
  }

  const match = url.pathname.match(/^\/api\/likes\/([^/]+)$/);
  if (request.method === 'POST' && match && SLUG.test(match[1])) {
    const slug = match[1];
    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
    if (!body || !VISITOR.test(body.visitor || '') || typeof body.liked !== 'boolean') return json({ error: 'bad request' }, 400);
    if (!(await articleExists(env, url, slug))) return json({ error: 'not found' }, 404);
    return json({ count: await store.setLike(slug, body.visitor, body.liked) });
  }

  return json({ error: 'not found' }, 404);
}

// ---- Preguntas frecuentes
//
//   POST /api/faq/voto      { "visitor": "<id>", "question": "precio", "lang": "es", "helpful": true|false }
//   POST /api/faq/busqueda  { "term": "factura", "lang": "es" }   (solo búsquedas que no encontraron nada)
//   GET  /api/faq           → { "ok": true }   (el "¿Te sirvió?" aparece solo si esto responde)
//   GET  /api/faq/resumen?clave=<FAQ_RESUMEN_CLAVE>  → página con los números, solo para Jimena
//
// No se guarda la IP ni nada personal: el voto lleva el mismo número al azar que los "me gusta",
// y de las búsquedas solo las palabras (mails y teléfonos se descartan en el navegador y acá).

const QUESTION = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGS = new Set(['es', 'en', 'pt']);
const MAX_SEARCH_ROWS = 1000;

export class FaqFeedback extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS votes (
      question TEXT NOT NULL,
      visitor TEXT NOT NULL,
      lang TEXT NOT NULL,
      helpful INTEGER NOT NULL,
      PRIMARY KEY (question, visitor)
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS searches (
      term TEXT NOT NULL,
      lang TEXT NOT NULL,
      times INTEGER NOT NULL,
      last TEXT NOT NULL,
      PRIMARY KEY (term, lang)
    )`);
  }

  // Un navegador vota una vez por pregunta; si cambia de opinión, se reemplaza su voto.
  vote(question, visitor, lang, helpful) {
    this.sql.exec(`INSERT INTO votes (question, visitor, lang, helpful) VALUES (?, ?, ?, ?)
      ON CONFLICT (question, visitor) DO UPDATE SET lang = excluded.lang, helpful = excluded.helpful`,
    question, visitor, lang, helpful ? 1 : 0);
  }

  // Cada búsqueda sin resultado suma una vez; la lista tiene un tope para que nunca crezca sin control.
  search(term, lang) {
    const today = new Date().toISOString().slice(0, 10);
    const known = this.sql.exec('SELECT 1 FROM searches WHERE term = ? AND lang = ?', term, lang).toArray().length > 0;
    if (!known && this.sql.exec('SELECT COUNT(*) AS n FROM searches').one().n >= MAX_SEARCH_ROWS) return;
    this.sql.exec(`INSERT INTO searches (term, lang, times, last) VALUES (?, ?, 1, ?)
      ON CONFLICT (term, lang) DO UPDATE SET times = times + 1, last = excluded.last`, term, lang, today);
  }

  summary() {
    return {
      votes: this.sql.exec(`SELECT question, SUM(helpful) AS yes, SUM(1 - helpful) AS no
        FROM votes GROUP BY question ORDER BY no DESC, yes DESC`).toArray(),
      searches: this.sql.exec('SELECT term, lang, times, last FROM searches ORDER BY times DESC, last DESC LIMIT 300').toArray(),
    };
  }
}

// Solo se aceptan preguntas que existen en la página (los id son los mismos en los tres idiomas).
let knownQuestions = null;
async function questionExists(env, url, question) {
  if (!knownQuestions) {
    const res = await env.ASSETS.fetch(new Request(new URL('/preguntas-frecuentes/', url)));
    if (!res.ok) return false;
    const html = await res.text();
    knownQuestions = new Set([...html.matchAll(/<details class="legal-block" id="([a-z0-9-]+)"/g)].map((m) => m[1]));
  }
  return knownQuestions.has(question);
}

// La búsqueda tal como se guarda: minúsculas, sin espacios de más, corta. Sin mails ni teléfonos.
function cleanTerm(raw) {
  if (typeof raw !== 'string') return '';
  const term = raw.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);
  if (term.length < 3 || term.includes('@') || /\d{5,}/.test(term.replace(/[\s.()-]/g, ''))) return '';
  return term;
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ESCAPES[c]);

function summaryPage({ votes, searches }) {
  const voteRows = votes.map((v) => `<tr><td><a href="/preguntas-frecuentes/#${escapeHtml(v.question)}">${escapeHtml(v.question)}</a></td><td>${v.yes}</td><td>${v.no}</td></tr>`).join('')
    || '<tr><td colspan="3">Todavía no hay votos.</td></tr>';
  const searchRows = searches.map((s) => `<tr><td>${escapeHtml(s.term)}</td><td>${escapeHtml(s.lang)}</td><td>${s.times}</td><td>${escapeHtml(s.last)}</td></tr>`).join('')
    || '<tr><td colspan="4">Todavía no hay búsquedas sin resultado.</td></tr>';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Preguntas frecuentes: resumen</title>
<style>
  :root { color-scheme: light dark; --bg: #f3ebf6; --text: #211632; --muted: #625970; --line: #d9c6e8; --accent: #5d31b8; }
  @media (prefers-color-scheme: dark) { :root { --bg: #100b1d; --text: #f4f0ff; --muted: #b6aecf; --line: #2f2549; --accent: #b9a0ff; } }
  body { background: var(--bg); color: var(--text); font: 16px/1.5 system-ui, sans-serif; margin: 0 auto; max-width: 48rem; padding: 1.5rem 1rem 3rem; }
  h1 { font-size: 1.5rem; } h2 { font-size: 1.15rem; margin-top: 2rem; } p { color: var(--muted); }
  table { border-collapse: collapse; width: 100%; } th, td { border-bottom: 1px solid var(--line); padding: .45rem .5rem; text-align: left; }
  td:nth-child(n+2), th:nth-child(n+2) { text-align: right; } a { color: var(--accent); }
</style></head><body>
<h1>Preguntas frecuentes: resumen</h1>
<h2>¿Te sirvió esta respuesta?</h2>
<p>Arriba quedan las que más "No" tienen: son las que conviene reescribir.</p>
<table><thead><tr><th>Pregunta</th><th>Sí</th><th>No</th></tr></thead><tbody>${voteRows}</tbody></table>
<h2>Búsquedas que no encontraron nada</h2>
<p>Lo que la gente buscó y no estaba: ideas de preguntas para agregar.</p>
<table><thead><tr><th>Búsqueda</th><th>Idioma</th><th>Veces</th><th>Última vez</th></tr></thead><tbody>${searchRows}</tbody></table>
</body></html>`;
}

async function handleFaq(request, env) {
  const url = new URL(request.url);
  const store = env.FAQ_FEEDBACK.get(env.FAQ_FEEDBACK.idFromName('faq'));

  if (request.method === 'GET' && url.pathname === '/api/faq') return json({ ok: true });

  // La página de números solo existe si en Cloudflare está cargada la clave FAQ_RESUMEN_CLAVE.
  if (request.method === 'GET' && url.pathname === '/api/faq/resumen') {
    const key = env.FAQ_RESUMEN_CLAVE;
    if (!key || url.searchParams.get('clave') !== key) return json({ error: 'not found' }, 404);
    return new Response(summaryPage(await store.summary()), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    });
  }

  if (request.method !== 'POST') return json({ error: 'not found' }, 404);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
  if (!body || !LANGS.has(body.lang)) return json({ error: 'bad request' }, 400);

  if (url.pathname === '/api/faq/voto') {
    if (!VISITOR.test(body.visitor || '') || !QUESTION.test(body.question || '') || typeof body.helpful !== 'boolean') return json({ error: 'bad request' }, 400);
    if (!(await questionExists(env, url, body.question))) return json({ error: 'not found' }, 404);
    await store.vote(body.question, body.visitor, body.lang, body.helpful);
    return json({ ok: true });
  }

  if (url.pathname === '/api/faq/busqueda') {
    const term = cleanTerm(body.term);
    if (term) await store.search(term, body.lang);
    return json({ ok: true });
  }

  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/likes' || pathname.startsWith('/api/likes/')) return handleLikes(request, env);
    if (pathname === '/api/faq' || pathname.startsWith('/api/faq/')) return handleFaq(request, env);
    if (/^\/api\/(admin\/)?newsletter(\/|$)/.test(pathname)) return handleNewsletter(request, env);
    // Números de las preguntas frecuentes para el panel privado
    if (pathname === '/api/admin/faq' && request.method === 'GET') {
      if (!env.ADMIN_CLAVE) return json({ error: 'not found' }, 404);
      if (!isAdmin(request, env)) return json({ error: 'clave' }, 401);
      return json(await env.FAQ_FEEDBACK.get(env.FAQ_FEEDBACK.idFromName('faq')).summary());
    }
    if (/^\/api\/(consultas|presupuestos|resenas|proyectos|brief|disponibilidad|cupon|admin)(\/|$)/.test(pathname)) return handleStudio(request, env);
    return env.ASSETS.fetch(request);
  },

  // Una vez por hora (wrangler.jsonc → triggers): si se publicó un artículo nuevo, avisa a los suscriptores del blog
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(notifyNewArticles(env));
  },
};
