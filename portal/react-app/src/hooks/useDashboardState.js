import { useState, useCallback } from 'react'

const initialMetrics = () => ({
  supply:      { tasks: 0, success: 0, time: 0, load: 0 },
  budget:      { tasks: 0, success: 0, time: 0, load: 0 },
  vendor:      { tasks: 0, success: 0, time: 0, load: 0 },
  risk:        { tasks: 0, success: 0, time: 0, load: 0 },
  procurement: { tasks: 0, success: 0, time: 0, load: 0 },
  briefing:    { tasks: 0, success: 0, time: 0, load: 0 },
})

const initialCards = () => ({
  supply:      { inventory: '—', orders: '—', stock: '—', alerts: '0', lastRun: '—' },
  budget:      { budgetUsed: '—', forecast: '—', variance: '—', savings: '—', lastRun: '—' },
  vendor:      { vendors: '—', contracts: '—', compliance: '—', expiring: '0', lastRun: '—' },
  risk:        { riskLevel: '—', riskScore: '—', supplier: '—', delay: '—', lastRun: '—' },
  procurement: { po: '—', approval: '—', erp: '—', status: '—', lastRun: '—' },
  briefing:    { report: '—', dashboard: '—', slack: '—', wa: '—', lastRun: '—' },
})

export function useDashboardState() {
  const [incidents, setIncidents] = useState([])
  const [activities, setActivities] = useState([{ title: 'Portal initialized', detail: 'Enterprise AI Hub v1.0 · CrewAI Control Center', time: 'now' }])
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineRuns, setPipelineRuns] = useState(0)
  const [pipelineSteps, setPipelineSteps] = useState(['pending','pending','pending','pending','pending','pending'])
  const [pipelineStatus, setPipelineStatus] = useState('Idle')
  const [consoleLogs, setConsoleLogs] = useState([
    { time: 'init', msg: 'CrewAI orchestrator loaded', level: 'info' },
    { time: 'init', msg: '6 agents registered in crew', level: 'info' },
    { time: 'ready', msg: 'Pipeline ready — click "Run Pipeline"', level: 'ok' },
  ])
  const [metrics, setMetrics] = useState(initialMetrics)
  const [cards, setCards] = useState(initialCards)
  const [customAgents, setCustomAgents] = useState([])

  const addIncident = useCallback((type, title, detail) => {
    const time = new Date().toLocaleTimeString()
    setIncidents(prev => [{ type, title, detail, time }, ...prev])
  }, [])

  const addActivity = useCallback((title, detail) => {
    const time = new Date().toLocaleTimeString()
    setActivities(prev => [{ title, detail, time }, ...prev])
  }, [])

  const appendLog = useCallback((msg, level = 'info') => {
    const time = new Date().toLocaleTimeString()
    setConsoleLogs(prev => [...prev, { time, msg, level }])
  }, [])

  const updateMetric = useCallback((key) => {
    setMetrics(prev => ({
      ...prev,
      [key]: {
        tasks: prev[key].tasks + 1,
        success: prev[key].success + 1,
        time: Math.floor(Math.random() * 600 + 100),
        load: Math.min(100, prev[key].load + 20),
      }
    }))
  }, [])

  const updateCard = useCallback((agent, data) => {
    setCards(prev => ({ ...prev, [agent]: { ...prev[agent], ...data } }))
  }, [])

  const addCustomAgent = useCallback((agent) => {
    setCustomAgents(prev => [...prev, agent])
  }, [])

  return {
    incidents, activities, pipelineRunning, setPipelineRunning,
    pipelineRuns, setPipelineRuns, pipelineSteps, setPipelineSteps,
    pipelineStatus, setPipelineStatus, consoleLogs, metrics, cards,
    customAgents, addIncident, addActivity, appendLog, updateMetric, updateCard, addCustomAgent,
  }
}
