import { DatabaseSync } from 'node:sqlite';
import worker, { quote } from '../src/worker.js';
// D1 simulado sobre SQLite
function D1(db) {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
    _run: () => db.prepare(sql).run(...args)
  });
  return { prepare: sql => stmt(sql), batch: async list => list.map(s => s._run()) };
}
const env = { DB: D1(new DatabaseSync(':memory:')), ADMIN_PASSWORD: 'secreto-prueba', ASSETS: { fetch: () => new Response('asset') } };
const call = async (method, path, body, headers = {}) => {
  const r = await worker.fetch(new Request('https://lazurdeom.com' + path, { method, headers: { 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined }), env);
  return { status: r.status, cookie: r.headers.get('set-cookie'), body: await r.json().catch(() => null) };
};
const ok = (cond, msg) => { console.log((cond ? '✔' : '✘ FALLO') + ' ' + msg); if (!cond) process.exitCode = 1; };
const base = { checkin: '2026-11-10', checkout: '2026-11-12', guests: 9, kings: 3, name: 'Ahmed Test', phone: '+96891234567', email: 'a@b.com', lang: 'ar', event: 0, termsAccepted: true };

let r = await call('GET', '/api/config'); ok(r.body.ok && r.body.bookingsEnabled && r.body.unavailable.length === 0, 'config sin fechas ocupadas');
r = await call('GET', '/api/coupon?code=%20lazurde10'); ok(r.body.pct === 10, 'cupón válido 10%');
r = await call('GET', '/api/coupon?code=FALSO'); ok(!r.body.ok, 'cupón falso rechazado');
r = await call('POST', '/api/bookings', { ...base, coupon: 'LAZURDE10' }); ok(r.status === 200 && r.body.total === 486 && r.body.discount === 54, 'reserva creada: total 486, descuento 54 → ' + JSON.stringify(r.body));
const code = r.body.code;
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-11-11', checkout: '2026-11-13' }); ok(r.status === 409, 'reserva que se cruza → rechazada (409)');
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-11-12', checkout: '2026-11-13' }); ok(r.status === 200, 'llegar el día que el otro sale → permitido');
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-11-09', checkout: '2026-11-10' }); ok(r.status === 200, 'salir el día que el otro llega → permitido');
r = await call('GET', '/api/config'); ok(JSON.stringify(r.body.unavailable) === JSON.stringify(['2026-11-09','2026-11-10','2026-11-11','2026-11-12']), 'noches ocupadas: ' + r.body.unavailable);
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-12-01', checkout: '2026-12-03', guests: 14, kings: 0 }); ok(r.status === 400 && r.body.error === 'invalid_beds', 'camas imposibles rechazadas');
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-12-01', checkout: '2026-12-03', guests: 15 }); ok(r.body.error === 'invalid_guests', '15 personas rechazado');
r = await call('POST', '/api/bookings', { ...base, checkin: '2020-01-01', checkout: '2020-01-02' }); ok(r.body.error === 'past_date', 'fecha pasada rechazada');
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-12-01', checkout: '2026-12-03', total: 1, coupon: 'HACK99' }); ok(r.body.error === 'invalid_coupon', 'cupón inventado rechazado');
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-12-01', checkout: '2026-12-03', termsAccepted: false }); ok(r.body.error === 'terms_not_accepted', 'sin aceptar términos rechazado');
// feriado 25-26 nov, 14 personas, 2 noches, cupón 15
const q = quote({ checkin: '2026-11-25', checkout: '2026-11-27', guests: 14, coupon: 'LAZURDE15' }); ok(q.total === 586.5 && q.discount === 103.5, 'precio feriado 14 pers + 15% = 586.5');
// Panel
r = await call('GET', '/api/admin/bookings'); ok(r.status === 401, 'panel sin sesión → 401');
r = await call('POST', '/api/admin/login', { password: 'mala' }); ok(r.status === 401, 'clave incorrecta → 401');
r = await call('POST', '/api/admin/login', { password: 'secreto-prueba' }); ok(r.status === 200 && /HttpOnly/.test(r.cookie), 'login correcto con cookie segura');
const ck = r.cookie.split(';')[0];
r = await call('GET', '/api/admin/bookings', null, { cookie: ck }); ok(r.body.bookings.length === 3 && r.body.counts.pending === 3, 'lista: 3 pendientes');
r = await call('POST', '/api/admin/bookings/' + code, { status: 'confirmed' }, { cookie: ck }); ok(r.status === 401, 'cambio sin cabecera anti-CSRF → 401');
r = await call('POST', '/api/admin/bookings/' + code, { status: 'confirmed' }, { cookie: ck, 'x-lz': '1' }); ok(r.body.booking.status === 'confirmed', 'confirmar reserva');
r = await call('POST', '/api/admin/bookings/' + code, { status: 'cancelled' }, { cookie: ck, 'x-lz': '1' }); ok(r.body.booking.status === 'cancelled', 'cancelar reserva');
r = await call('GET', '/api/config'); ok(!r.body.unavailable.includes('2026-11-10'), 'al cancelar se liberan las fechas');
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-11-10', checkout: '2026-11-12' }); ok(r.status === 200, 'otro cliente puede reservar las fechas liberadas');
r = await call('POST', '/api/admin/bookings/' + code, { status: 'pending' }, { cookie: ck, 'x-lz': '1' }); ok(r.status === 409, 'reactivar la cancelada con fechas tomadas → 409');
r = await call('POST', '/api/admin/blocks', { from: '2026-12-24', to: '2026-12-26', note: 'Mantenimiento' }, { cookie: ck, 'x-lz': '1' }); ok(r.body.added === 3, 'bloquear 3 fechas');
r = await call('POST', '/api/bookings', { ...base, checkin: '2026-12-25', checkout: '2026-12-27' }); ok(r.status === 409, 'reservar sobre fecha bloqueada → 409');
r = await call('DELETE', '/api/admin/blocks/2026-12-25', null, { cookie: ck, 'x-lz': '1' }); ok(r.body.ok, 'desbloquear una fecha');
r = await call('GET', '/booking/'); ok(r.status === 200, 'la web sigue sirviéndose');
const noDb = { ASSETS: env.ASSETS };
const r2 = await worker.fetch(new Request('https://x/api/config'), noDb); const j2 = await r2.json(); ok(j2.ok && j2.bookingsEnabled === false, 'sin base de datos: config funciona y avisa');
const r3 = await worker.fetch(new Request('https://x/api/bookings', { method: 'POST', body: '{}' }), noDb); ok(r3.status === 503, 'sin base de datos: reservas → 503');

// ---------- Notificaciones push ----------
{
  const { unb64u, b64u } = await import('../src/push.js');
  const te = new TextEncoder();
  // "Teléfono" falso con sus propias claves
  const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const uaPub = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const sub = { endpoint: 'https://push.example.com/send/abc123xyz', keys: { p256dh: b64u(uaPub), auth: b64u(auth) }, lang: 'es' };
  r = await call('GET', '/api/admin/push/key', null, { cookie: ck }); ok(r.body.ok && unb64u(r.body.key).length === 65, 'clave pública VAPID creada');
  const vapidPub = r.body.key;
  r = await call('POST', '/api/admin/push/subscribe', { endpoint: 'http://mal', keys: {} }, { cookie: ck, 'x-lz': '1' }); ok(r.status === 400, 'suscripción inválida rechazada');
  r = await call('POST', '/api/admin/push/subscribe', sub, { cookie: ck, 'x-lz': '1' }); ok(r.body.ok, 'dispositivo suscrito');
  // Interceptar el envío
  const sent = []; const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url, init }); return new Response('', { status: 201 }); };
  const waits = [];
  const res = await worker.fetch(new Request('https://lazurdeom.com/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...base, checkin: '2027-01-05', checkout: '2027-01-07', name: 'Salim Prueba' }) }), env, { waitUntil: p => waits.push(p) });
  await Promise.all(waits);
  globalThis.fetch = realFetch;
  ok(res.status === 200 && sent.length === 1 && sent[0].url === sub.endpoint, 'nueva reserva → se envía aviso push');
  const h = sent[0].init.headers;
  // Verificar firma VAPID
  const [, jwt, k] = h.authorization.match(/^vapid t=([^,]+), k=(.+)$/);
  const [hd, cl, sg] = jwt.split('.');
  const vk = await crypto.subtle.importKey('raw', unb64u(k), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const good = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, vk, unb64u(sg), te.encode(hd + '.' + cl));
  const claims = JSON.parse(new TextDecoder().decode(unb64u(cl)));
  ok(good && k === vapidPub && claims.aud === 'https://push.example.com', 'firma VAPID válida');
  // Descifrar como lo haría el teléfono
  const body = new Uint8Array(sent[0].init.body);
  const salt = body.slice(0, 16), idlen = body[20], asPub = body.slice(21, 21 + idlen), ct = body.slice(21 + idlen);
  const hk = async (s, ikm, info, n) => new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: s, info }, await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), n * 8));
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []) }, ua.privateKey, 256));
  const info = new Uint8Array([...te.encode('WebPush: info\0'), ...uaPub, ...asPub]);
  const ikm = await hk(auth, shared, info, 32);
  const cek = await hk(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16), nonce = await hk(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']), ct));
  const msg = JSON.parse(new TextDecoder().decode(pt.slice(0, -1)));
  ok(/^Nueva solicitud de reserva · LZ-/.test(msg.title) && msg.body.includes('Salim Prueba') && msg.body.includes('5 ene → 7 ene'), 'aviso descifrado en español: ' + msg.title + ' — ' + msg.body);
  // Dispositivo que ya no existe → se borra
  globalThis.fetch = async () => new Response('', { status: 410 });
  r = await call('POST', '/api/admin/push/test', {}, { cookie: ck, 'x-lz': '1' });
  globalThis.fetch = realFetch;
  ok(r.body.sent === 0, 'prueba con dispositivo vencido');
  r = await call('POST', '/api/admin/push/test', {}, { cookie: ck, 'x-lz': '1' }); ok(r.body.sent === 0, 'dispositivo vencido eliminado de la lista');
}

