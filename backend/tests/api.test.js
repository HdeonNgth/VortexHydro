const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { openDatabase } = require('../database/sqlite');
const { createApp } = require('../api/app');

test('auth, admin authorization, visits, ESP32 telemetry pipeline, and logout', async t => {
  const db = openDatabase(':memory:');
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
    'admin-test',
    bcrypt.hashSync('test-password-123', 4),
    'admin'
  );
  const apiKey = 'test-api-key-that-is-at-least-32-chars';
  const { app } = createApp({ db, apiKey, allowedOrigins: [] });
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

  await t.test('health check returns ok', async () => {
    const res = await send('/health');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });

  await t.test('guest cannot access admin or ESP32 admin resources and a guest visit is saved', async () => {
    const login = await post('/auth/guest', {});
    assert.equal(login.status, 201);
    assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
    guestCookie = cookieFrom(login);
    const body = await login.json();
    assert.equal(body.authenticated, true);
    assert.equal(body.role, 'guest');
    assert.equal(body.displayName, 'Tamu');
    assert.ok(Number.isInteger(body.expiresAt));

    assert.equal((await send('/stream/sensor', { headers: { Cookie: guestCookie } })).status, 403);
    assert.equal((await send('/esp/devices', { headers: { Cookie: guestCookie } })).status, 403);
    assert.equal((await send('/esp/latest', { headers: { Cookie: guestCookie } })).status, 403);
    assert.equal((await send('/visits', { headers: { Cookie: guestCookie } })).status, 403);
    assert.equal((await post('/track', { page: 'beranda' }, guestCookie, { 'User-Agent': 'iPhone Mobile' })).status, 201);
  });

  await t.test('unauthenticated requests are rejected', async () => {
    assert.equal((await send('/esp/stream')).status, 401);
    assert.equal((await send('/esp/devices')).status, 401);
    assert.deepEqual(await (await send('/auth/me')).json(), { authenticated: false });
    assert.equal((await send('/auth/me', { headers: { Origin: new URL(base).origin } })).status, 200);
    assert.equal((await send('/auth/me', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
  });

  await t.test('admin can monitor visits and ESP32 heartbeat + sensor ingest + stream', async () => {
    assert.equal((await post('/auth/admin', { username: 'admin-test', password: 'wrong-password' })).status, 401);
    const login = await post('/auth/admin', { username: 'admin-test', password: 'test-password-123' });
    assert.equal(login.status, 201);
    const adminCookie = cookieFrom(login);

    // Visits stream & history
    const visitStream = await send('/stream/visits', { headers: { Cookie: adminCookie } });
    assert.equal(visitStream.status, 200);
    const visitReader = visitStream.body.getReader();
    assert.match(new TextDecoder().decode((await visitReader.read()).value), /event: ready/);
    await post('/track', { page: 'teknologi' }, guestCookie, { 'User-Agent': 'iPhone Mobile' });
    assert.match(new TextDecoder().decode((await visitReader.read()).value), /event: visit/);

    const visits = await send('/visits?limit=10', { headers: { Cookie: adminCookie } });
    assert.equal(visits.status, 200);
    const visitRows = (await visits.json()).visits;
    assert.equal(visitRows[0].visitorName, 'Tamu');
    assert.equal(visitRows[0].device, 'mobile');

    // ESP32 SSE stream
    const sensorStream = await send('/esp/stream', { headers: { Cookie: adminCookie } });
    assert.equal(sensorStream.status, 200);
    const sensorReader = sensorStream.body.getReader();
    assert.match(new TextDecoder().decode((await sensorReader.read()).value), /event: ready/);

    // ESP32 heartbeat
    const hb = await post('/esp/heartbeat', {
      deviceId: 'esp32-turbin-01',
      label: 'Node Utama Turbin',
      firmware: '1.0.0',
      rssi: -55,
      uptimeSec: 120
    }, null, { 'X-API-Key': apiKey });
    assert.equal(hb.status, 200);
    assert.match(new TextDecoder().decode((await sensorReader.read()).value), /event: heartbeat/);

    // ESP32 sensor ingest (validation & auth)
    const reading = {
      deviceId: 'esp32-turbin-01',
      debit: 50,
      head: 1.5,
      rpm: 160,
      volt: 16,
      amp: 1.2,
      daya: 18,
      eff: 24.5,
      temp: 27,
      rssi: -54
    };
    assert.equal((await post('/esp/ingest', reading)).status, 401);
    assert.equal((await post('/esp/ingest', reading, null, { 'X-API-Key': 'incorrect-key' })).status, 401);
    assert.equal((await post('/esp/ingest', { ...reading, temp: 151 }, null, { 'X-API-Key': apiKey })).status, 400);

    const ingest = await post('/esp/ingest', reading, null, { 'X-API-Key': apiKey });
    assert.equal(ingest.status, 201);
    assert.match(new TextDecoder().decode((await sensorReader.read()).value), /event: reading/);

    // ESP32 device list, latest, and history
    const devicesRes = await send('/esp/devices', { headers: { Cookie: adminCookie } });
    assert.equal(devicesRes.status, 200);
    const { devices } = await devicesRes.json();
    assert.equal(devices.length, 1);
    assert.equal(devices[0].deviceId, 'esp32-turbin-01');
    assert.equal(devices[0].online, true);

    const latest = await send('/esp/latest?deviceId=esp32-turbin-01', { headers: { Cookie: adminCookie } });
    const latestJson = await latest.json();
    assert.equal(latestJson.reading.debit, 50);
    assert.equal(latestJson.reading.deviceId, 'esp32-turbin-01');

    // Backward-compatible legacy alias still works
    const legacyLatest = await send('/latest', { headers: { Cookie: adminCookie } });
    assert.equal((await legacyLatest.json()).reading.debit, 50);

    assert.equal((await send('/esp/history?interval=5m&deviceId=esp32-turbin-01', { headers: { Cookie: adminCookie } })).status, 200);
    assert.equal((await send('/esp/history?interval=toString', { headers: { Cookie: adminCookie } })).status, 400);

    const me = await send('/auth/me', { headers: { Cookie: adminCookie } });
    assert.deepEqual(await me.json(), { authenticated: true, role: 'admin', displayName: 'admin-test' });

    await visitReader.cancel();
    await sensorReader.cancel();
    await post('/auth/logout', {}, adminCookie);
    assert.equal((await send('/esp/latest', { headers: { Cookie: adminCookie } })).status, 401);
  });

  await t.test('logout revokes a guest session', async () => {
    const login = await post('/auth/guest', {});
    const guestCookie = cookieFrom(login);
    assert.equal((await post('/auth/logout', {}, guestCookie)).status, 204);
    assert.deepEqual(await (await send('/auth/me', { headers: { Cookie: guestCookie } })).json(), { authenticated: false });
  });
});
