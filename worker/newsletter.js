// Newsletter del blog: quien deja su mail en /blog/ recibe un aviso cada vez que se publica un artículo.
//
// Público:
//   POST /api/newsletter                    { "email": "...", "botcheck": "" }  → manda el mail para confirmar
//   GET  /api/newsletter/confirmar?t=<token> confirma y vuelve al blog con ?suscripcion=confirmada
//   GET  /api/newsletter/baja?t=<token>      vuelve al blog, que pregunta "¿Darte de baja?"
//   POST /api/newsletter/baja?t=<token>      da de baja (también el botón "Desuscribirse" de Gmail y Outlook)
//
// Privado (panel, con ADMIN_CLAVE):
//   GET  /api/admin/newsletter               suscriptores y avisos enviados
//   POST /api/admin/newsletter/borrar        { "email": "..." }
//   POST /api/admin/newsletter/probar        { "to": "..." }  → manda el aviso del último artículo solo a ese mail
//
// Aviso automático: una vez por hora (cron de wrangler.jsonc) se lee /blog/. Si hay un artículo ya publicado
// (su fecha y hora pasaron) que todavía no se avisó, sale un mail a cada suscriptor confirmado.
// La primera vez solo se anotan los artículos que ya existen, sin mandar nada.
// Al darse de baja, el mail se borra de la lista. Los pedidos sin confirmar se borran a los 7 días.

import { DurableObject } from 'cloudflare:workers';
import { isAdmin, resendSend, resendBatch } from './studio.js';
import { newsletterConfirmMail, newsletterArticleMail } from './mail.js';

const SITE = 'https://jnbcreativestudio.com.ar';
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TOKEN = /^[A-Za-z0-9]{24}$/;
const DAY = 24 * 60 * 60 * 1000;
const PENDING_DAYS = 7;          // sin confirmar, se borra
const RESEND_WAIT_MIN = 10;      // no se repite el mail de confirmación antes de esto
const MAX_NEW_PER_HOUR = 30;     // freno para anotaciones automáticas
const LATE_DAYS = 3;             // un artículo más viejo que esto no se avisa (por ejemplo, si el aviso falló días)

