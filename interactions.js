'use strict';
(() => {
 const finePointer=window.matchMedia?.('(hover: hover) and (pointer: fine)');
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const photos=new Set();
 document.querySelectorAll('.hero-vehicle').forEach(figure=>photos.add(figure.querySelector('.image-open')));
 document.querySelectorAll('.photo-gallery').forEach(gallery=>gallery.querySelectorAll('.image-open').forEach(button=>photos.add(button)));
 const resetters=[];
 photos.forEach(button=>{
  if(!button)return;
  button.classList.toggle('photo-hover',true);
  let pending=0,point=null;
  function reset(){
   if(pending)cancelAnimationFrame(pending);
   pending=0;point=null;
   button.style.setProperty('--tilt-x','0deg');
   button.style.setProperty('--tilt-y','0deg');
   button.style.setProperty('--hover-x','50%');
   button.style.setProperty('--hover-y','50%');
  }
  function draw(){
   pending=0;if(!point||!finePointer?.matches||reducedMotion?.matches)return;
   const rect=button.getBoundingClientRect();if(!rect.width||!rect.height)return;
   const x=Math.max(0,Math.min(rect.width,point.x-rect.left));
   const y=Math.max(0,Math.min(rect.height,point.y-rect.top));
   button.style.setProperty('--tilt-x',`${((.5-y/rect.height)*3).toFixed(2)}deg`);
   button.style.setProperty('--tilt-y',`${((x/rect.width-.5)*3).toFixed(2)}deg`);
   button.style.setProperty('--hover-x',`${Math.max(51,Math.min(rect.width-51,x)).toFixed(1)}px`);
   button.style.setProperty('--hover-y',`${Math.max(25,Math.min(rect.height-25,y)).toFixed(1)}px`);
  }
  button.addEventListener('pointermove',event=>{
   if(event.pointerType!=='mouse'||!finePointer?.matches||reducedMotion?.matches)return;
   point={x:event.clientX,y:event.clientY};
   if(!pending)pending=requestAnimationFrame(draw);
  });
  button.addEventListener('pointerleave',reset);
  button.addEventListener('pointercancel',reset);
  resetters.push(reset);
 });
 const resetAll=()=>resetters.forEach(reset=>reset());
 reducedMotion?.addEventListener?.('change',resetAll);
 finePointer?.addEventListener?.('change',resetAll);
 window.addEventListener('blur',resetAll);
})();
