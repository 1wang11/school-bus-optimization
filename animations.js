'use strict';
(() => {
 const el = id => document.getElementById(id);
 // Pixel coordinates are traced from the supplied campus route diagram, not GPS coordinates.
 const station = {
  B:{name:'燕宏桥东站',point:[1182,714]}, L:{name:'图书馆站',point:[986,676]},
  M:{name:'材料学院站',point:[470,728]}, E:{name:'电气学院站',point:[313,584]},
  A:{name:'艺术学院站',point:[255,379]}, I:{name:'信息学院站',point:[365,149]},
  G:{name:'经管学院站',point:[427,363]}, H:{name:'酒店站',point:[1357,889]}
 };
 const roads = {
  BL:[[1182,714],[1145,699],[1098,678],[1045,655],[1002,638],[992,662],[986,676]],
  LM:[[986,676],[976,701],[963,730],[956,746],[942,761],[920,765],[850,765],[780,765],[708,765],[610,765],[548,765],[547,756],[543,742],[530,734],[514,733],[502,737],[495,747],[470,728]],
  ME:[[470,728],[439,710],[409,687],[380,663],[350,635],[330,609],[313,584]],
  EA:[[313,584],[299,557],[284,531],[273,504],[264,470],[253,430],[247,407],[255,379]],
  AI:[[255,379],[241,340],[221,301],[213,277],[216,248],[231,209],[275,201],[321,188],[348,166],[365,149]],
  IG:[[365,149],[391,124],[415,108],[438,103],[469,107],[490,120],[498,143],[492,166],[477,196],[463,216],[452,266],[440,318],[427,363]],
  GE:[[427,363],[432,390],[430,415],[427,438],[385,454],[340,472],[299,486],[273,498],[277,521],[290,551],[313,584]],
  HB:[[1357,889],[1338,869],[1328,850],[1318,823],[1296,809],[1267,797],[1234,780],[1208,745],[1182,714]]
 };
 const reverse = points => points.slice().reverse().map(p => p.slice());
 const join = (...parts) => parts.flatMap((points,index) => index ? points.slice(1) : points).map(p => p.slice());
 const EL = join(reverse(roads.ME), reverse(roads.LM));
 const routeSpecs = {
  green:{color:'#2c9b72',stopIds:['B','L','M','E','L','B'],points:[roads.BL,roads.LM,roads.ME,EL,reverse(roads.BL)],speed:190,dwell:450},
  blue:{color:'#338bd5',stopIds:['H','B','L','E','A','I','G','E','L','B','H'],points:[roads.HB,roads.BL,join(roads.LM,roads.ME),roads.EA,roads.AI,roads.IG,roads.GE,EL,reverse(roads.BL),reverse(roads.HB)],speed:190,dwell:450}
 };
 const beforeSpec = {color:'#dca14b',speed:70,dwell:400,reverse:[false,true,false],points:[
  [[166,332],[172,286],[188,246],[225,225],[255,211],[269,184],[257,147],[232,121],[194,112],[163,125],[148,152],[149,172]],
  [[149,172],[160,186],[187,195],[213,194],[239,191],[264,190],[290,190]],
  [[290,190],[260,205],[236,231],[220,266],[212,300],[209,338]]
 ]};
 const afterSpec = {color:'#2c9b72',speed:70,dwell:400,reverse:[true,true,false],points:[
  [[166,332],[165,290],[164,246],[164,205],[164,160],[164,117]],
  [[164,117],[171,142],[187,164],[214,181],[242,191],[273,194],[300,194]],
  [[300,194],[276,201],[250,218],[231,243],[219,273],[212,307],[209,338]]
 ]};

 // Sample a smooth curve through every source waypoint. The same samples drive
 // both the displayed stroke and the vehicle, avoiding differences between them.
 function curve(points, steps = 12) {
  if (points.length < 2) return points.map(p => p.slice());
  const result = [];
  for (let i=0;i<points.length-1;i++) {
   const a=points[Math.max(0,i-1)], b=points[i], c=points[i+1], d=points[Math.min(points.length-1,i+2)];
   for (let j=0;j<=steps;j++) {
    if (i && j===0) continue;
    const t=j/steps, t2=t*t, t3=t2*t;
    result.push([0,1].map(k => .5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));
   }
  }
  return result;
 }
 function geometry(points) {
  const sampled=curve(points), lengths=[0];
  for(let i=1;i<sampled.length;i++) lengths.push(lengths[i-1]+Math.hypot(sampled[i][0]-sampled[i-1][0],sampled[i][1]-sampled[i-1][1]));
  return {points:sampled,lengths,length:lengths[lengths.length-1]||0};
 }
 function pathD(points) {return points.map((p,i) => `${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');}
 function atDistance(g,distance) {
  const target=Math.max(0,Math.min(g.length,distance));
  let lo=0,hi=g.lengths.length-1;
  while(lo+1<hi){const middle=(lo+hi)>>1;if(g.lengths[middle]<target)lo=middle;else hi=middle;}
  const a=g.points[lo],b=g.points[hi],denominator=g.lengths[hi]-g.lengths[lo],t=denominator?(target-g.lengths[lo])/denominator:0;
  return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI};
 }
 function compile(spec) {
  let duration=0,totalLength=0;
  const legs=spec.points.map((points,index) => {
   const g=geometry(points),start=duration,startDistance=totalLength,drive=g.length/spec.speed*1000;
   duration+=drive+spec.dwell; totalLength+=g.length;
   return {g,index,start,drive,driveEnd:start+drive,end:duration,startDistance,reverse:!!spec.reverse?.[index]};
  });
  return {spec,legs,duration,totalLength,path:legs.map(leg=>pathD(leg.g.points)).join(' ')};
 }
 function atTime(timeline,time) {
  const t=Math.max(0,Math.min(timeline.duration,time));
  const leg=timeline.legs.find(part=>t<part.end)||timeline.legs[timeline.legs.length-1];
  const fraction=Math.max(0,Math.min(1,(t-leg.start)/leg.drive));
  const pose=atDistance(leg.g,fraction*leg.g.length);
  if(leg.reverse)pose.angle+=180;
  return { ...pose,time:t,progress:t/timeline.duration,distance:leg.startDistance+leg.g.length*fraction,leg:leg.index,arrived:fraction>=1,finished:t>=timeline.duration };
 }
 window.ShuttleMotion = {station,roads,routeSpecs,beforeSpec,afterSpec,curve,geometry,compile,atTime,pathD};

 // Campus basemap. All three road paths derive from the same
 // source traces as the overlaid routes.
 const roadGeometry=[join(roads.BL,roads.LM,roads.ME),join(roads.EA,roads.AI,roads.IG,roads.GE),roads.HB];
 el('campus-road-network').innerHTML=roadGeometry.map(points=>{
  const d=pathD(curve(points));
  return `<path d="${d}" fill="none" stroke="#c9d5d2" stroke-width="29" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#d4ded9" stroke-width="1.3" stroke-dasharray="12 13"/>`;
 }).join('');

 // Labels share the source diagram's coordinate system. Their text remains at
 // least 11 screen pixels when the map is opened on a narrow display.
 const labelPositions={
  B:[1207,679,'start'],L:[951,634,'end'],M:[445,780,'end'],
  E:[305,548,'end'],A:[41,330,'start'],I:[365,96,'middle'],
  G:[465,357,'start'],H:[1350,844,'end']
 };
 let labelLayout='';
 function renderStopLabels(spec) {
  const width=el('campus-map').clientWidth||1100;
  const fontSize=Math.max(24,1565/width*11);
  const layout=spec.stopIds.join(',')+':'+fontSize.toFixed(1);
  if(layout===labelLayout)return;
  labelLayout=layout;
  el('route-stop-labels').innerHTML=[...new Set(spec.stopIds)].map(id=>{
   const [x,y,anchor]=labelPositions[id];
   return `<text data-stop-label="${id}" data-route-stop="${id}" aria-hidden="true" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fontSize.toFixed(1)}" font-family="Noto Sans CJK SC, Microsoft YaHei, sans-serif" font-weight="600" fill="#2c403d" stroke="#f5f7f5" stroke-width="${(fontSize*.26).toFixed(1)}" stroke-linejoin="round" paint-order="stroke">${station[id].name}</text>`;
  }).join('');
 }

 function animator({svg,bus,trail,play,replay,seek,count,accessible,scene,onUpdate,isRoute=false}) {
  let timeline=compile(scene),time=0,playing=false,request=0,lastStamp=null,lastAnnouncement='';
  function updateControl() {
   play.setAttribute('aria-pressed',String(playing));
   play.setAttribute('aria-label',playing?'暂停动画':'播放动画');
   play.innerHTML=`<span data-icon="${playing?'pause':'play'}" aria-hidden="true"></span><span>${playing?'暂停':'播放'}</span>`;
   window.renderIcons?.(play);
  }
  function render() {
   const state=atTime(timeline,time);
   const width=svg.clientWidth||(isRoute?1100:400),scale=isRoute?Math.max(.9,Math.min(3.5,1300/width)):460/width*.63;
   bus.setAttribute('transform',`translate(${state.x.toFixed(2)} ${state.y.toFixed(2)}) rotate(${state.angle.toFixed(2)}) scale(${scale.toFixed(3)})`);
   bus.setAttribute('fill',timeline.spec.color);
   trail.setAttribute('stroke',timeline.spec.color);
   trail.setAttribute('stroke-dasharray',`${timeline.totalLength} ${timeline.totalLength}`);
   trail.setAttribute('stroke-dashoffset',String(Math.max(0,timeline.totalLength-state.distance)));
   seek.value=String(Math.round(state.progress*1000));
   seek.setAttribute('aria-valuetext',`${Math.round(state.progress*100)}%`);
   seek.style.setProperty?.('--animation-progress',`${state.progress*100}%`);
   const total=isRoute?timeline.spec.stopIds.length:timeline.legs.length;
   const current=isRoute?Math.min(total,state.leg+1+(state.arrived?1:0)):Math.min(total,state.leg+1);
   count.textContent=`${current} / ${total}`;
   if(accessible){
    const stopId=timeline.spec.stopIds[current-1];
    const message=state.finished?'线路演示完成':`当前站点：${station[stopId]?.name||''}`;
    if(message!==lastAnnouncement){accessible.textContent=message;lastAnnouncement=message;}
   }
   onUpdate?.(state,timeline);
   return state;
  }
  function pause() {
   playing=false;lastStamp=null;
   if(request)cancelAnimationFrame(request);
   request=0;updateControl();
  }
  function tick(stamp) {
   if(!playing)return;
   if(svg.closest('.chapter')?.hidden){pause();return;}
   if(lastStamp!==null)time=Math.min(timeline.duration,time+Math.min(90,Math.max(0,stamp-lastStamp)));
   lastStamp=stamp;
   const state=render();
   if(state.finished){pause();return;}
   request=requestAnimationFrame(tick);
  }
  function start() {
   if(playing)return;
   if(time>=timeline.duration)time=0;
   playing=true;lastStamp=null;updateControl();
   request=requestAnimationFrame(tick);
  }
  function reset(auto=false) {pause();time=0;render();if(auto)start();}
  function setScene(spec,auto=false) {
   pause();timeline=compile(spec);time=0;lastAnnouncement='';
   trail.setAttribute('d',timeline.path);render();if(auto)start();
  }
  function seekToStop(id,auto=true) {
   const index=timeline.spec.stopIds?.indexOf(id)??-1;
   if(index<0)return false;
   pause();time=index<timeline.legs.length?timeline.legs[index].start:timeline.duration;
   render();if(auto)start();return true;
  }
  play.addEventListener('click',()=>{if(playing)pause();else start();});
  replay.addEventListener('click',()=>reset(true));
  seek.addEventListener('input',()=>{pause();time=Math.max(0,Math.min(1000,Number(seek.value)))/1000*timeline.duration;render();});
  window.addEventListener('resize',()=>render());
  trail.setAttribute('d',timeline.path);updateControl();render();
  return {pause,start,reset,setScene,render,seekToStop,state:()=>({...atTime(timeline,time),playing,stops:timeline.spec.stopIds?.slice()||null})};
 }
 const route = animator({svg:el('campus-map'),bus:el('route-vehicle'),trail:el('route-trail'),play:el('route-play'),replay:el('route-replay'),seek:el('route-seek'),count:el('route-count'),accessible:el('route-accessible-status'),scene:routeSpecs.green,isRoute:true,
  onUpdate(state,timeline){
   renderStopLabels(timeline.spec);
   const dotScale=Math.max(.9,Math.min(3.5,1300/(el('campus-map').clientWidth||1100)));
   const activeId=timeline.spec.stopIds[Math.min(timeline.spec.stopIds.length-1,state.leg+(state.arrived?1:0))];
   el('route-stop-dots').querySelectorAll('[data-stop-id]').forEach(dot=>{
    const active=dot.dataset.stopId===activeId;
    dot.setAttribute('r',String((active?11:7)*dotScale));
    dot.setAttribute('stroke',timeline.spec.color);
    dot.setAttribute('fill',active?timeline.spec.color:'#fff');
    dot.closest('[data-route-stop]')?.setAttribute('aria-current',active?'step':'false');
   });
   el('route-stop-dots').querySelectorAll('[data-stop-halo]').forEach(dot=>dot.setAttribute('r',String(18*dotScale)));
   el('route-stop-dots').querySelectorAll('[data-stop-hit]').forEach(dot=>dot.setAttribute('r',String(28*dotScale)));
  }
 });
 let activeRouteKey='green';
 const map=el('campus-map'),mapHost=map.closest('.campus-map-wrap'),tooltip=el('route-station-tooltip');
 function hideStationInfo() {
  tooltip.hidden=true;
  map.querySelectorAll('[data-route-stop]').forEach(node=>node.classList.toggle('is-station-hovered',false));
 }
 function showStationInfo(target) {
  const id=target.dataset.routeStop,spec=routeSpecs[activeRouteKey];
  if(!spec.stopIds.includes(id))return;
  const positions=spec.stopIds.flatMap((stop,i)=>stop===id?[i+1]:[]);
  el('route-tooltip-name').textContent=station[id].name;
  el('route-tooltip-order').textContent=`${activeRouteKey==='green'?'绿车':'蓝车'} · 第${positions.join('、')}站`;
  tooltip.hidden=false;
  const host=mapHost.getBoundingClientRect(),bounds=target.getBoundingClientRect();
  const width=tooltip.offsetWidth||210,height=tooltip.offsetHeight||92;
  const left=Math.max(width/2+10,Math.min(host.width-width/2-10,bounds.left+bounds.width/2-host.left));
  const below=bounds.top-host.top<height+22;
  tooltip.style.left=`${left}px`;
  tooltip.style.top=`${below?bounds.bottom-host.top+12:bounds.top-host.top-12}px`;
  tooltip.classList.toggle('tooltip-below',below);
  map.querySelectorAll('[data-route-stop]').forEach(node=>node.classList.toggle('is-station-hovered',node.dataset.routeStop===id));
 }
 function stationTarget(event) {return event.target.closest('[data-route-stop]');}
 map.addEventListener('pointerover',event=>{
  const target=stationTarget(event);if(target&&event.pointerType!=='touch')showStationInfo(target);
 });
 map.addEventListener('pointerout',event=>{
  const target=stationTarget(event),next=event.relatedTarget?.closest?.('[data-route-stop]');
  if(target&&target.dataset.routeStop!==next?.dataset.routeStop)hideStationInfo();
 });
 map.addEventListener('focusin',event=>{const target=stationTarget(event);if(target)showStationInfo(target);});
 map.addEventListener('focusout',()=>hideStationInfo());
 map.addEventListener('click',event=>{const target=stationTarget(event);if(target){hideStationInfo();route.seekToStop(target.dataset.routeStop);}});
 map.addEventListener('keydown',event=>{
  if(event.key==='Escape'){hideStationInfo();return;}
  const target=stationTarget(event);
  if(target&&['Enter',' '].includes(event.key)){event.preventDefault();hideStationInfo();route.seekToStop(target.dataset.routeStop);}
 });
 window.addEventListener('resize',hideStationInfo);
 for(const id of ['route-guide','route-trail','route-vehicle'])el(id).setAttribute('pointer-events','none');
 function selectRoute(key,auto=false) {
  const spec=routeSpecs[key];if(!spec)return;
  hideStationInfo();activeRouteKey=key;
  document.querySelectorAll('[data-bus-route]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.busRoute===key)));
  el('route-simulator').setAttribute('data-active-route',key);
  const unique=[...new Set(spec.stopIds)];
  el('route-stop-dots').innerHTML=unique.map(id=>{
   const [x,y]=station[id].point,positions=spec.stopIds.flatMap((stop,i)=>stop===id?[i+1]:[]);
   return `<g data-route-stop="${id}" class="route-stop-target" role="button" tabindex="0" aria-label="${station[id].name}，${key==='green'?'绿车':'蓝车'}第${positions.join('、')}站，点击从此站播放"><circle data-stop-hit="${id}" cx="${x}" cy="${y}" r="28" fill="transparent" pointer-events="all"/><circle data-stop-halo="${id}" class="stop-halo" cx="${x}" cy="${y}" r="18" fill="none" stroke="${spec.color}" stroke-width="3"/><circle data-stop-id="${id}" cx="${x}" cy="${y}" r="7" fill="#fff" stroke="${spec.color}" stroke-width="3"/></g>`;
  }).join('');
  const compiled=compile(spec);
  el('route-guide').setAttribute('d',compiled.path);el('route-guide').setAttribute('stroke',spec.color);
  el('route-current-swatch').className=`route-swatch ${key}`;
  route.setScene(spec,auto);
 }
 document.querySelectorAll('[data-bus-route]').forEach(button=>button.addEventListener('click',()=>selectRoute(button.dataset.busRoute,true)));
 selectRoute('green');
 const controllers={route};
 for(const [prefix,scene]of [['turn-before',beforeSpec],['turn-after',afterSpec]]){
  const compiled=compile(scene);
  el(prefix+'-paths').innerHTML=compiled.legs.map((leg,i)=>`<path d="${pathD(leg.g.points)}" fill="none" stroke="${scene.color}" stroke-width="4" opacity=".22" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  controllers[prefix]=animator({svg:el(prefix+'-svg'),bus:el(prefix+'-vehicle'),trail:el(prefix+'-trail'),play:el(prefix+'-play'),replay:el(prefix+'-replay'),seek:el(prefix+'-seek'),count:el(prefix+'-count'),scene});
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)Object.values(controllers).forEach(controller=>controller.pause());});
 window.ShuttleAnimations={controllers,selectRoute,refresh:()=>{if(el('solutions').hidden)hideStationInfo();Object.values(controllers).forEach(controller=>controller.render());}};
})();
