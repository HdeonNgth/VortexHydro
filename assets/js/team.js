
(function(){
const $=s=>document.querySelector(s);
const TEAM_LEADERS=[
 {division:'Modeling',folder:'modeling',leader:'Kristoforus Rizkiano Tembang Langit',description:'Draf singkat: pemodelan bentuk dan perilaku aliran air untuk membantu mengevaluasi rancangan turbin vortex.',members:['Muhammad Firdhie Andalas','M. Rangga Satria Noorfando','Rakha Aribawa Rahman','Lutfi Ahmad Suriyana']},
 {division:'Mat Model',folder:'mat-model',leader:'Muhammad Alfian Firmansyah',description:'Draf singkat: kajian material dan model komponen yang digunakan pada proyek Vortex Hydro.',members:['Muhammad Iqbal Maulana','Khalidatul Aliyah Safitri','Muhamad Ferly Farnando']},
 {division:'Software',folder:'software',leader:'Fattar Davino Aulia Rahman',description:'Draf singkat: pengembangan dan pengelolaan kebutuhan perangkat lunak untuk mendukung proyek Vortex Hydro.',members:['Muhamad Supriyadi','Muhammad Aryaputra Manda','M. Nauval Al-Ghafary Wardoyo',"Haudh Al Maa'uun"]},
 {division:'Electrical',folder:'electrical',leader:'Muhammad Nur Faizin',description:'Draf singkat: dukungan sistem dan komponen kelistrikan untuk kebutuhan proyek Vortex Hydro.',members:['Muhammad Farrel Caesar','Mokhamad Rayhan Faturahman','Dava Maulana Yudha','Iltizamul Haqqi','Mexcelino Perwira Dirganesia','Mochammad Ardiansyah Tri Wicaksono']},
 {division:'Mekanikal',folder:'mekanikal',leader:'M. Salman Alfarizi Ramadani',description:'Draf singkat: rancangan mekanis dan komponen turbin vortex dalam proyek Vortex Hydro.',members:['Mukhamad Nur Alfan',"Mohammad Miftah Yusron Hana'i",'Febrian Patria Yoni','Muhammad Fadil','Mohamad Rizky Fadilah','Mohammad Hisyam Rifai']},
 {division:'Perlengkapan',folder:'perlengkapan',leader:'Handhika Hidayatullah',description:'Draf singkat: kebutuhan perlengkapan untuk mendukung kegiatan dan pengerjaan proyek Vortex Hydro.',members:['Loudy Firza Aulia','Keihan Daafa Parsya','Girendra Hangestubrata','Jalalludin Satriya Nayaka']},
 {division:'PDD',folder:'pdd',leader:"Mohammad Miftah Yusron Hana'i",description:'Draf singkat: dukungan publikasi dan dokumentasi kegiatan proyek Vortex Hydro.',members:['Legison Satria Manik Allo','Maritza Aprilia Putri']}
];
const TEAM_MANAGEMENT=[
 {position:'Ketua Tim',name:'Mochammad Ardiansyah Tri Wicaksono'},
 {position:'Sekretaris Tim 1',name:"Mohammad Miftah Yusron Hana'i"},
 {position:'Sekretaris Tim 2',name:'Mohamad Supriyadi'},
 {position:'Bendahara Tim 1',name:'Khalidatul Aliyah Safitri'},
 {position:'Bendahara Tim 2',name:'Loudy Firza Aulia'},
 {position:'Bendahara Tim 3',name:'Maritza Aprilia Putri'}
];

const TEAM_PHOTO_DATA={
 "electrical/mexcelino-perwira-dirganesia": "assets/team/electrical/mexcelino-perwira-dirganesia.jpg",
 "electrical/mokhamad-rayhan-faturahman": "assets/team/electrical/mokhamad-rayhan-faturahman.jpg",
 "electrical/muhammad-farrel-caesar": "assets/team/electrical/muhammad-farrel-caesar.jpg",
 "electrical/muhammad-nur-faizin": "assets/team/electrical/muhammad-nur-faizin.jpg",
 "mat-model/khalidatul-aliyah-safitri": "assets/team/mat-model/khalidatul-aliyah-safitri.jpg",
 "mat-model/muhammad-alfian-firmansyah": "assets/team/mat-model/muhammad-alfian-firmansyah.jpg",
 "mat-model/muhammad-iqbal-maulana": "assets/team/mat-model/muhammad-iqbal-maulana.jpg",
 "mekanikal/febrian-patria-yoni": "assets/team/mekanikal/febrian-patria-yoni.jpg",
 "mekanikal/m-salman-alfarizi-ramadani": "assets/team/mekanikal/m-salman-alfarizi-ramadani.jpg",
 "mekanikal/mohamad-rizky-fadilah": "assets/team/mekanikal/mohamad-rizky-fadilah.jpg",
 "mekanikal/mohammad-hisyam-rifai": "assets/team/mekanikal/mohammad-hisyam-rifai.jpg",
 "mekanikal/muhammad-fadil": "assets/team/mekanikal/muhammad-fadil.jpg",
 "modeling/kristoforus-rizkiano-tembang-langit": "assets/team/modeling/kristoforus-rizkiano-tembang-langit.jpg",
 "modeling/lutfi-ahmad-suriyana": "assets/team/modeling/lutfi-ahmad-suriyana.jpg",
 "modeling/m-rangga-satria-noorfando": "assets/team/modeling/m-rangga-satria-noorfando.jpg",
 "pdd/maritza-aprilia-putri": "assets/team/pdd/maritza-aprilia-putri.jpg",
 "pengurus/khalidatul-aliyah-safitri": "assets/team/pengurus/khalidatul-aliyah-safitri.jpg",
 "pengurus/loudy-firza-aulia": "assets/team/pengurus/loudy-firza-aulia.jpg",
 "pengurus/maritza-aprilia-putri": "assets/team/pengurus/maritza-aprilia-putri.jpg",
 "pengurus/mohamad-supriyadi": "assets/team/pengurus/mohamad-supriyadi.jpg",
 "perlengkapan/handhika-hidayatullah": "assets/team/perlengkapan/handhika-hidayatullah.jpg",
 "perlengkapan/jalalludin-satriya-nayaka": "assets/team/perlengkapan/jalalludin-satriya-nayaka.jpg",
 "perlengkapan/keihan-daafa-parsya": "assets/team/perlengkapan/keihan-daafa-parsya.jpg",
 "perlengkapan/loudy-firza-aulia": "assets/team/perlengkapan/loudy-firza-aulia.jpg"
};;
const PH_CARD="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 480\" role=\"img\" aria-labelledby=\"title description\">\n  <title id=\"title\">Placeholder foto ketua divisi</title>\n  <desc id=\"description\">Ilustrasi avatar sederhana untuk foto ketua divisi yang belum tersedia.</desc>\n  <defs>\n    <linearGradient id=\"background\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n      <stop offset=\"0\" stop-color=\"#D6E8F1\"/>\n      <stop offset=\"1\" stop-color=\"#7FB9D1\"/>\n    </linearGradient>\n  </defs>\n  <rect width=\"640\" height=\"480\" fill=\"url(#background)\"/>\n  <circle cx=\"320\" cy=\"174\" r=\"82\" fill=\"#244A80\" opacity=\".8\"/>\n  <path d=\"M151 480c13-107 76-166 169-166s156 59 169 166\" fill=\"#140951\" opacity=\".86\"/>\n  <path d=\"M275 178c18 15 72 15 90 0\" fill=\"none\" stroke=\"#D6E8F1\" stroke-linecap=\"round\" stroke-width=\"8\" opacity=\".75\"/>\n</svg>\n", PH_AVATAR="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 96 96\">\n  <defs>\n    <linearGradient id=\"background\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n      <stop offset=\"0\" stop-color=\"#377A98\"/>\n      <stop offset=\"1\" stop-color=\"#140951\"/>\n    </linearGradient>\n  </defs>\n  <circle cx=\"48\" cy=\"48\" r=\"48\" fill=\"url(#background)\"/>\n  <circle cx=\"48\" cy=\"35\" r=\"16\" fill=\"#D6E8F1\"/>\n  <path d=\"M17 86c3-18 15-28 31-28s28 10 31 28\" fill=\"#D6E8F1\"/>\n</svg>\n";
const dataSvg=t=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(t);
const teamPhotoSlug=name=>name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const TEAM_ACCENT={pengurus:'#3C7BD9',modeling:'#2F9BC9','mat-model':'#5470DB',software:'#7C5CE0',electrical:'#EBA02F',mekanikal:'#1FB09C',perlengkapan:'#EA6A58',pdd:'#DC5A92'};
const teamPhoto=(name,folder,kind)=>{
 const real=TEAM_PHOTO_DATA[folder+'/'+teamPhotoSlug(name)],isCard=kind==='card';
 const src=real?' data-src="'+real+'"':' src="'+dataSvg(isCard?PH_CARD:PH_AVATAR)+'"';
 return '<img class="'+(isCard?'tc__img':'tc__avatar')+'"'+src+' alt="'+(isCard?'Foto '+escapeHtml(name):'')+'" decoding="async" loading="lazy" draggable="false">'
};
const teamGroupPhoto=(folder,division)=>'<img class="tc__img" src="'+dataSvg(PH_CARD)+'" alt="Foto bersama Divisi '+escapeHtml(division)+' (belum tersedia)" decoding="async" loading="lazy" draggable="false">';
const TEAM_CARDS=[
 {key:'pengurus',folder:'pengurus',name:TEAM_MANAGEMENT[0].name,role:'Ketua Tim',backTitle:'Pengurus utama',desc:'',listLabel:'Sekretaris & bendahara',unit:'pengurus',
  people:TEAM_MANAGEMENT.slice(1).map(m=>({name:m.name,sub:m.position}))},
 ...TEAM_LEADERS.map(t=>({key:t.folder,folder:t.folder,division:t.division,name:'Divisi '+t.division,role:'Foto bersama',backTitle:'Divisi '+t.division,desc:t.description,listLabel:'Ketua & anggota',unit:'orang',groupPhoto:true,
  people:[{name:t.leader,sub:'Ketua Divisi '+t.division},...t.members.map(name=>({name}))]}))
];

(function(){
 const ICON_USERS='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
 const ICON_BACK='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
 const stage=$('#tm'),prevB=$('#tcPrev'),nextB=$('#tcNext'),ticksEl=$('#tcTicks'),countEl=$('#tcCount'),liveEl=$('#tcLive');
 if(!stage)return;
 const N=TEAM_CARDS.length,pad=n=>String(n).padStart(2,'0');
 const accent=c=>TEAM_ACCENT[c.key]||'#140951';

 const cardHtml=(c,i)=>{
  const rows=c.people.map((p,k)=>'<li class="tc__row" style="--i:'+k+'">'+teamPhoto(p.name,c.folder,'member')+'<span><strong>'+escapeHtml(p.name)+'</strong>'+(p.sub?'<em>'+escapeHtml(p.sub)+'</em>':'')+'</span></li>').join('');
  return '<article class="tc" data-i="'+i+'" style="--ac:'+accent(c)+'"><div class="tc__inner">'
   +'<div class="tc__face tc__front"><button class="tc__open" type="button" tabindex="-1" aria-expanded="false" aria-label="'+escapeHtml(c.role)+': '+escapeHtml(c.name)+'. Tekan untuk melihat '+c.unit+'.">'
    +(c.groupPhoto?teamGroupPhoto(c.folder,c.division):teamPhoto(c.name,c.folder,'card'))+'<span class="tc__shade"></span>'
    +'<span class="tc__pill">'+ICON_USERS+c.people.length+' '+c.unit+'</span>'
    +'<span class="tc__cap"><strong>'+escapeHtml(c.name)+'</strong><span class="tc__role">'+escapeHtml(c.role)+'</span></span></button></div>'
   +'<div class="tc__face tc__back" inert><header class="tc__bh"><div><h4>'+escapeHtml(c.backTitle)+'</h4>'+(c.desc?'<p>'+escapeHtml(c.desc)+'</p>':'')+'</div>'
    +'<button class="tc__flipback" type="button" aria-label="Balik ke foto '+escapeHtml(c.role)+'" title="Balik ke foto">'+ICON_BACK+'</button></header>'
    +'<div class="tc__lh"><span>'+escapeHtml(c.listLabel)+'</span><b>'+c.people.length+'</b></div>'
    +'<ul class="tc__list" tabindex="0" aria-label="Daftar '+c.unit+': '+escapeHtml(c.backTitle)+'">'+rows+'</ul></div>'
  +'</div></article>'
 };
 stage.innerHTML=TEAM_CARDS.map(cardHtml).join('');
 const loadTeamPhotos=()=>{
  if(location.hash!=='#struktur-tim')return;
  document.querySelectorAll('#struktur-tim img[data-src]').forEach(img=>{img.src=img.dataset.src;img.removeAttribute('data-src')});
 };
 window.addEventListener('hashchange',loadTeamPhotos);
 loadTeamPhotos();
 const teamPage=document.getElementById('struktur-tim');
 if(teamPage)new MutationObserver(loadTeamPhotos).observe(teamPage,{childList:true,subtree:true});
 ticksEl.innerHTML=TEAM_CARDS.map((c,i)=>'<button class="tcf__tick" type="button" data-i="'+i+'" style="--ac:'+accent(c)+'" aria-label="Ke kartu '+(i+1)+': '+escapeHtml(c.role)+'"></button>').join('');

 const cards=[...stage.querySelectorAll('.tc')],ticks=[...ticksEl.children];
 const flip=cards.map(()=>({v:0,from:0,to:0,t0:0,dur:0}));   // v: 0 = foto, 1 = daftar anggota
 let pos=0,target=0,cur=0,spread=0,spreadT0=null,cw=300,raf=0,last=0,drag=null,suppress=false,lastWheel=0;
 const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const easeInOut=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
 const easeOut=p=>1-Math.pow(1-p,3);

 /* Satu fungsi yang menempatkan semua kartu berdasarkan jarak d dari posisi tengah (pos). */
 function render(){
  for(let i=0;i<N;i++){
   const d=i-pos,ax=Math.abs(d),s=Math.sign(d),near=Math.min(ax,1),f=flip[i].v;
   const off=ax<=1?ax*.72:.72+(ax-1)*.27;                 // sisi dekat renggang, sisi jauh menumpuk
   const x=s*off*cw*spread;
   const z=-Math.min(ax,4)*80*spread+(1-near)*30+Math.sin(Math.PI*f)*70;   // kartu yang di-flip "terangkat"
   const ry=-s*near*34*spread;
   const sc=(1-near*.1-Math.min(Math.max(ax-1,0),3)*.035)*(1+f*.03)*(.88+.12*spread);
   let op=ax>3?Math.max(0,1-(ax-3)):1;if(spread<1&&ax>.5)op*=spread;
   const c=cards[i];
   c.style.transform='translate3d('+x.toFixed(2)+'px,0,'+z.toFixed(2)+'px) rotateY('+ry.toFixed(2)+'deg) scale('+sc.toFixed(4)+')';
   c.style.zIndex=100-Math.round(ax*10);
   c.style.opacity=op>=1?'':op.toFixed(3);
   c.style.visibility=ax>4||op<=0?'hidden':'visible';
   c.style.setProperty('--a',near.toFixed(3));
  }
 }

 function frame(t){
  const dt=clamp((t-last)/1000,.001,.05);last=t;
  let busy=false;
  if(spreadT0!==null){const p=clamp((t-spreadT0)/1100,0,1);spread=easeOut(p);if(p<1)busy=true;else spreadT0=null}
  const k=drag&&drag.moved?30:(still()?60:9);            // makin besar = makin cepat mengejar
  if(Math.abs(target-pos)>.0005){pos+=(target-pos)*(1-Math.exp(-k*dt));busy=true}else pos=target;
  for(const f of flip){
   if(f.v===f.to)continue;
   const p=f.dur?clamp((t-f.t0)/f.dur,0,1):1;
   f.v=p<1?f.from+(f.to-f.from)*easeInOut(p):f.to;
   if(p<1)busy=true
  }
  render();
  raf=busy?requestAnimationFrame(frame):0
 }
 const kick=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}};

 function syncUi(){
  ticks.forEach((t,i)=>t.setAttribute('aria-current',i===cur?'true':'false'));
  cards.forEach((c,i)=>{c.querySelector('.tc__open').tabIndex=i===cur?0:-1});
  prevB.disabled=cur===0;nextB.disabled=cur===N-1;
  if(document.activeElement===prevB&&prevB.disabled)nextB.focus({preventScroll:true});
  if(document.activeElement===nextB&&nextB.disabled)prevB.focus({preventScroll:true});
  countEl.textContent=pad(cur+1)+' / '+pad(N);
  liveEl.textContent='Kartu '+(cur+1)+' dari '+N+': '+TEAM_CARDS[cur].role+', '+TEAM_CARDS[cur].name
 }

 function setFlip(i,to){
  const f=flip[i];if(f.to===to)return;
  f.from=f.v;f.to=to;f.t0=performance.now();f.dur=still()?0:Math.max(380,900*Math.abs(to-f.v));
  const c=cards[i];
  c.classList.toggle('is-flipped',!!to);
  c.querySelector('.tc__open').setAttribute('aria-expanded',to?'true':'false');
  c.querySelector('.tc__front').inert=!!to;
  c.querySelector('.tc__back').inert=!to;
  kick()
 }
 function toggleFlip(i){
  const to=flip[i].to?0:1;
  setFlip(i,to);
  const c=cards[i];
  c.querySelector(to?'.tc__flipback':'.tc__open').focus({preventScroll:true});
  liveEl.textContent=to?'Menampilkan '+TEAM_CARDS[i].unit+' '+TEAM_CARDS[i].backTitle:'Kembali ke foto '+TEAM_CARDS[i].role
 }
 function goTo(i,focusIt){
  i=clamp(i,0,N-1);
  if(i!==cur&&flip[cur].to)setFlip(cur,0);
  target=i;
  if(i!==cur){cur=i;syncUi()}
  if(focusIt)cards[cur].querySelector('.tc__open').focus({preventScroll:true});
  kick()
 }

 /* klik: kartu samping -> pindah ke tengah, kartu tengah -> flip */
 stage.addEventListener('click',e=>{
  if(suppress){suppress=false;e.preventDefault();e.stopPropagation();return}
  if(e.target.closest('.tc__flipback')){toggleFlip(cur);return}
  const open=e.target.closest('.tc__open');
  if(!open)return;
  const i=+open.closest('.tc').dataset.i;
  if(i!==cur)goTo(i);else toggleFlip(i)
 },true);

 /* drag / swipe */
 const STEP=()=>cw*.62;
 stage.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(e.target.closest('.tc__list'))return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,startPos:pos,moved:false,hist:[[performance.now(),e.clientX]]}
 });
 stage.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved){
   if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy))return;
   drag.moved=true;stage.setPointerCapture(e.pointerId);stage.classList.add('is-drag');
   if(flip[cur].to)setFlip(cur,0)
  }
  let t=drag.startPos-dx/STEP();
  if(t<0)t*=.35;else if(t>N-1)t=N-1+(t-(N-1))*.35;     // tahan di ujung, terasa "kenyal"
  target=t;
  const now=performance.now();drag.hist.push([now,e.clientX]);
  while(drag.hist.length>2&&now-drag.hist[0][0]>90)drag.hist.shift();
  const idx=clamp(Math.round(t),0,N-1);if(idx!==cur){cur=idx;syncUi()}
  kick()
 });
 const endDrag=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const d=drag;drag=null;stage.classList.remove('is-drag');
  if(!d.moved)return;
  suppress=true;setTimeout(()=>{suppress=false},60);
  const h=d.hist,a=h[0],b=h[h.length-1],v=b[0]>a[0]?(a[1]-b[1])/(b[0]-a[0])*1000/STEP():0;   // kartu/detik
  goTo(clamp(Math.round(target+clamp(v*.18,-2,2)),0,N-1))
 };
 stage.addEventListener('pointerup',endDrag);
 stage.addEventListener('pointercancel',endDrag);

 /* scroll horizontal (trackpad / shift+wheel) */
 stage.addEventListener('wheel',e=>{
  const dx=e.shiftKey?e.deltaY:e.deltaX;
  if(Math.abs(dx)<6||Math.abs(dx)<Math.abs(e.shiftKey?e.deltaX:e.deltaY))return;
  e.preventDefault();
  const now=performance.now();if(now-lastWheel<380)return;
  lastWheel=now;goTo(cur+(dx>0?1:-1))
 },{passive:false});

 /* keyboard */
 stage.addEventListener('keydown',e=>{
  const k=e.key;
  if(k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();goTo(cur+(k==='ArrowRight'?1:-1),true)}
  else if(k==='Home'){e.preventDefault();goTo(0,true)}
  else if(k==='End'){e.preventDefault();goTo(N-1,true)}
  else if(k==='Escape'&&flip[cur].to){e.preventDefault();toggleFlip(cur)}
 });
 prevB.addEventListener('click',()=>goTo(cur-1));
 nextB.addEventListener('click',()=>goTo(cur+1));
 ticksEl.addEventListener('click',e=>{const t=e.target.closest('.tcf__tick');if(t)goTo(+t.dataset.i)});

 const measure=()=>{const w=cards[0].offsetWidth;if(w)cw=w;render()};
 if('ResizeObserver' in window)new ResizeObserver(measure).observe(stage);else addEventListener('resize',measure);
 measure();syncUi();window.vhTeamGoTo=function(i){goTo(i);stage.scrollIntoView({behavior:'smooth',block:'center'})};

 /* satu momen pembuka: kartu menyebar dari tengah saat bagian ini terlihat */
 if(still()||!('IntersectionObserver' in window)){spread=1;render()}
 else{
  render();
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();spreadT0=performance.now();kick()}},{threshold:.3});
  io.observe(stage)
 }
})();

