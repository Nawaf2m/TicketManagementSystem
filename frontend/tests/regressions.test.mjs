import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createPermissionAccess } from '../src/utils/permissions.js'

const currentPermissionAccess = createPermissionAccess(null)

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../package.json', import.meta.url))
const bundles = new Map()

// Exercise page event handlers and rendered controls without a browser or live DB.
async function mount(page, auth, adapter) {
  if (!bundles.has(page)) {
    const pagePath = page === 'AppLayout' ? './src/layouts/AppLayout.jsx' : page === 'App' ? './src/App.jsx' : `./src/pages/${page}.jsx`
    const result = await build({
      stdin: { contents: `export { default as Page } from '${pagePath}'; export { api, authApi, getList, setAccessToken, refreshAccessToken, login, logout, onSessionEnded, paths } from './src/services/api.js'`, resolveDir: root },
      absWorkingDir: root, bundle: true, write: false, format: 'cjs', jsx: 'automatic',
      packages: 'external', define: { 'import.meta.env': '{}' },
      plugins: [{ name: 'page-harness', setup(builder) {
        builder.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'harness' }))
        builder.onResolve({ filter: /context\/AuthContext$/ }, () => ({ path: 'auth', namespace: 'harness' }))
        builder.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'harness' }))
        builder.onLoad({ filter: /.*/, namespace: 'harness' }, ({ path }) => ({ contents: path === 'hooks'
          ? 'export const useState=(v)=>h.state(v); export const useRef=(v)=>h.ref(v); export const useEffect=(f,d)=>h.effect(f,d); export const useMemo=(f)=>f();'
          : path === 'auth' ? 'export const useAuth=()=>h.auth;'
            : 'export const useParams=()=>({id:"10"}); export const useNavigate=()=>()=>{}; export const Link="a"; export const NavLink="NavLink"; export const Outlet="Outlet"; export const Navigate="Navigate"; export const Routes="Routes"; export const Route="Route"; export const useSearchParams=()=>[new URLSearchParams(),()=>{}];' }))
      } }],
    })
    bundles.set(page, result.outputFiles[0].text)
  }
  const h = {
    auth, values: [], deps: [], pending: [], cursor: 0, effectCursor: 0,
    state(initial) {
      const index = this.cursor++
      if (!(index in this.values)) this.values[index] = typeof initial === 'function' ? initial() : initial
      return [this.values[index], value => { this.values[index] = typeof value === 'function' ? value(this.values[index]) : value }]
    },
    ref(initial) { return this.state(() => ({ current: initial }))[0] },
    effect(callback, deps) {
      const index = this.effectCursor++
      if (!this.deps[index] || deps.some((value, i) => value !== this.deps[index][i])) {
        this.deps[index] = deps
        this.pending.push(callback)
      }
    },
  }
  const module = { exports: {} }
  vm.runInNewContext(bundles.get(page), { module, exports: module.exports, require, h, URLSearchParams, Blob, FormData, URL, console, Date, window: { confirm: () => true } })
  const exported = module.exports
  exported.api.defaults.adapter = adapter
  const render = () => { h.cursor = 0; h.effectCursor = 0; return exported.Page() }
  render()
  h.pending.splice(0).forEach(callback => callback())
  await settle()
  return { ...exported, h, render }
}

const settle = () => new Promise(resolve => setImmediate(resolve))
const reject = (status, message) => Promise.reject({ response: { status, data: { message } } })
const allPermissions = ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_MANAGE_ROLE', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'DEPARTMENT_VIEW', 'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE', 'TICKET_VIEW_ALL', 'TICKET_VIEW_OWN', 'TICKET_VIEW_ASSIGNED', 'TICKET_VIEW', 'TICKET_CREATE', 'TICKET_ASSIGN', 'TICKET_UPDATE_STATUS', 'TICKET_UPDATE_PRIORITY', 'COMMENT_CREATE', 'COMMENT_VIEW', 'ATTACHMENT_UPLOAD', 'ATTACHMENT_VIEW', 'ATTACHMENT_DOWNLOAD', 'ACTIVITY_VIEW', 'ACTIVITY_VIEW_ALL', 'ROLE_VIEW', 'ROLE_CREATE', 'ROLE_DELETE', 'ROLE_MANAGE_PERMISSIONS', 'PERMISSION_VIEW']
const collaborationPermissions = ['TICKET_VIEW', 'COMMENT_CREATE', 'COMMENT_VIEW', 'ATTACHMENT_UPLOAD', 'ATTACHMENT_VIEW', 'ACTIVITY_VIEW']
const auth = (permissions = [], role = 'SUPERVISOR') => ({ ...createPermissionAccess(permissions), role, user: { id: 2, email: 'admin@example.com', roleName: role }, signOut() {}, async refreshUser() { return { id: 2, roleName: role, permissions } } })
const ticket = (status = 'OPEN', assignedToId = 2) => ({ id: 10, title: 'Access issue', description: 'Cannot sign in', status, priority: 'LOW', createdById: 2, assignedToId })
const users = [
  { id: 2, name: 'Admin', email: 'admin@example.com', roleName: 'ADMIN', departmentName: 'IT', active: true },
  { id: 3, name: 'Active Agent', roleName: 'AGENT', active: true },
  { id: 4, name: 'Inactive Agent', roleName: 'AGENT', active: false },
]
function adapterFor(info, override = () => undefined) {
  return async config => {
    const custom = override(config)
    if (custom !== undefined) return custom
    const data = config.url.includes('get-ticket-by-id') ? info
      : config.url === '/api/v1/user/get' ? users
        : config.url === '/api/v1/department/get' ? [{ id: 1, name: 'IT' }]
          : config.url === '/api/v1/role/get' ? [{ id: 1, name: 'ADMIN', permissions: [] }, { id: 2, name: 'AGENT', permissions: [] }, { id: 3, name: 'SUPERVISOR', permissions: [] }] : []
    return { status: 200, data, config, headers: {} }
  }
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children), ...nodes(tree.props?.actions)]
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join(' ')
  if (tree == null || typeof tree === 'boolean') return ''
  return typeof tree === 'object' ? text(tree.props?.children) : String(tree)
}
const button = (tree, label) => nodes(tree).find(node => node.type === 'button' && text(node).includes(label))
const event = { preventDefault() {} }

