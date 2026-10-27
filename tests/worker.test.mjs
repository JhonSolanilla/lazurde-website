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
