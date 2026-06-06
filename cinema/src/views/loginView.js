// THIS IS THE LOGIN VIEW WHERE ILL PUT THE HTML OF LOGIN IN THE APP

import { login }          from '../services/auth.js'
import { router }         from '../router/router.js'
import { toast }          from '../utils/toast.js'

export async function loginView(app) {
  app.innerHTML = `
    <div class="login-page">
      <div class="login-box">
        <h1 class="login-title">Cinema SPA</h1>
        <p class="login-sub">Reservation Management System</p>

        <div class="login-error" id="login-error-msg"></div>

        <div class="form-group">
          <label class="form-label" for="login-email">Email</label>
          <input class="form-input" type="email" id="login-email" placeholder="you@example.com" />
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input class="form-input" type="password" id="login-password" placeholder="••••••••" />
        </div>

        <button class="btn btn-primary" id="login-submit-btn" style="width:100%">
          Sign In
        </button>

        <div class="login-hint">
          <p>Test accounts:</p>
          admin@email.com / perensejo123<br/>
          cope@email.com  / 12345<br/>
          tran@email.com   / nomegustaspa
        </div>
      </div>
    </div>
  `

  const emailInput    = document.getElementById('login-email')
  const passwordInput = document.getElementById('login-password')
  const submitBtn     = document.getElementById('login-submit-btn')
  const errorMsg      = document.getElementById('login-error-msg')

  async function handleLogin() {
    const email    = emailInput.value.trim()
    const password = passwordInput.value.trim()

    // Basic validation
    if (!email || !password) {
      errorMsg.textContent = 'Please fill in all fields.'
      errorMsg.classList.add('show')
      return
    }

    submitBtn.disabled     = true
    submitBtn.textContent  = 'Signing in...'

    try {
      const user = await login(email, password)

      if (!user) {
        errorMsg.textContent = 'Wrong email or password.'
        errorMsg.classList.add('show')
        submitBtn.disabled    = false
        submitBtn.textContent = 'Sign In'
        return
      }

      toast.success(`Welcome, ${user.name}!`)
      router.navigate(user.role === 'admin' ? '/showings' : '/schedule')

    } catch {
      errorMsg.textContent = 'Connection error. Is json-server running?'
      errorMsg.classList.add('show')
      submitBtn.disabled    = false
      submitBtn.textContent = 'Sign In'
    }
  }

  submitBtn.addEventListener('click', handleLogin)

  // Allow pressing Enter to submit
  passwordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin()
  })
}
