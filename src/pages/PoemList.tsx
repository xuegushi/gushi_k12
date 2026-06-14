import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { useUserStore } from '../store/user'
import { db } from '../lib/db'
import { Search, ChevronRight, BookOpen, Star, Heart } from 'lucide-react'
import collectionsData from '../data/collections.json'

var TYPES = ['全部', '诗', '词', '文言文']
var GRADE_NAMES = ['全部', '一', '二', '三', '四', '五', '六', '七', '八', '九']
var GRADE_FULL = ['全部', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级']
var COLLECTION_NAMES = ['全部', '高中必修（上册）', '高中必修（下册）', '高中选修（上册）', '高中选修（中册）', '高中选修（下册）']

var GRADE_TERM_LABEL: Record<string, string> = {
  '10-1': '高中必修（上册）',
  '10-2': '高中必修（下册）',
  '11-1': '高中选修（上册）',
  '11-2': '高中选修（中册）',
  '12-1': '高中选修（下册）',
  '12-2': '高中选修（下册）',
}

function getGradeLabel(p: any): string {
  if (p.collection_label) return p.collection_label
  var key = p.grade + '-' + p.term
  if (GRADE_TERM_LABEL[key]) return GRADE_TERM_LABEL[key]
  return GRADE_FULL[p.grade] || ''
}

var DIFFICULTY_COLORS = ['', 'text-green-600', 'text-amber-600', 'text-red-600']
var DIFFICULTY_BG = ['', 'bg-green-100 dark:bg-green-900/30', 'bg-amber-100 dark:bg-amber-900/30', 'bg-red-100 dark:bg-red-900/30']

// Build a poem-to-collections lookup
var poemCollections: Record<string, string[]> = {}
var collectionList: { group: string; name: string; count: number }[] = []
var collections = collectionsData as Record<string, Record<string, string[]>>
for (var group of Object.keys(collections)) {
  for (var colName of Object.keys(collections[group])) {
    var poems = collections[group][colName]
    collectionList.push({ group, name: colName, count: poems.length })
    for (var title of poems) {
      if (!poemCollections[title]) poemCollections[title] = []
      poemCollections[title].push(colName)
    }
  }
}

export default function PoemList() {
  var navigate = useNavigate()
  var [searchParams, setSearchParams] = useSearchParams()
  var gradeParam = searchParams.get('grade')
  var poems = useStore(function(s) { return s.poems })
  var poemsLoaded = useStore(function(s) { return s.poemsLoaded })

  var [tab, setTabState] = useState(searchParams.get('tab') || 'syllabus')
  var setTab = function(t: string) {
    setTabState(t)
    setSearchParams(function(prev) { var p = new URLSearchParams(prev); p.set('tab', t); p.delete('collection'); return p }, { replace: true })
  }
  var [grade, setGrade] = useState(gradeParam ? Number(gradeParam) : 0)
  var [type, setType] = useState('全部')
  var [search, setSearch] = useState('')
  var [diffFilter, setDiffFilter] = useState(0)
  var [selectedCollection, setSelectedCollectionState] = useState(searchParams.get('collection') || '')
  var [collectionLabel, setCollectionLabel] = useState('全部')
  var [favorites, setFavorites] = useState<any[]>([])
  var currentUser = useUserStore(function(s) { return s.currentUser })

  useEffect(function() {
    if (!currentUser) return
    db.favorites.where('userId').equals(currentUser.id!).toArray().then(function(favs) {
      var poemMap = new Map(poems.map(function(p) { return [p.title, p] }))
      setFavorites(favs.map(function(f) { return { ...f, poem: poemMap.get(f.poemTitle) } }).filter(function(f) { return f.poem }))
    })
  }, [currentUser, poems, tab])

  var setSelectedCollection = function(name: string) {
    setSelectedCollectionState(name)
    if (name) {
      setSearchParams(function(prev) { var p = new URLSearchParams(prev); p.set('collection', name); return p }, { replace: true })
    }
  }

  // Collection label to grade/term mapping for filtering
  var COLLECTION_GRADE_MAP: Record<string, { grade: number; term: number }> = {
    '高中必修（上册）': { grade: 10, term: 1 },
    '高中必修（下册）': { grade: 10, term: 2 },
    '高中选修（上册）': { grade: 11, term: 1 },
    '高中选修（中册）': { grade: 11, term: 2 },
    '高中选修（下册）': { grade: 12, term: 1 },
  }

  // Compute filtered list
  var filtered = tab === 'syllabus'
    ? poems.filter(function(p) {
        if (p.grade === 0) return false
        if (grade > 0 && p.grade !== grade) return false
        if (type !== '全部' && p.type !== type) return false
        if (diffFilter > 0 && p.difficulty !== diffFilter) return false
        if (collectionLabel !== '全部') {
          var mapping = COLLECTION_GRADE_MAP[collectionLabel]
          if (mapping) {
            if (p.grade !== mapping.grade || p.term !== mapping.term) return false
          }
        }
        if (search) {
          var q = search.toLowerCase()
          return p.title.includes(q) || p.author.includes(q) || p.content.some(function(l) { return l.includes(q) })
        }
        return true
      })
    : []

  var count = tab === 'favorites' ? favorites.length : tab === 'extra' ? poems.filter(function(p) { return p.grade === 0 }).length : filtered.length

  if (!poemsLoaded || poems.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="space-y-4 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-bold">诗词库</h1>
        <span className="text-xs text-muted-foreground">{count} 首</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-0.5 w-fit">
        <button onClick={function() { setTab('syllabus'); setSelectedCollection('') }}
          className={tab === 'syllabus' ? 'px-4 py-2 text-sm font-medium rounded-md bg-card text-foreground shadow-sm' : 'px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'}>
          教程同步
        </button>
        <button onClick={function() { setTab('extra'); setSelectedCollection('') }}
          className={tab === 'extra' ? 'px-4 py-2 text-sm font-medium rounded-md bg-card text-foreground shadow-sm' : 'px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'}>
          课外
        </button>
        <button onClick={function() { setTab('favorites') }}
          className={tab === 'favorites' ? 'px-4 py-2 text-sm font-medium rounded-md bg-card text-foreground shadow-sm' : 'px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'}>
          收藏
        </button>
      </div>

      {tab === 'syllabus' ? (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索标题、作者或诗句..." value={search}
              onChange={function(e) { setSearch(e.target.value) }}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              {TYPES.map(function(t) {
                return (
                  <button key={t} onClick={function() { setType(t) }}
                    className={type === t ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-card text-foreground shadow-sm' : 'px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground'}>
                    {t}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              {[{ v: 0, l: '全部' }, { v: 1, l: '简单' }, { v: 2, l: '中等' }, { v: 3, l: '困难' }].map(function(d) {
                return (
                  <button key={d.v} onClick={function() { setDiffFilter(d.v) }}
                    className={diffFilter === d.v ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-card text-foreground shadow-sm' : 'px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground'}>
                    {d.l}
                  </button>
                )
              })}
            </div>
            {(grade === 0) && (
              <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                {COLLECTION_NAMES.map(function(name) {
                  return (
                    <button key={name} onClick={function() { setCollectionLabel(name) }}
                      className={collectionLabel === name ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-card text-foreground shadow-sm' : 'px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground'}>
                      {name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Grade */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3">
            {GRADE_NAMES.map(function(name, i) {
              return (
                <button key={i} onClick={function() { setGrade(i) }}
                  className={'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ' + (grade === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                  {name}
                </button>
              )
            })}
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(function(p) {
              return (
                <div key={p.title + '-' + p.author + '-' + p.grade}
                  onClick={function() { navigate('/poems/' + encodeURIComponent(p.title)) }}
                  className="group rounded-xl border bg-card p-4 card-hover cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{p.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.dynasty} · {p.author}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/20 shrink-0 mt-1" />
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-2 line-clamp-2 leading-relaxed font-poem">
                    {Array.isArray(p.content) ? p.content.slice(0, 2).join('') : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.type}</span>
                    <span className={'text-[10px] px-1.5 py-0.5 rounded-full ' + (DIFFICULTY_BG[p.difficulty] || 'bg-muted') + ' ' + (DIFFICULTY_COLORS[p.difficulty] || 'text-muted-foreground')}>难度{p.difficulty}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{getGradeLabel(p)}</span>
                    {p.examFrequency > 0 && <span className="text-[10px] text-amber-500 flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: Math.min(p.examFrequency, 5) }).map(function(_, i) { return <Star key={i} className="h-2.5 w-2.5 fill-current" /> })}
                    </span>}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div className="col-span-full text-center py-16 text-sm text-muted-foreground">没有找到匹配的诗词</div>}
          </div>
        </div>
      ) : tab === 'extra' ? (
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索标题、作者..." value={search}
              onChange={function(e) { setSearch(e.target.value) }}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          {/* Collection groups */}
          {!selectedCollection ? (
            <div className="space-y-4">
              {Object.keys(collections).map(function(group) {
                var cols = collections[group as keyof typeof collections] as Record<string, string[]>
                var colList = Object.entries(cols)
                return (
                  <div key={group}>
                    <h2 className="text-sm font-medium mb-2 text-muted-foreground">{group}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {colList.map(function([name, poemTitles]) {
                        return (
                          <button key={name} onClick={function() { setSelectedCollection(name) }}
                            className="text-left rounded-xl border bg-card p-3 card-hover">
                            <p className="text-sm font-medium truncate">{name.replace(/^[^·]*·\s*/, '')}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{poemTitles.length} 首</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div>
              <button onClick={function() { setSelectedCollection('') }} className="text-sm text-primary mb-3">&larr; 返回诗单列表</button>
              {function() {
                // Get poems from selected collection
                var colPoems: any[] = []
                for (var group of Object.keys(collections)) {
                  var cols = collections[group as keyof typeof collections] as Record<string, string[]>
                  if (cols[selectedCollection]) {
                    colPoems = cols[selectedCollection].map(function(title) {
                      var p = poems.find(function(x) { return x.title === title })
                      return p ? p : { title: title, author: '', dynasty: '', type: '诗', content: [] }
                    })
                    break
                  }
                }
                if (search) {
                  var q = search.toLowerCase()
                  colPoems = colPoems.filter(function(p) { return p.title.includes(q) || p.author.includes(q) })
                }
                return <div>
                  {search && <p className="text-xs text-muted-foreground mb-2">{colPoems.length} 条结果</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {colPoems.map(function(p) {
                      return (
                        <div key={p.title}
                          onClick={function() { navigate('/poems/' + encodeURIComponent(p.title)) }}
                          className="group rounded-xl border bg-card p-4 card-hover cursor-pointer">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{p.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{p.dynasty} · {p.author}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/20 shrink-0 mt-1" />
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.type || '诗'}</span>
                          </div>
                        </div>
                      )
                    })}
                    {colPoems.length === 0 && <div className="col-span-full text-center py-16 text-sm text-muted-foreground">没有匹配的诗词</div>}
                  </div>
                </div>
              }()}
            </div>
          )}
        </div>
      )
      : null}
      {tab === 'favorites' ? <div>
        {favorites.length === 0 ? <div className="text-center py-16 text-sm text-muted-foreground">还没有收藏的诗词</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {favorites.map(function(f) {
              return (
                <div key={f.poemTitle} onClick={function() { navigate('/poems/' + encodeURIComponent(f.poemTitle)) }}
                  className="group rounded-xl border bg-card p-4 card-hover cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{f.poem.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.poem.dynasty} · {f.poem.author}</p>
                    </div>
                    <Heart className="h-4 w-4 text-red-500 fill-red-500 shrink-0 mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{f.poem.type || '诗'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div> : null}
    </div>
  )
}
