import { db } from "./index";
import {
  users,
  categories,
  products,
  reviews,
  orders,
  orderItems,
} from "./schema";

// ─── Deterministic UUIDs for referential integrity ──────────────

const USER_IDS = {
  admin: "a0000000-0000-4000-8000-000000000001",
  seller: "a0000000-0000-4000-8000-000000000002",
  customer: "a0000000-0000-4000-8000-000000000003",
} as const;

const CATEGORY_IDS = {
  electronics: "c0000000-0000-4000-8000-000000000001",
  clothing: "c0000000-0000-4000-8000-000000000002",
  homeKitchen: "c0000000-0000-4000-8000-000000000003",
  books: "c0000000-0000-4000-8000-000000000004",
  sports: "c0000000-0000-4000-8000-000000000005",
  beauty: "c0000000-0000-4000-8000-000000000006",
} as const;

const PRODUCT_IDS = {
  wirelessHeadphones: "d0000000-0000-4000-8000-000000000001",
  usbcCharger: "d0000000-0000-4000-8000-000000000002",
  mechanicalKeyboard: "d0000000-0000-4000-8000-000000000003",
  cottonTShirt: "d0000000-0000-4000-8000-000000000004",
  denimJacket: "d0000000-0000-4000-8000-000000000005",
  runningShoes: "d0000000-0000-4000-8000-000000000006",
  castiIronSkillet: "d0000000-0000-4000-8000-000000000007",
  coffeeGrinder: "d0000000-0000-4000-8000-000000000008",
  bambooShelf: "d0000000-0000-4000-8000-000000000009",
  smartWatch: "d0000000-0000-4000-8000-00000000000a",
} as const;

const ORDER_IDS = {
  order1: "e0000000-0000-4000-8000-000000000001",
  order2: "e0000000-0000-4000-8000-000000000002",
  order3: "e0000000-0000-4000-8000-000000000003",
} as const;

// Placeholder bcrypt hash for "password123"
// In production, use a real hashing library (e.g., bcrypt, argon2).
const PLACEHOLDER_PASSWORD_HASH =
  "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9mu";

// ─── Seed Data ──────────────────────────────────────────────────

const seedUsers = [
  {
    id: USER_IDS.admin,
    name: "Alice Admin",
    email: "alice@amazone.dev",
    hashedPassword: PLACEHOLDER_PASSWORD_HASH,
    role: "admin" as const,
    createdAt: new Date("2025-01-15T10:00:00Z"),
    updatedAt: new Date("2025-01-15T10:00:00Z"),
  },
  {
    id: USER_IDS.seller,
    name: "Bob Seller",
    email: "bob@amazone.dev",
    hashedPassword: PLACEHOLDER_PASSWORD_HASH,
    role: "seller" as const,
    createdAt: new Date("2025-02-01T12:00:00Z"),
    updatedAt: new Date("2025-02-01T12:00:00Z"),
  },
  {
    id: USER_IDS.customer,
    name: "Carol Customer",
    email: "carol@amazone.dev",
    hashedPassword: PLACEHOLDER_PASSWORD_HASH,
    role: "customer" as const,
    createdAt: new Date("2025-02-15T09:00:00Z"),
    updatedAt: new Date("2025-02-15T09:00:00Z"),
  },
];

