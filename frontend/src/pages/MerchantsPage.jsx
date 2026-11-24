import { useCallback, useEffect, useState } from 'react'
import { Store, MapPin, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { messageFromError } from '../utils/data'

export default function MerchantsPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('MERCHANT_VIEW')
  const canViewCities = hasPermission('CITY_VIEW')
  const [merchants, setMerchants] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [cityError, setCityError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [name, setName] = useState('')
  const [selectedCities, setSelectedCities] = useState([])
  const [cityId, setCityId] = useState('')
  const [removingCity, setRemovingCity] = useState(null)

  const load = useCallback(async () => {
    if (!canView) { setMerchants([]); return }
    setLoading(true); setError('')
    try { setMerchants(await getList(paths.merchants)) }
    catch (err) { setMerchants([]); setError(messageFromError(err)) }
    finally { setLoading(false) }
  }, [canView])
  useEffect(() => { load() }, [load])

  async function loadCities() {
    setCities([]); setCityError('')
    if (!canViewCities) { setCityError('CITY_VIEW permission is required to select cities.'); return }
    setCitiesLoading(true)
    try { setCities(await getList(paths.cities)) }
    catch (err) { setCityError(messageFromError(err)) }
    finally { setCitiesLoading(false) }
  }
  function open(type, merchant = null) {
    const permission = type === 'create' ? 'MERCHANT_CREATE' : type === 'delete' ? 'MERCHANT_DELETE' : 'MERCHANT_UPDATE'
    if (!hasPermission(permission) || (type !== 'create' && !canView)) return
    setFormError(''); setName(merchant?.name || ''); setSelectedCities([]); setCityId(''); setRemovingCity(null)
    setModal({ type, merchant })
    if (type === 'create' || type === 'cities') loadCities()
  }
  function close() { if (!saving) { setModal(null); setFormError(''); setRemovingCity(null) } }
  async function save(event) {
    event.preventDefault()
    const editing = modal?.type === 'edit'
    if (saving || !hasPermission(editing ? 'MERCHANT_UPDATE' : 'MERCHANT_CREATE')) return
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 100) { setFormError('Merchant name is required and must be at most 100 characters.'); return }
    if (editing && trimmed === modal.merchant.name) { setFormError('Enter a different merchant name.'); return }
    if (!editing && (!canViewCities || !selectedCities.length || selectedCities.some(id => !cities.some(city => city.id === id)))) { setFormError('Select at least one available city.'); return }
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      if (editing) await api.patch(paths.updateMerchantName(modal.merchant.id), { name: trimmed })
      else await api.post(paths.addMerchant, { name: trimmed, cityIds: selectedCities })
      setModal(null); setSuccess(editing ? 'Merchant name updated.' : 'Merchant created.')
      if (canView) await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function removeMerchant() {
    if (saving || !canView || !hasPermission('MERCHANT_DELETE')) return
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try { await api.delete(paths.deleteMerchant(modal.merchant.id)); setModal(null); setSuccess('Merchant deleted.'); await load() }
    catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  async function changeCity(remove = false) {
    if (saving || !canView || !hasPermission('MERCHANT_UPDATE')) return
    const merchant = modal.merchant
    const linked = merchant.merchantCities || []
    const chosen = remove ? removingCity?.id : Number(cityId)
    if (remove ? !chosen || linked.length <= 1 || !linked.some(city => city.id === chosen) : !canViewCities || !cities.some(city => city.id === chosen) || linked.some(city => city.id === chosen)) return
    setSaving(true); setFormError(''); setSuccess(''); setError('')
    try {
      await api.patch(remove ? paths.removeMerchantCity(merchant.id, chosen) : paths.addMerchantCity(merchant.id, chosen))
      setRemovingCity(null); setCityId('')
      const { data } = await api.get(`/api/v1/merchant/get-merchant-by-id/${merchant.id}`)
      setModal({ type: 'cities', merchant: data }); setSuccess(remove ? 'City removed from merchant.' : 'City added to merchant.')
      await load()
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  const query = search.trim().toLowerCase()
  const filtered = merchants.filter(merchant => String(merchant.name ?? '').toLowerCase().includes(query))
  const linked = modal?.merchant?.merchantCities || []
  const available = cities.filter(city => !linked.some(item => item.id === city.id))
  const modalPermission = modal?.type === 'create' ? 'MERCHANT_CREATE' : modal?.type === 'delete' ? 'MERCHANT_DELETE' : 'MERCHANT_UPDATE'

  return <>
    <PageHeading eyebrow="ORGANIZATION" title="Merchant Management" description="Manage merchants and their cities." actions={<>{canView && <button className="btn btn-ghost" onClick={load} disabled={loading}><RefreshCw size={17}/> Refresh</button>}{hasPermission('MERCHANT_CREATE') && <button className="btn btn-primary" onClick={() => open('create')}><Plus size={18}/> Add Merchant</button>}</>}/>
    <Notice onDismiss={() => setError('')}>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>
    {!canView && <p className="subdued">MERCHANT_VIEW permission is required to view and manage existing merchants.</p>}
    {canView && <Panel title="Merchants" subtitle={`${merchants.length} merchants`} icon={Store}>
      <div className="filters-row"><label className="inline-search"><Search size={17}/><input aria-label="Search merchants" placeholder="Search by name..." value={search} onChange={event => setSearch(event.target.value)}/></label></div>
      {loading ? <Spinner/> : error ? <EmptyState title="Unable to load merchants" detail="Try refreshing the list."/> : filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Merchant Name</th><th>Cities</th><th>Actions</th></tr></thead><tbody>{filtered.map(merchant => <tr key={merchant.id}><td className="id-cell">{merchant.id}</td><td>{merchant.name}</td><td>{(merchant.merchantCities || []).map(city => <span className="badge badge-purple" key={city.id}>{city.name}</span>)}</td><td>{hasPermission('MERCHANT_UPDATE') && <><button className="icon-button" aria-label={`Edit ${merchant.name}`} title="Edit name" onClick={() => open('edit', merchant)}><Pencil size={17}/></button><button className="icon-button" aria-label={`Manage cities for ${merchant.name}`} title="Manage cities" onClick={() => open('cities', merchant)}><MapPin size={17}/></button></>}{hasPermission('MERCHANT_DELETE') && <button className="icon-button danger-hover" aria-label={`Delete ${merchant.name}`} title="Delete" onClick={() => open('delete', merchant)}><Trash2 size={17}/></button>}</td></tr>)}</tbody></table></div> : <EmptyState title={query ? 'No matching merchants' : 'No merchants yet'} detail={query ? 'Try a different name.' : 'Merchants will appear here when added.'}/>}
    </Panel>}
    {modal && hasPermission(modalPermission) && <Modal title={modal.type === 'create' ? 'New Merchant' : modal.type === 'edit' ? 'Edit Merchant Name' : modal.type === 'delete' ? 'Delete Merchant' : 'Manage Cities'} onClose={close}>
      {modal.type === 'delete' ? <div className="modal-form"><Notice>{formError}</Notice><p>Delete merchant "{modal.merchant.name}"?</p><div className="modal-actions"><button className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={removeMerchant} disabled={saving}>{saving ? 'Deleting...' : 'Delete Merchant'}</button></div></div> : modal.type === 'cities' ? <div className="modal-form"><Notice>{formError}</Notice><strong>{modal.merchant.name}</strong><span>Associated cities</span>{linked.map(city => <div className="inline-control" key={city.id}><span>{city.name}</span><button className="icon-button danger-hover" aria-label={`Remove ${city.name}`} title={linked.length <= 1 ? 'The last city cannot be removed' : 'Remove city'} disabled={saving || linked.length <= 1} onClick={() => setRemovingCity(city)}><Trash2 size={17}/></button></div>)}<p className="subdued">The last remaining city cannot be removed.</p>{removingCity && <div className="modal-form"><p>Remove {removingCity.name} from {modal.merchant.name}?</p><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setRemovingCity(null)} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={() => changeCity(true)} disabled={saving}>Confirm Removal</button></div></div>}<Notice>{cityError}</Notice>{citiesLoading ? <Spinner label="Loading cities..."/> : canViewCities && !cityError && <div className="inline-control"><label htmlFor="merchant-city">Add city</label><select id="merchant-city" value={cityId} onChange={event => setCityId(event.target.value)}><option value="">{available.length ? 'Select a city' : 'No available cities'}</option>{available.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select><button className="btn btn-primary" onClick={() => changeCity()} disabled={saving || !cityId}>Add City</button></div>}<div className="modal-actions"><button className="btn btn-ghost" onClick={close} disabled={saving}>Close</button></div></div> : <form className="modal-form" onSubmit={save}><Notice>{formError}</Notice><label className="field"><span>Merchant Name</span><input required maxLength={100} value={name} onChange={event => setName(event.target.value)}/></label>{modal.type === 'create' && <><Notice>{cityError}</Notice>{citiesLoading ? <Spinner label="Loading cities..."/> : canViewCities && !cityError && <fieldset><legend>Cities</legend>{cities.length ? cities.map(city => <label key={city.id} style={{ display: 'block' }}><input type="checkbox" checked={selectedCities.includes(city.id)} onChange={event => setSelectedCities(previous => event.target.checked ? [...previous, city.id] : previous.filter(id => id !== city.id))}/> {city.name}</label>) : <p className="subdued">No cities are available.</p>}</fieldset>}</>}<div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving || (modal.type === 'create' && (!canViewCities || citiesLoading || !!cityError || !cities.length))}>{saving ? 'Saving...' : 'Save Merchant'}</button></div></form>}
    </Modal>}
  </>
}
