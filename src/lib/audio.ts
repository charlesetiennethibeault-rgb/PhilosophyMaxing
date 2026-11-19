// Tic de roue généré avec Web Audio : aucun fichier audio à charger.
let ctx: AudioContext | null = null

export function tick(volume = 0.06) {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1400, t)
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.03)
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.05)
  } catch { /* audio indisponible */ }
}
