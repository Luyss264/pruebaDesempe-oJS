
import { isLoggedIn, isAdmin } from '../services/auth.js'
import { loginView }       from '../views/loginView.js'
import { scheduleView }    from '../views/scheduleView.js'
import { showingsView }    from '../views/showingsView.js'
import { bookingsView }    from '../views/bookingsView.js'
import { myBookingsView }  from '../views/myBookingsView.js'

//here i built an object with the routes propieties
const routes = { 
    '/login':{
         view: loginView,
         auth: false, 
         admin: false },
    '/schedule':{
         view: scheduleView,
         auth: true,  
         admin: false },
    '/showings':{
         view: showingsView,   
         auth: true,  
         admin: true  },
    '/bookings':{
         view: bookingsView,   
         auth: true,  
         admin: true  },
    '/my-bookings':{
         view: myBookingsView, 
         auth: true,  
         admin: false }
}

async function resolveRoute() {
  const path = window.location.pathname
  const app  = document.getElementById('app')

  const route = routes[path]

  // --- GUARDS ---

  // Not logged in and route needs auth → login
  if (route?.auth && !isLoggedIn()) {
    history.pushState({}, '', '/login')
    resolveRoute()
    return
  }

  // Logged in and trying to access login page → home
  if (path === '/login' && isLoggedIn()) {
    history.pushState({}, '', isAdmin() ? '/showings' : '/schedule')
    resolveRoute()
    return
  }

  // User trying to access an admin route → schedule
  if (route?.admin && !isAdmin()) {
    history.pushState({}, '', '/schedule')
    resolveRoute()
    return
  }

  // Root path → redirect to home based on role
  if (path === '/') {
    if (!isLoggedIn()) {
      history.pushState({}, '', '/login')
    } else {
      history.pushState({}, '', isAdmin() ? '/showings' : '/schedule')
    }
    resolveRoute()
    return
  }

  // 404 — route not found
  if (!route) {
    app.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">404</div>
        <p>Page not found. <a href="/" data-link style="color:var(--primary)">Go home</a></p>
      </div>
    `
    setupLinks()
    return
  }

  // Render the matched view
  await route.view(app)

  // Re-attach link listeners after every render
  setupLinks()
}

// Makes <a data-link> navigate without reloading the page
function setupLinks() {
  document.querySelectorAll('[data-link]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault()
      router.navigate(link.getAttribute('href'))
    })
  })
}

export const router = {
  navigate(path) {
    history.pushState({}, '', path)
    resolveRoute()
  },

  init() {
    // popstate fires when the user clicks the browser back/forward buttons
    window.addEventListener('popstate', resolveRoute)

    // Resolve the initial route when the app loads
    resolveRoute()
  }
}
