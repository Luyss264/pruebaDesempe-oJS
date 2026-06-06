// Definimos la API
const API_URL     = 'http://localhost:3001'
const SESSION_KEY = 'cinema_session'


// login — checks credentials against json-server
// Returns the user object or null if not found

export async function login(email, password) {
  const response = await fetch(
    `${API_URL}/users?email=${email}&password=${password}`
  )
  const users = await response.json()

  if (users.length === 0) return null   // wrong credentials

  const user = users[0]

  // Save session (without the password FOR SECURITY)
  const session = {
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return session
}


//removes the session from localStorage

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}


//returns the current user or null

export function getSession() {
  const data = localStorage.getItem(SESSION_KEY)
  if (!data) return null
  return JSON.parse(data)
}


// isLoggedIn — true if someone is logged in

export function isLoggedIn() {
  return getSession() !== null
}


// isAdmin — true if the logged-in user is an admin

export function isAdmin() {
  const session = getSession()
  return session !== null && session.role === 'admin'
}
