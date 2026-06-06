import { getSession, logout } from '../services/auth.js'
import { router }             from '../router/router.js'

// Returns the navbar HTML string
export function renderNavbar() {
  const session = getSession()
  if (!session) return ''

  // Admin sees: Showings, All Bookings
  // User sees:  Schedule, My Bookings
  const adminLinks = `
    <li><a class="nav-link" href="/showings"      data-link>Showings</a></li>
    <li><a class="nav-link" href="/bookings"      data-link>Bookings</a></li>
  `
  const userLinks = `
    <li><a class="nav-link" href="/schedule"     data-link>Schedule</a></li>
    <li><a class="nav-link" href="/my-bookings"  data-link>My Bookings</a></li>
  `

  return `
    <nav class="navbar">
      <a class="nav-logo" href="/" data-link>Cinema SPA</a>

      <ul class="nav-links">
        ${session.role === 'admin' ? adminLinks : userLinks}
      </ul>

      <div class="nav-right">
        <span class="nav-user">
          ${session.name} · <span class="nav-role">${session.role}</span>
        </span>
        <button class="btn-logout" id="logout-btn">Logout</button>
      </div>
    </nav>
  `
}

// Attaches events to the navbar after it is in the DOM
export function setupNavbar() {
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout()
      router.navigate('/login')
    })
  }

  // Highlight the active link 
  const currentPath = window.location.pathname
  
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active')
    }
  })
}
