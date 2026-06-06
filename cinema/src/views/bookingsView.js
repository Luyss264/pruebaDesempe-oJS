// THIS IS THE BOOKINGS VIEW WHERE ILL PUT THE HTML OF BOOKINGS IN THE APP

import {
  getBookings,
  updateBooking,
  deleteBooking,
  getShowings,
  updateShowing
} from '../services/api.js'
import { renderNavbar, setupNavbar } from '../components/navbar.js'
import { toast }                     from '../utils/toast.js'

let bookingsList = []
let showingsList = []

export async function bookingsView(app) {
  app.innerHTML = `
    ${renderNavbar()}
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">All Bookings</h1>
      </div>
      <div class="stats-row" id="bookings-stats"></div>
      <div id="bookings-table"></div>
    </div>
  `

  setupNavbar()

  async function loadBookings() {
    const tableEl = document.getElementById('bookings-table')
    const statsEl = document.getElementById('bookings-stats')

    try {
      // Load both in parallel — faster than one after the other
      ;[bookingsList, showingsList] = await Promise.all([
        getBookings(),
        getShowings()
      ])

      const pending   = bookingsList.filter(b => b.status === 'pending').length
      const confirmed = bookingsList.filter(b => b.status === 'confirmed').length
      const cancelled = bookingsList.filter(b => b.status === 'cancelled').length

      statsEl.innerHTML = `
        <div class="stat-box">
          <div class="stat-label">Total</div>
          <div class="stat-num">${bookingsList.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Pending</div>
          <div class="stat-num" style="color:var(--warning)">${pending}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Confirmed</div>
          <div class="stat-num" style="color:var(--success)">${confirmed}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Cancelled</div>
          <div class="stat-num" style="color:var(--danger)">${cancelled}</div>
        </div>
      `

      if (bookingsList.length === 0) {
        tableEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <p>No bookings yet.</p>
          </div>
        `
        return
      }

      tableEl.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Movie</th>
                <th>Tickets</th>
                <th>Booked On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${bookingsList.map(b => `
                <tr>
                  <td>${b.userName}</td>
                  <td>${b.movieName}</td>
                  <td style="text-align:center">${b.ticketCount}</td>
                  <td>${b.bookingDate}</td>
                  <td><span class="badge badge-${b.status}">${b.status}</span></td>
                  <td>
                    <div class="action-row">
                      ${b.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" id="confirm-booking-${b.id}">Confirm</button>
                      ` : ''}
                      ${b.status !== 'cancelled' ? `
                        <button class="btn btn-warning btn-sm" id="cancel-booking-${b.id}">Cancel</button>
                      ` : ''}
                      <button class="btn btn-danger btn-sm" id="delete-booking-${b.id}">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `

      // Attach button events
      bookingsList.forEach(b => {
        const confirmBtn = document.getElementById(`confirm-booking-${b.id}`)
        const cancelBtn  = document.getElementById(`cancel-booking-${b.id}`)
        const deleteBtn  = document.getElementById(`delete-booking-${b.id}`)

        if (confirmBtn) confirmBtn.addEventListener('click', () => handleStatusChange(b.id, 'confirmed'))
        if (cancelBtn)  cancelBtn.addEventListener('click',  () => handleStatusChange(b.id, 'cancelled'))
        if (deleteBtn)  deleteBtn.addEventListener('click',  () => handleDeleteBooking(b.id))
      })

    } catch {
      tableEl.innerHTML = `<p style="color:var(--danger)">Error loading bookings.</p>`
    }
  }

  // --- CHANGE BOOKING STATUS ---

  async function handleStatusChange(bookingId, newStatus) {
    try {
      const booking = bookingsList.find(b => b.id === bookingId)
      if (!booking) return

      // If cancelling: return the seats to the showing
      if (newStatus === 'cancelled' && booking.status !== 'cancelled') {
        const showing = showingsList.find(s => s.id === booking.showingId)
        if (showing) {
          await updateShowing(showing.id, {
            availableSeats: showing.availableSeats + booking.ticketCount
          })
        }
      }

      await updateBooking(bookingId, { status: newStatus })
      toast.success(`Booking ${newStatus}.`)
      loadBookings()

    } catch {
      toast.error('Error updating booking.')
    }
  }

  // --- DELETE BOOKING ---

  async function handleDeleteBooking(id) {
    if (!confirm('Delete this booking?')) return

    try {
      const booking = bookingsList.find(b => b.id === id)

      // Return seats if the booking was not already cancelled
      if (booking && booking.status !== 'cancelled') {
        const showing = showingsList.find(s => s.id === booking.showingId)
        if (showing) {
          await updateShowing(showing.id, {
            availableSeats: showing.availableSeats + booking.ticketCount
          })
        }
      }

      await deleteBooking(id)
      toast.success('Booking deleted.')
      loadBookings()

    } catch {
      toast.error('Error deleting booking.')
    }
  }

  loadBookings()
}
