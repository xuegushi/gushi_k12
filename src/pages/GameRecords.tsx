import { useState, useEffect } from 'react'
import { db } from '../lib/db'
import { ArrowLeft, Trophy, Clock, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

var GAME_LABELS: Record<string, string> = {
  '排序': '诗词排序',
  '填空': '诗词填空',
  '连连看': '诗词连连看',
  '飞花令': '飞花令',
  '拼图': '诗词拼图',
}

export default function GameRecords() {
  var navigate = useNavigate()
  var [records, setRecords] = useState<any[]>([])
  var [stats, setStats] = useState<Record<string, { total: number; success: number }>>({})

  useEffect(function() {
    db.gameRecords.orderBy('createdAt').reverse().limit(200).toArray().then(function(rows) {
      setRecords(rows)
      var s: Record<string, { total: number; success: number }> = {}
      rows.forEach(function(r) {
        if (!s[r.game]) s[r.game] = { total: 0, success: 0 }
        s[r.game].total++
        if (r.success) s[r.game].success++
      })
      setStats(s)
    })
  }, [])

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">游戏记录</span>
        <div className="flex-1" />
        <button onClick={function() { db.gameRecords.clear(); setRecords([]); setStats({}) }}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer">清空</button>
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        {/* Stats by game */}
        {Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            {Object.entries(stats).map(function([game, st]) {
              return (
                <div key={game} className="rounded-xl border bg-card p-3 text-center">
                  <div className="text-xs text-muted-foreground">{GAME_LABELS[game] || game}</div>
                  <div className="text-lg font-bold text-primary mt-1">{st.success}<span className="text-xs text-muted-foreground font-normal">/{st.total}</span></div>
                </div>
              )
            })}
          </div>
        )}

        {records.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">暂无游戏记录</div>
        )}

        <div className="space-y-2">
          {records.map(function(r, i) {
            return (
              <div key={r.id || i} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                <div className={'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ' + (r.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                  {r.success ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{GAME_LABELS[r.game] || r.game}</span>
                    {r.poemTitle && <span className="font-medium text-foreground truncate">{r.poemTitle}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> {r.elapsed}秒
                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