const seedCategories = [
  {
    id: CATEGORY_IDS.electronics,
    name: "Electronics",
    slug: "electronics",
    description:
      "Computers, phones, headphones, and other electronic devices and accessories.",
    createdAt: new Date("2025-01-10T08:00:00Z"),
    updatedAt: new Date("2025-01-10T08:00:00Z"),
  },
  {
    id: CATEGORY_IDS.clothing,
    name: "Clothing",
    slug: "clothing",
    description:
      "Apparel for men, women, and children including shirts, jackets, and footwear.",
    createdAt: new Date("2025-01-10T08:00:00Z"),
    updatedAt: new Date("2025-01-10T08:00:00Z"),
  },
  {
    id: CATEGORY_IDS.homeKitchen,
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description:
      "Cookware, furniture, storage, and everything for the modern home.",
    createdAt: new Date("2025-01-10T08:00:00Z"),
    updatedAt: new Date("2025-01-10T08:00:00Z"),
  },
  {
    id: CATEGORY_IDS.books,
    name: "Books",
    slug: "books",
    description:
      "Fiction, non-fiction, textbooks, and more. From bestsellers to hidden gems.",
    createdAt: new Date("2025-01-10T08:00:00Z"),
    updatedAt: new Date("2025-01-10T08:00:00Z"),
  },
  {
    id: CATEGORY_IDS.sports,
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    description:
      "Gear and equipment for fitness, outdoor adventures, and team sports.",
    createdAt: new Date("2025-01-10T08:00:00Z"),
    updatedAt: new Date("2025-01-10T08:00:00Z"),
  },
  {
    id: CATEGORY_IDS.beauty,
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description:
      "Skincare, makeup, haircare, and grooming essentials.",
    createdAt: new Date("2025-01-10T08:00:00Z"),
    updatedAt: new Date("2025-01-10T08:00:00Z"),
  },
];

