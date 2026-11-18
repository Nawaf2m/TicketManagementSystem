import { useEffect, useRef, useState } from 'react'
import { Plus, RefreshCw, Shield, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getList, paths } from '../services/api'
import { EmptyState, Modal, Notice, PageHeading, Panel, Spinner } from '../components/UI'
import { getRole, messageFromError, objectOf } from '../utils/data'
import { createPermissionAccess } from '../utils/permissions'

export default function RolesPage() {
  const { hasPermission, user, refreshUser } = useAuth()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const deleteInFlight = useRef(false)
  const detailVersion = useRef(0)
  const canView = hasPermission('ROLE_VIEW')
  const canViewPermissions = hasPermission('PERMISSION_VIEW')
  const canManage = hasPermission('ROLE_MANAGE_PERMISSIONS')

  async function load(checkPermission = hasPermission) {
    setLoading(true); setError('')
    const results = await Promise.allSettled([
      checkPermission('ROLE_VIEW') ? getList(paths.roles) : Promise.resolve([]),
      checkPermission('PERMISSION_VIEW') ? getList(paths.permissions) : Promise.resolve([]),
    ])
    setRoles(results[0].status === 'fulfilled' ? results[0].value : [])
    setPermissions(results[1].status === 'fulfilled' ? results[1].value : [])
    setError(results.filter(result => result.status === 'rejected').map(result => messageFromError(result.reason)).join(' '))
    setLoading(false)
  }
  useEffect(() => {
    load()
    setSelected(null)
    return () => { detailVersion.current++ }
  }, [canView, canViewPermissions])

  async function selectRole(roleId, checkPermission = hasPermission) {
    if (!checkPermission('ROLE_VIEW')) {
      detailVersion.current++; setSelected(null); setLoadingDetail(false)
      return
    }
    const version = ++detailVersion.current
    setLoadingDetail(true); setSelected(null); setDetailError('')
    try {
      const { data } = await api.get(paths.roleById(roleId))
      if (version === detailVersion.current) setSelected(objectOf(data))
    } catch (err) {
      if (version === detailVersion.current) setDetailError(messageFromError(err))
    } finally {
      if (version === detailVersion.current) setLoadingDetail(false)
    }
  }
  async function createRole(event) {
    event.preventDefault()
    if (saving || !hasPermission('ROLE_CREATE')) return
    const roleName = name.trim()
    if (!/^[A-Z][A-Z0-9_]{0,19}$/.test(roleName)) {
      setFormError('Use up to 20 uppercase letters, numbers or underscores, starting with a letter.')
      return
    }
    setSaving(true); setFormError(''); setSuccess('')
    try {
      await api.post(paths.addRole, { name: roleName })
      setShowCreate(false); setName('')
      await load(); setSuccess('Role created successfully.')
    } catch (err) { setFormError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  function openDelete(role) {
    if (saving || !hasPermission('ROLE_DELETE') || !hasPermission('ROLE_VIEW')) return
    setDeleteError(''); setDeleteTarget(role)
  }
  function closeDelete() {
    if (deleteInFlight.current) return
    setDeleteTarget(null); setDeleteError('')
  }
  async function deleteRole() {
    if (deleteInFlight.current || saving || !deleteTarget || !hasPermission('ROLE_DELETE') || !hasPermission('ROLE_VIEW')) return
    const role = deleteTarget
    deleteInFlight.current = true
    setSaving(true); setDeleteError(''); setError(''); setSuccess('')
    try {
      await api.delete(paths.deleteRole(role.id))
      setDeleteTarget(null)
      if (selected?.id === role.id) { detailVersion.current++; setSelected(null) }
      await load(); setSuccess('Role deleted successfully.')
    } catch (err) { setDeleteError(messageFromError(err)) }
    finally { deleteInFlight.current = false; setSaving(false) }
  }
  async function changePermission(permission, assigned) {
    if (saving || !selected || !hasPermission('ROLE_VIEW') || !hasPermission('PERMISSION_VIEW') || !hasPermission('ROLE_MANAGE_PERMISSIONS')) return
    const roleId = selected.id
    const affectsCurrentUser = selected.name === getRole(user)
    setSaving(true); setDetailError(''); setSuccess('')
    try {
      if (assigned) await api.delete(paths.removePermission(roleId, permission.id))
      else await api.post(paths.assignPermission(roleId, permission.id))
      let checkPermission = hasPermission
      if (affectsCurrentUser) {
        const currentUser = await refreshUser()
        checkPermission = createPermissionAccess(currentUser?.permissions).hasPermission
      }
      await selectRole(roleId, checkPermission)
      setSuccess(assigned ? 'Permission removed from role.' : 'Permission assigned to role.')
    } catch (err) { setDetailError(messageFromError(err)) }
    finally { setSaving(false) }
  }
  return <>
    <PageHeading eyebrow="ACCESS MANAGEMENT" title="Roles & Permissions" description="Manage roles and their existing permissions." actions={<>
      <button className="btn btn-ghost" disabled={saving} onClick={async () => {
        try {
          const currentUser = await refreshUser()
          const { hasPermission: checkPermission } = createPermissionAccess(currentUser?.permissions)
          await load(checkPermission)
          if (selected) await selectRole(selected.id, checkPermission)
        } catch (err) { setError(messageFromError(err)) }
      }}><RefreshCw size={17}/> Refresh</button>
      {hasPermission('ROLE_CREATE') && <button className="btn btn-primary" onClick={() => { setName(''); setFormError(''); setShowCreate(true) }}><Plus size={18}/> Create Role</button>}
    </>}/>
    <Notice>{error}</Notice><Notice type="success" onDismiss={() => setSuccess('')}>{success}</Notice>
    {canView && <Panel title="Roles" subtitle={`${roles.length} roles`} icon={Shield}>
      {loading ? <Spinner/> : roles.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Role</th><th>Permissions</th><th>Action</th></tr></thead><tbody>{roles.map(role => <tr key={role.id}>
        <td><strong>{role.name}</strong></td><td>{role.permissions?.length ?? 0}</td><td>
          <button className="btn btn-small btn-outline" disabled={saving} onClick={() => selectRole(role.id)}>View permissions</button>{' '}
          {hasPermission('ROLE_DELETE') && <button className="btn btn-small btn-outline" disabled={saving} onClick={() => openDelete(role)}><Trash2 size={14}/> Delete</button>}
        </td>
      </tr>)}</tbody></table></div> : !error && <EmptyState title="No roles yet"/>}
    </Panel>}
    {!canView && (canManage || hasPermission('ROLE_DELETE')) && <Notice>Viewing roles requires permission to view roles.</Notice>}
    {canView && <Panel title={selected ? `Permissions for ${selected.name}` : 'Role permissions'} icon={Shield}>
      <Notice>{detailError}</Notice>
      {loadingDetail ? <Spinner/> : selected ? <>
        {selected.permissions?.length ? <div className="heading-actions">{selected.permissions.map(permissionName => <span className="role-chip" key={permissionName}>{permissionName}</span>)}</div> : <p className="small-muted">This role has no permissions.</p>}
        {canManage && !canViewPermissions && <Notice>Viewing the permission catalog requires permission to view permissions. Permission changes are disabled.</Notice>}
        {canViewPermissions && <div className="table-scroll"><table className="data-table"><thead><tr><th>Permission</th><th>Status</th>{canManage && <th>Action</th>}</tr></thead><tbody>{permissions.map(permission => {
          const assigned = selected.permissions?.includes(permission.name) === true
          return <tr key={permission.id}><td>{permission.name}</td><td><span className={`badge ${assigned ? 'badge-success' : 'badge-muted'}`}>{assigned ? 'Assigned' : 'Not assigned'}</span></td>{canManage && <td><button className="btn btn-small btn-outline" disabled={saving} onClick={() => changePermission(permission, assigned)}>{assigned ? 'Remove' : 'Assign'}</button></td>}</tr>
        })}</tbody></table></div>}
      </> : !detailError && <EmptyState title="Select a role" detail="Choose a role to view its permissions."/>}
    </Panel>}
    {!canView && canViewPermissions && <Panel title="Permissions" icon={Shield}>{loading ? <Spinner/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Permission</th></tr></thead><tbody>{permissions.map(permission => <tr key={permission.id}><td>{permission.name}</td></tr>)}</tbody></table></div>}</Panel>}
    {deleteTarget && canView && hasPermission('ROLE_DELETE') && <Modal title="Delete Role" onClose={closeDelete} hideCloseButton>
      <div className="modal-form"><p>Delete role <strong>{deleteTarget.name}</strong>?</p><Notice>{deleteError}</Notice>
        <div className="modal-actions"><button type="button" className="btn btn-ghost" disabled={saving} onClick={closeDelete}>Cancel</button><button type="button" className="btn btn-primary" disabled={saving} onClick={deleteRole}>Delete</button></div>
      </div>
    </Modal>}
    {showCreate && hasPermission('ROLE_CREATE') && <Modal title="Create Role" onClose={() => { if (!saving) setShowCreate(false) }}><form className="modal-form" onSubmit={createRole}>
      <Notice>{formError}</Notice><label className="field"><span>Role name</span><input required maxLength={20} pattern="[A-Z][A-Z0-9_]*" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. SUPERVISOR"/></label>
      <div className="modal-actions"><button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Role'}</button></div>
    </form></Modal>}
  </>
}
