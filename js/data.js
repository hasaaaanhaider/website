/* ==========================================================================
   DailyBazaar — Product Data
   In a real deployment this could be swapped for a JSON feed or CMS export.
   Every page reads from this single source of truth so IDs stay consistent.
   ========================================================================== */

const PRODUCTS = [
  {
    id: 1,
    title: "Ceramic Pour-Over Coffee Set",
    category: "Home & Kitchen",
    price: 24.99,
    oldPrice: 29.99,
    rating: 4.5,
    reviews: 128,
    badge: "Sale",
    featured: true,
    description: "A hand-glazed ceramic dripper and matching carafe designed for slow, even extraction. Dishwasher safe, holds up to 4 cups, and pairs with any standard filter size.",
    stock: true
  },
  {
    id: 2,
    title: "Wireless Charging Stand",
    category: "Tech Gadgets",
    price: 19.99,
    oldPrice: null,
    rating: 4.0,
    reviews: 64,
    badge: null,
    featured: false,
    description: "A 15W fast-charging stand that props your phone at a comfortable viewing angle while it tops up. Compatible with all Qi-enabled devices and most slim cases.",
    stock: true
  },
  {
    id: 3,
    title: "Bamboo Bathroom Organiser",
    category: "Daily Living",
    price: 15.50,
    oldPrice: null,
    rating: 5.0,
    reviews: 212,
    badge: null,
    featured: true,
    description: "Sustainably sourced bamboo caddy with three tiers for towels, toiletries, and everyday essentials. Water-resistant sealed finish, no assembly tools required.",
    stock: true
  },
  {
    id: 4,
    title: "Insulated Steel Water Bottle",
    category: "Daily Living",
    price: 12.99,
    oldPrice: null,
    rating: 4.5,
    reviews: 340,
    badge: "New",
    featured: false,
    description: "Double-walled stainless steel bottle that keeps drinks cold for 24 hours or hot for 12. Leak-proof lid, 500ml capacity, fits most car cup holders.",
    stock: true
  },
  {
    id: 5,
    title: "Compact Air Fryer 3L",
    category: "Home & Kitchen",
    price: 39.99,
    oldPrice: 54.99,
    rating: 4.5,
    reviews: 98,
    badge: "Sale",
    featured: true,
    description: "A space-saving 3-litre air fryer with one-touch presets for chips, chicken, and bakes. Dishwasher-safe basket and a viewing window so you can check progress.",
    stock: true
  },
  {
    id: 6,
    title: "Noise-Isolating Earbuds",
    category: "Tech Gadgets",
    price: 29.99,
    oldPrice: null,
    rating: 4.0,
    reviews: 76,
    badge: null,
    featured: true,
    description: "Lightweight true-wireless earbuds with passive noise isolation and up to 24 hours of battery life including the charging case. IPX4 sweat resistant.",
    stock: true
  },
  {
    id: 7,
    title: "Linen Storage Baskets (Set of 3)",
    category: "Home & Kitchen",
    price: 22.00,
    oldPrice: null,
    rating: 4.5,
    reviews: 54,
    badge: null,
    featured: false,
    description: "Collapsible linen-blend baskets in three nesting sizes, perfect for shelving, wardrobes, or nursery storage. Reinforced base keeps its shape when full.",
    stock: true
  },
  {
    id: 8,
    title: "Smart LED Desk Lamp",
    category: "Tech Gadgets",
    price: 27.50,
    oldPrice: null,
    rating: 4.0,
    reviews: 41,
    badge: "New",
    featured: false,
    description: "Touch-dimmable desk lamp with five brightness levels and three colour temperatures. USB-C port on the base for charging a phone or tablet.",
    stock: true
  },
  {
    id: 9,
    title: "Recycled Cotton Tote Bag",
    category: "Daily Living",
    price: 8.99,
    oldPrice: null,
    rating: 5.0,
    reviews: 189,
    badge: null,
    featured: false,
    description: "A sturdy everyday tote woven from 100% recycled cotton. Reinforced stitched handles, machine washable, folds flat to fit in a bag or glovebox.",
    stock: true
  },
  {
    id: 10,
    title: "Multi-Port USB-C Hub",
    category: "Tech Gadgets",
    price: 21.99,
    oldPrice: null,
    rating: 4.0,
    reviews: 33,
    badge: null,
    featured: false,
    description: "A 6-in-1 aluminium hub adding HDMI, USB-A, SD card, and fast-charge pass-through to any USB-C laptop. Compact enough to leave in a bag full-time.",
    stock: false
  },
];

const SAMPLE_REVIEWS = [
  { name: "Sophie H.", rating: 5, text: "Arrived quickly and looks even better in person than in the photos. Would happily buy again." },
  { name: "Daniel R.", rating: 4, text: "Solid quality for the price. Took a couple of days longer to arrive than expected but no complaints otherwise." },
  { name: "Priya M.", rating: 5, text: "Exactly as described. Packaging was minimal and recyclable which I appreciated." },
];

// Helper: build a deterministic placeholder photo for a product using its id
function productImage(id, size = 600) {
  return `https://picsum.photos/seed/dailybazaar-${id}/${size}/${size}`;
}

// Helper: render a star rating as a compact string, e.g. "★★★★☆"
function renderStars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// Helper: format a number as GBP
function formatGBP(amount) {
  return `£${amount.toFixed(2)}`;
}