const seedProducts = [
  // Electronics (4 products)
  {
    id: PRODUCT_IDS.wirelessHeadphones,
    name: "ProSound Wireless Headphones",
    slug: "prosound-wireless-headphones",
    description:
      "Active noise-cancelling over-ear headphones with 30-hour battery life and premium drivers for studio-quality sound.",
    price: 7999,
    compareAtPrice: 12999,
    images: ["https://picsum.photos/seed/headphones/600/600"],
    categoryId: CATEGORY_IDS.electronics,
    sellerId: USER_IDS.seller,
    stock: 150,
    isActive: true,
    isFeatured: true,
    avgRating: 450,
    reviewCount: 2,
    createdAt: new Date("2025-03-01T09:00:00Z"),
    updatedAt: new Date("2025-03-01T09:00:00Z"),
  },
  {
    id: PRODUCT_IDS.usbcCharger,
    name: "UltraCharge 65W USB-C Charger",
    slug: "ultracharge-65w-usbc-charger",
    description:
      "Compact GaN charger with dual USB-C ports. Fast-charges laptops, phones, and tablets simultaneously.",
    price: 3499,
    compareAtPrice: 4999,
    images: ["https://picsum.photos/seed/charger/600/600"],
    categoryId: CATEGORY_IDS.electronics,
    sellerId: USER_IDS.seller,
    stock: 320,
    isActive: true,
    isFeatured: false,
    avgRating: 500,
    reviewCount: 1,
    createdAt: new Date("2025-03-05T11:00:00Z"),
    updatedAt: new Date("2025-03-05T11:00:00Z"),
  },
  {
    id: PRODUCT_IDS.mechanicalKeyboard,
    name: "TypeMaster TKL Mechanical Keyboard",
    slug: "typemaster-tkl-mechanical-keyboard",
    description:
      "Tenkeyless mechanical keyboard with hot-swappable switches, RGB backlighting, and a machined aluminum frame.",
    price: 12900,
    compareAtPrice: null,
    images: ["https://picsum.photos/seed/keyboard/600/600"],
    categoryId: CATEGORY_IDS.electronics,
    sellerId: USER_IDS.admin,
    stock: 75,
    isActive: true,
    isFeatured: true,
    avgRating: 400,
    reviewCount: 1,
    createdAt: new Date("2025-03-10T14:00:00Z"),
    updatedAt: new Date("2025-03-10T14:00:00Z"),
  },
  {
    id: PRODUCT_IDS.smartWatch,
    name: "PulseTrack Smart Watch",
    slug: "pulsetrack-smart-watch",
    description:
      "Fitness-focused smartwatch with heart-rate monitor, GPS, sleep tracking, and 7-day battery life. Water-resistant to 50 meters.",
    price: 19900,
    compareAtPrice: 24900,
    images: ["https://picsum.photos/seed/smartwatch/600/600"],
    categoryId: CATEGORY_IDS.electronics,
    sellerId: USER_IDS.seller,
    stock: 60,
    isActive: true,
    isFeatured: false,
    avgRating: 0,
    reviewCount: 0,
    createdAt: new Date("2025-04-01T10:00:00Z"),
    updatedAt: new Date("2025-04-01T10:00:00Z"),
  },
  // Clothing (3 products)
  {
    id: PRODUCT_IDS.cottonTShirt,
    name: "Essential Cotton Crew T-Shirt",
    slug: "essential-cotton-crew-tshirt",
    description:
      "100% organic cotton t-shirt with a relaxed fit. Pre-shrunk fabric and reinforced collar that holds its shape wash after wash.",
    price: 1999,
    compareAtPrice: 2999,
    images: ["https://picsum.photos/seed/tshirt/600/600"],
    categoryId: CATEGORY_IDS.clothing,
    sellerId: USER_IDS.seller,
    stock: 500,
    isActive: true,
    isFeatured: false,
    avgRating: 350,
    reviewCount: 1,
    createdAt: new Date("2025-03-12T08:00:00Z"),
    updatedAt: new Date("2025-03-12T08:00:00Z"),
  },
  {
    id: PRODUCT_IDS.denimJacket,
    name: "Heritage Denim Jacket",
    slug: "heritage-denim-jacket",
    description:
      "Classic denim jacket crafted from heavyweight selvedge denim. Features copper hardware and a slim-tailored silhouette.",
    price: 8900,
    compareAtPrice: null,
    images: ["https://picsum.photos/seed/denim-jacket/600/600"],
    categoryId: CATEGORY_IDS.clothing,
    sellerId: USER_IDS.admin,
    stock: 40,
    isActive: true,
    isFeatured: true,
    avgRating: 0,
    reviewCount: 0,
    createdAt: new Date("2025-03-18T09:30:00Z"),
    updatedAt: new Date("2025-03-18T09:30:00Z"),
  },
  {
    id: PRODUCT_IDS.runningShoes,
    name: "StrideMax Running Shoes",
    slug: "stridemax-running-shoes",
    description:
      "Lightweight running shoes with responsive foam midsole and engineered mesh upper for breathability. Ideal for daily training.",
    price: 11900,
    compareAtPrice: 14900,
    images: ["https://picsum.photos/seed/running-shoes/600/600"],
    categoryId: CATEGORY_IDS.clothing,
    sellerId: USER_IDS.seller,
    stock: 200,
    isActive: true,
    isFeatured: false,
    avgRating: 0,
    reviewCount: 0,
    createdAt: new Date("2025-03-22T15:00:00Z"),
    updatedAt: new Date("2025-03-22T15:00:00Z"),
  },
  // Home & Kitchen (2 products)
  {
    id: PRODUCT_IDS.castiIronSkillet,
    name: "Heritage Cast Iron Skillet 12-Inch",
    slug: "heritage-cast-iron-skillet-12",
    description:
      "Pre-seasoned 12-inch cast iron skillet with helper handle. Oven-safe to 500 degrees F, suitable for stovetop, grill, and campfire.",
    price: 4499,
    compareAtPrice: 5999,
    images: ["https://picsum.photos/seed/cast-iron/600/600"],
    categoryId: CATEGORY_IDS.homeKitchen,
    sellerId: USER_IDS.admin,
    stock: 90,
    isActive: true,
    isFeatured: false,
    avgRating: 0,
    reviewCount: 0,
    createdAt: new Date("2025-04-02T07:00:00Z"),
    updatedAt: new Date("2025-04-02T07:00:00Z"),
  },
  {
    id: PRODUCT_IDS.coffeeGrinder,
    name: "BrewPerfect Burr Coffee Grinder",
    slug: "brewperfect-burr-coffee-grinder",
    description:
      "Conical burr grinder with 40 grind settings from espresso to French press. Low-noise motor and anti-static technology.",
    price: 6999,
    compareAtPrice: null,
    images: ["https://picsum.photos/seed/coffee-grinder/600/600"],
    categoryId: CATEGORY_IDS.homeKitchen,
    sellerId: USER_IDS.seller,
    stock: 110,
    isActive: true,
    isFeatured: true,
    avgRating: 0,
    reviewCount: 0,
    createdAt: new Date("2025-04-05T12:00:00Z"),
    updatedAt: new Date("2025-04-05T12:00:00Z"),
  },
  {
    id: PRODUCT_IDS.bambooShelf,
    name: "Zenith Bamboo Bookshelf",
    slug: "zenith-bamboo-bookshelf",
    description:
      "Five-tier bamboo bookshelf with adjustable shelves. Sustainable material, easy assembly, and a modern minimalist look.",
    price: 15900,
    compareAtPrice: 19900,
    images: ["https://picsum.photos/seed/bookshelf/600/600"],
    categoryId: CATEGORY_IDS.homeKitchen,
    sellerId: USER_IDS.admin,
    stock: 30,
    isActive: true,
    isFeatured: false,
    avgRating: 0,
    reviewCount: 0,
    createdAt: new Date("2025-04-08T16:00:00Z"),
    updatedAt: new Date("2025-04-08T16:00:00Z"),
  },
];

