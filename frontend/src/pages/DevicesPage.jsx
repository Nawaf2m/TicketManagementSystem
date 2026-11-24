import { useCallback, useEffect, useState } from 'react'
import { Monitor, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { messageFromError, objectOf } from '../utils/data'

export default function DevicesPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('DEVICE_VIEW')
  const [devices, setDevices] = useState([])
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
    if (!canView) { setDevices([]); return }
    setLoading(true); setError(''); setExactResult(null)
    try { setDevices(await getList(paths.devices)) }
    catch (err) { setDevices([]); setError(messageFromError(err)) }
    finally { setLoading(false) }
  }, [canView])
  useEffect(() => { load() }, [load])

  function open(type, device = null) {
    const permission = type === 'create' ? 'DEVICE_CREATE' : type === 'edit' ? 'DEVICE_UPDATE' : 'DEVICE_DELETE'
    if (!hasPermission(permission) || (type !== 'create' && !canView)) return
    setFormError(''); setModel(device?.model ?? ''); setSerialNumber(device?.serialNumber ?? '')
    setModal({ type, device })
  }
  function close() { if (!saving) { setModal(null); setFormError('') } }
  async function save(event) {
    event.preventDefault()
    const editing = modal?.type === 'edit'
    if (saving || !modal || !hasPermission(editing ? 'DEVICE_UPDATE' : 'DEVICE_CREATE') || (editing && !canView)) return
    const values = { model: model.trim(), serialNumber: serialNumber.trim() }
    if (!values.model || values.model.length > 50) { setFormError('Device model is required and must be at most 50 characters.'); return }
    if (!values.serialNumber || values.serialNumber.length > 50) { setFormError('Serial number is required and must be at most 50 characters.'); return }
    if (editing && values.model === modal.device.model && values.serialNumber === modal.device.serialNumber) { setFormError('Enter different device data.'); return }
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      if (editing) await api.put(paths.updateDevice(modal.device.id), values)
      else await api.post(paths.addDevice, values)
      setModal(null); setSuccess(editing ? 'Device updated.' : 'Device created.')
      if (canView) await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function remove() {
    if (saving || !canView || !hasPermission('DEVICE_DELETE') || modal?.type !== 'delete') return
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try { await api.delete(paths.deleteDevice(modal.device.id)); setModal(null); setSuccess('Device deleted.'); await load() }
    catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function findExact(event) {
    event.preventDefault()
    const serial = search.trim()
    if (!canView || !serial || loading) return
    setLoading(true); setError(''); setExactResult(null)
    try { const { data } = await api.get(paths.deviceBySerialNumber(serial)); setExactResult([objectOf(data)]) }
    catch (err) { setError(messageFromError(err)); setExactResult([]) }
    finally { setLoading(false) }
  }
  const query = search.trim().toLowerCase()
  const filtered = exactResult ?? devices.filter(device => String(device.model ?? '').toLowerCase().includes(query) || String(device.serialNumber ?? '').toLowerCase().includes(query))
  const modalPermission = modal?.type === 'create' ? 'DEVICE_CREATE' : modal?.type === 'edit' ? 'DEVICE_UPDATE' : 'DEVICE_DELETE'

  return <>
    <PageHeading eyebrow="ORGANIZATION" title="Device Management" description="Manage physical POS devices." actions={<>{canView && <button className="btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={17}/> Refresh</button>}{hasPermission('DEVICE_CREATE') && <button className="btn btn-primary" onClick={() => open('create')}><Plus size={18}/> Add Device</button>}</>}/>
    <Notice onDismiss={() => setError('')}>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>
    {!canView && <p className="subdued">DEVICE_VIEW permission is required to view and manage existing devices.</p>}
    {canView && <Panel title="Devices" subtitle={`${devices.length} devices`} icon={Monitor}>
      <form className="filters-row" onSubmit={findExact}><label className="inline-search"><Search size={17}/><input aria-label="Search devices" placeholder="Search by model or serial number..." value={search} onChange={event => { setSearch(event.target.value); setExactResult(null); setError('') }}/></label><button className="btn btn-ghost" disabled={loading || !search.trim()}>Find exact serial number</button></form>
      {loading ? <Spinner/> : error && exactResult === null ? <EmptyState title="Unable to load devices" detail="Try refreshing the list."/> : filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Model</th><th>Serial Number</th><th>Actions</th></tr></thead><tbody>{filtered.map(device => <tr key={device.id}><td className="id-cell">{device.id}</td><td>{device.model}</td><td>{device.serialNumber}</td><td>{hasPermission('DEVICE_UPDATE') && <button className="icon-button" aria-label={`Edit ${device.serialNumber}`} title="Edit" onClick={() => open('edit', device)}><Pencil size={17}/></button>}{hasPermission('DEVICE_DELETE') && <button className="icon-button danger-hover" aria-label={`Delete ${device.serialNumber}`} title="Delete" onClick={() => open('delete', device)}><Trash2 size={17}/></button>}</td></tr>)}</tbody></table></div> : <EmptyState title={query ? 'No matching devices' : 'No devices yet'} detail={query ? 'Try a different model or serial number.' : 'Devices will appear here when added.'}/>}
    </Panel>}
    {modal && hasPermission(modalPermission) && (modal.type === 'create' || canView) && <Modal title={modal.type === 'delete' ? 'Delete Device' : modal.type === 'edit' ? 'Edit Device' : 'New Device'} onClose={close}>
      {modal.type === 'delete' ? <div className="modal-form"><Notice>{formError}</Notice><p>Delete device "{modal.device.serialNumber}"?</p><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button type="button" className="btn btn-primary" onClick={remove} disabled={saving}>{saving ? 'Deleting...' : 'Delete Device'}</button></div></div> : <form className="modal-form" onSubmit={save}><Notice>{formError}</Notice><label className="field"><span>Device Model</span><input required maxLength={50} value={model} onChange={event => setModel(event.target.value)}/></label><label className="field"><span>Serial Number</span><input required maxLength={50} value={serialNumber} onChange={event => setSerialNumber(event.target.value)}/></label><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Device'}</button></div></form>}
    </Modal>}
  </>
}
