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

/** Brand-tuned accent sweep */
function accentForDay(d) {
  const t = Number(d) / 29; // 0..1
  const hueLav = 258 + 6 * Math.sin(t * 2 * Math.PI);
  const hueGold = 45 + 10 * Math.cos(t * 2 * Math.PI);
  const c1 = `hsl(${hueLav.toFixed(1)} 90% 70%)`;
  const c2 = `hsl(${hueGold.toFixed(1)} 85% 63%)`;
  document.documentElement.style.setProperty("--accent", c1);
  document.documentElement.style.setProperty("--accent-2", c2);
}

/** Move shadow horizontally to simulate phase */
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

// Cart state
const cart = [];
const cartList = document.getElementById("cartItems");
const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartCount = document.getElementById("cartCount");

function openCart(autoClose=false) {
  cartDrawer.classList.add("open");
  cartOverlay.hidden = false;
  cartOverlay.classList.add("open");
  if (autoClose) {
    const timer = setTimeout(() => {
      if (!cartDrawer.matches(":hover")) closeCart();
    }, 2500);
    cartDrawer.addEventListener("mouseenter", () => clearTimeout(timer), { once: true });
  }
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  setTimeout(() => cartOverlay.hidden = true, 180);
}
document.getElementById("closeCart")?.addEventListener("click", closeCart);
cartButton?.addEventListener("click", () => openCart(false));
cartOverlay?.addEventListener("click", closeCart);

function cartQtyTotal() {
  return cart.reduce((sum, it) => sum + it.qty, 0);
}

function renderCart() {
  cartList.innerHTML = "";
  if (cart.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Add products to craft your ritual.";
    li.style.opacity = "0.7";
    cartList.appendChild(li);
  } else {
    cart.forEach((item, i) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span class="dot"></span>
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
  cartCount.textContent = cartQtyTotal();
}

function addToCart(name, qty=1) {
  const existing = cart.find(x => x.name === name);
  if (existing) existing.qty += qty; else cart.push({ name, qty });
  renderCart();
  openCart(true);
}

// Product buttons
document.querySelectorAll(".product-card .add").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.currentTarget.closest(".product-card");
    const name = card.querySelector("h3").textContent.trim();
    addToCart(name, 1);
    card.animate([
      { transform: "scale(1)", filter: "brightness(1)" },
      { transform: "scale(1.02)", filter: "brightness(1.2)" },
      { transform: "scale(1)", filter: "brightness(1)" }
    ], { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" });
  });
});

// Cart item controls
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

// Ritual presets: add a single line item named after the phase (not individual products)
document.querySelectorAll(".use-ritual").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.currentTarget.closest(".ritual-card");
    const phaseName = card.querySelector("h3").textContent.trim(); // e.g., "New Moon", "Waxing"
    addToCart(phaseName, 1);
    const map = { "New Moon": 0, "Waxing": 7, "Full Moon": 14, "Waning": 21 };
    const target = map[phaseName] ?? 0;
    const slider = document.getElementById("phaseSlider");
    slider.value = target;
    setMoonPhase(target);
  });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Easter egg: press "M" to float product cards
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    document.querySelectorAll(".product-card, .ritual-card").forEach(card => {
      card.animate([
        { transform: "translateY(0)" },
        { transform: "translateY(-6px)" },
        { transform: "translateY(0)" }
      ], { duration: 1500, iterations: 1, easing: "ease-in-out" });
    });
  }
});
