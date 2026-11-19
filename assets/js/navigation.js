(function(){
var $=function(i){return document.getElementById(i)},B=document.body,H=document.documentElement,authState=null,authInitialized=false,dashboardContent=document.querySelector("#dashboard .dash");
/* ===== Navbar liquid glass ===== */
var nav=$("lgn"),lens=$("lens"),lg=$("lg"),prev=null,anim=null,EASE="cubic-bezier(.22,1,.36,1)";
function rect(a){return{l:a.offsetLeft,t:a.offsetTop,w:a.offsetWidth,h:a.offsetHeight}}
function css(r){return{left:r.l+"px",top:r.t+"px",width:r.w+"px",height:r.h+"px"}}
function motionDisabled(){return H.classList.contains("vx-noanim")}
function splash(r){
  if(motionDisabled()||!lens.animate)return;
  var cx=r.l+r.w/2,top=r.t+2,i,d,ring=document.createElement("span");
  ring.className="lg__ring";Object.assign(ring.style,{left:r.l+"px",top:r.t+"px",width:r.w+"px",height:r.h+"px"});nav.appendChild(ring);
  ring.animate([{transform:"scale(1)",opacity:.8},{transform:"scale(1.25,1.5)",opacity:0}],{duration:700,easing:"ease-out"}).onfinish=function(){ring.remove()};
  for(i=0;i<4;i++){d=document.createElement("span");d.className="lg__drop";var vert=lg.clientHeight>lg.clientWidth,dx=(Math.random()-.5)*60,s=.6+Math.random()*.7;
    Object.assign(d.style,{left:(vert?r.l+r.w-6:cx)+"px",top:(vert?r.t+r.h/2:top)+"px"});nav.appendChild(d);
    var up=vert?{x:30+Math.random()*30,y:(Math.random()-.5)*40}:{x:dx,y:-(14+Math.random()*16)},dn=vert?{x:up.x+14,y:up.y+26}:{x:dx*1.3,y:26+Math.random()*10};
    d.animate([{transform:"translate(0,0) scale(0)",opacity:0},{transform:"translate("+up.x+"px,"+up.y+"px) scale("+s+")",opacity:1,offset:.4},{transform:"translate("+dn.x+"px,"+dn.y+"px) scale("+s*.6+")",opacity:0}],{duration:650+Math.random()*250,easing:"cubic-bezier(.3,.6,.5,1)",delay:i*30}).onfinish=(function(e){return function(){e.remove()}})(d)}
}
function place(go){
  var a=nav.querySelector("[aria-current]");if(!a)return;var r=rect(a);
  if(anim){anim.cancel();anim=null}
  if(go&&prev&&!motionDisabled()&&lens.animate){
    var u={l:Math.min(prev.l,r.l),t:Math.min(prev.t,r.t)};u.w=Math.max(prev.l+prev.w,r.l+r.w)-u.l;u.h=Math.max(prev.t+prev.h,r.t+r.h)-u.t;
    var big=u.w>prev.w+4||u.h>prev.h+4;
    anim=lens.animate([css(prev),Object.assign(css(u),{offset:.42}),css(r)],{duration:big?720:300,easing:EASE});
    Object.assign(lens.style,css(r));if(big)splash(r)
  }else Object.assign(lens.style,css(r));
  prev=r;
}
function mark(){var k=(location.hash||"#beranda").slice(1);if(!$(k))k="beranda";
  nav.querySelectorAll("a").forEach(function(a){if(a.dataset.k===k)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});return k}
function rec(k){
  if(!authState||!authState.authenticated||!window.VXAuth)return;
  window.VXAuth.track(k).catch(function(error){
    var status=$("visit-feed-status");
    if(status)status.textContent="Kunjungan belum tersimpan: "+error.message;
    console.warn("Kunjungan tidak tersimpan:",error.message)
  })
}
var busy=false,PG=["beranda","tentang","dokumentasi","struktur-tim","dashboard"];
function enter(k){var pg=$(k);if(!pg)return;pg.classList.remove("vx-enter");void pg.offsetWidth;pg.classList.add("vx-enter")}
function go(h){var ov=$("vxpt");if(motionDisabled()||!ov.animate){location.hash=h;return}
  busy=true;mark2(h);ov.classList.add("on");
  if(B.classList.contains("is-dash")!==(h==="dashboard"))navOut(B.classList.contains("is-dash"));
  var a=ov.animate([{transform:"translateY(100%)"},{transform:"translateY(0)"}],{duration:650,easing:"cubic-bezier(.76,0,.24,1)",fill:"forwards"});
  a.onfinish=function(){location.hash=h;setTimeout(function(){var c=ov.animate([{transform:"translateY(0)"},{transform:"translateY(-100%)"}],{duration:750,easing:"cubic-bezier(.76,0,.24,1)",fill:"forwards"});
    c.onfinish=function(){ov.classList.remove("on");a.cancel();c.cancel();busy=false}},220)}}
function mark2(k){nav.querySelectorAll("a").forEach(function(a){if(a.dataset.k===k)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});place(true)}
var initialSync=true;
var navOutAnimation=null,SH="inset(-60px round 26px)",SC="inset(0 0 100% 0 round 26px)";
function navOk(){return lg.animate&&!motionDisabled()&&!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)}
function navOut(fromSide){
  if(!navOk())return;
  if(navOutAnimation)navOutAnimation.cancel();
  navOutAnimation=fromSide
    ?lg.animate([{clipPath:SH,transform:"none",opacity:1},{clipPath:SC,transform:"translateY(-14px)",opacity:0}],{duration:650,easing:"cubic-bezier(.76,0,.24,1)",fill:"forwards"})
    :lg.animate([{transformOrigin:"0% 50%",transform:"none",opacity:1},{transformOrigin:"0% 50%",transform:"scale(.12,.86)",opacity:0}],{duration:650,easing:"cubic-bezier(.76,0,.24,1)",fill:"forwards"})
}
function navIn(toSide){
  if(!navOk())return;
  if(toSide)lg.animate([{clipPath:SC,transform:"translateY(-22px)",opacity:0},{opacity:1,offset:.2},{clipPath:SH,transform:"none",opacity:1}],{duration:1100,easing:"cubic-bezier(.22,1.08,.36,1)"});
  else lg.animate([{transformOrigin:"0% 50%",transform:"scale(.12,.86)",opacity:0},{opacity:1,offset:.25},{transformOrigin:"0% 50%",transform:"none",opacity:1}],{duration:900,easing:"cubic-bezier(.22,1,.36,1)"})
}
function dashboardNav(is){
  if(!navOk()){B.classList.toggle("is-dash",is);dash(is);prev=null;requestAnimationFrame(function(){place(false)});return}
  B.classList.toggle("is-dash",is);prev=null;lens.style.opacity="0";
  if(navOutAnimation){navOutAnimation.cancel();navOutAnimation=null}
  navIn(is);
  requestAnimationFrame(function(){requestAnimationFrame(function(){place(false);lens.style.opacity=""})});
  dash(is)
}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey)return;var h=a.getAttribute("href").slice(1);
  if(PG.indexOf(h)<0)return;if(busy){e.preventDefault();return}if(h===(location.hash||"#beranda").slice(1))return;e.preventDefault();go(h)},true);
