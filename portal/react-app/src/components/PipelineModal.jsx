import { useState } from 'react'
import styles from './Modal.module.css'

function parseAgentJson(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { const s = raw.indexOf('{'), e = raw.lastIndexOf('}') + 1; return s !== -1 ? JSON.parse(raw.slice(s, e)) : {} }
  catch { return {} }
}

export default function PipelineModal({
  onClose, setPipelineRunning, setPipelineRuns, setPipelineSteps,
  setPipelineStatus, appendLog, addIncident, addActivity, updateMetric,
  updateCard, showToast,
}) {
  const [incidentId, setIncidentId] = useState('INC001')
  const [sku, setSku] = useState('SKU2')
  const [qty, setQty] = useState(88)

  async function submit() {
    onClose()
    setPipelineRunning(true)
    setPipelineStatus('Running')
    setPipelineSteps(['pending','pending','pending','pending','pending','pending'])

    const agentStepMap = { 'Agent 1': 0, 'Agent 2': 1, 'Agent 3': 2, 'Agent 4': 3, 'Agent 5': 4, 'Agent 6': 5 }
    const agentKeyMap  = { 'Agent 1': 'supply', 'Agent 2': 'budget', 'Agent 3': 'vendor', 'Agent 4': 'risk', 'Agent 5': 'procurement', 'Agent 6': 'briefing' }

    appendLog(`=== CrewAI Pipeline Started: ${incidentId} ===`, 'info')
    appendLog(`SKU=${sku}  Qty=${qty}`, 'info')
    addActivity('CrewAI Pipeline', `Incident ${incidentId} triggered`)
    addIncident('info', `Incident ${incidentId}`, `SKU=${sku}, Qty=${qty}`)

    try {
      const resp = await fetch('http://localhost:8003/run-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId, sku, required_quantity: qty }),
      })
      if (!resp.ok) throw new Error(`Orchestrator error: ${resp.status}`)
      const { run_id } = await resp.json()
      appendLog(`Run ID: ${run_id}`, 'info')

      const evtSource = new EventSource(`http://localhost:8003/stream/${run_id}`)

      evtSource.onmessage = (e) => {
        const data = JSON.parse(e.data)

        if (data.done) {
          evtSource.close()
          setPipelineSteps(prev => { const s = [...prev]; s[5] = 'done'; return s })
          setPipelineRuns(prev => prev + 1)
          setPipelineRunning(false)
          setPipelineStatus(data.status === 'completed' ? 'Completed ✓' : 'Failed ✕')

          if (data.status === 'completed') {
            showToast('✅ All 6 agents completed!', 'success')
            appendLog('=== Pipeline Finished Successfully ===', 'ok')
            addIncident('success', `Pipeline ${incidentId}`, 'All 6 agents completed')
            fetch(`http://localhost:8003/result/${run_id}`)
              .then(r => r.json())
              .then(result => applyResult(result, updateCard, updateMetric))
              .catch(err => appendLog(`Failed to fetch result: ${err.message}`, 'err'))
          } else {
            showToast('❌ Pipeline failed. Check logs.', 'error')
            appendLog('=== Pipeline Failed ===', 'err')
            addIncident('error', `Pipeline ${incidentId}`, 'Pipeline execution failed')
          }
          return
        }

        if (data.error) { appendLog(`Error: ${data.error}`, 'err'); return }

        const stepIdx = agentStepMap[data.agent]
        if (stepIdx !== undefined) {
          setPipelineSteps(prev => {
            const s = [...prev]
            if (data.kind === 'done') s[stepIdx] = 'done'
            else if (s[stepIdx] !== 'done') s[stepIdx] = 'running'
            return s
          })
        }

        const level = data.kind === 'done' ? 'ok' : data.kind === 'error' ? 'err' : data.kind === 'output' ? 'warn' : 'info'
        appendLog(`[${data.agent}] ${data.msg}`, level)

        if (data.kind === 'done') {
          const agentKey = agentKeyMap[data.agent]
          if (agentKey && ['supply','budget','vendor'].includes(agentKey)) updateMetric(agentKey)
        }
      }

      evtSource.onerror = () => { evtSource.close(); appendLog('SSE stream closed', 'warn') }

    } catch (err) {
      appendLog(`Pipeline error: ${err.message}`, 'err')
      showToast(`Pipeline failed: ${err.message}`, 'error')
      addIncident('error', 'Pipeline Error', err.message)
      setPipelineRunning(false)
      setPipelineStatus('Failed')
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>×</button>
        <h2>🚀 Run CrewAI Pipeline</h2>
        <p className={styles.sub}>Enter incident details to trigger the full 6-agent autonomous pipeline.</p>
        <label>Incident ID</label>
        <input value={incidentId} onChange={e => setIncidentId(e.target.value)} />
        <label>SKU</label>
        <input value={sku} onChange={e => setSku(e.target.value)} />
        <label>Required Quantity</label>
        <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={submit}>▶ Run Pipeline</button>
        </div>
      </div>
    </div>
  )
}

function applyResult(result, updateCard, updateMetric) {
  const r  = result.result || {}
  const a1 = parseAgentJson(r.agent1_supply_chain)
  const a2 = parseAgentJson(r.agent2_budget_finance)
  const a3 = parseAgentJson(r.agent3_vendor_contract)
  const a4 = r.agent4_risk_assessment || {}
  const a5 = r.agent5_procurement     || {}
  const a6 = r.agent6_executive_brief || {}
  const now = new Date().toLocaleTimeString()

  updateCard('supply', {
    inventory: a1.stock_levels ?? '—', orders: a1.order_quantities ?? '—',
    stock: a1.shortage_quantity != null ? (a1.has_shortage ? '⚠ Short ' + a1.shortage_quantity : '✓ OK') : '—',
    alerts: a1.risk_level || '—', lastRun: now,
  })
  updateCard('budget', {
    budgetUsed: a2.percent_used != null ? a2.percent_used + '%' : '—',
    forecast: a2.verdict || '—',
    variance: a2.shortfall != null ? (a2.shortfall > 0 ? '-$' + a2.shortfall.toLocaleString() : '✓ OK') : '—',
    savings: a2.remaining_budget != null ? '$' + Math.round(a2.remaining_budget).toLocaleString() : '—',
    lastRun: now,
  })
  updateCard('vendor', {
    vendors: a3.vendor_name || '—', contracts: a3.contract_status || '—',
    compliance: a3.compliant != null ? (a3.compliant ? '✓ Compliant' : '✗ Issues') : '—',
    expiring: a3.days_until_expiry != null ? a3.days_until_expiry + 'd' : '—', lastRun: now,
  })
  updateCard('risk', {
    riskLevel: a4.overall_risk || '—', riskScore: a4.risk_score != null ? a4.risk_score + '/100' : '—',
    supplier: a4.recommended_supplier || '—', delay: a4.expected_delay != null ? a4.expected_delay + 'd' : '—', lastRun: now,
  })
  updateCard('procurement', {
    po: a5.purchase_order_id || '—', approval: a5.approval_status || '—',
    erp: a5.execution_status === 'SUCCESS' ? 'CREATED' : (a5.execution_status || '—'),
    status: a5.execution_status || '—', lastRun: now,
  })
  updateCard('briefing', {
    report: a6.report_file || '—', dashboard: a6.dashboard_status || '—',
    slack: a6.slack_payload ? '✅ Sent' : '—', wa: a6.whatsapp_payload ? '✅ Sent' : '—', lastRun: now,
  })
  ;['supply','budget','vendor','risk','procurement','briefing'].forEach(k => updateMetric(k))
}
