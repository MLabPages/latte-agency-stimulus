import { CONFIG } from './config.js';
import { TAU, angularStep, mixProgress, passiveTravel } from './mixer.js';
import { createRenderer } from './renderer.js';
import { createExperimentLog } from './logger.js';

const requested = new URLSearchParams(location.search).get('condition');
const condition = requested ?? CONFIG.defaultCondition;
if (!['passive', 'interactive'].includes(condition)) {
  document.body.textContent = '条件が不正です。?condition=passive または ?condition=interactive を指定してください。';
  throw new Error('Invalid experiment condition');
}
document.body.classList.add(condition);
for (const [id, value] of Object.entries({account:CONFIG.account,location:CONFIG.location,'caption-account':CONFIG.account,caption:CONFIG.caption,tags:CONFIG.tags})) document.getElementById(id).textContent=value;
const canvas=document.getElementById('latte'), next=document.getElementById('next'), instruction=document.getElementById('instruction');
instruction.textContent=condition==='interactive'?CONFIG.interactiveInstruction:CONFIG.passiveInstruction;
const logger=createExperimentLog(condition,CONFIG), log=logger.data, renderer=createRenderer(canvas);
// Public adapter: use getLog() for a snapshot; listen to latte:log or latte:next.
window.latteExperiment=Object.freeze({ getLog:logger.snapshot, config:CONFIG });
let start=null, hiddenAt=null, hiddenTotal=0, angle=0, travel=0, pointer=null, lastPoint=null, lastAngle=null, segmentStart=null;
let startedAt=0, ready=false, exited=false;
const now=()=>performance.now();
const iso=()=>new Date().toISOString();
const elapsed=(t=now())=>start===null?0:t-start-hiddenTotal-(hiddenAt===null?0:t-hiddenAt);
function finishPointer(t=now()) {
  if(pointer===null)return;
  log.operationDurationMs+=t-segmentStart;
  log.operationEndAt=iso(); log.operationSpanMs=t-startedAt;
  const id=pointer;pointer=null;lastAngle=null;lastPoint=null;
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
}
function complete(t) {
  if(log.completed)return;
  log.completed=true;log.mixedAt=iso();log.timeToMixMs=elapsed(t);
  // All trials end with the spoon in the same resting pose, even after reversals.
  angle=TAU*CONFIG.requiredTurns;
  log.operationTimeToMixMs=log.operationStartAt===null?null:t-startedAt;
  finishPointer(t);
  canvas.setAttribute('aria-label','均一に混ざったアイスカフェラテ');
  logger.emit('mixed');
}
function stopStimulus(reason,t=now()) {
  if(log.stimulusEndAt!==null)return;
  finishPointer(t);log.stimulusEndAt=iso();log.stimulusDurationMs=elapsed(t);log.exitReason=reason;logger.emit('stimulus-end');
}
function offerNext(reason,t) {
  ready=true;
  if(reason==='timeout') { log.fallbackUsed=true;instruction.textContent=CONFIG.fallbackInstruction; }
  stopStimulus(reason,t);next.hidden=false;
}
function frame(t) {
  if(start===null && !document.hidden){start=t;log.stimulusStartAt=iso();logger.emit('stimulus-start');}
  if(start!==null && !document.hidden && !ready && !exited) {
    const duration=elapsed(t);
    if(condition==='passive') {
      travel=passiveTravel(duration,CONFIG);angle=travel;
      if(mixProgress(travel,CONFIG.requiredTurns)>=1)complete(t);
    }
    if(log.completed && duration>=CONFIG.minimumExposureMs) offerNext('completed',t);
    else if(condition==='interactive' && duration>=CONFIG.fallbackMs)offerNext('timeout',t);
  }
  renderer.draw(mixProgress(travel,CONFIG.requiredTurns),angle);
  if(!exited)requestAnimationFrame(frame);
}
function point(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*400/rect.width,y:(e.clientY-rect.top)*500/rect.height,cx:e.clientX,cy:e.clientY};}
function polar(p){const x=p.x-CONFIG.inputCenter.x,y=p.y-CONFIG.inputCenter.y;return{angle:Math.atan2(y,x),valid:Math.hypot(x,y)>=CONFIG.minRadius&&Math.hypot(x,y)<=CONFIG.maxRadius};}
canvas.addEventListener('pointerdown',e=>{
  if(condition!=='interactive'||start===null||ready||log.completed||pointer!==null||!e.isPrimary||e.button!==0)return;
  const p=point(e);
  if(p.x<100||p.x>300||p.y<150||p.y>424)return;
  e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);lastPoint=p;
  const a=polar(p);lastAngle=a.valid?a.angle:null;
  segmentStart=now();log.pointerSessions++;log.pointerType=e.pointerType;
  if(log.operationStartAt===null){log.operationStartAt=iso();startedAt=segmentStart;logger.emit('operation-start');}
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==pointer)return;
  e.preventDefault();const p=point(e);
  log.pointerDistancePx+=Math.hypot(p.cx-lastPoint.cx,p.cy-lastPoint.cy);
  log.pointerDistanceScene+=Math.hypot(p.x-lastPoint.x,p.y-lastPoint.y);lastPoint=p;
  const a=polar(p);
  const delta=a.valid?angularStep(lastAngle,a.angle,CONFIG.maxStepRadians):0;
  if(a.valid&&lastAngle!==null&&delta===0&&a.angle!==lastAngle)log.invalidAngularSteps++;
  lastAngle=a.valid?a.angle:null;
  angle+=delta;travel+=Math.abs(delta);
  log.acceptedAngularTravel=travel;log.approximateTurns=travel/TAU;
  // Immediate redraw keeps the spoon coupled to each pointer event, without auto interpolation.
  const progress=mixProgress(travel,CONFIG.requiredTurns);
  if(progress>=1)complete(now());
  renderer.draw(progress,angle);
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===pointer)finishPointer();});
document.addEventListener('visibilitychange',()=>{
  const t=now();log.visibilityChanges++;
  if(document.hidden){finishPointer(t);hiddenAt=t;log.interrupted=true;}
  else if(hiddenAt!==null){hiddenTotal+=t-hiddenAt;hiddenAt=null;log.hiddenDurationMs=hiddenTotal;}
});
window.addEventListener('pagehide',()=>{exited=true;if(!ready)stopStimulus('pagehide');logger.emit('pagehide');});
next.addEventListener('click',()=>{
  if(!ready||exited)return;
  exited=true;next.disabled=true;logger.emit('next');
  window.dispatchEvent(new CustomEvent('latte:next',{detail:logger.snapshot()}));
  if(CONFIG.nextUrl)location.assign(CONFIG.nextUrl);
  else document.getElementById('status').textContent='閲覧が完了しました。';
});
requestAnimationFrame(frame);
