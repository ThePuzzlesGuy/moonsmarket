// Utility: clamp
const clamp = (min, val, max) => Math.min(max, Math.max(min, val));

// Phase helpers
const PHASES = [
  "New Moon", "Waxing Crescent", "Waxing Crescent", "Waxing Crescent", "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous", "Waxing Gibbous", "Waxing Gibbous", "Waxing Gibbous", "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous", "Waning Gibbous", "Waning Gibbous", "Waning Gibbous", "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent", "Waning Crescent", "Waning Crescent", "Waning Crescent", "Waning Crescent",
  "New-ish",
  "Waxing-ish", "Waxing-ish", "Gibby-ish", "Waning-ish", "Almost New", "Very New"
];

// Map phase index (0..29) to accent gradient
function accentForDay(d) {
  // 0..29 => hue shifts and mix
  const t = d / 29;
  const hue1 = 230 + 70 * t; // blue->purple
  const hue2 = 280 + 40 * (1 - t); // purple->orchid
  const c1 = `hsl(${hue1.toFixed(1)} 100% 75%)`;
  const c2 = `hsl(${hue2.toFixed(1)} 80% 78%)`;
  document.documentElement.style.setProperty("--accent", c1);
  document.documentElement.style.setProperty("--accent-2", c2);
}

// Move the shadow orb horizontally to simulate phase
function setMoonPhase(day) {
  const shadow = document.getElementById("shadowOrb");
  const nameEl = document.getElementById("phaseName");
  const dayEl = document.getElementById("phaseDay");

  const d = clamp(0, Number(day), 29);
  const pct = d / 29; // 0..1
  // Range for x offset (-72..+72): new moon centers shadow on lit circle, full moon moves shadow far right
  const r = 72;
  const x = (pct * 2 - 1) * r;
  shadow.style.transform = `translateX(${x.toFixed(2)}px)`;

  nameEl.textContent = PHASES[d] || "Waxing Crescent";
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
setMoonPhase(slider?.value || 3);

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
    // Also push the moon slider toward the relevant phase quadrant
    const phaseTarget = { new: 0, waxing: 6, full: 12, waning: 19 }[phase] ?? 3;
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
