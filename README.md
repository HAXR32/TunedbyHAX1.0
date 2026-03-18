# TunedbyHAX — Virtual Garage & Shop 🔧

A creative and efficient virtual garage for car enthusiasts. Track your builds, mods, and investments — all in your browser. Now includes a fully-integrated shop with secure payment processing via **Stripe** (all major debit/credit cards + Cash App Pay).

## Features

- **Garage Grid** — Visual car cards with emoji icons, HP, mileage, colour, and build notes
- **Add / Edit / Remove Cars** — Full CRUD with form validation
- **Modification Tracker** — Log mods per car with category and cost; running total per build
- **Stats Dashboard** — Total cars, total mods, total money invested, latest build at a glance
- **Search & Sort** — Filter by make/model/year/colour/notes; sort by date, year, make, or mods count
- **Persistent Storage** — Everything lives in `localStorage` — no sign-up required for the garage
- **Demo Data** — Three sample builds pre-loaded on first visit so you can dive right in
- **Responsive & Dark-themed** — Works great on desktop and mobile
- **Shop** — Browse JDM collectibles, HAX merch, and accessories
- **Secure Checkout** — Stripe Payment Element supporting all major debit/credit cards and Cash App Pay

## Payment Integration

The shop uses [Stripe](https://stripe.com) for secure payment processing.

### Supported Payment Methods
- ✅ All major **credit and debit cards** (Visa, Mastercard, Amex, Discover, and more)
- ✅ **Cash App Pay** (US customers)
- ✅ Any other method enabled in your Stripe Dashboard

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set your Stripe keys**
   - Get your keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Replace `pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY` in `payment.js` with your **publishable key**
   - Set the **secret key** as an environment variable (never hardcode it):
     ```bash
     export STRIPE_SECRET_KEY=sk_live_...
     ```

3. **Enable Cash App Pay** in your Stripe Dashboard under *Settings → Payment methods*

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ | Your Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `PORT` | ❌ | HTTP port (default: `3000`) |
| `FRONTEND_ORIGIN` | ❌ | Allowed CORS origin (default: `*`; set to your domain in production) |

> **Security note:** The `STRIPE_SECRET_KEY` must **never** be committed to source control or included in front-end code. Use environment variables or a secrets manager in production.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell, shop, modals, and cart/checkout templates |
| `styles.css`  | Dark garage theme, shop grid, cart flyout, checkout styles |
| `app.js`      | Virtual garage logic — state, rendering, CRUD, localStorage |
| `payment.js`  | Shop catalogue, cart state, Stripe Payment Element integration |
| `server.js`   | Express server — serves static files + Stripe PaymentIntent API |
| `package.json` | Node.js project manifest and scripts |

