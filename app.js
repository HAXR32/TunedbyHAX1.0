/* ============================================================
   TunedbyHAX — Virtual Garage  |  app.js
   ============================================================ */

'use strict';

// ── Storage helpers ────────────────────────────────────────────
const STORAGE_KEY = 'tunedByHax_garage';

function loadGarage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveGarage(cars) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
}

// ── State ──────────────────────────────────────────────────────
let cars        = loadGarage();
let editingId   = null;
let deletingId  = null;
let modsCarId   = null;

// ── DOM refs ───────────────────────────────────────────────────
const garageGrid    = document.getElementById('garageGrid');
const emptyState    = document.getElementById('emptyState');
const searchInput   = document.getElementById('searchInput');
const sortSelect    = document.getElementById('sortSelect');

// Stats
const statTotal   = document.getElementById('statTotal');
const statMods    = document.getElementById('statMods');
const statSpent   = document.getElementById('statSpent');
const statNewest  = document.getElementById('statNewest');

// Add/Edit modal
const carModal      = document.getElementById('carModal');
const carForm       = document.getElementById('carForm');
const modalTitle    = document.getElementById('modalTitle');
const carIdInput    = document.getElementById('carId');
const carYear       = document.getElementById('carYear');
const carMake       = document.getElementById('carMake');
const carModel      = document.getElementById('carModel');
const carColor      = document.getElementById('carColor');
const carMileage    = document.getElementById('carMileage');
const carHp         = document.getElementById('carHp');
const carNotes      = document.getElementById('carNotes');
const carEmojiInput = document.getElementById('carEmoji');
const emojiPicker   = document.getElementById('emojiPicker');

// Mods modal
const modsModal       = document.getElementById('modsModal');
const modsModalTitle  = document.getElementById('modsModalTitle');
const modsCarIdInput  = document.getElementById('modsCarId');
const modNameInput    = document.getElementById('modName');
const modCostInput    = document.getElementById('modCost');
const modCategoryInput= document.getElementById('modCategory');
const modsList        = document.getElementById('modsList');
const modsTotal       = document.getElementById('modsTotal');

// Delete modal
const deleteModal       = document.getElementById('deleteModal');
const deleteMsg         = document.getElementById('deleteMsg');
const deleteConfirmBtn  = document.getElementById('deleteConfirmBtn');

// ── Utility ────────────────────────────────────────────────────
let _uidCounter = 0;
function uid() {
  return Date.now().toString(36) + (++_uidCounter).toString(36) + Math.random().toString(36).slice(2);
}

function fmt$$(n) {
  if (!n) return '$0';
  return '$' + Number(n).toLocaleString();
}

function getCar(id) {
  return cars.find(c => c.id === id);
}

// ── Render ─────────────────────────────────────────────────────
function renderAll() {
  const q    = searchInput.value.toLowerCase().trim();
  const sort = sortSelect.value;

  let visible = cars.filter(c => {
    if (!q) return true;
    return (
      c.make.toLowerCase().includes(q)  ||
      c.model.toLowerCase().includes(q) ||
      String(c.year).includes(q)        ||
      (c.color || '').toLowerCase().includes(q) ||
      (c.notes || '').toLowerCase().includes(q)
    );
  });

  visible = [...visible].sort((a, b) => {
    switch (sort) {
      case 'year':   return b.year - a.year;
      case 'make':   return a.make.localeCompare(b.make);
      case 'mods':   return (b.mods || []).length - (a.mods || []).length;
      default:       return b.addedAt - a.addedAt;   // newest
    }
  });

  garageGrid.innerHTML = '';

  if (visible.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    visible.forEach(car => garageGrid.appendChild(buildCard(car)));
  }

  updateStats();
}

