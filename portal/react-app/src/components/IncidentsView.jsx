import styles from './IncidentsView.module.css'

const icons = { error: '✕', warn: '⚠', info: 'ℹ', success: '✓' }

function formatTime(inc) {
  if (inc.createdAt) {
    return new Date(inc.createdAt).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
  }
  return inc.time
}

export default function IncidentsView({ incidents }) {
  return (
    <div>
      <div className={styles.title}>
        Incident History <span className={styles.count}>{incidents.length}</span>
      </div>
      <div className={styles.panel}>
        {incidents.length === 0
          ? <div className={styles.empty}>No incidents recorded · All agents operating normally</div>
          : <ul className={styles.feed}>
              {incidents.map((inc, i) => (
                <li key={i}>
                  <div className={`${styles.icon} ${styles[inc.type]}`}>{icons[inc.type] || 'ℹ'}</div>
                  <div className={styles.text}>
                    <strong>{inc.title}</strong>
                    {inc.detail && <div className={styles.detail}>{inc.detail}</div>}
                  </div>
                  <span className={styles.time}>{formatTime(inc)}</span>
                </li>
              ))}
            </ul>
        }
      </div>
    </div>
  )
}
