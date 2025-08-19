// Utility: clamp
const clamp = (min, val, max) => Math.min(max, Math.max(min, val));

/** Phase label helper (8 principal phases) */
function phaseLabel(d) {
  // Use true 0..29 for labeling so 0 and 29 both read "New Moon"
  const day = clamp(0, Math.round(Number(d)), 29);
  if (day === 0 || day === 29) return "New Moon";
  if (day < 7) return "Waxing Crescent";
  if (day === 7) return "First Quarter";
  if (day < 14) return "Waxing Gibbous";
  if (day === 14) return "Full Moon";
  if (day < 21) return "Waning Gibbous";
  if (day === 21) return "Third Quarter";
  return "Waning Crescent";
}

// Map phase index (0..29) to accent gradient (aesthetic only)
function accentForDay(d) {
  const t = Number(d) / 29;
  const hue1 = 230 + 70 * t; // blue->purple
  const hue2 = 280 + 40 * (1 - t); // purple->orchid
  const c1 = `hsl(${hue1.toFixed(1)} 100% 75%)`;
  const c2 = `hsl(${hue2.toFixed(1)} 80% 78%)`;
  document.documentElement.style.setProperty("--accent", c1);
  document.documentElement.style.setProperty("--accent-2", c2);
}

/**
 * Move the shadow orb horizontally to simulate phase correctly.
 */
function setMoonPhase(day) {
  const shadow = document.getElementById("shadowOrb");
  const nameEl = document.getElementById("phaseName");
  if (!shadow || !nameEl) return;

  const d = clamp(0, Number(day), 29);
  const f = d / 29;
  const R = 72;

  let x;
  if (f <= 0.5) {
    x = R * (Math.cos(2 * Math.PI * f) - 1);
  } else {
    x = R * (1 - Math.cos(2 * Math.PI * f));
  }

  shadow.style.transform = `translateX(${x.toFixed(2)}px)`;
  nameEl.textContent = phaseLabel(d);
  accentForDay(d);
}

// Theme toggle
const toggle = document.getElementById("themeToggle");
function updateThemeButtonColors() {
  const root = document.documentElement;
  const isLight = root.classList.contains("light");
  if (toggle) toggle.style.color = isLight ? "black" : "white";
  const cartBtn = document.getElementById("cartButton");
  if (cartBtn) cartBtn.style.color = isLight ? "black" : "white";
}
toggle?.addEventListener("click", () => {
  const root = document.documentElement;
  root.classList.toggle("light");
  localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
  updateThemeButtonColors();
});

// Initialize once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Theme from storage
  const t = localStorage.getItem("theme");
  if (t === "light") document.documentElement.classList.add("light");
  updateThemeButtonColors();

  // Randomize initial moon day (1..29), never 0
  const slider = document.getElementById("phaseSlider");
  if (slider){
    const r = 1 + Math.floor(Math.random() * 29); // 1..29
    slider.value = String(r);
    setMoonPhase(r);
    slider.addEventListener("input", (e) => setMoonPhase(e.target.value));
  }

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

// Cart / "Ritual" micro-cart (drawer)
const cart = [];
const cartList = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("cartOverlay");
const openCartBtn = document.getElementById("cartButton");
const closeCartBtn = document.getElementById("closeCart");

function openCart(){
  drawer.classList.add("open");
  overlay.hidden = false;
}
function closeCart(){
  drawer.classList.remove("open");
  overlay.hidden = true;
}
openCartBtn?.addEventListener("click", openCart);
closeCartBtn?.addEventListener("click", closeCart);
overlay?.addEventListener("click", closeCart);

// Phase bundle details map (used in expandable cart rows)
const PHASE_DETAILS = {
  "New Moon": [
    "Cuticle Oil after shower",
    "Body Butter on damp skin",
    "Journal one intention"
  ],
  "Waxing": [
    "Lip Balm throughout the day",
    "Body Butter elbows/knees",
    "Light Moon Candle: focus blend"
  ],
  "Full Moon": [
    "Oil revitalization for cuticles",
    "Body Butter with sensual feeling",
    "Candle: luminous blend"
  ],
  "Waning": [
    "Rich layer of balm before bed",
    "Steam + Candle: unwind blend",
    "Gratitude note"
  ]
};

function renderCart() {
  cartList.innerHTML = "";
  let totalQty = 0;
  if (cart.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Add products to craft your ritual.";
    li.style.opacity = "0.7";
    cartList.appendChild(li);
  } else {
    cart.forEach((item, i) => {
      totalQty += item.qty;
      const isPhase = !!PHASE_DETAILS[item.name];
      const li = document.createElement("li");
      li.className = "cart-item";
      li.dataset.index = String(i);
      li.innerHTML = `
        <span class="dot" style="background: var(--accent-2)"></span>
        <span>${item.name}</span>
        <div style="display:flex; gap:6px; align-items:center;">
          ${isPhase ? '<button class="expand" aria-label="Show details" aria-expanded="false">i</button>' : ''}
          <button aria-label="Decrease" data-act="dec">−</button>
          <span aria-live="polite">${item.qty}</span>
          <button aria-label="Increase" data-act="inc">+</button>
          <button aria-label="Remove" data-act="rem">✕</button>
        </div>
        ${isPhase ? `<div class="details" hidden>
            <ul>${PHASE_DETAILS[item.name].map(x=>`<li>${x}</li>`).join("")}</ul>
          </div>` : ""}
      `;
      cartList.appendChild(li);
    });
  }
  cartCount.textContent = String(totalQty);
}
renderCart();