test('ticket controls follow independent permissions, assignment and every workflow status', async () => {
  const permissionSets = [[], collaborationPermissions, ['TICKET_VIEW', 'TICKET_UPDATE_STATUS'], ['TICKET_VIEW', 'TICKET_ASSIGN', 'USER_VIEW'], allPermissions]
  for (const permissions of permissionSets) {
    for (const status of ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) {
      for (const assigned of [2, 3]) {
        const page = await mount('TicketDetailPage', auth(permissions), adapterFor(ticket(status, assigned)))
        const tree = page.render()
        const canRead = permissions.includes('TICKET_VIEW')
        const mutable = ['OPEN', 'IN_PROGRESS'].includes(status)
        assert.equal(Boolean(button(tree, 'Move to')), canRead && status !== 'CLOSED' && permissions.includes('TICKET_UPDATE_STATUS') && (permissions.includes('TICKET_VIEW_ALL') || assigned === 2))
        assert.equal(Boolean(button(tree, 'Assign')), canRead && mutable && permissions.includes('TICKET_ASSIGN'))
        assert.equal(Boolean(button(tree, 'Update')), canRead && mutable && permissions.includes('TICKET_UPDATE_PRIORITY'))
        assert.equal(Boolean(button(tree, 'Post comment')), canRead && status !== 'CLOSED' && permissions.includes('COMMENT_CREATE'))
        assert.equal(Boolean(button(tree, 'Upload File')), canRead && status !== 'CLOSED' && permissions.includes('ATTACHMENT_UPLOAD'))
      }
    }
  }
})

test('failed comment preserves draft and displays the server error in the form', async () => {
  let fail = true
  const page = await mount('TicketDetailPage', auth(collaborationPermissions), adapterFor(ticket(), config => {
    if (config.method === 'post') return fail ? reject(400, 'Comment could not be saved') : { status: 200, data: {}, config, headers: {} }
  }))
  nodes(page.render()).find(node => node.type === 'textarea').props.onChange({ target: { value: 'Keep this draft' } })
  let form = nodes(page.render()).find(node => node.type === 'form')
  await form.props.onSubmit(event)
  assert.equal(nodes(page.render()).find(node => node.type === 'textarea').props.value, 'Keep this draft')
  assert.match(text(nodes(page.render()).find(node => node.type === 'form')), /Comment could not be saved/)
  fail = false
  form = nodes(page.render()).find(node => node.type === 'form')
  await form.props.onSubmit(event)
  assert.equal(nodes(page.render()).find(node => node.type === 'textarea').props.value, '')
})

test('only the exact empty-list backend response is normalized', async () => {
  const page = await mount('TicketDetailPage', auth(allPermissions), adapterFor(ticket()))
  for (const message of ['The list is empty', 'The list is empty.']) {
    page.api.defaults.adapter = () => reject(400, message)
    assert.equal((await page.getList('/example')).length, 0)
  }
  for (const [status, message] of [[401, 'Invalid email or password'], [403, 'Forbidden'], [500, 'Server failed'], [400, 'Invalid ticket']]) {
    page.api.defaults.adapter = () => reject(status, message)
    await assert.rejects(page.getList('/example'))
  }
})

test('authorized section failures are visible and only active agents appear in assignment choices', async () => {
  const page = await mount('TicketDetailPage', auth(allPermissions), adapterFor(ticket(), config => {
    if (config.url.includes('get-ticket-comments')) return reject(500, 'Discussion is unavailable')
  }))
  const tree = page.render()
  assert.match(text(tree), /Discussion is unavailable/)
  assert.doesNotMatch(text(tree), /No comments yet/)
  const options = nodes(tree).filter(node => node.type === 'option').map(text)
  assert.ok(options.includes('Active Agent'))
  assert.ok(!options.includes('Inactive Agent'))
})

test('permission-scoped dashboard includes created and assigned tickets without duplicates', async () => {
  const page = await mount('DashboardPage', auth(['TICKET_VIEW_OWN', 'TICKET_VIEW_ASSIGNED', 'TICKET_VIEW']), async config => ({
    status: 200, config, headers: {}, data: config.url.endsWith('get-my-tickets')
      ? [ticket(), { ...ticket(), id: 11 }] : [ticket(), { ...ticket('IN_PROGRESS'), id: 12 }],
  }))
  const tree = page.render()
  const totalCard = nodes(tree).find(node => node.type === 'article' && text(node).includes('Total Tickets'))
  assert.match(text(totalCard), /Total Tickets 3/)
  assert.equal(nodes(tree).filter(node => node.type === 'tr').length, 4)
})

