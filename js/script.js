/* =========================================================================
   DailyBazaar — Site Script (Cloudflare Secure Telegram Relay + COD Only)
   ========================================================================== */

const CART_KEY = "dailybazaar_cart";
const ORDER_KEY = "dailybazaar_last_order";
const FREE_SHIPPING_THRESHOLD = 40;
const SHIPPING_COST = 4.99;

// Secure Cloudflare Worker Endpoint (Tokens hidden safely on Cloudflare server)
const WORKER_URL = "https://fancy-dream-7135dailybazaar-bot-relay.hasaaaanhaider.workers.dev/";

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
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== id);
  saveCart(cart);
  showToast("Item removed from basket");
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge(true);
}

/* ----------------------------- UI / Badge ----------------------------- */

function updateCartBadge(animate = false) {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll(".cart-badge").forEach((badge) => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "inline-flex" : "none";
    if (animate) {
      badge.classList.remove("bump");
      void badge.offsetWidth;
      badge.classList.add("bump");
    }
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  const span = toast.querySelector("span");
  if (span) span.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function formatGBP(amount) {
  return "£" + Number(amount).toFixed(2);
}

/* ----------------------------- Navigation ----------------------------- */

function initNav() {
  const bodyPage = document.body.getAttribute("data-page");
  document.querySelectorAll(".main-nav a").forEach((link) => {
    const nav = link.getAttribute("data-nav");
    if (nav === bodyPage) {
      link.classList.add("active");
    }
  });
}

/* ----------------------------- Homepage ----------------------------- */

function renderTrending() {
  const container = document.getElementById("trending-products");
  if (!container) return;

  const trending = PRODUCTS.filter((p) => p.featured).slice(0, 4);
  container.innerHTML = trending
    .map(
      (p) => `
    <div class="product-card">
      <a href="product.html?id=${p.id}" class="product-image-wrap">
        <img src="${productImage(p.id, 400)}" alt="${p.title}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
      </a>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <a href="product.html?id=${p.id}" class="product-title">${p.title}</a>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="reviews-count">(${p.reviews})</span>
        </div>
        <div class="product-footer">
          <div class="product-prices">
            <span class="price">${formatGBP(p.price)}</span>
            ${p.oldPrice ? `<span class="old-price">${formatGBP(p.oldPrice)}</span>` : ""}
          </div>
          <button class="btn btn-sm btn-primary" onclick="addToCart(${p.id})">Add</button>
        </div>
      </div>
    </div>`
    )
    .join("");
}

function renderStars(rating) {
  const full = "★".repeat(Math.floor(rating));
  const empty = "☆".repeat(5 - Math.floor(rating));
  return full + empty;
}

/* ----------------------------- Shop Page ----------------------------- */

let currentFilters = {
  category: "all",
  search: "",
  sort: "featured",
  maxPrice: 100,
};

function initShopPage() {
  const shopGrid = document.getElementById("shop-grid");
  if (!shopGrid) return;

  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get("category");
  if (catParam) {
    currentFilters.category = catParam;
  }

  setupShopFilters();
  applyShopFilters();
}

function setupShopFilters() {
  const searchInput = document.getElementById("shop-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentFilters.search = e.target.value.trim().toLowerCase();
      applyShopFilters();
    });
  }

  const sortSelect = document.getElementById("shop-sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentFilters.sort = e.target.value;
      applyShopFilters();
    });
  }

  const priceSlider = document.getElementById("price-slider");
  const priceOutput = document.getElementById("price-output");
  if (priceSlider) {
    priceSlider.addEventListener("input", (e) => {
      currentFilters.maxPrice = parseFloat(e.target.value);
      if (priceOutput) priceOutput.textContent = formatGBP(currentFilters.maxPrice);
      applyShopFilters();
    });
  }

  document.querySelectorAll(".category-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilters.category = btn.getAttribute("data-category");
      applyShopFilters();
    });
  });
}

