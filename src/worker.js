// Lazurde Resort · servidor de la web de reservas (Cloudflare Worker)
//
// - Sirve la web (carpeta /public) y responde la API en /api/*.
// - Las reservas se guardan en la base de datos D1 (binding "DB").
// - El panel de administración (/admin) usa la clave secreta ADMIN_PASSWORD.
// - Precios, feriados y cupones viven AQUÍ: la web los pide a /api/config,
//   y el precio final siempre se recalcula en el servidor.

import { createVapidKeys, sendPush } from './push.js';

// ===================== CONFIGURACIÓN =====================
export const CONFIG = {
  weekdayPrice: 240,       // sábado a miércoles (impuestos incluidos)
  weekendPrice: 285,       // noches de jueves y viernes
  holidayPrice: 285,       // feriados
  extraRoomPrice: 15,      // por habitación extra y por noche
  tourismTax: 4,           // %
  vat: 5,                  // %
  deposit: 100,            // depósito de garantía (se paga al llegar)
  baseGuests: 6,
  baseRooms: 3,
  maxGuests: 14,
  maxKing: 3,
  maxTwin: 4,
  weekendDays: [4, 5],     // 4 = jueves, 5 = viernes
  holidays: ['2026-11-25', '2026-11-26'],
  maxNights: 30,
  monthsAhead: 13
};
// Cupones: código → % de descuento sobre el total de la estadía
const COUPONS = { LAZURDE5: 5, LAZURDE10: 10, LAZURDE15: 15, LAZURDE20: 20 };
const EVENTS = ['Family', 'Large family', 'Men’s gathering', 'Women’s gathering', 'Couples', 'Birthday party', 'Wedding', 'Team gathering', 'Other'];
const STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled'];
const HOLDING = ['pending', 'confirmed'];   // estos estados ocupan fechas

// ===================== UTILIDADES =====================
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const bad = (error, status = 400) => json({ ok: false, error }, status);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function addDays(k, n) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function validDate(k) { return DATE_RE.test(k) && addDays(k, 0) === k; }
function dow(k) { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
function omanToday() { return new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10); }
export function nightPrice(k) {
  if (CONFIG.holidays.includes(k)) return CONFIG.holidayPrice;
  return CONFIG.weekendDays.includes(dow(k)) ? CONFIG.weekendPrice : CONFIG.weekdayPrice;
}
export function roomsFor(g) { return CONFIG.baseRooms + Math.max(0, Math.ceil((g - CONFIG.baseGuests) / 2)); }

// Precio en baisas (1 OMR = 1000 baisas) para evitar errores de redondeo
export function quote({ checkin, checkout, guests, coupon }) {
  const nights = [];
  for (let k = checkin; k < checkout; k = addDays(k, 1)) nights.push(k);
  const rooms = roomsFor(guests), extra = rooms - CONFIG.baseRooms;
  const subB = nights.reduce((s, k) => s + nightPrice(k) * 1000, 0) + extra * CONFIG.extraRoomPrice * 1000 * nights.length;
  const pct = coupon ? (COUPONS[coupon] || 0) : 0;
  const discB = Math.round(subB * pct / 1000) * 10;
  return { nights: nights.length, rooms, extra, subtotal: subB / 1000, pct, discount: discB / 1000, total: (subB - discB) / 1000 };
}

function cleanCoupon(c) { return String(c || '').replace(/\s+/g, '').toUpperCase().slice(0, 30); }
function clip(s, n) { return String(s == null ? '' : s).trim().slice(0, n); }
function newCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.getRandomValues(new Uint8Array(5));
  return 'LZ-' + Array.from(b, x => A[x % A.length]).join('');
}