test('department validation stays in the modal and matches the 30-character DTO limit', async () => {
  const page = await mount('DepartmentsPage', auth(allPermissions), adapterFor(ticket(), config => {
    if (config.method === 'post') return reject(400, 'Department already exists')
  }))
  button(page.render(), 'Add Department').props.onClick()
  const input = nodes(page.render()).find(node => node.type === 'input')
  assert.equal(input.props.maxLength, 30)
  input.props.onChange({ target: { value: 'IT' } })
  await nodes(page.render()).find(node => node.type === 'form').props.onSubmit(event)
  assert.match(text(nodes(page.render()).find(node => node.type === 'form')), /Department already exists/)
  assert.doesNotMatch(text(page.render()), /Department #/)
})

test('user edit and role forms send separate matching DTOs; rejected role change stays open', async () => {
  const requests = []
  const page = await mount('UsersPage', auth(allPermissions), adapterFor(ticket(), config => {
    if (config.method === 'put') {
      requests.push({ url: config.url, body: JSON.parse(config.data) })
      if (config.url.includes('update-user-role')) return reject(400, 'Last active admin')
      return { status: 200, data: {}, config, headers: {} }
    }
  }))
  button(page.render(), 'Edit').props.onClick()
  await nodes(page.render()).find(node => node.type === 'form').props.onSubmit(event)
  assert.equal(requests[0].url, '/api/v1/user/update/2')
  assert.deepEqual(requests[0].body, { name: 'Admin', email: 'admin@example.com', departmentId: 1 })
  button(page.render(), 'Change role').props.onClick()
  nodes(page.render()).find(node => node.type === 'select').props.onChange({ target: { value: 'AGENT' } })
  await nodes(page.render()).find(node => node.type === 'form').props.onSubmit(event)
  assert.deepEqual(requests[1].body, { roleName: 'AGENT' })
  assert.match(text(nodes(page.render()).find(node => node.type === 'form')), /Last active admin/)
})

test('JWT stays in memory and logout revokes the cookie without Authorization', async () => {
  const page = await mount('TicketDetailPage', auth(allPermissions), adapterFor(ticket()))
  const headers = []
  page.api.defaults.adapter = async config => {
    headers.push(config.headers.get('Authorization'))
    assert.equal(config.auth, undefined)
    return { status: 200, data: [], headers: {}, config }
  }
  page.authApi.defaults.adapter = async config => {
    assert.equal(config.url, '/api/v1/auth/logout')
    assert.equal(config.withCredentials, true)
    assert.equal(config.headers.get('Authorization'), undefined)
    return { status: 200, data: {}, headers: {}, config }
  }
  page.setAccessToken({ accessToken: 'test-token', expiresIn: 900 })
  await page.api.get('/example')
  await page.logout()
  await page.api.get('/example')
  assert.deepEqual(headers, ['Bearer test-token', undefined])
})

test('concurrent and delayed 401 responses share a single rotation and retry once', async () => {
  const page = await mount('TicketDetailPage', auth(allPermissions), adapterFor(ticket()))
  page.setAccessToken({ accessToken: 'old', expiresIn: 900 })
  let rotations = 0
  let release
  page.authApi.defaults.adapter = async config => {
    rotations++
    await new Promise(resolve => { release = resolve })
    return { status: 200, data: { accessToken: 'new', expiresIn: 900 }, config }
  }
  let delayed
  page.api.defaults.adapter = async config => {
    if (config.headers.get('Authorization') === 'Bearer old') {
      if (config.url === '/delayed') await new Promise(resolve => { delayed = resolve })
      throw { config, response: { status: 401 } }
    }
    return { status: 200, data: [], config }
  }
  const requests = ['/one', '/two', '/delayed'].map(url => page.api.get(url))
  await settle()
  assert.equal(rotations, 1)
  release()
  await Promise.all(requests.slice(0, 2))
  delayed()
  await requests[2]
  assert.equal(rotations, 1)
})

test('403 does not refresh, and a rejected refresh does not loop', async () => {
  const page = await mount('TicketDetailPage', auth(allPermissions), adapterFor(ticket()))
  page.setAccessToken({ accessToken: 'test-token', expiresIn: 900 })
  let rotations = 0
  let ended = 0
  const unsubscribe = page.onSessionEnded(() => { ended++ })
  page.authApi.defaults.adapter = async config => {
    rotations++
    throw { config, response: { status: 401 } }
  }
  page.api.defaults.adapter = async config => { throw { config, response: { status: 403 } } }
  await assert.rejects(page.api.get('/forbidden'))
  assert.equal(rotations, 0)
  assert.equal(ended, 0)
  page.api.defaults.adapter = async config => { throw { config, response: { status: 401 } } }
  await assert.rejects(page.api.get('/expired'))
  assert.equal(rotations, 1)
  assert.equal(ended, 1)
  unsubscribe()
})

test('invalid uploads show local errors without sending requests', async () => {
  let uploads = 0
  const page = await mount('TicketDetailPage', auth(collaborationPermissions), adapterFor(ticket(), config => {
    if (config.method === 'post') uploads++
  }))
  for (const [file, message] of [
    [{ size: 6 * 1024 * 1024, type: 'image/png' }, /Maximum file size/],
    [{ size: 10, type: 'text/plain' }, /Only JPG, PNG and PDF/],
  ]) {
    const input = nodes(page.render()).find(node => node.type === 'input' && node.props.type === 'file')
    const target = { files: [file], value: 'selected-file' }
    await input.props.onChange({ target })
    assert.match(text(page.render()), message)
    assert.equal(target.value, '')
  }
  assert.equal(uploads, 0)
})

test('changing own email signs out after saving and before further authenticated requests', async () => {
  let signedOut = false
  const currentAuth = { ...auth(allPermissions), signOut() { signedOut = true } }
  const requests = []
  const page = await mount('UsersPage', currentAuth, adapterFor(ticket(), config => {
    if (config.method === 'put') {
      requests.push(JSON.parse(config.data))
      return { status: 200, data: {}, config, headers: {} }
    }
  }))
  button(page.render(), 'Edit').props.onClick()
  nodes(page.render()).find(node => node.type === 'input' && node.props.type === 'email').props.onChange({ target: { value: 'new@example.com' } })
  await nodes(page.render()).find(node => node.type === 'form').props.onSubmit(event)
  assert.equal(requests[0].email, 'new@example.com')
  assert.equal(signedOut, true)
})

test('an older ticket response cannot overwrite a newer refresh', async () => {
  let release
  let reads = 0
  const page = await mount('TicketDetailPage', auth(allPermissions), adapterFor(ticket(), config => {
    if (config.url.includes('get-ticket-by-id')) {
      reads++
      if (reads === 1) return new Promise(resolve => { release = () => resolve({ status: 200, data: { ...ticket(), title: 'Older title' }, headers: {}, config }) })
      return { status: 200, data: { ...ticket(), title: 'Newer title' }, headers: {}, config }
    }
  }))
  await button(page.render(), 'Refresh').props.onClick()
  release()
  await settle()
  assert.match(text(page.render()), /Newer title/)
  assert.doesNotMatch(text(page.render()), /Older title/)
})

 test('login uses JSON and startup refresh is shared; expiry follows expiresIn', async () => {
  const page = await mount('TicketDetailPage', auth(allPermissions), adapterFor(ticket()))
  const calls = []
  page.authApi.defaults.adapter = async config => {
    calls.push(config)
    return { status: 200, data: { accessToken: 'fresh', expiresIn: 0.001 }, config }
  }
  await page.login('agent@example.com', 'test-password')
  assert.deepEqual(JSON.parse(calls[0].data), { email: 'agent@example.com', password: 'test-password' })
  assert.equal(calls[0].url, '/api/v1/auth/login')
  assert.equal(calls[0].withCredentials, true)
  await Promise.all([page.refreshAccessToken(), page.refreshAccessToken()])
  assert.equal(calls.length, 2)
  assert.equal(calls[1].data, undefined)
  await new Promise(resolve => setTimeout(resolve, 5))
  page.api.defaults.adapter = async config => {
    assert.equal(config.headers.get('Authorization'), 'Bearer fresh')
    return { status: 200, data: [], config }
  }
  await page.api.get('/protected')
  assert.equal(calls.length, 3)
})

test('missing permissions fail closed for every protected page regardless of role', async () => {
  assert.equal(currentPermissionAccess.permissionsAvailable, false)
  for (const name of allPermissions) assert.equal(currentPermissionAccess.hasPermission(name), false)
  for (const role of ['ADMIN', 'SUPERVISOR', 'EMPLOYEE']) {
    for (const pageName of ['DashboardPage', 'TicketsPage', 'TicketDetailPage', 'UsersPage', 'DepartmentsPage', 'RolesPage']) {
      const requests = []
      const page = await mount(pageName, { ...auth([], role), ...currentPermissionAccess }, adapterFor(ticket(), config => { requests.push(config.url) }))
      assert.equal(requests.length, 0, `${role}: ${pageName}`)
      for (const label of ['Create Ticket', 'Add User', 'Add Department', 'Create Role', 'Assign', 'Move to', 'Update', 'Post comment', 'Upload File']) assert.ok(!button(page.render(), label), `${pageName}: ${label}`)
    }
  }
})

test('ticket sections request only their own permitted APIs', async () => {
  const requests = []
  const page = await mount('TicketDetailPage', auth(['TICKET_VIEW', 'COMMENT_CREATE']), adapterFor(ticket(), config => { requests.push(config.url) }))
  assert.deepEqual(requests, ['/api/v1/ticket/get-ticket-by-id/10'])
  assert.ok(button(page.render(), 'Post comment'))
  assert.ok(!button(page.render(), 'Upload File'))
})

test('assignment does not implicitly grant USER_VIEW or priority updates', async () => {
  const requests = []
  const page = await mount('TicketDetailPage', auth(['TICKET_VIEW', 'TICKET_ASSIGN']), adapterFor(ticket(), config => { requests.push(config.url) }))
  assert.equal(button(page.render(), 'Assign').props.disabled, true)
  assert.ok(!requests.includes('/api/v1/user/get'))
  assert.ok(!button(page.render(), 'Update'))
})

test('ticket details permission never grants a global ticket list', async () => {
  const requests = []
  await mount('TicketsPage', auth(['TICKET_VIEW']), adapterFor(ticket(), config => { requests.push(config.url) }))
  assert.equal(requests.length, 0)
  await mount('TicketsPage', auth(['TICKET_VIEW_OWN']), adapterFor(ticket(), config => { requests.push(config.url) }))
  assert.deepEqual(requests, ['/api/v1/ticket/get-my-tickets'])
})

test('user forms offer dynamic roles from the authorized catalog', async () => {
  const page = await mount('UsersPage', auth(['USER_VIEW', 'USER_MANAGE_ROLE', 'ROLE_VIEW']), adapterFor(ticket()))
  button(page.render(), 'Change role').props.onClick()
  assert.ok(nodes(page.render()).filter(node => node.type === 'option').map(text).includes('SUPERVISOR'))
  for (const label of ['Add User', 'Edit', 'Deactivate']) assert.ok(!button(page.render(), label))
})

const roleRecord = { id: 7, name: 'SUPERVISOR', permissions: ['USER_VIEW'] }
const permissionCatalog = [{ id: 11, name: 'USER_VIEW' }, { id: 12, name: 'TICKET_ASSIGN' }]
function roleAdapter(requests, override = () => undefined) {
  return async config => {
    requests.push({ method: config.method, url: config.url, body: config.data })
    const custom = override(config)
    if (custom !== undefined) return custom
    const data = config.url === '/api/v1/role/get' ? [roleRecord] : config.url === '/api/v1/role/get/7' ? roleRecord : config.url === '/api/v1/permissions/get' ? permissionCatalog : {}
    return { status: 200, data, config, headers: {} }
  }
}

test('ROLE_VIEW allows role details without catalog access or mutations', async () => {
  const requests = []
  const page = await mount('RolesPage', auth(['ROLE_VIEW']), roleAdapter(requests))
  assert.deepEqual(requests.map(r => r.url), ['/api/v1/role/get'])
  assert.ok(!button(page.render(), 'Create Role')); assert.ok(!button(page.render(), 'Delete'))
  await button(page.render(), 'View permissions').props.onClick()
  assert.equal(requests.at(-1).url, '/api/v1/role/get/7')
  assert.match(text(page.render()), /USER_VIEW/)
  assert.ok(!button(page.render(), 'Assign')); assert.ok(!button(page.render(), 'Remove'))
})

test('PERMISSION_VIEW alone does not fetch roles or allow permission mutations', async () => {
  const requests = []
  const page = await mount('RolesPage', auth(['PERMISSION_VIEW']), roleAdapter(requests))
  assert.deepEqual(requests.map(r => r.url), ['/api/v1/permissions/get'])
  assert.match(text(page.render()), /TICKET_ASSIGN/)
  assert.ok(!button(page.render(), 'Assign')); assert.ok(!button(page.render(), 'Remove'))
})

test('role creation sends the name DTO and preserves duplicate errors in its modal', async () => {
  const requests = []; let fail = true
  const page = await mount('RolesPage', auth(['ROLE_CREATE']), roleAdapter(requests, config => {
    if (config.method === 'post') return fail ? reject(400, 'Role already exists') : { status: 200, data: {}, config, headers: {} }
  }))
  assert.equal(requests.length, 0)
  button(page.render(), 'Create Role').props.onClick()
  nodes(page.render()).find(n => n.type === 'input').props.onChange({ target: { value: 'SUPERVISOR' } })
  await nodes(page.render()).find(n => n.type === 'form').props.onSubmit(event)
  assert.deepEqual(requests.at(-1), { method: 'post', url: '/api/v1/role/add', body: JSON.stringify({ name: 'SUPERVISOR' }) })
  assert.match(text(nodes(page.render()).find(n => n.type === 'form')), /Role already exists/)
  fail = false
  await nodes(page.render()).find(n => n.type === 'form').props.onSubmit(event)
  assert.ok(!nodes(page.render()).find(n => n.type === 'form'))
})

test('role deletion displays backend safety errors unchanged', async () => {
  for (const message of ['Cannot delete a role assigned to users', 'Default roles cannot be deleted', 'Access denied']) {
    const requests = []
    const page = await mount('RolesPage', auth(['ROLE_VIEW', 'ROLE_DELETE']), roleAdapter(requests, config => {
      if (config.method === 'delete') return reject(400, message)
    }))
    button(page.render(), 'Delete').props.onClick()
    const dialog = nodes(page.render()).find(node => node.props?.title === 'Delete Role')
    await button(dialog, 'Delete').props.onClick()
    assert.equal(requests.at(-1).url, '/api/v1/role/delete/7')
    assert.ok(text(page.render()).includes(message))
    assert.ok(!button(page.render(), 'Create Role'))
  }
})

test('assign and remove use correct role/permission IDs without request bodies', async () => {
  const requests = []
  const page = await mount('RolesPage', auth(['ROLE_VIEW', 'PERMISSION_VIEW', 'ROLE_MANAGE_PERMISSIONS']), roleAdapter(requests))
  await button(page.render(), 'View permissions').props.onClick()
  const action = label => nodes(page.render()).find(n => n.type === 'button' && text(n).trim() === label)
  await action('Assign').props.onClick()
  assert.deepEqual(requests.find(r => r.method === 'post'), { method: 'post', url: '/api/v1/permissions/assign/7/12', body: undefined })
  await action('Remove').props.onClick()
  assert.deepEqual(requests.find(r => r.method === 'delete'), { method: 'delete', url: '/api/v1/permissions/remove/7/11', body: undefined })
  assert.ok(!requests.some(r => r.url === '/api/v1/permissions/add'))
})

test('permission relationship errors stay visible in role details', async () => {
  for (const message of ['Role already has this permission', 'Role does not have this permission', 'Access denied']) {
    const requests = []
    const page = await mount('RolesPage', auth(['ROLE_VIEW', 'PERMISSION_VIEW', 'ROLE_MANAGE_PERMISSIONS']), roleAdapter(requests, config => {
      if (config.method === 'post') return reject(400, message)
    }))
    await button(page.render(), 'View permissions').props.onClick()
    await nodes(page.render()).find(n => n.type === 'button' && text(n).trim() === 'Assign').props.onClick()
    assert.ok(text(page.render()).includes(message))
  }
})

test('ROLE_MANAGE_PERMISSIONS does not grant permission catalog access', async () => {
  const requests = []
  const page = await mount('RolesPage', auth(['ROLE_VIEW', 'ROLE_MANAGE_PERMISSIONS']), roleAdapter(requests))
  await button(page.render(), 'View permissions').props.onClick()
  assert.ok(!requests.some(r => r.url === '/api/v1/permissions/get'))
  assert.ok(!button(page.render(), 'Assign')); assert.ok(!button(page.render(), 'Remove'))
  assert.match(text(page.render()), /Permission changes are disabled/)
})

test('navigation exposes only pages authorized by permissions, never by ADMIN', async () => {
  const cases = [
    [{ ...auth([], 'ADMIN'), ...currentPermissionAccess }, ['/dashboard']],
    [auth(['ROLE_CREATE']), ['/dashboard', '/roles']],
    [auth(['USER_VIEW', 'DEPARTMENT_VIEW', 'TICKET_VIEW_OWN']), ['/dashboard', '/tickets', '/departments', '/users']],
  ]
  for (const [currentAuth, expected] of cases) {
    const page = await mount('AppLayout', currentAuth, adapterFor(ticket()))
    assert.deepEqual(nodes(page.render()).filter(node => node.type === 'NavLink').map(node => node.props.to), expected)
  }
})

test('direct page routes deny access when permissions are missing', async () => {
  const page = await mount('App', { ...auth([], 'ADMIN'), ...currentPermissionAccess }, adapterFor(ticket()))
  const routes = nodes(page.render()).filter(node => node.type === 'Route')
  for (const path of ['/tickets', '/tickets/:id', '/users', '/departments', '/roles']) {
    const guard = routes.find(route => route.props.path === path).props.element
    const denied = guard.type(guard.props)
    assert.equal(denied.props.title, 'Permissions unavailable', path)
  }
})

let authProviderBundle
async function mountAuthProvider(initialUser) {
  if (!authProviderBundle) {
    const result = await build({
      stdin: { contents: "export { AuthProvider } from './src/context/AuthContext.jsx'; export { api, authApi } from './src/services/api.js'", resolveDir: root },
      absWorkingDir: root, bundle: true, write: false, format: 'cjs', jsx: 'automatic', packages: 'external',
      plugins: [{ name: 'auth-provider-harness', setup(builder) {
        builder.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'auth-test' }))
        builder.onLoad({ filter: /.*/, namespace: 'auth-test' }, () => ({ contents: 'export const createContext=()=>({Provider:"provider"}); export const useContext=()=>null; export const useState=(v)=>h.state(v); export const useEffect=(f,d)=>h.effect(f,d); export const useMemo=(f,d)=>h.memo(f,d);' }))
      } }],
    })
    authProviderBundle = result.outputFiles[0].text
  }
  const h = {
    values: [], effects: [], pending: [], memos: [], cursor: 0, effectCursor: 0, memoCursor: 0,
    state(initial) {
      const index = this.cursor++
      if (!(index in this.values)) this.values[index] = initial
      return [this.values[index], value => { this.values[index] = typeof value === 'function' ? value(this.values[index]) : value }]
    },
    effect(callback, deps) {
      const index = this.effectCursor++
      if (!this.effects[index] || deps.some((value, i) => value !== this.effects[index][i])) {
        this.effects[index] = deps; this.pending.push(callback)
      }
    },
    memo(callback, deps) {
      const index = this.memoCursor++
      if (!this.memos[index] || deps.some((value, i) => value !== this.memos[index].deps[i])) this.memos[index] = { deps, value: callback() }
      return this.memos[index].value
    },
  }
  const module = { exports: {} }
  vm.runInNewContext(authProviderBundle, { module, exports: module.exports, require, h, Date })
  let currentUser = initialUser
  let failure = null
  const requests = []
  const { api, authApi, AuthProvider } = module.exports
  authApi.defaults.adapter = async config => {
    requests.push(config.url)
    return { status: 200, data: { accessToken: 'test-token', expiresIn: 900 }, config, headers: {} }
  }
  api.defaults.adapter = async config => {
    requests.push(config.url)
    if (failure) throw { config, response: { status: 403, data: { message: failure } } }
    return { status: 200, data: currentUser, config, headers: {} }
  }
  const render = () => {
    h.cursor = 0; h.effectCursor = 0; h.memoCursor = 0
    return AuthProvider({ children: null }).props.value
  }
  render(); h.pending.splice(0).forEach(callback => callback())
  await settle()
  return { render, requests, setUser(value) { currentUser = value }, fail(message) { failure = message } }
}

