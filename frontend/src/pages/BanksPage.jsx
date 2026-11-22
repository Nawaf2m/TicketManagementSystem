import { useCallback, useEffect, useState } from 'react'
import { Landmark, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { messageFromError } from '../utils/data'

export default function BanksPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('BANK_VIEW')
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const load = useCallback(async () => {
    if (!canView) { setBanks([]); return }
    setLoading(true); setError('')
    try { setBanks(await getList(paths.banks)) }
    catch (err) { setBanks([]); setError(messageFromError(err)) }
    finally { setLoading(false) }
  }, [canView])
  useEffect(() => { load() }, [load])

  function open(bank = null) {
    if (!hasPermission(bank ? 'BANK_UPDATE' : 'BANK_CREATE')) return
    setFormError(''); setName(bank?.name || ''); setCode(bank?.code ?? ''); setModal({ type: bank ? 'edit' : 'create', bank })
  }
  function close() { if (!saving) { setModal(null); setFormError('') } }
  async function save(event) {
    event.preventDefault()
    const editing = modal?.type === 'edit'
    if (saving || !hasPermission(editing ? 'BANK_UPDATE' : 'BANK_CREATE')) return
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length > 30) { setFormError('Bank name is required and must be at most 30 characters.'); return }
    if (!editing && !/^[0-9]$/.test(code)) { setFormError('Bank code must be exactly one digit from 0 to 9.'); return }
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      if (editing) await api.patch(paths.updateBankName(modal.bank.id), { name: trimmedName })
      else await api.post(paths.addBank, { name: trimmedName, code })
      setModal(null); setSuccess(editing ? 'Bank name updated.' : 'Bank created.')
      if (canView) await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function remove() {
    if (saving || !hasPermission('BANK_DELETE') || modal?.type !== 'delete') return
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      await api.delete(paths.deleteBank(modal.bank.id))
      setModal(null); setSuccess('Bank deleted.'); await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  const query = search.trim().toLowerCase()
  const filtered = banks.filter(bank => String(bank.name ?? '').toLowerCase().includes(query) || String(bank.code ?? '').toLowerCase().includes(query))

  return <>
    <PageHeading eyebrow="ORGANIZATION" title="Bank Management" description="Manage bank names and codes." actions={<>{canView && <button className="btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={17}/> Refresh</button>}{hasPermission('BANK_CREATE') && <button className="btn btn-primary" onClick={() => open()}><Plus size={18}/> Add Bank</button>}</>}/>
    <Notice onDismiss={() => setError('')}>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>
    {canView && <Panel title="Banks" subtitle={`${banks.length} banks`} icon={Landmark}>
      <div className="filters-row"><label className="inline-search"><Search size={17}/><input aria-label="Search banks" placeholder="Search by name or code..." value={search} onChange={event => setSearch(event.target.value)}/></label></div>
      {loading ? <Spinner/> : error ? <EmptyState title="Unable to load banks" detail="Try refreshing the list."/> : filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Bank Name</th><th>Bank Code</th><th>Actions</th></tr></thead><tbody>{filtered.map(bank => <tr key={bank.id}><td className="id-cell">{bank.id}</td><td>{bank.name}</td><td>{bank.code}</td><td>{hasPermission('BANK_UPDATE') && <button className="icon-button" aria-label={`Edit ${bank.name}`} title="Edit" onClick={() => open(bank)}><Pencil size={17}/></button>}{hasPermission('BANK_DELETE') && <button className="icon-button danger-hover" aria-label={`Delete ${bank.name}`} title="Delete" onClick={() => { setFormError(''); setModal({ type: 'delete', bank }) }}><Trash2 size={17}/></button>}</td></tr>)}</tbody></table></div> : <EmptyState title={query ? 'No matching banks' : 'No banks yet'} detail={query ? 'Try a different name or code.' : 'Banks will appear here when added.'}/>}
    </Panel>}
    {modal && hasPermission(modal.type === 'delete' ? 'BANK_DELETE' : modal.type === 'edit' ? 'BANK_UPDATE' : 'BANK_CREATE') && <Modal title={modal.type === 'delete' ? 'Delete Bank' : modal.type === 'edit' ? 'Edit Bank Name' : 'New Bank'} onClose={close}>
      {modal.type === 'delete' ? <div className="modal-form"><Notice>{formError}</Notice><p>Delete bank "{modal.bank.name}"?</p><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button type="button" className="btn btn-primary" onClick={remove} disabled={saving}>{saving ? 'Deleting...' : 'Delete Bank'}</button></div></div> : <form className="modal-form" onSubmit={save}><Notice>{formError}</Notice><label className="field"><span>Bank Name</span><input required maxLength={30} value={name} onChange={event => setName(event.target.value)} /></label>{modal.type === 'create' && <label className="field"><span>Bank Code</span><input required maxLength={1} inputMode="numeric" pattern="[0-9]" value={code} onChange={event => setCode(event.target.value)} /></label>}<div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Bank'}</button></div></form>}
    </Modal>}
  </>
}