(function(){
 const host=document.getElementById('org-dyn');if(!host)return;
 const PERSON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
 const av=(n,f)=>{const src=TEAM_PHOTO_DATA[f+'/'+teamPhotoSlug(n)];return '<span class="avatar">'+(src?'<img data-src="'+src+'" alt="" decoding="async" loading="lazy">':PERSON)+'</span>'};
 const mg=TEAM_MANAGEMENT,ket=mg[0];
 const grp=k=>mg.filter(m=>m.position.indexOf(k)===0);
 const card=(title,list,cls)=>'<div class="node mgmt__c '+(cls||'')+'"><header><span class="tag">'+title+'</span></header><div class="slots">'+list.map(m=>'<div class="slot">'+av(m.name,'pengurus')+'<span>'+escapeHtml(m.name)+'</span></div>').join('')+'</div></div>';
 let h='<div class="mgmt">'+card('Sekretaris',grp('Sekretaris'))
  +'<div class="node mgmt__c mgmt__lead">'+av(ket.name,'pengurus')+'<h3>Ketua Tim</h3><small>'+escapeHtml(ket.name)+'</small></div>'
  +card('Bendahara',grp('Bendahara'))+'</div><div class="stem"></div><div class="rail"></div><div class="divisions">';
 TEAM_LEADERS.forEach((t,i)=>{
  const rows=[{n:t.leader,s:'Ketua Divisi'}].concat(t.members.map(n=>({n:n,s:''})));
  h+='<article class="node division" tabindex="0" role="button" data-go="'+(i+1)+'" aria-label="Divisi '+escapeHtml(t.division)+', '+rows.length+' orang. Tampilkan di carousel."><header><span class="tag">Divisi '+(i+1)+'</span><h3>'+escapeHtml(t.division)+'</h3></header><div class="slots">'
   +rows.map(r=>'<div class="slot">'+av(r.n,t.folder)+'<span>'+escapeHtml(r.n)+(r.s?'<em>'+r.s+'</em>':'')+'</span></div>').join('')+'</div></article>'
 });
 host.innerHTML=h+'</div>';
 const go=el=>{const d=el.closest('.division');if(d&&window.vhTeamGoTo)window.vhTeamGoTo(+d.dataset.go)};
 host.addEventListener('click',e=>go(e.target));
 host.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.division')){e.preventDefault();go(e.target)}});
})();

})();
