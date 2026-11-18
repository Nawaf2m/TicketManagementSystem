
import { useEffect, useState } from 'react'
import { Pencil, Plus, RefreshCw, Users } from 'lucide-react'
import { api, getList, paths } from '../services/api'
import {
  EmptyState,
  Modal,
  Notice,
  PageHeading,
  Panel,
  Spinner
} from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { getName, getRole, messageFromError } from '../utils/data'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  roleName: '',
  departmentId: ''
}

export default function UsersPage() {
  const { user, signOut, refreshUser, hasPermission } = useAuth()
  const [editing, setEditing] = useState(null)
  const [roleTarget, setRoleTarget] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [roleError, setRoleError] = useState('')
  const [toggling, setToggling] = useState(null)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalError, setModalError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  async function load() {
    setLoading(true)
    setError('')

    try {
      const [us, ds, rs] = await Promise.allSettled([
        hasPermission('USER_VIEW') ? getList(paths.users) : Promise.resolve([]),
        hasPermission('DEPARTMENT_VIEW') ? getList(paths.departments) : Promise.resolve([]),
        hasPermission('ROLE_VIEW') ? getList(paths.roles) : Promise.resolve([]),
      ])
      setUsers(us.status === 'fulfilled' ? us.value : [])
      setDepartments(ds.status === 'fulfilled' ? ds.value : [])
      setRoles(rs.status === 'fulfilled' ? rs.value : [])
      const errors = [us, ds, rs].filter(result => result.status === 'rejected')
      if (errors.length) setError(errors.map(result => messageFromError(result.reason)).join(' '))
    } catch (err) {
      setUsers([]); setDepartments([]); setError(messageFromError(err))

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [hasPermission])

  function openCreateModal() {
    if (!hasPermission('USER_CREATE')) return
    setEditing(null)
    setForm({ ...emptyForm })
    setModalError('')
    setShowCreate(true)
  }

  function closeCreateModal() {
    if (saving) return

    setModalError('')
    setShowCreate(false)
  }

  async function create(e) {
    e.preventDefault()
    if (saving || !hasPermission(editing ? 'USER_UPDATE' : 'USER_CREATE')) return

    setSaving(true)
    setModalError('')
    setSuccess('')

    if (!form.departmentId) {
      setModalError('Please select a department.')
      setSaving(false)
      return
    }

    try {
      const details = { name: form.name.trim(), email: form.email.trim(), departmentId: Number(form.departmentId) }
      if (details.name.length < 2) throw new Error('Name must contain at least 2 characters.')
      if (editing) {
        await api.put(paths.updateUser(editing.id), details)
        // The current JWT subject still contains the previous email.
        if (editing.id === user.id && details.email !== user.email) { signOut(); return }
        if (editing.id === user.id) {
          try { await refreshUser() } catch { signOut(); return }
        }
      } else {
        await api.post(paths.addUser, { ...details, password: form.password, roleName: form.roleName })
      }

      setShowCreate(false)
      setForm({ ...emptyForm })

      await load()
      setSuccess(editing ? 'User updated successfully.' : 'User created successfully.')

    } catch (err) {
      setModalError(messageFromError(err))

    } finally {
      setSaving(false)
    }
  }

  function openEdit(u) {
    if (!hasPermission('USER_UPDATE')) return
    setEditing(u)
    setForm({ ...emptyForm, name: u.name, email: u.email, departmentId: String(departments.find(d => d.name === u.departmentName)?.id || '') })
    setModalError('')
    setShowCreate(true)
  }

  async function changeRole(e) {
    e.preventDefault()
    if (saving || !hasPermission('USER_MANAGE_ROLE') || !roles.some(role => role.name === newRole)) return
    setSaving(true); setRoleError('')
    try {
      await api.put(paths.userRole(roleTarget.id), { roleName: newRole })
      if (roleTarget.id === user.id) { signOut(); return }
      setRoleTarget(null)
      await load()
      setSuccess('User role updated successfully.')
    } catch (err) { setRoleError(messageFromError(err)) }
    finally { setSaving(false) }
  }

  async function toggleActive(u) {
    if (toggling !== null || !hasPermission(u.active ? 'USER_DEACTIVATE' : 'USER_ACTIVATE')) return
    setError('')
    setSuccess('')

    if (typeof u.active !== 'boolean') {
      setError('User status is unavailable. Check the backend response.')
      return
    }

    setToggling(u.id)
    try {
      if (u.active) {
        await api.patch(paths.deactivateUser(u.id))
      } else {
        await api.patch(paths.activateUser(u.id))
      }

      if (u.id === user.id && u.active) { signOut(); return }
      await load()

      setSuccess(
        u.active
          ? 'User deactivated successfully.'
          : 'User activated successfully.'
      )

    } catch (err) {
      setError(messageFromError(err))
    } finally { setToggling(null) }
  }

  return (
    <>
      <PageHeading
        eyebrow="TEAM MANAGEMENT"
        title="Users"
        description="Manage people and access to the helpdesk."
        actions={
          <>
            <button className="btn btn-ghost" onClick={load}>
              <RefreshCw size={17}/>
              Refresh
            </button>

            {hasPermission('USER_CREATE') && <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18}/>
              Add User
            </button>}
          </>
        }
      />

      <Notice>{error}</Notice>

      <Notice type="success" onDismiss={() => setSuccess('')}>
        {success}
      </Notice>

      {hasPermission('USER_VIEW') && <Panel
        title="Team Members"
        subtitle={`${users.length} people in your workspace`}
        icon={Users}
      >
        {loading ? (
          <Spinner/>
        ) : users.length > 0 ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <span className="small-avatar">
                          {getName(u).slice(0, 2).toUpperCase()}
                        </span>

                        <span>
                          <strong>{getName(u)}</strong>
                          <small>{u.email}</small>
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="role-chip">
                        {getRole(u)}
                      </span>
                    </td>

                    <td>
                      {u.departmentName || '—'}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          u.active === true
                            ? 'badge-success'
                            : 'badge-muted'
                        }`}
                      >
                        {u.active === true
                          ? 'ACTIVE'
                          : u.active === false
                            ? 'INACTIVE'
                            : 'UNKNOWN'}
                      </span>
                    </td>

                    <td>
                      {hasPermission('USER_UPDATE') && <button className="btn btn-small btn-outline" disabled={saving || toggling !== null} onClick={() => openEdit(u)}><Pencil size={13}/> Edit</button>}{' '}
                      {hasPermission('USER_MANAGE_ROLE') && <button className="btn btn-small btn-outline" disabled={saving || toggling !== null || !hasPermission('ROLE_VIEW') || !roles.length} title={!hasPermission('ROLE_VIEW') ? 'Viewing role choices requires ROLE_VIEW.' : undefined} onClick={() => {setRoleTarget(u);setNewRole(u.roleName);setRoleError('')}}>Change role</button>}{' '}
                      {hasPermission(u.active ? 'USER_DEACTIVATE' : 'USER_ACTIVATE') && <button
                        className="btn btn-small btn-outline"
                        disabled={toggling !== null || saving || typeof u.active !== 'boolean'}
                        onClick={() => toggleActive(u)}
                      >
                        {u.active === true
                          ? 'Deactivate'
                          : u.active === false
                            ? 'Activate'
                            : 'Unavailable'}
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No team members"
            detail="Add someone to get started."
          />
        )}
      </Panel>}

      {showCreate && hasPermission(editing ? 'USER_UPDATE' : 'USER_CREATE') && (
        <Modal title={editing ? "Edit Team Member" : "Add Team Member"} onClose={closeCreateModal}>
          <form className="modal-form" onSubmit={create}>

            <p className="subdued">
              {editing ? 'Update user details.' : 'Create a new user account for the helpdesk.'}
            </p>

            <Notice>{modalError}</Notice>
            {!hasPermission('DEPARTMENT_VIEW') && <Notice>Department choices require permission to view departments.</Notice>}
            {!editing && !hasPermission('ROLE_VIEW') && <Notice>Role choices require permission to view roles.</Notice>}

            <label className="field">
              <span>Full name</span>

              <input
                required
                minLength={2}
                maxLength={20}
                value={form.name}
                onChange={e => setForm({
                  ...form,
                  name: e.target.value
                })}
              />
            </label>

            <label className="field">
              <span>Email</span>

              <input
                type="email"
                maxLength={50}
                required
                value={form.email}
                onChange={e => setForm({
                  ...form,
                  email: e.target.value
                })}
              />
            </label>

            {!editing && <label className="field">
              <span>Initial password</span>

              <input
                type="password"
                required
                minLength={8}
                maxLength={20}
                pattern={String.raw`(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S+`}
                title="Use 8-20 characters with a letter, a number, a special character, and no spaces."
                autoComplete="new-password"
                value={form.password}
                onChange={e => setForm({
                  ...form,
                  password: e.target.value
                })}
              />
            </label>}

            {!editing && <label className="field">
              <span>Role</span>

              <select
                required
                value={form.roleName}
                onChange={e => setForm({
                  ...form,
                  roleName: e.target.value
                })}
              >
                <option value="">Choose a role</option>
                {roles.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
              </select>
            </label>}

            <label className="field">
              <span>Department</span>

              <select
                required
                value={form.departmentId}
                onChange={e => setForm({
                  ...form,
                  departmentId: e.target.value
                })}
              >
                <option value="">Choose a department</option>

                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeCreateModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving || !form.departmentId || (!editing && !roles.some(role => role.name === form.roleName))}
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {roleTarget && hasPermission('USER_MANAGE_ROLE') && <Modal title={`Change role for ${roleTarget.name}`} onClose={() => {if (!saving) setRoleTarget(null)}}>
        <form className="modal-form" onSubmit={changeRole}>
          <Notice>{roleError}</Notice>
          {roleTarget.id === user.id && <p className="subdued">Changing your own role will sign you out.</p>}
          <label className="field"><span>Role</span><select value={newRole} onChange={e => setNewRole(e.target.value)}>{roles.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}</select></label>
          <div className="modal-actions"><button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setRoleTarget(null)}>Cancel</button><button className="btn btn-primary" disabled={saving || newRole === roleTarget.roleName}>{saving ? 'Saving...' : 'Save Role'}</button></div>
        </form>
      </Modal>}
    </>
  )
}
