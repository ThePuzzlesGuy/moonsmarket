// Utility: clamp
const clamp = (min, val, max) => Math.min(max, Math.max(min, val));

/** Phase label helper (8 principal phases) */
function phaseLabel(d) {
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
  toggle.style.color = isLight ? "black" : "white";
  document.getElementById("cartButton").style.color = isLight ? "black" : "white";
}
toggle?.addEventListener("click", () => {
  const root = document.documentElement;
  root.classList.toggle("light");
  localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
  updateThemeButtonColors();
});

// Initialize theme from storage
(function(){
  const t = localStorage.getItem("theme");
  if (t === "light") document.documentElement.classList.add("light");
  updateThemeButtonColors();
})();

// Initialize moon slider (random start, skipping New Moon)
// Day range is 0..29; pick 1..29 to avoid bland 'New Moon' starting look.
const slider = document.getElementById("phaseSlider");
if (slider){
  const randomStart = Math.floor(Math.random() * 29) + 1; // 1..29
  slider.value = String(randomStart);
  setMoonPhase(randomStart);
  slider.addEventListener("input", (e) => setMoonPhase(e.target.value));
} else {
  // Fallback in case slider isn't present for some reason
  setMoonPhase(14);
}

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
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span class="dot" style="background: var(--accent)"></span>
        <span>${item.name}</span>
        <div style="display:flex; gap:6px; align-items:center;">
          <button aria-label="Decrease" data-i="${i}" data-act="dec">−</button>
          <span aria-live="polite">${item.qty}</span>
          <button aria-label="Increase" data-i="${i}" data-act="inc">+</button>
          <button aria-label="Remove" data-i="${i}" data-act="rem">✕</button>
        </div>
      `;
      cartList.appendChild(li);
    });
  }
  cartCount.textContent = String(totalQty);
}
renderCart();

document.querySelectorAll(".product-card .add").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.currentTarget.closest(".product-card");
    const name = card.querySelector("h3").textContent.trim();
    const existing = cart.find(x => x.name === name);
    if (existing) existing.qty += 1; else cart.push({ name, qty: 1 });
    renderCart();
    openCart();
    card.animate([
      { transform: "scale(1)", filter: "brightness(1)" },
      { transform: "scale(1.02)", filter: "brightness(1.3)" },
      { transform: "scale(1)", filter: "brightness(1)" }
    ], { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" });
  });
});

cartList?.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName !== "BUTTON") return;
  const i = Number(target.dataset.i);
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

document.getElementById("checkoutBtn")?.addEventListener("click", () => {
  alert("Netlify functions or a shop platform can plug in here.\nFor now, your ritual is ready ✨");
});

// Ritual presets
document.querySelectorAll(".use-ritual").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const phaseKey = e.currentTarget.closest(".ritual-card").dataset.phase;
    const phaseMap = { new: "New Moon", waxing: "Waxing", full: "Full Moon", waning: "Waning" };
    const name = phaseMap[phaseKey] || "Phase";
    const existing = cart.find(x => x.name === name);
    if (existing) existing.qty += 1; else cart.push({ name, qty: 1 });
    renderCart();
    openCart();
    const phaseTarget = { new: 0, waxing: 7, full: 14, waning: 21 }[phaseKey] ?? 0;
    if (slider){ slider.value = phaseTarget; setMoonPhase(phaseTarget); }
  });
});

// Ingredient chips
const chipNote = document.getElementById("chipNote");
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("mouseenter", () => { chipNote.textContent = chip.dataset.note; });
  chip.addEventListener("mouseleave", () => { chipNote.textContent = ""; });
  chip.addEventListener("click", () => { chipNote.textContent = chip.dataset.note; });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Easter egg: press "M" and everything floats away
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    const els = document.querySelectorAll("body *:not(script):not(style)");
    els.forEach(el => {
      el.style.transition = "transform 15s linear, opacity 15s linear";
      const dx = (Math.random() - 0.5) * 2000;
      const dy = (Math.random() - 0.5) * 2000;
      const rot = (Math.random() - 0.5) * 720;
      setTimeout(() => {
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
        el.style.opacity = "0";
      }, 50);
    });
  }
});


/* === Pixie Dust Cursor Trail === */
(function(){
  const layer = document.getElementById('sparkleLayer');
  if (!layer) return;

  // Respect reduced motion
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) return;

  let lastTime = 0;
  const minDelay = 40; // ms between sparkles -> sparse
  const maxAge = 900;  // lifetime of each sparkle
  const drift = 24;    // px drift radius

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function makeSparkle(x, y){
    const s = document.createElement('span');
    s.className = 'sparkle';

    // small random size for airy look
    const size = rand(2, 5);
    s.style.width = size + 'px';
    s.style.height = size + 'px';

    // lavender/cream/white palette with slight variance
    const hues = [
      'rgba(255,255,255,0.95)',
      'rgba(255,245,225,0.9)',
      'rgba(210,190,255,0.95)'
    ];
    s.style.color = hues[(Math.random()*hues.length)|0];

    // initial position
    s.style.left = (x - size/2) + 'px';
    s.style.top  = (y - size/2) + 'px';

    layer.appendChild(s);

    // random drift + fade with WAAPI for performance
    const dx = rand(-drift, drift);
    const dy = rand(-drift, drift);
    const rot = rand(-40, 40);

    s.animate(
      [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 0.9 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${rand(0.6, 1.2)})`, opacity: 0 }
      ],
      {
        duration: maxAge + rand(-200, 250),
        easing: 'cubic-bezier(.2,.7,.2,1)',
        fill: 'forwards'
      }
    ).addEventListener('finish', () => s.remove());
  }

  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastTime < minDelay) return;
    lastTime = now;

    const x = e.clientX;
    const y = e.clientY;

    const count = Math.random() < 0.25 ? 2 : 1;
    for (let i=0;i<count;i++){
      makeSparkle(x + rand(-2, 2), y + rand(-2, 2));
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) layer.innerHTML = '';
  });
})();
// Delegated handler for product add (robust to markup changes)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".product-card .add");
  if (!btn) return;
  const card = btn.closest(".product-card");
  const name = card.querySelector("h3").textContent.trim();
  const existing = cart.find(x => x.name === name);
  if (existing) existing.qty += 1; else cart.push({ name, qty: 1 });
  renderCart();
  openCart();
  card.animate([
    { transform: "scale(1)", filter: "brightness(1)" },
    { transform: "scale(1.02)", filter: "brightness(1.3)" },
    { transform: "scale(1)", filter: "brightness(1)" }
  ], { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" });
});
