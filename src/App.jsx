import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabaseClient'
import logoTextRightWhite from './assets/logos/logo_text_right_white.png'
import logoTextUnderWhite from './assets/logos/logo_text_under_white.png'
import logoWhite from './assets/logos/logo_white.png'

const DASHBOARD_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'portfolios', label: 'Portfolios' },
  { key: 'cashflow', label: 'Cash Flow' },
  { key: 'automation', label: 'Automation' },
  { key: 'insights', label: 'Insights' },
]

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
          userId={user?.id ?? ''}
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
  userId,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountsError, setAccountsError] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'cash',
    startingBalance: '',
  })
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [movementForm, setMovementForm] = useState({
    accountId: '',
    amount: '',
    repeatsEvery: 'none',
  })
  const [movementSubmitting, setMovementSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingAccountId, setDeletingAccountId] = useState(null)

  const navItems = useMemo(
    () =>
      DASHBOARD_TABS.map((item) => ({
        ...item,
        isActive: item.key === activeTab,
      })),
    [activeTab],
  )
  const hasAccounts = accounts.length > 0
  const accountsCaption = hasAccounts
    ? 'Keep euro balances aligned and schedule movements as your portfolio evolves.'
    : 'Create your first euro account to begin tracking capital flows with precision.'

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      }),
    [],
  )

  const toggleMobileNav = () => {
    setMobileNavOpen((open) => !open)
  }

  const closeMobileNav = () => {
    setMobileNavOpen(false)
  }

  const handleTabSelect = (key) => {
    setActiveTab(key)
    if (mobileNavOpen) {
      closeMobileNav()
    }
  }

  useEffect(() => {
    if (activeTab !== 'portfolios' && showCreateForm) {
      setShowCreateForm(false)
    }
  }, [activeTab, showCreateForm])

  useEffect(() => {
    if (!hasAccounts && showCreateForm) {
      setShowCreateForm(false)
    }
  }, [hasAccounts, showCreateForm])

  const interpretSupabaseError = (error) => {
    if (!error) return 'An unexpected error occurred. Please try again.'
    if (error.code === '23514') {
      return 'Supabase rejected the movement because the repeats_every constraint does not include "none". Update the constraint as outlined in the README and try again.'
    }
    if (error.code === '42501') {
      return 'Permission denied. Ensure delete policies are configured for financial_accounts and financial_account_movements (see README).'
    }
    return error.message ?? 'An unexpected error occurred. Please try again.'
  }

  const loadAccounts = useCallback(async () => {
    if (!userId) {
      setAccounts([])
      return
    }

    setAccountsLoading(true)
    setAccountsError('')

    const { data, error } = await supabase
      .from('financial_accounts')
      .select(
        `
        id,
        name,
        type,
        starting_balance,
        created_at,
        movements:financial_account_movements (
          id,
          amount,
          repeats_every,
          created_at
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .order('created_at', {
        foreignTable: 'financial_account_movements',
        ascending: true,
      })

    if (error) {
      setAccountsError(error.message)
      setAccounts([])
      setAccountsLoading(false)
      return
    }

    const mapped = (data ?? []).map((account) => {
      const movements = account.movements ?? []
      const balance = movements.reduce(
        (sum, movement) => sum + Number(movement.amount ?? 0),
        0,
      )
      return {
        ...account,
        movements,
        balance,
      }
    })

    setAccounts(mapped)
    setAccountsLoading(false)
  }, [userId])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleCreateFormChange = (field) => (event) => {
    const { value } = event.target
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleMovementChange = (field) => (event) => {
    const { value } = event.target
    setMovementForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateAccount = async (event) => {
    event.preventDefault()
    if (!userId) return

    const trimmedName = createForm.name.trim()
    if (!trimmedName) {
      setAccountsError('Give the account a name before creating it.')
      return
    }

    const startingBalance = Number(createForm.startingBalance || 0)
    if (Number.isNaN(startingBalance)) {
      setAccountsError('Starting balance must be a valid number.')
      return
    }

    setCreateSubmitting(true)
    setAccountsError('')

    let createdAccountId = null

    try {
      const { data: accountData, error: accountError } = await supabase
        .from('financial_accounts')
        .insert({
          user_id: userId,
          name: trimmedName,
          type: createForm.type,
          starting_balance: startingBalance,
        })
        .select('id')
        .single()

      if (accountError) {
        throw accountError
      }

      createdAccountId = accountData?.id

      const { error: movementError } = await supabase
        .from('financial_account_movements')
        .insert({
          account_id: createdAccountId,
          user_id: userId,
          amount: startingBalance,
          repeats_every: 'none',
        })

      if (movementError) {
        throw movementError
      }

      setCreateForm({
        name: '',
        type: 'cash',
        startingBalance: '',
      })
      setShowCreateForm(false)

      await loadAccounts()
    } catch (error) {
      let message = interpretSupabaseError(error)
      if (createdAccountId) {
        const { error: cleanupError } = await supabase
          .from('financial_accounts')
          .delete()
          .eq('id', createdAccountId)

        if (cleanupError) {
          message += ` ${interpretSupabaseError(cleanupError)}`
        }
      }
      setAccountsError(message)
    } finally {
      setCreateSubmitting(false)
    }
  }

  const openMovementForm = (accountId) => {
    setMovementForm({
      accountId,
      amount: '',
      repeatsEvery: 'none',
    })
  }

  const cancelMovementForm = () => {
    setMovementForm({
      accountId: '',
      amount: '',
      repeatsEvery: 'none',
    })
  }

  const handleAddMovement = async (event) => {
    event.preventDefault()
    if (!userId || !movementForm.accountId) return

    const amountValue = Number(movementForm.amount)
    if (Number.isNaN(amountValue)) {
      setAccountsError('Movement amount must be a valid number.')
      return
    }

    setMovementSubmitting(true)
    setAccountsError('')

    try {
      const { error } = await supabase.from('financial_account_movements').insert({
        account_id: movementForm.accountId,
        user_id: userId,
        amount: amountValue,
        repeats_every: movementForm.repeatsEvery,
      })

      if (error) {
        throw error
      }

      cancelMovementForm()
      await loadAccounts()
    } catch (error) {
      setAccountsError(interpretSupabaseError(error))
    } finally {
      setMovementSubmitting(false)
    }
  }

  const isMovementOpen = (accountId) => movementForm.accountId === accountId

  const handleDeleteAccount = async (account) => {
    if (!userId || !account?.id) return
    const confirmed = window.confirm(
      `Delete "${account.name}"? This will remove all related movements.`,
    )
    if (!confirmed) return

    setDeletingAccountId(account.id)
    setAccountsError('')

    try {
      const { error: movementDeleteError } = await supabase
        .from('financial_account_movements')
        .delete()
        .eq('account_id', account.id)
        .eq('user_id', userId)

      if (movementDeleteError) {
        throw movementDeleteError
      }

      setMovementForm((prev) =>
        prev.accountId === account.id
          ? { accountId: '', amount: '', repeatsEvery: 'none' }
          : prev,
      )

      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', account.id)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      await loadAccounts()
      setShowCreateForm(false)
    } catch (error) {
      setAccountsError(interpretSupabaseError(error))
    } finally {
      setDeletingAccountId(null)
    }
  }

  const renderCreateAccountForm = (additionalClass = '') => (
    <form
      className={`accounts__form${additionalClass ? ` ${additionalClass}` : ''}`}
      onSubmit={handleCreateAccount}
    >
      <h3>Open a new account</h3>
      <p>Create a ledger entry with an opening balance.</p>
      <div className="accounts__form-row">
        <label className="input-field">
          <span>Account name</span>
          <input
            type="text"
            autoComplete="off"
            value={createForm.name}
            onChange={handleCreateFormChange('name')}
            placeholder="Operating cash"
          />
        </label>
      </div>
      <div className="accounts__form-row accounts__form-row--split">
        <label className="input-field">
          <span>Type</span>
          <select value={createForm.type} onChange={handleCreateFormChange('type')}>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="savings">Savings</option>
            <option value="assets">Assets</option>
          </select>
        </label>
        <label className="input-field">
          <span>Opening balance</span>
          <input
            type="number"
            step="0.01"
            value={createForm.startingBalance}
            onChange={handleCreateFormChange('startingBalance')}
            placeholder="25000"
          />
        </label>
      </div>
      <button type="submit" className="primary-button" disabled={createSubmitting}>
        {createSubmitting ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )

  const renderAccountCard = (account) => {
    const movementOpen = isMovementOpen(account.id)
    const isDeleting = deletingAccountId === account.id

    return (
      <article key={account.id} className="account-card">
        <header>
          <div>
            <h3>{account.name}</h3>
            <span className={`account-chip account-chip--${account.type}`}>
              {account.type}
            </span>
          </div>
          <strong>{formatCurrency.format(account.balance)}</strong>
        </header>
        <div className="account-card__meta">
          <span>
            {account.movements.length}{' '}
            {account.movements.length === 1 ? 'movement' : 'movements'}
          </span>
          <span>Created {new Date(account.created_at).toLocaleDateString()}</span>
        </div>
        {movementOpen ? (
          <form className="movement-form" onSubmit={handleAddMovement}>
            <div className="movement-form__row">
              <label className="input-field">
                <span>Amount</span>
                <input
                  type="number"
                  step="0.01"
                  value={movementForm.amount}
                  onChange={handleMovementChange('amount')}
                  placeholder="1250"
                />
              </label>
              <label className="input-field">
                <span>Repeats every</span>
                <select
                  value={movementForm.repeatsEvery}
                  onChange={handleMovementChange('repeatsEvery')}
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnite">Fortnite</option>
                  <option value="montly">Montly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
            </div>
            <div className="movement-form__actions">
              <button
                type="button"
                className="ghost-button ghost-button--compact"
                onClick={cancelMovementForm}
                disabled={movementSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={movementSubmitting}
              >
                {movementSubmitting ? 'Saving…' : 'Add movement'}
              </button>
            </div>
          </form>
        ) : null}
        <div className="account-card__actions">
          {!movementOpen ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => openMovementForm(account.id)}
              disabled={movementSubmitting || deletingAccountId === account.id}
            >
              Add movement
            </button>
          ) : null}
          <button
            type="button"
            className="danger-button"
            onClick={() => handleDeleteAccount(account)}
            disabled={isDeleting || movementSubmitting}
          >
            {isDeleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </article>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__identity">
          <button
            type="button"
            className={`dashboard__mobile-toggle ${mobileNavOpen ? 'is-open' : ''}`}
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          >
            <span />
            <span />
            <span />
          </button>
          <img src={logoWordmark} alt="Fortune" className="dashboard__logo" />
        </div>
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
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`tab-button ${item.isActive ? 'tab-button--active' : ''}`}
              onClick={() => handleTabSelect(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <aside className={`dashboard__drawer ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="dashboard__drawer-header">
          <span>Navigation</span>
          <button
            type="button"
            className="dashboard__drawer-close"
            onClick={closeMobileNav}
          >
            Close
          </button>
        </div>
        <div className="dashboard__drawer-tabs">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`tab-button ${item.isActive ? 'tab-button--active' : ''}`}
              onClick={() => handleTabSelect(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>
      {mobileNavOpen ? (
        <button
          type="button"
          className="dashboard__drawer-overlay"
          onClick={closeMobileNav}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <main className="dashboard__body">
        {activeTab === 'overview' ? (
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
          </section>
        ) : null}

        {activeTab === 'portfolios' ? (
          <section className="accounts">
            <header className="accounts__header">
              <div>
                <p className="accounts__eyebrow">Accounts</p>
                <h2>Structure your capital stack</h2>
              </div>
              <div className="accounts__actions">
                <p className="accounts__caption">{accountsCaption}</p>
                {hasAccounts ? (
                  <button
                    type="button"
                    className={`accounts__add ${showCreateForm ? 'is-active' : ''}`}
                    onClick={() => setShowCreateForm((prev) => !prev)}
                    aria-label={showCreateForm ? 'Hide account creation form' : 'Add another account'}
                    disabled={accountsLoading}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                ) : null}
              </div>
            </header>

            {accountsError ? (
              <div className="feedback feedback--error">{accountsError}</div>
            ) : null}

            {!hasAccounts ? (
              <div className="accounts__grid">
                {renderCreateAccountForm()}

                <div className="accounts__list">
                  {accountsLoading ? (
                    <div className="accounts__empty">Loading accounts…</div>
                  ) : (
                    <div className="accounts__empty">
                      <p>No accounts yet.</p>
                      <p>Spin up your first ledger to start mapping capital motion.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="accounts__list accounts__list--full">
                {showCreateForm ? renderCreateAccountForm('accounts__form--inline') : null}
                {accountsLoading ? (
                  <div className="accounts__empty">Refreshing accounts…</div>
                ) : (
                  accounts.map(renderAccountCard)
                )}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'overview' ? (
          <section className="dashboard__grid">
            <InsightCard
              title="Capital overview"
              value={formatCurrency.format(6212940)}
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
        ) : null}
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
