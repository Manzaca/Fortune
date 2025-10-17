import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabaseClient'
import logoTextRightWhite from './assets/logos/logo_text_right_white.png'
import logoTextUnderWhite from './assets/logos/logo_text_under_white.png'
import logoWhite from './assets/logos/logo_white.png'

function App() {
  const [mode, setMode] = useState('signIn')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })

  useEffect(() => {
    let isMounted = true

    const syncUser = async () => {
      const [{ data: sessionData }, { data: userData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ])

      if (!isMounted) return

      setSession(sessionData.session ?? null)
      setUser(userData.user ?? null)
    }

    syncUser()

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const displayName = useMemo(() => {
    const metadata = user?.user_metadata ?? {}
    const first = metadata.first_name
    const last = metadata.last_name
    if (first || last) {
      return [first, last].filter(Boolean).join(' ')
    }
    return user?.email ?? ''
  }, [user])

  const handleInputChange = (field) => (event) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'))
    setForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    })
    setErrorMessage('')
    setStatusMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setStatusMessage('')

    const email = form.email.trim()
    const password = form.password.trim()

    if (!email || !password) {
      setErrorMessage('Email and password are required.')
      setLoading(false)
      return
    }

    try {
      if (mode === 'signUp') {
        if (!form.firstName.trim() || !form.lastName.trim()) {
          setErrorMessage('Add your first and last name to create an account.')
          setLoading(false)
          return
        }

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
            },
          },
        })

        if (error) {
          throw error
        }

        if (!data.session) {
          setStatusMessage(
            'Check your inbox to confirm your email and activate your account.'
          )
        } else {
          setStatusMessage('Account created. Redirecting you to your dashboard.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          throw error
        }
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    setErrorMessage('')
    setStatusMessage('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      })
      setMode('signIn')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      {session ? (
        <Dashboard
          name={displayName}
          email={user?.email ?? ''}
          onSignOut={handleSignOut}
          logoWordmark={logoTextRightWhite}
          logoWhite={logoWhite}
          loading={loading}
        />
      ) : (
        <AuthScreen
          mode={mode}
          form={form}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          toggleMode={toggleMode}
          errorMessage={errorMessage}
          statusMessage={statusMessage}
          loading={loading}
          logoTextRightWhite={logoTextRightWhite}
          logoTextUnderWhite={logoTextUnderWhite}
          logoWhite={logoWhite}
        />
      )}
    </div>
  )
}

function AuthScreen({
  mode,
  form,
  onInputChange,
  onSubmit,
  toggleMode,
  errorMessage,
  statusMessage,
  loading,
  logoTextRightWhite,
  logoTextUnderWhite,
  logoWhite,
}) {
  const isSignUp = mode === 'signUp'

  return (
    <div className="auth-layout">
      <aside className="auth-visual">
        <div className="visual-header">
          <img
            src={logoTextRightWhite}
            alt="Fortune Finance"
            className="visual-logo"
          />
          <p className="visual-subtitle">Intelligent wealth orchestration</p>
        </div>
        <div className="visual-body">
          <h1>Command your capital with Fortune.</h1>
          <p>
            Track positions, automate allocations, and unlock actionable insights
            across every portfolio.
          </p>
          <div className="visual-metrics">
            <MetricCard
              label="Managed assets"
              value="$6.2M"
              trend="+8.4%"
            />
            <MetricCard label="Net inflows" value="$240K" trend="+12.1%" />
            <MetricCard label="Risk posture" value="Balanced" trend="Stable" />
          </div>
        </div>
        <div className="visual-footer">
          <img src={logoWhite} alt="Fortune icon" className="visual-mark" />
          <span>Precision finance crafted for modern operators.</span>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-panel__body">
          <img
            src={logoTextUnderWhite}
            alt="Fortune"
            className="auth-panel__logo auth-panel__logo--center"
          />
          <h2>{isSignUp ? 'Open your Fortune account' : 'Welcome back'}</h2>
          <p className="auth-caption">
            {isSignUp
              ? 'Create a secure login to monitor and grow your wealth.'
              : 'Sign in to continue orchestrating your financial strategy.'}
          </p>

          {errorMessage ? (
            <div className="feedback feedback--error">{errorMessage}</div>
          ) : null}
          {statusMessage ? (
            <div className="feedback feedback--success">{statusMessage}</div>
          ) : null}

          <form className="auth-form" onSubmit={onSubmit}>
            {isSignUp && (
              <div className="auth-grid">
                <label className="input-field">
                  <span>First name</span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={onInputChange('firstName')}
                    placeholder="Ava"
                    autoComplete="given-name"
                  />
                </label>
                <label className="input-field">
                  <span>Last name</span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={onInputChange('lastName')}
                    placeholder="Chen"
                    autoComplete="family-name"
                  />
                </label>
              </div>
            )}

            <label className="input-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={onInputChange('email')}
                placeholder="ava.chen@fortune.app"
                autoComplete="email"
              />
            </label>

            <label className="input-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={onInputChange('password')}
                placeholder="••••••••"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </label>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? 'Processing…'
                : isSignUp
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            className="ghost-button"
            onClick={toggleMode}
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Open a Fortune account'}
          </button>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, trend }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <span className="metric-trend">{trend}</span>
    </div>
  )
}

