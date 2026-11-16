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
var busy=false,PG=["beranda","tentang","teknologi","dokumentasi","struktur-tim","dashboard"];
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
function applyMotionPreference(){H.classList.toggle("vx-noanim",userNoAnim);if(ab){ab.setAttribute("aria-pressed",String(!userNoAnim));ab.disabled=false;ab.removeAttribute("title")}}
applyMotionPreference();

$("vxl").onclick=function(e){var x=e.target.closest("[data-a]");if(!x)return;var a=x.dataset.a;
  if(a==="calc"){window.VXPAL&&VXPAL.close();p.classList.toggle("show");x.classList.toggle("on",p.classList.contains("show"))}
  else if(a==="login"){tog(false)}
  else if(a==="lang"){var lb=document.querySelector("[data-language-toggle]");lb&&lb.click()}
  else if(a==="top")scrollTo({top:0,behavior:motionDisabled()?"auto":"smooth"});
  else if(a==="anim"){userNoAnim=!userNoAnim;if(!motionQuery.matches){try{localStorage.setItem("vxa",userNoAnim?"off":"on")}catch(_){}}applyMotionPreference()}
  else if(a==="palette"){window.VXPAL&&VXPAL.toggle(x)}
  else if(a==="theme"){var dk=H.dataset.theme!=="dark";H.classList.add("vx-theming");H.dataset.theme=dk?"dark":"light";setTh();try{localStorage.setItem("vxt",H.dataset.theme)}catch(_){}setTimeout(function(){H.classList.remove("vx-theming")},700)}};
var SUN='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',MOON='<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';
function setTh(){var x=document.querySelector("[data-a=theme] svg");if(x)x.innerHTML=H.dataset.theme==="dark"?SUN:MOON}setTh();
/* ===== Dashboard ===== */
var K=["debit","head","rpm","volt","amp","daya","eff","temp"],D={},N=60,hist={},tick=0,run=true,timer=null,tab="daya",initialized=false,sensorOnline=false,sensorSource=null,visitsSource=null,lastAuthCheck=0,lastSensorAt=0;
K.forEach(function(k){hist[k]=[]});
var fmt={debit:1,head:2,rpm:0,volt:1,amp:2,daya:1,eff:1,temp:1},lim={debit:[40,Infinity],rpm:[0,340],temp:[0,32]},flag={};
function log(m,c){if(!authState||authState.role!=="admin")return;var ul=$("dlog"),li=document.createElement("li"),time=document.createElement("time"),message=document.createElement("span");li.className=c||"";time.textContent=new Date().toLocaleTimeString("id-ID");message.textContent=m;li.appendChild(time);li.appendChild(message);ul.insertBefore(li,ul.firstChild);while(ul.children.length>8)ul.lastChild.remove()}
function sim(){var s=tick/9,dip=(tick%75>55)?-22:0,q=52+9*Math.sin(s/2.2)+Math.random()*3+dip,hd=1.5+Math.random()*.04,rpm=110+q*1.9+Math.random()*6,v=rpm/10,ph=9.81*q*hd,eff=.34+.03*Math.sin(s/3)+Math.random()*.01,pe=ph*eff;
  return{debit:q,head:hd,rpm:rpm,volt:v,amp:pe/v,daya:pe,eff:eff*100,temp:26.4+tick*.004+Math.random()*.2}}
