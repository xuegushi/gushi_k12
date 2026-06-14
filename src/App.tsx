import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store'
import { useUserStore } from './store/user'
import { useUIConfig } from './store/ui'
import { initPoems } from './lib/poems'
import Layout from './components/Layout'
import AIAssistant from './components/AIAssistant'
import TextSelectionToolbar from './components/TextSelectionToolbar'
import Home from './pages/Home'
import PoemList from './pages/PoemList'
import PoemDetail from './pages/PoemDetail'
import StudyPlan from './pages/StudyPlan'
import Review from './pages/Review'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import AiSettings from './pages/AiSettings'
import Users from './pages/Users'

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/poems" element={<PoemList />} />
        <Route path="/poem/:title" element={<PoemDetail />} />
        <Route path="/study-plan" element={<StudyPlan />} />
        <Route path="/study-plan/:planName" element={<StudyPlan />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/review" element={<Review />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/ai-settings" element={<AiSettings />} />
        <Route path="/users" element={<Users />} />
      </Routes>
      <TextSelectionToolbar />
      <AIAssistant />
    </Layout>
  )
}
