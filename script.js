/*
  NECS 2026 Main JavaScript
  honestly this took way longer than it should have
  todo: clean up the cart code later
  update: added music tabs functionality
  update 2: cart now persists (so checkout total doesn’t reset)
*/

// ==============================
// Small helpers
// ==============================
const CART_KEY = 'necs_cart'; // keep your original key so nothing breaks

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

function formatMoney(n) {
  const num = Number(n || 0);
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// toast helper (KEEP yours)
const toast = document.getElementById('toast');
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==============================
// nav scroll (KEEP)
// ==============================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ==============================
// countdown timer (KEEP)
// ==============================
const eventDate = new Date('May 6, 2026 10:00:00 CDT').getTime();

function updateCountdown() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const now = Date.now();
  const diff = Math.max(0, eventDate - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ==============================
// cart system (UPGRADED, but same UI behavior)
// ==============================
const tickets = {
  day:  { name: 'Day Pass',        price: 45,  desc: 'Single day general admission' },
  full: { name: 'Full Event Pass', price: 149, desc: 'All 5 days with priority seating' },
  vip:  { name: 'VIP Experience',  price: 399, desc: 'Premium access with exclusive perks' }
};

// cart is still an object like before: { day: 2, vip: 1 }
let cart = safeParse(localStorage.getItem(CART_KEY), {}) || {};

// elements (home page)
const cartBtn = document.getElementById('cartBtn');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const cartClose = document.getElementById('cartClose');
const cartBody = document.getElementById('cartBody');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function calcCartTotals() {
  let count = 0;
  let total = 0;

  for (const id in cart) {
    const qty = Number(cart[id] || 0);
    if (qty > 0 && tickets[id]) {
      count += qty;
      total += tickets[id].price * qty;
    }
  }

  return { count, total };
}

function openCart() {
  if (!cartOverlay || !cartDrawer) return;
  cartOverlay.classList.add('open');
  cartDrawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  if (!cartOverlay || !cartDrawer) return;
  cartOverlay.classList.remove('open');
  cartDrawer.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCart() {
  // If you’re not on index page, just stop (prevents errors on checkout/game pages)
  if (!cartBody || !cartCount || !cartTotal) return;

  const { count, total } = calcCartTotals();
  cartCount.textContent = count;
  cartTotal.textContent = formatMoney(total);

  const items = Object.entries(cart).filter(([id, qty]) => Number(qty) > 0 && tickets[id]);

  if (items.length === 0) {
    cartBody.innerHTML =
      '<div class="cart-empty"><p><strong>Your cart is empty</strong></p><p style="font-size:13px;margin-top:8px">Add tickets to get started</p></div>';
    return;
  }

  cartBody.innerHTML = items.map(([id, qty]) => {
    const ticket = tickets[id];
    const line = ticket.price * qty;

    return (
      '<div class="cart-item">' +
        '<div class="cart-item-header">' +
          '<span class="cart-item-name">' + ticket.name + '</span>' +
          '<span class="cart-item-price">' + formatMoney(line) + '</span>' +
        '</div>' +
        '<div class="cart-item-desc">' + ticket.desc + '</div>' +
        '<div class="cart-item-controls">' +
          '<div class="qty-controls">' +
            '<button class="qty-btn" data-action="dec" data-id="' + id + '">-</button>' +
            '<span class="qty-value">' + qty + '</span>' +
            '<button class="qty-btn" data-action="inc" data-id="' + id + '">+</button>' +
          '</div>' +
          '<button class="remove-btn" data-action="remove" data-id="' + id + '">Remove</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  cartBody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (!tickets[id]) return;

      if (action === 'inc') cart[id] = (cart[id] || 0) + 1;
      else if (action === 'dec' && cart[id] > 1) cart[id]--;
      else if (action === 'remove') delete cart[id];

      saveCart();
      renderCart();
    });
  });
}

// open/close listeners (only if elements exist)
cartBtn?.addEventListener('click', openCart);
cartOverlay?.addEventListener('click', closeCart);
cartClose?.addEventListener('click', closeCart);

document.querySelectorAll('[data-ticket]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.ticket;
    if (!tickets[id]) return;

    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    showToast(tickets[id].name + ' added to cart');
    openCart();
  });
});

checkoutBtn?.addEventListener('click', () => {
  const items = Object.entries(cart).filter(([id, qty]) => Number(qty) > 0 && tickets[id]);

  if (!items.length) {
    showToast('Your cart is empty');
    return;
  }

  // Save cart data for checkout page (already in localStorage, but keep this for safety)
  saveCart();

  window.location.href = 'checkout.html';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCart();
});

renderCart();

