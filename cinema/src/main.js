// ============================================
// main.js  —  Application entry point
// ============================================
// This is the first file that runs.
// It waits for the HTML to be ready, then starts the router.

import { router } from './router/router.js'

// DOMContentLoaded fires when the HTML is fully parsed.
// We wait for it so #app exists before the router tries to use it.
document.addEventListener('DOMContentLoaded', () => {
  router.init()
})