const me = permissions => ({ id: 2, name: 'Supervisor', email: 'supervisor@example.com', departmentName: 'IT', roleName: 'SUPERVISOR', active: true, permissions })

test('AuthProvider restores permissions from /user/me and keeps checks stable between renders', async () => {
  const page = await mountAuthProvider(me(['USER_VIEW', 'TICKET_ASSIGN']))
  const current = page.render()
  assert.equal(current.initializing, false)
  assert.equal(current.permissionsAvailable, true)
  assert.equal(current.hasPermission('USER_VIEW'), true)
  assert.equal(current.hasPermission('TICKET_ASSIGN'), true)
  assert.equal(current.hasPermission('ROLE_DELETE'), false)
  assert.equal(current.hasPermission, page.render().hasPermission)
  assert.deepEqual(page.requests, ['/api/v1/auth/refresh', '/api/v1/user/me'])
})

test('sign-in and explicit user refresh replace permissions rather than merging old grants', async () => {
  const page = await mountAuthProvider(me(['ROLE_VIEW']))
  page.setUser(me(['USER_VIEW']))
  await page.render().signIn('supervisor@example.com', 'password')
  assert.equal(page.render().hasPermission('USER_VIEW'), true)
  assert.equal(page.render().hasPermission('ROLE_VIEW'), false)
  page.setUser(me(['ROLE_CREATE']))
  const refreshed = await page.render().refreshUser()
  assert.equal(refreshed.permissions[0], 'ROLE_CREATE')
  assert.equal(page.render().hasPermission('ROLE_CREATE'), true)
  assert.equal(page.render().hasPermission('USER_VIEW'), false)
  assert.ok(page.requests.includes('/api/v1/auth/login'))
})

