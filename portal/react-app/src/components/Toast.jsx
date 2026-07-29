import styles from './Toast.module.css'

export default function Toast({ message, type }) {
  return <div className={`${styles.toast} ${styles[type]}`}>{message}</div>
}