function Dashboard({
  name,
  email,
  onSignOut,
  logoWordmark,
  logoWhite,
  loading,
}) {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <img src={logoWordmark} alt="Fortune" className="dashboard__logo" />
        <button
          className="ghost-button ghost-button--compact"
          onClick={onSignOut}
          disabled={loading}
        >
          Sign out
        </button>
      </header>

      <nav className="dashboard__tabs-shell" aria-label="Primary navigation">
        <div className="dashboard__tabs">
          <button className="tab-button tab-button--active" type="button">
            Overview
          </button>
          <button className="tab-button" type="button">
            Portfolios
          </button>
          <button className="tab-button" type="button">
            Cash Flow
          </button>
          <button className="tab-button" type="button">
            Automation
          </button>
          <button className="tab-button" type="button">
            Insights
          </button>
        </div>
      </nav>

      <main className="dashboard__body">
        <section className="dashboard__welcome">
          <div className="welcome-copy">
            <p className="welcome-kicker">Welcome aboard</p>
            <h1>Good to see you, {name || 'Fortune operator'}.</h1>
            <p>
              Your personalised dashboard surfaces the metrics that matter most.
              Connect accounts, review capital flows, and deploy strategies with
              intent.
            </p>
            <button className="primary-button primary-button--large">
              Explore portfolio intelligence
            </button>
          </div>
          <div className="welcome-card">
            <img src={logoWhite} alt="Fortune orb" />
            <div>
              <span className="welcome-card__label">Active identity</span>
              <span className="welcome-card__value">{email}</span>
            </div>
          </div>
        </section>

        <section className="dashboard__grid">
          <InsightCard
            title="Capital overview"
            value="$6,212,940"
            delta="+3.8% MoM"
            description="Aggregate balances across every linked institution, normalised and FX-adjusted."
          />
          <InsightCard
            title="Cash runway"
            value="19 months"
            delta="+2 months"
            description="Projected runway using current burn and committed revenue."
          />
          <InsightCard
            title="Opportunities"
            value="4 signals"
            delta="2 new"
            description="Fresh intelligence on liquidity optimisation and risk hedging."
          />
        </section>
      </main>
    </div>
  )
}

function InsightCard({ title, value, delta, description }) {
  return (
    <article className="insight-card">
      <header>
        <h3>{title}</h3>
        <span className="insight-delta">{delta}</span>
      </header>
      <strong className="insight-value">{value}</strong>
      <p>{description}</p>
      <button className="link-button" type="button">
        View details →
      </button>
    </article>
  )
}

export default App
