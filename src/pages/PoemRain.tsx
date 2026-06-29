import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { ArrowLeft, Maximize, Minimize } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PoemRain() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var [fs, setFs] = useState(false)
  var containerRef = useRef<HTMLDivElement>(null)

  var toggleFs = async function() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setFs(true)
    } else {
      await document.exitFullscreen()
      setFs(false)
    }
  }

  useEffect(function() {
    var handler = function() { setFs(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', handler)
    return function() { document.removeEventListener('fullscreenchange', handler) }
  }, [])

  return (
    <div ref={containerRef} className={'page-enter ' + (fs ? 'fixed inset-0 z-50 bg-black p-0' : '')}>
      {!fs && (
          <div className="flex items-center gap-2 mb-4">
            <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> 返回
            </button>
            <span className="text-sm font-bold text-foreground/70">诗词雨</span>
            <div className="flex-1" />
          </div>
      )}
      <RainCanvas poems={poems} fs={fs} onToggleFs={toggleFs} />
    </div>
  )
}

// ==================== Canvas 实现 ====================

interface Poem {
  title: string
  author: string
  dynasty: string
  content: string[]
}

/* 预选适合展示的诗（长度适中） */
function selectPoems(all: Poem[]): Poem[] {
  var filtered = all.filter(function(p) { return p.content.length >= 2 && p.content.length <= 8 && p.content.join('').length <= 40 })
  if (filtered.length === 0) return all.slice(0, 50)
  // 打乱
  for (var i = filtered.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]]
  }
  return filtered.slice(0, 200)
}

