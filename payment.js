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

// Warn at runtime if the key has not been replaced
if (STRIPE_PUBLISHABLE_KEY.includes('REPLACE_WITH')) {
  console.warn(
    '[TunedbyHAX] WARNING: Stripe publishable key is still a placeholder.\n' +
    'Replace STRIPE_PUBLISHABLE_KEY in payment.js with your actual key from\n' +
    'https://dashboard.stripe.com/apikeys before accepting real payments.'
  );
}

// ── API base URL ───────────────────────────────────────────────
// When the front-end is served from the same origin as the Node.js
// backend (e.g. running `node server.js` locally), leave this as an
// empty string so fetch uses a relative path.
//
// If the front-end is hosted on a static host (e.g. GitHub Pages) and
// the backend is deployed separately, set this to the full origin of
// the backend server, for example:
//   const API_BASE_URL = 'https://api.tunedbyhax.com';
const API_BASE_URL = '';

// ── Product catalogue (mirrors server.js) ─────────────────────
// Prices in cents — displayed only, never sent to server.
// The server always calculates the authoritative total.
// Products with a `sizes` array will display a size selector on the card.
// Products with an `image` property will show that image in the card banner.
const SHOP_PRODUCTS = [
  {
    id: 'tbh-hoodie-blk',
    name: 'TunedbyHAX Hoodie',
    variant: 'Black',
    price: 5500,
    category: 'Apparel',
    emoji: '🧥',
    image: 'IMG_20260322_055604542.jpg',
    sizes: ['Small', 'Medium', 'Large', 'Custom'],
    description: 'Premium fleece hoodie — HAX logo embroidered on chest.',
  },
  {
    id: 'tbh-hoodie-grn',
    name: 'TunedbyHAX Hoodie',
    variant: 'Green',
    price: 5500,
    category: 'Apparel',
    emoji: '🧥',
    image: 'IMG_20260322_055618348.jpg',
    sizes: ['Small', 'Medium', 'Large', 'Custom'],
    description: 'Premium fleece hoodie in signature HAX green.',
  },
  {
    id: 'tbh-tee-wht',
    name: 'TunedbyHAX T-Shirt',
    variant: 'White',
    price: 2800,
    category: 'Apparel',
    emoji: '👕',
    image: 'IMG_20260322_055635754.jpg',
    sizes: ['Small', 'Medium', 'Large', 'Custom'],
    description: 'Soft cotton tee with TunedbyHAX logo print.',
  },
  {
    id: 'tbh-tee-blk',
    name: 'TunedbyHAX T-Shirt',
    variant: 'Black',
    price: 2800,
    category: 'Apparel',
    emoji: '👕',
    image: 'IMG_20260322_055644699.jpg',
    sizes: ['Small', 'Medium', 'Large', 'Custom'],
    description: 'Soft cotton tee — all-black edition.',
  },
  {
    id: 'tbh-cap',
    name: 'TunedbyHAX Snapback Cap',
    variant: '',
    price: 3200,
    category: 'Apparel',
    emoji: '🧢',
    image: 'IMG_20260322_055548226.jpg',
    sizes: ['Small', 'Medium', 'Large', 'Custom'],
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
  // ── Car Logo Keychains — $6.50 each ──────────────────────────
  {
    id: 'car-logo-keychain-toyota',
    name: 'Car Logo Keychain',
    variant: 'Toyota',
    price: 650,
    category: 'Accessories',
    emoji: '🔑',
    image: 'IMG_20260322_055524404.jpg',
    description: 'Zinc alloy Toyota logo keychain — a bold accent for your keys.',
  },
  {
    id: 'car-logo-keychain-honda',
    name: 'Car Logo Keychain',
    variant: 'Honda',
    price: 650,
    category: 'Accessories',
    emoji: '🔑',
    image: 'IMG_20260322_055524404.jpg',
    description: 'Zinc alloy Honda logo keychain — sleek and durable.',
  },
  {
    id: 'car-logo-keychain-subaru',
    name: 'Car Logo Keychain',
    variant: 'Subaru',
    price: 650,
    category: 'Accessories',
    emoji: '🔑',
    image: 'IMG_20260322_055537068.jpg',
    description: 'Zinc alloy Subaru star logo keychain — rally-inspired style.',
  },
  {
    id: 'car-logo-keychain-nissan',
    name: 'Car Logo Keychain',
    variant: 'Nissan',
    price: 650,
    category: 'Accessories',
    emoji: '🔑',
    image: 'IMG_20260322_055537068.jpg',
    description: 'Zinc alloy Nissan logo keychain — JDM roots on your keyring.',
  },
  {
    id: 'car-logo-keychain-mitsubishi',
    name: 'Car Logo Keychain',
    variant: 'Mitsubishi',
    price: 650,
    category: 'Accessories',
    emoji: '🔑',
    image: 'IMG_20260322_132332~2.jpg',
    description: 'Zinc alloy Mitsubishi diamond logo keychain — iconic JDM flair.',
  },
  // ── Custom Keychain — $8.50 ───────────────────────────────────
  {
    id: 'custom-keychain',
    name: 'Custom Keychain',
    variant: 'Custom Design',
    price: 850,
    category: 'Accessories',
    emoji: '✨',
    image: 'IMG_20260322_132332~2.jpg',
    description: 'Personalized custom keychain — your logo, your design, your style. Contact us with your artwork.',
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

// ── Shipping rates (mirrors server.js SHIPPING_RATES) ─────────
// Prices in cents — displayed only; server is authoritative.
const FREE_SHIPPING_THRESHOLD = 5000; // $50.00

const SHIPPING_OPTIONS = [
  {
    id:          'standard',
    label:       'Standard Shipping',
    carrier:     'USPS / UPS Ground',
    eta:         '5–7 business days',
    price:       699,
    description: 'Free on orders over $50',
  },
  {
    id:          'expedited',
    label:       'Expedited Shipping',
    carrier:     'UPS 2-Day',
    eta:         '2–3 business days',
    price:       1499,
    description: 'Faster delivery, guaranteed',
  },
  {
    id:          'overnight',
    label:       'Overnight Shipping',
    carrier:     'UPS Next Day Air',
    eta:         '1 business day',
    price:       2999,
    description: 'Next-day delivery by end of business',
  },
  {
    id:          'international',
    label:       'International',
    carrier:     'USPS Priority Mail Intl',
    eta:         '7–21 business days',
    price:       2499,
    description: 'Duties & taxes may apply',
  },
];

// ── Cart state ─────────────────────────────────────────────────
let cart             = []; // [{ product, qty }]
let selectedShipping = 'standard';

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

    const bannerContent = product.image
      ? `<img class="shop-card-img" src="${escShop(product.image)}" alt="${escShop(product.name + (product.variant ? ' ' + product.variant : ''))}" loading="lazy">`
      : `<span class="shop-card-emoji">${product.emoji}</span>`;

    const sizeSelector = product.sizes
      ? `<div class="shop-card-size-wrap">
           <label class="shop-card-size-label" for="size-${product.id}">Size:</label>
           <select class="shop-card-size-select" id="size-${product.id}" data-product-id="${product.id}">
             ${product.sizes.map(s => `<option value="${escShop(s)}">${escShop(s)}</option>`).join('')}
           </select>
         </div>`
      : '';

    card.innerHTML = `
      <div class="shop-card-banner">${bannerContent}</div>
      <div class="shop-card-body">
        <div class="shop-card-category">${product.category}</div>
        <div class="shop-card-name">${escShop(product.name)}${product.variant ? ` <span class="shop-card-variant">${escShop(product.variant)}</span>` : ''}</div>
        <p class="shop-card-desc">${escShop(product.description)}</p>
        ${sizeSelector}
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
// Cart items: { product, qty, size, cartKey }
// cartKey is `productId|size` for sized items, otherwise just `productId`
function addToCart(productId) {
  const product = SHOP_PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  // Read selected size if this product has a size selector
  const sizeSelect = document.getElementById(`size-${productId}`);
  const size = sizeSelect ? sizeSelect.value : null;
  const cartKey = size ? `${productId}|${size}` : productId;

  const existing = cart.find(item => item.cartKey === cartKey);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 99);
  } else {
    cart.push({ product, qty: 1, size, cartKey });
  }

  updateCartBadge();
  renderCartItems();
  showCartFlyout();
}

function removeFromCart(cartKey) {
  cart = cart.filter(item => item.cartKey !== cartKey);
  updateCartBadge();
  renderCartItems();
}

function updateQty(cartKey, delta) {
  const item = cart.find(i => i.cartKey === cartKey);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, 99));
  updateCartBadge();
  renderCartItems();
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
}

function shippingCost() {
  const opt = SHIPPING_OPTIONS.find(o => o.id === selectedShipping);
  if (!opt) return 0;
  // Standard is free when merchandise subtotal >= threshold
  if (opt.id === 'standard' && cartTotal() >= FREE_SHIPPING_THRESHOLD) return 0;
  return opt.price;
}

function orderTotal() {
  return cartTotal() + shippingCost();
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

  cart.forEach(({ product, qty, size, cartKey }) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <span class="cart-item-emoji">${product.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${escShop(product.name)}${product.variant ? ` <span class="cart-item-variant">${escShop(product.variant)}</span>` : ''}${size ? ` <span class="cart-item-size">${escShop(size)}</span>` : ''}</div>
        <div class="cart-item-price">${fmtPrice(product.price * qty)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="cart-qty-btn" data-key="${escShop(cartKey)}" data-delta="-1">−</button>
        <span>${qty}</span>
        <button class="cart-qty-btn" data-key="${escShop(cartKey)}" data-delta="1">+</button>
      </div>
      <button class="cart-remove" data-key="${escShop(cartKey)}" title="Remove">✕</button>
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
        updateQty(qtyBtn.dataset.key, Number(qtyBtn.dataset.delta));
      } else if (removeBtn) {
        removeFromCart(removeBtn.dataset.key);
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

  $('checkoutError')   && ($('checkoutError').textContent  = '');
  $('checkoutSuccess') && $('checkoutSuccess').classList.add('hidden');
  $('checkoutForm')    && $('checkoutForm').classList.remove('hidden');

  renderShippingSelector();
  renderCheckoutSummary();

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  await initStripeElements();
}

// ── Render shipping selector inside checkout modal ─────────────
function renderShippingSelector() {
  const container = $('shippingSelector');
  if (!container) return;
  const subtotal = cartTotal();

  container.innerHTML = SHIPPING_OPTIONS.map(opt => {
    const effective =
      opt.id === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : opt.price;
    const priceLabel = effective === 0
      ? '<span class="ship-opt-free">FREE</span>'
      : fmtPrice(effective);
    const checked = selectedShipping === opt.id ? 'checked' : '';
    return `
      <label class="ship-opt${selectedShipping === opt.id ? ' ship-opt-selected' : ''}">
        <input type="radio" name="shippingMethod" value="${opt.id}" ${checked} class="ship-opt-radio">
        <div class="ship-opt-body">
          <div class="ship-opt-top">
            <span class="ship-opt-label">${escShop(opt.label)}</span>
            <span class="ship-opt-price">${priceLabel}</span>
          </div>
          <div class="ship-opt-meta">
            <span class="ship-opt-carrier">${escShop(opt.carrier)}</span>
            <span class="ship-opt-eta">⏱ ${escShop(opt.eta)}</span>
          </div>
          <div class="ship-opt-desc">${escShop(opt.description)}</div>
        </div>
      </label>
    `;
  }).join('');

  // Listen for changes and re-render summary + button
  container.querySelectorAll('.ship-opt-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedShipping = radio.value;
      // Update selected highlight
      container.querySelectorAll('.ship-opt').forEach(el => {
        el.classList.toggle('ship-opt-selected', el.querySelector('.ship-opt-radio').value === selectedShipping);
      });
      renderCheckoutSummary();
      // Re-init stripe elements with new shipping to get correct total
      const btn = $('checkoutSubmitBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'Updating…'; }
      initStripeElements();
    });
  });
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

  const shippingAmt = shippingCost();
  const opt = SHIPPING_OPTIONS.find(o => o.id === selectedShipping);
  const shippingLabel = opt ? escShop(opt.label) : 'Shipping';
  const shippingDisplay = shippingAmt === 0
    ? '<span class="checkout-summary-free">FREE</span>'
    : fmtPrice(shippingAmt);

  summaryEl.innerHTML = `
    ${rows}
    <div class="checkout-summary-row checkout-summary-shipping">
      <span>📦 ${shippingLabel}</span>
      <span>${shippingDisplay}</span>
    </div>
    <div class="checkout-summary-total">
      <span>Total</span>
      <span>${fmtPrice(orderTotal())}</span>
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
    const response = await fetch(API_BASE_URL + '/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items:          cart.map(i => ({ id: i.product.id, qty: i.qty })),
        shippingMethod: selectedShipping,
        currency:       'usd',
      }),
    });

    // Guard against non-JSON responses (e.g. an HTML 404 page returned by a
    // static host) which would otherwise throw a cryptic JSON.parse error.
    // Use case-insensitive match since HTTP headers are case-insensitive.
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      throw new Error(
        `Payment server returned an unexpected response (HTTP ${response.status}). ` +
        'Please ensure the backend server is running and API_BASE_URL is configured correctly.'
      );
    }

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
          colorPrimary:       '#00d64f',   // Cash App green as primary accent
          colorBackground:    '#18181b',
          colorText:          '#e4e4e7',
          colorDanger:        '#ef4444',
          fontFamily:         '\'Segoe UI\', system-ui, sans-serif',
          borderRadius:       '8px',
        },
      },
    });

    // 'cashappPay: always' ensures the Cash App Pay button is always rendered
    // at the top of the payment options when Cash App Pay is enabled in the
    // Stripe Dashboard (Settings → Payment methods → Cash App Pay).
    paymentElement = elements.create('payment', {
      layout: 'tabs',
      wallets: {
        cashappPay: 'always',
      },
    });
    paymentElement.mount('#paymentElementMount');

    paymentElement.on('ready', () => {
      const btn = $('checkoutSubmitBtn');
      if (btn) {
        btn.disabled = false;
        btn.textContent = `Pay ${fmtPrice(checkoutTotal)}`;
      }
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
