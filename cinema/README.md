# Cinema SPA

Single Page Application for managing cinema showings and ticket bookings.
Built with Vanilla JavaScript + Vite + json-server.

---

## Stack

- **Vite** — dev server and bundler
- **Vanilla JS (ES Modules)** — no frameworks
- **json-server** — simulated REST API
- **History API** — clean URL routing (`/schedule`, `/showings`)
- **localStorage** — session persistence

---

## How to run

Open **two terminals**:

```bash
# Terminal 1 — fake API
npm install
npm start
```

---

## Test accounts

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@cinema.com    | Admin123! |
| User  | carlos@mail.com     | User123!  |
| User  | maria@mail.com      | User123!  |

---

## Project structure

```
cinema/
├── index.html
├── db.json                      ← json-server database
├── package.json
├── vite.config.js
└── src/
    ├── main.js                  ← entry point (boots the router)
    ├── styles.css               ← all styles
    ├── router/
    │   └── router.js            ← History API router + route guards
    ├── services/
    │   ├── auth.js              ← login / logout / session
    │   └── api.js               ← all fetch() calls
    ├── components/
    │   └── navbar.js            ← navbar (changes per role)
    ├── views/
    │   ├── loginView.js         ← /login
    │   ├── scheduleView.js      ← /schedule  (user)
    │   ├── showingsView.js      ← /showings  (admin)
    │   ├── bookingsView.js      ← /bookings  (admin)
    │   └── myBookingsView.js    ← /my-bookings (user)
    └── utils/
        └── toast.js             ← notification helper
```

---

## Routes and permissions

| Route          | Who can access |
|----------------|----------------|
| `/login`       | Everyone        |
| `/schedule`    | Any logged-in user |
| `/my-bookings` | Any logged-in user |
| `/showings`    | Admin only      |
| `/bookings`    | Admin only      |

---

## How the router works

1. User visits a URL (e.g. `/showings`).
2. `router.js` checks: is the user logged in? Is the user an admin?
3. If the checks pass, the matching view function is called and its HTML is injected into `#app`.
4. If the checks fail, the user is redirected (`/login` or `/schedule`).
5. `<a data-link>` elements are intercepted so clicks use `history.pushState()` instead of a full page reload.
6. The browser back/forward buttons work via the `popstate` event.

---

## API endpoints (json-server)

```
GET    /users
GET    /showings
POST   /showings
PATCH  /showings/:id
DELETE /showings/:id
GET    /bookings
POST   /bookings
PATCH  /bookings/:id
DELETE /bookings/:id
```
