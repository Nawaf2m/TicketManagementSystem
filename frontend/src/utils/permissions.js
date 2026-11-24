// Only a verified current-user permission list may be passed here, never a role name
// or the role-management catalog. Unknown permissions fail closed.
export function createPermissionAccess(permissionNames) {
  const permissionsAvailable = Array.isArray(permissionNames) && permissionNames.every(name => typeof name === 'string' && /^[A-Z][A-Z0-9_]*$/.test(name))
  const names = new Set(permissionsAvailable ? permissionNames : [])
  const hasPermission = name => names.has(name)
  const hasAnyPermission = (...required) => required.some(hasPermission)
  return { permissionsAvailable, hasPermission, hasAnyPermission }
}

export const departmentPagePermissions = ['DEPARTMENT_VIEW', 'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE']
export const cityPagePermissions = ['CITY_VIEW', 'CITY_CREATE']
export const bankPagePermissions = ['BANK_VIEW', 'BANK_CREATE']
export const userPagePermissions = ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_MANAGE_ROLE', 'USER_ACTIVATE', 'USER_DEACTIVATE']
export const ticketListPermissions = ['TICKET_VIEW_ALL', 'TICKET_VIEW_OWN', 'TICKET_VIEW_ASSIGNED']
export const rolePagePermissions = ['ROLE_VIEW', 'ROLE_CREATE', 'ROLE_DELETE', 'ROLE_MANAGE_PERMISSIONS', 'PERMISSION_VIEW']
export const permissionsUnavailableMessage = 'Your access permissions are currently unavailable. Protected actions are disabled. Please contact your administrator.'

export const merchantPagePermissions = ['MERCHANT_VIEW', 'MERCHANT_CREATE', 'MERCHANT_UPDATE', 'MERCHANT_DELETE']

export const terminalPagePermissions = ['TERMINAL_VIEW', 'TERMINAL_CREATE', 'TERMINAL_DELETE']
export const devicePagePermissions = ['DEVICE_VIEW', 'DEVICE_CREATE', 'DEVICE_UPDATE', 'DEVICE_DELETE']
export const simCardPagePermissions = ['SIMCARD_VIEW', 'SIMCARD_CREATE', 'SIMCARD_UPDATE', 'SIMCARD_DELETE']
