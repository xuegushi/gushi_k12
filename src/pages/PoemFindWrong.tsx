import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../lib/db'
import { ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react'
import RecordsModal from '../components/RecordsModal'

var CONFUSABLE: Record<string, string[]> = {
  '人': ['入', '八'],
  '入': ['人', '八'],
  '八': ['人', '入', '几'],
  '几': ['几', '儿'],
  '儿': ['几', '儿'],
  '大': ['太', '天', '夫', '犬'],
  '太': ['大', '天', '夫'],
  '天': ['大', '太', '夫', '无'],
  '夫': ['大', '太', '天', '失'],
  '犬': ['大', '太', '天', '尤'],
  '土': ['士', '干', '上'],
  '士': ['土', '干', '上'],
  '干': ['土', '士', '千', '于'],
  '千': ['干', '于', '午'],
  '于': ['干', '千', '午'],
  '午': ['牛', '千', '年'],
  '牛': ['午', '年'],
  '年': ['牛', '午'],
  '日': ['曰', '白', '田', '目', '旧'],
  '曰': ['日', '白', '田'],
  '白': ['日', '曰', '百', '自'],
  '百': ['白', '自'],
  '自': ['白', '百', '目'],
  '目': ['日', '自', '且'],
  '田': ['日', '由', '甲', '申', '电'],
  '由': ['田', '甲', '申', '电'],
  '甲': ['田', '由', '申', '电'],
  '申': ['田', '由', '甲', '电'],
  '电': ['田', '由', '甲', '申'],
  '旦': ['早', '旦'],
  '早': ['旦', '旱'],
  '末': ['未', '未'],
  '未': ['末', '未'],
  '己': ['已', '巳', '乙'],
  '已': ['己', '巳', '乙'],
  '巳': ['己', '已', '乙'],
  '乙': ['己', '已', '巳'],
  '刀': ['力', '刃', '刁'],
  '力': ['刀', '刃'],
  '刃': ['刀', '力'],
  '刁': ['刀', '习'],
  '习': ['刁', '刃'],
  '开': ['井', '并', '升'],
  '井': ['开', '并', '升'],
  '升': ['开', '井', '并'],
  '并': ['开', '井', '升'],
  '万': ['方', '刀', '力'],
  '方': ['万', '芳', '放'],
  '问': ['间', '闻'],
  '间': ['问', '闻'],
  '闻': ['问', '间'],
  '外': ['处', '夕'],
  '石': ['右', '后', '古'],
  '右': ['石', '后', '古'],
  '后': ['石', '右', '厚'],
  '古': ['石', '右', '占'],
  '厂': ['广', '丁'],
  '广': ['厂', '丁'],
  '丁': ['厂', '广', '亍'],
  '王': ['玉', '主', '丰', '生'],
  '玉': ['王', '主', '全'],
  '主': ['王', '玉', '住'],
  '丰': ['王', '生', '半'],
  '生': ['王', '丰', '牛', '全'],
  '全': ['王', '玉', '金', '令'],
  '金': ['全', '令'],
  '令': ['全', '金', '今'],
  '今': ['令', '金'],
  '鸟': ['乌', '鸣', '岛'],
  '乌': ['鸟', '鸣', '岛'],
  '鸣': ['鸟', '乌'],
  '岛': ['鸟', '乌'],
  '晴': ['睛', '清', '情', '请'],
  '睛': ['晴', '清', '情', '请'],
  '清': ['晴', '睛', '情', '请'],
  '情': ['晴', '睛', '清', '请'],
  '请': ['晴', '睛', '清', '情'],
  '折': ['拆', '析'],
  '拆': ['折', '析'],
  '析': ['折', '拆'],
  '冠': ['寇', '冤'],
  '寇': ['冠', '冤'],
  '冤': ['冠', '寇'],
  '徒': ['徙', '陡', '涉'],
  '徙': ['徒', '陡', '涉'],
  '茶': ['荼', '荣'],
  '荼': ['茶', '荣'],
  '蓝': ['篮', '兰'],
  '篮': ['蓝', '兰'],
  '兰': ['蓝', '篮'],
  '特': ['持', '待', '侍'],
  '持': ['特', '待', '侍'],
  '待': ['特', '持', '侍'],
  '侍': ['特', '持', '待'],
  '免': ['兔', '龟'],
  '兔': ['免', '龟'],
  '龟': ['兔', '免'],
  '栗': ['粟'],
  '粟': ['栗'],
  '戌': ['戊', '戍', '戎'],
  '戍': ['戊', '戌', '戎'],
  '戊': ['戌', '戍', '戎'],
  '戎': ['戌', '戍', '戊'],
  '冷': ['今', '令'],
  '风': ['凤', '凡'],
  '凤': ['风', '凡'],
  '凡': ['风', '凤'],
  '处': ['外', '夕', '各'],
  '冬': ['各', '东'],
  '各': ['冬', '东'],
  '东': ['冬', '各', '乐'],
  '乐': ['东', '来'],
  '来': ['乐', '夹', '未'],
  '夹': ['来', '夹', '夫'],
  '采': ['彩', '菜'],
  '彩': ['采', '菜'],
  '菜': ['采', '彩'],
  '近': ['进', '过'],
  '进': ['近', '过'],
  '过': ['近', '进'],
  '送': ['迎', '近'],
  '迎': ['送', '近'],
  '远': ['运', '达'],
  '运': ['远', '达'],
  '达': ['远', '运'],
  '银': ['银', '很', '根', '跟', '艰'],
  '很': ['银', '根', '跟', '狠', '艰'],
  '根': ['银', '很', '跟', '狠', '艰'],
  '跟': ['银', '很', '根', '狠', '艰'],
  '狠': ['很', '根', '跟', '艰'],
  '艰': ['很', '根', '跟', '银'],
  '睁': ['挣', '争', '静', '净'],
  '挣': ['睁', '争', '静', '净'],
  '争': ['睁', '挣', '静', '净'],
  '静': ['睁', '挣', '争', '净'],
  '净': ['睁', '挣', '争', '静'],
  '拔': ['拨', '泼'],
  '拨': ['拔', '泼'],
  '泼': ['拔', '拨'],
  '幻': ['幼', '豪'],
  '幼': ['幻', '豪'],
  '豪': ['毫'],
  '毫': ['豪', '豪'],
  '羞': ['差', '着'],
  '差': ['羞', '着'],
  '梁': ['梁', '粱'],
  '粱': ['梁', '梁'],
  '瞬': ['顺', '舜'],
  '顺': ['瞬', '舜'],
  '琴': ['瑟', '琵'],
  '瑟': ['琴', '琵'],
  '琵': ['琴', '瑟', '琶'],
  '琶': ['琵'],
}

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }

