/* ============================================================
   TunedbyHAX — Shop & Payment  |  payment.js
   ============================================================
   Depends on: Stripe.js loaded via <script> in index.html
   ============================================================ */

'use strict';

// ── Stripe publishable key ─────────────────────────────────────
// Replace with your actual Stripe publishable key.
// The publishable key is safe to include in front-end code.
// Never put the secret key here.
const STRIPE_PUBLISHABLE_KEY = 'pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY';

// ── Product catalogue (mirrors server.js) ─────────────────────
// Prices in cents — displayed only, never sent to server.
// The server always calculates the authoritative total.
const SHOP_PRODUCTS = [
  {
    id: 'tbh-hoodie-blk',
    name: 'TunedbyHAX Hoodie',
    variant: 'Black',
    price: 5500,
    category: 'Apparel',
    emoji: '🧥',
    description: 'Premium fleece hoodie — HAX logo embroidered on chest.',
  },
  {
    id: 'tbh-hoodie-grn',
    name: 'TunedbyHAX Hoodie',
    variant: 'Green',
    price: 5500,
    category: 'Apparel',
    emoji: '🧥',
    description: 'Premium fleece hoodie in signature HAX green.',
  },
  {
    id: 'tbh-tee-wht',
    name: 'TunedbyHAX T-Shirt',
    variant: 'White',
    price: 2800,
    category: 'Apparel',
    emoji: '👕',
    description: 'Soft cotton tee with TunedbyHAX logo print.',
  },
  {
    id: 'tbh-tee-blk',
    name: 'TunedbyHAX T-Shirt',
    variant: 'Black',
    price: 2800,
    category: 'Apparel',
    emoji: '👕',
    description: 'Soft cotton tee — all-black edition.',
  },
  {
    id: 'tbh-cap',
    name: 'TunedbyHAX Snapback Cap',
    variant: '',
    price: 3200,
    category: 'Apparel',
    emoji: '🧢',
    description: 'Structured snapback with embroidered HAX branding.',
  },
  {
    id: 'tbh-sticker-pack',
    name: 'Vinyl Sticker Pack',
    variant: '10-piece',
    price: 1200,
    category: 'Accessories',
    emoji: '🔖',
    description: '10 premium die-cut vinyl stickers — JDM & HAX designs.',
  },
  {
    id: 'jdm-diecast-rx7',
    name: '1:64 Mazda RX-7 FD',
    variant: 'Die-Cast Model',
    price: 3500,
    category: 'Collectibles',
    emoji: '🏎️',
    description: 'Highly detailed die-cast in Vintage Red — HAX approved.',
  },
  {
    id: 'jdm-diecast-sti',
    name: '1:64 Subaru WRX STI',
    variant: 'Die-Cast Model',
    price: 3500,
    category: 'Collectibles',
    emoji: '🚗',
    description: 'WR Blue die-cast model with opening hood detail.',
  },
  {
    id: 'jdm-keychain',
    name: 'JDM Turbo Keychain',
    variant: '',
    price: 1500,
    category: 'Accessories',
    emoji: '🔑',
    description: 'Zinc alloy turbo replica keychain — the perfect finishing touch.',
  },
  {
    id: 'tbh-poster-jdm',
    name: 'JDM Garage Poster',
    variant: 'A2 (16.5 × 23.4 in)',
    price: 2200,
    category: 'Collectibles',
    emoji: '🖼️',
    description: 'High-quality print of HAX\'s personal JDM garage shoot.',
  },
];

// ── Cart state ─────────────────────────────────────────────────
let cart = []; // [{ product, qty }]

// ── DOM helpers ────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function fmtPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

// ── Product display helper ─────────────────────────────────────
function productDisplayName(product) {
  return product.variant
    ? `${product.emoji} ${escShop(product.name)} <span class="shop-card-variant">${escShop(product.variant)}</span>`
    : `${product.emoji} ${escShop(product.name)}`;
}

function productDisplayText(product) {
  const base = product.variant ? `${product.name} (${product.variant})` : product.name;
  return `${product.emoji} ${base}`;
}

