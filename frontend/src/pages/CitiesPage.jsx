import { useCallback, useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { messageFromError } from '../utils/data'

export default function CitiesPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('CITY_VIEW')
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [name, setName] = useState('')

  const load = useCallback(async () => {
    if (!canView) { setCities([]); return }
    setLoading(true); setError('')
    try { setCities(await getList(paths.cities)) }
    catch (err) { setCities([]); setError(messageFromError(err)) }
    finally { setLoading(false) }
  }, [canView])
  useEffect(() => { load() }, [load])

  function open(city = null) {
    if (!hasPermission(city ? 'CITY_UPDATE' : 'CITY_CREATE')) return
    setFormError(''); setName(city?.name || ''); setModal({ type: city ? 'edit' : 'create', city })
  }
  function close() { if (!saving) { setModal(null); setFormError('') } }
  async function save(event) {
    event.preventDefault()
    const editing = modal?.type === 'edit'
    if (saving || !hasPermission(editing ? 'CITY_UPDATE' : 'CITY_CREATE')) return
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length > 30) { setFormError('City name is required and must be at most 30 characters.'); return }
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      if (editing) await api.patch(paths.updateCityName(modal.city.id), { name: trimmedName })
      else await api.post(paths.addCity, { name: trimmedName })
      setModal(null); setSuccess(editing ? 'City name updated.' : 'City created.')
      if (canView) await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function remove() {
    if (saving || !hasPermission('CITY_DELETE') || modal?.type !== 'delete') return
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      await api.delete(paths.deleteCity(modal.city.id))
      setModal(null); setSuccess('City deleted.'); await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  const query = search.trim().toLowerCase()
  const filtered = cities.filter(city => String(city.name ?? '').toLowerCase().includes(query))

  return <>
    <PageHeading eyebrow="ORGANIZATION" title="City Management" description="Manage city names." actions={<>{canView && <button className="btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={17}/> Refresh</button>}{hasPermission('CITY_CREATE') && <button className="btn btn-primary" onClick={() => open()}><Plus size={18}/> Add City</button>}</>}/>
    <Notice onDismiss={() => setError('')}>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>
    {canView && <Panel title="Cities" subtitle={`${cities.length} cities`} icon={MapPin}>
      <div className="filters-row"><label className="inline-search"><Search size={17}/><input aria-label="Search cities" placeholder="Search by name..." value={search} onChange={event => setSearch(event.target.value)}/></label></div>
      {loading ? <Spinner/> : error ? <EmptyState title="Unable to load cities" detail="Try refreshing the list."/> : filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>City Name</th><th>Actions</th></tr></thead><tbody>{filtered.map(city => <tr key={city.id}><td className="id-cell">{city.id}</td><td>{city.name}</td><td>{hasPermission('CITY_UPDATE') && <button className="icon-button" aria-label={`Edit ${city.name}`} title="Edit" onClick={() => open(city)}><Pencil size={17}/></button>}{hasPermission('CITY_DELETE') && <button className="icon-button danger-hover" aria-label={`Delete ${city.name}`} title="Delete" onClick={() => { setFormError(''); setModal({ type: 'delete', city }) }}><Trash2 size={17}/></button>}</td></tr>)}</tbody></table></div> : <EmptyState title={query ? 'No matching cities' : 'No cities yet'} detail={query ? 'Try a different name.' : 'Cities will appear here when added.'}/>}
    </Panel>}
    {modal && hasPermission(modal.type === 'delete' ? 'CITY_DELETE' : modal.type === 'edit' ? 'CITY_UPDATE' : 'CITY_CREATE') && <Modal title={modal.type === 'delete' ? 'Delete City' : modal.type === 'edit' ? 'Edit City Name' : 'New City'} onClose={close}>
      {modal.type === 'delete' ? <div className="modal-form"><Notice>{formError}</Notice><p>Delete city "{modal.city.name}"?</p><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button type="button" className="btn btn-primary" onClick={remove} disabled={saving}>{saving ? 'Deleting...' : 'Delete City'}</button></div></div> : <form className="modal-form" onSubmit={save}><Notice>{formError}</Notice><label className="field"><span>City Name</span><input required maxLength={30} value={name} onChange={event => setName(event.target.value)} /></label><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save City'}</button></div></form>}
    </Modal>}
  </>
}
