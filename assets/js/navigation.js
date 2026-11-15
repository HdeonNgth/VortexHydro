(function(){
var $=function(i){return document.getElementById(i)},B=document.body,H=document.documentElement;
/* ===== Navbar liquid glass ===== */
var nav=$("lgn"),lens=$("lens"),lg=$("lg"),prev=null,anim=null,EASE="cubic-bezier(.22,1,.36,1)";
function rect(a){return{l:a.offsetLeft,t:a.offsetTop,w:a.offsetWidth,h:a.offsetHeight}}
function css(r){return{left:r.l+"px",top:r.t+"px",width:r.w+"px",height:r.h+"px"}}
function splash(r){
  if(H.classList.contains("vx-noanim")||!lens.animate)return;
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
  if(go&&prev&&!H.classList.contains("vx-noanim")&&lens.animate){
    var u={l:Math.min(prev.l,r.l),t:Math.min(prev.t,r.t)};u.w=Math.max(prev.l+prev.w,r.l+r.w)-u.l;u.h=Math.max(prev.t+prev.h,r.t+r.h)-u.t;
    var big=u.w>prev.w+4||u.h>prev.h+4;
    anim=lens.animate([css(prev),Object.assign(css(u),{offset:.42}),css(r)],{duration:big?720:300,easing:EASE});
    Object.assign(lens.style,css(r));if(big)splash(r)
  }else Object.assign(lens.style,css(r));
  prev=r;
}
function mark(){var k=(location.hash||"#beranda").slice(1);if(!$(k))k="beranda";
  nav.querySelectorAll("a").forEach(function(a){if(a.dataset.k===k)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});return k}
var HK="vxh",NM={beranda:"Beranda",tentang:"Tentang",teknologi:"Teknologi",dokumentasi:"Dokumentasi","struktur-tim":"Struktur Tim",dashboard:"Dashboard"},V;
try{V=JSON.parse(localStorage.getItem(HK))}catch(_){}V=V&&V.log?V:{s:0,pv:0,first:Date.now(),log:[]};
try{if(!sessionStorage.getItem("vxs")){sessionStorage.setItem("vxs","1");V.s++}}catch(_){}
function saveV(){try{localStorage.setItem(HK,JSON.stringify(V))}catch(_){}}
function rec(k){V.pv++;V.log.unshift({t:Date.now(),p:k});V.log.length=Math.min(V.log.length,50);saveV();
  if(window.VX_TRACK_URL&&navigator.sendBeacon){try{navigator.sendBeacon(window.VX_TRACK_URL,JSON.stringify({page:k,t:Date.now(),ua:navigator.userAgent}))}catch(_){}}renderV()}
function renderV(){var s=$("vhs");if(!s)return;var f=function(t){return new Date(t).toLocaleString("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})};
  s.innerHTML='<span><b>'+V.s+'</b>kunjungan</span><span><b>'+V.pv+'</b>halaman dilihat</span><span>Pertama kali: '+f(V.first)+'</span>';
  $("vhl").innerHTML=V.log.slice(0,8).map(function(e){return"<li><time>"+f(e.t)+"</time><span>"+(NM[e.p]||e.p)+"</span></li>"}).join("")}
var busy=false,PG=["beranda","tentang","teknologi","dokumentasi","struktur-tim","dashboard"];
function enter(k){var pg=$(k);if(!pg)return;pg.classList.remove("vx-enter");void pg.offsetWidth;pg.classList.add("vx-enter")}
function go(h){var ov=$("vxpt");if(H.classList.contains("vx-noanim")||!ov.animate){location.hash=h;return}
  busy=true;mark2(h);ov.classList.add("on");
  var a=ov.animate([{transform:"translateY(100%)"},{transform:"translateY(0)"}],{duration:650,easing:"cubic-bezier(.76,0,.24,1)",fill:"forwards"});
  a.onfinish=function(){location.hash=h;setTimeout(function(){var c=ov.animate([{transform:"translateY(0)"},{transform:"translateY(-100%)"}],{duration:750,easing:"cubic-bezier(.76,0,.24,1)",fill:"forwards"});
    c.onfinish=function(){ov.classList.remove("on");a.cancel();c.cancel();busy=false}},380)}}
function mark2(k){nav.querySelectorAll("a").forEach(function(a){if(a.dataset.k===k)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});place(true)}
var initialSync=true;
function box(el){var r=el.getBoundingClientRect();return{l:r.left,t:r.top,w:r.width,h:r.height}}
function applyBox(el,r,direction){Object.assign(el.style,{position:"fixed",left:r.l+"px",top:r.t+"px",right:"auto",bottom:"auto",translate:"none",width:r.w+"px",height:r.h+"px",overflow:"hidden",flexDirection:direction})}
function restoreStyle(el,value){if(value===null)el.removeAttribute("style");else el.setAttribute("style",value)}
function animateBox(from,to,duration,done){
  var a=lg.animate([css(from),css(to)],{duration:duration,easing:EASE,fill:"both"});
  a.onfinish=function(){a.cancel();done()}
}
function dashboardNav(is){
  var reduced=H.classList.contains("vx-noanim")||(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if(reduced||!lg.animate){B.classList.toggle("is-dash",is);dash(is);prev=null;requestAnimationFrame(function(){place(false)});return}
  var original=lg.getAttribute("style"),start=box(lg),width=Math.min(68,start.w),height=Math.min(58,start.h),target,dock;
  if(is){
    dock={l:start.l+start.w-width,t:start.t,w:width,h:height};
    lg.style.transformOrigin="top left";
    var collapse=lg.animate([
      {transform:"translate(0,0) scale(1,1)"},
      {transform:"translate("+(dock.l-start.l)+"px,"+(dock.t-start.t)+"px) scale("+(width/start.w)+","+(height/start.h)+")"}
    ],{duration:360,easing:EASE,fill:"both"});
    collapse.onfinish=function(){
      applyBox(lg,dock,"row");collapse.cancel();lg.style.transformOrigin="";
      B.classList.add("is-dash");
      restoreStyle(lg,original);target=box(lg);applyBox(lg,dock,"column");dash(true);
      animateBox(dock,target,760,function(){restoreStyle(lg,original);prev=null;place(false)});
    };
    return
  }
  dash(false);
  B.classList.remove("is-dash");restoreStyle(lg,original);target=box(lg);B.classList.add("is-dash");
  dock={l:target.l+target.w-width,t:target.t,w:width,h:Math.min(58,target.h)};
  applyBox(lg,start,"column");
  animateBox(start,dock,360,function(){
    applyBox(lg,dock,"row");B.classList.remove("is-dash");restoreStyle(lg,original);target=box(lg);
    applyBox(lg,dock,"row");
    animateBox(dock,target,760,function(){restoreStyle(lg,original);prev=null;place(false)});
  })
}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey)return;var h=a.getAttribute("href").slice(1);
  if(PG.indexOf(h)<0)return;if(busy){e.preventDefault();return}if(h===(location.hash||"#beranda").slice(1))return;e.preventDefault();go(h)},true);
function sync(){var k=mark();rec(k);enter(k);var was=B.classList.contains("is-dash"),is=k==="dashboard";
  if(was!==is){if(initialSync){B.classList.toggle("is-dash",is);dash(is);prev=null;requestAnimationFrame(function(){place(false)})}else dashboardNav(is)}
  else{place(true);dash(is)}
  initialSync=false}
addEventListener("hashchange",sync);addEventListener("resize",function(){prev=null;place(false)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){prev=null;place(false)});
/* ===== Tools ===== */
var t=$("vxt"),b=$("vxb"),p=$("vxp");
function tog(o){t.classList.toggle("open",o);b.setAttribute("aria-expanded",o);if(!o){p.classList.remove("show");window.VXPAL&&VXPAL.close();t.querySelectorAll(".vxt__it.on").forEach(function(e){e.classList.remove("on")})}}
b.onclick=function(){tog(!t.classList.contains("open"))};$("vxc").onclick=function(){p.classList.remove("show");var c=t.querySelector("[data-a=calc]");c&&c.classList.remove("on")};
addEventListener("keydown",function(e){if(e.key==="Escape")tog(false)});
function calc(){var q=+$("vq").value||0,h=+$("vh").value||0,e=(+$("ve").value||0)/100,w=9.81*q*h*e;$("vr").textContent=w>=1000?(w/1000).toFixed(2)+" kW":w.toFixed(1)+" W"}
["vq","vh","ve"].forEach(function(i){$(i).oninput=calc});calc();
var sz=0,ab=document.querySelector("[data-a=anim]");
try{if(localStorage.getItem("vxa")==="off"){H.classList.add("vx-noanim");ab.setAttribute("aria-pressed","false")}}catch(_){}
$("vxl").onclick=function(e){var x=e.target.closest("[data-a]");if(!x)return;var a=x.dataset.a;
  if(a==="calc"){window.VXPAL&&VXPAL.close();p.classList.toggle("show");x.classList.toggle("on",p.classList.contains("show"))}
  else if(a==="top")scrollTo({top:0,behavior:"smooth"});
  else if(a==="anim"){var off=!H.classList.contains("vx-noanim");H.classList.toggle("vx-noanim",off);x.setAttribute("aria-pressed",!off);try{localStorage.setItem("vxa",off?"off":"on")}catch(_){}}
  else if(a==="palette"){window.VXPAL&&VXPAL.toggle(x)}
  else if(a==="theme"){var dk=H.dataset.theme!=="dark";H.classList.add("vx-theming");H.dataset.theme=dk?"dark":"light";setTh();try{localStorage.setItem("vxt",H.dataset.theme)}catch(_){}setTimeout(function(){H.classList.remove("vx-theming")},700)}};
var SUN='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',MOON='<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';
function setTh(){var x=document.querySelector("[data-a=theme] svg");if(x)x.innerHTML=H.dataset.theme==="dark"?SUN:MOON}setTh();
/* ===== Dashboard ===== */
var K=["debit","head","rpm","volt","amp","daya","eff","temp"],D={},N=60,hist={},tick=0,run=true,timer=null,url=null,tab="daya",ext=0;
K.forEach(function(k){hist[k]=[]});
var fmt={debit:1,head:2,rpm:0,volt:1,amp:2,daya:1,eff:1,temp:1},lim={debit:[40,Infinity],rpm:[0,340],temp:[0,32]},flag={};
function log(m,c){var ul=$("dlog"),li=document.createElement("li");li.className=c||"";li.innerHTML="<time>"+new Date().toLocaleTimeString("id-ID")+"</time><span>"+m+"</span>";ul.insertBefore(li,ul.firstChild);while(ul.children.length>8)ul.lastChild.remove()}
function sim(){var s=tick/9,dip=(tick%75>55)?-22:0,q=52+9*Math.sin(s/2.2)+Math.random()*3+dip,hd=1.5+Math.random()*.04,rpm=110+q*1.9+Math.random()*6,v=rpm/10,ph=9.81*q*hd,eff=.34+.03*Math.sin(s/3)+Math.random()*.01,pe=ph*eff;
  return{debit:q,head:hd,rpm:rpm,volt:v,amp:pe/v,daya:pe,eff:eff*100,temp:26.4+tick*.004+Math.random()*.2}}
function norm(o){var r={};K.forEach(function(k){r[k]=o[k]!=null?+o[k]:(D[k]||0)});if(o.daya==null)r.daya=r.volt*r.amp;if(o.eff==null&&o.debit!=null&&o.head!=null){var ph=9.81*r.debit*r.head;r.eff=ph?Math.min(100,r.daya/ph*100):0}return r}
function apply(o){D=norm(o);K.forEach(function(k){var a=hist[k];a.push(D[k]);if(a.length>N)a.shift()});render()}
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
function step(){tick++;$("dclk").textContent=new Date().toLocaleTimeString("id-ID");
  if(url){fetch(url).then(function(r){return r.json()}).then(apply).catch(function(){setSt(false,"Gagal terhubung");url=null;apply(sim())})}else if(!ext)apply(sim())}
function setSt(live,txt){var s=$("dst");s.classList.toggle("off",!live);s.lastChild.textContent=txt}
function dash(on){if(on&&!timer&&run){timer=setInterval(step,1000);step()}if(!on&&timer){clearInterval(timer);timer=null}}
$("dpause").onclick=function(){run=!run;this.textContent=run?"Jeda":"Lanjut";setSt(run,run?(url?"Live · Sensor":"Live · Simulasi"):"Dijeda");dash(false);dash(run&&B.classList.contains("is-dash"))};
$("dsrcb").onclick=function(){$("dsrc").classList.toggle("show")};
$("dcon").onclick=function(){var v=$("durl").value.trim();if(v){url=v;setSt(true,"Live · Sensor");log("Menghubungkan ke sumber data","o")}};
$("dsim").onclick=function(){url=null;ext=0;setSt(true,"Live · Simulasi")};
$("dtabs").onclick=function(e){var x=e.target.closest("button");if(!x)return;tab=x.dataset.k;this.querySelectorAll("button").forEach(function(y){y.setAttribute("aria-pressed",y===x)});chart()};
window.vxDashboard={push:function(o){ext=1;setSt(true,"Live · Sensor");apply(o)}};
for(var q=0;q<N;q++){tick++;var s0=sim();K.forEach(function(k){hist[k].push(s0[k])})}
log("Dashboard dimulai (mode simulasi)","o");
$("vhclr").onclick=function(){V={s:1,pv:0,first:Date.now(),log:[]};saveV();renderV()};
sync();
})();
