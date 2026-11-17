
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Headphones, LockKeyhole, ShieldCheck, Ticket } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Notice } from '../components/UI'
import { messageFromError } from '../utils/data'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signOut, busy, sessionError } = useAuth()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')

    try {
      await signIn(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setPassword('')
    }
  }

  return (
    <div className="login-screen">
      <div className="login-visual">
        <div className="login-brand">
          <span className="brand-emblem"><i/><b/></span>
          <div>
            <strong>سند باي</strong>
            <span>SANAD PAY</span>
          </div>
        </div>

        <div className="login-hero">
          <span className="hero-pill">
            <ShieldCheck size={15}/> SERVICE MANAGEMENT
          </span>

          <h1>Better support.<br/><em>Happier teams.</em></h1>

          <p>
            Stay organized, resolve issues faster, and keep every support
            request on track—all in one beautiful workspace.
          </p>

          <div className="floating-ticket">
            <div className="floating-icon"><Ticket/></div>
            <div>
              <strong>Your support workspace</strong>
              <span>Smart tracking. Clear progress.</span>
            </div>
            <span className="floating-dot"/>
          </div>
        </div>

        <div className="login-visual-footer">
          DESIGNED FOR SIMPLE, EFFECTIVE SUPPORT
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={submit}>
          <span className="login-form-icon">
            <Headphones size={26}/>
          </span>

          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your workspace</h2>
          <p className="subdued">
            Enter your credentials to access the support desk.
          </p>

          <Notice>{error || sessionError}</Notice>
          {sessionError && <button type="button" className="btn" disabled={busy} onClick={signOut}>Retry sign out</button>}

          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="username"
              required
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowPassword(v => !v)}
                aria-label="Show password"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </label>

          <button className="btn btn-primary full" disabled={busy} type="submit">
            {busy ? 'Signing in...' : 'Sign in'}
            <ArrowRight size={18}/>
          </button>

          <div className="login-security">
            <LockKeyhole size={15}/>
            Protected by secure JWT authentication
          </div>
        </form>
      </div>
    </div>
  )
}