function sync(){if(!authState||!authState.authenticated)return;var k=mark();rec(k);enter(k);var was=B.classList.contains("is-dash"),is=k==="dashboard"&&authState.role==="admin";
  if(was!==is){if(initialSync){B.classList.toggle("is-dash",is);dash(is);prev=null;requestAnimationFrame(function(){place(false)})}else dashboardNav(is)}
  else{place(true);dash(is)}
  initialSync=false}
addEventListener("hashchange",sync);addEventListener("resize",function(){prev=null;place(false)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){prev=null;place(false)});
function onAuthChange(event){
  var previous=authState,next=event.detail;
  if(!next)return;
  authState=next;
  if(!next.authenticated){
    if(previous&&previous.authenticated)resetDashboard();else dash(false);
    B.classList.remove("is-dash");window.vxDashboard=undefined;
    if(previous&&previous.authenticated&&location.hash==="#dashboard")location.hash="#beranda";
    authInitialized=true;
    return
  }
  if(!authInitialized)initialSync=true;
  else initialSync=false;
  authInitialized=true;
  if(next.role==="admin")dash(false);
  sync()
}
window.addEventListener("vx:authchange",onAuthChange);
if(window.VXAuth)window.VXAuth.ready.then(function(state){if(!authInitialized)onAuthChange({detail:state})});
/* ===== Tools ===== */
var t=$("vxt"),b=$("vxb"),p=$("vxp");
function tog(o){t.classList.toggle("open",o);b.setAttribute("aria-expanded",o);if(!o){p.classList.remove("show");window.VXPAL&&VXPAL.close();t.querySelectorAll(".vxt__it.on").forEach(function(e){e.classList.remove("on")})}}
b.onclick=function(){tog(!t.classList.contains("open"))};$("vxc").onclick=function(){p.classList.remove("show");var c=t.querySelector("[data-a=calc]");c&&c.classList.remove("on")};
addEventListener("keydown",function(e){if(e.key==="Escape")tog(false)});
function calc(){var q=+$("vq").value||0,h=+$("vh").value||0,e=(+$("ve").value||0)/100,w=9.81*q*h*e;$("vr").textContent=w>=1000?(w/1000).toFixed(2)+" kW":w.toFixed(1)+" W"}
["vq","vh","ve"].forEach(function(i){$(i).oninput=calc});calc();
var sz=0,ab=document.querySelector("[data-a=anim]"),motionQuery=window.matchMedia("(max-width:760px)"),userNoAnim=false;
userNoAnim=motionQuery.matches;if(!userNoAnim){try{userNoAnim=localStorage.getItem("vxa")==="off"}catch(_){}}
function applyMotionPreference(){H.classList.toggle("vx-noanim",userNoAnim);if(ab){var al=ab.querySelector("span");if(al)al.textContent=userNoAnim?"Animasi mati":"Animasi aktif";ab.setAttribute("aria-pressed",String(!userNoAnim));ab.disabled=false;ab.removeAttribute("title")}}
applyMotionPreference();

