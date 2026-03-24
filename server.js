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

// CORS — must be registered first so preflight OPTIONS requests
// receive the correct headers before any other middleware runs.
// Restrict to same origin in production; allow all in development.
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST'],
}));

// Serve static front-end files from the project root
app.use(express.static(path.join(__dirname)));

// Parse JSON request bodies (limit prevents abuse)
app.use(express.json({ limit: '16kb' }));

// ── Shipping rates ─────────────────────────────────────────────
// Rates are in cents (USD).  Free standard shipping kicks in when
// the merchandise subtotal reaches FREE_SHIPPING_THRESHOLD_CENTS.
const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // $50.00

const SHIPPING_RATES = {
  standard: {
    id:          'standard',
    label:       'Standard Shipping',
    carrier:     'USPS / UPS Ground',
    eta:         '5–7 business days',
    price:       699,   // $6.99 (waived when subtotal ≥ $50)
    description: 'Tracked delivery via USPS First Class or UPS Ground.',
  },
  expedited: {
    id:          'expedited',
    label:       'Expedited Shipping',
    carrier:     'UPS 2-Day',
    eta:         '2–3 business days',
    price:       1499,  // $14.99
    description: 'Tracked UPS 2-Day Air — arrives faster, guaranteed.',
  },
  overnight: {
    id:          'overnight',
    label:       'Overnight Shipping',
    carrier:     'UPS Next Day Air',
    eta:         '1 business day',
    price:       2999,  // $29.99
    description: 'Next-day UPS Air delivery by end of next business day.',
  },
  international: {
    id:          'international',
    label:       'International Shipping',
    carrier:     'USPS Priority Mail International',
    eta:         '7–21 business days',
    price:       2499,  // $24.99
    description: 'Worldwide tracked delivery. Duties & taxes may apply.',
  },
};

// ── Server-side product catalogue ─────────────────────────────
// Prices are in the smallest currency unit (cents for USD).
// The client never sends a price — the server always looks it up
// by product ID, preventing price-tampering attacks.

/** Maximum order total in cents ($10,000). Prevents runaway charges. */
const MAX_ORDER_TOTAL_CENTS = 1_000_000;
const PRODUCTS = {
  'tbh-hoodie-blk':           { name: 'TunedbyHAX Hoodie (Black)',           price: 5500  },
  'tbh-hoodie-grn':           { name: 'TunedbyHAX Hoodie (Green)',           price: 5500  },
  'tbh-tee-wht':              { name: 'TunedbyHAX T-Shirt (White)',          price: 2800  },
  'tbh-tee-blk':              { name: 'TunedbyHAX T-Shirt (Black)',          price: 2800  },
  'tbh-cap':                  { name: 'TunedbyHAX Snapback Cap',             price: 3200  },
  'tbh-sticker-pack':         { name: 'TunedbyHAX Vinyl Sticker Pack (10x)', price: 1200  },
  'jdm-diecast-rx7':          { name: '1:64 Mazda RX-7 FD Die-Cast Model',  price: 3500  },
  'jdm-diecast-sti':          { name: '1:64 Subaru WRX STI Die-Cast Model', price: 3500  },
  'jdm-keychain':             { name: 'JDM Turbo Keychain',                  price: 1500  },
  // Car Logo Keychains — $6.50 each
  'car-logo-keychain-toyota':     { name: 'Car Logo Keychain (Toyota)',     price: 650   },
  'car-logo-keychain-honda':      { name: 'Car Logo Keychain (Honda)',      price: 650   },
  'car-logo-keychain-subaru':     { name: 'Car Logo Keychain (Subaru)',     price: 650   },
  'car-logo-keychain-nissan':     { name: 'Car Logo Keychain (Nissan)',     price: 650   },
  'car-logo-keychain-mitsubishi': { name: 'Car Logo Keychain (Mitsubishi)', price: 650   },
  // Custom Keychain — $8.50
  'custom-keychain':          { name: 'Custom Keychain (Custom Design)',     price: 850   },
  'tbh-poster-jdm':           { name: 'JDM Garage Poster (A2)',             price: 2200  },
};

// ── Helper: validate a cart from the request ──────────────────
function validateCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Cart is empty.' };
  }
  if (items.length > 50) {
    return { error: 'Cart contains too many items.' };
  }

  let subtotal = 0;

  for (const item of items) {
    if (typeof item.id !== 'string' || !PRODUCTS[item.id]) {
      return { error: `Unknown product: ${item.id}` };
    }
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      return { error: `Invalid quantity for product ${item.id}.` };
    }
    subtotal += PRODUCTS[item.id].price * qty;
  }

  // Stripe minimum is $0.50 USD
  if (subtotal < 50) {
    return { error: 'Order total is below the minimum charge amount.' };
  }

  return { subtotal };
}

// ── Helper: resolve shipping cost ─────────────────────────────
function resolveShipping(shippingMethod, subtotal) {
  const rate = SHIPPING_RATES[shippingMethod];
  if (!rate) {
    return { error: `Unknown shipping method: ${shippingMethod}` };
  }

  // Standard shipping is free when merchandise subtotal >= threshold
  const shippingCost =
    shippingMethod === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : rate.price;

  return { shippingCost };
}

// ── POST /create-payment-intent ────────────────────────────────
// Body: { items: [{ id: string, qty: number }], shippingMethod: string, currency?: string }
// Returns: { clientSecret: string, subtotal: number, shippingCost: number, total: number }
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { items, shippingMethod = 'standard', currency = 'usd' } = req.body;

    // Only USD is supported for Cash App Pay
    if (typeof currency !== 'string' || currency.toLowerCase() !== 'usd') {
      return res.status(400).json({ error: 'Only USD is supported.' });
    }

    const cartValidation = validateCart(items);
    if (cartValidation.error) {
      return res.status(400).json({ error: cartValidation.error });
    }

    const { subtotal } = cartValidation;

    const shippingValidation = resolveShipping(shippingMethod, subtotal);
    if (shippingValidation.error) {
      return res.status(400).json({ error: shippingValidation.error });
    }

    const { shippingCost } = shippingValidation;
    const total = subtotal + shippingCost;

    // Sanity cap: $10,000 per order
    if (total > MAX_ORDER_TOTAL_CENTS) {
      return res.status(400).json({ error: 'Order total exceeds the maximum allowed amount.' });
    }

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
        shippingMethod,
        shippingCost: String(shippingCost),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      subtotal,
      shippingCost,
      total,
    });
  } catch (err) {
    console.error('[TunedbyHAX] Stripe error:', err.message);
    res.status(500).json({ error: 'Unable to create payment session. Please try again.' });
  }
});

// ── GET /shipping-rates ────────────────────────────────────────
// Returns all available shipping methods and their prices.
// The subtotal query param allows the server to indicate whether
// standard shipping is free for that order.
// Query: ?subtotal=<cents>
app.get('/shipping-rates', (req, res) => {
  const subtotal = Number(req.query.subtotal) || 0;

  const rates = Object.values(SHIPPING_RATES).map(rate => ({
    ...rate,
    effectivePrice:
      rate.id === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : rate.price,
    freeThreshold: rate.id === 'standard' ? FREE_SHIPPING_THRESHOLD_CENTS : null,
  }));

  res.json({ rates, freeShippingThreshold: FREE_SHIPPING_THRESHOLD_CENTS });
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
