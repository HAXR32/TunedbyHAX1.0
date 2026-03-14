# TunedbyHAX — Virtual Garage 🔧

A creative and efficient virtual garage for car enthusiasts. Track your builds, mods, and investments — all in your browser with zero back-end required.

## Features

- **Garage Grid** — Visual car cards with emoji icons, HP, mileage, colour, and build notes
- **Add / Edit / Remove Cars** — Full CRUD with form validation
- **Modification Tracker** — Log mods per car with category and cost; running total per build
- **Stats Dashboard** — Total cars, total mods, total money invested, latest build at a glance
- **Search & Sort** — Filter by make/model/year/colour/notes; sort by date, year, make, or mods count
- **Persistent Storage** — Everything lives in `localStorage` — no server, no sign-up
- **Demo Data** — Three sample builds pre-loaded on first visit so you can dive right in
- **Responsive & Dark-themed** — Works great on desktop and mobile

## Usage

Open `index.html` directly in any modern browser — no build step, no dependencies.

```bash
# macOS / Linux
open index.html

# Or just drag the file into Chrome / Firefox / Edge
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell and modal templates |
| `styles.css`  | Dark garage theme, responsive layout |
| `app.js`      | All JS logic — state, rendering, CRUD, localStorage |

