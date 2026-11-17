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

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }) {
  const { role } = useAuth()
  return role === 'ADMIN' ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  const { user, initializing } = useAuth()
  if (initializing) return <div className="login-screen" role="status">Restoring session...</div>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/users" element={<AdminOnly><UsersPage /></AdminOnly>} />
        <Route
          path="/departments"
          element={
            <AdminOnly>
              <DepartmentsPage />
            </AdminOnly>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