test('missing or invalid permission lists deny every grant without inferring ADMIN access', async () => {
  const page = await mountAuthProvider(me(['ROLE_VIEW']))
  for (const invalid of [undefined, null, 'ROLE_VIEW', {}, ['ROLE_VIEW', null], ['ROLE_VIEW', {}], [''], [' USER_VIEW ']]) {
    page.setUser({ ...me(invalid), roleName: 'ADMIN' })
    await page.render().refreshUser()
    assert.equal(page.render().permissionsAvailable, false)
    assert.equal(page.render().hasPermission('ROLE_VIEW'), false)
    assert.equal(page.render().hasPermission('USER_VIEW'), false)
  }
  page.setUser(me([])); await page.render().refreshUser()
  assert.equal(page.render().permissionsAvailable, true)
  assert.equal(page.render().hasAnyPermission(...allPermissions), false)
})

test('failed permission reload clears stale grants without signing out on 403', async () => {
  const page = await mountAuthProvider(me(['ROLE_MANAGE_PERMISSIONS']))
  page.fail('Access denied')
  await assert.rejects(page.render().refreshUser())
  const current = page.render()
  assert.equal(current.permissionsAvailable, false)
  assert.equal(current.hasPermission('ROLE_MANAGE_PERMISSIONS'), false)
  assert.equal(current.user.id, 2)
  assert.ok(!page.requests.includes('/api/v1/auth/logout'))
})

