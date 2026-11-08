import { CONFIG } from './config.js';
import { TAU, dragStep, mixProgress, passiveTravel } from './mixer.js';
import { createRenderer } from './renderer.js';
import { createExperimentLog } from './logger.js';

const requested = new URLSearchParams(location.search).get('condition');
const condition = requested ?? CONFIG.defaultCondition;
if (!['passive', 'noncontingent', 'interactive'].includes(condition)) {
  document.body.textContent = '条件が不正です。condition に passive、noncontingent、interactive のいずれかを指定してください。';
  throw new Error('Invalid experiment condition');
}
document.body.classList.add(condition);
const inputEnabled=condition!=='passive', automaticPlayback=condition!=='interactive';
if(inputEnabled)document.body.classList.add('operable');
for (const [id, value] of Object.entries({account:CONFIG.account,location:CONFIG.location,'caption-account':CONFIG.account,caption:CONFIG.caption,tags:CONFIG.tags})) document.getElementById(id).textContent=value;
const canvas=document.getElementById('latte'), next=document.getElementById('next'), instruction=document.getElementById('instruction');
instruction.textContent=inputEnabled?CONFIG.operationInstruction:CONFIG.passiveInstruction;
instruction.hidden=!CONFIG.showInstructions;
const logger=createExperimentLog(condition,CONFIG), log=logger.data, renderer=createRenderer(canvas);
// Public adapter: use getLog() for a snapshot; listen to latte:log or latte:next.
window.latteExperiment=Object.freeze({ getLog:logger.snapshot, config:CONFIG });
let start=null, hiddenAt=null, hiddenTotal=0, angle=0, travel=0, pointer=null, lastPoint=null, direction=1, segmentStart=null;
let inputTravel=0;
let startedAt=0, ready=false, exited=false;
const now=()=>performance.now();
const iso=()=>new Date().toISOString();
const elapsed=(t=now())=>start===null?0:t-start-hiddenTotal-(hiddenAt===null?0:t-hiddenAt);
function finishPointer(t=now()) {
  if(pointer===null)return;
  log.operationDurationMs+=t-segmentStart;
  log.operationEndAt=iso(); log.operationSpanMs=t-startedAt;
  const id=pointer;pointer=null;lastPoint=null;
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
  if(reason==='timeout') { log.fallbackUsed=true;instruction.hidden=false;instruction.textContent=CONFIG.fallbackInstruction; }
  stopStimulus(reason,t);next.hidden=false;
}
function frame(t) {
  if(start===null && !document.hidden){start=t;log.stimulusStartAt=iso();logger.emit('stimulus-start');}
  if(start!==null && !document.hidden && !ready && !exited) {
    const duration=elapsed(t);
    if(automaticPlayback) {
      travel=passiveTravel(duration,CONFIG);angle=travel;
      if(mixProgress(travel,CONFIG.requiredTurns)>=1)complete(t);
    }
    if(log.completed && duration>=CONFIG.minimumExposureMs) offerNext('completed',t);
    else if(condition==='interactive' && duration>=CONFIG.fallbackMs)offerNext('timeout',t);
  }
  renderer.draw(mixProgress(travel,CONFIG.requiredTurns),angle);
  if(!exited)requestAnimationFrame(frame);
}
function point(e,rect=canvas.getBoundingClientRect()){return{x:(e.clientX-rect.left)*400/rect.width,y:(e.clientY-rect.top)*500/rect.height,cx:e.clientX,cy:e.clientY};}
canvas.addEventListener('pointerdown',e=>{
  if(!inputEnabled||start===null||ready||log.completed||pointer!==null||!e.isPrimary||e.button!==0)return;
  const p=point(e);
  const bounds=CONFIG.inputBounds;
  if(p.x<bounds.left||p.x>bounds.right||p.y<bounds.top||p.y>bounds.bottom)return;
  e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);lastPoint=p;
  segmentStart=now();log.pointerSessions++;log.pointerType=e.pointerType;
  if(log.operationStartAt===null){log.operationStartAt=iso();startedAt=segmentStart;logger.emit('operation-start');}
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==pointer)return;
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const samples=Array.from(e.getCoalescedEvents?.() ?? []);
  const tail=samples.at(-1);
  if(!tail||tail.clientX!==e.clientX||tail.clientY!==e.clientY)samples.push(e);
  for(const sample of samples) {
    const p=point(sample,rect), step=dragStep(lastPoint,p,CONFIG,direction);
    log.pointerDistancePx+=Math.hypot(p.cx-lastPoint.cx,p.cy-lastPoint.cy);
    log.pointerDistanceScene+=step.distance;lastPoint=p;direction=step.direction;
    inputTravel+=Math.abs(step.delta);
    log.pointerAngularTravel+=step.angularDistance;
    if(step.usedFallback)log.distanceFallbackSteps++;
    log.acceptedAngularTravel=inputTravel;log.approximateTurns=inputTravel/TAU;
    if(!log.operationCompleted&&mixProgress(inputTravel,CONFIG.requiredTurns)>=1){
      log.operationCompleted=true;log.operationCompletedAt=iso();
      log.operationTimeToCriterionMs=now()-startedAt;logger.emit('operation-complete');
    }
    // Noncontingent input is measured, but never changes playback state or timing.
    if(!automaticPlayback){
      angle+=step.delta;travel=inputTravel;
      if(mixProgress(travel,CONFIG.requiredTurns)>=1){complete(now());break;}
    }
  }
  // The next animation frame draws the latest input once, without inertia or a timer-driven tail.
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
