import { useEffect, useState } from 'react'
import { Building2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { messageFromError } from '../utils/data'

export default function DepartmentsPage() {
  const { hasPermission } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [edit, setEdit] = useState(null)
  const [name, setName] = useState('')
  const [showModal, setShowModal] = useState(false)
  async function load() {
    setLoading(true); setError('')
    try { setDepartments(hasPermission('DEPARTMENT_VIEW') ? await getList(paths.departments) : []) }
    catch (err) { setDepartments([]); setError(messageFromError(err)) } finally {setLoading(false)}
  }
  useEffect(() => { load() }, [hasPermission])
  function close() { if (!saving) { setShowModal(false); setFormError('') } }
  function open(d = null) {if (!hasPermission(d ? 'DEPARTMENT_UPDATE' : 'DEPARTMENT_CREATE')) return;setFormError('');setEdit(d);setName(d?.name || '');setShowModal(true)}
  async function save(e) {
    e.preventDefault(); if (saving || !hasPermission(edit ? 'DEPARTMENT_UPDATE' : 'DEPARTMENT_CREATE')) return; setFormError(''); if (name.trim().length < 2) {setFormError('Department name must contain at least 2 characters.');return} setSaving(true);setSuccess('')
    try {if (edit) await api.put(paths.updateDepartment(edit.id),{name: name.trim()});else await api.post(paths.addDepartment,{name: name.trim()});setShowModal(false);setSuccess(edit ? 'Department updated.' : 'Department created.');await load()}
    catch(err){setFormError(messageFromError(err))}finally{setSaving(false)}
  }
  async function remove(d) {
    if (!hasPermission('DEPARTMENT_DELETE')) return
    if (!window.confirm(`Delete department "${d.name}"?`)) return
    try {await api.delete(paths.deleteDepartment(d.id));setSuccess('Department deleted.');await load()}
    catch(err){setError(messageFromError(err))}
  }
  return <><PageHeading eyebrow="ORGANIZATION" title="Departments" description="Keep teams organized across your support workspace." actions={<><button className="btn btn-ghost" onClick={load}><RefreshCw size={17}/> Refresh</button>{hasPermission('DEPARTMENT_CREATE') && <button className="btn btn-primary" onClick={() => open()}><Plus size={18}/> Add Department</button>}</>}/><Notice>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>{hasPermission('DEPARTMENT_VIEW') && <Panel title="Your Departments" subtitle={`${departments.length} departments`} icon={Building2}>{loading ? <Spinner/> : departments.length ? <div className="department-grid">{departments.map(d => <div className="department-card" key={d.id}><span className="department-icon"><Building2 size={23}/></span><div><strong>{d.name}</strong></div>{(hasPermission('DEPARTMENT_UPDATE') || hasPermission('DEPARTMENT_DELETE')) && <div className="department-actions">{hasPermission('DEPARTMENT_UPDATE') && <button className="icon-button" onClick={() => open(d)} title="Edit"><Pencil size={17}/></button>}{hasPermission('DEPARTMENT_DELETE') && <button className="icon-button danger-hover" onClick={() => remove(d)} title="Delete"><Trash2 size={17}/></button>}</div>}</div>)}</div> : <EmptyState title="No departments yet"/>}</Panel>}{showModal && hasPermission(edit ? 'DEPARTMENT_UPDATE' : 'DEPARTMENT_CREATE') && <Modal title={edit ? 'Edit Department' : 'New Department'} onClose={close}><form className="modal-form" onSubmit={save}><Notice>{formError}</Notice><label className="field"><span>Department name</span><input required minLength={2} maxLength={30} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IT Support"/></label><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Department'}</button></div></form></Modal>}</>
}
