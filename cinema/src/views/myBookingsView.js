// ============================================
// myBookingsView.js  —  My Bookings (user)
// ============================================
// Users only see their own bookings.
// They can edit ticket count or cancel a booking.

import {
  getBookingsByUser,
  updateBooking,
  getShowings,
  updateShowing
} from '../services/api.js'
import { getSession }                from '../services/auth.js'
import { renderNavbar, setupNavbar } from '../components/navbar.js'
import { toast }                     from '../utils/toast.js'

let myBookings   = []
let showingsList = []

export async function myBookingsView(app) {
  const session = getSession()

  app.innerHTML = `
    ${renderNavbar()}
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">My Bookings</h1>
      </div>
      <div id="my-bookings-list"></div>
    </div>

    <!-- Edit ticket count modal -->
    <div class="modal-overlay" id="edit-booking-modal" style="display:none">
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title">Edit Booking</h2>
          <button class="modal-close" id="edit-booking-modal-close">×</button>
        </div>
        <div id="edit-booking-info"></div>
        <div class="form-group" style="margin-top:1rem">
          <label class="form-label" for="edit-ticket-count-input">New ticket count</label>
          <input class="form-input" type="number" id="edit-ticket-count-input" min="1" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="edit-booking-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="edit-booking-save-btn">Save Changes</button>
        </div>
      </div>
    </div>
  `

  setupNavbar()

  let editingBooking = null   // the booking being edited

  async function loadMyBookings() {
    const listEl = document.getElementById('my-bookings-list')

    try {
      // Only fetch THIS user's bookings (filtered by userId)
      ;[myBookings, showingsList] = await Promise.all([
        getBookingsByUser(session.id),
        getShowings()
      ])

      if (myBookings.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎟️</div>
            <p>You have no bookings yet. Go to the Schedule to book tickets!</p>
          </div>
        `
        return
      }

      listEl.innerHTML = `
        <div class="card-grid">
          ${myBookings.map(b => `
            <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem">
                <strong>${b.movieName}</strong>
                <span class="badge badge-${b.status}">${b.status}</span>
              </div>
              <div class="card-detail">
                <div>Tickets: <strong>${b.ticketCount}</strong></div>
                <div>Booked on: <strong>${b.bookingDate}</strong></div>
              </div>
              ${b.status !== 'cancelled' ? `
                <div class="action-row" style="margin-top:1rem">
                  <button class="btn btn-outline btn-sm" style="flex:1" id="edit-my-booking-${b.id}">Edit</button>
                  <button class="btn btn-danger  btn-sm" style="flex:1" id="cancel-my-booking-${b.id}">Cancel</button>
                </div>
              ` : `
                <p style="color:var(--muted); font-size:0.8rem; margin-top:0.75rem">
                  This booking was cancelled and cannot be reactivated.
                </p>
              `}
            </div>
          `).join('')}
        </div>
      `

      // Attach button events
      myBookings.forEach(b => {
        const editBtn   = document.getElementById(`edit-my-booking-${b.id}`)
        const cancelBtn = document.getElementById(`cancel-my-booking-${b.id}`)

        if (editBtn)   editBtn.addEventListener('click',   () => openEditModal(b.id))
        if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancelMyBooking(b.id))
      })

    } catch {
      listEl.innerHTML = `<p style="color:var(--danger)">Error loading bookings.</p>`
    }
  }

  // --- CANCEL MY BOOKING ---

  async function handleCancelMyBooking(id) {
    if (!confirm('Cancel this booking? You cannot undo this.')) return

    try {
      const booking = myBookings.find(b => b.id === id)

      // Return seats to the showing
      if (booking) {
        const showing = showingsList.find(s => s.id === booking.showingId)
        if (showing) {
          await updateShowing(showing.id, {
            availableSeats: showing.availableSeats + booking.ticketCount
          })
        }
      }

      // Mark as cancelled (do NOT delete — history must be kept)
      await updateBooking(id, { status: 'cancelled' })
      toast.success('Booking cancelled.')
      loadMyBookings()

    } catch {
      toast.error('Error cancelling booking.')
    }
  }

  // --- EDIT MODAL ---

  function openEditModal(id) {
    editingBooking = myBookings.find(b => b.id === id)
    if (!editingBooking) return

    const showing          = showingsList.find(s => s.id === editingBooking.showingId)
    const extraSeats       = showing ? showing.availableSeats : 0
    const maxTickets       = editingBooking.ticketCount + extraSeats

    document.getElementById('edit-booking-info').innerHTML = `
      <div class="card" style="background:var(--bg)">
        <strong>${editingBooking.movieName}</strong>
        <div class="card-detail" style="margin-top:0.4rem">
          Current tickets: ${editingBooking.ticketCount} · Extra seats available: ${extraSeats}
        </div>
      </div>
    `

    const countInput = document.getElementById('edit-ticket-count-input')
    countInput.max   = maxTickets
    countInput.min   = 1
    countInput.value = editingBooking.ticketCount

    document.getElementById('edit-booking-modal').style.display = 'flex'
  }

  function closeEditModal() {
    document.getElementById('edit-booking-modal').style.display = 'none'
    editingBooking = null
  }

  document.getElementById('edit-booking-modal-close').addEventListener('click',  closeEditModal)
  document.getElementById('edit-booking-cancel-btn').addEventListener('click', closeEditModal)

  document.getElementById('edit-booking-save-btn').addEventListener('click', async () => {
    const newCount = parseInt(document.getElementById('edit-ticket-count-input').value)

    if (isNaN(newCount) || newCount < 1) {
      toast.error('Enter a valid number.')
      return
    }

    try {
      const showing    = showingsList.find(s => s.id === editingBooking.showingId)
      // difference: positive = we need more seats, negative = we free seats
      const difference = newCount - editingBooking.ticketCount

      if (showing) {
        const newAvailable = showing.availableSeats - difference

        if (newAvailable < 0) {
          toast.error('Not enough seats available.')
          return
        }

        await updateShowing(showing.id, { availableSeats: newAvailable })
      }

      await updateBooking(editingBooking.id, { ticketCount: newCount })
      toast.success('Booking updated.')
      closeEditModal()
      loadMyBookings()

    } catch {
      toast.error('Error updating booking.')
    }
  })

  loadMyBookings()
}