var act=function(e){var x=e.target.closest("[data-a]");if(!x)return;var a=x.dataset.a;
  if(a==="calc"){window.VXPAL&&VXPAL.close();p.classList.toggle("show");x.classList.toggle("on",p.classList.contains("show"))}
  else if(a==="login"){tog(false)}
  else if(a==="lang"){var lb=document.querySelector("[data-language-toggle]");lb&&lb.click()}
  else if(a==="top")scrollTo({top:0,behavior:motionDisabled()?"auto":"smooth"});
  else if(a==="anim"){userNoAnim=!userNoAnim;if(!motionQuery.matches){try{localStorage.setItem("vxa",userNoAnim?"off":"on")}catch(_){}}applyMotionPreference()}
  else if(a==="palette"){window.VXPAL&&VXPAL.toggle(x)}
  else if(a==="theme"){var dk=H.dataset.theme!=="dark";H.classList.add("vx-theming");H.dataset.theme=dk?"dark":"light";setTh();try{localStorage.setItem("vxt",H.dataset.theme)}catch(_){}setTimeout(function(){H.classList.remove("vx-theming")},700)}};
$("vxl").onclick=act;var _pl=$("vxpal");if(_pl)_pl.addEventListener("click",act);
var SUN='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',MOON='<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';
function setTh(){var x=document.querySelector("[data-a=theme] svg");if(x)x.innerHTML=H.dataset.theme==="dark"?SUN:MOON;var tl=document.querySelector("[data-a=theme] span");if(tl)tl.textContent=H.dataset.theme==="dark"?"Mode gelap":"Mode terang"}setTh();
/* ===== Dashboard ===== */
var K=["debit","vbat","rpmShaft","rpmGen"],D={},N=60,hist={},tick=0,run=true,timer=null,tab="debit",initialized=false,sensorOnline=false,sensorSource=null,visitsSource=null,lastAuthCheck=0,lastSensorAt=0;
K.forEach(function(k){hist[k]=[]});
var fmt={debit:2,vbat:2,rpmShaft:0,rpmGen:0},flag={},act={},cnt={},lastLv=-1;
/* Ambang peringatan skala prototipe. Ganti lewat window.VX_LIMITS bila sensor asli berbeda skala. */
var LIM=Object.assign({flowMin:.03,flowLow:.2,rpmWarn:290,rpmBad:340,jamRpm:8,minShaft:30,ratio:2.2,ratioWarn:.8,ratioBad:.6,rpmRef:150,qRef:.5,leakFrac:.6,vLowWarn:11.5,vLowBad:11.0,vHighWarn:14.4,vHighBad:14.8,staleMs:10000},window.VX_LIMITS||{});
var LVN=["NORMAL","WASPADA","BAHAYA"],LVC=["o","w","d"];
function log(m,c){if(!authState||authState.role!=="admin")return;var ul=$("dlog"),li=document.createElement("li"),time=document.createElement("time"),message=document.createElement("span");li.className=c||"";time.textContent=new Date().toLocaleTimeString("id-ID");message.textContent=m;li.appendChild(time);li.appendChild(message);ul.insertBefore(li,ul.firstChild);while(ul.children.length>40)ul.lastChild.remove()}
function sim(){return window.VXSim?VXSim.read():{debit:0,vbat:0,rpmShaft:0,rpmGen:0}}
function norm(o){var r={};K.forEach(function(k){var v=o[k];if(v==null&&k==="rpmShaft")v=o.rpm;r[k]=v!=null?+v:(D[k]||0)});return r}
function apply(o){if(!authState||authState.role!=="admin"||!o)return;D=norm(o);K.forEach(function(k){var a=hist[k];a.push(D[k]);if(a.length>N)a.shift()});var w=analyze(D);render();showLevel(w)}
function spark(k){var a=hist[k],mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),r=mx-mn||1;return a.map(function(v,i){return(i/(N-1)*100).toFixed(1)+","+(30-(v-mn)/r*26).toFixed(1)}).join(" ")}
/* Bunyi peringatan (hanya BAHAYA) */
var AC=null,muted=false;try{muted=localStorage.getItem("vxmute")==="1"}catch(_){}
function unlock(){try{if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}if(AC&&AC.state==="suspended")AC.resume()}catch(_){}}
["pointerdown","keydown","touchstart"].forEach(function(e){document.addEventListener(e,unlock,{passive:true})});
function beep(){if(muted||!AC||AC.state!=="running")return;try{var t=AC.currentTime;[[0,784],[.26,784],[.52,988]].forEach(function(x){var os=AC.createOscillator(),g=AC.createGain();os.type="square";os.frequency.value=x[1];g.gain.setValueAtTime(0,t+x[0]);g.gain.linearRampToValueAtTime(.1,t+x[0]+.02);g.gain.exponentialRampToValueAtTime(.001,t+x[0]+.2);os.connect(g);g.connect(AC.destination);os.start(t+x[0]);os.stop(t+x[0]+.22)})}catch(_){}}
/* Notifikasi mengambang untuk admin */
var toasts={};
function dismiss(t){if(!t||t.gone)return;t.gone=1;t.el.classList.add("out");setTimeout(function(){t.el.remove()},350)}
function toast(id,lv,msg){
  if(!authState||authState.role!=="admin")return;
  var box=$("vxn");if(!box){box=document.createElement("div");box.id="vxn";box.className="vxn";box.setAttribute("role","region");box.setAttribute("aria-label","Notifikasi pemantauan");document.body.appendChild(box)}
  dismiss(toasts[id]);
  var el=document.createElement("div");el.className="vxn__t";el.dataset.l=lv;el.setAttribute("role",lv===2?"alert":"status");
  var ic=document.createElement("div");ic.className="vxn__i";ic.textContent=lv===0?"\u2713":"!";
  var bd=document.createElement("div");bd.className="vxn__b";var h=document.createElement("b");h.textContent=LVN[lv];var sp=document.createElement("span");sp.textContent=msg;bd.appendChild(h);bd.appendChild(sp);
  var x=document.createElement("button");x.type="button";x.className="vxn__x";x.setAttribute("aria-label","Tutup");x.textContent="\u00d7";
  if(lv===2){var sb=document.createElement("button");sb.type="button";sb.className="vxn__s";
    var lab=function(){sb.textContent=muted?"Nyalakan suara":"Matikan suara"};lab();
    sb.onclick=function(){muted=!muted;try{localStorage.setItem("vxmute",muted?"1":"0")}catch(_){}lab()};bd.appendChild(sb)}
  el.appendChild(ic);el.appendChild(bd);el.appendChild(x);
  var t={el:el};x.onclick=function(){dismiss(t)};box.appendChild(el);toasts[id]=t;
  while(box.querySelectorAll(".vxn__t:not(.out)").length>4){var f=box.querySelector(".vxn__t:not(.out)");f.classList.add("out");setTimeout(function(e){e.remove()}.bind(null,f),350)}
  if(lv<2)setTimeout(function(){dismiss(t)},lv?7000:4500);
  else{beep();if(navigator.vibrate){try{navigator.vibrate([200,80,200])}catch(_){}}}
}
/* Panel penjelasan masalah (Dashboard) */
var WHY={
  stop:["Pompa mati atau debit nol, jadi tidak ada air yang menggerakkan turbin.","Hidupkan pompa dan cek sumber listriknya."],
  jam:["Air sudah mengalir, tetapi poros utama tidak berputar. Biasanya ada benda yang menyangkut, atau poros, bearing, atau belt macet. Tanpa putaran, generator tidak mengisi baterai.","Matikan pompa, lalu periksa poros, bearing, belt, dan benda asing di tabung pusaran."],
  leak:["Debit masuk cukup, tetapi poros berputar jauh lebih pelan dari seharusnya. Artinya sebagian air tidak sampai ke turbin, kemungkinan bocor di pipa atau sambungan.","Periksa sambungan pipa, selang, dan dasar tangki dari rembesan air."],
  belt:["Poros berputar normal, tetapi RPM generator tidak mengikuti. Sabuk (belt) kemungkinan slip, kendor, atau putus, sehingga generator tidak menghasilkan listrik penuh.","Matikan pompa, cek ketegangan dan kondisi belt, serta kedua pulley."],
  beltw:["Perbandingan RPM generator terhadap poros mulai turun dari nilai pulley. Sabuk mulai kendor atau aus.","Cek ketegangan belt sebelum makin parah."],
  lowq:["Debit di bawah batas normal. Bisa karena pompa melemah, pipa tersumbat, atau pengaturan debit terlalu kecil.","Bersihkan filter pompa, cek pipa, lalu naikkan debit."],
  rpmw:["Putaran poros tinggi. Biasanya debit atau tinggi jatuh terlalu besar, atau beban generator berkurang.","Kurangi debit dan pastikan beban terhubung."],
  rpmb:["Putaran poros melebihi batas aman. Beban generator mungkin terlepas, sehingga turbin berputar terlalu bebas dan bisa merusak bearing dan belt.","Matikan pompa, periksa sambungan beban generator, lalu nyalakan kembali dengan debit lebih kecil."],
  vlw:["Tegangan baterai mulai turun. Pengisian dari generator lebih kecil daripada pemakaian beban.","Naikkan debit agar generator mengisi lebih banyak, atau kurangi beban."],
  vlb:["Baterai hampir habis. Jika dibiarkan, beban mati dan baterai bisa rusak karena terlalu kosong.","Lepas beban yang tidak perlu dan isi baterai sampai tegangannya pulih."],
  vhw:["Tegangan baterai di atas batas pengisian normal. Pengisian mungkin tidak terkendali.","Cek pengontrol pengisian (charge controller) dan sambungan baterai."],
  vhb:["Tegangan baterai terlalu tinggi dan berisiko merusak atau memanaskan baterai.","Putuskan pengisian segera, lalu periksa pengontrol pengisian."]
};
function whyBox(){
  var box=$("dwhy");if(box)return box;
  var row=document.querySelector("#dashboard .drow");if(!row)return null;
  box=document.createElement("div");box.className="dc dwhy";box.id="dwhy";box.dataset.sec="ringkasan sensor";
  var h=document.createElement("h3");h.textContent="Penjelasan masalah";var st=document.createElement("span");st.id="dwhys";st.className="dwhy__st";h.appendChild(st);
  var ls=document.createElement("div");ls.id="dwhyl";ls.className="dwhy__l";
  box.appendChild(h);box.appendChild(ls);row.parentNode.insertBefore(box,row);return box
}
function explain(al,worst){
  if(!whyBox())return;var ls=$("dwhyl"),st=$("dwhys"),ids=Object.keys(al).sort(function(a,b){return al[b].lv-al[a].lv});
  st.textContent=LVN[worst];st.dataset.l=worst;
  var sig=ids.join(",")+"|"+ids.map(function(i){return al[i].msg}).join("|");if(ls.dataset.sig===sig)return;ls.dataset.sig=sig;
  while(ls.firstChild)ls.removeChild(ls.firstChild);
  if(!ids.length){var ok=document.createElement("p");ok.className="dwhy__ok";ok.textContent="Semua normal. Tidak ada masalah yang perlu dijelaskan.";ls.appendChild(ok);return}
  ids.forEach(function(id){
    var x=al[id],w=WHY[id]||["Nilai di luar batas normal.","Periksa kondisi alat."],it=document.createElement("div");it.className="dwhy__i";it.dataset.l=x.lv;
    var t=document.createElement("b");t.textContent=x.msg;
    var a=document.createElement("p"),as=document.createElement("strong");as.textContent="Kenapa: ";a.appendChild(as);a.appendChild(document.createTextNode(w[0]));
    var c=document.createElement("p"),cs=document.createElement("strong");cs.textContent="Cek: ";c.appendChild(cs);c.appendChild(document.createTextNode(w[1]));
    it.appendChild(t);it.appendChild(a);it.appendChild(c);ls.appendChild(it)})
}
var cardLv={};
/* Penganalisis kondisi: bekerja untuk data simulasi maupun sensor asli. */
function analyze(d){
  var on=d.debit>=LIM.flowMin,flow=d.debit>=.1,al={},ratio=d.rpmShaft>=LIM.minShaft?d.rpmGen/d.rpmShaft:null,expRpm=LIM.rpmRef*Math.pow(Math.max(d.debit,0)/LIM.qRef,.7);
  function a(id,ok,lv,msg,cards){var c=ok?(cnt[id]||0)+1:0;cnt[id]=c;if(ok&&c>=3)al[id]={lv:lv,msg:msg,cards:cards}}
  a("stop",!on,1,"Tidak ada aliran air: pompa mati, turbin berhenti",["debit","rpmShaft","rpmGen"]);
  a("jam",flow&&d.rpmShaft<LIM.jamRpm,2,"Turbin macet: air mengalir ("+d.debit.toFixed(2)+" L/s) tetapi poros tidak berputar",["rpmShaft","rpmGen","vbat"]);
  a("leak",flow&&d.rpmShaft>=LIM.jamRpm&&d.rpmShaft<LIM.leakFrac*expRpm,2,"Dugaan kebocoran: debit "+d.debit.toFixed(2)+" L/s tetapi poros hanya "+Math.round(d.rpmShaft)+" RPM (normalnya sekitar "+Math.round(expRpm)+")",["debit","rpmShaft"]);
  a("belt",ratio!=null&&ratio<LIM.ratio*LIM.ratioBad,2,"Sabuk slip atau putus: RPM generator "+Math.round(d.rpmGen)+" (seharusnya sekitar "+Math.round(d.rpmShaft*LIM.ratio)+")",["rpmGen","rpmShaft"]);
  a("beltw",ratio!=null&&ratio>=LIM.ratio*LIM.ratioBad&&ratio<LIM.ratio*LIM.ratioWarn,1,"Sabuk mulai slip: RPM generator "+Math.round(d.rpmGen)+" (seharusnya sekitar "+Math.round(d.rpmShaft*LIM.ratio)+")",["rpmGen","rpmShaft"]);
  a("lowq",on&&d.debit<LIM.flowLow,1,"Debit air rendah ("+d.debit.toFixed(2)+" L/s)",["debit"]);
  a("rpmw",d.rpmShaft>LIM.rpmWarn&&d.rpmShaft<=LIM.rpmBad,1,"Putaran poros tinggi ("+Math.round(d.rpmShaft)+" RPM)",["rpmShaft"]);
  a("rpmb",d.rpmShaft>LIM.rpmBad,2,"Putaran poros melebihi batas aman ("+Math.round(d.rpmShaft)+" RPM)",["rpmShaft"]);
  a("vlw",d.vbat<LIM.vLowWarn&&d.vbat>=LIM.vLowBad,1,"Tegangan baterai rendah ("+d.vbat.toFixed(2)+" V)",["vbat"]);
  a("vlb",d.vbat<LIM.vLowBad,2,"Baterai hampir habis ("+d.vbat.toFixed(2)+" V)",["vbat"]);
  a("vhw",d.vbat>LIM.vHighWarn&&d.vbat<=LIM.vHighBad,1,"Tegangan baterai tinggi ("+d.vbat.toFixed(2)+" V)",["vbat"]);
  a("vhb",d.vbat>LIM.vHighBad,2,"Tegangan baterai terlalu tinggi ("+d.vbat.toFixed(2)+" V)",["vbat"]);
  var cl={},worst=0;
  Object.keys(al).forEach(function(id){
    var x=al[id];worst=Math.max(worst,x.lv);x.cards.forEach(function(k){cl[k]=Math.max(cl[k]||0,x.lv)});
    if(!act[id]||act[id].lv!==x.lv){log(LVN[x.lv]+" · "+x.msg,LVC[x.lv]);toast(id,x.lv,x.msg)}
  });
  Object.keys(act).forEach(function(id){if(!al[id]){var rm="Pulih: "+act[id].msg.split(" (")[0].split(":")[0].toLowerCase();log("NORMAL · "+rm,"o");dismiss(toasts[id]);toast(id,0,rm)}});
  act=al;cardLv=cl;explain(al,worst);return worst
}
function render(){
  K.forEach(function(k){var c=document.querySelector('[data-c="'+k+'"]');c.querySelector("b span").textContent=D[k].toFixed(fmt[k]);c.querySelector("polyline").setAttribute("points",spark(k));
    var lv=cardLv[k]||0;c.classList.toggle("warn",lv===1);c.classList.toggle("bad",lv===2)});
  $("grpm").style.strokeDashoffset=75-Math.min(1,D.rpmShaft/400)*75;$("grpmt").textContent=Math.round(D.rpmShaft);
  $("geff").style.strokeDashoffset=75-Math.min(1,D.rpmGen/900)*75;$("geft").textContent=Math.round(D.rpmGen);chart()}
