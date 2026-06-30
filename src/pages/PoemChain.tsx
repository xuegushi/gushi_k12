import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../lib/db'
import { ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react'
import RecordsModal from '../components/RecordsModal'

var CATEGORIES = [
  { name: '自然气象', chars: '花月风云雨雪山水天江海烟雾露霜星霞雷溪湖川' },
  { name: '四季时节', chars: '春夏秋冬夜日朝暮晓夕晨旦暝曙腊寒暑阴晴' },
  { name: '色彩', chars: '红绿白黄青碧翠紫金银朱苍黛素玄丹粉彩皓' },
  { name: '花草植物', chars: '梅兰竹菊柳桃荷松莲桂杏枫杨槐桑芷榴' },
  { name: '飞鸟动物', chars: '鸟雁马燕鱼蝉鹤蝶莺猿犬鸡鸦龙凤鹊鸥鹭蚕' },
  { name: '情感心境', chars: '愁恨思爱醉梦泪孤悲欢忧怨乐惊叹伤喜闲静空' },
  { name: '方位数字', chars: '东南西北上下千万半点百前后左右中远近深高低' },
  { name: '动作行为', chars: '归行来去望看飞落闻问送饮眠登渡别歌舞吟笑坐' },
]

export default function PoemChain() {
  var poems = useStore(function(s) { return s.poems })
  var [themeChar, setThemeChar] = useState('')
  var [themeCat, setThemeCat] = useState('')
  var [matched, setMatched] = useState<string[]>([])
  var [input, setInput] = useState('')
  var [hint, setHint] = useState('')
  var [score, setScore] = useState(0)
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)

  function initGame() {
    if (score > 0) {
      db.gameRecords.add({ game: '飞花令', poemTitle: themeChar, poemAuthor: themeCat, elapsed: elapsed, success: true, createdAt: new Date() })
    }
    var cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    var c = cat.chars[Math.floor(Math.random() * cat.chars.length)]
    setThemeChar(c)
    setThemeCat(cat.name)
    setMatched([])
    setInput('')
    setHint('')
    setScore(0)
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (poems.length > 0) initGame() }, [poems.length])
  useEffect(function() {
    if (startTime === 0) return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [startTime])

  function submitLine() {
    var line = input.trim()
    if (!line || !themeChar) return
    if (matched.includes(line)) { setHint('这句已经说过了！'); return }

    var inLibrary = false
    for (var i = 0; i < poems.length; i++) {
      for (var j = 0; j < poems[i].content.length; j++) {
        if (poems[i].content[j] === line) { inLibrary = true; break }
      }
      if (inLibrary) break
    }

    if (!line.includes(themeChar)) { setHint('这句诗不包含「' + themeChar + '」字'); return }

    if (!inLibrary) { setHint('诗库未收录，请自行判断是否正确') }

    setMatched(function(prev) { return [line, ...prev] })
    setScore(function(p) { return p + 1 })
    setInput('')
    setTimeout(function() { setHint('') }, inLibrary ? 0 : 2000)
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { window.history.back() }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">飞花令</span>
        <div className="flex-1" />
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        {/* Theme */}
        <div className="text-center mb-4">
          <h2 className="text-sm text-muted-foreground mb-1">说出包含以下字的诗句</h2>
          {themeChar && (
            <div>
              <span className="text-xs text-muted-foreground/60">分类：{themeCat}</span>
              <div className="text-5xl font-bold text-primary font-poem my-3" style={{ textShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                {themeChar}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">已答：<span className="text-primary font-semibold">{score}</span> 句 {startTime > 0 && <span>· ⏱ {elapsed}秒</span>}</p>
        </div>

        <div className="flex gap-2 mb-4">
          <input value={input} onChange={function(e) { setInput(e.target.value) }}
            onKeyDown={function(e) { if (e.key === 'Enter') submitLine() }}
            placeholder="输入包含该字的诗句..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <button onClick={submitLine} disabled={!input.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-colors cursor-pointer">
            提交
          </button>
        </div>

        {hint && <div className={'text-xs text-center mb-3 ' + (hint.includes('已经') || hint.includes('未收录') ? 'text-amber-500' : 'text-red-500')}>{hint}</div>}

        {/* Matched list */}
        <div className="rounded-xl border bg-card p-4 min-h-[120px]">
          {matched.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">还没有诗句被说出...</p>}
          <div className="space-y-1.5">
            {matched.map(function(line, i) {
              var parts = line.split(themeChar)
              return (
                <div key={i} className="text-sm leading-7 font-poem tracking-wide">
                  {parts.map(function(p, pi) {
                    return <span key={pi}>{p}{pi < parts.length - 1 ? <span className="text-primary font-bold text-base">{themeChar}</span> : ''}</span>
                  })}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-center mt-4">
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 再来一次
          </button>
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 换一个字
          </button>
        </div>
        <div className="flex justify-center mt-3">
          <button onClick={function() { setShowRecords(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">
            🏆 记录
          </button>
        </div>

        {themeChar && <p className="text-center text-xs text-muted-foreground mt-4">💡 输入的完整诗句必须有某个字包含「{themeChar}」</p>}
      </div>
      <RecordsModal game="飞花令" open={showRecords} onClose={function() { setShowRecords(false) }} />
    </div>
  )
}