const seedReviews = [
  {
    userId: USER_IDS.admin,
    productId: PRODUCT_IDS.wirelessHeadphones,
    rating: 5,
    title: "Best headphones I have owned",
    comment:
      "The noise cancellation is incredible. I use these daily for work calls and music. Battery lasts well over the advertised 30 hours.",
    isVerifiedPurchase: true,
    createdAt: new Date("2025-04-10T08:00:00Z"),
    updatedAt: new Date("2025-04-10T08:00:00Z"),
  },
  {
    userId: USER_IDS.seller,
    productId: PRODUCT_IDS.wirelessHeadphones,
    rating: 4,
    title: "Great sound, slightly tight fit",
    comment:
      "Audio quality is outstanding for the price. The clamping force is a bit much for long sessions, but the sound more than makes up for it.",
    isVerifiedPurchase: false,
    createdAt: new Date("2025-04-12T14:30:00Z"),
    updatedAt: new Date("2025-04-12T14:30:00Z"),
  },
  {
    userId: USER_IDS.admin,
    productId: PRODUCT_IDS.usbcCharger,
    rating: 5,
    title: "Tiny but powerful",
    comment:
      "Charges my laptop and phone at the same time with no slowdown. Half the size of my old charger. Highly recommend.",
    isVerifiedPurchase: true,
    createdAt: new Date("2025-04-15T09:00:00Z"),
    updatedAt: new Date("2025-04-15T09:00:00Z"),
  },
  {
    userId: USER_IDS.seller,
    productId: PRODUCT_IDS.mechanicalKeyboard,
    rating: 4,
    title: "Solid build, wish it had more switch options",
    comment:
      "The aluminum frame feels premium. Hot-swap feature works perfectly. Would love to see more switch choices in the future.",
    isVerifiedPurchase: true,
    createdAt: new Date("2025-04-18T11:45:00Z"),
    updatedAt: new Date("2025-04-18T11:45:00Z"),
  },
  {
    userId: USER_IDS.admin,
    productId: PRODUCT_IDS.cottonTShirt,
    rating: 3,
    title: "Decent quality, runs large",
    comment:
      "The cotton is soft and comfortable, but sizing runs about one size large. Order down if you want a true-to-size fit.",
    isVerifiedPurchase: true,
    createdAt: new Date("2025-04-20T17:00:00Z"),
    updatedAt: new Date("2025-04-20T17:00:00Z"),
  },
  {
    userId: USER_IDS.seller,
    productId: PRODUCT_IDS.cottonTShirt,
    rating: 4,
    title: "Good everyday shirt",
    comment:
      "Holds up well after multiple washes. The collar really does keep its shape. Good value for the price.",
    isVerifiedPurchase: false,
    createdAt: new Date("2025-04-22T10:15:00Z"),
    updatedAt: new Date("2025-04-22T10:15:00Z"),
  },
];