// ---------- Pagos, depósito, reservas manuales, fotos ----------
{
  const H = { cookie: ck, 'x-lz': '1' };
  r = await call('GET', '/api/admin/quote?checkin=2027-02-03&checkout=2027-02-05&guests=8', null, { cookie: ck }); ok(r.body.quote.total === 555, 'precio para reserva manual: ' + r.body.quote.total);
  r = await call('POST', '/api/admin/bookings', { checkin: '2027-02-03', checkout: '2027-02-05', guests: 8, name: 'Cliente Teléfono', phone: '+968 9988 7766', paid: true, payMethod: 'transfer', payRef: 'TRX-1', status: 'confirmed' }, H);
  ok(r.status === 200 && r.body.booking.source === 'manual' && r.body.booking.pay_status === 'paid' && r.body.booking.status === 'confirmed' && r.body.booking.total === 555, 'reserva manual pagada y confirmada');
  const mc = r.body.booking.code;
  r = await call('POST', '/api/admin/bookings', { checkin: '2027-02-04', checkout: '2027-02-06', guests: 6, name: 'Choque', phone: '+96811112222' }, H); ok(r.status === 409, 'reserva manual que se cruza → 409');
  r = await call('POST', '/api/admin/bookings', { checkin: '2027-03-01', checkout: '2027-03-02', guests: 6, name: 'Precio especial', phone: '+96811112222', total: 200 }, H);
  ok(r.body.booking.total === 200 && r.body.booking.discount === 40 && r.body.booking.pay_status === 'unpaid' && r.body.booking.status === 'pending', 'reserva manual con precio especial, sin pagar');
  const sc = r.body.booking.code;
  r = await call('POST', '/api/admin/bookings', { checkin: '2027-03-05', checkout: '2027-03-06', guests: 6, name: 'X', phone: '+968' }, H); ok(r.status === 400, 'reserva manual con datos malos → 400');
  r = await call('POST', '/api/admin/bookings', { checkin: '2027-03-10', checkout: '2027-03-11', guests: 6, name: 'Con cupón', phone: '+96811112222', coupon: 'lazurde10' }, H);
  ok(r.body.booking.total === 216 && r.body.booking.coupon === 'LAZURDE10' && r.body.booking.pct === 10, 'reserva manual con cupón 10%: ' + r.body.booking.total);
  r = await call('POST', '/api/admin/bookings', { checkin: '2027-03-12', checkout: '2027-03-13', guests: 5, name: 'Pocos', phone: '+96811112222' }, H); ok(r.body.error === 'invalid_guests', 'reserva manual con menos de 6 personas → rechazada');
  // pago
  r = await call('POST', '/api/admin/bookings/' + sc, { payment: { status: 'refunded', amount: 50 } }, H); ok(r.body.error === 'not_paid', 'no se reembolsa lo que no se ha pagado');
  r = await call('POST', '/api/admin/bookings/' + sc, { payment: { status: 'paid', method: 'card', ref: 'PM-77' }, status: 'confirmed' }, H);
  ok(r.body.booking.pay_status === 'paid' && r.body.booking.pay_method === 'card' && r.body.booking.status === 'confirmed', 'registrar pago y confirmar en un paso');
  r = await call('POST', '/api/admin/bookings/' + sc, { payment: { status: 'refunded', amount: 999 } }, H); ok(r.body.error === 'invalid_amount', 'reembolso mayor que el total → rechazado');
  r = await call('POST', '/api/admin/bookings/' + sc, { payment: { status: 'refunded', amount: 100 }, status: 'cancelled' }, H);
  ok(r.body.booking.pay_status === 'refunded' && r.body.booking.refund_amount === 100 && r.body.booking.status === 'cancelled', 'cancelar con reembolso parcial');
  // depósito
  r = await call('POST', '/api/admin/bookings/' + mc, { deposit: { status: 'collected' } }, H); ok(r.body.booking.deposit_status === 'collected', 'depósito cobrado');
  r = await call('POST', '/api/admin/bookings/' + mc, { deposit: { status: 'partial', kept: 150 } }, H); ok(r.body.error === 'invalid_amount', 'retener más de 100 → rechazado');
  r = await call('POST', '/api/admin/bookings/' + mc, { deposit: { status: 'partial', kept: 30, note: 'Vaso roto' } }, H);
  ok(r.body.booking.deposit_status === 'partial' && r.body.booking.deposit_kept === 30 && r.body.booking.deposit_note === 'Vaso roto', 'depósito: retener 30 con motivo');
  // fotos
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  r = await call('POST', '/api/admin/bookings/' + mc + '/photos', { data: 'javascript:alert(1)' }, H); ok(r.status === 400, 'foto inválida rechazada');
  r = await call('POST', '/api/admin/bookings/' + mc + '/photos', { data: png }, H); ok(r.body.ok, 'foto subida');
  r = await call('GET', '/api/admin/bookings/' + mc + '/photos', null, { cookie: ck }); ok(r.body.photos.length === 1, 'lista de fotos');
  const pid = r.body.photos[0].id;
  const img = await worker.fetch(new Request('https://lazurdeom.com/api/admin/photos/' + pid, { headers: { cookie: ck } }), env);
  ok(img.headers.get('content-type') === 'image/png' && (await img.arrayBuffer()).byteLength === 70, 'ver foto');
  const img2 = await worker.fetch(new Request('https://lazurdeom.com/api/admin/photos/' + pid), env); ok(img2.status === 401, 'foto sin sesión → 401');
  r = await call('DELETE', '/api/admin/photos/' + pid, null, H); ok(r.body.ok, 'borrar foto');
}
// Base de datos vieja (sin columnas nuevas) se actualiza sola
{
  const { DatabaseSync } = await import('node:sqlite');
  const raw = new DatabaseSync(':memory:');
  raw.exec(`CREATE TABLE bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'pending', checkin TEXT NOT NULL, checkout TEXT NOT NULL, nights INTEGER NOT NULL, guests INTEGER NOT NULL, rooms INTEGER NOT NULL, kings INTEGER NOT NULL, twins INTEGER NOT NULL, event TEXT, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, lang TEXT, coupon TEXT, pct INTEGER NOT NULL DEFAULT 0, subtotal REAL NOT NULL, discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    INSERT INTO bookings (code, checkin, checkout, nights, guests, rooms, kings, twins, name, phone, subtotal, total, created_at, updated_at) VALUES ('LZ-OLD11','2027-05-01','2027-05-02',1,6,3,3,0,'Viejo','+96890000000',240,240,'x','x');`);
  const { default: w2 } = await import('../src/worker.js?fresh=' + Date.now());
  const env2 = { DB: D1(raw), ADMIN_PASSWORD: 'p', ASSETS: env.ASSETS };
  const lg = await w2.fetch(new Request('https://x/api/admin/login', { method: 'POST', body: JSON.stringify({ password: 'p' }) }), env2);
  const c2 = lg.headers.get('set-cookie').split(';')[0];
  const lst = await (await w2.fetch(new Request('https://x/api/admin/bookings', { headers: { cookie: c2 } }), env2)).json();
  ok(lst.bookings[0].pay_status === 'unpaid' && lst.bookings[0].deposit_status === 'pending' && lst.bookings[0].source === 'web', 'base vieja actualizada con columnas nuevas');
}
