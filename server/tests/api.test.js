const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { openDatabase } = require('../db');
const { createApp } = require('../app');

test('auth, admin authorization, visits, sensor ingest, and logout', async t => {
  const db = openDatabase(':memory:');
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
    'admin-test',
    bcrypt.hashSync('test-password-123', 4),
    'admin'
  );
  const { app } = createApp({ db, apiKey: 'test-api-key-that-is-at-least-32-chars', allowedOrigins: [] });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const send = (url, options = {}) => fetch(base + url, options);
  const post = (url, body, cookie, extraHeaders = {}) => send(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
    body: JSON.stringify(body)
  });
  let guestCookie;
  const cookieFrom = response => {
    const header = response.headers.get('set-cookie');
    assert.ok(header);
    return header.split(';')[0];
  };
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    db.close();
  });

  await t.test('guest cannot access admin resources and a guest visit is saved', async () => {
    const login = await post('/auth/guest', { name: 'Tamu Uji' });
    assert.equal(login.status, 201);
    assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
    guestCookie = cookieFrom(login);
    const body = await login.json();
    assert.equal(body.authenticated, true);
    assert.equal(body.role, 'guest');
    assert.equal(body.displayName, 'Tamu Uji');
    assert.ok(Number.isInteger(body.expiresAt));
    assert.equal((await send('/stream/sensor', { headers: { Cookie: guestCookie } })).status, 403);
    assert.equal((await send('/latest', { headers: { Cookie: guestCookie } })).status, 403);
    assert.equal((await send('/visits', { headers: { Cookie: guestCookie } })).status, 403);
    assert.equal((await post('/auth/guest', { name: 'X' })).status, 400);
    assert.equal((await post('/track', { page: 'beranda' }, guestCookie, { 'User-Agent': 'iPhone Mobile' })).status, 201);
    return guestCookie;
  });

  await t.test('unauthenticated requests are rejected', async () => {
    assert.equal((await send('/stream/sensor')).status, 401);
    assert.deepEqual(await (await send('/auth/me')).json(), { authenticated: false });
    assert.equal((await send('/auth/me', { headers: { Origin: new URL(base).origin } })).status, 200);
    assert.equal((await send('/auth/me', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
  });

  await t.test('admin can read and stream visits and sensor readings', async () => {
    assert.equal((await post('/auth/admin', { username: 'admin-test', password: 'wrong-password' })).status, 401);
    const login = await post('/auth/admin', { username: 'admin-test', password: 'test-password-123' });
    assert.equal(login.status, 201);
    const adminCookie = cookieFrom(login);

    const visitStream = await send('/stream/visits', { headers: { Cookie: adminCookie } });
    assert.equal(visitStream.status, 200);
    const visitReader = visitStream.body.getReader();
    assert.match(new TextDecoder().decode((await visitReader.read()).value), /event: ready/);
    await post('/track', { page: 'teknologi' }, guestCookie, { 'User-Agent': 'iPhone Mobile' });
    assert.match(new TextDecoder().decode((await visitReader.read()).value), /event: visit/);
    const visits = await send('/visits?limit=10', { headers: { Cookie: adminCookie } });
    assert.equal(visits.status, 200);
    const visitRows = (await visits.json()).visits;
    assert.equal(visitRows[0].visitorName, 'Tamu Uji');
    assert.equal(visitRows[0].device, 'mobile');

    const sensorStream = await send('/stream/sensor', { headers: { Cookie: adminCookie } });
    assert.equal(sensorStream.status, 200);
    const sensorReader = sensorStream.body.getReader();
    assert.match(new TextDecoder().decode((await sensorReader.read()).value), /event: ready/);
    const reading = { debit: 50, head: 1.5, rpm: 160, volt: 16, amp: 1.2, daya: 18, eff: 24.5, temp: 27 };
    assert.equal((await post('/ingest', reading)).status, 401);
    assert.equal((await post('/ingest', reading, null, { 'X-API-Key': 'incorrect-key' })).status, 401);
    assert.equal((await post('/ingest', { ...reading, temp: 151 }, null, { 'X-API-Key': 'test-api-key-that-is-at-least-32-chars' })).status, 400);
    const ingest = await post('/ingest', reading, null, { 'X-API-Key': 'test-api-key-that-is-at-least-32-chars' });
    assert.equal(ingest.status, 201);
    assert.match(new TextDecoder().decode((await sensorReader.read()).value), /event: reading/);

    const latest = await send('/latest', { headers: { Cookie: adminCookie } });
    assert.equal((await latest.json()).reading.debit, 50);
    assert.equal((await send('/history?interval=5m', { headers: { Cookie: adminCookie } })).status, 200);
    assert.equal((await send('/history?interval=toString', { headers: { Cookie: adminCookie } })).status, 400);
    const me = await send('/auth/me', { headers: { Cookie: adminCookie } });
    assert.deepEqual(await me.json(), { authenticated: true, role: 'admin', displayName: 'admin-test' });

    await visitReader.cancel();
    await sensorReader.cancel();
    await post('/auth/logout', {}, adminCookie);
    assert.equal((await send('/latest', { headers: { Cookie: adminCookie } })).status, 401);
  });

  await t.test('logout revokes a guest session', async () => {
    const login = await post('/auth/guest', { name: 'Tamu Keluar' });
    const guestCookie = cookieFrom(login);
    assert.equal((await post('/auth/logout', {}, guestCookie)).status, 204);
    assert.deepEqual(await (await send('/auth/me', { headers: { Cookie: guestCookie } })).json(), { authenticated: false });
  });
});
