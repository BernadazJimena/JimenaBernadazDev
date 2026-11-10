// Datos del estudio: consultas, pedidos de presupuesto, reseñas de clientes y seguimiento de proyectos.
//
// Público (lo usan las páginas del sitio):
//   POST /api/consultas                       guarda una consulta o un pedido de presupuesto → { code, link?, mailed }
//   GET  /api/presupuestos/<token>            el pedido y, cuando Jimena la carga, su propuesta
//   GET  /api/resenas                         reseñas aprobadas (lista vacía hasta que haya al menos 3)
//   GET  /api/resenas/invitacion/<token>      si el link para dejar una reseña sirve
//   POST /api/resenas/invitacion/<token>      el cliente deja su reseña (queda pendiente hasta que Jimena la aprueba)
//   GET  /api/proyectos/<token>               en qué etapa está el proyecto de un cliente
//
// Privado (panel de Jimena en /api/admin, con la clave ADMIN_CLAVE de Cloudflare):
//   GET  /api/admin                           el panel
//   GET  /api/admin/datos                     todo lo guardado
//   GET  /api/admin/mail/<code>               cómo se ve el mail de confirmación de esa consulta
//   POST /api/admin/presupuestos/<token>      estado y propuesta de un presupuesto
//   POST /api/admin/resenas/invitar           crea un link para que un cliente deje su reseña
//   POST /api/admin/resenas/<id>              aprobar, ocultar o borrar una reseña
//   POST /api/admin/proyectos                 crea el seguimiento de un proyecto
//   POST /api/admin/proyectos/<token>         cambia etapa, fecha estimada o nota; o lo borra
//
// Todo vive en un Durable Object (base SQLite chiquita de Cloudflare). Nada de esto se publica sin que Jimena lo apruebe.
// El mail de confirmación sale por Resend solo si en Cloudflare están RESEND_API_KEY y MAIL_FROM; si no, se guarda igual.

import { DurableObject } from 'cloudflare:workers';
import { adminPage } from './admin-page.js';
import { confirmationMail } from './mail.js';

