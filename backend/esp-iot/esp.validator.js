const { timingSafeEqual } = require('node:crypto');

const SENSOR_RANGES = {
  debit: [0, 1000],     // L/min
  head: [0, 100],       // meter
  rpm: [0, 10000],      // RPM turbin/poros
  volt: [0, 1000],      // Volt (V)
  amp: [0, 1000],       // Ampere (A)
  daya: [0, 1000000],   // Watt (W)
  eff: [0, 100],        // Efisiensi (%)
  temp: [-20, 150]      // Suhu (°C)
};

const DEVICE_ID_RE = /^[A-Za-z0-9._-]{2,48}$/;
const FIRMWARE_RE = /^[A-Za-z0-9._-]{1,32}$/;

function equalApiKey(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sanitizeDeviceId(raw) {
  if (raw === undefined || raw === null || raw === '') return 'esp32-main';
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return DEVICE_ID_RE.test(trimmed) ? trimmed : null;
}

function validReading(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (body.deviceId !== undefined && !sanitizeDeviceId(body.deviceId)) return false;
  if (body.rssi !== undefined && (!Number.isInteger(body.rssi) || body.rssi < -130 || body.rssi > 0)) return false;
  return Object.entries(SENSOR_RANGES).every(([key, range]) =>
    typeof body[key] === 'number' && Number.isFinite(body[key]) && body[key] >= range[0] && body[key] <= range[1]
  );
}

function parseHeartbeat(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const deviceId = sanitizeDeviceId(body.deviceId);
  if (!deviceId) return null;

  const label = typeof body.label === 'string' && body.label.trim().length > 0
    ? body.label.trim().slice(0, 64)
    : deviceId;
  const firmware = typeof body.firmware === 'string' && FIRMWARE_RE.test(body.firmware.trim())
    ? body.firmware.trim()
    : '1.0.0';
  const ip = typeof body.ip === 'string' && body.ip.trim().length <= 45 ? body.ip.trim() : null;
  const rssi = Number.isInteger(body.rssi) && body.rssi >= -130 && body.rssi <= 0 ? body.rssi : null;
  const uptimeSec = Number.isInteger(body.uptimeSec) && body.uptimeSec >= 0 ? body.uptimeSec : null;

  return { deviceId, label, firmware, ip, rssi, uptimeSec };
}

module.exports = {
  SENSOR_RANGES,
  equalApiKey,
  sanitizeDeviceId,
  validReading,
  parseHeartbeat
};
