import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, CheckCircle2, CircleAlert, Plus, RefreshCw, Ticket, TrendingUp, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getList, paths } from '../services/api'
import { Badge, EmptyState, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { activityDescription, formatDate, formatDateTime, messageFromError } from '../utils/data'

const metrics = [
  { key: 'total', label: 'Total Tickets', icon: Ticket, accent: 'purple' },
  { key: 'open', label: 'Open Tickets', icon: CircleAlert, accent: 'green' },
  { key: 'progress', label: 'In Progress', icon: RefreshCw, accent: 'purple' },
  { key: 'done', label: 'Resolved & Closed', icon: CheckCircle2, accent: 'green' },
]

export default function DashboardPage() {
  const { hasPermission } = useAuth()
  const canViewAll = hasPermission('TICKET_VIEW_ALL')
  const canViewOwn = hasPermission('TICKET_VIEW_OWN')
  const canViewAssigned = hasPermission('TICKET_VIEW_ASSIGNED')
  const canViewTicket = hasPermission('TICKET_VIEW')
  const canViewActivities = hasPermission('ACTIVITY_VIEW_ALL')
  const canViewUsers = hasPermission('USER_VIEW')
  const canCreate = hasPermission('TICKET_CREATE')
  const canBrowse = canViewAll || canViewOwn || canViewAssigned || canCreate
  const ActivityLink = canViewTicket ? Link : 'div'
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [activities, setActivities] = useState([])
  const [activityError, setActivityError] = useState('')
  const [activityUsers, setActivityUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true); setError(''); setActivityError('')
    try {
      const ticketPaths = canViewAll ? [paths.tickets] : [...(canViewOwn ? [paths.myTickets] : []), ...(canViewAssigned ? [paths.assignedTickets] : [])]
      const [ticketResults, activityResult, usersResult] = await Promise.all([
        Promise.allSettled(ticketPaths.map(url => getList(url))),
        Promise.allSettled([canViewActivities ? getList(paths.recentActivities) : Promise.resolve([])]),
        Promise.allSettled([canViewActivities && canViewUsers ? getList(paths.users) : Promise.resolve([])]),
      ])
      const available = ticketResults.flatMap(result => result.status === 'fulfilled' ? result.value : [])
      setTickets([...new Map(available.map(ticket => [ticket.id, ticket])).values()])
      const failures = ticketResults.filter(result => result.status === 'rejected')
      if (failures.length) setError(`Some tickets could not be loaded: ${failures.map(result => messageFromError(result.reason)).join(' ')}`)
      setActivities(activityResult[0].status === 'fulfilled' ? activityResult[0].value : [])
      if (activityResult[0].status === 'rejected') setActivityError(messageFromError(activityResult[0].reason))
      setActivityUsers(usersResult[0].status === 'fulfilled' ? usersResult[0].value : [])
      if (usersResult[0].status === 'rejected') setActivityError(`Agent names could not be loaded: ${messageFromError(usersResult[0].reason)}`)
    } catch (err) { setTickets([]); setError(messageFromError(err)) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [canViewAll, canViewOwn, canViewAssigned, canViewActivities, canViewUsers])
  const numbers = { total: tickets.length, open: tickets.filter(t => t.status === 'OPEN').length, progress: tickets.filter(t => t.status === 'IN_PROGRESS').length, done: tickets.filter(t => ['RESOLVED','CLOSED'].includes(t.status)).length }
  const recentTickets = [...tickets].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)).slice(0, 6)
  return <>
    <PageHeading eyebrow="WORKSPACE OVERVIEW" title="Ticket Management" description={canViewAll ? 'Your support operations at a glance.' : 'Stay up to date with your support requests.'} actions={<><button className="btn btn-ghost" onClick={load}><RefreshCw size={17}/> Refresh</button>{canCreate && <button className="btn btn-primary" onClick={() => navigate('/tickets?create=1')}><Plus size={18}/> Create Ticket</button>}</>}/>
    <Notice>{error}</Notice>
    {loading ? <Spinner/> : <>
      <div className="stats-grid">{metrics.map(m => { const Icon = m.icon; return <article className="stat-card" key={m.key}><div className={`stat-icon ${m.accent}`}><Icon size={24}/></div><div className="stat-copy"><span>{m.label}</span><strong>{numbers[m.key]}</strong></div><div className={`stat-sparkline ${m.accent}`}><svg viewBox="0 0 108 48" fill="none" aria-hidden="true"><path d="M2 37 C22 32 24 17 42 25 S65 32 79 12 S92 9 106 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M2 37 C22 32 24 17 42 25 S65 32 79 12 S92 9 106 13 L106 48 L2 48 Z" fill="currentColor" opacity=".09"/></svg></div></article> })}</div>
      <div className="dashboard-grid">
        <Panel title="Recent Tickets" subtitle="Latest support requests in the system" icon={Ticket} actions={canBrowse && <Link to="/tickets" className="link-action">View all <ArrowRight size={17}/></Link>}>
          {recentTickets.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead><tbody>{recentTickets.map(t => <tr key={t.id} onClick={canViewTicket ? () => navigate(`/tickets/${t.id}`) : undefined} className={canViewTicket ? "clickable-row" : undefined}><td className="id-cell">#T-{String(t.id).padStart(4, '0')}</td><td className="table-title">{t.title}</td><td><Badge type="priority" value={t.priority}/></td><td><Badge value={t.status}/></td><td className="date-cell">{formatDate(t.createdAt || t.created_at)}</td></tr>)}</tbody></table></div> : <EmptyState title="No tickets yet" detail="Create your first ticket to get started."/>}
        </Panel>
        <Panel title="Ticket Activity" subtitle={canViewActivities ? 'Latest activity across your workspace' : 'Activity details are available inside each ticket'} icon={Activity}><Notice>{activityError}</Notice>
          {!canViewActivities ? <div className="activity-locked"><Activity size={26}/><h3>Ticket-level activity</h3><p>Open a ticket to see its history. The global feed requires permission to view all activities.</p>{canBrowse && <Link to="/tickets" className="btn btn-outline">Browse Tickets</Link>}</div> : activities.length ? <div className="activity-list">{activities.map((a, index) => <ActivityLink key={a.id || index} to={canViewTicket ? `/tickets/${a.ticketId}` : undefined} className="activity-item"><div className={`activity-bullet ${a.action === 'STATUS' ? 'green' : 'purple'}`}>{a.action === 'STATUS' ? <RefreshCw size={17}/> : a.action === 'ASSIGNED' ? <Users size={17}/> : <TrendingUp size={17}/>}</div><div><strong>Ticket #T-{String(a.ticketId).padStart(4, '0')} {a.action?.toLowerCase()}</strong><p>{activityDescription(a, activityUsers)}</p><small>{a.userName || 'Unknown user'} · {formatDateTime(a.createdAt)}</small></div></ActivityLink>)}</div> : !activityError && <EmptyState title="No recent activity" detail="Ticket updates will appear here."/>}
        </Panel>
      </div>
    </>}
  </>
}