// ===================== BASE DE DATOS =====================
let schemaReady = false;
const EXTRA_COLS = {
  pay_status: "TEXT NOT NULL DEFAULT 'unpaid'",      // unpaid | paid | refunded
  paid_at: 'TEXT', pay_method: 'TEXT', pay_ref: 'TEXT',
  refund_amount: 'REAL NOT NULL DEFAULT 0', refunded_at: 'TEXT',
  deposit_status: "TEXT NOT NULL DEFAULT 'pending'",  // pending | collected | returned | partial
  deposit_kept: 'REAL NOT NULL DEFAULT 0', deposit_note: 'TEXT', deposit_at: 'TEXT',
  source: "TEXT NOT NULL DEFAULT 'web'"               // web | manual
};
const PAY_STATUSES = ['unpaid', 'paid', 'refunded'];
const PAY_METHODS = ['card', 'transfer', 'cash', 'other'];
const DEPOSIT_STATUSES = ['pending', 'collected', 'returned', 'partial'];
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      checkin TEXT NOT NULL, checkout TEXT NOT NULL, nights INTEGER NOT NULL,
      guests INTEGER NOT NULL, rooms INTEGER NOT NULL, kings INTEGER NOT NULL, twins INTEGER NOT NULL,
      event TEXT, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, lang TEXT,
      coupon TEXT, pct INTEGER NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL, discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL,
      notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS bookings_dates ON bookings (status, checkin, checkout)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS blocks (date TEXT PRIMARY KEY, note TEXT, created_at TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS push_subs (endpoint TEXT PRIMARY KEY, p256dh TEXT NOT NULL, auth TEXT NOT NULL, lang TEXT, created_at TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS photos_code ON photos (code)`)
  ]);
  // Columnas nuevas (pago, depósito, origen) en bases ya creadas
  const { results: cols } = await db.prepare(`PRAGMA table_info(bookings)`).all();
  const have = new Set(cols.map(c => c.name));
  for (const [name, def] of Object.entries(EXTRA_COLS)) {
    if (!have.has(name)) await db.prepare(`ALTER TABLE bookings ADD COLUMN ${name} ${def}`).run().catch(e => { if (!/duplicate/i.test(String(e))) throw e; });
  }
  schemaReady = true;
}

// Noches ocupadas (reservas pendientes/confirmadas + fechas bloqueadas) desde hoy
async function unavailableNights(db) {
  const today = omanToday();
  const { results: bk } = await db.prepare(
    `SELECT checkin, checkout FROM bookings WHERE status IN ('pending','confirmed') AND checkout > ?`).bind(today).all();
  const { results: bl } = await db.prepare(`SELECT date FROM blocks WHERE date >= ?`).bind(today).all();
  const set = new Set(bl.map(r => r.date));
  for (const r of bk) for (let k = r.checkin; k < r.checkout; k = addDays(k, 1)) set.add(k);
  return [...set].sort();
}

// ===================== NOTIFICACIONES PUSH =====================
const PUSH_SUBJECT = 'mailto:info@lazurdeom.com';
async function vapidKeys(db) {
  let row = await db.prepare(`SELECT v FROM settings WHERE k = 'vapid'`).first();
  if (!row) {
    const k = await createVapidKeys();
    await db.prepare(`INSERT OR IGNORE INTO settings (k, v) VALUES ('vapid', ?)`).bind(JSON.stringify(k)).run();
    row = await db.prepare(`SELECT v FROM settings WHERE k = 'vapid'`).first();
  }
  return JSON.parse(row.v);
}
const MONTHS = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
function shortDate(k, lang) { const [, m, d] = k.split('-').map(Number); return lang === 'es' ? d + ' ' + MONTHS.es[m - 1] : MONTHS.en[m - 1] + ' ' + d; }
export function bookingNotice(b, lang) {
  const es = lang === 'es';
  return {
    title: (es ? 'Nueva solicitud de reserva · ' : 'New booking request · ') + b.code,
    body: b.name + ' · ' + shortDate(b.checkin, lang) + ' → ' + shortDate(b.checkout, lang) + ' · ' + b.guests + (es ? ' personas · ' : ' guests · ') + b.total + ' OMR',
    tag: b.code,
    url: '/admin/#' + b.code
  };
}
// Envía el aviso a todos los dispositivos suscritos; borra los que ya no existen
export async function notifyAll(db, make) {
  const { results: subs } = await db.prepare(`SELECT * FROM push_subs`).all();
  if (!subs.length) return 0;
  const keys = await vapidKeys(db);
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      const st = await sendPush(s, make(s.lang === 'es' ? 'es' : 'en'), keys, PUSH_SUBJECT);
      if (st === 404 || st === 410) await db.prepare(`DELETE FROM push_subs WHERE endpoint = ?`).bind(s.endpoint).run();
      else if (st < 300) sent++;
      else console.error('push', st, new URL(s.endpoint).host);
    } catch (e) { console.error('push error', e); }
  }));
  return sent;
}

// ===================== SESIÓN DEL PANEL =====================
const enc = new TextEncoder();
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const SESSION_DAYS = 30;   // en el celular o PC de la oficina no hay que entrar a cada rato
async function makeToken(env) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return exp + '.' + await hmac(env.ADMIN_PASSWORD, 'lz-admin.' + exp);
}
async function isAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  if (request.method !== 'GET' && request.headers.get('x-lz') !== '1') return false;   // protección CSRF
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)lz_admin=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(env.ADMIN_PASSWORD, 'lz-admin.' + exp));
}
const COOKIE = (v, maxAge) => `lz_admin=${v}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

// ===================== API PÚBLICA =====================
async function apiConfig(env) {
  let unavailable = [];
  if (env.DB) { await ensureSchema(env.DB); unavailable = await unavailableNights(env.DB); }
  const { weekdayPrice, weekendPrice, holidayPrice, extraRoomPrice, tourismTax, vat, deposit, baseGuests, baseRooms, maxGuests, maxKing, maxTwin, weekendDays, holidays } = CONFIG;
  return json({ ok: true, bookingsEnabled: !!env.DB, config: { weekdayPrice, weekendPrice, holidayPrice, extraRoomPrice, tourismTax, vat, deposit, baseGuests, baseRooms, maxGuests, maxKing, maxTwin, weekendDays, holidays }, unavailable });
}

function apiCoupon(url) {
  const code = cleanCoupon(url.searchParams.get('code'));
  const pct = COUPONS[code];
  return pct ? json({ ok: true, code, pct }) : json({ ok: false, error: 'invalid_coupon' });
}

export function validateBooking(b) {
  const checkin = String(b.checkin || ''), checkout = String(b.checkout || '');
  if (!validDate(checkin) || !validDate(checkout)) return 'invalid_dates';
  if (checkin < omanToday()) return 'past_date';
  if (checkout <= checkin) return 'invalid_dates';
  const n = Math.round((Date.parse(checkout) - Date.parse(checkin)) / 864e5);
  if (n > CONFIG.maxNights) return 'too_many_nights';
  if (checkin > addDays(omanToday(), CONFIG.monthsAhead * 31)) return 'too_far';
  const guests = Number(b.guests);
  if (!Number.isInteger(guests) || guests < CONFIG.baseGuests || guests > CONFIG.maxGuests) return 'invalid_guests';
  const rooms = roomsFor(guests), kings = Number(b.kings);
  if (!Number.isInteger(kings) || kings < Math.max(0, rooms - CONFIG.maxTwin) || kings > Math.min(CONFIG.maxKing, rooms)) return 'invalid_beds';
  if (clip(b.name, 120).length < 2) return 'invalid_name';
  if (!/^\+\d{6,16}$/.test(String(b.phone || '').replace(/[\s-]/g, ''))) return 'invalid_phone';
  const email = clip(b.email, 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'invalid_email';
  if (b.event !== null && b.event !== undefined && !(Number.isInteger(b.event) && b.event >= 0 && b.event < EVENTS.length)) return 'invalid_event';
  if (b.termsAccepted !== true) return 'terms_not_accepted';
  return null;
}

async function apiCreateBooking(request, env, ctx) {
  if (!env.DB) return bad('bookings_disabled', 503);
  let b;
  try { b = await request.json(); } catch (e) { return bad('invalid_json'); }
  const err = validateBooking(b);
  if (err) return bad(err);
  await ensureSchema(env.DB);
  const coupon = cleanCoupon(b.coupon);
  if (coupon && !COUPONS[coupon]) return bad('invalid_coupon');
  const q = quote({ checkin: b.checkin, checkout: b.checkout, guests: Number(b.guests), coupon });
  const kings = Number(b.kings), twins = q.rooms - kings;
  const now = new Date().toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    // Inserta SOLO si ninguna noche se cruza con otra reserva activa o una fecha bloqueada (en una sola operación)
    const res = await env.DB.prepare(`INSERT INTO bookings
      (code, status, checkin, checkout, nights, guests, rooms, kings, twins, event, name, phone, email, lang, coupon, pct, subtotal, discount, total, created_at, updated_at)
      SELECT ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE status IN ('pending','confirmed') AND checkin < ? AND checkout > ?)
        AND NOT EXISTS (SELECT 1 FROM blocks WHERE date >= ? AND date < ?)`)
      .bind(code, b.checkin, b.checkout, q.nights, Number(b.guests), q.rooms, kings, twins,
        b.event == null ? null : EVENTS[b.event], clip(b.name, 120), String(b.phone).replace(/[\s-]/g, ''), clip(b.email, 160) || null,
        ['ar', 'en', 'es'].includes(b.lang) ? b.lang : 'en', coupon || null, q.pct, q.subtotal, q.discount, q.total, now, now,
        b.checkout, b.checkin, b.checkin, b.checkout)
      .run()
      .catch(e => ({ error: e }));
    if (res.error) { if (String(res.error).includes('UNIQUE')) continue; throw res.error; }
    if (!res.meta || res.meta.changes !== 1) return bad('dates_unavailable', 409);
    const notice = { code, name: clip(b.name, 120), checkin: b.checkin, checkout: b.checkout, guests: Number(b.guests), total: q.total };
    const job = notifyAll(env.DB, lang => bookingNotice(notice, lang)).catch(e => console.error(e));
    if (ctx && ctx.waitUntil) ctx.waitUntil(job);
    return json({ ok: true, code, status: 'pending', nights: q.nights, rooms: q.rooms, subtotal: q.subtotal, pct: q.pct, discount: q.discount, total: q.total });
  }
  return bad('try_again', 500);
}

// ===================== API DEL PANEL =====================
async function apiAdmin(request, env, url) {
  const path = url.pathname.replace(/^\/api\/admin/, '');
  if (path === '/login' && request.method === 'POST') {
    if (!env.ADMIN_PASSWORD) return bad('admin_not_configured', 503);
    let body = {};
    try { body = await request.json(); } catch (e) {}
    await new Promise(r => setTimeout(r, 400));   // frena intentos repetidos
    const ok = typeof body.password === 'string' && safeEqual(await hmac('lz', body.password), await hmac('lz', env.ADMIN_PASSWORD));
    if (!ok) return bad('wrong_password', 401);
    return json({ ok: true }, 200, { 'set-cookie': COOKIE(await makeToken(env), SESSION_DAYS * 86400) });
  }
  if (path === '/logout') return json({ ok: true }, 200, { 'set-cookie': COOKIE('', 0) });
  if (!(await isAdmin(request, env))) return bad('unauthorized', 401);
  if (!env.DB) return bad('db_not_configured', 503);
  await ensureSchema(env.DB);

  if (path === '/me') return json({ ok: true });

  // --- notificaciones ---
  if (path === '/push/key' && request.method === 'GET') return json({ ok: true, key: (await vapidKeys(env.DB)).publicKey });
  if (path === '/push/subscribe' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const ep = String(body.endpoint || ''), k = body.keys || {};
    if (!/^https:\/\/[^\s]{10,}$/.test(ep) || ep.length > 1000 || !/^[\w-]{80,100}$/.test(k.p256dh || '') || !/^[\w-]{16,30}$/.test(k.auth || '')) return bad('invalid_subscription');
    await env.DB.prepare(`INSERT OR REPLACE INTO push_subs (endpoint, p256dh, auth, lang, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(ep, k.p256dh, k.auth, body.lang === 'es' ? 'es' : 'en', new Date().toISOString()).run();
    return json({ ok: true });
  }
  if (path === '/push/unsubscribe' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    await env.DB.prepare(`DELETE FROM push_subs WHERE endpoint = ?`).bind(String(body.endpoint || '')).run();
    return json({ ok: true });
  }
  if (path === '/push/test' && request.method === 'POST') {
    const sent = await notifyAll(env.DB, lang => lang === 'es'
      ? { title: 'Lazurde · prueba', body: 'Las notificaciones funcionan ✅', tag: 'test', url: '/admin/' }
      : { title: 'Lazurde · test', body: 'Notifications are working ✅', tag: 'test', url: '/admin/' });
    return json({ ok: true, sent });
  }

  if (path === '/bookings' && request.method === 'GET') {
    const st = url.searchParams.get('status');
    const q = STATUSES.includes(st)
      ? env.DB.prepare(`SELECT * FROM bookings WHERE status = ? ORDER BY checkin ASC LIMIT 500`).bind(st)
      : env.DB.prepare(`SELECT * FROM bookings ORDER BY created_at DESC LIMIT 500`);
    const { results } = await q.all();
    const { results: counts } = await env.DB.prepare(`SELECT status, COUNT(*) AS n FROM bookings GROUP BY status`).all();
    return json({ ok: true, bookings: results, counts: Object.fromEntries(counts.map(r => [r.status, r.n])) });
  }

  // --- precio para reservas manuales ---
  if (path === '/quote' && request.method === 'GET') {
    const ci = url.searchParams.get('checkin') || '', co = url.searchParams.get('checkout') || '', g = Number(url.searchParams.get('guests'));
    if (!validDate(ci) || !validDate(co) || co <= ci || !Number.isInteger(g) || g < 1 || g > CONFIG.maxGuests) return bad('invalid');
    return json({ ok: true, quote: quote({ checkin: ci, checkout: co, guests: g }) });
  }

  // --- reserva manual (llamada, WhatsApp, en persona) ---
  if (path === '/bookings' && request.method === 'POST') {
    let b = {};
    try { b = await request.json(); } catch (e) { return bad('invalid_json'); }
    const ci = String(b.checkin || ''), co = String(b.checkout || ''), guests = Number(b.guests);
    if (!validDate(ci) || !validDate(co) || co <= ci) return bad('invalid_dates');
    if (Math.round((Date.parse(co) - Date.parse(ci)) / 864e5) > 60) return bad('too_many_nights');
    if (!Number.isInteger(guests) || guests < 1 || guests > CONFIG.maxGuests) return bad('invalid_guests');
    const q = quote({ checkin: ci, checkout: co, guests });
    const kings = b.kings == null ? Math.min(CONFIG.maxKing, q.rooms) : Number(b.kings);
    if (!Number.isInteger(kings) || kings < Math.max(0, q.rooms - CONFIG.maxTwin) || kings > Math.min(CONFIG.maxKing, q.rooms)) return bad('invalid_beds');
    const name = clip(b.name, 120), phone = String(b.phone || '').replace(/[\s-]/g, ''), email = clip(b.email, 160);
    if (name.length < 2) return bad('invalid_name');
    if (!/^\+\d{6,16}$/.test(phone)) return bad('invalid_phone');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('invalid_email');
    if (b.event != null && !(Number.isInteger(b.event) && b.event >= 0 && b.event < EVENTS.length)) return bad('invalid_event');
    let total = q.total, discount = 0;
    if (b.total != null && b.total !== '') {
      total = Math.round(Number(b.total) * 1000) / 1000;
      if (!(total >= 0 && total <= 100000)) return bad('invalid_total');
      discount = Math.max(0, Math.round((q.subtotal - total) * 1000) / 1000);
    }
    const paid = b.paid === true;
    if (paid && !PAY_METHODS.includes(b.payMethod)) return bad('invalid_method');
    const status = b.status === 'confirmed' ? 'confirmed' : 'pending';
    const now = new Date().toISOString();
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = newCode();
      const res = await env.DB.prepare(`INSERT INTO bookings
        (code, status, checkin, checkout, nights, guests, rooms, kings, twins, event, name, phone, email, lang, coupon, pct, subtotal, discount, total, notes, created_at, updated_at,
         pay_status, paid_at, pay_method, pay_ref, source)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual'
        WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE status IN ('pending','confirmed') AND checkin < ? AND checkout > ?)
          AND NOT EXISTS (SELECT 1 FROM blocks WHERE date >= ? AND date < ?)`)
        .bind(code, status, ci, co, q.nights, guests, q.rooms, kings, q.rooms - kings, b.event == null ? null : EVENTS[b.event], name, phone, email || null,
          ['ar', 'en', 'es'].includes(b.lang) ? b.lang : 'ar', Math.max(q.subtotal, total), discount, total, clip(b.notes, 2000) || null, now, now,
          paid ? 'paid' : 'unpaid', paid ? now : null, paid ? b.payMethod : null, paid ? clip(b.payRef, 80) || null : null,
          co, ci, ci, co)
        .run().catch(e => ({ error: e }));
      if (res.error) { if (String(res.error).includes('UNIQUE')) continue; throw res.error; }
      if (!res.meta || res.meta.changes !== 1) return bad('dates_unavailable', 409);
      return json({ ok: true, booking: await env.DB.prepare(`SELECT * FROM bookings WHERE code = ?`).bind(code).first() });
    }
    return bad('try_again', 500);
  }

  // --- fotos del depósito (inspección) ---
  const mp = path.match(/^\/bookings\/(LZ-[A-Z0-9]{5})\/photos$/);
  if (mp && request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT id, created_at FROM photos WHERE code = ? ORDER BY id`).bind(mp[1]).all();
    return json({ ok: true, photos: results });
  }
  if (mp && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const data = String(body.data || '');
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data) || data.length > 1400000) return bad('invalid_photo');
    if (!(await env.DB.prepare(`SELECT 1 FROM bookings WHERE code = ?`).bind(mp[1]).first())) return bad('not_found', 404);
    const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM photos WHERE code = ?`).bind(mp[1]).first();
    if (n.n >= 15) return bad('too_many_photos');
    await env.DB.prepare(`INSERT INTO photos (code, data, created_at) VALUES (?, ?, ?)`).bind(mp[1], data, new Date().toISOString()).run();
    return json({ ok: true });
  }
  const mph = path.match(/^\/photos\/(\d+)$/);
  if (mph && request.method === 'GET') {
    const r = await env.DB.prepare(`SELECT data FROM photos WHERE id = ?`).bind(Number(mph[1])).first();
    if (!r) return bad('not_found', 404);
    const [, type, b64] = r.data.match(/^data:(image\/\w+);base64,(.*)$/);
    const bin = atob(b64), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return new Response(out, { headers: { 'content-type': type, 'cache-control': 'private, max-age=86400' } });
  }
  if (mph && request.method === 'DELETE') {
    await env.DB.prepare(`DELETE FROM photos WHERE id = ?`).bind(Number(mph[1])).run();
    return json({ ok: true });
  }

  const m = path.match(/^\/bookings\/(LZ-[A-Z0-9]{5})$/);
  if (m && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const now = new Date().toISOString();
    const cur = await env.DB.prepare(`SELECT * FROM bookings WHERE code = ?`).bind(m[1]).first();
    if (!cur) return bad('not_found', 404);
    // Pago (siempre el 100%)
    if (body.payment) {
      const p = body.payment;
      if (!PAY_STATUSES.includes(p.status)) return bad('invalid_payment');
      if (p.status === 'unpaid') {
        await env.DB.prepare(`UPDATE bookings SET pay_status = 'unpaid', paid_at = NULL, pay_method = NULL, pay_ref = NULL, refund_amount = 0, refunded_at = NULL, updated_at = ? WHERE code = ?`).bind(now, m[1]).run();
      } else if (p.status === 'paid') {
        if (!PAY_METHODS.includes(p.method)) return bad('invalid_method');
        await env.DB.prepare(`UPDATE bookings SET pay_status = 'paid', paid_at = ?, pay_method = ?, pay_ref = ?, refund_amount = 0, refunded_at = NULL, updated_at = ? WHERE code = ?`)
          .bind(now, p.method, clip(p.ref, 80) || null, now, m[1]).run();
      } else {
        if (cur.pay_status === 'unpaid') return bad('not_paid');
        const amt = Math.round(Number(p.amount) * 1000) / 1000;
        if (!(amt > 0 && amt <= cur.total)) return bad('invalid_amount');
        await env.DB.prepare(`UPDATE bookings SET pay_status = 'refunded', refund_amount = ?, refunded_at = ?, updated_at = ? WHERE code = ?`).bind(amt, now, now, m[1]).run();
      }
    }
    // Depósito de garantía
    if (body.deposit) {
      const d = body.deposit;
      if (!DEPOSIT_STATUSES.includes(d.status)) return bad('invalid_deposit');
      let kept = 0;
      if (d.status === 'partial') {
        kept = Math.round(Number(d.kept) * 1000) / 1000;
        if (!(kept > 0 && kept <= CONFIG.deposit)) return bad('invalid_amount');
      }
      await env.DB.prepare(`UPDATE bookings SET deposit_status = ?, deposit_kept = ?, deposit_note = ?, deposit_at = ?, updated_at = ? WHERE code = ?`)
        .bind(d.status, kept, clip(d.note, 300) || null, d.status === 'pending' ? null : now, now, m[1]).run();
    }
    if (typeof body.notes === 'string') {
      await env.DB.prepare(`UPDATE bookings SET notes = ?, updated_at = ? WHERE code = ?`).bind(clip(body.notes, 2000), now, m[1]).run();
    }
    if (body.status) {
      if (!STATUSES.includes(body.status)) return bad('invalid_status');
      // Volver a activar una reserva solo si sus fechas siguen libres
      if (HOLDING.includes(body.status) && !HOLDING.includes(cur.status)) {
        const clash = await env.DB.prepare(`SELECT 1 FROM bookings WHERE code != ? AND status IN ('pending','confirmed') AND checkin < ? AND checkout > ? LIMIT 1`)
          .bind(m[1], cur.checkout, cur.checkin).first();
        if (clash) return bad('dates_unavailable', 409);
      }
      await env.DB.prepare(`UPDATE bookings SET status = ?, updated_at = ? WHERE code = ?`).bind(body.status, now, m[1]).run();
    }
    return json({ ok: true, booking: await env.DB.prepare(`SELECT * FROM bookings WHERE code = ?`).bind(m[1]).first() });
  }

  if (path === '/blocks' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT * FROM blocks WHERE date >= ? ORDER BY date`).bind(omanToday()).all();
    return json({ ok: true, blocks: results });
  }
  if (path === '/blocks' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const from = String(body.from || ''), to = String(body.to || body.from || '');
    if (!validDate(from) || !validDate(to) || to < from) return bad('invalid_dates');
    const days = [];
    for (let k = from; k <= to && days.length < 366; k = addDays(k, 1)) days.push(k);
    const now = new Date().toISOString(), note = clip(body.note, 200) || null;
    await env.DB.batch(days.map(d => env.DB.prepare(`INSERT OR REPLACE INTO blocks (date, note, created_at) VALUES (?, ?, ?)`).bind(d, note, now)));
    return json({ ok: true, added: days.length });
  }
  const mb = path.match(/^\/blocks\/(\d{4}-\d{2}-\d{2})$/);
  if (mb && request.method === 'DELETE') {
    await env.DB.prepare(`DELETE FROM blocks WHERE date = ?`).bind(mb[1]).run();
    return json({ ok: true });
  }
  return bad('not_found', 404);
}

// ===================== ENTRADA =====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/config' && request.method === 'GET') return await apiConfig(env);
        if (url.pathname === '/api/coupon' && request.method === 'GET') return apiCoupon(url);
        if (url.pathname === '/api/bookings' && request.method === 'POST') return await apiCreateBooking(request, env, ctx);
        if (url.pathname.startsWith('/api/admin')) return await apiAdmin(request, env, url);
        return bad('not_found', 404);
      } catch (e) {
        console.error(e);
        return bad('server_error', 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