// ==============================
// event modal (KEEP)
// ==============================
const eventModal = document.getElementById('eventModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalTime = document.getElementById('modalTime');
const modalStage = document.getElementById('modalStage');
const modalNotify = document.getElementById('modalNotify');

document.querySelectorAll('.schedule-event').forEach(event => {
  event.addEventListener('click', () => {
    if (!eventModal || !modalTitle || !modalTime || !modalStage) return;

    const eventName = event.dataset.event;
    const time = event.dataset.time;
    const stage = event.dataset.stage;

    modalTitle.textContent = eventName;
    modalTime.textContent = time;
    modalStage.textContent = stage;
    eventModal.classList.add('open');
  });
});

modalClose?.addEventListener('click', () => {
  eventModal?.classList.remove('open');
});

eventModal?.addEventListener('click', (e) => {
  if (e.target === eventModal) eventModal.classList.remove('open');
});

modalNotify?.addEventListener('click', () => {
  eventModal?.classList.remove('open');
  showToast('Reminder set for this event');
});

// ==============================
// game card clicks -> game details page (KEEP)
// ==============================
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const g = card.dataset.game;
    if (!g) return;
    window.location.href = 'game.html?g=' + encodeURIComponent(g);
  });
});

// ==============================
// team card clicks (KEEP)
// ==============================
document.querySelectorAll('.team-card').forEach(card => {
  card.addEventListener('click', () => {
    const teamName = card.querySelector('h3')?.textContent || 'team';
    showToast('Viewing ' + teamName + ' roster');
  });
});

// ==============================
// music tabs (KEEP)
// ==============================
const musicTabs = document.querySelectorAll('.music-tab');
const musicLists = document.querySelectorAll('.music-list');

musicTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = tab.dataset.tab;

    musicTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    musicLists.forEach(list => {
      list.classList.remove('active');
      if (list.id === targetId) list.classList.add('active');
    });
  });
});

// song clicks (KEEP)
document.querySelectorAll('.song-item').forEach(item => {
  item.addEventListener('click', () => {
    const title = item.querySelector('.song-title')?.textContent || 'song';
    showToast('Playing: ' + title);
  });
});

// mobile menu (KEEP)
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
mobileMenuBtn?.addEventListener('click', () => {
  showToast('Use the links below to navigate');
});

// ==============================
// ===== Checkout Page Init (UPGRADED) =====
// ==============================
(function initCheckout() {
  const summary = document.getElementById('summary');
  const totalEl = document.getElementById('total');
  const payTotalEl = document.getElementById('payTotal'); // from the upgraded checkout.html
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const dayChoice = document.getElementById('dayChoice');
  const payBtn = document.getElementById('payBtn');
  const clearBtn = document.getElementById('clearBtn');

  // payment fields (new)
  const cardNumber = document.getElementById('cardNumber');
  const cardExp = document.getElementById('cardExp');
  const cardCvc = document.getElementById('cardCvc');
  const cardZip = document.getElementById('cardZip');

  if (!summary || !totalEl || !payBtn) return; // not on checkout.html

  const stored = safeParse(localStorage.getItem(CART_KEY) || '{}', {});
  let total = 0;

  const rows = Object.entries(stored)
    .filter(([id, qty]) => Number(qty) > 0 && tickets[id])
    .map(([id, qty]) => {
      const line = tickets[id].price * Number(qty);
      total += line;
      return `<div class="summary-row"><span>${tickets[id].name} × ${qty}</span><strong>${formatMoney(line)}</strong></div>`;
    });

  summary.innerHTML = rows.length
    ? rows.join('')
    : '<div class="muted">Cart is empty. Go back and add tickets.</div>';

  totalEl.textContent = formatMoney(total);
  if (payTotalEl) payTotalEl.textContent = formatMoney(total);

  // simple input formatting so it feels real
  function onlyDigits(s) { return (s || '').replace(/\D/g, ''); }
  function fmtCard(v) { return onlyDigits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); }
  function fmtExp(v) {
    const d = onlyDigits(v).slice(0, 4);
    if (d.length <= 2) return d;
    return d.slice(0, 2) + '/' + d.slice(2);
  }
  function fmtCvc(v) { return onlyDigits(v).slice(0, 4); }
  function fmtZip(v) { return onlyDigits(v).slice(0, 10); }

  cardNumber?.addEventListener('input', e => e.target.value = fmtCard(e.target.value));
  cardExp?.addEventListener('input', e => e.target.value = fmtExp(e.target.value));
  cardCvc?.addEventListener('input', e => e.target.value = fmtCvc(e.target.value));
  cardZip?.addEventListener('input', e => e.target.value = fmtZip(e.target.value));

  clearBtn?.addEventListener('click', () => {
    localStorage.removeItem(CART_KEY);
    cart = {};
    showToast('Cart cleared');
    setTimeout(() => window.location.href = 'index.html#tickets', 650);
  });

  payBtn.addEventListener('click', () => {
    if (!rows.length) return showToast('Cart is empty');

    const name = (nameEl?.value || '').trim();
    const email = (emailEl?.value || '').trim();

    if (name.length < 2) return showToast('Enter your name');
    if (!email.includes('@')) return showToast('Enter a valid email');

    // payment required (demo validation)
    const cn = (cardNumber?.value || '').replace(/\s/g, '');
    const exp = (cardExp?.value || '').trim();
    const cvc = (cardCvc?.value || '').trim();
    const zip = (cardZip?.value || '').trim();

    if (cn.length < 13) return showToast('Enter a valid card number');
    if (exp.length < 4) return showToast('Enter expiry (MM/YY)');
    if (cvc.length < 3) return showToast('Enter CVC');
    if (zip.length < 5) return showToast('Enter billing ZIP');

    const payload = {
      name,
      email,
      dayChoice: dayChoice?.value || '',
      cart: stored,
      total,
      createdAt: Date.now(),
      orderId: 'NECS-' + Math.random().toString(16).slice(2, 10).toUpperCase()
    };

    localStorage.setItem('necs_ticket_payload', JSON.stringify(payload));

    // clear cart after purchase
    localStorage.removeItem(CART_KEY);
    cart = {};

    window.location.href = 'confirmation.html';
  });
})();

