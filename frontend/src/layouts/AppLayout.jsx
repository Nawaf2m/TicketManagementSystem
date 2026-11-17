import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Building2, LayoutDashboard, LogOut, Menu, Search, Ticket, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getName } from '../utils/data'

const commonItems = [{ href: '/dashboard', icon: LayoutDashboard, title: 'Dashboard' }, { href: '/tickets', icon: Ticket, title: 'Tickets' }]

export default function AppLayout() {
  const { user, role, signOut } = useAuth()
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const navItems = [
  ...commonItems,

  ...(role === 'ADMIN' ? [
    { href: '/departments', icon: Building2, title: 'Departments' },
    { href: '/users', icon: Users, title: 'Users' }
  ] : [])
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
      <header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu/></button></div><form className="searchbar" onSubmit={e => {e.preventDefault(); navigate(`/tickets${search ? `?q=${encodeURIComponent(search)}` : ''}`)}}><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."/><kbd>↵</kbd></form><div className="topbar-actions"><div className="topbar-divider"/><div className="profile"><div className="avatar">{getName(user).slice(0, 2).toUpperCase()}</div><div className="profile-copy"><strong>{getName(user)}</strong><span>{role}</span></div></div><button className="icon-button logout" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={19}/></button></div></header>
      <main className="content"><Outlet/></main><footer className="footer">© {new Date().getFullYear()} Support Desk · Sanad-inspired interface <span>Ticket Management System v1.0</span></footer>
    </div>
  </div>
}
