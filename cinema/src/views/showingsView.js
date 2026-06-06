// ============================================
// showingsView.js  —  Showings management (admin)
// ============================================
// Admin can create, edit and delete showings.

import {
  getShowings,
  createShowing,
  updateShowing,
  deleteShowing
} from '../services/api.js'
import { renderNavbar, setupNavbar } from '../components/navbar.js'
import { toast }                     from '../utils/toast.js'

let showingsList = []   // in-memory list of showings

export async function showingsView(app) {
  app.innerHTML = `
    ${renderNavbar()}
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">Showings</h1>
        <button class="btn btn-primary" id="open-create-showing-btn">+ New Showing</button>
      </div>
      <div class="stats-row" id="showings-stats"></div>
      <div id="showings-table"></div>
    </div>

    <!-- Create / Edit modal -->
    <div class="modal-overlay" id="showing-form-modal" style="display:none">
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title" id="showing-form-title">New Showing</h2>
          <button class="modal-close" id="showing-form-close">×</button>
        </div>

        <div class="form-group">
          <label class="form-label" for="showing-movie-input">Movie</label>
          <input class="form-input" type="text" id="showing-movie-input" placeholder="Movie title" />
        </div>

        <div class="form-group">
          <label class="form-label" for="showing-room-input">Room</label>
          <select class="form-input" id="showing-room-input">
            <option>Room 1 - IMAX</option>
            <option>Room 2 - 3D</option>
            <option>Room 3 - 2D</option>
            <option>Room 4 - 2D</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="showing-date-input">Date</label>
            <input class="form-input" type="date" id="showing-date-input" />
          </div>
          <div class="form-group">
            <label class="form-label" for="showing-time-input">Time</label>
            <input class="form-input" type="time" id="showing-time-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="showing-capacity-input">Total Capacity</label>
          <input class="form-input" type="number" id="showing-capacity-input" min="1" placeholder="e.g. 100" />
        </div>

        <div class="form-group">
          <label class="form-label" for="showing-status-input">Status</label>
          <select class="form-input" id="showing-status-input">
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" id="showing-form-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="showing-form-save-btn">Save</button>
        </div>
      </div>
    </div>
  `

  setupNavbar()

  let editingId = null   // null = creating new, string = editing existing

  // --- LOAD SHOWINGS ---

  async function loadShowings() {
    const tableEl = document.getElementById('showings-table')
    const statsEl = document.getElementById('showings-stats')

    try {
      showingsList = await getShowings()

      const activeCount    = showingsList.filter(s => s.status === 'active').length
      const cancelledCount = showingsList.filter(s => s.status === 'cancelled').length

      statsEl.innerHTML = `
        <div class="stat-box">
          <div class="stat-label">Total</div>
          <div class="stat-num">${showingsList.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Active</div>
          <div class="stat-num" style="color:var(--success)">${activeCount}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Cancelled</div>
          <div class="stat-num" style="color:var(--danger)">${cancelledCount}</div>
        </div>
      `

      if (showingsList.length === 0) {
        tableEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎬</div>
            <p>No showings yet. Create the first one!</p>
          </div>
        `
        return
      }

      tableEl.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Movie</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${showingsList.map(s => `
                <tr>
                  <td><strong>${s.movie}</strong></td>
                  <td>${s.room}</td>
                  <td>${s.date}</td>
                  <td>${s.time}</td>
                  <td>${s.availableSeats} / ${s.totalCapacity}</td>
                  <td><span class="badge badge-${s.status}">${s.status}</span></td>
                  <td>
                    <div class="action-row">
                      <button class="btn btn-outline btn-sm" id="edit-showing-${s.id}">Edit</button>
                      <button class="btn btn-danger  btn-sm" id="delete-showing-${s.id}">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `

      // Attach edit/delete button events
      showingsList.forEach(s => {
        document.getElementById(`edit-showing-${s.id}`)
          .addEventListener('click', () => openFormModal(s))

        document.getElementById(`delete-showing-${s.id}`)
          .addEventListener('click', () => handleDeleteShowing(s.id))
      })

    } catch {
      tableEl.innerHTML = `<p style="color:var(--danger)">Error loading showings.</p>`
    }
  }

  // --- MODAL ---

  function openFormModal(showing = null) {
    const titleEl = document.getElementById('showing-form-title')

    if (showing) {
      // Edit mode: pre-fill the form
      editingId = showing.id
      titleEl.textContent = 'Edit Showing'
      document.getElementById('showing-movie-input').value    = showing.movie
      document.getElementById('showing-room-input').value     = showing.room
      document.getElementById('showing-date-input').value     = showing.date
      document.getElementById('showing-time-input').value     = showing.time
      document.getElementById('showing-capacity-input').value = showing.totalCapacity
      document.getElementById('showing-status-input').value   = showing.status
    } else {
      // Create mode: clear the form
      editingId = null
      titleEl.textContent = 'New Showing'
      document.getElementById('showing-movie-input').value    = ''
      document.getElementById('showing-room-input').value     = 'Room 1 - IMAX'
      document.getElementById('showing-date-input').value     = ''
      document.getElementById('showing-time-input').value     = ''
      document.getElementById('showing-capacity-input').value = ''
      document.getElementById('showing-status-input').value   = 'active'
    }

    document.getElementById('showing-form-modal').style.display = 'flex'
  }

  function closeFormModal() {
    document.getElementById('showing-form-modal').style.display = 'none'
    editingId = null
  }

  document.getElementById('open-create-showing-btn').addEventListener('click', () => openFormModal())
  document.getElementById('showing-form-close').addEventListener('click',      closeFormModal)
  document.getElementById('showing-form-cancel-btn').addEventListener('click', closeFormModal)

  // --- SAVE (create or update) ---

  document.getElementById('showing-form-save-btn').addEventListener('click', async () => {
    const movie    = document.getElementById('showing-movie-input').value.trim()
    const room     = document.getElementById('showing-room-input').value
    const date     = document.getElementById('showing-date-input').value
    const time     = document.getElementById('showing-time-input').value
    const capacity = parseInt(document.getElementById('showing-capacity-input').value)
    const status   = document.getElementById('showing-status-input').value

    if (!movie || !room || !date || !time || isNaN(capacity)) {
      toast.error('Please fill in all fields.')
      return
    }

    const data = { movie, room, date, time, totalCapacity: capacity, status }

    try {
      if (editingId) {
        await updateShowing(editingId, data)
        toast.success('Showing updated.')
      } else {
        // New showing: available seats start at full capacity
        data.availableSeats = capacity
        await createShowing(data)
        toast.success('Showing created.')
      }

      closeFormModal()
      loadShowings()

    } catch {
      toast.error('Error saving showing.')
    }
  })

  // --- DELETE ---

  async function handleDeleteShowing(id) {
    if (!confirm('Delete this showing? This cannot be undone.')) return

    try {
      await deleteShowing(id)
      toast.success('Showing deleted.')
      loadShowings()
    } catch {
      toast.error('Error deleting showing.')
    }
  }

  loadShowings()
}
