
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
  roleName: 'EMPLOYEE',
  departmentId: ''
}

export default function UsersPage() {
  const { user, signOut, refreshUser } = useAuth()
  const [editing, setEditing] = useState(null)
  const [roleTarget, setRoleTarget] = useState(null)
  const [newRole, setNewRole] = useState('EMPLOYEE')
  const [roleError, setRoleError] = useState('')
  const [toggling, setToggling] = useState(null)
  const [users, setUsers] = useState([])
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
      const [us, ds] = await Promise.allSettled([
        getList(paths.users), getList(paths.departments)
      ])
      setUsers(us.status === 'fulfilled' ? us.value : [])
      setDepartments(ds.status === 'fulfilled' ? ds.value : [])
      const errors = [us, ds].filter(result => result.status === 'rejected')
      if (errors.length) setError(errors.map(result => messageFromError(result.reason)).join(' '))
    } catch (err) {
      setUsers([]); setDepartments([]); setError(messageFromError(err))

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openCreateModal() {
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
    if (saving) return

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
        // Basic Auth still holds the previous email until the next sign-in.
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
    setEditing(u)
    setForm({ ...emptyForm, name: u.name, email: u.email, departmentId: String(departments.find(d => d.name === u.departmentName)?.id || '') })
    setModalError('')
    setShowCreate(true)
  }

  async function changeRole(e) {
    e.preventDefault()
    if (saving) return
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
    if (toggling !== null) return
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

            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18}/>
              Add User
            </button>
          </>
        }
      />

      <Notice>{error}</Notice>

      <Notice type="success" onDismiss={() => setSuccess('')}>
        {success}
      </Notice>

      <Panel
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
                      <button className="btn btn-small btn-outline" disabled={saving || toggling !== null} onClick={() => openEdit(u)}><Pencil size={13}/> Edit</button>{' '}
                      <button className="btn btn-small btn-outline" disabled={saving || toggling !== null} onClick={() => {setRoleTarget(u);setNewRole(u.roleName);setRoleError('')}}>Change role</button>{' '}
                      <button
                        className="btn btn-small btn-outline"
                        disabled={toggling !== null || saving || typeof u.active !== 'boolean'}
                        onClick={() => toggleActive(u)}
                      >
                        {u.active === true
                          ? 'Deactivate'
                          : u.active === false
                            ? 'Activate'
                            : 'Unavailable'}
                      </button>
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
      </Panel>

      {showCreate && (
        <Modal title={editing ? "Edit Team Member" : "Add Team Member"} onClose={closeCreateModal}>
          <form className="modal-form" onSubmit={create}>

            <p className="subdued">
              {editing ? 'Update user details.' : 'Create a new user account for the helpdesk.'}
            </p>

            <Notice>{modalError}</Notice>

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
                <option value="ADMIN">Admin</option>
                <option value="AGENT">Agent</option>
                <option value="EMPLOYEE">Employee</option>
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
                disabled={saving}
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {roleTarget && <Modal title={`Change role for ${roleTarget.name}`} onClose={() => {if (!saving) setRoleTarget(null)}}>
        <form className="modal-form" onSubmit={changeRole}>
          <Notice>{roleError}</Notice>
          {roleTarget.id === user.id && <p className="subdued">Changing your own role will sign you out.</p>}
          <label className="field"><span>Role</span><select value={newRole} onChange={e => setNewRole(e.target.value)}><option value="ADMIN">Admin</option><option value="AGENT">Agent</option><option value="EMPLOYEE">Employee</option></select></label>
          <div className="modal-actions"><button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setRoleTarget(null)}>Cancel</button><button className="btn btn-primary" disabled={saving || newRole === roleTarget.roleName}>{saving ? 'Saving...' : 'Save Role'}</button></div>
        </form>
      </Modal>}
    </>
  )
}