interface WrongChar {
  lineIdx: number
  charIdx: number
  original: string
  wrong: string
}

function findWrongChars(poem: any, count: number): WrongChar[] {
  var allPositions: { lineIdx: number; charIdx: number; char: string }[] = []
  for (var li = 0; li < poem.content.length; li++) {
    var line = poem.content[li]
    for (var ci = 0; ci < line.length; ci++) {
      if (/[\u4e00-\u9fff]/.test(line[ci])) {
        allPositions.push({ lineIdx: li, charIdx: ci, char: line[ci] })
      }
    }
  }

  var candidates: { pos: typeof allPositions[0]; replacement: string }[] = []
  for (var pos of allPositions) {
    var confusables = CONFUSABLE[pos.char]
    if (confusables && confusables.length > 0) {
      var replacement = confusables[Math.floor(Math.random() * confusables.length)]
      if (replacement && replacement !== pos.char) {
        candidates.push({ pos, replacement })
      }
    }
  }

  var selected = shuffle(candidates).slice(0, Math.min(count, candidates.length))
  return selected.map(function(s) {
    return { lineIdx: s.pos.lineIdx, charIdx: s.pos.charIdx, original: s.pos.char, wrong: s.replacement }
  })
}

export default function PoemFindWrong() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var [poem, setPoem] = useState<any>(null)
  var [displayLines, setDisplayLines] = useState<string[]>([])
  var [wrongChars, setWrongChars] = useState<WrongChar[]>([])
  var [selected, setSelected] = useState<Set<string>>(new Set())
  var [result, setResult] = useState<'idle' | 'checked'>('idle')
  var [score, setScore] = useState(0)
  var [totalWrong, setTotalWrong] = useState(0)
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)

  async function initGame() {
    var filtered = poems.filter(function(p) {
      if (p.type !== '诗' && p.type !== '词') return false
      if (p.content.length < 2) return false
      var count = 0
      for (var i = 0; i < p.content.length; i++) {
        for (var j = 0; j < p.content[i].length; j++) {
          if (/[\u4e00-\u9fff]/.test(p.content[i][j])) count++
        }
      }
      return count >= 10 && count <= 50
    })
    if (filtered.length === 0) return

    var p = filtered[Math.floor(Math.random() * filtered.length)]
    setPoem(p)

    var chars = findWrongChars(p, 6)

    if (chars.length === 0) { initGame(); return }

    var wrongCount = Math.min(3 + Math.floor(Math.random() * 3), chars.length)
    chars = shuffle(chars).slice(0, wrongCount)

    setWrongChars(chars)
    setTotalWrong(chars.length)

    // Build display with wrong chars substituted
    var lines = p.content.map(function(line: string) { return line.split('') })
    for (var wc of chars) {
      if (lines[wc.lineIdx] && lines[wc.lineIdx][wc.charIdx]) {
        lines[wc.lineIdx][wc.charIdx] = wc.wrong
      }
    }
    setDisplayLines(lines.map(function(l) { return l.join('') }))

    setSelected(new Set())
    setResult('idle')
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (poems.length > 0) initGame() }, [poems.length])

  useEffect(function() {
    if (result === 'checked' || startTime === 0) return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [result, startTime])

  function toggleChar(lineIdx: number, charIdx: number) {
    if (result === 'checked') return
    var key = lineIdx + '-' + charIdx
    setSelected(function(prev) {
      var next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function checkAnswer() {
    var correctFinds = 0
    var falsePositives = 0
    for (var key of selected) {
      var parts = key.split('-')
      var li = parseInt(parts[0]), ci = parseInt(parts[1])
      var isWrong = wrongChars.some(function(w) { return w.lineIdx === li && w.charIdx === ci })
      if (isWrong) correctFinds++
      else falsePositives++
    }
    var missed = totalWrong - correctFinds
    var roundScore = Math.max(0, correctFinds * 10 - falsePositives * 5 - missed * 10)
    setScore(function(prev) { return prev + roundScore })
    setResult('checked')
    if (poem) db.gameRecords.add({ game: '找茬', poemTitle: poem.title, poemAuthor: poem.author, elapsed: elapsed, success: missed === 0 && falsePositives === 0, createdAt: new Date() })
  }

  function nextRound() { initGame() }

  function isWrongPos(lineIdx: number, charIdx: number) {
    return wrongChars.some(function(w) { return w.lineIdx === lineIdx && w.charIdx === charIdx })
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">诗词找茬</span>
        <div className="flex-1" />
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        {poem && (
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold text-primary">{poem.title}</h2>
            <p className="text-sm text-muted-foreground">{poem.author} · {poem.dynasty}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-3">
          <span>得分：<span className="text-foreground font-medium">{score}</span></span>
          {startTime > 0 && <span>⏱ {elapsed}秒</span>}
          <span>错误：<span className="text-foreground font-medium">{totalWrong}</span> 处</span>
        </div>

        {result === 'idle' && (
          <p className="text-xs text-muted-foreground text-center mb-3">点击你认为写错的字，然后点击"检查"</p>
        )}

        {/* Poem display */}
        <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-6 mb-4">
          {displayLines.map(function(line: string, li: number) {
            var chars = line.split('')
            return (
              <p key={li} className="text-center text-lg leading-8 lg:text-xl lg:leading-10 font-poem tracking-wide mb-1">
                {chars.map(function(ch: string, ci: number) {
                  var key = li + '-' + ci
                  var isSelected = selected.has(key)
                  var isWrong = result === 'checked' && isWrongPos(li, ci)
                  var isFalseAlarm = result === 'checked' && isSelected && !isWrong
                  return (
                    <span key={ci} onClick={function() { toggleChar(li, ci) }}
                      className={'inline-flex items-center justify-center align-middle mx-[1px] w-7 h-8 lg:w-8 lg:h-9 rounded text-base lg:text-lg border-2 leading-none cursor-pointer transition-all ' + (result === 'checked' ? (isWrong ? (isSelected ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-red-400 bg-red-50 text-red-500 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400') : isFalseAlarm ? 'border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'border-transparent') : (isSelected ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary' : 'border-transparent hover:border-primary/30'))}>
                      {isWrong && result === 'checked' && !isSelected
                        ? <span className="relative"><span className="opacity-30">{ch}</span><span className="absolute inset-0 flex items-center justify-center text-emerald-500 font-bold">{wrongChars.find(function(w) { return w.lineIdx === li && w.charIdx === ci })?.original}</span></span>
                        : ch}
                    </span>
                  )
                })}
              </p>
            )
          })}
        </div>

        {/* Result feedback */}
        {result === 'checked' && (
          <div className="text-center text-xs text-muted-foreground mb-4">
            {wrongChars.map(function(w, i) {
              return <span key={i} className="inline-block mr-3">「{w.wrong}」应为「<span className="text-emerald-500 font-medium">{w.original}</span>」</span>
            })}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 重来
          </button>
          <button onClick={nextRound} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 下一首
          </button>
          {result === 'idle' && (
            <button onClick={checkAnswer} disabled={selected.size === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50 card-hover cursor-pointer">
              检查
            </button>
          )}
        </div>
        <div className="flex justify-center mt-3">
          <button onClick={function() { setShowRecords(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">
            🏆 记录
          </button>
        </div>
      </div>
      {showRecords && <RecordsModal game="找茬" open={true} onClose={function() { setShowRecords(false) }} />}
    </div>
  )
}