const seedOrders = [
  {
    id: ORDER_IDS.order1,
    userId: USER_IDS.admin,
    status: "delivered" as const,
    totalInCents: 11498, // headphones (7999) + charger (3499)
    shippingName: "Alice Admin",
    shippingAddress: "123 Main Street, Apt 4B",
    shippingCity: "San Francisco",
    shippingCountry: "US",
    shippingZip: "94102",
    stripePaymentIntentId: "pi_seed_001",
    stripeSessionId: "cs_seed_001",
    createdAt: new Date("2025-04-08T09:00:00Z"),
    updatedAt: new Date("2025-04-12T15:00:00Z"),
  },
  {
    id: ORDER_IDS.order2,
    userId: USER_IDS.admin,
    status: "shipped" as const,
    totalInCents: 14899, // keyboard (12900) + t-shirt (1999)
    shippingName: "Alice Admin",
    shippingAddress: "123 Main Street, Apt 4B",
    shippingCity: "San Francisco",
    shippingCountry: "US",
    shippingZip: "94102",
    stripePaymentIntentId: "pi_seed_002",
    stripeSessionId: "cs_seed_002",
    createdAt: new Date("2025-04-15T14:00:00Z"),
    updatedAt: new Date("2025-04-17T10:00:00Z"),
  },
  {
    id: ORDER_IDS.order3,
    userId: USER_IDS.seller,
    status: "pending" as const,
    totalInCents: 6999, // coffee grinder
    shippingName: "Bob Seller",
    shippingAddress: "456 Oak Avenue",
    shippingCity: "Austin",
    shippingCountry: "US",
    shippingZip: "73301",
    stripePaymentIntentId: "pi_seed_003",
    stripeSessionId: null,
    createdAt: new Date("2025-04-25T16:00:00Z"),
    updatedAt: new Date("2025-04-25T16:00:00Z"),
  },
];

const seedOrderItems = [
  // Order 1 items
  {
    orderId: ORDER_IDS.order1,
    productId: PRODUCT_IDS.wirelessHeadphones,
    quantity: 1,
    priceInCents: 7999,
    createdAt: new Date("2025-04-08T09:00:00Z"),
  },
  {
    orderId: ORDER_IDS.order1,
    productId: PRODUCT_IDS.usbcCharger,
    quantity: 1,
    priceInCents: 3499,
    createdAt: new Date("2025-04-08T09:00:00Z"),
  },
  // Order 2 items
  {
    orderId: ORDER_IDS.order2,
    productId: PRODUCT_IDS.mechanicalKeyboard,
    quantity: 1,
    priceInCents: 12900,
    createdAt: new Date("2025-04-15T14:00:00Z"),
  },
  {
    orderId: ORDER_IDS.order2,
    productId: PRODUCT_IDS.cottonTShirt,
    quantity: 1,
    priceInCents: 1999,
    createdAt: new Date("2025-04-15T14:00:00Z"),
  },
  // Order 3 items
  {
    orderId: ORDER_IDS.order3,
    productId: PRODUCT_IDS.coffeeGrinder,
    quantity: 1,
    priceInCents: 6999,
    createdAt: new Date("2025-04-25T16:00:00Z"),
  },
];

// ─── Seed Function ──────────────────────────────────────────────

export default async function seed(): Promise<void> {
  console.log("Seeding database...\n");

  // 1. Users
  console.log("  Inserting users...");
  await db.insert(users).values(seedUsers).onConflictDoNothing();

  // 2. Categories
  console.log("  Inserting categories...");
  await db.insert(categories).values(seedCategories).onConflictDoNothing();

  // 3. Products
  console.log("  Inserting products...");
  await db.insert(products).values(seedProducts).onConflictDoNothing();

  // 4. Reviews
  console.log("  Inserting reviews...");
  await db.insert(reviews).values(seedReviews).onConflictDoNothing();

  // 5. Orders
  console.log("  Inserting orders...");
  await db.insert(orders).values(seedOrders).onConflictDoNothing();

  // 6. Order Items
  console.log("  Inserting order items...");
  await db.insert(orderItems).values(seedOrderItems).onConflictDoNothing();

  console.log("\nSeed complete.");
}

// ─── CLI Entrypoint ─────────────────────────────────────────────

// When executed directly via `tsx src/seed.ts`, run the seed function
// and then exit the process so the postgres connection does not hang.
const isDirectExecution =
  typeof import.meta.url === "string" &&
  import.meta.url.endsWith("/seed.ts");

if (isDirectExecution) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
