import { useCallback, useEffect, useState } from 'react'
import { Smartphone, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { messageFromError, objectOf } from '../utils/data'

export default function SimCardsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('SIMCARD_VIEW')
  const [simCards, setSimCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [exactResult, setExactResult] = useState(null)
  const [modal, setModal] = useState(null)
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')

  const load = useCallback(async () => {
    if (!canView) { setSimCards([]); return }
    setLoading(true); setError(''); setExactResult(null)
    try { setSimCards(await getList(paths.simCards)) }
    catch (err) { setSimCards([]); setError(messageFromError(err)) }
    finally { setLoading(false) }
  }, [canView])
  useEffect(() => { load() }, [load])

  function open(type, simCard = null) {
    const permission = type === 'create' ? 'SIMCARD_CREATE' : type === 'edit' ? 'SIMCARD_UPDATE' : 'SIMCARD_DELETE'
    if (!hasPermission(permission) || (type !== 'create' && !canView)) return
    setFormError(''); setModel(simCard?.model ?? ''); setSerialNumber(simCard?.serialNumber ?? '')
    setModal({ type, simCard })
  }
  function close() { if (!saving) { setModal(null); setFormError('') } }
  async function save(event) {
    event.preventDefault()
    const editing = modal?.type === 'edit'
    if (saving || !modal || !hasPermission(editing ? 'SIMCARD_UPDATE' : 'SIMCARD_CREATE') || (editing && !canView)) return
    const values = { model: model.trim(), serialNumber: serialNumber.trim() }
    if (!values.model || values.model.length > 50) { setFormError('SimCard model is required and must be at most 50 characters.'); return }
    if (!values.serialNumber || values.serialNumber.length > 50) { setFormError('Serial number is required and must be at most 50 characters.'); return }
    if (editing && values.model === modal.simCard.model && values.serialNumber === modal.simCard.serialNumber) { setFormError('Enter different SimCard data.'); return }
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      if (editing) await api.put(paths.updateSimCard(modal.simCard.id), values)
      else await api.post(paths.addSimCard, values)
      setModal(null); setSuccess(editing ? 'SimCard updated.' : 'SimCard created.')
      if (canView) await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function remove() {
    if (saving || !canView || !hasPermission('SIMCARD_DELETE') || modal?.type !== 'delete') return
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try { await api.delete(paths.deleteSimCard(modal.simCard.id)); setModal(null); setSuccess('SimCard deleted.'); await load() }
    catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function findExact(event) {
    event.preventDefault()
    const serial = search.trim()
    if (!canView || !serial || loading) return
    setLoading(true); setError(''); setExactResult(null)
    try { const { data } = await api.get(paths.simCardBySerialNumber(serial)); setExactResult([objectOf(data)]) }
    catch (err) { setError(messageFromError(err)); setExactResult([]) }
    finally { setLoading(false) }
  }
  const query = search.trim().toLowerCase()
  const filtered = exactResult ?? simCards.filter(simCard => String(simCard.model ?? '').toLowerCase().includes(query) || String(simCard.serialNumber ?? '').toLowerCase().includes(query))
  const modalPermission = modal?.type === 'create' ? 'SIMCARD_CREATE' : modal?.type === 'edit' ? 'SIMCARD_UPDATE' : 'SIMCARD_DELETE'

  return <>
    <PageHeading eyebrow="ORGANIZATION" title="SimCard Management" description="Manage SIM cards." actions={<>{canView && <button className="btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={17}/> Refresh</button>}{hasPermission('SIMCARD_CREATE') && <button className="btn btn-primary" onClick={() => open('create')}><Plus size={18}/> Add SimCard</button>}</>}/>
    <Notice onDismiss={() => setError('')}>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>
    {!canView && <p className="subdued">SIMCARD_VIEW permission is required to view and manage existing SimCards.</p>}
    {canView && <Panel title="SimCards" subtitle={`${simCards.length} SimCards`} icon={Smartphone}>
      <form className="filters-row" onSubmit={findExact}><label className="inline-search"><Search size={17}/><input aria-label="Search SimCards" placeholder="Search by model or serial number..." value={search} disabled={loading} onChange={event => { setSearch(event.target.value); setExactResult(null); setError('') }}/></label><button className="btn btn-ghost" disabled={loading || !search.trim()}>Find exact serial number</button></form>
      {loading ? <Spinner/> : error && exactResult === null ? <EmptyState title="Unable to load simCards" detail="Try refreshing the list."/> : filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Model</th><th>Serial Number</th><th>Actions</th></tr></thead><tbody>{filtered.map(simCard => <tr key={simCard.id}><td className="id-cell">{simCard.id}</td><td>{simCard.model}</td><td>{simCard.serialNumber}</td><td>{hasPermission('SIMCARD_UPDATE') && <button className="icon-button" aria-label={`Edit ${simCard.serialNumber}`} title="Edit" onClick={() => open('edit', simCard)}><Pencil size={17}/></button>}{hasPermission('SIMCARD_DELETE') && <button className="icon-button danger-hover" aria-label={`Delete ${simCard.serialNumber}`} title="Delete" onClick={() => open('delete', simCard)}><Trash2 size={17}/></button>}</td></tr>)}</tbody></table></div> : <EmptyState title={query ? 'No matching simCards' : 'No simCards yet'} detail={query ? 'Try a different model or serial number.' : 'SimCards will appear here when added.'}/>}
    </Panel>}
    {modal && hasPermission(modalPermission) && (modal.type === 'create' || canView) && <Modal title={modal.type === 'delete' ? 'Delete SimCard' : modal.type === 'edit' ? 'Edit SimCard' : 'New SimCard'} onClose={close}>
      {modal.type === 'delete' ? <div className="modal-form"><Notice>{formError}</Notice><p>Delete simCard "{modal.simCard.serialNumber}"?</p><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button type="button" className="btn btn-primary" onClick={remove} disabled={saving}>{saving ? 'Deleting...' : 'Delete SimCard'}</button></div></div> : <form className="modal-form" onSubmit={save}><Notice>{formError}</Notice><label className="field"><span>SimCard Model</span><input required maxLength={50} value={model} onChange={event => setModel(event.target.value)}/></label><label className="field"><span>Serial Number</span><input required maxLength={50} value={serialNumber} onChange={event => setSerialNumber(event.target.value)}/></label><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save SimCard'}</button></div></form>}
    </Modal>}
  </>
}
