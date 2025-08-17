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
 * Geometry notes:
 * - New Moon: shadow disc centered (x = 0) fully covers the lit disc => invisible.
 * - Full Moon: shadow disc moves completely off to the SIDE (|x| = 2R) => fully visible.
 * - First Quarter: x = -R (lit on RIGHT).
 * - Third Quarter: x = +R (lit on LEFT).
 * Piecewise cosine mapping ensures exact quarter positions and cycle continuity.
 */
function setMoonPhase(day) {
  const shadow = document.getElementById("shadowOrb");
  const nameEl = document.getElementById("phaseName");
  const dayEl = document.getElementById("phaseDay");

  const d = clamp(0, Number(day), 29);
  const f = d / 29; // normalized 0..1 across the synodic month
  const R = 72;     // circle radius used in the SVG

  let x;
  if (f <= 0.5) {
    // Waxing: light grows on RIGHT -> move shadow LEFT (negative)
    //  f=0   => 0 (New)
    //  f=.25 => -R (First Quarter)
    //  f=.5  => -2R (Full)
    x = R * (Math.cos(2 * Math.PI * f) - 1);
  } else {
    // Waning: light remains on LEFT -> move shadow RIGHT (positive)
    //  f=.5  => +2R (Full, still off-screen)
    //  f=.75 => +R (Third Quarter)
    //  f=1   => ~0 (approaching New)
    x = R * (1 - Math.cos(2 * Math.PI * f));
  }

  shadow.style.transform = `translateX(${x.toFixed(2)}px)`;

  nameEl.textContent = phaseLabel(d);
  dayEl.textContent = d;

  accentForDay(d);
}

// Theme toggle
const toggle = document.getElementById("themeToggle");
toggle?.addEventListener("click", () => {
  const root = document.documentElement;
  root.classList.toggle("light");
  localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
});

// Initialize theme from storage
(function(){
  const t = localStorage.getItem("theme");
  if (t === "light") document.documentElement.classList.add("light");
})();

// Initialize moon slider
const slider = document.getElementById("phaseSlider");
slider?.addEventListener("input", (e) => setMoonPhase(e.target.value));
setMoonPhase(slider?.value || 0);

// Cart / "Ritual" micro-cart
const cart = [];
const cartList = document.getElementById("cartItems");

function renderCart() {
  cartList.innerHTML = "";
  if (cart.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Add products to craft your ritual.";
    li.style.opacity = "0.7";
    cartList.appendChild(li);
    return;
  }
  cart.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <span class="dot" style="background: var(--accent)"></span>
      <span>${item.name}</span>
      <div style="display:flex; gap:6px;">
        <button aria-label="Decrease" data-i="${i}" data-act="dec">−</button>
        <span aria-live="polite">${item.qty}</span>
        <button aria-label="Increase" data-i="${i}" data-act="inc">+</button>
        <button aria-label="Remove" data-i="${i}" data-act="rem">✕</button>
      </div>
    `;
    cartList.appendChild(li);
  });
}
renderCart();

document.querySelectorAll(".product-card .add").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.currentTarget.closest(".product-card");
    const name = card.querySelector("h3").textContent.trim();
    const existing = cart.find(x => x.name === name);
    if (existing) existing.qty += 1; else cart.push({ name, qty: 1 });
    renderCart();
    // micro confetti-ish ring
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
    const phase = e.currentTarget.closest(".ritual-card").dataset.phase;
    const map = {
      new: ["Cuticle Oil", "Whipped Body Butter"],
      waxing: ["Lip Balm", "Whipped Body Butter", "Moon Candle"],
      full: ["Cuticle Oil", "Moon Candle"],
      waning: ["Lip Balm", "Moon Candle"]
    };
    cart.splice(0, cart.length);
    (map[phase] || []).forEach(n => cart.push({ name: n, qty: 1 }));
    renderCart();
    // Push slider toward the quadrant
    const phaseTarget = { new: 0, waxing: 7, full: 14, waning: 21 }[phase] ?? 0;
    slider.value = phaseTarget;
    setMoonPhase(phaseTarget);
  });
});

// Ingredient chips
const chipNote = document.getElementById("chipNote");
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("mouseenter", () => {
    chipNote.textContent = chip.dataset.note;
  });
  chip.addEventListener("mouseleave", () => {
    chipNote.textContent = "";
  });
  chip.addEventListener("click", () => {
    chipNote.textContent = chip.dataset.note;
  });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Easter egg: press "M" for microgravity float on product cards
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    document.querySelectorAll(".product-card").forEach(card => {
      card.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(-6px)" },
        { transform: "translateY(0)" }
      ], { duration: 1500, iterations: 1, easing: "ease-in-out" });
    });
  }
});
