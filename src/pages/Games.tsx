import { Link } from 'react-router-dom'
import { Gamepad2, Droplets, Puzzle, Edit3, Cherry, LayoutGrid, Grid3X3 } from 'lucide-react'

const GAMES = [
  { path: 'poem-sort', label: '诗词排序', desc: '拖拽片段还原诗句顺序', icon: Puzzle, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  { path: 'poem-fill', label: '诗词填空', desc: '选字填入诗句空白处', icon: Edit3, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  { path: 'poem-chain', label: '飞花令', desc: '说出包含指定字的诗句', icon: Cherry, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' },
  { path: 'poem-match', label: '诗词连连看', desc: '翻转卡片匹配上下句', icon: LayoutGrid, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  { path: 'poem-puzzle', label: '诗词拼图', desc: '交换字块还原诗句', icon: Grid3X3, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' },
  { path: 'poem-rain', label: '诗词雨', desc: '黑客帝国风格的诗词矩阵雨', icon: Droplets, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
]

export default function Games() {
  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-1">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h1 className="text-xl lg:text-2xl font-bold">诗词游戏</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">在游戏中学习古诗词</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map(function(g) {
          return (
            <Link key={g.path} to={'/games/' + g.path}
              className="flex items-center gap-4 rounded-xl border bg-card p-5 card-hover">
              <div className={'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ' + g.color}>
                <g.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-sm">{g.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