// Event delegation for product Add buttons (robust even if markup changes)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".product-card .add");
  if (!btn) return;
  const card = btn.closest(".product-card");
  const name = card.querySelector("h3")?.textContent?.trim();
  if (!name) return;
  const existing = cart.find(x => x.name === name);
  if (existing) existing.qty += 1; else cart.push({ name, qty: 1 });
  renderCart();
  openCart();
  card.animate([
    { transform: "scale(1)", filter: "brightness(1)" },
    { transform: "scale(1.02)", filter: "brightness(1.3)" },
    { transform: "scale(1)", filter: "brightness(1)" }
  ], { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" });
}, { passive: true });

// Ritual presets ("Claim phase")
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".use-ritual");
  if (!btn) return;
  const phaseKey = btn.closest(".ritual-card")?.dataset.phase;
  const phaseMap = { new: "New Moon", waxing: "Waxing", full: "Full Moon", waning: "Waning" };
  const name = phaseMap[phaseKey] || "Phase";
  const existing = cart.find(x => x.name === name);
  if (existing) existing.qty += 1; else cart.push({ name, qty: 1 });
  renderCart();
  openCart();
  const phaseTarget = { new: 1, waxing: 7, full: 14, waning: 21 }[phaseKey] ?? 14;
  const slider = document.getElementById("phaseSlider");
  if (slider){ slider.value = phaseTarget; setMoonPhase(phaseTarget); }
}, { passive: true });

// Cart list clicks: inc/dec/rem + expand details
cartList?.addEventListener("click", (e) => {
  const target = e.target;
  const li = target.closest(".cart-item");
  if (!li) return;
  const i = Number(li.dataset.index);
  if (target.classList.contains("expand")){
    const panel = li.querySelector(".details");
    const expanded = target.getAttribute("aria-expanded") === "true";
    target.setAttribute("aria-expanded", String(!expanded));
    if (panel){
      if (expanded){ panel.classList.remove("open"); panel.hidden = true; }
      else { panel.hidden = false; panel.classList.add("open"); }
    }
    return;
  }
  if (target.tagName !== "BUTTON") return;
  const act = target.dataset.act;
  if (act === "inc") cart[i].qty += 1;
  if (act === "dec") cart[i].qty = Math.max(1, cart[i].qty - 1);
  if (act === "rem") cart.splice(i, 1);
  renderCart();
});

document.getElementById("clearCart")?.addEventListener("click", () => {
  cart.splice(0, cart.length);
  renderCart();
});

// Shopify cart redirect (dedicated page)
// IMPORTANT: Replace SHOPIFY.domain and each VARIANT_ID_* with your real values.
const SHOPIFY = {
  domain: '0rd0wb-79.myshopify.com', // <-- your .myshopify.com domain
  variants: {
    'Cuticle Oil': '7715725574253',
    'Whipped Body Butter': 'VARIANT_ID_2',
    'Lip Balm': 'VARIANT_ID_3',
    'Moon Candle': 'VARIANT_ID_4',
    // Optional: map phase bundles if they are real products
    'New Moon': 'VARIANT_ID_NEW',
    'Waxing': 'VARIANT_ID_WAX',
    'Full Moon': 'VARIANT_ID_FULL',
    'Waning': 'VARIANT_ID_WAN'
  }
};

document.getElementById("checkoutBtn")?.addEventListener("click", () => {
  const pairs = [];
  for (const item of cart){
    const vid = SHOPIFY.variants[item.name];
    if (vid) pairs.push(`${encodeURIComponent(vid)}:${encodeURIComponent(item.qty)}`);
  }
  if (pairs.length === 0){
    alert("Your ritual is empty or items aren’t mapped to Shopify yet.");
    return;
  }
  // Build a dedicated Shopify cart URL (no popout)
  const url = `https://${SHOPIFY.domain}/cart/${pairs.join(",")}`;
  window.location.href = url;
});

// Pixie dust cursor trail
(function(){
  const layer = document.getElementById('sparkleLayer');
  if (!layer) return;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) return;

  let lastTime = 0;
  const minDelay = 40;
  const maxAge = 900;
  const drift = 24;
  function rand(min, max){ return Math.random() * (max - min) + min; }

  function makeSparkle(x, y){
    const s = document.createElement('span');
    s.className = 'sparkle';
    const size = rand(2, 5);
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    const hues = [
      'rgba(255,255,255,0.95)',
      'rgba(255,245,225,0.9)',
      'rgba(210,190,255,0.95)'
    ];
    s.style.color = hues[(Math.random()*hues.length)|0];
    s.style.left = (x - size/2) + 'px';
    s.style.top  = (y - size/2) + 'px';
    layer.appendChild(s);
    const dx = rand(-drift, drift);
    const dy = rand(-drift, drift);
    const rot = rand(-40, 40);
    s.animate(
      [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 0.9 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${rand(0.6, 1.2)})`, opacity: 0 }
      ], { duration: maxAge + rand(-200, 250), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
    ).addEventListener('finish', () => s.remove());
  }

  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastTime < minDelay) return;
    lastTime = now;
    const x = e.clientX, y = e.clientY;
    const count = Math.random() < 0.25 ? 2 : 1;
    for (let i=0;i<count;i++){
      makeSparkle(x + rand(-2, 2), y + rand(-2, 2));
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) layer.innerHTML = '';
  });
})();
