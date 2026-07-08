var muted = false
var listeners: (() => void)[] = []

export function isMuted() { return muted }

export function setMuted(v: boolean) {
  muted = v
  localStorage.setItem('game:muted', v ? '1' : '0')
  listeners.forEach(function(fn) { fn() })
}

export function toggleMute() { setMuted(!muted) }

export function onMuteChange(fn: () => void) {
  listeners.push(fn)
  return function() { listeners = listeners.filter(function(f) { return f !== fn }) }
}

export function playTone(correct: boolean) {
  if (muted) return
  try {
    var ctx = new AudioContext()
    var osc = ctx.createOscillator()
    var gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.value = 0.15
    if (correct) {
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24)
      osc.start()
      osc.stop(ctx.currentTime + 0.36)
    } else {
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.15)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch {}
}

; (function() {
  var v = localStorage.getItem('game:muted')
  if (v === '1') muted = true
})()
