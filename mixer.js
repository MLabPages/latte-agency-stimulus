export const TAU = Math.PI * 2;
export function angularStep(previous, current, maxStep) {
  if (previous === null) return 0;
  const delta = Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
  return Math.abs(delta) <= maxStep ? delta : 0;
}
export function mixProgress(travel, requiredTurns) {
  return Math.min(1, Math.max(0, travel / (TAU * requiredTurns)));
}
export function passiveTravel(elapsed, config) {
  return Math.min(1, Math.max(0, (elapsed - config.initialHoldMs) / config.mixingDurationMs)) * TAU * config.requiredTurns;
}
