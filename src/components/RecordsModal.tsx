import { useState, useEffect } from 'react'
import { db } from '../lib/db'
import { Clock, Trophy } from 'lucide-react'

var GAME_LABELS: Record<string, string> = {
  '排序': '诗词排序',
  '填空': '诗词填空',
  '连连看': '诗词连连看',
  '飞花令': '飞花令',
  '拼图': '诗词拼图',
}

export default function RecordsModal({ game, open, onClose }: { game: string; open: boolean; onClose: () => void }) {
  var [records, setRecords] = useState<any[]>([])

  useEffect(function() {
    if (!open) return
    db.gameRecords.filter(function(r) { return r.game === game }).reverse().toArray().then(function(rows) {
      setRecords(rows)
    })
  }, [open, game])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[70vh] overflow-y-auto" onClick={function(e) { e.stopPropagation() }}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
          <h3 className="font-medium text-sm">{GAME_LABELS[game] || game} 记录</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer">&times;</button>
        </div>
        <div className="p-4 space-y-2">
          {records.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">暂无记录</p>}
          {records.map(function(r, i) {
            return (
              <div key={r.id || i} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                <div className={'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ' + (r.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                  {r.success ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{r.poemTitle || r.game}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3" /> {r.elapsed}秒
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={'text-xs px-1.5 py-0.5 rounded ' + (r.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                  {r.success ? '成功' : '失败'}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground p-3 border-t">
          <Trophy className="h-3 w-3" /> 共 {records.length} 条记录
        </div>
      </div>
    </div>
  )
}
