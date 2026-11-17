export function listOf(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  if (Array.isArray(value.content)) return value.content
  if (Array.isArray(value.data)) return value.data
  if (Array.isArray(value.tickets)) return value.tickets
  if (Array.isArray(value.users)) return value.users
  if (Array.isArray(value.departments)) return value.departments
  if (Array.isArray(value.activities)) return value.activities
  return []
}

export function objectOf(value) {
  return value?.data && typeof value.data === 'object' && !Array.isArray(value.data) ? value.data : value || {}
}

export function messageFromError(error) {
  const data = error?.response?.data
  if (typeof data === 'string') return data
  return data?.message || data?.error || (error?.response?.status === 401 ? 'Invalid email or password.' : error?.response?.status === 403 ? 'You do not have permission for this action.' : error?.message === 'Network Error' ? 'Cannot reach Spring Boot. Make sure it is running on port 8080.' : error?.message) || 'Something went wrong.'
}

export function getRole(user) {
  return String(user?.roleName || user?.role?.name || user?.role || '')
    .replace(/^ROLE_/, '')
    .toUpperCase()
}

export function getName(user) {
  return user?.name || user?.fullName || user?.username || user?.email?.split('@')[0] || 'User'
}

export function ticketOwner(ticket) {
  return ticket?.createdById ?? ticket?.createdBy?.id ?? ticket?.created_by?.id
}

export function assignedAgent(ticket) {
  return ticket?.assignedToId ?? ticket?.assignedTo?.id ?? ticket?.assigned_to?.id
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

export function displayStatus(value) {
  return String(value || 'OPEN').replaceAll('_', ' ')
}

export function activityDescription(item, users = []) {
  if (item.action === 'STATUS') return `Status changed to ${displayStatus(item.newValue)}`
  if (item.action === 'PRIORITY') return `Priority changed to ${item.newValue}`
  if (item.action === 'ASSIGNED') {
    const agent = users.find(user => String(user.id) === String(item.newValue))
    return agent ? `Assigned to ${agent.name}` : 'Agent assignment updated'
  }
  return `${item.action || 'Activity'} updated`
}