test('editing the current role reloads its permissions before requesting role details again', async () => {
  const requests = []; let reloads = 0; let page
  const currentAuth = {
    ...auth(['ROLE_VIEW', 'PERMISSION_VIEW', 'ROLE_MANAGE_PERMISSIONS']),
    async refreshUser() {
      reloads++
      page.h.auth = auth(['USER_VIEW'])
      return me(['USER_VIEW'])
    },
  }
  page = await mount('RolesPage', currentAuth, roleAdapter(requests))
  await button(page.render(), 'View permissions').props.onClick()
  const detailReads = requests.filter(r => r.url === '/api/v1/role/get/7').length
  await nodes(page.render()).find(n => n.type === 'button' && text(n).trim() === 'Remove').props.onClick()
  assert.equal(reloads, 1)
  assert.equal(requests.filter(r => r.url === '/api/v1/role/get/7').length, detailReads)
  assert.ok(!button(page.render(), 'Remove'))
})

test('editing another role does not reload unrelated current-user permissions', async () => {
  const requests = []; let reloads = 0
  const page = await mount('RolesPage', {
    ...auth(['ROLE_VIEW', 'PERMISSION_VIEW', 'ROLE_MANAGE_PERMISSIONS'], 'MANAGER'),
    async refreshUser() { reloads++; return me([]) },
  }, roleAdapter(requests))
  await button(page.render(), 'View permissions').props.onClick()
  await nodes(page.render()).find(n => n.type === 'button' && text(n).trim() === 'Assign').props.onClick()
  assert.equal(reloads, 0)
})