function applyShopFilters() {
  const shopGrid = document.getElementById("shop-grid");
  const countEl = document.getElementById("product-count");
  if (!shopGrid) return;

  let results = PRODUCTS.filter((p) => {
    if (currentFilters.category !== "all" && p.category !== currentFilters.category) {
      return false;
    }
    if (currentFilters.search) {
      const matchTitle = p.title.toLowerCase().includes(currentFilters.search);
      const matchDesc = p.description.toLowerCase().includes(currentFilters.search);
      const matchCat = p.category.toLowerCase().includes(currentFilters.search);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    if (p.price > currentFilters.maxPrice) {
      return false;
    }
    return true;
  });

  if (currentFilters.sort === "price-asc") {
    results.sort((a, b) => a.price - b.price);
  } else if (currentFilters.sort === "price-desc") {
    results.sort((a, b) => b.price - a.price);
  } else if (currentFilters.sort === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  }

  if (countEl) {
    countEl.textContent = `${results.length} product${results.length === 1 ? "" : "s"}`;
  }

  if (results.length === 0) {
    shopGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
        <h3>No products found</h3>
        <p>Try adjusting your search or filter criteria.</p>
      </div>`;
    return;
  }

  shopGrid.innerHTML = results
    .map(
      (p) => `
    <div class="product-card">
      <a href="product.html?id=${p.id}" class="product-image-wrap">
        <img src="${productImage(p.id, 400)}" alt="${p.title}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
      </a>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <a href="product.html?id=${p.id}" class="product-title">${p.title}</a>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="reviews-count">(${p.reviews})</span>
        </div>
        <div class="product-footer">
          <div class="product-prices">
            <span class="price">${formatGBP(p.price)}</span>
            ${p.oldPrice ? `<span class="old-price">${formatGBP(p.oldPrice)}</span>` : ""}
          </div>
          <button class="btn btn-sm btn-primary" onclick="addToCart(${p.id})">Add</button>
        </div>
      </div>
    </div>`
    )
    .join("");
}

/* ----------------------------- Product Detail Page ----------------------------- */

function initProductPage() {
  const container = document.getElementById("product-detail-container");
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const id = parseInt(urlParams.get("id"), 10) || 1;
  const product = PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  document.title = `${product.title} — DailyBazaar`;

  container.innerHTML = `
    <div class="product-gallery">
      <img src="${productImage(product.id, 600)}" alt="${product.title}">
    </div>
    <div class="product-details-content">
      <span class="product-category">${product.category}</span>
      <h1>${product.title}</h1>
      <div class="product-rating">
        <span class="stars">${renderStars(product.rating)}</span>
        <span class="reviews-count">${product.rating} (${product.reviews} customer reviews)</span>
      </div>
      <div class="product-prices" style="margin: 16px 0;">
        <span class="price" style="font-size: 1.8rem;">${formatGBP(product.price)}</span>
        ${product.oldPrice ? `<span class="old-price" style="font-size: 1.2rem;">${formatGBP(product.oldPrice)}</span>` : ""}
      </div>
      <p class="product-description">${product.description}</p>
      
      <div class="stock-status ${product.stock ? "in-stock" : "out-stock"}">
        ${product.stock ? "✓ In Stock — Dispatched within 24 hours" : "✕ Out of Stock"}
      </div>

      <div class="purchase-box" style="margin-top: 24px; display: flex; gap: 12px; align-items: center;">
        <input type="number" id="detail-qty" value="1" min="1" max="10" style="width: 70px; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
        <button class="btn btn-primary btn-lg" style="flex: 1;" onclick="addCurrentProductToCart(${product.id})" ${!product.stock ? "disabled" : ""}>
          Add to Basket
        </button>
      </div>

      <div class="features-list" style="margin-top: 30px; border-top: 1px solid var(--color-border); padding-top: 20px;">
        <div style="display:flex; gap:10px; margin-bottom:10px; font-size:0.9rem; color:var(--color-text-muted);">
          <span>📦</span> Free UK delivery on orders over £40
        </div>
        <div style="display:flex; gap:10px; font-size:0.9rem; color:var(--color-text-muted);">
          <span>🔄</span> 30-day hassle-free returns
        </div>
      </div>
    </div>
  `;

  renderReviews();
}

function addCurrentProductToCart(id) {
  const qtyInput = document.getElementById("detail-qty");
  const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
  addToCart(id, qty);
}

function renderReviews() {
  const container = document.getElementById("reviews-container");
  if (!container) return;

  container.innerHTML = SAMPLE_REVIEWS.map(
    (r) => `
    <div class="review-card" style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:16px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
        <strong>${r.name}</strong>
        <span class="stars">${renderStars(r.rating)}</span>
      </div>
      <p style="color:var(--color-text-muted); font-size:0.9rem; margin:0;">${r.text}</p>
    </div>`
  ).join("");
}

/* ----------------------------- Cart Page ----------------------------- */

function renderCartPage() {
  const container = document.getElementById("cart-page-container");
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align:center; padding:80px 20px;">
        <h2>Your basket is empty</h2>
        <p style="color:var(--color-text-muted); margin: 12px 0 24px;">Looks like you haven't added anything to your basket yet.</p>
        <a href="shop.html" class="btn btn-primary">Start Shopping</a>
      </div>`;
    return;
  }

  let subtotal = 0;
  const lines = cart.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (!product) return "";
    const lineTotal = product.price * item.qty;
    subtotal += lineTotal;
    return `
      <div class="cart-item" style="display:flex; gap:16px; align-items:center; padding:16px 0; border-bottom:1px solid var(--color-border);">
        <img src="${productImage(product.id, 100)}" alt="${product.title}" style="width:80px; height:80px; object-fit:cover; border-radius:var(--radius-sm);">
        <div style="flex:1;">
          <h4 style="margin:0 0 4px;"><a href="product.html?id=${product.id}">${product.title}</a></h4>
          <span style="color:var(--color-text-muted); font-size:0.9rem;">${formatGBP(product.price)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="number" value="${item.qty}" min="1" max="10" style="width:50px; padding:6px; border:1px solid var(--color-border); border-radius:var(--radius-sm);" onchange="updateCartQty(${product.id}, this.value)">
        </div>
        <div style="text-align:right; min-width:80px;">
          <strong>${formatGBP(lineTotal)}</strong>
        </div>
        <button onclick="removeFromCart(${product.id})" style="background:none; border:none; color:var(--color-danger); cursor:pointer; font-size:1.2rem; padding:4px;">&times;</button>
      </div>`;
  }).join("");

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  container.innerHTML = `
    <div class="cart-layout" style="display:grid; grid-template-columns: 1fr 350px; gap:32px; align-items:start;">
      <div class="cart-items-list">
        <div class="shipping-progress-box" style="background:var(--color-surface); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--color-border); margin-bottom:20px;">
          <p style="margin:0 0 8px; font-size:0.9rem;">
            ${remaining > 0 ? `Add <strong>${formatGBP(remaining)}</strong> more to get <strong>Free UK Delivery</strong>!` : `🎉 You've unlocked <strong>Free UK Delivery</strong>!`}
          </p>
          <div style="background:var(--color-border); height:6px; border-radius:3px; overflow:hidden;">
            <div style="background:var(--color-emerald); width:${progress}%; height:100%; transition:width 0.3s ease;"></div>
          </div>
        </div>
        ${lines}
      </div>
      <div class="cart-summary" style="background:var(--color-surface); padding:24px; border-radius:var(--radius-sm); border:1px solid var(--color-border);">
        <h3 style="margin-top:0; border-bottom:1px solid var(--color-border); padding-bottom:12px;">Order Summary</h3>
        <div style="display:flex; justify-content:space-between; margin:12px 0; font-size:0.95rem;">
          <span>Subtotal</span>
          <span>${formatGBP(subtotal)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:12px 0; font-size:0.95rem;">
          <span>Shipping</span>
          <span>${shipping === 0 ? "Free" : formatGBP(shipping)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:16px 0; font-size:1.1rem; font-weight:700; border-top:1px solid var(--color-border); padding-top:12px;">
          <span>Total</span>
          <span>${formatGBP(total)}</span>
        </div>
        <a href="checkout.html" id="checkout-btn" class="btn btn-primary" style="width:100%; text-align:center; display:block; box-sizing:border-box; margin-top:16px;">
          Proceed to Checkout
        </a>
      </div>
    </div>
  `;
}

/* ----------------------------- Checkout Page ----------------------------- */

function initCheckoutPage() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = "cart.html";
    return;
  }

  let subtotal = 0;
  const linesSummary = cart.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (!product) return "";
    subtotal += product.price * item.qty;
    return `
      <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px; color:var(--color-text-muted);">
        <span>${product.title} × ${item.qty}</span>
        <span>${formatGBP(product.price * item.qty)}</span>
      </div>`;
  }).join("");

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  const summaryContainer = document.getElementById("checkout-summary-lines");
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      ${linesSummary}
      <div style="border-top:1px solid var(--color-border); margin-top:12px; padding-top:12px;">
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
          <span>Subtotal</span><span>${formatGBP(subtotal)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
          <span>Shipping</span><span>${shipping === 0 ? "Free" : formatGBP(shipping)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:1.05rem; font-weight:700; margin-top:8px;">
          <span>Total</span><span>${formatGBP(total)}</span>
        </div>
      </div>
    `;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName")?.value || "";
    const email = document.getElementById("email")?.value || "";
    const phone = document.getElementById("phone")?.value || "";
    const address = document.getElementById("address")?.value || "";
    const city = document.getElementById("city")?.value || "";
    const postcode = document.getElementById("postcode")?.value || "";

    const orderDetails = {
      orderId: "DB-" + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString(),
      paymentMethod: "Cash on Delivery (COD)",
      shippingDetails: { fullName, email, phone, address, city, postcode },
      lines: cart.map((item) => {
        const p = PRODUCTS.find((prod) => prod.id === item.id);
        return { title: p ? p.title : "Product", qty: item.qty, price: p ? p.price : 0 };
      }),
      subtotal,
      shipping,
      total,
    };

    let message = `🛒 *NEW ORDER RECEIVED!* (COD)\n\n`;
    message += `🆔 *Order ID:* \`${orderDetails.orderId}\`\n`;
    message += `📅 *Date:* ${orderDetails.date}\n\n`;
    message += `👤 *Customer Details:*\n`;
    message += `• Name: ${fullName}\n`;
    message += `• Phone: ${phone}\n`;
    message += `• Email: ${email}\n`;
    message += `• Address: ${address}, ${city}, ${postcode}\n\n`;
    message += `📦 *Items Ordered:*\n`;
    orderDetails.lines.forEach((l) => {
      message += `• ${l.title} × ${l.qty} — ${formatGBP(l.price * l.qty)}\n`;
    });
    message += `\n💰 *Subtotal:* ${formatGBP(subtotal)}\n`;
    message += `🚚 *Shipping:* ${shipping === 0 ? "Free" : formatGBP(shipping)}\n`;
    message += `💵 *Total Amount:* *${formatGBP(total)}* (Cash on Delivery)\n`;

    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message }),
      });

      const data = await response.json();
      if (!data.ok) {
        console.error("Telegram Relay Error:", data);
      }
    } catch (err) {
      console.error("Network or API Error:", err);
    }

    localStorage.setItem(ORDER_KEY, JSON.stringify(orderDetails));
    clearCart();

    window.location.href = "order-confirmation.html";
  });
}

