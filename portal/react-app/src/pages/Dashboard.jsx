import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DashboardHome from '../components/DashboardHome'
import AgentsView from '../components/AgentsView'
import IncidentsView from '../components/IncidentsView'
import PipelineModal from '../components/PipelineModal'
import AddAgentModal from '../components/AddAgentModal'
import Toast from '../components/Toast'
import { useDashboardState } from '../hooks/useDashboardState'
import { useAuth } from '../hooks/useAuth'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()
  const state = useDashboardState(user)
  const [showPipeline, setShowPipeline] = useState(false)
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [toasts, setToasts] = useState([])

  function showToast(message, type = 'info') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const shared = { ...state, showToast }

  return (
    <div className={styles.app}>
      <Sidebar onRunPipeline={() => setShowPipeline(true)} onAddAgent={() => setShowAddAgent(true)} />
      <main className={styles.main}>
        <Routes>
          <Route index element={<DashboardHome {...shared} onRunPipeline={() => setShowPipeline(true)} />} />
          <Route path="agents" element={<AgentsView {...shared} />} />
          <Route path="incidents" element={<IncidentsView incidents={state.incidents} />} />
        </Routes>
      </main>

      {showPipeline && (
        <PipelineModal {...shared} onClose={() => setShowPipeline(false)} />
      )}
      {showAddAgent && (
        <AddAgentModal {...shared} onClose={() => setShowAddAgent(false)} />
      )}

      <div className={styles.toastContainer}>
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
      </div>
    </div>
  )
}