test('manual roles refresh reloads /user/me and respects newly revoked catalog access', async () => {
  const requests = []; let reloads = 0
  const page = await mount('RolesPage', {
    ...auth(['ROLE_VIEW', 'PERMISSION_VIEW']),
    async refreshUser() { reloads++; return me([]) },
  }, roleAdapter(requests))
  const before = requests.length
  await button(page.render(), 'Refresh').props.onClick()
  assert.equal(reloads, 1)
  assert.equal(requests.length, before)
})

test('role deletion opens the existing modal with its role name and only Cancel/Delete buttons', async () => {
  const requests = []
  const page = await mount('RolesPage', auth(['ROLE_VIEW', 'ROLE_DELETE']), roleAdapter(requests))
  button(page.render(), 'Delete').props.onClick()
  const dialog = nodes(page.render()).find(node => node.props?.title === 'Delete Role')
  assert.ok(dialog)
  assert.match(text(dialog), /SUPERVISOR/)
  const renderedDialog = dialog.type(dialog.props)
  assert.deepEqual(nodes(renderedDialog).filter(node => node.type === 'button').map(node => text(node).trim()), ['Cancel', 'Delete'])
  assert.ok(!requests.some(r => r.method === 'delete'))
  button(dialog, 'Cancel').props.onClick()
  assert.ok(!nodes(page.render()).some(node => node.props?.title === 'Delete Role'))
  assert.ok(!requests.some(r => r.method === 'delete'))
})

test('role delete confirmation sends one request, disables actions in flight and refreshes on success', async () => {
  const requests = []; let completeDelete; let deleted = false
  const page = await mount('RolesPage', auth(['ROLE_VIEW', 'ROLE_DELETE']), roleAdapter(requests, config => {
    if (config.method === 'delete') return new Promise(resolve => {
      completeDelete = () => { deleted = true; resolve({ status: 200, data: {}, config, headers: {} }) }
    })
    if (deleted && config.url === '/api/v1/role/get') return { status: 200, data: [], config, headers: {} }
  }))
  button(page.render(), 'Delete').props.onClick()
  let dialog = nodes(page.render()).find(node => node.props?.title === 'Delete Role')
  const confirm = button(dialog, 'Delete').props.onClick
  const first = confirm(); const duplicate = confirm()
  await settle()
  assert.equal(requests.filter(r => r.method === 'delete').length, 1)
  assert.equal(requests.find(r => r.method === 'delete').url, '/api/v1/role/delete/7')
  dialog = nodes(page.render()).find(node => node.props?.title === 'Delete Role')
  assert.equal(button(dialog, 'Delete').props.disabled, true)
  assert.equal(button(dialog, 'Cancel').props.disabled, true)
  dialog.props.onClose()
  assert.ok(nodes(page.render()).some(node => node.props?.title === 'Delete Role'))
  completeDelete(); await Promise.all([first, duplicate])
  assert.ok(!nodes(page.render()).some(node => node.props?.title === 'Delete Role'))
  assert.equal(requests.filter(r => r.url === '/api/v1/role/get').length, 2)
  assert.ok(!button(page.render(), 'View permissions'))
})

test('failed role deletion keeps the role and confirmation open with the backend error', async () => {
  const requests = []
  const page = await mount('RolesPage', auth(['ROLE_VIEW', 'ROLE_DELETE']), roleAdapter(requests, config => {
    if (config.method === 'delete') return reject(400, 'Cannot delete a role assigned to users')
  }))
  button(page.render(), 'Delete').props.onClick()
  let dialog = nodes(page.render()).find(node => node.props?.title === 'Delete Role')
  await button(dialog, 'Delete').props.onClick()
  dialog = nodes(page.render()).find(node => node.props?.title === 'Delete Role')
  assert.ok(dialog)
  assert.match(text(dialog), /Cannot delete a role assigned to users/)
  assert.equal(button(dialog, 'Delete').props.disabled, false)
  assert.ok(button(page.render(), 'View permissions'))
  assert.equal(requests.filter(r => r.url === '/api/v1/role/get').length, 1)
})

test('page entry and navigation permit each department/user operation independently', async () => {
  const cases = [
    ...['DEPARTMENT_VIEW', 'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE'].map(permission => [permission, '/departments']),
    ...['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_MANAGE_ROLE', 'USER_ACTIVATE', 'USER_DEACTIVATE'].map(permission => [permission, '/users']),
    ['ROLE_CREATE', '/roles'], ['TICKET_CREATE', '/tickets'],
  ]
  for (const [permission, path] of cases) {
    const currentAuth = auth([permission])
    const page = await mount('App', currentAuth, adapterFor(ticket()))
    const guard = nodes(page.render()).find(node => node.type === 'Route' && node.props.path === path).props.element
    assert.equal(guard.type(guard.props), guard.props.children, `${permission}: direct route`)
    const layout = await mount('AppLayout', currentAuth, adapterFor(ticket()))
    assert.ok(nodes(layout.render()).some(node => node.type === 'NavLink' && node.props.to === path), `${permission}: navigation`)
  }
})

