import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import UsersPage from './pages/UsersPage'
import DepartmentsPage from './pages/DepartmentsPage'
import NotFoundPage from './pages/NotFoundPage'
import RolesPage from './pages/RolesPage'
import BanksPage from './pages/BanksPage'
import CitiesPage from './pages/CitiesPage'
import { EmptyState } from './components/UI'
import { bankPagePermissions, cityPagePermissions, departmentPagePermissions, permissionsUnavailableMessage, rolePagePermissions, ticketListPermissions, userPagePermissions } from './utils/permissions'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function RequirePermission({ anyOf, children }) {
  const { hasAnyPermission, permissionsAvailable } = useAuth()
  return hasAnyPermission(...anyOf) ? children : <EmptyState title={permissionsAvailable ? 'Access denied' : 'Permissions unavailable'} detail={permissionsAvailable ? 'You do not have permission to view this page.' : permissionsUnavailableMessage} />
}

export default function App() {
  const { user, initializing } = useAuth()
  if (initializing) return <div className="login-screen" role="status">Restoring session...</div>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<RequirePermission anyOf={[...ticketListPermissions, 'TICKET_CREATE']}><TicketsPage /></RequirePermission>} />
        <Route path="/tickets/:id" element={<RequirePermission anyOf={['TICKET_VIEW']}><TicketDetailPage /></RequirePermission>} />
        <Route path="/users" element={<RequirePermission anyOf={userPagePermissions}><UsersPage /></RequirePermission>} />
        <Route
          path="/departments"
          element={
            <RequirePermission anyOf={departmentPagePermissions}>
              <DepartmentsPage />
            </RequirePermission>
          }
        />
        <Route path="/roles" element={<RequirePermission anyOf={rolePagePermissions}><RolesPage /></RequirePermission>} />
        <Route path="/cities" element={<RequirePermission anyOf={cityPagePermissions}><CitiesPage /></RequirePermission>} />
        <Route path="/banks" element={<RequirePermission anyOf={bankPagePermissions}><BanksPage /></RequirePermission>} />
      </Route>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