function norm(o){var r={};K.forEach(function(k){r[k]=o[k]!=null?+o[k]:(D[k]||0)});if(o.daya==null)r.daya=r.volt*r.amp;if(o.eff==null&&o.debit!=null&&o.head!=null){var ph=9.81*r.debit*r.head;r.eff=ph?Math.min(100,r.daya/ph*100):0}return r}
function apply(o){if(!authState||authState.role!=="admin"||!o)return;D=norm(o);K.forEach(function(k){var a=hist[k];a.push(D[k]);if(a.length>N)a.shift()});render()}
function spark(k){var a=hist[k],mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),r=mx-mn||1;return a.map(function(v,i){return(i/(N-1)*100).toFixed(1)+","+(30-(v-mn)/r*26).toFixed(1)}).join(" ")}
function render(){
  K.forEach(function(k){var c=document.querySelector('[data-c="'+k+'"]');c.querySelector("b span").textContent=D[k].toFixed(fmt[k]);c.querySelector("polyline").setAttribute("points",spark(k));
    var l=lim[k],bad=l&&(D[k]<l[0]||D[k]>l[1]);c.classList.toggle("warn",!!bad);
    if(bad&&!flag[k]){flag[k]=1;log(k==="debit"?"Debit di bawah ambang ("+D[k].toFixed(1)+" L/s)":k==="rpm"?"Putaran melebihi batas":"Suhu air tinggi","w")}
    if(!bad&&flag[k]){flag[k]=0;log(k+" kembali normal","o")}});
  $("grpm").style.strokeDashoffset=75-Math.min(1,D.rpm/400)*75;$("grpmt").textContent=Math.round(D.rpm);
  $("geff").style.strokeDashoffset=75-Math.min(1,D.eff/100)*75;$("geft").textContent=D.eff.toFixed(0)+"%";chart()}
function chart(){var a=hist[tab],W=600,Hh=230,L=44,R=12,T=12,Bm=26,mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),pad=(mx-mn||1)*.2;mn-=pad;mx+=pad;
  var X=function(i){return L+i/(N-1)*(W-L-R)},Y=function(v){return T+(1-(v-mn)/(mx-mn))*(Hh-T-Bm)},g="",pts=a.map(function(v,i){return X(i+N-a.length).toFixed(1)+","+Y(v).toFixed(1)}),i;
  for(i=0;i<=3;i++){var yy=T+i*(Hh-T-Bm)/3,val=mx-i*(mx-mn)/3;g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="rgba(255,255,255,.08)"/><text x="'+(L-6)+'" y="'+(yy+4)+'" text-anchor="end">'+val.toFixed(val>100?0:1)+"</text>"}
  var x0=X(N-a.length);
  $("dch").innerHTML='<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cyan)" stop-opacity=".4"/><stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/></linearGradient></defs>'+g+'<polygon fill="url(#dg)" points="'+x0+","+(Hh-Bm)+" "+pts.join(" ")+" "+X(N-1)+","+(Hh-Bm)+'"/><polyline fill="none" stroke="var(--lite)" stroke-width="2.4" stroke-linejoin="round" points="'+pts.join(" ")+'"/><circle cx="'+X(N-1)+'" cy="'+Y(a[a.length-1])+'" r="4.5" fill="#fff" stroke="var(--cyan)" stroke-width="2"/><text x="'+L+'" y="'+(Hh-6)+'">-60 dtk</text><text x="'+(W-R)+'" y="'+(Hh-6)+'" text-anchor="end">sekarang</text>'}
