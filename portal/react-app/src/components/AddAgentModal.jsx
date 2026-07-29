import { useState } from 'react'
import styles from './Modal.module.css'

export default function AddAgentModal({ onClose, addCustomAgent, addIncident, addActivity, showToast }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [goal, setGoal] = useState('')
  const [endpoint, setEndpoint] = useState('')

  function submit(e) {
    e.preventDefault()
    const agent = {
      id: `custom-${Date.now()}`,
      name, role: role || 'Custom Agent',
      goal: goal || 'No goal specified',
      endpoint: endpoint || null,
    }
    addCustomAgent(agent)
    showToast(`Agent "${name}" registered successfully`, 'success')
    addIncident('success', `New Agent: ${name}`, `Role: ${agent.role}`)
    addActivity(`Agent registered: ${name}`, `Role: ${agent.role}`)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>×</button>
        <h2>Register New Agent</h2>
        <form onSubmit={submit}>
          <label>Agent Name</label>
          <input placeholder="e.g. HR Agent" value={name} onChange={e => setName(e.target.value)} required />
          <label>Role</label>
          <input placeholder="e.g. Human Resources Specialist" value={role} onChange={e => setRole(e.target.value)} />
          <label>Goal</label>
          <textarea placeholder="Describe the agent's primary objective..." value={goal} onChange={e => setGoal(e.target.value)} />
          <label>API Endpoint (optional)</label>
          <input type="url" placeholder="http://localhost:8000/agent" value={endpoint} onChange={e => setEndpoint(e.target.value)} />
          <div className={styles.actions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary}>Register Agent</button>
          </div>
        </form>
      </div>
    </div>
  )
}