// ── Render shop grid ───────────────────────────────────────────
function renderShop() {
  const grid = $('shopGrid');
  if (!grid) return;
  grid.innerHTML = '';

  SHOP_PRODUCTS.forEach(product => {
    const card = document.createElement('article');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="shop-card-banner">${product.emoji}</div>
      <div class="shop-card-body">
        <div class="shop-card-category">${product.category}</div>
        <div class="shop-card-name">${escShop(product.name)}${product.variant ? ` <span class="shop-card-variant">${escShop(product.variant)}</span>` : ''}</div>
        <p class="shop-card-desc">${escShop(product.description)}</p>
        <div class="shop-card-footer">
          <span class="shop-card-price">${fmtPrice(product.price)}</span>
          <button class="btn btn-primary btn-sm btn-add-to-cart" data-product-id="${product.id}">
            Add to Cart
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Delegate add-to-cart clicks
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add-to-cart');
    if (!btn) return;
    addToCart(btn.dataset.productId);
  });
}

// ── Cart helpers ───────────────────────────────────────────────
function addToCart(productId) {
  const product = SHOP_PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.product.id === productId);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 99);
  } else {
    cart.push({ product, qty: 1 });
  }

  updateCartBadge();
  renderCartItems();
  showCartFlyout();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.product.id !== productId);
  updateCartBadge();
  renderCartItems();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, 99));
  updateCartBadge();
  renderCartItems();
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const badge = $('cartBadge');
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

