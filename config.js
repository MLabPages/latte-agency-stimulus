// 研究者向け設定。URLで変更できるのは condition のみ。
export const CONFIG = Object.freeze({
  version: '1.0.0', defaultCondition: 'passive',
  account: 'nagi_coffee', location: 'nagi coffee · ある日の午後',
  caption: 'ミルクとエスプレッソ、ひとつになる午後。',
  tags: '#アイスカフェラテ #カフェの時間',
  interactiveInstruction: '指で円を描くように動かして、ラテを混ぜてください',
  passiveInstruction: 'ラテが混ざる様子を、そのままご覧ください',
  fallbackInstruction: '操作が難しい場合は、そのまま「次へ」に進めます。',
  initialHoldMs: 700, mixingDurationMs: 5500, requiredTurns: 4,
  minimumExposureMs: 6200, fallbackMs: 30000,
  // 入力座標はCanvasの論理座標400×500。中心付近や大きな跳躍は混合量に加算しない。
  inputCenter: { x: 200, y: 285 }, minRadius: 22, maxRadius: 145,
  maxStepRadians: Math.PI / 3,
  // 空文字なら遷移せず latte:next イベントを発行。連携側で処理できる。
  nextUrl: '',
  palette: { milk: [246, 239, 219], coffee: [66, 35, 22], latte: [181, 137, 94] },
});
