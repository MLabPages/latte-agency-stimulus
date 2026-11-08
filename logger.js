// 保存・外部送信はここに追加。初版はメモリ内のみ。座標列・個人情報は保存しない。
export function createExperimentLog(condition, config) {
  const data = {
    schemaVersion: 2, stimulusVersion: config.version, condition,
    settings: structuredClone(config),
    stimulusStartAt: null, stimulusEndAt: null, stimulusDurationMs: null,
    operationStartAt: null, operationEndAt: null, operationDurationMs: 0,
    operationSpanMs: null, pointerDistancePx: 0, pointerDistanceScene: 0,
    approximateTurns: 0, acceptedAngularTravel: 0, pointerAngularTravel: 0,
    distanceFallbackSteps: 0, mixedAt: null,
    timeToMixMs: null, operationTimeToMixMs: null,
    completed: false, fallbackUsed: false, exitReason: null,
    hiddenDurationMs: 0, visibilityChanges: 0, interrupted: false,
    pointerType: null, pointerSessions: 0, invalidAngularSteps: 0,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
  const snapshot = () => structuredClone(data);
  const emit = (type) => {
    const detail = { type, log: snapshot() };
    console.log('[latte-experiment]', detail);
    window.dispatchEvent(new CustomEvent('latte:log', { detail }));
  };
  return { data, snapshot, emit };
}