function buildCard(car) {
  const modCount   = (car.mods || []).length;
  const totalSpent = (car.mods || []).reduce((s, m) => s + (Number(m.cost) || 0), 0);

  const card = document.createElement('article');
  card.className = 'car-card';
  card.dataset.id = car.id;

  card.innerHTML = `
    <div class="card-banner">
      <span class="card-banner-emoji">${car.emoji || '🚗'}</span>
    </div>
    <div class="card-body">
      <div class="card-title">${car.year} ${escHtml(car.make)} ${escHtml(car.model)}</div>
      ${car.color ? `<div class="card-subtitle">🎨 ${escHtml(car.color)}</div>` : ''}
      <div class="card-meta">
        ${car.hp      ? `<span class="card-badge accent">⚡ ${car.hp} hp</span>` : ''}
        ${car.mileage ? `<span class="card-badge">🛣️ ${Number(car.mileage).toLocaleString()} mi</span>` : ''}
        ${modCount    ? `<span class="card-badge blue">🔩 ${modCount} mod${modCount !== 1 ? 's' : ''}</span>` : ''}
      </div>
      ${car.notes ? `<p class="card-notes">${escHtml(car.notes)}</p>` : ''}
      ${totalSpent ? `<p class="card-mods-count">Invested: <strong>${fmt$$(totalSpent)}</strong></p>` : ''}
    </div>
    <div class="card-footer">
      <button class="btn btn-icon btn-mods" title="Modifications" data-id="${car.id}">🔩</button>
      <button class="btn btn-icon btn-edit" title="Edit"          data-id="${car.id}">✏️</button>
      <button class="btn btn-icon btn-delete" title="Remove"      data-id="${car.id}">🗑️</button>
    </div>
  `;
  return card;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateStats() {
  const totalMods  = cars.reduce((s, c) => s + (c.mods || []).length, 0);
  const totalSpent = cars.reduce((s, c) =>
    s + (c.mods || []).reduce((ms, m) => ms + (Number(m.cost) || 0), 0), 0);
  const newest = cars.length
    ? [...cars].sort((a, b) => b.addedAt - a.addedAt)[0]
    : null;

  statTotal.textContent  = cars.length;
  statMods.textContent   = totalMods;
  statSpent.textContent  = fmt$$(totalSpent);
  statNewest.textContent = newest ? `${newest.year} ${newest.make}` : '—';
}

// ── Add / Edit Car Modal ────────────────────────────────────────
function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Add a Car';
  document.getElementById('btnSaveCar').textContent = 'Add Car';
  carForm.reset();
  carIdInput.value = '';
  carEmojiInput.value = '🚗';
  selectEmoji('🚗');
  openModal(carModal);
}

function openEditModal(id) {
  const car = getCar(id);
  if (!car) return;
  editingId = id;
  modalTitle.textContent = 'Edit Car';
  document.getElementById('btnSaveCar').textContent = 'Save Changes';

  carIdInput.value   = car.id;
  carYear.value      = car.year;
  carMake.value      = car.make;
  carModel.value     = car.model;
  carColor.value     = car.color   || '';
  carMileage.value   = car.mileage || '';
  carHp.value        = car.hp      || '';
  carNotes.value     = car.notes   || '';
  carEmojiInput.value = car.emoji  || '🚗';
  selectEmoji(car.emoji || '🚗');

  openModal(carModal);
}

function selectEmoji(emoji) {
  emojiPicker.querySelectorAll('span').forEach(el => {
    el.classList.toggle('selected', el.dataset.emoji === emoji);
  });
}

carForm.addEventListener('submit', e => {
  e.preventDefault();

  // Validate required fields
  let valid = true;
  [carYear, carMake, carModel].forEach(f => {
    f.classList.remove('error');
    if (!f.value.trim()) { f.classList.add('error'); valid = false; }
  });
  if (!valid) return;

  const data = {
    year:    parseInt(carYear.value, 10),
    make:    carMake.value.trim(),
    model:   carModel.value.trim(),
    color:   carColor.value.trim(),
    mileage: carMileage.value ? parseInt(carMileage.value, 10) : null,
    hp:      carHp.value ? parseInt(carHp.value, 10) : null,
    notes:   carNotes.value.trim(),
    emoji:   carEmojiInput.value || '🚗',
  };

  if (editingId) {
    const idx = cars.findIndex(c => c.id === editingId);
    if (idx !== -1) cars[idx] = { ...cars[idx], ...data };
  } else {
    cars.push({ id: uid(), addedAt: Date.now(), mods: [], ...data });
  }

  saveGarage(cars);
  closeModal(carModal);
  renderAll();
});

