import axios from 'axios'
import { listOf } from '../utils/data'

// Development: /api is proxied by Vite to localhost:8080 to avoid CORS.
export const api = axios.create({ baseURL: '' })
export const authApi = axios.create({ baseURL: '', withCredentials: true })
let accessToken = null
let expiresAt = 0
let refreshPromise = null
let logoutPromise = null
let generation = 0
const listeners = new Set()

export function onSessionEnded(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function clearSession() {
  generation++
  accessToken = null
  expiresAt = 0
  listeners.forEach(listener => listener())
}

export function setAccessToken(data) {
  if (!data?.accessToken || !Number.isFinite(data.expiresIn) || data.expiresIn <= 0) {
    throw new Error('Invalid authentication response.')
  }
  accessToken = data.accessToken
  expiresAt = Date.now() + data.expiresIn * 1000
}

// One shared promise also covers React StrictMode's repeated startup effect.
export function refreshAccessToken() {
  if (logoutPromise) return Promise.reject(new Error('Signing out.'))
  if (!refreshPromise) {
    const currentGeneration = generation
    refreshPromise = authApi.post('/api/v1/auth/refresh').then(({ data }) => {
      if (currentGeneration !== generation) throw new Error('Session changed.')
      setAccessToken(data)
      return accessToken
    }).catch(error => {
      if (error.response?.status === 401 && currentGeneration === generation) clearSession()
      throw error
    }).finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

export async function login(email, password) {
  if (logoutPromise) await logoutPromise
  if (refreshPromise) await refreshPromise.catch(() => {})
  clearSession()
  const { data } = await authApi.post('/api/v1/auth/login', { email, password })
  setAccessToken(data)
}

export function logout() {
  if (logoutPromise) return logoutPromise
  clearSession()
  logoutPromise = (async () => {
    // Wait for any rotation to set its new cookie before revoking it.
    if (refreshPromise) await refreshPromise.catch(() => {})
    await authApi.post('/api/v1/auth/logout')
  })().finally(() => { logoutPromise = null })
  return logoutPromise
}

api.interceptors.request.use(async config => {
  config._sessionGeneration ??= generation
  if (accessToken && Date.now() >= expiresAt) await refreshAccessToken()
  if (config._sessionGeneration !== generation) throw new Error('Session changed.')
  config.headers.delete('Authorization')
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`)
  config._accessToken = accessToken
  return config
})

api.interceptors.response.use(response => {
  if (response.config._sessionGeneration !== generation) throw new Error('Session changed.')
  return response
}, async error => {
  const config = error.config
  if (error.response?.status !== 401 || !config || config._sessionGeneration !== generation) throw error
  if (config._retried) {
    clearSession()
    throw error
  }
  config._retried = true
  // A delayed 401 for the previous token must reuse the token already refreshed.
  if (!accessToken || config._accessToken === accessToken) await refreshAccessToken()
  return api(config)
})

// Existing list endpoints report empty collections as 400 instead of [].
export async function getList(url, config) {
  try {
    const response = await api.get(url, config)
    return listOf(response.data)
  } catch (error) {
    if (error.response?.status === 400 && /^The list is empty\.?$/.test(error.response.data?.message || '')) return []
    throw error
  }
}

export const paths = {
  simCards: '/api/v1/simcard/get',
  addSimCard: '/api/v1/simcard/add',
  simCardById: (id) => `/api/v1/simcard/get-simcard-by-id/${id}`,
  simCardBySerialNumber: (serialNumber) => `/api/v1/simcard/get-simcard-by-serial-number/${encodeURIComponent(serialNumber)}`,
  updateSimCard: (id) => `/api/v1/simcard/update/${id}`,
  deleteSimCard: (id) => `/api/v1/simcard/delete/${id}`,
  devices: '/api/v1/device/get',
  addDevice: '/api/v1/device/add',
  deviceById: (id) => `/api/v1/device/get-device-by-id/${id}`,
  deviceBySerialNumber: (serialNumber) => `/api/v1/device/get-device-by-serial-number/${encodeURIComponent(serialNumber)}`,
  updateDevice: (id) => `/api/v1/device/update/${id}`,
  deleteDevice: (id) => `/api/v1/device/delete/${id}`,
  terminals: '/api/v1/terminal/get',
  createTerminals: (bankId, quantity) => `/api/v1/terminal/create/${bankId}/${quantity}`,
  terminalById: (id) => `/api/v1/terminal/get-terminal-by-id/${id}`,
  terminalByNumber: (number) => `/api/v1/terminal/get-terminal-by-number/${encodeURIComponent(number)}`,
  terminalByFullNumber: (number) => `/api/v1/terminal/get-terminal-by-full-number/${encodeURIComponent(number)}`,
  terminalsByBank: (id) => `/api/v1/terminal/get-terminals-by-bank/${id}`,
  terminalsByStatus: (status) => `/api/v1/terminal/get-terminals-by-status/${status}`,
  deleteTerminal: (id) => `/api/v1/terminal/delete/${id}`,
  merchants: '/api/v1/merchant/get',
  addMerchant: '/api/v1/merchant/add',
  updateMerchantName: (id) => `/api/v1/merchant/update-name/${id}`,
  addMerchantCity: (merchantId, cityId) => `/api/v1/merchant/add-city/${merchantId}/${cityId}`,
  removeMerchantCity: (merchantId, cityId) => `/api/v1/merchant/remove-city/${merchantId}/${cityId}`,
  deleteMerchant: (id) => `/api/v1/merchant/delete/${id}`,
  cities: '/api/v1/city/get',
  addCity: '/api/v1/city/add',
  updateCityName: (id) => `/api/v1/city/update-name/${id}`,
  deleteCity: (id) => `/api/v1/city/delete/${id}`,
  banks: '/api/v1/bank/get',
  bankById: (id) => `/api/v1/bank/get-bank-by-id/${id}`,
  addBank: '/api/v1/bank/add',
  updateBankName: (id) => `/api/v1/bank/update-name/${id}`,
  deleteBank: (id) => `/api/v1/bank/delete/${id}`,
  roles: '/api/v1/role/get',
  roleById: (id) => `/api/v1/role/get/${id}`,
  addRole: '/api/v1/role/add',
  deleteRole: (id) => `/api/v1/role/delete/${id}`,
  permissions: '/api/v1/permissions/get',
  permissionById: (id) => `/api/v1/permissions/get/${id}`,
  assignPermission: (roleId, permissionId) => `/api/v1/permissions/assign/${roleId}/${permissionId}`,
  removePermission: (roleId, permissionId) => `/api/v1/permissions/remove/${roleId}/${permissionId}`,
  users: '/api/v1/user/get',
  addUser: '/api/v1/user/add',
  updateUser: (id) => `/api/v1/user/update/${id}`,
  userById: (id) => `/api/v1/user/get-user-by-id/${id}`,
  userRole: (id) => `/api/v1/user/update-user-role/${id}`,
  activateUser: (id) => `/api/v1/user/activate-user/${id}`,
  deactivateUser: (id) => `/api/v1/user/deactivate-user/${id}`,
  departments: '/api/v1/department/get',
  addDepartment: '/api/v1/department/add',
  updateDepartment: (id) => `/api/v1/department/update/${id}`,
  deleteDepartment: (id) => `/api/v1/department/delete/${id}`,
  tickets: '/api/v1/ticket/get',
  myTickets: '/api/v1/ticket/get-my-tickets',
  assignedTickets: '/api/v1/ticket/get-assigned-tickets',
  ticketById: (id) => `/api/v1/ticket/get-ticket-by-id/${id}`,
  addTicket: '/api/v1/ticket/add',
  assignTicket: (ticketId, agentId) => `/api/v1/ticket/assign-ticket/${ticketId}/${agentId}`,
  advanceTicket: (id) => `/api/v1/ticket/advance-ticket-status/${id}`,
  changePriority: (id, priority) => `/api/v1/ticket/update-ticket-priority/${id}/${priority}`,
  comments: (id) => `/api/v1/comment/get-ticket-comments/${id}`,
  addComment: (id) => `/api/v1/comment/add/${id}`,
  attachments: (id) => `/api/v1/attachment/get-ticket-attachments/${id}`,
  uploadAttachment: (id) => `/api/v1/attachment/upload/${id}`,
  downloadAttachment: (id) => `/api/v1/attachment/download/${id}`,
  activities: (id) => `/api/v1/ticket-activity/get-ticket-activities/${id}`,
  recentActivities: '/api/v1/ticket-activity/get-recent-activities',
}
