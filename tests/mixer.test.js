import test from 'node:test';
import assert from 'node:assert/strict';
import { angularStep, mixProgress, passiveTravel, TAU } from '../mixer.js';
import { CONFIG } from '../config.js';
test('branch crossing preserves small signed angular motion',()=>{
  assert.ok(Math.abs(angularStep(Math.PI-.1,-Math.PI+.1,1)-.2)<1e-10);
  assert.ok(Math.abs(angularStep(-Math.PI+.1,Math.PI-.1,1)+.2)<1e-10);
});
test('click and implausible jumps cannot mix',()=>{
  assert.equal(angularStep(null,1,1),0);assert.equal(angularStep(0,2,1),0);
});
test('standard passive playback and four manual turns have equal endpoints',()=>{
  assert.equal(passiveTravel(0,CONFIG),0);
  assert.equal(passiveTravel(CONFIG.initialHoldMs,CONFIG),0);
  const end=passiveTravel(CONFIG.initialHoldMs+CONFIG.mixingDurationMs,CONFIG);
  assert.equal(end,TAU*CONFIG.requiredTurns);assert.equal(mixProgress(end,CONFIG.requiredTurns),1);
  assert.equal(mixProgress(TAU*2,CONFIG.requiredTurns),.5);
});