/* ----------------------------- Order Confirmation Page ----------------------------- */

function initOrderConfirmationPage() {
  const container = document.getElementById("order-confirmation-container");
  if (!container) return;

  const rawOrder = localStorage.getItem(ORDER_KEY);
  if (!rawOrder) {
    window.location.href = "index.html";
    return;
  }

  const order = JSON.parse(rawOrder);

  document.getElementById("order-id-display").textContent = order.orderId;
  document.getElementById("customer-email-display").textContent = order.shippingDetails.email;
  document.getElementById("shipping-address-display").innerHTML = `
    ${order.shippingDetails.fullName}<br>
    ${order.shippingDetails.address}<br>
    ${order.shippingDetails.city} ${order.shippingDetails.postcode}<br>
    Phone: ${order.shippingDetails.phone}
  `;

  const itemsList = document.getElementById("order-items");
  if (itemsList) {
    itemsList.innerHTML = order.lines
      .map(
        (l) => `
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
        <span>${l.title} × ${l.qty}</span>
        <span>${formatGBP(l.price * l.qty)}</span>
      </div>`
      )
      .join("");
  }

  document.getElementById("order-subtotal").textContent = formatGBP(order.subtotal);
  document.getElementById("order-shipping").textContent = order.shipping === 0 ? "Free" : formatGBP(order.shipping);
  document.getElementById("order-total").textContent = formatGBP(order.total);
}

/* ---------------------------------- Init ------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  updateCartBadge();
  renderTrending();
  initShopPage();
  initProductPage();
  renderCartPage();
  initCheckoutPage();
  initOrderConfirmationPage();

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn && checkoutBtn.tagName === "A") {
    checkoutBtn.addEventListener("click", (e) => {
      if (checkoutBtn.classList.contains("btn-disabled")) {
        e.preventDefault();
        showToast("Your basket is empty");
      }
    });
  }
});

window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) {
    updateCartBadge(true);
  }
});
