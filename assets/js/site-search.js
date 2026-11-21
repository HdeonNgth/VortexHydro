
(function(){
var P=[["beranda","Beranda"],["tentang","Tentang"],["dokumentasi","Dokumentasi"],["struktur-tim","Struktur Tim"],["dashboard","Dashboard"]];
var ov=document.getElementById("vs-ov"),inp=document.getElementById("vs-in"),ul=document.getElementById("vs-res"),hint=document.getElementById("vs-hint");
var idx=[],items=[],act=-1,back=null;
function esc(t){return t.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function build(){idx=[];P.forEach(function(p){var pg=document.getElementById(p[0]),seen={};if(!pg)return;
pg.querySelectorAll("h1,h2,h3,h4,p,li,td,th,figcaption,small,b,summary").forEach(function(el){
if(el.closest(".vs-ov,script,style"))return;var t=(el.textContent||"").replace(/\s+/g," ").trim();
if(t.length<3||seen[t])return;seen[t]=1;idx.push({p:p[0],pn:p[1],el:el,t:t,n:t.toLowerCase(),h:/^H/.test(el.tagName)})})})}
function snip(t,tok){var n=t.toLowerCase(),i=n.indexOf(tok[0]);var a=Math.max(0,i-40),s=(a?"…":"")+t.slice(a,a+130)+(t.length>a+130?"…":"");
s=esc(s);tok.forEach(function(k){s=s.replace(new RegExp("("+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi"),"<mark>$1</mark>")});return s}
function find(q){var tok=q.toLowerCase().split(/\s+/).filter(Boolean);if(q.trim().length<2)return[];
var r=idx.filter(function(e){return tok.every(function(k){return e.n.indexOf(k)>=0})});
r.forEach(function(e){e.s=(e.h?3:0)+(e.n.indexOf(tok[0])===0?1:0)-e.t.length/1000});
r.sort(function(a,b){return b.s-a.s});return r.slice(0,12).map(function(e){e.tok=tok;return e})}
function mark(){[].forEach.call(ul.children,function(li,i){li.setAttribute("aria-selected",i===act)});var c=ul.children[act];if(c&&c.scrollIntoView)c.scrollIntoView({block:"nearest"})}
function render(){items=find(inp.value);act=items.length?0:-1;
if(!items.length){ul.innerHTML="";hint.textContent=inp.value.trim().length<2?"Ketik minimal 2 huruf. Pintasan: Ctrl+K atau tombol /.":"Tidak ada hasil untuk “"+inp.value.trim()+"”.";return}
hint.textContent=items.length+" hasil. Panah atas/bawah untuk memilih, Enter untuk membuka.";
ul.innerHTML=items.map(function(e,i){return'<li role="option" data-i="'+i+'"><small>'+e.pn+"</small><span>"+snip(e.t,e.tok)+"</span></li>"}).join("");mark()}
function open(){back=document.activeElement;build();ov.hidden=false;document.body.style.overflow="hidden";inp.value="";render();inp.focus()}
function close(){ov.hidden=true;document.body.style.overflow="";if(back&&back.focus)back.focus()}
function go(e){close();var cur=(location.hash||"#beranda").slice(1);
function sc(){var noMotion=document.documentElement.classList.contains("vx-noanim");e.el.scrollIntoView({behavior:noMotion?"auto":"smooth",block:"center"});e.el.classList.add("vs-flash");setTimeout(function(){e.el.classList.remove("vs-flash")},2200)}
if(cur!==e.p){location.hash="#"+e.p;setTimeout(sc,160)}else sc()}
[].forEach.call(document.querySelectorAll("[data-vs-open]"),function(b){b.addEventListener("click",open)});
document.getElementById("vs-x").addEventListener("click",close);
ov.addEventListener("mousedown",function(e){if(e.target===ov)close()});
inp.addEventListener("input",render);
ul.addEventListener("click",function(e){var li=e.target.closest("li");if(li)go(items[+li.dataset.i])});
inp.addEventListener("keydown",function(e){
if(e.key==="ArrowDown"&&items.length){e.preventDefault();act=(act+1)%items.length;mark()}
else if(e.key==="ArrowUp"&&items.length){e.preventDefault();act=(act-1+items.length)%items.length;mark()}
else if(e.key==="Enter"&&items[act]){e.preventDefault();go(items[act])}});
document.addEventListener("keydown",function(e){
if(e.key==="Escape"&&!ov.hidden){close();return}
var t=e.target,typing=t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable);
if((e.key==="k"||e.key==="K")&&(e.ctrlKey||e.metaKey)){e.preventDefault();ov.hidden?open():close()}
else if(e.key==="/"&&!typing&&ov.hidden){e.preventDefault();open()}});
})();
