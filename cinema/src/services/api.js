

const API_URL = 'http://localhost:3001'

// ---- SHOWINGS --------------------------------

export async function getShowings() {
  const res = await fetch(`${API_URL}/showings`)
  return res.json()
}

export async function getShowingById(id) {
  const res = await fetch(`${API_URL}/showings/${id}`)
  return res.json()
}

export async function createShowing(data) {
  const res = await fetch(`${API_URL}/showings`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  })
  return res.json()
}

// PATCH — updates only the fields we send
export async function updateShowing(id, data) {
  const res = await fetch(`${API_URL}/showings/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  })
  return res.json()
}

export async function deleteShowing(id) {
  const res = await fetch(`${API_URL}/showings/${id}`, {
    method: 'DELETE'
  })
  return res.ok
}

// ---- BOOKINGS --------------------------------

export async function getBookings() {
  const res = await fetch(`${API_URL}/bookings`)
  return res.json()
}

// Filter bookings by userId (for normal users)
export async function getBookingsByUser(userId) {
  const res = await fetch(`${API_URL}/bookings?userId=${userId}`)
  return res.json()
}

export async function createBooking(data) {
  const res = await fetch(`${API_URL}/bookings`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  })
  return res.json()
}

export async function updateBooking(id, data) {
  const res = await fetch(`${API_URL}/bookings/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  })
  return res.json()
}

export async function deleteBooking(id) {
  const res = await fetch(`${API_URL}/bookings/${id}`, {
    method: 'DELETE'
  })
  return res.ok
}