function setSt(live,txt){var s=$("dst");s.classList.toggle("off",!live);s.lastChild.textContent=txt}
function isAdminDashboard(){return !!(authState&&authState.authenticated&&authState.role==="admin"&&B.classList.contains("is-dash"))}
function step(){
  if(!isAdminDashboard()||!run)return;
  if(sensorOnline&&Date.now()-lastSensorAt>10000){sensorOnline=false;setSt(false,"OFFLINE / DATA SIMULASI")}
  if(sensorOnline)return;
  tick++;$("dclk").textContent=new Date().toLocaleTimeString("id-ID");apply(sim());setSt(false,"OFFLINE / DATA SIMULASI")
}
function checkSession(){
  if(window.VX_DEMO_MODE)return;
  if(Date.now()-lastAuthCheck<15000)return;
  lastAuthCheck=Date.now();
  window.VXAuth.request("auth/me").then(function(result){if(!result.authenticated||result.role!=="admin")window.VXAuth.expire()})
}
function visitRow(visit){
  var item=document.createElement("li"),name=document.createElement("span"),details=document.createElement("span");
  var pages={beranda:"Beranda",tentang:"Tentang",teknologi:"Teknologi",dokumentasi:"Dokumentasi","struktur-tim":"Struktur Tim",faq:"FAQ",dashboard:"Dashboard"};
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
    if(result.reading&&Date.now()-Number(result.reading.ts)<10000){sensorOnline=true;lastSensorAt=Number(result.reading.ts);if(run)apply(result.reading);setSt(true,"LIVE · SENSOR")}
    else{sensorOnline=false;setSt(false,"OFFLINE / DATA SIMULASI")}
  }).catch(function(error){
    sensorOnline=false;setSt(false,"OFFLINE / DATA SIMULASI");
    if(error.status===401)window.VXAuth.expire()
  })
}
function openSensorStream(){
  if(window.VX_DEMO_MODE||sensorSource||!window.EventSource)return;
  try{
    sensorSource=new EventSource(window.VXAuth.url("stream/sensor"),{withCredentials:true});
    sensorSource.addEventListener("auth-expired",function(){sensorSource.close();sensorSource=null;window.VXAuth.expire()});
    sensorSource.addEventListener("reading",function(event){
      try{var reading=JSON.parse(event.data);sensorOnline=true;lastSensorAt=Date.now();if(run){apply(reading);setSt(true,"LIVE · SENSOR")}else setSt(false,"DIJEDA")}
      catch(error){setSt(false,"OFFLINE / DATA SIMULASI")}
    });
    sensorSource.onerror=function(){sensorOnline=false;if(run)setSt(false,"OFFLINE / DATA SIMULASI");checkSession()}
  }catch(error){sensorOnline=false;setSt(false,"OFFLINE / DATA SIMULASI")}
}
function setupDashboard(){
  if(!initialized){
    initialized=true;
    for(var q=0;q<N;q++){tick++;var initial=sim();K.forEach(function(k){hist[k].push(initial[k])})}
    log("Dashboard dimulai (OFFLINE / DATA SIMULASI)","o");chart();
    $("dpause").onclick=function(){
      run=!run;this.textContent=run?"Jeda":"Lanjut";
      if(!run){if(timer){clearInterval(timer);timer=null}setSt(false,"DIJEDA")}
      else if(sensorOnline)setSt(true,"LIVE · SENSOR");
      else startSimulation()
    };
    $("dsrcb").textContent="Info koneksi sensor";
    $("dsrcb").onclick=function(){$("dsrc").classList.toggle("show")};
    $("durl").hidden=true;$("dcon").hidden=true;$("dsim").hidden=true;
    var sourceNote=document.querySelector("#dsrc .dnote");
    if(sourceNote)sourceNote.textContent=window.VX_DEMO_MODE
      ?"GitHub Pages tidak terhubung ke sensor. Semua nilai di Dashboard ini hanya simulasi."
      :"Sensor mengirim data ke POST /api/ingest dengan header X-API-Key. Tanpa data sensor, dashboard admin menampilkan simulasi dengan label OFFLINE / DATA SIMULASI.";
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
    sensorOnline=true;lastSensorAt=Date.now();apply(reading);setSt(true,"DATA EKSTERNAL")
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
  stopStreams();window.vxDashboard=undefined;initialized=false;tick=0;D={};flag={};
  K.forEach(function(key){hist[key]=[]});
  var logList=$("dlog"),visitList=$("vhl");while(logList.firstChild)logList.removeChild(logList.firstChild);while(visitList.firstChild)visitList.removeChild(visitList.firstChild);
  $("vhs").textContent="";$("dch").textContent=""
}
function dash(on){
  if(!on||!authState||authState.role!=="admin"){stopStreams();window.vxDashboard=undefined;return}
  setupDashboard();
  if(window.VX_DEMO_MODE){
    sensorOnline=false;setSt(false,"OFFLINE / DATA SIMULASI");startSimulation();return
  }
  openSensorStream();openVisitStream();refreshVisits();loadLatest();startSimulation()
}
sync();
})();