// ==============================
// ===== Game Page Init (KEEP) =====
// ==============================
(function initGamePage() {
  const gTitle = document.getElementById('gTitle');
  const gSub = document.getElementById('gSub');
  const gImg = document.getElementById('gImg');
  const gFacts = document.getElementById('gFacts');
  const gAbout = document.getElementById('gAbout');
  const followBtn = document.getElementById('followBtn');

  if (!gTitle || !gImg || !gFacts || !gAbout || !followBtn) return;

  const params = new URLSearchParams(location.search);
  const g = (params.get('g') || '').toLowerCase();

  const data = {
    valorant: {
      title: 'Valorant Champions',
      sub: '5v5 tactical showdown • main stage energy',
      img: 'images/img-1-f1a1305d46.png',
      facts: [['Teams', '16'], ['Prize', '$200,000'], ['Style', 'Best-of series'], ['Stage', 'Main Arena']],
      about: `Expect clutch rounds, loud crowds, and a broadcast-style experience. If you're new, watch the first map — you'll pick up the rhythm fast.`
    },
    rocket: {
      title: 'RLCS Championship',
      sub: 'Fast matches • aerial plays • nonstop momentum swings',
      img: 'images/img-2-828f7bcd7e.png',
      facts: [['Teams', '12'], ['Prize', '$150,000'], ['Style', 'Best-of series'], ['Stage', 'Arena / Featured']],
      about: `Rocket League is the "easy to understand, hard to master" bracket. Matches move fast, so check the schedule to catch your favorite teams.`
    },
    smash: {
      title: 'SSBU Invitational',
      sub: '64-player bracket • character variety • crowd reactions go crazy',
      img: 'images/img-3-fcdd53f857.png',
      facts: [['Players', '64'], ['Prize', '$150,000'], ['Format', 'Pools → Top Cut'], ['Stage', 'Featured Stage']],
      about: `Expect hype moments, surprise picks, and brutal upsets. Even early sets can be legendary.`
    }
  };

  const info = data[g];
  if (!info) {
    gTitle.textContent = 'Game not found';
    gSub.textContent = 'Go back and choose a game.';
    gImg.alt = '';
    gImg.src = '';
    gFacts.innerHTML = `<li><span>Tip</span><strong>Try ?g=valorant</strong></li>`;
    gAbout.textContent = '';
    followBtn.style.display = 'none';
    return;
  }

  gTitle.textContent = info.title;
  gSub.textContent = info.sub;
  gImg.src = info.img;
  gImg.alt = info.title;

  gFacts.innerHTML = info.facts
    .map(([k, v]) => `<li><span>${k}</span><strong>${v}</strong></li>`)
    .join('');

  gAbout.textContent = info.about;

  followBtn.addEventListener('click', () => {
    const saved = safeParse(localStorage.getItem('necs_followed_games') || '[]', []);
    if (!saved.includes(g)) saved.push(g);
    localStorage.setItem('necs_followed_games', JSON.stringify(saved));
    showToast('Following: ' + info.title);
  });
})();
// ===== Confirmation Page Init (NO canvas / no QR) =====
(function initConfirmation() {
  const cName = document.getElementById('cName');
  const cEmail = document.getElementById('cEmail');
  const cOrder = document.getElementById('cOrder');
  const cTotal = document.getElementById('cTotal');
  const cTickets = document.getElementById('cTickets');

  if (!cName || !cEmail || !cOrder || !cTotal || !cTickets) return;

  const payload = safeParse(localStorage.getItem('necs_ticket_payload') || '{}', {});
  if (!payload.name) {
    showToast('Missing confirmation info');
    setTimeout(() => (location.href = 'index.html#tickets'), 800);
    return;
  }

  cName.textContent = payload.name || '—';
  cEmail.textContent = payload.email || '—';
  cOrder.textContent = payload.orderId || '—';
  cTotal.textContent = formatMoney(payload.total || 0);

  const cart = payload.cart || {};
  const rows = Object.entries(cart)
    .filter(([id, qty]) => Number(qty) > 0 && tickets[id])
    .map(([id, qty]) => {
      const line = tickets[id].price * Number(qty);
      return `<div class="summary-row"><span>${tickets[id].name} × ${qty}</span><strong>${formatMoney(line)}</strong></div>`;
    });

  cTickets.innerHTML = rows.length ? rows.join('') : '<div class="muted">No tickets found.</div>';
})();