function renderCartItems() {
  const list    = $('cartItems');
  const footer  = $('cartFooter');
  const empty   = $('cartEmpty');
  if (!list) return;

  list.innerHTML = '';

  if (cart.length === 0) {
    empty  && empty.classList.remove('hidden');
    footer && footer.classList.add('hidden');
    return;
  }

  empty  && empty.classList.add('hidden');
  footer && footer.classList.remove('hidden');

  cart.forEach(({ product, qty }) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <span class="cart-item-emoji">${product.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${escShop(product.name)}${product.variant ? ` <span class="cart-item-variant">${escShop(product.variant)}</span>` : ''}</div>        <div class="cart-item-price">${fmtPrice(product.price * qty)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="cart-qty-btn" data-id="${product.id}" data-delta="-1">−</button>
        <span>${qty}</span>
        <button class="cart-qty-btn" data-id="${product.id}" data-delta="1">+</button>
      </div>
      <button class="cart-remove" data-id="${product.id}" title="Remove">✕</button>
    `;
    list.appendChild(li);
  });

  const totalEl = $('cartTotal');
  if (totalEl) totalEl.textContent = fmtPrice(cartTotal());
}

// ── Cart flyout ────────────────────────────────────────────────
function showCartFlyout() {
  const flyout = $('cartFlyout');
  if (!flyout) return;
  flyout.classList.remove('hidden');
  $('cartOverlay') && $('cartOverlay').classList.remove('hidden');
}

function hideCartFlyout() {
  $('cartFlyout')  && $('cartFlyout').classList.add('hidden');
  $('cartOverlay') && $('cartOverlay').classList.add('hidden');
}

// ── Cart event delegation ──────────────────────────────────────
function initCartEvents() {
  // Cart toggle button in nav
  const cartBtn = $('cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', () => {
    const flyout = $('cartFlyout');
    if (!flyout) return;
    if (flyout.classList.contains('hidden')) {
      renderCartItems();
      showCartFlyout();
    } else {
      hideCartFlyout();
    }
  });

  // Overlay / close button
  $('cartOverlay') && $('cartOverlay').addEventListener('click', hideCartFlyout);
  $('cartClose')   && $('cartClose').addEventListener('click', hideCartFlyout);

  // Qty / remove delegation inside cart list
  const cartItems = $('cartItems');
  if (cartItems) {
    cartItems.addEventListener('click', e => {
      const qtyBtn    = e.target.closest('.cart-qty-btn');
      const removeBtn = e.target.closest('.cart-remove');
      if (qtyBtn) {
        updateQty(qtyBtn.dataset.id, Number(qtyBtn.dataset.delta));
      } else if (removeBtn) {
        removeFromCart(removeBtn.dataset.id);
      }
    });
  }

  // Checkout button inside cart flyout
  const checkoutBtn = $('cartCheckoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
    hideCartFlyout();
    openCheckout();
  });
}

// ── Checkout modal ─────────────────────────────────────────────
let stripe          = null;
let elements        = null;
let paymentElement  = null;
let checkoutTotal   = 0;

async function openCheckout() {
  if (cart.length === 0) return;

  const modal = $('checkoutModalOverlay');
  if (!modal) return;

  $('checkoutError')  && ($('checkoutError').textContent  = '');
  $('checkoutSuccess') && $('checkoutSuccess').classList.add('hidden');
  $('checkoutForm')   && $('checkoutForm').classList.remove('hidden');
  $('paymentSummary') && renderCheckoutSummary();

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  await initStripeElements();
}

function closeCheckout() {
  const modal = $('checkoutModalOverlay');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  // Clean up Stripe elements so a fresh one is created next time
  elements       = null;
  paymentElement = null;
  $('paymentElementMount') && ($('paymentElementMount').innerHTML = '');
}

function renderCheckoutSummary() {
  const summaryEl = $('paymentSummary');
  if (!summaryEl) return;

  const rows = cart.map(({ product, qty }) => `
    <div class="checkout-summary-row">
      <span>${escShop(productDisplayText(product))} × ${qty}</span>
      <span>${fmtPrice(product.price * qty)}</span>
    </div>
  `).join('');

  summaryEl.innerHTML = `
    ${rows}
    <div class="checkout-summary-total">
      <span>Total</span>
      <span>${fmtPrice(cartTotal())}</span>
    </div>
  `;
}

async function initStripeElements() {
  const mountEl = $('paymentElementMount');
  if (!mountEl) return;

  $('checkoutSubmitBtn') && ($('checkoutSubmitBtn').disabled = true);
  mountEl.innerHTML = '<div class="payment-loading">Loading payment form…</div>';

  try {
    // Create a PaymentIntent on our server
    const response = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ id: i.product.id, qty: i.qty })),
        currency: 'usd',
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to initialise payment.');
    }

    checkoutTotal = data.total;

    // Initialise Stripe.js
    if (!stripe) {
      if (typeof Stripe === 'undefined') {
        throw new Error('Stripe.js failed to load. Please check your connection.');
      }
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    }

    // Mount the Payment Element (supports cards + Cash App Pay + more)
    mountEl.innerHTML = '';
    elements = stripe.elements({
      clientSecret: data.clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary:       '#f97316',
          colorBackground:    '#18181b',
          colorText:          '#e4e4e7',
          colorDanger:        '#ef4444',
          fontFamily:         '\'Segoe UI\', system-ui, sans-serif',
          borderRadius:       '8px',
        },
      },
    });

    paymentElement = elements.create('payment', {
      layout: 'tabs',
    });
    paymentElement.mount('#paymentElementMount');

    paymentElement.on('ready', () => {
      $('checkoutSubmitBtn') && ($('checkoutSubmitBtn').disabled = false);
    });

  } catch (err) {
    mountEl.innerHTML = '';
    const errEl = $('checkoutError');
    if (errEl) errEl.textContent = err.message;
    console.error('[TunedbyHAX] Payment init error:', err);
  }
}

async function submitPayment(e) {
  e.preventDefault();
  if (!stripe || !elements) return;

  const submitBtn = $('checkoutSubmitBtn');
  const errEl     = $('checkoutError');
  if (errEl) errEl.textContent = '';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Processing…'; }

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: window.location.href,
    },
    redirect: 'if_required',
  });

  if (error) {
    if (errEl) errEl.textContent = error.message;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = `Pay ${fmtPrice(checkoutTotal)}`; }
  } else {
    // Payment succeeded (no redirect required)
    cart = [];
    updateCartBadge();
    $('checkoutForm')    && $('checkoutForm').classList.add('hidden');
    $('checkoutSuccess') && $('checkoutSuccess').classList.remove('hidden');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Pay Now'; }
  }
}

// ── Checkout modal events ──────────────────────────────────────
function initCheckoutEvents() {
  $('checkoutClose')  && $('checkoutClose').addEventListener('click', closeCheckout);
  $('checkoutCancelBtn') && $('checkoutCancelBtn').addEventListener('click', closeCheckout);
  $('checkoutSuccessBack') && $('checkoutSuccessBack').addEventListener('click', closeCheckout);
  $('checkoutModalOverlay') && $('checkoutModalOverlay').addEventListener('click', e => {
    if (e.target === $('checkoutModalOverlay')) closeCheckout();
  });
  const form = $('checkoutForm');
  if (form) form.addEventListener('submit', submitPayment);
}

// ── Escape HTML (shop-safe) ────────────────────────────────────
function escShop(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderShop();
  initCartEvents();
  initCheckoutEvents();
  updateCartBadge();

  // Update submit button text when checkout total changes
  const submitBtn = $('checkoutSubmitBtn');
  if (submitBtn) submitBtn.textContent = 'Pay Now';
});