const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => ALNUM[b % ALNUM.length]).join('');

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const back = (query) => new Response(null, { status: 303, headers: { location: `/blog/?${query}#newsletter`, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });

export class Newsletter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,          -- 'pendiente' o 'activo'
      created TEXT NOT NULL,
      asked TEXT NOT NULL,           -- último mail de confirmación
      confirmed TEXT NOT NULL DEFAULT ''
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS sent (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      at TEXT NOT NULL,
      total INTEGER NOT NULL DEFAULT 0,
      ok INTEGER NOT NULL DEFAULT 0,
      error TEXT NOT NULL DEFAULT '',
      silent INTEGER NOT NULL DEFAULT 0  -- 1 = se anotó sin mandar (ya existía o era viejo)
    )`);
  }

  cleanup() {
    this.sql.exec("DELETE FROM subscribers WHERE status = 'pendiente' AND created < ?", new Date(Date.now() - PENDING_DAYS * DAY).toISOString());
  }

  // Devuelve el token si hay que mandar el mail de confirmación; null si no hace falta; 'too many' si hay demasiados pedidos.
  subscribe(email) {
    this.cleanup();
    const now = new Date();
    const row = this.sql.exec('SELECT token, status, asked FROM subscribers WHERE email = ?', email).toArray()[0];
    if (row) {
      if (row.status === 'activo') return null;
      if (now - new Date(row.asked) < RESEND_WAIT_MIN * 60 * 1000) return null;
      this.sql.exec('UPDATE subscribers SET asked = ? WHERE email = ?', now.toISOString(), email);
      return row.token;
    }
    const lastHour = new Date(now - DAY / 24).toISOString();
    if (this.sql.exec('SELECT COUNT(*) AS n FROM subscribers WHERE created > ?', lastHour).one().n >= MAX_NEW_PER_HOUR) return 'too many';
    const token = newToken();
    this.sql.exec("INSERT INTO subscribers (email, token, status, created, asked) VALUES (?, ?, 'pendiente', ?, ?)", email, token, now.toISOString(), now.toISOString());
    return token;
  }

  confirm(token) {
    this.cleanup();
    const row = this.sql.exec('SELECT status FROM subscribers WHERE token = ?', token).toArray()[0];
    if (!row) return false;
    if (row.status !== 'activo') this.sql.exec("UPDATE subscribers SET status = 'activo', confirmed = ? WHERE token = ?", new Date().toISOString(), token);
    return true;
  }

  unsubscribe(token) {
    return this.sql.exec('DELETE FROM subscribers WHERE token = ?', token).rowsWritten > 0;
  }

  remove(email) {
    return this.sql.exec('DELETE FROM subscribers WHERE email = ?', email).rowsWritten > 0;
  }

  active() {
    return this.sql.exec("SELECT email, token FROM subscribers WHERE status = 'activo' ORDER BY confirmed").toArray();
  }

  // Artículos que todavía no se avisaron. La primera vez (tabla vacía) se anotan todos sin mandar.
  pending(articles) {
    const known = new Set(this.sql.exec('SELECT slug FROM sent').toArray().map((r) => r.slug));
    const firstTime = known.size === 0;
    const now = new Date().toISOString();
    const out = [];
    for (const a of articles) {
      if (known.has(a.slug)) continue;
      const late = Date.now() - new Date(a.date) > LATE_DAYS * DAY;
      if (firstTime || late) {
        this.sql.exec('INSERT OR IGNORE INTO sent (slug, title, at, silent) VALUES (?, ?, ?, 1)', a.slug, a.title, now);
      } else {
        // Se anota antes de mandar: si algo se corta a la mitad, nunca sale dos veces
        this.sql.exec('INSERT OR IGNORE INTO sent (slug, title, at) VALUES (?, ?, ?)', a.slug, a.title, now);
        out.push(a);
      }
    }
    return out;
  }

  result(slug, total, ok, error) {
    this.sql.exec('UPDATE sent SET total = ?, ok = ?, error = ? WHERE slug = ?', total, ok, error || '', slug);
  }

  summary() {
    this.cleanup();
    return {
      subscribers: this.sql.exec('SELECT email, status, created, confirmed FROM subscribers ORDER BY created DESC').toArray(),
      sent: this.sql.exec('SELECT slug, title, at, total, ok, error, silent FROM sent ORDER BY at DESC LIMIT 100').toArray(),
    };
  }
}

const store = (env) => env.NEWSLETTER.get(env.NEWSLETTER.idFromName('blog'));

// ---- Artículos del blog, leídos de /blog/ (las cards) y de cada artículo (resumen y foto para el mail)
const decode = (s) => String(s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function readArticles(env) {
  const res = await env.ASSETS.fetch(new Request(`${SITE}/blog/`));
  if (!res.ok) return [];
  const html = await res.text();
  const now = Date.now();
  return [...html.matchAll(/<details class="blog-card">([\s\S]*?)<\/details>/g)].map(([, card]) => {
    const slug = (card.match(/href="\/blog\/([a-z0-9-]+)\/"/) || [])[1];
    const title = decode((card.match(/class="blog-card-title">([\s\S]*?)<\/span>/) || [])[1]);
    const date = (card.match(/<time datetime="([^"]+)"/) || [])[1];
    return { slug, title, date };
  }).filter((a) => a.slug && a.title && a.date && !Number.isNaN(Date.parse(a.date)) && Date.parse(a.date) <= now);
}

async function articleDetails(env, article) {
  const link = `${SITE}/blog/${article.slug}/`;
  let summary = '';
  let image = '';
  try {
    const res = await env.ASSETS.fetch(new Request(link));
    if (res.ok) {
      const html = await res.text();
      summary = decode((html.match(/<meta name="description"\s+content="([^"]*)"/) || [])[1]);
      image = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
    }
  } catch { /* sale sin resumen ni foto */ }
  return { ...article, link, summary, image };
}

const unsubscribeLink = (token) => `${SITE}/api/newsletter/baja?t=${token}`;

function articleMailFor(details, token) {
  const unsubscribe = unsubscribeLink(token);
  return {
    ...newsletterArticleMail({ ...details, unsubscribe }),
    headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

// Lo llama el cron una vez por hora
export async function notifyNewArticles(env) {
  const db = store(env);
  const articles = await readArticles(env);
  if (!articles.length) return;
  const fresh = await db.pending(articles);
  if (!fresh.length) return;
  const people = await db.active();
  for (const article of fresh) {
    const details = await articleDetails(env, article);
    const mails = people.map((p) => ({ to: p.email, ...articleMailFor(details, p.token) }));
    const { ok, error } = mails.length ? await resendBatch(env, mails) : { ok: 0, error: '' };
    await db.result(article.slug, mails.length, ok, error);
  }
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

export async function handleNewsletter(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const db = store(env);

  if (path === '/api/newsletter' && request.method === 'POST') {
    const body = await readJson(request);
    if (!body || body.botcheck) return json({ error: 'bad request' }, 400);
    const email = String(body.email || '').trim().toLowerCase().slice(0, 160);
    if (!EMAIL.test(email)) return json({ error: 'bad request' }, 400);
    const token = await db.subscribe(email);
    if (token === 'too many') return json({ error: 'too many' }, 429);
    // Misma respuesta si ya estaba anotado: así nadie puede averiguar qué mails están en la lista
    if (token) {
      const mailed = (await resendSend(env, email, newsletterConfirmMail({ link: `${SITE}/api/newsletter/confirmar?t=${token}` }))).ok;
      if (!mailed) return json({ error: 'mail' }, 502);
    }
    return json({ ok: true });
  }

  if (path === '/api/newsletter/confirmar' && request.method === 'GET') {
    const token = url.searchParams.get('t') || '';
    return back(TOKEN.test(token) && (await db.confirm(token)) ? 'suscripcion=confirmada' : 'suscripcion=vencida');
  }

  if (path === '/api/newsletter/baja') {
    const token = url.searchParams.get('t') || '';
    // GET: los programas de mail abren los links solos para revisarlos, así que la baja se confirma con un botón en el blog
    if (request.method === 'GET') return back(TOKEN.test(token) ? `baja=${token}` : 'suscripcion=baja');
    if (request.method === 'POST') {
      if (TOKEN.test(token)) await db.unsubscribe(token);
      return json({ ok: true });
    }
  }

  // ---- Panel
  if (path.startsWith('/api/admin/newsletter')) {
    if (!env.ADMIN_CLAVE) return json({ error: 'not found' }, 404);
    if (!isAdmin(request, env)) return json({ error: 'clave' }, 401);

    if (path === '/api/admin/newsletter' && request.method === 'GET') return json(await db.summary());

    if (path === '/api/admin/newsletter/borrar' && request.method === 'POST') {
      const body = (await readJson(request)) || {};
      return json({ ok: await db.remove(String(body.email || '').trim().toLowerCase()) });
    }

    if (path === '/api/admin/newsletter/probar' && request.method === 'POST') {
      const body = (await readJson(request)) || {};
      const to = String(body.to || '').trim().toLowerCase();
      if (!EMAIL.test(to)) return json({ error: 'bad request' }, 400);
      const [latest] = await readArticles(env);
      if (!latest) return json({ ok: false, error: 'No hay artículos publicados en /blog/.' });
      const details = await articleDetails(env, latest);
      const mail = articleMailFor(details, 'PRUEBA' + 'x'.repeat(18));
      const result = await resendSend(env, to, { ...mail, subject: `[Prueba] ${mail.subject}` });
      return json({ ok: result.ok, error: result.error || '', title: latest.title });
    }
  }

  return json({ error: 'not found' }, 404);
}
