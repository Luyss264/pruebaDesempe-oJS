
// toast.js  —  Small notification messages
// Shows a small message in the bottom-right corner.
// It disappears automatically after 3 seconds. thats why i use the setTimeout method

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-box')

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message

  container.appendChild(toast)

  setTimeout(() => toast.remove(), 3000)
}

export const toast = {
  success: (msg) => showToast(msg, 'success'),
  error:   (msg) => showToast(msg, 'error'),
  info:    (msg) => showToast(msg, 'info')
}
