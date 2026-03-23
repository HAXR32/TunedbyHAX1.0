# TunedbyHAX — Virtual Garage & Shop 🔧

A creative and efficient virtual garage for car enthusiasts. Track your builds, mods, and investments — all in your browser. Includes a fully-integrated shop with secure payment processing via **Stripe** (all major debit/credit cards + Cash App Pay) and a complete shipping & handling system.

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
- **Shipping & Handling** — Four shipping tiers (Standard, Expedited, Overnight, International) with free Standard shipping on orders over $50. Shipping method selected at checkout; server validates and adds cost to the Stripe PaymentIntent.

## Payment Integration

The shop uses [Stripe](https://stripe.com) for secure payment processing.

### Supported Payment Methods
- ✅ All major **credit and debit cards** (Visa, Mastercard, Amex, Discover, and more)
- ✅ **Cash App Pay** (US customers) — Cashtag: **$TunedByHAX**
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
   - Once enabled, the checkout will automatically surface the **Cash App Pay** button
   - Your Cashtag **$TunedByHAX** is shown to customers in the checkout UI

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

## Shipping & Handling

Four shipping tiers are built-in. Rates and the free-shipping threshold are defined once in `server.js` (`SHIPPING_RATES` / `FREE_SHIPPING_THRESHOLD_CENTS`) and mirrored in `payment.js` (`SHIPPING_OPTIONS` / `FREE_SHIPPING_THRESHOLD`) for display purposes. The server is always authoritative — it calculates and validates the shipping cost before creating the Stripe PaymentIntent.

| Method | Carrier | ETA | Price |
|--------|---------|-----|-------|
| Standard | USPS / UPS Ground | 5–7 business days | $6.99 (free ≥ $50) |
| Expedited | UPS 2-Day Air | 2–3 business days | $14.99 |
| Overnight | UPS Next Day Air | 1 business day | $29.99 |
| International | USPS Priority Mail Intl | 7–21 business days | $24.99 |

To change rates or the free-shipping threshold, edit the `SHIPPING_RATES` / `FREE_SHIPPING_THRESHOLD_CENTS` constants in `server.js` **and** the corresponding values in `payment.js`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/products` | Full product catalogue |
| `GET`  | `/shipping-rates?subtotal=<cents>` | All shipping options; `effectivePrice` accounts for free-shipping threshold |
| `POST` | `/create-payment-intent` | Create a Stripe PaymentIntent; body: `{ items, shippingMethod, currency }` |

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell, shop, shipping info section, modals, and cart/checkout templates |
| `styles.css`  | Dark garage theme, shop grid, shipping section, cart flyout, checkout styles |
| `app.js`      | Virtual garage logic — state, rendering, CRUD, localStorage |
| `payment.js`  | Shop catalogue, shipping options, cart state, Stripe Payment Element integration |
| `server.js`   | Express server — static files, shipping rates API, Stripe PaymentIntent API |
| `package.json` | Node.js project manifest and scripts |