// Emoji picker interaction
emojiPicker.addEventListener('click', e => {
  const el = e.target.closest('[data-emoji]');
  if (!el) return;
  carEmojiInput.value = el.dataset.emoji;
  selectEmoji(el.dataset.emoji);
});

// ── Mods Modal ─────────────────────────────────────────────────
function openModsModal(id) {
  const car = getCar(id);
  if (!car) return;
  modsCarId = id;
  modsCarIdInput.value = id;
  modsModalTitle.textContent = `${car.year} ${car.make} ${car.model} — Modifications`;
  modNameInput.value  = '';
  modCostInput.value  = '';
  renderModsList(id);
  openModal(modsModal);
}

function renderModsList(id) {
  const car = getCar(id);
  if (!car) return;
  const mods = car.mods || [];
  modsList.innerHTML = '';

  if (mods.length === 0) {
    modsList.innerHTML = '<li style="color:var(--text-muted);font-size:.85rem;padding:.5rem 0">No mods yet — add your first one above.</li>';
  } else {
    mods.forEach(mod => {
      const li = document.createElement('li');
      li.className = 'mod-item';
      li.dataset.modId = mod.id;
      li.innerHTML = `
        <span class="mod-cat-badge">${escHtml(mod.category)}</span>
        <span class="mod-name">${escHtml(mod.name)}</span>
        ${mod.cost ? `<span class="mod-cost">${fmt$$(mod.cost)}</span>` : ''}
        <button class="mod-delete" data-mod-id="${mod.id}" title="Remove mod">✕</button>
      `;
      modsList.appendChild(li);
    });
  }

  const total = mods.reduce((s, m) => s + (Number(m.cost) || 0), 0);
  modsTotal.textContent = fmt$$(total);
}

document.getElementById('btnAddMod').addEventListener('click', () => {
  const name = modNameInput.value.trim();
  if (!name) { modNameInput.focus(); return; }

  const car = getCar(modsCarId);
  if (!car) return;

  if (!car.mods) car.mods = [];
  car.mods.push({
    id:       uid(),
    name,
    cost:     modCostInput.value ? parseFloat(modCostInput.value) : 0,
    category: modCategoryInput.value,
  });

  modNameInput.value = '';
  modCostInput.value = '';

  saveGarage(cars);
  renderModsList(modsCarId);
  renderAll();
});

modsList.addEventListener('click', e => {
  const btn = e.target.closest('.mod-delete');
  if (!btn) return;
  const modId = btn.dataset.modId;
  const car   = getCar(modsCarId);
  if (!car) return;
  car.mods = (car.mods || []).filter(m => m.id !== modId);
  saveGarage(cars);
  renderModsList(modsCarId);
  renderAll();
});

// ── Delete Modal ───────────────────────────────────────────────
function openDeleteModal(id) {
  const car = getCar(id);
  if (!car) return;
  deletingId = id;
  deleteMsg.textContent = `Remove "${car.year} ${car.make} ${car.model}" from your garage?`;
  openModal(deleteModal);
}

deleteConfirmBtn.addEventListener('click', () => {
  if (!deletingId) return;
  cars = cars.filter(c => c.id !== deletingId);
  saveGarage(cars);
  closeModal(deleteModal);
  deletingId = null;
  renderAll();
});

