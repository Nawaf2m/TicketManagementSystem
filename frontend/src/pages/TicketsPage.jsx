import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Filter, Plus, RefreshCw, Search, Ticket } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { Badge, EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { formatDate, messageFromError } from '../utils/data'

const defaultForm = { title: '', description: '', priority: 'LOW' }

export default function TicketsPage() {
  const { hasPermission } = useAuth()
  const views = [
    ...(hasPermission('TICKET_VIEW_ALL') ? [{ key: 'all', label: 'All tickets', url: paths.tickets }] : []),
    ...(hasPermission('TICKET_VIEW_ASSIGNED') ? [{ key: 'assigned', label: 'Assigned tickets', url: paths.assignedTickets }] : []),
    ...(hasPermission('TICKET_VIEW_OWN') ? [{ key: 'mine', label: 'My created tickets', url: paths.myTickets }] : []),
  ]
  const canCreate = hasPermission('TICKET_CREATE')
  const canViewTicket = hasPermission('TICKET_VIEW')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState(params.get('q') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [showCreate, setShowCreate] = useState(canCreate && params.get('create') === '1')
  const [view, setView] = useState(views[0]?.key || '')
  const loadVersion = useRef(0)

  async function load(viewName = view) {
    const version = ++loadVersion.current
    setLoading(true); setError('')
    try {
      const selectedView = views.find(item => item.key === viewName) || views[0]
      const result = selectedView ? await getList(selectedView.url) : []
      if (version === loadVersion.current) setTickets(result)
    } catch (err) {
      if (version === loadVersion.current) { setTickets([]); setError(messageFromError(err)) }
    } finally { if (version === loadVersion.current) setLoading(false) }
  }
  useEffect(() => { load(); return () => { loadVersion.current++ } }, [hasPermission, view])
  useEffect(() => { if (canCreate && params.get('create') === '1') setShowCreate(true); setQuery(params.get('q') || '') }, [params, canCreate])
  const visibleTickets = useMemo(() => tickets.filter(t => (filter === 'ALL' || t.status === filter) && (!query || [String(t.id), t.title, t.description].join(' ').toLowerCase().includes(query.toLowerCase()))), [tickets, filter, query])
  function closeCreate() { if (saving) return; finishCreate() }
  function finishCreate() { setShowCreate(false); setParams(current => {current.delete('create'); return current}); setFormError('') }
  async function createTicket(e) {
    e.preventDefault(); if (saving || !canCreate) return; setFormError(''); if (form.title.trim().length < 5 || !form.description.trim()) {setFormError('Enter a title of at least 5 characters and a description.'); return} setSaving(true)
    try { await api.post(paths.addTicket, {...form, title: form.title.trim(), description: form.description.trim()}); finishCreate(); setForm(defaultForm); await load() }
    catch (err) { setFormError(messageFromError(err)) } finally { setSaving(false) }
  }
  return <>
    <PageHeading eyebrow="SUPPORT REQUESTS" title="Tickets" description="Create, track, and manage support tickets from one place." actions={<><button className="btn btn-ghost" onClick={() => load()}><RefreshCw size={17}/> Refresh</button>{canCreate && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={18}/> Create Ticket</button>}</>}/>
    <Notice>{error}</Notice>
    {views.length > 0 && <Panel title="All Support Tickets" subtitle={`${visibleTickets.length} ticket${visibleTickets.length !== 1 ? 's' : ''} shown`} icon={Ticket}>
      <div className="filters-row"><div className="inline-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title or ticket ID..."/></div><div className="filter-set"><Filter size={17}/><select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></div>{views.length > 1 && <div className="filter-set"><select value={view} onChange={e => setView(e.target.value)}>{views.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></div>}</div>
      {loading ? <Spinner/> : visibleTickets.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Ticket ID</th><th>Subject</th><th>Priority</th><th>Status</th><th>Created</th><th/></tr></thead><tbody>{visibleTickets.map(t => <tr key={t.id} className={canViewTicket ? "clickable-row" : undefined} onClick={canViewTicket ? () => navigate(`/tickets/${t.id}`) : undefined}><td className="id-cell">#T-{String(t.id).padStart(4, '0')}</td><td><strong className="table-title">{t.title}</strong><span className="table-description">{t.description}</span></td><td><Badge type="priority" value={t.priority}/></td><td><Badge value={t.status}/></td><td className="date-cell">{formatDate(t.createdAt || t.created_at)}</td><td>{canViewTicket && <ArrowRight size={17} className="table-arrow"/>}</td></tr>)}</tbody></table></div> : <EmptyState title="No matching tickets" detail="Try changing your filter, or create a new support ticket."/>}
    </Panel>}
    {showCreate && canCreate && <Modal title="Create New Ticket" onClose={closeCreate}><form className="modal-form" onSubmit={createTicket}><p className="subdued">Describe the issue and assign a priority.</p><Notice>{formError}</Notice><label className="field"><span>Ticket title</span><input required minLength={5} maxLength={30} value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} placeholder="e.g. Unable to access company account"/></label><label className="field"><span>Description</span><textarea required maxLength={300} rows={5} value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} placeholder="Describe the issue in detail..."/></label><label className="field"><span>Priority</span><select value={form.priority} onChange={e => setForm(p => ({...p,priority:e.target.value}))}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={closeCreate} disabled={saving}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Ticket'} <Plus size={17}/></button></div></form></Modal>}
  </>
}
