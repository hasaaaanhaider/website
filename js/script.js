/* ==========================================================================
   DailyBazaar — Site Script
   Handles: mobile nav, active-link highlighting, the localStorage shopping
   cart (add/remove/update, badge sync across pages), and page-specific
   rendering for the homepage, shop, product detail, and cart pages.
   ========================================================================== */

const CART_KEY = "dailybazaar_cart";
const FREE_SHIPPING_THRESHOLD = 40;
const SHIPPING_COST = 4.99;

/* ----------------------------- Cart storage ----------------------------- */

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Could not read cart from storage:", err);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge(true);
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveCart(cart);
  showToast("Added to your basket");
}

function updateCartQty(id, qty) {
  let cart = getCart();
  qty = Math.max(1, parseInt(qty, 10) || 1);
  cart = cart.map((item) => (item.id === id ? { ...item, qty } : item));
  saveCart(cart);
  renderCartPage();
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  renderCartPage();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartLines() {
  // Join stored {id, qty} rows with full product data, skipping anything
  // that no longer exists in the catalogue.
  return getCart()
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      return product ? { ...product, qty: item.qty } : null;
    })
    .filter(Boolean);
}

function updateCartBadge(bump = false) {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = getCartCount();
    if (bump) {
      el.classList.remove("bump");
      // restart animation
      void el.offsetWidth;
      el.classList.add("bump");
    }
  });
}

/* ------------------------------- Toast ----------------------------------- */

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.querySelector("span").textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ------------------------------ Navigation -------------------------------- */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // Highlight the current page in the header
  const current = document.body.dataset.page;
  document.querySelectorAll(".main-nav a[data-nav]").forEach((link) => {
    if (link.dataset.nav === current) link.classList.add("active");
  });
}

/* ------------------------------ Card markup -------------------------------- */

function productCardHTML(product) {
  const badge = product.badge
    ? `<span class="product-badge ${product.badge.toLowerCase()}">${product.badge}</span>`
    : "";
  const oldPrice = product.oldPrice
    ? `<span class="price-old">${formatGBP(product.oldPrice)}</span>`
    : "";
  return `
    <article class="product-card">
      <a href="product.html?id=${product.id}" class="product-media">
        ${badge}
        <img src="${productImage(product.id)}" alt="${product.title}" loading="lazy">
      </a>
      <div class="product-body">
        <span class="product-category">${product.category}</span>
        <h3 class="product-title"><a href="product.html?id=${product.id}">${product.title}</a></h3>
        <div class="rating">
          <span class="stars">${renderStars(product.rating)}</span>
          <span>(${product.reviews})</span>
        </div>
        <div class="price-row">
          <span class="price">${formatGBP(product.price)}</span>
          ${oldPrice}
        </div>
      </div>
      <div class="product-footer">
        <button class="btn btn-primary btn-block" data-add-to-cart="${product.id}" ${product.stock === false ? "disabled" : ""}>
          ${product.stock === false ? "Out of stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  `;
}

function bindAddToCartButtons(scope = document) {
  scope.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.addToCart, 10);
      addToCart(id, 1);
    });
  });
}

/* -------------------------------- Homepage ---------------------------------- */

function renderTrending() {
  const grid = document.getElementById("trending-grid");
  if (!grid) return;
  const featured = PRODUCTS.filter((p) => p.featured).slice(0, 4);
  grid.innerHTML = featured.map(productCardHTML).join("");
  bindAddToCartButtons(grid);
}

/* ---------------------------------- Shop ------------------------------------ */

function initShopPage() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;

  const categoryInputs = document.querySelectorAll("[data-filter-category]");
  const priceRange = document.getElementById("price-range");
  const priceRangeLabel = document.getElementById("price-range-label");
  const sortSelect = document.getElementById("sort-select");
  const resultCount = document.getElementById("result-count");

  function getFilteredProducts() {
    const checkedCategories = Array.from(categoryInputs)
      .filter((el) => el.checked)
      .map((el) => el.value);

    const maxPrice = priceRange ? parseFloat(priceRange.value) : Infinity;

    let items = PRODUCTS.filter((p) => {
      const inCategory = checkedCategories.length === 0 || checkedCategories.includes(p.category);
      const inPrice = p.price <= maxPrice;
      return inCategory && inPrice;
    });

    const sortValue = sortSelect ? sortSelect.value : "featured";
    if (sortValue === "price-asc") items.sort((a, b) => a.price - b.price);
    else if (sortValue === "price-desc") items.sort((a, b) => b.price - a.price);
    else if (sortValue === "rating") items.sort((a, b) => b.rating - a.rating);

    return items;
  }

  function render() {
    const items = getFilteredProducts();
    grid.innerHTML = items.length
      ? items.map(productCardHTML).join("")
      : `<div class="empty-state">No products match those filters. Try widening your price range.</div>`;
    bindAddToCartButtons(grid);
    if (resultCount) resultCount.textContent = `${items.length} product${items.length === 1 ? "" : "s"}`;
    if (priceRangeLabel && priceRange) priceRangeLabel.textContent = formatGBP(parseFloat(priceRange.value));
  }

  categoryInputs.forEach((el) => el.addEventListener("change", render));
  if (priceRange) priceRange.addEventListener("input", render);
  if (sortSelect) sortSelect.addEventListener("change", render);

  // Pre-select a category if the page was reached via a "Shop by Category" link
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get("category");
  if (preselect) {
    categoryInputs.forEach((el) => {
      if (el.value === preselect) el.checked = true;
    });
  }

  render();
}

