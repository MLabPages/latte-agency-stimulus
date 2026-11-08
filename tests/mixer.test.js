import test from 'node:test';
import assert from 'node:assert/strict';
import { angularStep, dragStep, mixProgress, passiveTravel, TAU } from '../mixer.js';
import { CONFIG } from '../config.js';
test('branch crossing preserves small signed angular motion',()=>{
  assert.ok(Math.abs(angularStep(Math.PI-.1,-Math.PI+.1,1)-.2)<1e-10);
  assert.ok(Math.abs(angularStep(-Math.PI+.1,Math.PI-.1,1)+.2)<1e-10);
});
test('click and stationary holds cannot mix',()=>{
  assert.equal(angularStep(null,1),0);
  const p={x:200,y:285};
  assert.equal(dragStep(p,p,CONFIG).delta,0);
});
test('both circular directions track the gesture without needing a preferred direction',()=>{
  for(const sign of [1,-1]) {
    let total=0, direction=1;
    const point=a=>({x:200+60*Math.cos(a),y:285+60*Math.sin(a)});
    for(let i=1;i<=120;i++){
      const step=dragStep(point(sign*(i-1)*TAU/120),point(sign*i*TAU/120),CONFIG,direction);
      total+=step.delta;direction=step.direction;
    }
    assert.ok(Math.abs(total-sign*TAU)<1e-10);
  }
});
test('near-center and radial drags respond without singularity or dead zones',()=>{
  const center={x:200,y:285};
  for(const p of [{x:201,y:285},{x:200,y:286},{x:210,y:285}]) {
    const step=dragStep(center,p,CONFIG);
    assert.ok(step.delta>0);assert.ok(Math.abs(step.delta)<=step.distance/CONFIG.minimumLeverRadius);
  }
  const crossing=dragStep({x:199.5,y:285},{x:200.5,y:285},CONFIG);
  assert.ok(crossing.delta>0&&crossing.delta<.1);
});
test('fast sparse events are retained rather than rejected',()=>{
  const step=dragStep({x:260,y:285},{x:200,y:345},CONFIG);
  assert.ok(Math.abs(step.delta-Math.PI/2)<1e-10);
});
test('radial fallback is proportional to distance rather than event count',()=>{
  const a={x:220,y:285},b={x:230,y:285},c={x:240,y:285};
  assert.ok(Math.abs(dragStep(a,c,CONFIG).delta-dragStep(a,b,CONFIG).delta-dragStep(b,c,CONFIG).delta)<1e-10);
  assert.equal(dragStep(a,c,CONFIG).usedFallback,true);
});
test('standard passive playback and four manual turns have equal endpoints',()=>{
  assert.equal(passiveTravel(0,CONFIG),0);
  assert.equal(passiveTravel(CONFIG.initialHoldMs,CONFIG),0);
  const end=passiveTravel(CONFIG.initialHoldMs+CONFIG.mixingDurationMs,CONFIG);
  assert.equal(end,TAU*CONFIG.requiredTurns);assert.equal(mixProgress(end,CONFIG.requiredTurns),1);
  assert.equal(mixProgress(TAU*2,CONFIG.requiredTurns),.5);
});
