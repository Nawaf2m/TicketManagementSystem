import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Monitor, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { messageFromError } from '../utils/data'

const statuses = ['NEW', 'PROCESSING', 'INSTALLED', 'PULLED_OUT', 'BROKEN']
const display = value => value == null || value === '' ? '—' : String(value)

export default function TerminalsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('TERMINAL_VIEW')
  const canViewBanks = hasPermission('BANK_VIEW')
  const [terminals, setTerminals] = useState([])
  const [banks, setBanks] = useState([])
  const [bankError, setBankError] = useState('')
  const [banksLoading, setBanksLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [modal, setModal] = useState(null)
  const [bankId, setBankId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [bankFilter, setBankFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchType, setSearchType] = useState('number')
  const [search, setSearch] = useState('')
  const [lookup, setLookup] = useState(null)
  const requestId = useRef(0)

  const loadBanks = useCallback(async () => {
    if (!canViewBanks) { setBanks([]); return }
    setBanksLoading(true); setBankError('')
    try { setBanks(await getList(paths.banks)) }
    catch (err) { setBanks([]); setBankError(messageFromError(err)) }
    finally { setBanksLoading(false) }
  }, [canViewBanks])
  useEffect(() => { if (canView && canViewBanks) loadBanks() }, [canView, canViewBanks, loadBanks])

  const load = useCallback(async () => {
    const request = ++requestId.current
    if (!canView) { setTerminals([]); setLoading(false); return }
    setLoading(true); setError('')
    try {
      let result
      if (lookup) {
        const { data } = await api.get(lookup.type === 'number' ? paths.terminalByNumber(lookup.value) : paths.terminalByFullNumber(lookup.value))
        result = [data]
      } else {
        const url = bankFilter ? paths.terminalsByBank(bankFilter) : statusFilter ? paths.terminalsByStatus(statusFilter) : paths.terminals
        result = await getList(url)
        if (bankFilter && statusFilter) result = result.filter(terminal => terminal.status === statusFilter)
      }
      if (request === requestId.current) setTerminals(result)
    } catch (err) {
      if (request === requestId.current) { setTerminals([]); setError(messageFromError(err)) }
    } finally { if (request === requestId.current) setLoading(false) }
  }, [canView, bankFilter, statusFilter, lookup])
  useEffect(() => { load(); return () => { requestId.current++ } }, [load])

  function openCreate() {
    if (!hasPermission('TERMINAL_CREATE')) return
    setFormError(''); setBankId(''); setQuantity('1'); setModal({ type: 'create' })
    if (canViewBanks) loadBanks()
  }
  function close() { if (!saving) { setModal(null); setFormError('') } }
  async function create(event) {
    event.preventDefault()
    if (saving || !hasPermission('TERMINAL_CREATE') || !canViewBanks) return
    if (!banks.some(bank => String(bank.id) === bankId)) { setFormError('Select an available bank.'); return }
    if (!/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 1000) { setFormError('Quantity must be a whole number from 1 to 1000.'); return }
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      const { data } = await api.post(paths.createTerminals(bankId, Number(quantity)))
      setModal(null); setSuccess(data?.message || 'Terminals created successfully.')
      if (canView) await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function remove() {
    if (saving || !canView || !hasPermission('TERMINAL_DELETE') || modal?.terminal?.status !== 'NEW') return
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      const { data } = await api.delete(paths.deleteTerminal(modal.terminal.id))
      setModal(null); setSuccess(data?.message || 'Terminal deleted successfully.')
      if (lookup) { setLookup(null); setSearch('') } else await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  function find(event) {
    event.preventDefault()
    const value = search.trim()
    const length = searchType === 'number' ? 8 : 16
    if (!new RegExp(`^\\d{${length}}$`).test(value)) { setError(`Enter exactly ${length} digits for an exact lookup.`); return }
    setBankFilter(''); setStatusFilter(''); setLookup({ type: searchType, value })
  }
  function changeBank(value) { setLookup(null); setSearch(''); setBankFilter(value) }
  function changeStatus(value) { setLookup(null); setSearch(''); setStatusFilter(value) }
  const modalPermission = modal?.type === 'create' ? 'TERMINAL_CREATE' : modal?.type === 'delete' ? 'TERMINAL_DELETE' : 'TERMINAL_VIEW'
  const details = modal?.terminal

  return <>
    <PageHeading eyebrow="ORGANIZATION" title="Terminal Management" description="View and manage terminals." actions={<>{canView && <button className="btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={17}/> Refresh</button>}{hasPermission('TERMINAL_CREATE') && <button className="btn btn-primary" onClick={openCreate}><Plus size={18}/> Create Terminals</button>}</>}/>
    <Notice onDismiss={() => setError('')}>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>
    {!canView && <p className="subdued">TERMINAL_VIEW permission is required to view existing terminals.</p>}
    {canView && <Panel title="Terminals" subtitle={`${terminals.length} terminals`} icon={Monitor}>
      <form className="filters-row" onSubmit={find}><label className="filter-set"><span className="small-muted">Exact lookup</span><select aria-label="Terminal search type" value={searchType} onChange={event => setSearchType(event.target.value)}><option value="number">Terminal number</option><option value="full">Full terminal number</option></select></label><label className="inline-search"><Search size={17}/><input aria-label="Exact terminal number" inputMode="numeric" value={search} onChange={event => setSearch(event.target.value)} placeholder="Enter exact number..."/></label><button className="btn btn-primary">Search</button>{lookup && <button type="button" className="btn btn-ghost" onClick={() => { setLookup(null); setSearch('') }}>Clear search</button>}</form>
      <div className="filters-row">{canViewBanks ? <label className="filter-set"><span>Bank</span><select aria-label="Filter by bank" value={bankFilter} disabled={banksLoading || !!bankError} onChange={event => changeBank(event.target.value)}><option value="">All Banks</option>{banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name}{bank.code != null ? ` (${bank.code})` : ''}</option>)}</select></label> : <span className="small-muted">BANK_VIEW permission is required to filter by bank.</span>}<label className="filter-set"><span>Status</span><select aria-label="Filter by status" value={statusFilter} onChange={event => changeStatus(event.target.value)}><option value="">All Statuses</option>{statuses.map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label></div>
      {bankError && <Notice>{bankError}</Notice>}
      {loading ? <Spinner/> : error ? <EmptyState title="Unable to load terminals" detail="Check the message above or refresh the list."/> : terminals.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Terminal Number</th><th>Full Terminal Number</th><th>Status</th><th>Bank</th><th>Merchant</th><th>Device</th><th>SIM Card</th><th>Actions</th></tr></thead><tbody>{terminals.map(terminal => <tr key={terminal.id}><td className="id-cell">{display(terminal.id)}</td><td>{display(terminal.terminalNumber)}</td><td>{display(terminal.fullTerminalNumber)}</td><td><span className="badge badge-purple">{display(terminal.status)}</span></td><td>{display(terminal.bankName)}</td><td>{display(terminal.merchantName)}</td><td>{display(terminal.deviceModel)}</td><td>{display(terminal.simCardModel)}</td><td><button className="icon-button" aria-label={`View ${display(terminal.terminalNumber)}`} title="View details" onClick={() => { setFormError(''); setModal({ type: 'details', terminal }) }}><Eye size={17}/></button>{hasPermission('TERMINAL_DELETE') && terminal.status === 'NEW' && <button className="icon-button danger-hover" aria-label={`Delete ${display(terminal.terminalNumber)}`} title="Delete" onClick={() => { setFormError(''); setModal({ type: 'delete', terminal }) }}><Trash2 size={17}/></button>}</td></tr>)}</tbody></table></div> : <EmptyState title="No terminals found" detail="Terminals matching your selection will appear here."/>}
    </Panel>}
    {modal && hasPermission(modalPermission) && (modal.type === 'create' || canView) && <Modal title={modal.type === 'create' ? 'Create Terminals' : modal.type === 'delete' ? 'Delete Terminal' : 'Terminal Details'} onClose={close}>
      {modal.type === 'create' ? <form className="modal-form" onSubmit={create}><Notice>{formError}</Notice>{!canViewBanks ? <Notice>BANK_VIEW permission is required to select a bank.</Notice> : <><Notice>{bankError}</Notice>{banksLoading ? <Spinner label="Loading banks..."/> : <label className="field"><span>Bank</span><select required value={bankId} onChange={event => setBankId(event.target.value)}><option value="">{banks.length ? 'Select a bank' : 'No banks available'}</option>{banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name}{bank.code != null ? ` (${bank.code})` : ''}</option>)}</select></label>}</>}<label className="field"><span>Quantity</span><input type="number" min="1" max="1000" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)}/></label><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving || !canViewBanks || banksLoading || !!bankError || !banks.length}>{saving ? 'Creating...' : 'Create Terminals'}</button></div></form> : modal.type === 'delete' ? <div className="modal-form"><Notice>{formError}</Notice><p>Delete terminal "{display(details.terminalNumber)}"?</p><div className="modal-actions"><button className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={remove} disabled={saving}>{saving ? 'Deleting...' : 'Delete Terminal'}</button></div></div> : <div className="modal-form">{[['ID', details.id], ['Terminal Number', details.terminalNumber], ['Full Terminal Number', details.fullTerminalNumber], ['Status', details.status], ['Bank', details.bankName], ['Merchant', details.merchantName], ['Device Model', details.deviceModel], ['Device Serial Number', details.deviceSerialNumber], ['SIM Card Model', details.simCardModel], ['SIM Card Serial Number', details.simCardSerialNumber]].map(([label, value]) => <div key={label}><strong>{label}: </strong>{display(value)}</div>)}<div className="modal-actions"><button className="btn btn-ghost" onClick={close}>Close</button></div></div>}
    </Modal>}
  </>
}
