/* ============================================================
   TunedbyHAX — Payment Server  |  server.js
   ============================================================
   Start:  STRIPE_SECRET_KEY=sk_... node server.js
   ============================================================ */

'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const Stripe  = require('stripe');

// ── Stripe initialisation ──────────────────────────────────────
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error(
    '\n[TunedbyHAX] ERROR: STRIPE_SECRET_KEY environment variable is not set.\n' +
    'Set it before starting the server:\n' +
    '  STRIPE_SECRET_KEY=sk_live_... node server.js\n'
  );
  process.exit(1);
}

const stripe = Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

// ── App setup ─────────────────────────────────────────────────
const app = express();

// Serve static front-end files from the project root
app.use(express.static(path.join(__dirname)));

// Parse JSON request bodies (limit prevents abuse)
app.use(express.json({ limit: '16kb' }));

// CORS — restrict to same origin in production; allow all in development
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST'],
}));

// ── Server-side product catalogue ─────────────────────────────
// Prices are in the smallest currency unit (cents for USD).
// The client never sends a price — the server always looks it up
// by product ID, preventing price-tampering attacks.

/** Maximum order total in cents ($10,000). Prevents runaway charges. */
const MAX_ORDER_TOTAL_CENTS = 1_000_000;
const PRODUCTS = {
  'tbh-hoodie-blk':      { name: 'TunedbyHAX Hoodie (Black)',           price: 5500  },
  'tbh-hoodie-grn':      { name: 'TunedbyHAX Hoodie (Green)',           price: 5500  },
  'tbh-tee-wht':         { name: 'TunedbyHAX T-Shirt (White)',          price: 2800  },
  'tbh-tee-blk':         { name: 'TunedbyHAX T-Shirt (Black)',          price: 2800  },
  'tbh-cap':             { name: 'TunedbyHAX Snapback Cap',             price: 3200  },
  'tbh-sticker-pack':    { name: 'TunedbyHAX Vinyl Sticker Pack (10x)', price: 1200  },
  'jdm-diecast-rx7':     { name: '1:64 Mazda RX-7 FD Die-Cast Model',  price: 3500  },
  'jdm-diecast-sti':     { name: '1:64 Subaru WRX STI Die-Cast Model', price: 3500  },
  'jdm-keychain':        { name: 'JDM Turbo Keychain',                  price: 1500  },
  'tbh-poster-jdm':      { name: 'JDM Garage Poster (A2)',             price: 2200  },
};

// ── Helper: validate a cart from the request ──────────────────
function validateCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Cart is empty.' };
  }
  if (items.length > 50) {
    return { error: 'Cart contains too many items.' };
  }

  let total = 0;

  for (const item of items) {
    if (typeof item.id !== 'string' || !PRODUCTS[item.id]) {
      return { error: `Unknown product: ${item.id}` };
    }
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      return { error: `Invalid quantity for product ${item.id}.` };
    }
    total += PRODUCTS[item.id].price * qty;
  }

  // Stripe minimum is $0.50 USD
  if (total < 50) {
    return { error: 'Order total is below the minimum charge amount.' };
  }

  // Sanity cap: $10,000 per order
  if (total > MAX_ORDER_TOTAL_CENTS) {
    return { error: 'Order total exceeds the maximum allowed amount.' };
  }

  return { total };
}

// ── POST /create-payment-intent ────────────────────────────────
// Body: { items: [{ id: string, qty: number }], currency?: string }
// Returns: { clientSecret: string, total: number }
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { items, currency = 'usd' } = req.body;

    // Only USD is supported for Cash App Pay
    if (typeof currency !== 'string' || currency.toLowerCase() !== 'usd') {
      return res.status(400).json({ error: 'Only USD is supported.' });
    }

    const validation = validateCart(items);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const { total } = validation;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      // 'automatic_payment_methods' enables all payment methods
      // configured in the Stripe Dashboard, including Cash App Pay
      // and all major debit/credit card networks.
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(
          items.map(i => ({ id: i.id, qty: i.qty, name: PRODUCTS[i.id].name }))
        ),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret, total });
  } catch (err) {
    console.error('[TunedbyHAX] Stripe error:', err.message);
    res.status(500).json({ error: 'Unable to create payment session. Please try again.' });
  }
});

// ── GET /products ──────────────────────────────────────────────
// Returns the full product catalogue (safe to expose publicly).
app.get('/products', (_req, res) => {
  res.json(PRODUCTS);
});

// ── 404 fallback ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ── Start ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[TunedbyHAX] Server listening on http://localhost:${PORT}`);
});