var CC={debit:"#0ea5e9",vbat:"#f59e0b",rpmShaft:"#8b5cf6",rpmGen:"#10b981"},CU={debit:"L/s",vbat:"V",rpmShaft:"RPM",rpmGen:"RPM"},CN={debit:"Debit air",vbat:"Tegangan baterai",rpmShaft:"RPM poros",rpmGen:"RPM generator"},hovX=null;
/* Kurva mulus (bezier) yang tidak melampaui titik data, jadi tidak ada gelombang palsu. */
function smooth(p){if(p.length<2)return p.length?"M"+p[0][0].toFixed(1)+","+p[0][1].toFixed(1):"";
  var d="M"+p[0][0].toFixed(1)+","+p[0][1].toFixed(1),i,cl=function(v,x,y){return Math.max(Math.min(x,y),Math.min(Math.max(x,y),v))};
  for(i=0;i<p.length-1;i++){var p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p2,t=.2,
    c1y=cl(p1[1]+(p2[1]-p0[1])*t,p1[1],p2[1]),c2y=cl(p2[1]-(p3[1]-p1[1])*t,p1[1],p2[1]);
    d+="C"+(p1[0]+(p2[0]-p0[0])*t).toFixed(1)+","+c1y.toFixed(1)+" "+(p2[0]-(p3[0]-p1[0])*t).toFixed(1)+","+c2y.toFixed(1)+" "+p2[0].toFixed(1)+","+p2[1].toFixed(1)}
  return d}
