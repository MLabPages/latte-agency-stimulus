export const TAU = Math.PI * 2;
export function angularStep(previous, current) {
  if (previous === null) return 0;
  const delta = Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
  return delta;
}
// Preserve circular motion; support imperfect circles and radial drags without dead zones.
// Movement, never elapsed time, drives both rotation and mixing. Near-center angle
// singularities are limited by actual distance, rather than dropping an entire event.
export function dragStep(previous, current, config, previousDirection = 1) {
  const dx = current.x - previous.x, dy = current.y - previous.y;
  const distance = Math.hypot(dx, dy);
  if (!distance) return { delta: 0, direction: previousDirection, distance: 0, angularDistance: 0, usedFallback: false };
  const a = { x: previous.x - config.inputCenter.x, y: previous.y - config.inputCenter.y };
  const b = { x: current.x - config.inputCenter.x, y: current.y - config.inputCenter.y };
  const raw = angularStep(Math.atan2(a.y, a.x), Math.atan2(b.y, b.x));
  const angularDistance = Math.min(Math.abs(raw), distance / config.minimumLeverRadius);
  const fallback = distance / config.referenceRadius * config.distanceFallbackGain;
  const reliableDirection = Math.min(Math.hypot(a.x,a.y),Math.hypot(b.x,b.y)) >= config.minimumLeverRadius;
  const direction = reliableDirection && Math.abs(raw) > fallback * 0.15 ? Math.sign(raw) : previousDirection;
  return { delta: direction * Math.max(angularDistance, fallback), direction, distance,
    angularDistance, usedFallback: fallback > angularDistance };
}
export function mixProgress(travel, requiredTurns) {
  return Math.min(1, Math.max(0, travel / (TAU * requiredTurns)));
}
export function passiveTravel(elapsed, config) {
  return Math.min(1, Math.max(0, (elapsed - config.initialHoldMs) / config.mixingDurationMs)) * TAU * config.requiredTurns;
}