function RainCanvas({ poems, fs, onToggleFs }: { poems: Poem[]; fs: boolean; onToggleFs: () => void }) {
  var canvasRef = useRef<HTMLCanvasElement>(null)
  var [hoveredPoem, setHoveredPoem] = useState<Poem | null>(null)
  var [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(function() {
    var pool = selectPoems(poems)
    if (pool.length === 0) return

    var canvas = canvasRef.current
    if (!canvas) return
    var ctx = canvas.getContext('2d')
    if (!ctx) return

    var W = 0, H = 0, DPR = 1, COLS = 0
    var CHAR_H = 26
    var animId = 0

    // 颜色 LUT
    var COLOR_STEPS = 64
    var colorLUT = new Array(COLOR_STEPS)
    var dimLUT = new Array(COLOR_STEPS)
    ;(function() {
      var stops = [
        [0.00, [236, 255, 243], 1.00],
        [0.07, [130, 255, 178], 1.00],
        [0.22, [50,  236, 110], 0.98],
        [0.45, [26,  176, 72],  0.85],
        [0.68, [14,  110, 46],  0.58],
        [0.85, [7,   56,  24],  0.28],
        [1.00, [2,   24,  10],  0.00],
      ]
      for (var i = 0; i < COLOR_STEPS; i++) {
        var t = i / (COLOR_STEPS - 1)
        var r = 0, g = 0, b = 0, a = 0
        for (var k = 0; k < stops.length - 1; k++) {
          var A = stops[k], B = stops[k + 1]
          if (t <= B[0]) {
            var f = (t - A[0]) / (B[0] - A[0] || 1)
            r = A[1][0] + (B[1][0] - A[1][0]) * f
            g = A[1][1] + (B[1][1] - A[1][1]) * f
            b = A[1][2] + (B[1][2] - A[1][2]) * f
            a = A[2] + (B[2] - A[2]) * f
            break
          }
        }
        colorLUT[i] = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a.toFixed(3) + ')'
        dimLUT[i] = a < 0.05
      }
    })()

    // 列数据
    var columns: any[] = []

    function makeCol(i: number, prevIdx: number) {
      var pi: number
      do { pi = (Math.random() * pool.length) | 0 }
      while (pi === prevIdx && pool.length > 1)
      var poem = pool[pi]
      var text = poem.content.join('')
      return {
        x: i * CHAR_H + CHAR_H / 2,
        poemIdx: pi,
        poem: poem,
        text: text,
        n: text.length,
        headY: 0,
        speed: 0.5 + Math.random() * 1.4,
        glow: Math.random() * Math.PI * 2,
      }
    }

    function setup() {
      COLS = Math.ceil(W / CHAR_H) + 1
      columns = new Array(COLS)
      for (var i = 0; i < COLS; i++) {
        var c = makeCol(i, -1)
        c.headY = (Math.random() * H * 1.5) | 0
        columns[i] = c
      }
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      var parent = canvas.parentElement
      if (!parent) return
      var rect = parent.getBoundingClientRect()
      canvasLeft = rect.left
      W = parent.clientWidth
      H = parent.clientHeight
      canvas.width = Math.floor(W * DPR)
      canvas.height = Math.floor(H * DPR)
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx!.font = (CHAR_H - 4) + 'px "STKaiti","KaiTi","FangSong","Noto Serif SC",serif'
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      setup()
    }

    // 鼠标
    var mouseX = -9999, mouseY = -9999, mouseInside = false
    var canvasLeft = 0
    var activeCol = -1

    function onMove(e: MouseEvent | Touch) {
      mouseX = e.clientX; mouseY = e.clientY; mouseInside = true
    }
    function onLeave() { mouseInside = false; activeCol = -1; setHoveredPoem(null) }

    canvas.addEventListener('mousemove', onMove as any)
    canvas.addEventListener('mouseleave', onLeave)
    window.addEventListener('touchmove', function(e: TouchEvent) { if (e.touches.length) onMove(e.touches[0]) }, { passive: true })
    window.addEventListener('touchstart', function(e: TouchEvent) { if (e.touches.length) onMove(e.touches[0]) }, { passive: true })
    window.addEventListener('touchend', function() { mouseInside = false; activeCol = -1; setHoveredPoem(null) })
    window.addEventListener('resize', resize)

    resize()

    // 主循环
    function frame() {
      if (document.hidden) { animId = requestAnimationFrame(frame); return }

      ctx!.fillStyle = '#000'
      ctx!.fillRect(0, 0, W, H)

      activeCol = -1
      if (mouseInside && mouseX >= 0 && mouseX < W) {
        activeCol = Math.min(COLS - 1, Math.max(0, Math.floor((mouseX - canvasLeft) / CHAR_H)))
      }

      ctx!.font = (CHAR_H - 4) + 'px "KaiTi","STKaiti","FangSong","Noto Serif SC",serif'
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'

      for (var i = 0; i < COLS; i++) {
        var col = columns[i]
        var isActive = i === activeCol

        if (isActive) {
          // 暂停下落，保持正常颜色，仅稍亮头部
          col.glow += 0.08
          var text = col.text, n = col.n, x = col.x
          var nMinus1 = n - 1

          for (var j = 0; j < n; j++) {
            var y = col.headY - (nMinus1 - j) * CHAR_H
            if (y < -CHAR_H) continue
            if (y > H + CHAR_H) break
            var dist = nMinus1 - j
            var ti = ((dist / nMinus1) * (COLOR_STEPS - 1)) | 0
            var ci = Math.min(ti, COLOR_STEPS - 1)
            if (dimLUT[ci]) continue

            if (dist === 0) {
              var pulse = 8 + Math.sin(col.glow) * 3 + 3
              ctx!.shadowColor = 'rgba(140,255,170,0.9)'
              ctx!.shadowBlur = pulse
              ctx!.fillStyle = colorLUT[0]
            } else {
              ctx!.shadowBlur = 0
              ctx!.fillStyle = colorLUT[ci]
            }
            ctx!.fillText(text.charAt(j), x, y)
          }
          ctx!.shadowBlur = 0

          // 更新浮窗
          if (hoveredPoem !== col.poem) { setHoveredPoem(col.poem); setMousePos({ x: mouseX, y: mouseY }) }
          continue
        }

        col.headY += col.speed
        col.glow += 0.08
        var text = col.text, n = col.n, x = col.x
        var nMinus1 = n - 1

        for (var j = 0; j < n; j++) {
          var y = col.headY - (nMinus1 - j) * CHAR_H
          if (y < -CHAR_H) continue
          if (y > H + CHAR_H) break
          var dist = nMinus1 - j
          var ti = ((dist / nMinus1) * (COLOR_STEPS - 1)) | 0
          var ci = Math.min(ti, COLOR_STEPS - 1)
          if (dimLUT[ci]) continue

          if (dist === 0) {
            var pulse = 8 + Math.sin(col.glow) * 3 + 3
            ctx!.shadowColor = 'rgba(140,255,170,0.9)'
            ctx!.shadowBlur = pulse
            ctx!.fillStyle = colorLUT[0]
          } else {
            ctx!.shadowBlur = 0
            ctx!.fillStyle = colorLUT[ci]
          }
          ctx!.fillText(text.charAt(j), x, y)
        }
        ctx!.shadowBlur = 0

        var topY = col.headY - nMinus1 * CHAR_H
        if (topY > H + CHAR_H) {
          var nc = makeCol(i, col.poemIdx)
          nc.headY = -((Math.random() * 5 + 1) | 0) * CHAR_H
          columns[i] = nc
        }
      }

      if (activeCol < 0 && hoveredPoem) setHoveredPoem(null)
      animId = requestAnimationFrame(frame)
    }

    animId = requestAnimationFrame(frame)

    return function() {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove as any)
      canvas.removeEventListener('mouseleave', onLeave as any)
      window.removeEventListener('resize', resize)
    }
  }, [poems])

  return (
    <div className="relative" style={{ height: fs ? '100vh' : 'calc(100vh - 120px)' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-xl" />

      {/* 标题水印 */}
      <div className="absolute top-4 left-5 pointer-events-none z-10">
        <h1 className="text-2xl font-poem tracking-[8px] text-[#6cff9e]" style={{ textShadow: '0 0 10px rgba(0,255,110,0.45)' }}>诗词雨</h1>
        <p className="text-xs text-[#2f7a4a] tracking-[3px] mt-1">POEM · RAIN</p>
      </div>

      <button onClick={onToggleFs}
        className="absolute top-2 right-2 z-30 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-lg p-1.5 transition-colors">
        {fs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>

      {/* 提示 */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
        <p className="text-xs text-[#2c6b42] tracking-[4px] font-poem" style={{ animation: 'blink 2.6s ease-in-out infinite' }}>
          将鼠标移至任意一列 · 驻足，听一首千年前的诗
        </p>
      </div>

      {/* 信息浮窗 */}
      {hoveredPoem && <PoemPopup poem={hoveredPoem} mousePos={mousePos} canvasRef={canvasRef} />}

      <style>{`
        @keyframes blink { 0%,100% { opacity:.32 } 50% { opacity:.85 } }
      `}</style>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function PoemPopup({ poem, mousePos, canvasRef }: { poem: Poem; mousePos: { x: number; y: number }; canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  var rect = canvasRef.current?.getBoundingClientRect()
  var style: any = { left: 0, top: 0 }
  if (rect) {
    var left = Math.min(mousePos.x + 24, rect.right - 240)
    var top = Math.max(rect.top + 8, Math.min(mousePos.y - 60, rect.bottom - 160))
    if (left < rect.left) { left = mousePos.x - 240 }
    if (left < rect.left) { left = rect.left + 4 }
    style = { left: left, top: top }
  }
  return (
    <div className="fixed z-20 pointer-events-none" style={style}>
      <div className="rounded-xl px-5 py-4 min-w-[180px]" style={{
        background: 'linear-gradient(160deg, rgba(0,32,14,0.93), rgba(0,10,4,0.93))',
        border: '1px solid rgba(0,255,120,0.35)',
        boxShadow: '0 0 28px rgba(0,255,100,0.22)',
        backdropFilter: 'blur(3px)',
      }}>
        <div className="text-lg text-[#ecfff1] tracking-[5px] font-poem" style={{ textShadow: '0 0 12px rgba(0,255,120,0.6)' }}>
          {poem.title}
        </div>
        <div className="text-xs text-[#6cff9e] mt-1.5 tracking-[2px]">
          {poem.author} <span className="text-[#3da06a]">· {poem.dynasty}</span>
        </div>
        <div className="h-px my-2" style={{ background: 'linear-gradient(to right, transparent, rgba(0,255,120,0.4), transparent)' }} />
        <div className="text-sm leading-7 text-[#9ff7bc] font-poem" style={{ textShadow: '0 0 6px rgba(0,255,100,0.35)' }}>
          {poem.content.map(function(line, i) { return <div key={i}>{line}</div> })}
        </div>
      </div>
    </div>
  )
}