const SITE = 'https://jnbcreativestudio.com.ar';
const LANGS = new Set(['es', 'en', 'pt']);
const TOKEN = /^[A-Za-z0-9]{20,40}$/;
const CODE = /^JNB-\d{4}-[A-Z0-9]{4}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const STORE_LINK = /^https:\/\/jnbcreativestudio\.mitiendanube\.com(\/[^\s"<>]*)?$/;
const DAY = 24 * 60 * 60 * 1000;
const KEEP_INQUIRIES_DAYS = 365;     // las consultas se borran solas al año
const MIN_PUBLIC_REVIEWS = 3;        // la sección de reseñas no aparece con menos de esto
const STAGES = 5;                    // etapas del seguimiento (los nombres están en js/client-pages.js)
const SHOWN_STATUSES = ['enviado', 'aceptado']; // estados del presupuesto en los que el cliente ve la propuesta

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const notFound = () => json({ error: 'not found' }, 404);
const badRequest = () => json({ error: 'bad request' }, 400);

const SAFE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I/L, para que se dicten sin confusión
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const randomFrom = (alphabet, length) => Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => alphabet[b % alphabet.length]).join('');
const newToken = () => randomFrom(ALNUM, 24);
// Número de consulta: JNB-<año><mes>-XXXX. No es correlativo, así no deja ver cuántas consultas hubo.
const newCode = (now) => `JNB-${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}-${randomFrom(SAFE_LETTERS, 4)}`;

const text = (value, max) => (typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');
const oneLine = (value, max) => text(value, max).replace(/\s+/g, ' ');
const isoDate = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '');

export class StudioData extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS inquiries (
      code TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      created TEXT NOT NULL,
      lang TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      plan TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'recibido',
      proposal TEXT,
      mailed INTEGER NOT NULL DEFAULT 0
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS invitations (
      token TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      created TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation TEXT NOT NULL,
      created TEXT NOT NULL,
      lang TEXT NOT NULL,
      name TEXT NOT NULL,
      business TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendiente'
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS projects (
      token TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      project TEXT NOT NULL,
      lang TEXT NOT NULL,
      stage INTEGER NOT NULL DEFAULT 0,
      due TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      next TEXT NOT NULL DEFAULT '',
      preview TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL,
      updated TEXT NOT NULL
    )`);
    // Columnas sumadas después: próximo paso del cliente y link de vista previa
    const columns = this.sql.exec('PRAGMA table_info(projects)').toArray().map((c) => c.name);
    if (!columns.includes('next')) this.sql.exec("ALTER TABLE projects ADD COLUMN next TEXT NOT NULL DEFAULT ''");
    if (!columns.includes('preview')) this.sql.exec("ALTER TABLE projects ADD COLUMN preview TEXT NOT NULL DEFAULT ''");
  }

  // ---- Consultas y pedidos de presupuesto
  addInquiry(data) {
    const now = new Date();
    this.sql.exec('DELETE FROM inquiries WHERE created < ?', new Date(now - KEEP_INQUIRIES_DAYS * DAY).toISOString());
    // Freno para envíos automáticos: como mucho 5 por mail por hora
    const lastHour = new Date(now - DAY / 24).toISOString();
    if (this.sql.exec('SELECT COUNT(*) AS n FROM inquiries WHERE email = ? AND created > ?', data.email, lastHour).one().n >= 5) return null;
    let code = newCode(now);
    while (this.sql.exec('SELECT 1 FROM inquiries WHERE code = ?', code).toArray().length) code = newCode(now);
    const token = newToken();
    this.sql.exec(`INSERT INTO inquiries (code, token, kind, created, lang, name, email, plan, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, code, token, data.kind, now.toISOString(), data.lang, data.name, data.email, data.plan, data.message);
    return { code, token, created: now.toISOString() };
  }

  markMailed(code) {
    this.sql.exec('UPDATE inquiries SET mailed = 1 WHERE code = ?', code);
  }

  inquiryByCode(code) {
    return this.sql.exec('SELECT * FROM inquiries WHERE code = ?', code).toArray()[0] || null;
  }

  quote(token) {
    const row = this.sql.exec("SELECT * FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0];
    if (!row) return null;
    // La propuesta se ve cuando está enviada o ya aceptada
    const proposal = SHOWN_STATUSES.includes(row.status) && row.proposal ? JSON.parse(row.proposal) : null;
    return {
      code: row.code,
      created: row.created,
      lang: row.lang,
      firstName: row.name.split(' ')[0],
      plan: row.plan,
      summary: row.message,
      status: row.status,
      proposal,
    };
  }

  setQuote(token, status, proposal) {
    const row = this.sql.exec("SELECT proposal FROM inquiries WHERE token = ? AND kind = 'presupuesto'", token).toArray()[0];
    if (!row) return false;
    // La fecha de emisión se fija la primera vez que se envía y no cambia al corregir la propuesta
    if (proposal) proposal.issued = (row.proposal && JSON.parse(row.proposal).issued) || new Date().toISOString();
    this.sql.exec('UPDATE inquiries SET status = ?, proposal = ? WHERE token = ?', status, proposal ? JSON.stringify(proposal) : null, token);
    return true;
  }

  // ---- Reseñas
  invite(client) {
    const token = newToken();
    this.sql.exec('INSERT INTO invitations (token, client, created) VALUES (?, ?, ?)', token, client, new Date().toISOString());
    return token;
  }

  invitation(token) {
    return this.sql.exec('SELECT client, used FROM invitations WHERE token = ?', token).toArray()[0] || null;
  }

  addReview(token, review) {
    const invitation = this.invitation(token);
    if (!invitation || invitation.used) return false;
    this.sql.exec(`INSERT INTO reviews (invitation, created, lang, name, business, body) VALUES (?, ?, ?, ?, ?, ?)`,
      token, new Date().toISOString(), review.lang, review.name, review.business, review.body);
    this.sql.exec('UPDATE invitations SET used = 1 WHERE token = ?', token);
    return true;
  }

  publicReviews() {
    const rows = this.sql.exec("SELECT name, business, body, lang FROM reviews WHERE status = 'aprobada' ORDER BY created DESC LIMIT 9").toArray();
    return rows.length >= MIN_PUBLIC_REVIEWS ? rows : [];
  }

  setReview(id, status) {
    if (status === 'borrar') this.sql.exec('DELETE FROM reviews WHERE id = ?', id);
    else this.sql.exec('UPDATE reviews SET status = ? WHERE id = ?', status, id);
  }

  // ---- Seguimiento de proyectos
  addProject(project) {
    const token = newToken();
    const now = new Date().toISOString();
    this.sql.exec(`INSERT INTO projects (token, client, project, lang, due, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      token, project.client, project.project, project.lang, project.due, now, now);
    return token;
  }

  project(token) {
    const row = this.sql.exec('SELECT client, project, lang, stage, due, note, next, preview, updated FROM projects WHERE token = ?', token).toArray()[0];
    return row || null;
  }

  setProject(token, changes) {
    if (changes.remove) {
      this.sql.exec('DELETE FROM projects WHERE token = ?', token);
      return true;
    }
    const found = this.sql.exec('SELECT 1 FROM projects WHERE token = ?', token).toArray().length;
    if (!found) return false;
    this.sql.exec('UPDATE projects SET stage = ?, due = ?, note = ?, next = ?, preview = ?, updated = ? WHERE token = ?',
      changes.stage, changes.due, changes.note, changes.next, changes.preview, new Date().toISOString(), token);
    return true;
  }

  // ---- Panel
  everything() {
    return {
      inquiries: this.sql.exec(`SELECT code, token, kind, created, lang, name, email, plan, message, status, proposal, mailed
        FROM inquiries ORDER BY created DESC LIMIT 300`).toArray()
        .map((row) => ({ ...row, proposal: row.proposal ? JSON.parse(row.proposal) : null })),
      invitations: this.sql.exec('SELECT token, client, created, used FROM invitations ORDER BY created DESC LIMIT 200').toArray(),
      reviews: this.sql.exec('SELECT id, created, lang, name, business, body, status FROM reviews ORDER BY created DESC').toArray(),
      projects: this.sql.exec('SELECT token, client, project, lang, stage, due, note, next, preview, created, updated FROM projects ORDER BY updated DESC').toArray(),
      minPublicReviews: MIN_PUBLIC_REVIEWS,
    };
  }
}

// ---- Envío del mail de confirmación (Resend). Sin claves cargadas, no se manda y no pasa nada.
async function sendMail(env, inquiry, link) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return false;
  const mail = confirmationMail(inquiry, link);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [inquiry.email],
      reply_to: env.MAIL_REPLY_TO || undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  return res.ok;
}

const quoteLink = (lang, token) => `${SITE}/mi-presupuesto/${lang === 'es' ? '' : lang}?c=${token}`;

// La clave del panel se compara sin dar pistas por el tiempo de respuesta.
export function isAdmin(request, env) {
  const key = env.ADMIN_CLAVE;
  const given = request.headers.get('x-clave') || '';
  if (!key || !given) return false;
  const a = new TextEncoder().encode(key);
  const b = new TextEncoder().encode(given);
  if (a.length !== b.length) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

export async function handleStudio(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const store = env.STUDIO.get(env.STUDIO.idFromName('studio'));
  let match;

  // ---- Consultas (formulario del inicio) y pedidos de presupuesto
  if (path === '/api/consultas' && request.method === 'POST') {
    const body = await readJson(request);
    if (!body || body.botcheck) return badRequest();
    const data = {
      kind: body.kind === 'presupuesto' ? 'presupuesto' : 'consulta',
      lang: LANGS.has(body.lang) ? body.lang : 'es',
      name: oneLine(body.name, 100),
      email: oneLine(body.email, 160).toLowerCase(),
      plan: oneLine(body.plan, 100),
      message: text(body.message, 5000),
    };
    if (!data.name || !EMAIL.test(data.email) || !data.message) return badRequest();
    const saved = await store.addInquiry(data);
    if (!saved) return json({ error: 'too many' }, 429);
    const link = data.kind === 'presupuesto' ? quoteLink(data.lang, saved.token) : null;
    let mailed = false;
    try {
      mailed = await sendMail(env, { ...data, code: saved.code, created: saved.created }, link);
      if (mailed) await store.markMailed(saved.code);
    } catch { /* si el mail falla, la consulta igual quedó guardada */ }
    return json({ code: saved.code, link: link && new URL(link).pathname + new URL(link).search, mailed });
  }

  if ((match = path.match(/^\/api\/presupuestos\/([^/]+)$/)) && request.method === 'GET') {
    if (!TOKEN.test(match[1])) return notFound();
    const quote = await store.quote(match[1]);
    return quote ? json(quote) : notFound();
  }

  // ---- Reseñas
  if (path === '/api/resenas' && request.method === 'GET') {
    return json({ reviews: await store.publicReviews() });
  }

  if ((match = path.match(/^\/api\/resenas\/invitacion\/([^/]+)$/))) {
    if (!TOKEN.test(match[1])) return notFound();
    if (request.method === 'GET') {
      const invitation = await store.invitation(match[1]);
      return invitation ? json({ used: Boolean(invitation.used) }) : notFound();
    }
    if (request.method === 'POST') {
      const body = await readJson(request);
      if (!body || body.consent !== true) return badRequest();
      const review = {
        lang: LANGS.has(body.lang) ? body.lang : 'es',
        name: oneLine(body.name, 80),
        business: oneLine(body.business, 100),
        body: text(body.body, 800),
      };
      if (!review.name || !review.business || review.body.length < 20) return badRequest();
      return (await store.addReview(match[1], review)) ? json({ ok: true }) : json({ error: 'used' }, 409);
    }
  }

  // ---- Seguimiento de proyectos
  if ((match = path.match(/^\/api\/proyectos\/([^/]+)$/)) && request.method === 'GET') {
    if (!TOKEN.test(match[1])) return notFound();
    const project = await store.project(match[1]);
    return project ? json({ ...project, stages: STAGES }) : notFound();
  }

  // ---- Panel privado
  if (path === '/api/admin' && request.method === 'GET') {
    return new Response(adminPage(), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
        'x-frame-options': 'DENY',
        'referrer-policy': 'no-referrer',
      },
    });
  }

  if (path.startsWith('/api/admin/')) {
    if (!env.ADMIN_CLAVE) return notFound();
    if (!isAdmin(request, env)) return json({ error: 'clave' }, 401);

    if (path === '/api/admin/datos' && request.method === 'GET') {
      const data = await store.everything();
      data.mailReady = Boolean(env.RESEND_API_KEY && env.MAIL_FROM);
      return json(data);
    }

    if ((match = path.match(/^\/api\/admin\/mail\/([^/]+)$/)) && request.method === 'GET') {
      if (!CODE.test(match[1])) return notFound();
      const inquiry = await store.inquiryByCode(match[1]);
      if (!inquiry) return notFound();
      const link = inquiry.kind === 'presupuesto' ? quoteLink(inquiry.lang, inquiry.token) : null;
      return new Response(confirmationMail(inquiry, link).html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }

    if (request.method !== 'POST') return notFound();
    const body = (await readJson(request)) || {};

    if ((match = path.match(/^\/api\/admin\/presupuestos\/([^/]+)$/))) {
      if (!TOKEN.test(match[1])) return notFound();
      const status = ['recibido', 'preparando', 'enviado', 'aceptado'].includes(body.status) ? body.status : 'recibido';
      const proposal = SHOWN_STATUSES.includes(status) ? {
        price: oneLine(body.price, 80),
        includes: text(body.includes, 2000),
        validUntil: isoDate(body.validUntil),
        note: text(body.note, 1500),
        conditions: text(body.conditions, 2000),
        // Link del plan en la tienda de Tiendanube (para pagar en cuotas). Solo se aceptan links de la tienda.
        storeLink: typeof body.storeLink === 'string' && STORE_LINK.test(body.storeLink.trim()) ? body.storeLink.trim() : '',
      } : null;
      if (proposal && !proposal.price) return badRequest();
      return (await store.setQuote(match[1], status, proposal)) ? json({ ok: true }) : notFound();
    }

    if (path === '/api/admin/resenas/invitar') {
      const client = oneLine(body.client, 100);
      if (!client) return badRequest();
      return json({ token: await store.invite(client) });
    }

    if ((match = path.match(/^\/api\/admin\/resenas\/(\d+)$/))) {
      if (!['aprobada', 'oculta', 'pendiente', 'borrar'].includes(body.status)) return badRequest();
      await store.setReview(Number(match[1]), body.status);
      return json({ ok: true });
    }

    if (path === '/api/admin/proyectos') {
      const project = {
        client: oneLine(body.client, 80),
        project: oneLine(body.project, 120),
        lang: LANGS.has(body.lang) ? body.lang : 'es',
        due: isoDate(body.due),
      };
      if (!project.client || !project.project) return badRequest();
      return json({ token: await store.addProject(project) });
    }

    if ((match = path.match(/^\/api\/admin\/proyectos\/([^/]+)$/))) {
      if (!TOKEN.test(match[1])) return notFound();
      const stage = Number(body.stage);
      const changes = {
        remove: body.remove === true,
        stage: Number.isInteger(stage) && stage >= 0 && stage < STAGES ? stage : 0,
        due: isoDate(body.due),
        note: text(body.note, 1000),
        next: text(body.next, 400),
        // Vista previa: solo links https (por ejemplo la demo en Vercel)
        preview: typeof body.preview === 'string' && /^https:\/\/[^\s"<>]+$/.test(body.preview.trim()) ? body.preview.trim().slice(0, 300) : '',
      };
      return (await store.setProject(match[1], changes)) ? json({ ok: true }) : notFound();
    }
  }

  return notFound();
}
