import { Routes, Route } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { useStore } from './store'
import { useUserStore } from './store/user'
import { useUIConfig } from './store/ui'
import { initPoems } from './lib/poems'
import Layout from './components/Layout'
import AIAssistant from './components/AIAssistant'
import TextSelectionToolbar from './components/TextSelectionToolbar'

const Home = lazy(() => import('./pages/Home'))
const PoemList = lazy(() => import('./pages/PoemList'))
const PoemDetail = lazy(() => import('./pages/PoemDetail'))
const StudyPlan = lazy(() => import('./pages/StudyPlan'))
const Review = lazy(() => import('./pages/Review'))
const Progress = lazy(() => import('./pages/Progress'))
const Settings = lazy(() => import('./pages/Settings'))
const AiSettings = lazy(() => import('./pages/AiSettings'))
const Users = lazy(() => import('./pages/Users'))
const Tools = lazy(() => import('./pages/Tools'))
const PoemRain = lazy(() => import('./pages/PoemRain'))
const PoemSort = lazy(() => import('./pages/PoemSort'))
const PoemFill = lazy(() => import('./pages/PoemFill'))
const PoemChain = lazy(() => import('./pages/PoemChain'))
const PoemMatch = lazy(() => import('./pages/PoemMatch'))
const PoemPuzzle = lazy(() => import('./pages/PoemPuzzle'))
const GameRecords = lazy(() => import('./pages/GameRecords'))

function Loading() {
  return <div className="py-16 text-center text-sm text-muted-foreground">加载中...</div>
}

export default function App() {
  const loadPoems = useStore(s => s.loadPoems)
  const initTheme = useUIConfig(s => s.initTheme)
  const ensureGuest = useUserStore(s => s.ensureGuest)
  const loadUsers = useUserStore(s => s.loadUsers)
  const loadReviewRecords = useStore(s => s.loadReviewRecords)
  const loadAiConfigs = useStore(s => s.loadAiConfigs)

  useEffect(() => {
    initTheme()
    initPoems().then(loadPoems)
    loadUsers()
    ensureGuest().then(() => {
      loadUsers()
      loadReviewRecords()
      loadAiConfigs()
    })
  }, [])

  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/poems" element={<PoemList />} />
          <Route path="/poems/:title" element={<PoemDetail />} />
          <Route path="/study-plan" element={<StudyPlan />} />
          <Route path="/study-plan/:planName" element={<StudyPlan />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-settings" element={<AiSettings />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/poem-rain" element={<PoemRain />} />
          <Route path="/poem-sort" element={<PoemSort />} />
          <Route path="/poem-fill" element={<PoemFill />} />
          <Route path="/poem-chain" element={<PoemChain />} />
          <Route path="/poem-match" element={<PoemMatch />} />
          <Route path="/poem-puzzle" element={<PoemPuzzle />} />
          <Route path="/game-records" element={<GameRecords />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </Suspense>
      <TextSelectionToolbar />
      <AIAssistant />
    </Layout>
  )
}