test('DEPARTMENT_CREATE alone creates without requesting or showing department records', async () => {
  const requests = []
  const page = await mount('DepartmentsPage', auth(['DEPARTMENT_CREATE']), adapterFor(ticket(), config => { requests.push(config) }))
  assert.equal(requests.length, 0)
  assert.ok(!nodes(page.render()).some(node => node.props?.title === 'Your Departments'))
  button(page.render(), 'Add Department').props.onClick()
  nodes(page.render()).find(node => node.type === 'input').props.onChange({ target: { value: 'Support' } })
  await nodes(page.render()).find(node => node.type === 'form').props.onSubmit(event)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].method, 'post')
  assert.equal(requests[0].url, '/api/v1/department/add')
  assert.deepEqual(JSON.parse(requests[0].data), { name: 'Support' })
  assert.ok(!nodes(page.render()).some(node => node.props?.title === 'Your Departments'))
})

test('USER_CREATE alone opens the create form without probing user, role or department lists', async () => {
  const requests = []
  const page = await mount('UsersPage', auth(['USER_CREATE']), adapterFor(ticket(), config => { requests.push(config) }))
  assert.equal(requests.length, 0)
  assert.ok(!nodes(page.render()).some(node => node.props?.title === 'Team Members'))
  button(page.render(), 'Add User').props.onClick()
  assert.ok(nodes(page.render()).some(node => node.type === 'form'))
  assert.match(text(page.render()), /Role choices require permission to view roles/)
  assert.match(text(page.render()), /Department choices require permission to view departments/)
  assert.equal(button(page.render(), 'Create User').props.disabled, true)
  assert.equal(requests.length, 0)
})

test('USER_CREATE plus lookup permissions creates a user without USER_VIEW or user-list requests', async () => {
  const requests = []
  const page = await mount('UsersPage', auth(['USER_CREATE', 'ROLE_VIEW', 'DEPARTMENT_VIEW']), adapterFor(ticket(), config => { requests.push(config) }))
  assert.ok(!nodes(page.render()).some(node => node.props?.title === 'Team Members'))
  button(page.render(), 'Add User').props.onClick()
  const inputs = nodes(page.render()).filter(node => node.type === 'input')
  inputs[0].props.onChange({ target: { value: 'New User' } })
  nodes(page.render()).find(node => node.type === 'input' && node.props.type === 'email').props.onChange({ target: { value: 'new@example.com' } })
  nodes(page.render()).find(node => node.type === 'input' && node.props.type === 'password').props.onChange({ target: { value: 'Password1!' } })
  let selects = nodes(page.render()).filter(node => node.type === 'select')
  selects[0].props.onChange({ target: { value: 'AGENT' } })
  selects = nodes(page.render()).filter(node => node.type === 'select')
  selects[1].props.onChange({ target: { value: '1' } })
  await nodes(page.render()).find(node => node.type === 'form').props.onSubmit(event)
  const create = requests.find(config => config.method === 'post')
  assert.equal(create.url, '/api/v1/user/add')
  assert.deepEqual(JSON.parse(create.data), { name: 'New User', email: 'new@example.com', password: 'Password1!', roleName: 'AGENT', departmentId: 1 })
  assert.ok(!requests.some(config => config.url === '/api/v1/user/get'))
})

test('targeted department/user operations do not reveal records without VIEW', async () => {
  for (const [pageName, permissions] of [
    ['DepartmentsPage', ['DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE']],
    ['UsersPage', ['USER_UPDATE', 'USER_MANAGE_ROLE', 'USER_ACTIVATE', 'USER_DEACTIVATE']],
  ]) {
    const requests = []
    const page = await mount(pageName, auth(permissions), adapterFor(ticket(), config => { requests.push(config) }))
    assert.equal(requests.length, 0)
    for (const label of ['Edit', 'Delete', 'Change role', 'Activate', 'Deactivate']) assert.ok(!button(page.render(), label))
  }
})

test('TICKET_CREATE alone cannot load ticket lists or details, but can create a ticket', async () => {
  const requests = []
  const page = await mount('TicketsPage', auth(['TICKET_CREATE']), adapterFor(ticket(), config => { requests.push(config) }))
  assert.equal(requests.length, 0)
  assert.ok(!nodes(page.render()).some(node => node.props?.title === 'All Support Tickets'))
  button(page.render(), 'Create Ticket').props.onClick()
  nodes(page.render()).find(node => node.type === 'input').props.onChange({ target: { value: 'Access request' } })
  nodes(page.render()).find(node => node.type === 'textarea').props.onChange({ target: { value: 'Please restore access.' } })
  await nodes(page.render()).find(node => node.type === 'form').props.onSubmit(event)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].method, 'post')
  assert.equal(requests[0].url, '/api/v1/ticket/add')
  const app = await mount('App', auth(['TICKET_CREATE', 'TICKET_ASSIGN', 'TICKET_UPDATE_STATUS', 'TICKET_UPDATE_PRIORITY']), adapterFor(ticket()))
  const detailsGuard = nodes(app.render()).find(node => node.type === 'Route' && node.props.path === '/tickets/:id').props.element
  assert.equal(detailsGuard.type(detailsGuard.props).props.title, 'Access denied')
  const detail = await mount('TicketDetailPage', auth(['TICKET_ASSIGN', 'TICKET_UPDATE_STATUS', 'TICKET_UPDATE_PRIORITY']), adapterFor(ticket(), config => { requests.push(config) }))
  assert.equal(requests.length, 1)
  assert.ok(!button(detail.render(), 'Assign'))
})
