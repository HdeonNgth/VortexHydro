
(function(){
 var v=document.getElementById('kmView'),t=document.getElementById('kmTrack'),pv=document.getElementById('kmPrev'),nx=document.getElementById('kmNext');
 if(!v||!t)return;
 var n=t.children.length,i=0,x0=null;
 function vis(){var c=t.children[0].offsetWidth,w=v.clientWidth;return c?Math.max(1,Math.round((w+22)/(c+22))):3}
 function upd(){var max=Math.max(0,n-vis());if(i>max)i=max;var c=t.children[0].offsetWidth+22;t.style.transform='translateX('+(-i*c)+'px)';pv.disabled=i<=0;nx.disabled=i>=max;
  Array.prototype.forEach.call(t.children,function(k,j){var on=j>=i&&j<i+vis();k.setAttribute('aria-hidden',on?'false':'true')})}
 pv.addEventListener('click',function(){i=Math.max(0,i-1);upd()});
 nx.addEventListener('click',function(){i++;upd()});
 v.addEventListener('scroll',function(){v.scrollLeft=0});
 v.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
 v.addEventListener('touchend',function(e){if(x0===null)return;var d=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(d)>50){i=Math.max(0,i+(d<0?1:-1));upd()}});
 t.addEventListener('focusin',function(e){var k=e.target.closest('.kc');if(!k)return;var j=Array.prototype.indexOf.call(t.children,k),m=vis();if(j<i)i=j;else if(j>=i+m)i=j-m+1;upd()});
 if('ResizeObserver' in window)new ResizeObserver(upd).observe(v);else addEventListener('resize',upd);
 upd();
})();