function chart(){var a=hist[tab];if(!a||!a.length)return;var W=600,Hh=250,L=50,R=16,T=16,Bm=30,col=CC[tab]||"#0ea5e9",dec=tab==="debit"||tab==="vbat"?2:0,
  mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),pad=(mx-mn||1)*.3;mn-=pad;mx+=pad;if(mn<0&&Math.min.apply(0,a)>=0)mn=0;
  var X=function(i){return L+i/(N-1)*(W-L-R)},Y=function(v){return T+(1-(v-mn)/(mx-mn))*(Hh-T-Bm)},base=Hh-Bm,i,g="",
  pts=a.map(function(v,j){return[X(j+N-a.length),Y(v)]}),ln=smooth(pts),xs=pts[0][0],xe=pts[pts.length-1][0],ye=pts[pts.length-1][1];
  for(i=0;i<=4;i++){var yy=T+i*(Hh-T-Bm)/4,val=mx-i*(mx-mn)/4;g+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+yy.toFixed(1)+'" y2="'+yy.toFixed(1)+'"/><text x="'+(L-8)+'" y="'+(yy+4).toFixed(1)+'" text-anchor="end">'+val.toFixed(Math.abs(val)>=100?0:dec>1&&Math.abs(val)<10?2:1)+"</text>"}
  [["-60 dtk",0,"start"],["-40",(N-1)/3,"middle"],["-20",(N-1)*2/3,"middle"],["sekarang",N-1,"end"]].forEach(function(t){g+='<text x="'+X(t[1]).toFixed(1)+'" y="'+(Hh-8)+'" text-anchor="'+t[2]+'">'+t[0]+"</text>"});
  var hv="";
  if(hovX!=null){var k=0,dd=1e9;pts.forEach(function(q,j){var e=Math.abs(q[0]-hovX);if(e<dd){dd=e;k=j}});
    var hx=pts[k][0],hy=pts[k][1],ago=a.length-1-k,tw=118,tx=Math.max(L,Math.min(W-R-tw,hx-tw/2)),ty=hy>T+64?hy-58:hy+14;
    hv='<line class="cl" x1="'+hx.toFixed(1)+'" x2="'+hx.toFixed(1)+'" y1="'+T+'" y2="'+base+'"/><circle cx="'+hx.toFixed(1)+'" cy="'+hy.toFixed(1)+'" r="5" fill="#fff" stroke="'+col+'" stroke-width="2.4"/>'+
    '<g class="tt"><rect x="'+tx.toFixed(1)+'" y="'+ty.toFixed(1)+'" width="'+tw+'" height="44" rx="10"/><text class="t1" x="'+(tx+12).toFixed(1)+'" y="'+(ty+19).toFixed(1)+'">'+a[k].toFixed(dec)+" "+CU[tab]+'</text><text class="t2" x="'+(tx+12).toFixed(1)+'" y="'+(ty+35).toFixed(1)+'">'+(ago?ago+" dtk lalu":"sekarang")+"</text></g>"}
  $("dch").innerHTML='<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+col+'" stop-opacity=".38"/><stop offset=".7" stop-color="'+col+'" stop-opacity=".07"/><stop offset="1" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs>'+g+
  '<path d="'+ln+"L"+xe.toFixed(1)+","+base+"L"+xs.toFixed(1)+","+base+'Z" fill="url(#dg)"/>'+
  '<path d="'+ln+'" fill="none" stroke="'+col+'" stroke-opacity=".22" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'+
  '<path d="'+ln+'" fill="none" stroke="'+col+'" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'+
  '<circle class="pulse" cx="'+xe.toFixed(1)+'" cy="'+ye.toFixed(1)+'" r="5" fill="'+col+'"/><circle cx="'+xe.toFixed(1)+'" cy="'+ye.toFixed(1)+'" r="4.6" fill="#fff" stroke="'+col+'" stroke-width="2.4"/>'+hv+
  '<rect x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+(Hh-T-Bm)+'" fill="transparent" id="dchit"/>'}
