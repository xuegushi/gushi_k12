import { useEffect, useState } from 'react'

var COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
var SHAPES = ['●', '■', '▲', '★', '♦']

interface Particle {
  id: number
  x: number
  color: string
  shape: string
  delay: number
  duration: number
  rotate: number
}

export default function Celebration({ show, onDone }: { show: boolean; onDone?: () => void }) {
  var [particles, setParticles] = useState<Particle[]>([])

  useEffect(function() {
    if (!show) { setParticles([]); return }
    var next: Particle[] = []
    for (var i = 0; i < 40; i++) {
      next.push({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        delay: Math.random() * 0.6,
        duration: 1.5 + Math.random() * 1.5,
        rotate: Math.random() * 360,
      })
    }
    setParticles(next)
    var timer = setTimeout(function() { onDone?.() }, 3000)
    return function() { clearTimeout(timer) }
  }, [show])

  if (!show || particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map(function(p) {
        return (
          <span key={p.id}
            className="absolute text-lg"
            style={{
              left: p.x + '%',
              top: '-5%',
              color: p.color,
              animation: 'confetti-fall ' + p.duration + 's ease-in ' + p.delay + 's forwards',
              transform: 'rotate(' + p.rotate + 'deg)',
            }}>
            {p.shape}
          </span>
        )
      })}
    </div>
  )
}
