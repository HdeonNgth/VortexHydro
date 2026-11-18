/* Dashboard kaca: tab tampilan, label tombol, urutan animasi */
(function(){
  var page=document.getElementById("dashboard");if(!page)return;
  var dash=page.querySelector(".dash"),top=dash&&dash.querySelector(".dash__top"),ctl=top&&top.querySelector(".dash__ctl");
  if(!top||!ctl)return;
  var tabs=[["all","Ringkasan"],["energi","Energi"],["sensor","Sensor"],["grafik","Grafik"],["riwayat","Riwayat"]];
  var bar=document.createElement("div");bar.className="dtabbar";bar.setAttribute("role","group");bar.setAttribute("aria-label","Tampilan dashboard");
  tabs.forEach(function(t,i){
    var b=document.createElement("button");b.type="button";b.dataset.v=t[0];b.textContent=t[1];b.setAttribute("aria-pressed",i===0?"true":"false");bar.appendChild(b)
  });
  top.insertBefore(bar,ctl);dash.dataset.view="all";
  function replay(){page.classList.remove("vx-enter");void page.offsetWidth;page.classList.add("vx-enter")}
  bar.addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;
    Array.prototype.forEach.call(bar.children,function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});
    dash.dataset.view=b.dataset.v;replay()
  });
  Array.prototype.forEach.call(dash.querySelectorAll(".dc"),function(c,i){c.style.setProperty("--i",i)});
  ["dpause","dsrcb"].forEach(function(id){
    var b=document.getElementById(id);if(!b)return;
    function sync(){var t=b.textContent.trim();if(!t)return;b.title=t;b.setAttribute("aria-label",t);b.dataset.s=t.toLowerCase()}
    sync();new MutationObserver(sync).observe(b,{childList:true,characterData:true,subtree:true})
  });
})();
