// ============================================
// scheduleView.js  —  Movie schedule (user view)
// ============================================
// Users see all active showings and can book tickets.

import { getShowings, createBooking, updateShowing } from '../services/api.js'
import { getSession }                                from '../services/auth.js'
import { renderNavbar, setupNavbar }                 from '../components/navbar.js'
import { toast }                                     from '../utils/toast.js'

export async function scheduleView(app) {
  const session = getSession()

  app.innerHTML = `
    ${renderNavbar()}
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">Schedule</h1>
      </div>
      <div id="schedule-list">
        <p style="color:var(--muted)">Loading showings...</p>
      </div>
    </div>

    <!-- Booking modal -->
    <div class="modal-overlay" id="booking-modal" style="display:none">
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title">Book Tickets</h2>
          <button class="modal-close" id="booking-modal-close">×</button>
        </div>
        <div id="booking-showing-info"></div>
        <div class="form-group" style="margin-top:1rem">
          <label class="form-label" for="booking-ticket-count">Number of tickets</label>
          <input class="form-input" type="number" id="booking-ticket-count" min="1" value="1" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="booking-modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="booking-modal-confirm">Confirm Booking</button>
        </div>
      </div>
    </div>
  `

  setupNavbar()

  // Holds the showing the user clicked on
  let selectedShowing = null

  async function loadSchedule() {
    const list = document.getElementById('schedule-list')

    try {
      const showings = await getShowings()
      // Only show active showings to users
      const active = showings.filter(s => s.status === 'active')

      if (active.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎭</div>
            <p>No showings available right now.</p>
          </div>
        `
        return
      }

      list.innerHTML = `
        <div class="card-grid">
          ${active.map(showing => `
            <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem">
                <strong>${showing.movie}</strong>
                <span class="badge badge-active">Active</span>
              </div>
              <div class="card-detail">
                <div>Room: <strong>${showing.room}</strong></div>
                <div>Date: <strong>${showing.date}</strong></div>
                <div>Time: <strong>${showing.time}</strong></div>
                <div>Seats left: <strong>${showing.availableSeats}</strong> / ${showing.totalCapacity}</div>
              </div>
              <div style="margin-top:1rem">
                ${showing.availableSeats > 0
                  ? `<button class="btn btn-primary" style="width:100%" data-showing-id="${showing.id}" id="book-btn-${showing.id}">
                       Book Tickets
                     </button>`
                  : `<button class="btn btn-outline" style="width:100%" disabled>No Seats</button>`
                }
              </div>
            </div>
          `).join('')}
        </div>
      `

      // Store showings so we can look them up when a button is clicked
      window._showings = showings

      // Attach click events to all "Book Tickets" buttons
      active.forEach(showing => {
        const btn = document.getElementById(`book-btn-${showing.id}`)
        if (btn) {
          btn.addEventListener('click', () => openBookingModal(showing.id))
        }
      })

    } catch {
      list.innerHTML = `<p style="color:var(--danger)">Error loading showings. Is json-server running?</p>`
    }
  }

  // --- BOOKING MODAL ---

  function openBookingModal(showingId) {
    selectedShowing = window._showings.find(s => s.id === showingId)
    if (!selectedShowing) return

    document.getElementById('booking-showing-info').innerHTML = `
      <div class="card" style="background:var(--bg)">
        <strong>${selectedShowing.movie}</strong>
        <div class="card-detail" style="margin-top:0.4rem">
          ${selectedShowing.date} · ${selectedShowing.time} · Seats left: ${selectedShowing.availableSeats}
        </div>
      </div>
    `

    const ticketInput = document.getElementById('booking-ticket-count')
    ticketInput.max   = selectedShowing.availableSeats
    ticketInput.value = 1

    document.getElementById('booking-modal').style.display = 'flex'
  }

  function closeBookingModal() {
    document.getElementById('booking-modal').style.display = 'none'
    selectedShowing = null
  }

  document.getElementById('booking-modal-close').addEventListener('click',  closeBookingModal)
  document.getElementById('booking-modal-cancel').addEventListener('click', closeBookingModal)

  document.getElementById('booking-modal-confirm').addEventListener('click', async () => {
    const ticketCount = parseInt(document.getElementById('booking-ticket-count').value)

    if (isNaN(ticketCount) || ticketCount < 1) {
      toast.error('Enter a valid number of tickets.')
      return
    }

    if (ticketCount > selectedShowing.availableSeats) {
      toast.error(`Only ${selectedShowing.availableSeats} seats available.`)
      return
    }

    try {
      // 1. Create the booking record
      await createBooking({
        userId:       session.id,
        userName:     session.name,
        showingId:    selectedShowing.id,
        movieName:    selectedShowing.movie,
        ticketCount:  ticketCount,
        bookingDate:  new Date().toISOString().split('T')[0],
        status:       'pending'
      })

      // 2. Subtract booked seats from the showing
      await updateShowing(selectedShowing.id, {
        availableSeats: selectedShowing.availableSeats - ticketCount
      })

      toast.success('Booking created!')
      closeBookingModal()
      loadSchedule()

    } catch {
      toast.error('Error creating booking.')
    }
  })

  loadSchedule()
}
