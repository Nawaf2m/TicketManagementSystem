import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, ArrowLeft, ArrowUpRight, CheckCircle2, Download, FileText, MessageSquare, Paperclip, RefreshCw, Send, Shield, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { Badge, EmptyState, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { activityDescription, assignedAgent, formatDateTime, messageFromError, ticketOwner } from '../utils/data'
import { ticketListPermissions } from '../utils/permissions'

export default function TicketDetailPage() {
  const { id } = useParams()
  const { hasPermission, hasAnyPermission, user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [activities, setActivities] = useState([])
  const [agents, setAgents] = useState([])
  const [comment, setComment] = useState('')
  const [agentId, setAgentId] = useState('')
  const [priority, setPriority] = useState('LOW')
  const [error, setError] = useState('')
  const [sectionErrors, setSectionErrors] = useState({})
  const [commentError, setCommentError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [activityUsers, setActivityUsers] = useState([])
  const loadVersion = useRef(0)
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const uploadRef = useRef(null)

  async function load() {
    const version = ++loadVersion.current
    setLoading(true); setError(''); setSectionErrors({})
    try {
      if (!hasPermission('TICKET_VIEW')) { setTicket(null); return }
      const results = await Promise.allSettled([
        api.get(paths.ticketById(id)),
        hasPermission('COMMENT_VIEW') ? getList(paths.comments(id)) : Promise.resolve([]),
        hasPermission('ATTACHMENT_VIEW') ? getList(paths.attachments(id)) : Promise.resolve([]),
        hasPermission('ACTIVITY_VIEW') ? getList(paths.activities(id)) : Promise.resolve([]),
        hasPermission('TICKET_ASSIGN') && hasPermission('USER_VIEW') ? getList(paths.users) : Promise.resolve([]),
      ])
      if (version !== loadVersion.current) return
      if (results[0].status === 'rejected') throw results[0].reason
      const info = results[0].value.data
      setTicket(info)
      setPriority(info.priority || 'LOW')
      setAgentId(String(assignedAgent(info) || ''))
      const errors = {}
      const sections = ['comments', 'attachments', 'activities', 'agents']
      results.slice(1).forEach((result, index) => {
        if (result.status === 'rejected') errors[sections[index]] = messageFromError(result.reason)
      })
      setSectionErrors(errors)
      setComments(results[1].status === 'fulfilled' ? results[1].value : [])
      setAttachments(results[2].status === 'fulfilled' ? results[2].value : [])
      setActivities(results[3].status === 'fulfilled' ? results[3].value : [])
      const allUsers = results[4].status === 'fulfilled' ? results[4].value : []
      setActivityUsers(allUsers.length ? allUsers : info.assignedToName ? [{ id: info.assignedToId, name: info.assignedToName }] : [])
      setAgents(allUsers.filter(u => u.roleName === 'AGENT' && u.active === true))
    } catch (err) {
      if (version === loadVersion.current) { setTicket(null); setError(messageFromError(err)) }
    } finally { if (version === loadVersion.current) setLoading(false) }
  }
  useEffect(() => {
    setComment(''); setCommentError(''); setUploadError(''); setSuccess('')
    load()
    return () => { loadVersion.current++ }
  }, [id, hasPermission])
  async function update(permission, action, successMessage, reportError = setError) {
    if (!hasPermission(permission) || saving) return false
    setSaving(true); reportError(''); setSuccess('')
    try { await action(); setSuccess(successMessage); await load(); return true }
    catch (err) { reportError(messageFromError(err)); return false }
    finally { setSaving(false) }
  }
  async function submitComment(e) {
    e.preventDefault()
    if (!comment.trim() || saving || !canComment) return
    const saved = await update('COMMENT_CREATE', () => api.post(paths.addComment(id), { comment: comment.trim() }), 'Comment added successfully.', setCommentError)
    if (saved) setComment('')
  }
  async function uploadFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || saving || !canUpload) return
    setUploadError('')
    if (file.size > 5 * 1024 * 1024) { setUploadError('Maximum file size is 5MB.'); return }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { setUploadError('Only JPG, PNG and PDF files are allowed.'); return }
    const body = new FormData(); body.append('file', file)
    await update('ATTACHMENT_UPLOAD', () => api.post(paths.uploadAttachment(id), body), 'File uploaded successfully.', setUploadError)
  }
  async function downloadFile(a) {
    if (!hasPermission('ATTACHMENT_DOWNLOAD')) return
    try {
      const result = await api.get(paths.downloadAttachment(a.id), {responseType: 'blob'})
      const url = URL.createObjectURL(result.data); const link = document.createElement('a'); link.href = url; link.download = a.fileName || a.file_name || `attachment-${a.id}`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try { err.response.data = JSON.parse(await err.response.data.text()) } catch { /* Use the HTTP error message. */ }
      }
      setUploadError(messageFromError(err))
    }
  }
  const isAssigned = ticket && String(assignedAgent(ticket)) === String(user?.id)
  const inScope = ticket && (hasPermission('TICKET_VIEW_ALL') || isAssigned || String(ticketOwner(ticket)) === String(user?.id))
  const nextStatus = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED' }[ticket?.status]
  const canAdvance = hasPermission('TICKET_UPDATE_STATUS') && Boolean(nextStatus) && (hasPermission('TICKET_VIEW_ALL') || isAssigned)
  const mutable = ['OPEN', 'IN_PROGRESS'].includes(ticket?.status)
  const canAssign = hasPermission('TICKET_ASSIGN') && mutable
  const canPriority = hasPermission('TICKET_UPDATE_PRIORITY') && mutable
  const canCollaborate = inScope && ticket.status !== 'CLOSED'
  const canComment = hasPermission('COMMENT_CREATE') && canCollaborate
  const canUpload = hasPermission('ATTACHMENT_UPLOAD') && canCollaborate
  return <><PageHeading eyebrow="TICKET DETAILS" title={`Ticket #T-${String(id).padStart(4, '0')}`} description="Review request details, history, and collaboration." actions={<>{hasAnyPermission(...ticketListPermissions, 'TICKET_CREATE') && <Link to="/tickets" className="btn btn-ghost"><ArrowLeft size={17}/> All tickets</Link>}<button className="btn btn-outline" onClick={load}><RefreshCw size={17}/> Refresh</button></>}/><Notice>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>{loading ? <Spinner/> : ticket ? <>
    <div className="ticket-detail-top"><div><h2>{ticket.title}</h2><p>{ticket.description}</p><div className="ticket-metadata"><span><FileText size={16}/> Created {formatDateTime(ticket.createdAt || ticket.created_at)}</span><span>
  <UserRound size={16}/>
  Requester: {ticket.createdByName || 'Unknown'}
</span>

<span>
  <Shield size={16}/>
  Agent: {ticket.assignedToName || 'Unassigned'}
</span></div></div><div className="ticket-labels"><Badge value={ticket.status}/><Badge type="priority" value={ticket.priority}/></div></div>
    <div className="detail-grid"><div className="detail-main">
      {(canAssign || canPriority || canAdvance) && <Panel title="Manage Ticket" subtitle="Update the support workflow" icon={CheckCircle2}><div className="management-actions">{canAdvance && nextStatus && <button className="btn btn-primary" disabled={saving} onClick={() => update('TICKET_UPDATE_STATUS', () => api.patch(paths.advanceTicket(id)), `Ticket advanced to ${nextStatus}.`)}>Move to {nextStatus.replaceAll('_',' ')} <ArrowUpRight size={17}/></button>}{canAssign && <><Notice>{sectionErrors.agents}</Notice><div className="inline-control"><label>Assign agent</label><select value={agentId} onChange={e => setAgentId(e.target.value)}><option value="">Choose agent</option>{agents.map(agent => (
  <option key={agent.id} value={agent.id}>
    {agent.name}
  </option>
))}</select><button className="btn btn-outline" disabled={saving || !agents.some(agent => String(agent.id) === agentId) || agentId === String(assignedAgent(ticket))} onClick={() => update('TICKET_ASSIGN', () => api.patch(paths.assignTicket(id, agentId)), 'Agent assigned successfully.')}>Assign</button></div>{!hasPermission('USER_VIEW') && <p className="small-muted">Viewing assignment choices requires permission to view users.</p>}</>}{canPriority && <div className="inline-control"><label>Priority</label><select value={priority} onChange={e => setPriority(e.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select><button className="btn btn-outline" disabled={saving || priority === ticket.priority} onClick={() => update('TICKET_UPDATE_PRIORITY', () => api.patch(paths.changePriority(id, priority)), 'Priority updated successfully.')}>Update</button></div>}</div></Panel>}
      {hasAnyPermission('COMMENT_VIEW', 'COMMENT_CREATE') && <Panel title="Discussion" subtitle="Comments and updates from the team" icon={MessageSquare}><Notice>{sectionErrors.comments}</Notice>{hasPermission('COMMENT_VIEW') && <div className="comments-list">{comments.length ? comments.map(c => <div className="comment" key={c.commentId}><div className="small-avatar">{String(c.userName || c.user?.name || 'U').slice(0, 2).toUpperCase()}</div><div className="comment-content"><div className="comment-title"><strong>{c.userName || c.user?.name || 'Unknown user'}</strong><small>{formatDateTime(c.createdAt)}</small></div><p>{c.comment}</p></div></div>) : !sectionErrors.comments && <EmptyState title="No comments yet" detail="Be the first to add an update."/>}</div>}{canComment && <form className="comment-form" onSubmit={submitComment}><Notice>{commentError}</Notice><textarea disabled={saving} required maxLength={1000} rows={3} placeholder="Write a comment..." value={comment} onChange={e => setComment(e.target.value)}/><button type="submit" className="btn btn-primary" disabled={saving || !comment.trim()}><Send size={17}/> Post comment</button></form>}</Panel>}
      {hasAnyPermission('ATTACHMENT_VIEW', 'ATTACHMENT_UPLOAD') && <Panel title="Attachments" subtitle="Files shared for this ticket (JPG, PNG, PDF · max 5MB)" icon={Paperclip}><Notice>{sectionErrors.attachments || uploadError}</Notice>{hasPermission('ATTACHMENT_VIEW') && <div className="attachments-list">{attachments.map(a => <div className="attachment" key={a.id}><FileText size={20}/><span>{a.fileName || a.file_name || `Attachment #${a.id}`}</span>{hasPermission('ATTACHMENT_DOWNLOAD') && <button className="icon-button" title="Download" onClick={() => downloadFile(a)}><Download size={18}/></button>}</div>)}{!attachments.length && !sectionErrors.attachments && <p className="small-muted">No files attached yet.</p>}</div>}{canUpload && <><input ref={uploadRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={uploadFile}/><button className="btn btn-outline" disabled={saving} onClick={() => uploadRef.current?.click()}><Paperclip size={17}/> Upload File</button></>}</Panel>}
    </div><div className="detail-side">{hasPermission('ACTIVITY_VIEW') && <Panel title="Activity History" subtitle="Changes recorded for this ticket" icon={Activity}><Notice>{sectionErrors.activities}</Notice>{activities.length ? <div className="activity-list">{activities.map(a => <div className="activity-item" key={a.id}><div className={`activity-bullet ${a.action === 'STATUS' ? 'green' : 'purple'}`}><Activity size={17}/></div><div><strong>{a.action}</strong><p>{activityDescription(a, activityUsers)}</p><small>{a.userName || 'Unknown user'} · {formatDateTime(a.createdAt)}</small></div></div>)}</div> : !sectionErrors.activities && <EmptyState title="No activity yet" detail="Changes will be logged here."/>}</Panel>}</div></div>
  </> : <EmptyState title="Ticket not found" detail="You may not have access to this ticket."/>}</>
}