/* ------------------------------ Product detail -------------------------------- */

function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);
  return Number.isInteger(id) ? id : PRODUCTS[0].id;
}

function initProductPage() {
  const root = document.getElementById("pd-root");
  if (!root) return;

  const product = PRODUCTS.find((p) => p.id === getQueryId()) || PRODUCTS[0];

  document.title = `${product.title} — DailyBazaar`;

  document.getElementById("pd-image").src = productImage(product.id, 900);
  document.getElementById("pd-image").alt = product.title;
  document.getElementById("pd-breadcrumb-category").textContent = product.category;
  document.getElementById("pd-breadcrumb-title").textContent = product.title;
  document.getElementById("pd-title").textContent = product.title;
  document.getElementById("pd-category").textContent = product.category;
  document.getElementById("pd-price").textContent = formatGBP(product.price);
  document.getElementById("pd-stars").textContent = renderStars(product.rating);
  document.getElementById("pd-reviews-count").textContent = `${product.reviews} reviews`;
  document.getElementById("pd-description").textContent = product.description;

  const oldPriceEl = document.getElementById("pd-old-price");
  if (product.oldPrice) {
    oldPriceEl.textContent = formatGBP(product.oldPrice);
    oldPriceEl.style.display = "inline";
  } else {
    oldPriceEl.style.display = "none";
  }

  const stockBadge = document.getElementById("pd-stock");
  const addBtn = document.getElementById("pd-add-to-cart");
  if (product.stock === false) {
    stockBadge.textContent = "Out of stock";
    stockBadge.style.background = "rgba(214,69,69,0.1)";
    stockBadge.style.color = "var(--color-danger)";
    addBtn.disabled = true;
    addBtn.textContent = "Out of Stock";
  } else {
    addBtn.addEventListener("click", () => {
      const qty = parseInt(document.getElementById("pd-qty").value, 10) || 1;
      addToCart(product.id, qty);
    });
  }

  // Reviews
  const reviewsList = document.getElementById("pd-reviews-list");
  if (reviewsList) {
    reviewsList.innerHTML = SAMPLE_REVIEWS.map(
      (r) => `
        <div class="review">
          <div class="review-head">
            <span class="review-name">${r.name}</span>
            <span class="stars">${renderStars(r.rating)}</span>
          </div>
          <p>${r.text}</p>
        </div>`
    ).join("");
  }

  // Related products (same category, excluding current)
  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    relatedGrid.innerHTML = related.map(productCardHTML).join("");
    bindAddToCartButtons(relatedGrid);
  }

  initTabs();
}

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tabTarget).classList.add("active");
    });
  });
}

/* --------------------------------- Cart page ----------------------------------- */

function cartLineHTML(line) {
  return `
    <div class="cart-item" data-line="${line.id}">
      <img src="${productImage(line.id)}" alt="${line.title}">
      <div>
        <div class="cart-item-title">${line.title}</div>
        <div class="cart-item-cat">${line.category}</div>
      </div>
      <div class="cart-item-qty">
        <select aria-label="Quantity for ${line.title}" data-qty-for="${line.id}">
          ${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${n === line.qty ? "selected" : ""}>${n}</option>`).join("")}
        </select>
      </div>
      <div class="cart-item-price">${formatGBP(line.price * line.qty)}</div>
      <button class="remove-btn" aria-label="Remove ${line.title}" data-remove="${line.id}">
        <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
  `;
}

function renderCartPage() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const lines = getCartLines();
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Your basket is empty. <a href="shop.html" style="color: var(--color-emerald-dark); font-weight:600;">Continue shopping →</a>
      </div>`;
  } else {
    container.innerHTML = lines.map(cartLineHTML).join("");
    container.querySelectorAll("[data-qty-for]").forEach((select) => {
      select.addEventListener("change", (e) => {
        updateCartQty(parseInt(select.dataset.qtyFor, 10), e.target.value);
      });
    });
    container.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(parseInt(btn.dataset.remove, 10)));
    });
  }

  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (subtotalEl) subtotalEl.textContent = formatGBP(subtotal);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? "Free" : formatGBP(shipping);
  if (totalEl) totalEl.textContent = formatGBP(total);
  if (checkoutBtn) checkoutBtn.disabled = lines.length === 0;
}

/* ---------------------------------- Init ------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  updateCartBadge();
  renderTrending();
  initShopPage();
  initProductPage();
  renderCartPage();

  // Checkout is a placeholder on a static, backend-free site
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      showToast("Checkout isn't connected yet — this is a demo storefront");
    });
  }
});

// Keep the cart badge in sync if the cart is changed in another tab
window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) updateCartBadge();
});