// ── Modal helpers ──────────────────────────────────────────────
function openModal(el)  { el.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(el) { el.classList.add('hidden');    document.body.style.overflow = ''; }

// Close buttons
document.getElementById('modalClose').addEventListener('click',       () => closeModal(carModal));
document.getElementById('modalCancel').addEventListener('click',      () => closeModal(carModal));
document.getElementById('modsModalClose').addEventListener('click',   () => closeModal(modsModal));
document.getElementById('deleteModalClose').addEventListener('click', () => closeModal(deleteModal));
document.getElementById('deleteCancelBtn').addEventListener('click',  () => closeModal(deleteModal));

// Close on overlay click
[carModal, modsModal, deleteModal].forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal);
  });
});

// ── Card action delegation ─────────────────────────────────────
garageGrid.addEventListener('click', e => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.classList.contains('btn-edit'))   openEditModal(id);
  if (btn.classList.contains('btn-delete')) openDeleteModal(id);
  if (btn.classList.contains('btn-mods'))   openModsModal(id);
});

// ── Header "Add Car" button ────────────────────────────────────
document.getElementById('btnAddCar').addEventListener('click', openAddModal);

// ── Search & Sort ──────────────────────────────────────────────
searchInput.addEventListener('input', renderAll);
sortSelect.addEventListener('change', renderAll);

// ── Keyboard shortcuts ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    [carModal, modsModal, deleteModal].forEach(m => {
      if (!m.classList.contains('hidden')) closeModal(m);
    });
  }
});

// ── Demo seed data (first visit only) ─────────────────────────
function seedDemo() {
  if (cars.length > 0) return;

  cars = [
    {
      id: uid(), addedAt: Date.now() - 8e8, emoji: '🏎️',
      year: 1993, make: 'Mazda', model: 'RX-7',
      color: 'Vintage Red', mileage: 72000, hp: 420,
      notes: 'Full FD build — BEGi S5 turbo, standalone ECU, widebody.',
      mods: [
        { id: uid(), name: 'BEGi S5 Single Turbo Kit', cost: 3800, category: 'engine' },
        { id: uid(), name: 'Link G4X ECU',             cost: 1200, category: 'electronics' },
        { id: uid(), name: 'Work Meister S1 18"',      cost: 2600, category: 'wheels' },
        { id: uid(), name: 'RE Amemiya Widebody Kit',  cost: 4200, category: 'aero' },
      ],
    },
    {
      id: uid(), addedAt: Date.now() - 4e8, emoji: '🚗',
      year: 2002, make: 'Subaru', model: 'Impreza WRX STI',
      color: 'WR Blue', mileage: 94000, hp: 380,
      notes: 'EJ257 built bottom end, TMIC, STI pink injectors.',
      mods: [
        { id: uid(), name: 'Perrin Top Mount Intercooler', cost: 900,  category: 'engine' },
        { id: uid(), name: 'Cosworth Pistons & Rods',      cost: 2100, category: 'engine' },
        { id: uid(), name: 'Nameless Catback Exhaust',     cost: 750,  category: 'exhaust' },
      ],
    },
    {
      id: uid(), addedAt: Date.now() - 1e8, emoji: '🚙',
      year: 2015, make: 'Volkswagen', model: 'Golf R',
      color: 'Deep Black Pearl', mileage: 42000, hp: 340,
      notes: 'Stage 2 tune, DSG flash, intake & downpipe.',
      mods: [
        { id: uid(), name: 'APR Stage 2 ECU Tune',       cost: 1100, category: 'electronics' },
        { id: uid(), name: 'APR DSG TCU Flash',          cost: 500,  category: 'electronics' },
        { id: uid(), name: 'CTS Turbo Cold Air Intake',  cost: 350,  category: 'engine' },
        { id: uid(), name: 'IE High Flow Downpipe',      cost: 620,  category: 'exhaust' },
        { id: uid(), name: 'KW V3 Coilovers',            cost: 1900, category: 'suspension' },
      ],
    },
  ];

  saveGarage(cars);
}

// ── Boot ───────────────────────────────────────────────────────
seedDemo();
renderAll();
