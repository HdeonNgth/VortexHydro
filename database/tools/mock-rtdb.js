#!/usr/bin/env node
/* Firebase Realtime Database palsu untuk uji lokal, tanpa akun Firebase.
   Meniru bagian REST yang dipakai proyek ini: GET, PUT, PATCH, DELETE pada <path>.json
   dan streaming EventSource. Semua permintaan diterima tanpa pemeriksaan rules.

   Jalankan:  node database/tools/mock-rtdb.js [port]     (bawaan: 9000)
   Lalu isi databaseURL dengan http://localhost:9000 */
var http = require("http");
var port = +process.argv[2] || 9000;
var root = null;
var streams = [];

function getAt(p) { var o = root; p.forEach(function (k) { o = o && typeof o === "object" ? o[k] : undefined; }); return o === undefined ? null : o; }
function setAt(p, v) {
  if (!p.length) { root = v; return; }
  if (!root || typeof root !== "object") root = {};
  var o = root;
  for (var i = 0; i < p.length - 1; i++) { if (!o[p[i]] || typeof o[p[i]] !== "object") o[p[i]] = {}; o = o[p[i]]; }
  if (v === null) delete o[p[p.length - 1]]; else o[p[p.length - 1]] = v;
}
function send(s, ev, path, data) { s.res.write("event: " + ev + "\ndata: " + JSON.stringify({ path: path, data: data }) + "\n\n"); }

http.createServer(function (req, res) {
  var u = new URL(req.url, "http://x");
  var parts = u.pathname.replace(/\.json$/, "").split("/").filter(Boolean);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }

  if (req.method === "GET" && (req.headers.accept || "").indexOf("text/event-stream") >= 0) {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    var s = { res: res, path: parts };
    streams.push(s);
    send(s, "put", "/", getAt(parts));
    req.on("close", function () { streams = streams.filter(function (x) { return x !== s; }); });
    return;
  }
  if (req.method === "GET") { res.setHeader("Content-Type", "application/json"); return res.end(JSON.stringify(getAt(parts))); }

  var body = "";
  req.on("data", function (c) { body += c; });
  req.on("end", function () {
    var json = null;
    try { json = body ? JSON.parse(body) : null; } catch (e) { res.statusCode = 400; return res.end('{"error":"JSON tidak valid"}'); }
    if (req.method === "PUT" || req.method === "DELETE") setAt(parts, req.method === "DELETE" ? null : json);
    else if (req.method === "PATCH") Object.keys(json || {}).forEach(function (k) { setAt(parts.concat(k.split("/")), json[k]); });
    else if (req.method === "POST") { var id = "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); setAt(parts.concat(id), json); res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ name: id })); notify(); return; }
    res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(json)); notify();
  });
  function notify() {
    streams.forEach(function (s) {
      var rel = parts.slice(0, s.path.length).join("/") === s.path.join("/") || s.path.slice(0, parts.length).join("/") === parts.join("/");
      if (rel) send(s, "put", "/", getAt(s.path));
    });
  }
}).listen(port, function () { console.log("Mock Firebase RTDB aktif di http://localhost:" + port); });
setInterval(function () { streams.forEach(function (s) { s.res.write("event: keep-alive\ndata: null\n\n"); }); }, 20000);
