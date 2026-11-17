import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../package.json', import.meta.url))
const bundles = new Map()

// Exercise page event handlers and rendered controls without a browser or live DB.
async function mount(page, auth, adapter) {
  if (!bundles.has(page)) {
    const result = await build({
      stdin: { contents: `export { default as Page } from './src/pages/${page}.jsx'; export { api, authApi, getList, setAccessToken, refreshAccessToken, login, logout, paths } from './src/services/api.js'`, resolveDir: root },
      absWorkingDir: root, bundle: true, write: false, format: 'cjs', jsx: 'automatic',
      packages: 'external', define: { 'import.meta.env': '{}' },
      plugins: [{ name: 'page-harness', setup(builder) {
        builder.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'harness' }))
        builder.onResolve({ filter: /context\/AuthContext$/ }, () => ({ path: 'auth', namespace: 'harness' }))
        builder.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: 'router', namespace: 'harness' }))
        builder.onLoad({ filter: /.*/, namespace: 'harness' }, ({ path }) => ({ contents: path === 'hooks'
          ? 'export const useState=(v)=>h.state(v); export const useRef=(v)=>h.ref(v); export const useEffect=(f,d)=>h.effect(f,d); export const useMemo=(f)=>f();'
          : path === 'auth' ? 'export const useAuth=()=>h.auth;'
            : 'export const useParams=()=>({id:"10"}); export const useNavigate=()=>()=>{}; export const Link="a"; export const useSearchParams=()=>[new URLSearchParams(),()=>{}];' }))
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
  vm.runInNewContext(bundles.get(page), { module, exports: module.exports, require, h, URLSearchParams, Blob, FormData, URL, console, Date })
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
const auth = role => ({ role, user: { id: 2, email: 'admin@example.com' }, signOut() {}, async refreshUser() {} })
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
        : config.url === '/api/v1/department/get' ? [{ id: 1, name: 'IT' }] : []
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

test('ticket controls follow role, assignment and every workflow status', async () => {
  for (const role of ['ADMIN', 'AGENT', 'EMPLOYEE']) {
    for (const status of ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) {
      for (const assigned of [2, 3]) {
        const page = await mount('TicketDetailPage', auth(role), adapterFor(ticket(status, assigned)))
        const tree = page.render()
        assert.equal(Boolean(button(tree, 'Move to')), status !== 'CLOSED' && (role === 'ADMIN' || role === 'AGENT' && assigned === 2))
        assert.equal(Boolean(button(tree, 'Assign')), role === 'ADMIN' && ['OPEN', 'IN_PROGRESS'].includes(status))
        assert.equal(Boolean(button(tree, 'Update')), role === 'ADMIN' && ['OPEN', 'IN_PROGRESS'].includes(status))
        assert.equal(Boolean(button(tree, 'Post comment')), status !== 'CLOSED')
        assert.equal(Boolean(button(tree, 'Upload File')), status !== 'CLOSED')
      }
    }
  }
})

test('failed comment preserves draft and displays the server error in the form', async () => {
  let fail = true
  const page = await mount('TicketDetailPage', auth('EMPLOYEE'), adapterFor(ticket(), config => {
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
  const page = await mount('TicketDetailPage', auth('ADMIN'), adapterFor(ticket()))
  for (const message of ['The list is empty', 'The list is empty.']) {
    page.api.defaults.adapter = () => reject(400, message)
    assert.equal((await page.getList('/example')).length, 0)
  }
  for (const [status, message] of [[401, 'Invalid email or password'], [403, 'Forbidden'], [500, 'Server failed'], [400, 'Invalid ticket']]) {
    page.api.defaults.adapter = () => reject(status, message)
    await assert.rejects(page.getList('/example'))
  }
})

test('section failures are visible and only active agents appear in assignment choices', async () => {
  const page = await mount('TicketDetailPage', auth('ADMIN'), adapterFor(ticket(), config => {
    if (config.url.includes('get-ticket-comments')) return reject(500, 'Discussion is unavailable')
  }))
  const tree = page.render()
  assert.match(text(tree), /Discussion is unavailable/)
  assert.doesNotMatch(text(tree), /No comments yet/)
  const options = nodes(tree).filter(node => node.type === 'option').map(text)
  assert.ok(options.includes('Active Agent'))
  assert.ok(!options.includes('Inactive Agent'))
})

test('agent dashboard includes created and assigned tickets without duplicates', async () => {
  const page = await mount('DashboardPage', auth('AGENT'), async config => ({
    status: 200, config, headers: {}, data: config.url.endsWith('get-my-tickets')
      ? [ticket(), { ...ticket(), id: 11 }] : [ticket(), { ...ticket('IN_PROGRESS'), id: 12 }],
  }))
  const tree = page.render()
  const totalCard = nodes(tree).find(node => node.type === 'article' && text(node).includes('Total Tickets'))
  assert.match(text(totalCard), /Total Tickets 3/)
  assert.equal(nodes(tree).filter(node => node.type === 'tr').length, 4)
})

test('department validation stays in the modal and matches the 30-character DTO limit', async () => {
  const page = await mount('DepartmentsPage', auth('ADMIN'), adapterFor(ticket(), config => {
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
  const page = await mount('UsersPage', auth('ADMIN'), adapterFor(ticket(), config => {
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
  const page = await mount('TicketDetailPage', auth('ADMIN'), adapterFor(ticket()))
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
  const page = await mount('TicketDetailPage', auth('ADMIN'), adapterFor(ticket()))
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
  const page = await mount('TicketDetailPage', auth('ADMIN'), adapterFor(ticket()))
  page.setAccessToken({ accessToken: 'test-token', expiresIn: 900 })
  let rotations = 0
  page.authApi.defaults.adapter = async config => {
    rotations++
    throw { config, response: { status: 401 } }
  }
  page.api.defaults.adapter = async config => { throw { config, response: { status: 403 } } }
  await assert.rejects(page.api.get('/forbidden'))
  assert.equal(rotations, 0)
  page.api.defaults.adapter = async config => { throw { config, response: { status: 401 } } }
  await assert.rejects(page.api.get('/expired'))
  assert.equal(rotations, 1)
})

test('invalid uploads show local errors without sending requests', async () => {
  let uploads = 0
  const page = await mount('TicketDetailPage', auth('EMPLOYEE'), adapterFor(ticket(), config => {
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
  const currentAuth = { ...auth('ADMIN'), signOut() { signedOut = true } }
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
  const page = await mount('TicketDetailPage', auth('ADMIN'), adapterFor(ticket(), config => {
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
  const page = await mount('TicketDetailPage', auth('ADMIN'), adapterFor(ticket()))
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
