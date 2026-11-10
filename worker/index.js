// Worker del sitio: sirve las páginas tal cual y agrega una sola cosa, los "me gusta" del blog.
//
//   GET  /api/likes?slugs=landing-web-o-tienda,otro   → { "landing-web-o-tienda": 3, "otro": 0 }
//   POST /api/likes/landing-web-o-tienda  { "visitor": "<id>", "liked": true|false } → { "count": 4 }
//
// Los números se guardan en un Durable Object (base SQLite chiquita de Cloudflare).
// Cada navegador manda un identificador al azar que guarda en su localStorage,
// así un mismo navegador no suma dos veces el mismo artículo. No se guarda la IP ni nada personal.

import { DurableObject } from 'cloudflare:workers';

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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/likes' || pathname.startsWith('/api/likes/')) return handleLikes(request, env);
    return env.ASSETS.fetch(request);
  },
};
