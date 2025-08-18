// script.js — Moons Market (updated)

// ------------------------------
// Utility
// ------------------------------
const clamp = (min, val, max) => Math.min(max, Math.max(min, val));

// ------------------------------
// Lunar phase helpers
// ------------------------------
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
 * Geometry notes:
 * - New Moon: shadow disc centered (x = 0) fully covers the lit disc => invisible.
 * - Full Moon: shadow disc moves completely off to the SIDE (|x| = 2R) => fully visible.
 * - First Quarter: x = -R (lit on RIGHT).
 * - Third Quarter: x = +R (lit on LEFT).
 */
function setMoonPhase(day) {
  const shadow = document.getElementById("shadowOrb");
  const nameEl = document.getElementById("phaseName");
  if (!shadow || !nameEl) return;

  const d = clamp(0, Number(day), 29);
  const f = d / 29; // normalized 0..1 across the synodic month
  const R = 72;     // circle radius used in the SVG

  let x;
  if (f <= 0.5) {
    // Waxing: light grows on RIGHT -> move shadow LEFT (negative)
    x = R * (Math.cos(2 * Math.PI * f) - 1); // 0 -> -2R
  } else {
    // Waning: light remains on LEFT -> move shadow RIGHT (positive)
    x = R * (1 - Math.cos(2 * Math.PI * f)); // +2R -> 0
  }

  shadow.style.transform = `translateX(${x.toFixed(2)}px)`;
  nameEl.textContent = phaseLabel(d);
  accentForDay(d);
}

// Initialize theme from storage immediately (avoid flash)
(() => {
  const t = localStorage.getItem("theme");
  if (t === "light") document.documentElement.classList.add("light");
})();

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------
  // Theme toggle
  // ------------------------------
  const themeToggle = document.getElementById("themeToggle");
  themeToggle?.addEventListener("click", () => {
    const root = document.documentElement;
    root.classList.toggle("light");
    localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
  });

  // ------------------------------
  // Moon slider
  // ------------------------------
  const slider = document.getElementById("phaseSlider");
  if (slider) {
    slider.addEventListener("input", (e) => setMoonPhase(e.target.value));
    setMoonPhase(slider.value || 0);
  } else {
    setMoonPhase(0);
  }

  // ------------------------------
  // Cart / Drawer
  // ------------------------------
  const cart = [];
  const cartList = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  const openCartBtn = document.getElementById("cartButton");
  const closeCartBtn = document.getElementById("closeCart");
  const clearCartBtn = document.getElementById("clearCart");
  const checkoutBtn = document.getElementById("checkoutBtn");

  function openCart() {
    drawer?.classList.add("show");
    overlay?.classList.add("show");
  }
  function closeCart() {
    drawer?.classList.remove("show");
    overlay?.classList.remove("show");
  }

  openCartBtn?.addEventListener("click", openCart);
  closeCartBtn?.addEventListener("click", closeCart);
  overlay?.addEventListener("click", closeCart);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  function renderCart() {
    if (!cartList || !cartCount) return;
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
          <span class="name">${item.name}</span>
          <div class="qty-controls" style="display:flex; gap:6px; align-items:center;">
            <button class="qty-btn" aria-label="Decrease" data-i="${i}" data-act="dec">−</button>
            <span aria-live="polite">${item.qty}</span>
            <button class="qty-btn" aria-label="Increase" data-i="${i}" data-act="inc">+</button>
            <button class="qty-btn" aria-label="Remove" data-i="${i}" data-act="rem">✕</button>
          </div>
        `;
        cartList.appendChild(li);
      });
    }
    cartCount.textContent = String(totalQty);
    cartCount.toggleAttribute("hidden", totalQty === 0);
  }

  renderCart();

  // Product "Add to Ritual" buttons
  document.querySelectorAll(".product-card .add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".product-card");
      const nameEl = card?.querySelector("h3");
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      const existing = cart.find((x) => x.name === name);
      if (existing) existing.qty += 1;
      else cart.push({ name, qty: 1 });
      renderCart();
      openCart();

      // Subtle feedback
      card?.animate(
        [
          { transform: "scale(1)", filter: "brightness(1)" },
          { transform: "scale(1.02)", filter: "brightness(1.3)" },
          { transform: "scale(1)", filter: "brightness(1)" },
        ],
        { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" }
      );
    });
  });

  // Delegated controls for cart items
  cartList?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName !== "BUTTON") return;
    const i = Number(target.dataset.i);
    const act = target.dataset.act;
    if (Number.isNaN(i) || !cart[i]) return;
    if (act === "inc") cart[i].qty += 1;
    if (act === "dec") cart[i].qty = Math.max(1, cart[i].qty - 1);
    if (act === "rem") cart.splice(i, 1);
    renderCart();
  });

  clearCartBtn?.addEventListener("click", () => {
    cart.splice(0, cart.length);
    renderCart();
  });

  checkoutBtn?.addEventListener("click", () => {
    alert("Netlify functions or a shop platform can plug in here.\nFor now, your ritual is ready ✨");
  });

  // Ritual presets -> add PHASE as a single cart line item (not individual products)
  document.querySelectorAll(".use-ritual").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const phaseKey = e.currentTarget.closest(".ritual-card")?.dataset.phase;
      const phaseMap = { new: "New Moon", waxing: "Waxing", full: "Full Moon", waning: "Waning" };
      const name = phaseMap[phaseKey] || "Phase";
      const existing = cart.find((x) => x.name === name);
      if (existing) existing.qty += 1;
      else cart.push({ name, qty: 1 });
      renderCart();
      openCart();

      // Nudge slider to a representative day
      const phaseTarget = { new: 0, waxing: 7, full: 14, waning: 21 }[phaseKey] ?? 0;
      if (slider) {
        slider.value = phaseTarget;
        setMoonPhase(phaseTarget);
      }
    });
  });

  // ------------------------------
  // Ingredient chips
  // ------------------------------
  const chipNote = document.getElementById("chipNote");
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("mouseenter", () => { if (chipNote) chipNote.textContent = chip.dataset.note || ""; });
    chip.addEventListener("mouseleave", () => { if (chipNote) chipNote.textContent = ""; });
    chip.addEventListener("click", () => { if (chipNote) chipNote.textContent = chip.dataset.note || ""; });
  });

  // ------------------------------
  // Footer year
  // ------------------------------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ------------------------------
  // Easter egg
  // ------------------------------
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "m") {
      document.querySelectorAll(".product-card").forEach((card) => {
        card.animate(
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-6px)" },
            { transform: "translateY(0)" },
          ],
          { duration: 1500, iterations: 1, easing: "ease-in-out" }
        );
      });
    }
  });
});
