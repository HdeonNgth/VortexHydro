/* Pengirim contoh: membuat angka tiruan lalu mengirimnya ke Firebase (atau mock server).
   Dipakai untuk menguji website sebelum simulasi 3D siap.

   Node.js 18 ke atas:
     node database/simulator/demo-sender.mjs --url http://localhost:9000
     node database/simulator/demo-sender.mjs --url https://NAMA-default-rtdb.asia-southeast1.firebasedatabase.app \
          --key API_KEY --email simulator@vortexhydro.app --password PASSWORD --scenario normal

   --scenario: normal | jam | leak | belt | lowbat | highbat | stop   (bawaan: normal)
   --seconds : lama berjalan, 0 = terus (bawaan: 0) */
import { VortexFirebaseSender } from "./vortex-firebase-sender.mjs";

const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, arr) => (x.startsWith("--") ? r.concat([[x.slice(2), arr[i + 1]]]) : r), []));
if (!a.url) { console.error("Wajib: --url <databaseURL>"); process.exit(1); }
const sender = new VortexFirebaseSender({ databaseURL: a.url, apiKey: a.key, email: a.email, password: a.password, path: a.path, minIntervalMs: 100 });
if (await sender.signIn()) console.log("Login Firebase berhasil");

const sc = a.scenario || "normal", t0 = Date.now(), total = +(a.seconds || 0) * 1000;
const wob = (x, p) => x * (1 + (Math.random() - .5) * p);
function sample(t) {
  const debit = 0.5 + 0.05 * Math.sin(t / 4), ratio = 2.2;
  let shaft = 150 * Math.pow(debit / 0.5, .7), vbat = 12.6 + 0.1 * Math.sin(t / 7), q = debit;
  switch (sc) {
    case "stop": q = 0; shaft = 0; break;
    case "jam": shaft = 0; break;
    case "leak": shaft *= 0.4; break;
    case "belt": return { debit: wob(q, .02), vbat, rpmShaft: wob(shaft, .015), rpmGen: wob(shaft * ratio * 0.5, .02) };
    case "lowbat": vbat = 10.8; break;
    case "highbat": vbat = 15; break;
  }
  return { debit: wob(q, .02), vbat, rpmShaft: wob(shaft, .015), rpmGen: wob(shaft * ratio, .015) };
}
console.log("Mengirim skenario '" + sc + "' ke " + a.url + " (Ctrl+C untuk berhenti)");
const timer = setInterval(async () => {
  const t = (Date.now() - t0) / 1000;
  try { await sender.send(sample(t)); } catch (e) { console.error(e.message); }
  if (total && Date.now() - t0 > total) { clearInterval(timer); console.log("Selesai"); }
}, 200);
