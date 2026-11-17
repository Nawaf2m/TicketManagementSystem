import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react'
import { displayStatus } from '../utils/data'

export function Badge({ value, type = 'status' }) {
  const text = String(value || '—').toUpperCase()
  const colors = type === 'priority' ? { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' } : { OPEN: 'violet', IN_PROGRESS: 'purple', RESOLVED: 'success', CLOSED: 'muted' }
  return <span className={`badge badge-${colors[text] || 'muted'}`}>{displayStatus(text)}</span>
}

export function PageHeading({ eyebrow, title, description, actions }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow || 'SUPPORT DESK'}</p><h1>{title}</h1>{description && <p className="subdued">{description}</p>}</div><div className="heading-actions">{actions}</div></div>
}

export function Panel({ title, subtitle, icon: Icon, actions, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div className="panel-label">{Icon && <span className="panel-icon"><Icon size={20}/></span>}<div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{actions}</div><div className="panel-body">{children}</div></section>
}

export function Notice({ type = 'error', children, onDismiss }) {
  if (!children) return null
  return <div className={`notice notice-${type}`}>{type === 'error' ? <AlertCircle size={17}/> : <CheckCircle2 size={17}/>}<span>{children}</span>{onDismiss && <button className="icon-button" onClick={onDismiss} aria-label="Dismiss"><X size={16}/></button>}</div>
}

export function Spinner({ label = 'Loading...' }) { return <div className="loading"><LoaderCircle className="spin" size={23}/>{label}</div> }
export function EmptyState({ title = 'Nothing here yet', detail = 'Records will appear here when available.' }) { return <div className="empty-state"><div className="empty-symbol">✦</div><strong>{title}</strong><p>{detail}</p></div> }

export function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button></div>{children}</div></div>
}
