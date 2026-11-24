import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Building2, CreditCard, Cpu, Store, Landmark, MapPin, LayoutDashboard, LogOut, Menu, Search, Shield, Ticket, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getName } from '../utils/data'
import { Notice } from '../components/UI'
import { devicePagePermissions } from '../utils/permissions'
import { simCardPagePermissions } from '../utils/permissions'
import { bankPagePermissions, cityPagePermissions, terminalPagePermissions, merchantPagePermissions, departmentPagePermissions, permissionsUnavailableMessage, rolePagePermissions, ticketListPermissions, userPagePermissions } from '../utils/permissions'

const commonItems = [{ href: '/dashboard', icon: LayoutDashboard, title: 'Dashboard' }]
const SimCardIcon = ({ size = 19 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><rect x="7" y="10" width="8" height="8" rx="1"/><path d="M11 10v8M7 14h8"/></svg>

export default function AppLayout() {
  const { user, role, signOut, hasAnyPermission, permissionsAvailable } = useAuth()
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const canBrowseTickets = hasAnyPermission(...ticketListPermissions, 'TICKET_CREATE')
  const navItems = [
    ...commonItems,
    ...(canBrowseTickets ? [{ href: '/tickets', icon: Ticket, title: 'Tickets' }] : []),
    ...(hasAnyPermission(...departmentPagePermissions) ? [{ href: '/departments', icon: Building2, title: 'Departments' }] : []),
    ...(hasAnyPermission(...cityPagePermissions) ? [{ href: '/cities', icon: MapPin, title: 'City Management' }] : []),
    ...(hasAnyPermission(...terminalPagePermissions) ? [{ href: '/terminals', icon: CreditCard, title: 'Terminal Management' }] : []),
    ...(hasAnyPermission(...devicePagePermissions) ? [{ href: '/devices', icon: Cpu, title: 'Device Management' }] : []),
    ...(hasAnyPermission(...simCardPagePermissions) ? [{ href: '/simcards', icon: SimCardIcon, title: 'SimCard Management' }] : []),
    ...(hasAnyPermission(...merchantPagePermissions) ? [{ href: '/merchants', icon: Store, title: 'Merchant Management' }] : []),
    ...(hasAnyPermission(...bankPagePermissions) ? [{ href: '/banks', icon: Landmark, title: 'Bank Management' }] : []),
    ...(hasAnyPermission(...userPagePermissions) ? [{ href: '/users', icon: Users, title: 'Users' }] : []),
    ...(hasAnyPermission(...rolePagePermissions) ? [{ href: '/roles', icon: Shield, title: 'Roles & Permissions' }] : []),
  ]
  const onSignOut = async () => { await signOut(); navigate('/login', { replace: true }) }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-emblem"><i/><b/></span><div><strong>سند باي</strong><span>SANAD PAY</span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="side-nav">{navItems.map(({ href, icon: Icon, title }) => <NavLink key={href} to={href} onClick={() => setMobileNav(false)} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon size={19}/><span>{title}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-decoration"><i/><b/></div></div>
    </aside>
    {mobileNav && <div className="nav-overlay" onClick={() => setMobileNav(false)}/>}
    <div className="main-column">
      <header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu/></button></div>{canBrowseTickets && <form className="searchbar" onSubmit={e => {e.preventDefault(); navigate(`/tickets${search ? `?q=${encodeURIComponent(search)}` : ''}`)}}><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."/><kbd>↵</kbd></form>}<div className="topbar-actions"><div className="topbar-divider"/><div className="profile"><div className="avatar">{getName(user).slice(0, 2).toUpperCase()}</div><div className="profile-copy"><strong>{getName(user)}</strong><span>{role}</span></div></div><button className="icon-button logout" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={19}/></button></div></header>
      <main className="content">{!permissionsAvailable && <Notice>{permissionsUnavailableMessage}</Notice>}<Outlet/></main><footer className="footer">© {new Date().getFullYear()} Support Desk · Sanad-inspired interface <span>Ticket Management System v1.0</span></footer>
    </div>
  </div>
}