(function(){var c=$("dch");if(!c)return;
  function px(e){var r=c.getBoundingClientRect();return(e.clientX-r.left)/r.width*600}
  c.addEventListener("pointermove",function(e){hovX=px(e);chart()});
  c.addEventListener("pointerleave",function(){hovX=null;chart()})})();
function setSt(live,txt){var s=$("dst");s.classList.toggle("off",!live);s.lastChild.textContent=txt}
var srcTxt="Prototipe (simulasi)";
function showLevel(w){var s=$("dst");if(!s||!run)return;s.classList.remove("ok","warn","bad","off");s.classList.add(["ok","warn","bad"][w]);s.lastChild.textContent=(sensorOnline?"LIVE · SENSOR":"LIVE · "+srcTxt.toUpperCase())+" · "+LVN[w]}
function isAdminDashboard(){return !!(authState&&authState.authenticated&&authState.role==="admin"&&B.classList.contains("is-dash"))}
function step(){
  if(!authState||authState.role!=="admin"||!run)return;
  $("dclk").textContent=new Date().toLocaleTimeString("id-ID");
  if(sensorOnline&&Date.now()-lastSensorAt>10000){sensorOnline=false;log("Data sensor berhenti masuk. Beralih ke simulasi prototipe","w")}
  if(sensorOnline)return;
  tick++;apply(sim())
}
function checkSession(){
  if(window.VX_DEMO_MODE)return;
  if(Date.now()-lastAuthCheck<15000)return;
  lastAuthCheck=Date.now();
  window.VXAuth.request("auth/me").then(function(result){if(!result.authenticated||result.role!=="admin")window.VXAuth.expire()})
}
function visitRow(visit){
  var item=document.createElement("li"),name=document.createElement("span"),details=document.createElement("span");
  var pages={beranda:"Beranda",tentang:"Tentang",dokumentasi:"Dokumentasi","struktur-tim":"Struktur Tim",faq:"FAQ",dashboard:"Dashboard"};
  item.className="visit-row";name.className="visit-row__name";details.className="visit-row__meta";
  name.textContent=String(visit.visitorName||"Pengunjung")+" · "+(visit.role==="admin"?"Admin":"Tamu");
  details.textContent=new Date(visit.ts).toLocaleString("id-ID")+" · "+(pages[visit.page]||String(visit.page||""))+" · "+String(visit.device||"unknown");
  item.appendChild(name);item.appendChild(details);return item
}
function updateVisitStatus(message){var status=$("visit-feed-status");if(status)status.textContent=message}
function renderVisits(visits){
  var list=$("vhl");while(list.firstChild)list.removeChild(list.firstChild);
  visits.forEach(function(visit){list.appendChild(visitRow(visit))});
  $("vhs").textContent=visits.length+" kunjungan terakhir"
}
function refreshVisits(){
  if(window.VX_DEMO_MODE||!isAdminDashboard())return;
  window.VXAuth.request("visits?limit=100").then(function(result){renderVisits(result.visits);updateVisitStatus("Riwayat tersimpan di server dan diperbarui langsung.")}).catch(function(error){
    updateVisitStatus("Riwayat kunjungan tidak dapat dimuat: "+error.message);
    if(error.status===401)window.VXAuth.expire()
  })
}
function openVisitStream(){
  if(window.VX_DEMO_MODE||visitsSource||!window.EventSource)return;
  try{
    visitsSource=new EventSource(window.VXAuth.url("stream/visits"),{withCredentials:true});
    visitsSource.addEventListener("auth-expired",function(){visitsSource.close();visitsSource=null;window.VXAuth.expire()});
    visitsSource.addEventListener("visit",function(event){
      try{var item=visitRow(JSON.parse(event.data)),list=$("vhl");list.insertBefore(item,list.firstChild);while(list.children.length>100)list.lastChild.remove();$("vhs").textContent=list.children.length+" kunjungan terakhir"}
      catch(error){updateVisitStatus("Data kunjungan realtime tidak valid.")}
    });
    visitsSource.onerror=function(){updateVisitStatus("Koneksi riwayat realtime terputus; mencoba menyambung kembali.");checkSession()}
  }catch(error){updateVisitStatus("Riwayat realtime tidak tersedia: "+error.message)}
}
function loadLatest(){
  if(window.VX_DEMO_MODE)return;
  window.VXAuth.request("latest").then(function(result){
    if(result.reading&&Date.now()-Number(result.reading.ts)<10000){sensorOnline=true;lastSensorAt=Number(result.reading.ts);if(run)apply(result.reading);srcTxt="Sensor"}
    else{sensorOnline=false;srcTxt="Prototipe (simulasi)"}
  }).catch(function(error){
    sensorOnline=false;srcTxt="Prototipe (simulasi)";
    if(error.status===401)window.VXAuth.expire()
  })
}
function openSensorStream(){
  if(window.VX_DEMO_MODE||sensorSource||!window.EventSource)return;
  try{
    sensorSource=new EventSource(window.VXAuth.url("stream/sensor"),{withCredentials:true});
    sensorSource.addEventListener("auth-expired",function(){sensorSource.close();sensorSource=null;window.VXAuth.expire()});
    sensorSource.addEventListener("reading",function(event){
      try{var reading=JSON.parse(event.data);sensorOnline=true;lastSensorAt=Date.now();if(run){apply(reading);srcTxt="Sensor"}else setSt(false,"DIJEDA")}
      catch(error){srcTxt="Prototipe (simulasi)"}
    });
    sensorSource.onerror=function(){sensorOnline=false;if(run)srcTxt="Prototipe (simulasi)";checkSession()}
  }catch(error){sensorOnline=false;srcTxt="Prototipe (simulasi)"}
}
var onChange={};
function setupDashboard(){
  if(!initialized){
    initialized=true;
    {
    var seed=window.VXSim?VXSim.history():[];if(!seed.length)seed=[sim()];
    seed.forEach(function(r){var n=norm(r);K.forEach(function(k){hist[k].push(n[k])})});
    log("Dashboard terhubung ke simulasi prototipe (halaman Tentang)","i");chart();
    if(window.VXSim)VXSim.onChange(function(c){if(!authState||authState.role!=="admin")return;
      if("on"in c)log("Pompa "+(c.on?"dihidupkan":"dimatikan"),"i");
      if("fault"in c)log(c.fault==="none"?"Gangguan simulasi dihapus":"Gangguan simulasi: "+({leak:"kebocoran",jam:"turbin macet",belt:"sabuk slip",batt:"baterai turun cepat"}[c.fault]),"i");
      if("q"in c||"h"in c)clearTimeout(onChange.t),onChange.t=setTimeout(function(){log("Pengaturan prototipe diubah: debit "+VXSim.state.q.toFixed(2)+" L/s, head "+VXSim.state.h.toFixed(2)+" m","i")},800);
      });
    }
    whyBox();
    $("dpause").onclick=function(){
      run=!run;this.textContent=run?"Jeda":"Lanjut";
      if(!run){if(timer){clearInterval(timer);timer=null}setSt(false,"DIJEDA")}
      else if(sensorOnline)srcTxt="Sensor";
      else startSimulation()
    };
    $("vhclr").textContent="Muat ulang";$("vhclr").onclick=refreshVisits;
    var historyNote=document.querySelector(".vhc .dnote");
    if(historyNote)historyNote.textContent=window.VX_DEMO_MODE
      ?"Riwayat kunjungan tidak tersedia pada versi demo GitHub Pages."
      :"Riwayat nama, halaman, dan jenis perangkat disimpan di server. Kunjungan baru muncul otomatis.";
    var status=$("visit-feed-status");
    if(!status){status=document.createElement("p");status.className="dnote";status.id="visit-feed-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");$("vhl").parentNode.insertBefore(status,$("vhl"))}
    status.textContent=window.VX_DEMO_MODE
      ?"Mode demo: riwayat kunjungan tidak terhubung ke server."
      :"Memuat riwayat kunjungan...";
    if(window.VX_DEMO_MODE){
      $("vhclr").hidden=true;
      if(dashboardContent&&!$("vx-demo-notice")){
        var notice=document.createElement("p");
        notice.id="vx-demo-notice";
        notice.className="vx-demo-notice";
        notice.setAttribute("role","status");
        notice.textContent="MODE DEMO — Dashboard ini hanya simulasi publik. Login tidak diverifikasi dan tidak ada data sensor realtime.";
        dashboardContent.insertBefore(notice,dashboardContent.firstChild);
      }
    }
    $("dtabs").onclick=function(event){var button=event.target.closest("button");if(!button)return;tab=button.dataset.k;this.querySelectorAll("button").forEach(function(item){item.setAttribute("aria-pressed",String(item===button))});chart()}
  }
  window.vxDashboard={push:function(reading){
    if(window.VX_DEMO_MODE||!isAdminDashboard()||!reading||K.some(function(key){return typeof reading[key]!=="number"||!Number.isFinite(reading[key])}))return;
    sensorOnline=true;lastSensorAt=Date.now();apply(reading);srcTxt="Data eksternal"
  }}
}
function startSimulation(){if(!timer&&run){timer=setInterval(step,1000);step()}}
function stopStreams(){
  if(timer){clearInterval(timer);timer=null}
  if(sensorSource){sensorSource.close();sensorSource=null}
  if(visitsSource){visitsSource.close();visitsSource=null}
  sensorOnline=false
}
function resetDashboard(){
  stopStreams();window.vxDashboard=undefined;initialized=false;tick=0;D={};flag={};act={};cnt={};cardLv={};
  K.forEach(function(key){hist[key]=[]});
  var logList=$("dlog"),visitList=$("vhl");while(logList.firstChild)logList.removeChild(logList.firstChild);while(visitList.firstChild)visitList.removeChild(visitList.firstChild);
  $("vhs").textContent="";$("dch").textContent=""
}
function dash(on){
  if(!authState||authState.role!=="admin"){stopStreams();window.vxDashboard=undefined;return}
  setupDashboard();
  if(window.VX_DEMO_MODE){sensorOnline=false;startSimulation();return}
  if(!sensorSource)openSensorStream();if(!visitsSource)openVisitStream();if(on)refreshVisits();loadLatest();startSimulation()
}
sync();
})();
