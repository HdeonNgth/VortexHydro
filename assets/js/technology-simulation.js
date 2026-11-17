
(function(){
var $=function(i){return document.getElementById(i)},NS="http://www.w3.org/2000/svg";
var svg=$("vs-svg");if(!svg)return;
var E=window.VXSim;if(!E)return;var S=E.state;
var path=[[420,307],[257,307],[95,307],[95,160],[465,160],[472,172],[472,262],[455,292]];
var cum=[0],L=0,i,k;
for(i=0;i<path.length;i++){var a=path[i],b=path[(i+1)%path.length];L+=Math.hypot(b[0]-a[0],b[1]-a[1]);cum.push(L)}
function at(s){s=((s%L)+L)%L;var j=1;while(cum[j]<s)j++;var a=path[j-1],b=path[j%path.length],t=(s-cum[j-1])/(cum[j]-cum[j-1]);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
var N=64,pg=$("vs-p"),ps=[];
for(i=0;i<N;i++){var c=document.createElementNS(NS,"circle");c.setAttribute("r","3");pg.appendChild(c);ps.push(c)}
var tg=$("vs-turb");
for(k=0;k<6;k++){var bl=document.createElementNS(NS,"path");bl.setAttribute("d","M6 0C16 -2 24 -8 28 -22");bl.setAttribute("fill","none");bl.setAttribute("stroke","var(--cyan,#00B4D8)");bl.setAttribute("stroke-width","5");bl.setAttribute("stroke-linecap","round");bl.setAttribute("transform","rotate("+k*60+")");tg.appendChild(bl)}
var gl=document.querySelectorAll("#vs-led .g"),bu=document.querySelectorAll("#vs-led .b");
var ang=0,gang=0,ph=0,last=0,vis=false,raf=0,lastTxt={},H=document.documentElement;
var btn=$("vs-pump"),sq=$("vs-q"),sh=$("vs-h");
function fmt(n,d){return n.toFixed(d).replace(".",",")}
function set(id,v){if(lastTxt[id]!==v){lastTxt[id]=v;$(id).textContent=v}}
var FL={none:"Normal",leak:"Bocor",jam:"Turbin macet",heat:"Panas berlebih"},fb=document.querySelectorAll("#vs-fault [data-f]");
function sync(){btn.setAttribute("aria-pressed",S.on);btn.textContent="Pompa: "+(S.on?"hidup":"mati");$("vs-qo").textContent=fmt(S.q,2);$("vs-ho").textContent=fmt(S.h,2);sq.value=S.q;sh.value=S.h;Array.prototype.forEach.call(fb,function(b){b.setAttribute("aria-pressed",b.dataset.f===S.fault)})}
btn.onclick=function(){E.set({on:!S.on})};
Array.prototype.forEach.call(fb,function(b){b.onclick=function(){E.set({fault:b.dataset.f})}});
E.onChange(function(){sync();kick()});
sq.oninput=function(){E.set({q:+sq.value})};sh.oninput=function(){E.set({h:+sh.value})};
function tick(t){raf=0;if(!vis||document.hidden)return;
var dt=Math.min(.05,(t-last)/1000||0);last=t;
var r=E.read(),qe=S.qe,rpm=S.rpm,v=r.volt,cur=r.amp,pe=r.daya,ph_=9.81*qe*S.h,br=r.led,moving=!H.classList.contains("vx-noanim");
if(moving){ph+=170*(qe/.5)*dt;ang+=rpm*6*.3*dt;gang+=rpm*6*.3*2.2*dt}
for(i=0;i<N;i++){var p=at(ph+i*L/N);ps[i].setAttribute("cx",p[0].toFixed(1));ps[i].setAttribute("cy",p[1].toFixed(1));ps[i].setAttribute("opacity",qe>.02?.9:0)}
tg.setAttribute("transform","translate(465 158) rotate("+(ang%360).toFixed(1)+")");
$("vs-gen").setAttribute("transform","translate(528 152) rotate("+(gang%360).toFixed(1)+")");
for(i=0;i<3;i++){gl[i].setAttribute("opacity",(br*(.55+.15*i)).toFixed(2));bu[i].setAttribute("fill-opacity",(.18+.82*br).toFixed(2))}
set("r-ph",fmt(ph_,2));set("r-rpm",Math.round(rpm)+"");set("r-v",fmt(v,1));set("r-i",Math.round(cur*1000)+"");set("r-pe",fmt(pe,2));set("r-led",Math.round(br*100)+"");set("r-t",fmt(r.temp,1));
svg.setAttribute("data-fault",S.fault);
raf=requestAnimationFrame(tick)}
function kick(){if(!raf&&vis&&!document.hidden){last=performance.now();raf=requestAnimationFrame(tick)}}
if("IntersectionObserver"in window){new IntersectionObserver(function(e){vis=e[0].isIntersecting;if(vis)kick()},{threshold:.05}).observe(svg)}else{vis=true;kick()}
document.addEventListener("visibilitychange",kick);
sync();
})();
