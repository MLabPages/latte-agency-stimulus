// 研究者向け設定。URLで変更できるのは condition のみ。
export const CONFIG = Object.freeze({
  version: '1.1.1', defaultCondition: 'passive',
  account: 'nagi_coffee', location: 'nagi coffee · ある日の午後',
  caption: 'ミルクとエスプレッソ、ひとつになる午後。',
  tags: '#アイスカフェラテ #カフェの時間',
  showInstructions: true, // false: 共通の実験説明側で指示する。救済メッセージは表示。
  interactiveInstruction: '指で円を描くように動かして、ラテを混ぜてください',
  passiveInstruction: 'ラテが混ざる様子を、そのままご覧ください',
  fallbackInstruction: '操作が難しい場合は、そのまま「次へ」に進めます。',
  initialHoldMs: 700, mixingDurationMs: 5500, requiredTurns: 4,
  minimumExposureMs: 6200, fallbackMs: 30000,
  // 入力座標はCanvasの論理座標400×500。柄も含む広めの開始範囲。
  inputCenter: { x: 200, y: 285 },
  inputBounds: { left: 80, right: 320, top: 100, bottom: 440 },
  inputMapping: 'angle-with-distance-fallback-v2',
  referenceRadius: 60, minimumLeverRadius: 12, distanceFallbackGain: 0.65,
  // 空文字なら遷移せず latte:next イベントを発行。連携側で処理できる。
  nextUrl: '',
  palette: { milk: [246, 239, 219], coffee: [66, 35, 22], latte: [181, 137, 94] },
});
