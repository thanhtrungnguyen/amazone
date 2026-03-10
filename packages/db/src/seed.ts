/**
 * Comprehensive database seed script for the amazone e-commerce platform.
 *
 * Populates ALL tables with realistic development data.
 * Idempotent: truncates all tables (CASCADE) before inserting.
 *
 * Usage:
 *   pnpm --filter @amazone/db seed
 *   pnpm --filter @amazone/db db:seed
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function id(): string {
  return crypto.randomUUID();
}

function daysAgo(days: number): Date {
  const d = new Date("2026-03-10T12:00:00Z");
  d.setDate(d.getDate() - days);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pre-computed bcrypt hash for "password123" (cost 10).
// Using a constant avoids importing bcryptjs as a dependency of @amazone/db.
const BCRYPT_HASH_PASSWORD123 =
  "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9mu";

// ---------------------------------------------------------------------------
// 1. Categories
// ---------------------------------------------------------------------------

const categoryRecords = [
  { id: id(), name: "Electronics", slug: "electronics", description: "Smartphones, laptops, tablets, and other electronic devices" },
  { id: id(), name: "Clothing", slug: "clothing", description: "Men's, women's, and children's apparel" },
  { id: id(), name: "Books", slug: "books", description: "Fiction, non-fiction, textbooks, and more" },
  { id: id(), name: "Home & Kitchen", slug: "home-kitchen", description: "Furniture, appliances, cookware, and home essentials" },
  { id: id(), name: "Sports & Outdoors", slug: "sports-outdoors", description: "Fitness equipment, outdoor gear, and sporting goods" },
  { id: id(), name: "Beauty & Personal Care", slug: "beauty-personal-care", description: "Skincare, makeup, haircare, and grooming products" },
  { id: id(), name: "Toys & Games", slug: "toys-games", description: "Toys, board games, puzzles, and kids' entertainment" },
  { id: id(), name: "Automotive", slug: "automotive", description: "Car accessories, parts, tools, and maintenance supplies" },
  { id: id(), name: "Office Supplies", slug: "office-supplies", description: "Stationery, printers, desk organizers, and office furniture" },
  { id: id(), name: "Pet Supplies", slug: "pet-supplies", description: "Food, toys, grooming, and healthcare for pets" },
];

function catId(slug: string): string {
  return categoryRecords.find((c) => c.slug === slug)!.id;
}

// ---------------------------------------------------------------------------
// 2. Users
// ---------------------------------------------------------------------------

interface UserSeed {
  id: string;
  name: string;
  email: string;
  role: "admin" | "seller" | "customer";
}

const userRecords: UserSeed[] = [
  // 2 admins
  { id: id(), name: "Alice Admin", email: "admin@amazone.com", role: "admin" },
  { id: id(), name: "Sarah Admin", email: "admin2@amazone.com", role: "admin" },
  // 5 sellers
  { id: id(), name: "TechWorld Store", email: "seller1@amazone.com", role: "seller" },
  { id: id(), name: "Fashion Hub", email: "seller2@amazone.com", role: "seller" },
  { id: id(), name: "BookNook", email: "seller3@amazone.com", role: "seller" },
  { id: id(), name: "HomeStyle Living", email: "seller4@amazone.com", role: "seller" },
  { id: id(), name: "SportsPeak", email: "seller5@amazone.com", role: "seller" },
  // 11 customers
  { id: id(), name: "John Doe", email: "john@example.com", role: "customer" },
  { id: id(), name: "Jane Smith", email: "jane@example.com", role: "customer" },
  { id: id(), name: "Bob Wilson", email: "bob@example.com", role: "customer" },
  { id: id(), name: "Alice Johnson", email: "alice@example.com", role: "customer" },
  { id: id(), name: "Charlie Brown", email: "charlie@example.com", role: "customer" },
  { id: id(), name: "Diana Prince", email: "diana@example.com", role: "customer" },
  { id: id(), name: "Edward Norton", email: "edward@example.com", role: "customer" },
  { id: id(), name: "Fiona Green", email: "fiona@example.com", role: "customer" },
  { id: id(), name: "George Kim", email: "george@example.com", role: "customer" },
  { id: id(), name: "Hannah Lee", email: "hannah@example.com", role: "customer" },
  { id: id(), name: "Ivan Petrov", email: "ivan@example.com", role: "customer" },
];

function userId(email: string): string {
  return userRecords.find((u) => u.email === email)!.id;
}

const sellers = userRecords.filter((u) => u.role === "seller");
const customers = userRecords.filter((u) => u.role === "customer");

// ---------------------------------------------------------------------------
// 3. Products
// ---------------------------------------------------------------------------

interface ProductSeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  categorySlug: string;
  sellerEmail: string;
  stock: number;
  isFeatured: boolean;
  images: string[];
}

const productRecords: ProductSeed[] = [
  // ── Electronics (seller1) ──────────────────────────────────────
  { id: id(), name: "Ultra Slim Laptop 15 Pro", slug: "ultra-slim-laptop-15-pro", description: "Powerful 15-inch laptop with M3 chip, 16GB RAM, 512GB SSD. Perfect for professionals and creatives who need performance on the go.", price: 129999, compareAtPrice: 149999, categorySlug: "electronics", sellerEmail: "seller1@amazone.com", stock: 45, isFeatured: true, images: ["https://picsum.photos/seed/laptop/600/600"] },
  { id: id(), name: "Wireless Noise-Cancelling Headphones", slug: "wireless-noise-cancelling-headphones", description: "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Comfortable memory foam ear cushions.", price: 24999, compareAtPrice: 29999, categorySlug: "electronics", sellerEmail: "seller1@amazone.com", stock: 120, isFeatured: true, images: ["https://picsum.photos/seed/headphones/600/600"] },
  { id: id(), name: "Smart 4K OLED TV 55 Inch", slug: "smart-4k-oled-tv-55", description: "55-inch OLED display with Dolby Vision, HDR10+, built-in streaming apps, and voice assistant. Stunning picture quality for movies and gaming.", price: 89999, compareAtPrice: 109999, categorySlug: "electronics", sellerEmail: "seller1@amazone.com", stock: 18, isFeatured: true, images: ["https://picsum.photos/seed/tv/600/600"] },
  { id: id(), name: "Smartphone X14 128GB", slug: "smartphone-x14-128gb", description: "Flagship smartphone with 6.7-inch AMOLED display, triple camera system, 5G connectivity, and all-day battery life.", price: 79999, compareAtPrice: null, categorySlug: "electronics", sellerEmail: "seller1@amazone.com", stock: 200, isFeatured: false, images: ["https://picsum.photos/seed/phone/600/600"] },
  { id: id(), name: "Portable Bluetooth Speaker", slug: "portable-bluetooth-speaker", description: "Waterproof portable speaker with 360-degree sound, 20-hour playtime, and built-in microphone for calls.", price: 4999, compareAtPrice: 6999, categorySlug: "electronics", sellerEmail: "seller1@amazone.com", stock: 300, isFeatured: false, images: ["https://picsum.photos/seed/speaker/600/600"] },
  { id: id(), name: "USB-C Hub 7-in-1", slug: "usb-c-hub-7-in-1", description: "Multi-port adapter with HDMI 4K, USB 3.0 ports, SD card reader, and 100W power delivery passthrough.", price: 3499, compareAtPrice: null, categorySlug: "electronics", sellerEmail: "seller1@amazone.com", stock: 2, isFeatured: false, images: ["https://picsum.photos/seed/hub/600/600"] },
  { id: id(), name: "Wireless Charging Pad", slug: "wireless-charging-pad", description: "Fast 15W wireless charger compatible with all Qi-enabled devices. Sleek, minimal design with LED indicator.", price: 1999, compareAtPrice: 2499, categorySlug: "electronics", sellerEmail: "seller1@amazone.com", stock: 0, isFeatured: false, images: ["https://picsum.photos/seed/charger/600/600"] },

  // ── Clothing (seller2) ─────────────────────────────────────────
  { id: id(), name: "Classic Fit Cotton T-Shirt", slug: "classic-fit-cotton-tshirt", description: "100% organic cotton crew-neck t-shirt. Pre-shrunk fabric, reinforced seams. Available in multiple colors.", price: 1999, compareAtPrice: null, categorySlug: "clothing", sellerEmail: "seller2@amazone.com", stock: 500, isFeatured: false, images: ["https://picsum.photos/seed/tshirt/600/600"] },
  { id: id(), name: "Slim Fit Denim Jeans", slug: "slim-fit-denim-jeans", description: "Premium stretch denim with a modern slim fit. Mid-rise waist, five-pocket design, and comfortable all-day wear.", price: 5999, compareAtPrice: 7999, categorySlug: "clothing", sellerEmail: "seller2@amazone.com", stock: 150, isFeatured: true, images: ["https://picsum.photos/seed/jeans/600/600"] },
  { id: id(), name: "Merino Wool Sweater", slug: "merino-wool-sweater", description: "Luxuriously soft merino wool pullover sweater. Temperature regulating, moisture-wicking, and wrinkle-resistant.", price: 8999, compareAtPrice: 11999, categorySlug: "clothing", sellerEmail: "seller2@amazone.com", stock: 75, isFeatured: false, images: ["https://picsum.photos/seed/sweater/600/600"] },
  { id: id(), name: "Waterproof Rain Jacket", slug: "waterproof-rain-jacket", description: "Lightweight, breathable rain jacket with sealed seams, adjustable hood, and zippered pockets. Packs into its own pocket.", price: 6999, compareAtPrice: null, categorySlug: "clothing", sellerEmail: "seller2@amazone.com", stock: 90, isFeatured: false, images: ["https://picsum.photos/seed/jacket/600/600"] },
  { id: id(), name: "Running Sneakers V2", slug: "running-sneakers-v2", description: "Engineered mesh upper with responsive foam cushioning. Lightweight, breathable, with excellent arch support for daily runs.", price: 11999, compareAtPrice: 14999, categorySlug: "clothing", sellerEmail: "seller2@amazone.com", stock: 3, isFeatured: true, images: ["https://picsum.photos/seed/sneakers/600/600"] },

  // ── Books (seller3) ────────────────────────────────────────────
  { id: id(), name: "The Art of Clean Code", slug: "the-art-of-clean-code", description: "A comprehensive guide to writing maintainable, scalable, and elegant code. Covers patterns, principles, and practical examples in multiple languages.", price: 3499, compareAtPrice: null, categorySlug: "books", sellerEmail: "seller3@amazone.com", stock: 400, isFeatured: true, images: ["https://picsum.photos/seed/book1/600/600"] },
  { id: id(), name: "Midnight in the Garden of Data", slug: "midnight-garden-data", description: "A gripping techno-thriller about a data scientist who uncovers a conspiracy hidden in public datasets. Page-turner with real technical details.", price: 1499, compareAtPrice: 1999, categorySlug: "books", sellerEmail: "seller3@amazone.com", stock: 250, isFeatured: false, images: ["https://picsum.photos/seed/book2/600/600"] },
  { id: id(), name: "Cooking for Engineers", slug: "cooking-for-engineers", description: "Approach cooking like an engineering problem. Learn the science behind techniques, optimal workflows, and precision recipes.", price: 2999, compareAtPrice: null, categorySlug: "books", sellerEmail: "seller3@amazone.com", stock: 180, isFeatured: false, images: ["https://picsum.photos/seed/book3/600/600"] },
  { id: id(), name: "The History of Everything", slug: "the-history-of-everything", description: "An illustrated journey from the Big Bang to the present day. Beautifully designed with infographics, timelines, and engaging narrative.", price: 4499, compareAtPrice: 5499, categorySlug: "books", sellerEmail: "seller3@amazone.com", stock: 60, isFeatured: false, images: ["https://picsum.photos/seed/book4/600/600"] },
  { id: id(), name: "Children's Bedtime Stories Collection", slug: "childrens-bedtime-stories", description: "50 beautifully illustrated bedtime stories for children ages 3-8. Gentle tales about kindness, courage, and curiosity.", price: 1999, compareAtPrice: null, categorySlug: "books", sellerEmail: "seller3@amazone.com", stock: 1, isFeatured: false, images: ["https://picsum.photos/seed/book5/600/600"] },

  // ── Home & Kitchen (seller4) ───────────────────────────────────
  { id: id(), name: "Professional Chef Knife Set", slug: "professional-chef-knife-set", description: "8-piece German stainless steel knife set with ergonomic handles and wooden block. Includes chef, bread, utility, paring, steak knives, and shears.", price: 14999, compareAtPrice: 19999, categorySlug: "home-kitchen", sellerEmail: "seller4@amazone.com", stock: 35, isFeatured: true, images: ["https://picsum.photos/seed/knives/600/600"] },
  { id: id(), name: "Non-Stick Cookware Set 12-Piece", slug: "nonstick-cookware-set-12", description: "Complete cookware set with ceramic non-stick coating. Includes fry pans, saucepans, stockpot, and lids. Oven safe to 450F.", price: 12999, compareAtPrice: 16999, categorySlug: "home-kitchen", sellerEmail: "seller4@amazone.com", stock: 50, isFeatured: false, images: ["https://picsum.photos/seed/cookware/600/600"] },
  { id: id(), name: "Smart Robot Vacuum Cleaner", slug: "smart-robot-vacuum", description: "Wi-Fi connected robot vacuum with LiDAR navigation, 2500Pa suction, self-emptying base, and app control.", price: 34999, compareAtPrice: 44999, categorySlug: "home-kitchen", sellerEmail: "seller4@amazone.com", stock: 0, isFeatured: true, images: ["https://picsum.photos/seed/vacuum/600/600"] },
  { id: id(), name: "Bamboo Cutting Board Set", slug: "bamboo-cutting-board-set", description: "Set of 3 organic bamboo cutting boards in different sizes. Antimicrobial, knife-friendly, with juice grooves and easy-grip handles.", price: 2499, compareAtPrice: null, categorySlug: "home-kitchen", sellerEmail: "seller4@amazone.com", stock: 200, isFeatured: false, images: ["https://picsum.photos/seed/cuttingboard/600/600"] },
  { id: id(), name: "Stainless Steel French Press", slug: "stainless-steel-french-press", description: "Double-wall insulated French press coffee maker. Keeps coffee hot for hours. 34oz capacity with four-level filtration system.", price: 3999, compareAtPrice: 4999, categorySlug: "home-kitchen", sellerEmail: "seller4@amazone.com", stock: 85, isFeatured: false, images: ["https://picsum.photos/seed/frenchpress/600/600"] },
  { id: id(), name: "LED Desk Lamp with Wireless Charger", slug: "led-desk-lamp-wireless-charger", description: "Adjustable LED desk lamp with 5 color temperatures, brightness levels, USB port, and built-in 10W wireless charging pad.", price: 4999, compareAtPrice: 5999, categorySlug: "home-kitchen", sellerEmail: "seller4@amazone.com", stock: 4, isFeatured: false, images: ["https://picsum.photos/seed/desklamp/600/600"] },

  // ── Sports & Outdoors (seller5) ────────────────────────────────
  { id: id(), name: "Adjustable Dumbbell Set 50lb", slug: "adjustable-dumbbell-set-50lb", description: "Quick-change adjustable dumbbells from 5 to 50 lbs each. Replace 15 sets of weights. Compact design for home gyms.", price: 29999, compareAtPrice: 34999, categorySlug: "sports-outdoors", sellerEmail: "seller5@amazone.com", stock: 25, isFeatured: true, images: ["https://picsum.photos/seed/dumbbells/600/600"] },
  { id: id(), name: "Yoga Mat Premium 6mm", slug: "yoga-mat-premium-6mm", description: "Extra-thick 6mm eco-friendly yoga mat with alignment lines. Non-slip surface, carrying strap included. 72 x 24 inches.", price: 3999, compareAtPrice: null, categorySlug: "sports-outdoors", sellerEmail: "seller5@amazone.com", stock: 150, isFeatured: false, images: ["https://picsum.photos/seed/yogamat/600/600"] },
  { id: id(), name: "Camping Tent 4-Person", slug: "camping-tent-4-person", description: "Waterproof dome tent with full-coverage rainfly, mesh windows, and gear loft. Sets up in under 10 minutes. 3-season rated.", price: 17999, compareAtPrice: 22999, categorySlug: "sports-outdoors", sellerEmail: "seller5@amazone.com", stock: 15, isFeatured: false, images: ["https://picsum.photos/seed/tent/600/600"] },
  { id: id(), name: "Insulated Water Bottle 32oz", slug: "insulated-water-bottle-32oz", description: "Vacuum-insulated stainless steel water bottle. Keeps drinks cold 24 hours or hot 12 hours. BPA-free, leak-proof lid.", price: 2499, compareAtPrice: null, categorySlug: "sports-outdoors", sellerEmail: "seller5@amazone.com", stock: 350, isFeatured: false, images: ["https://picsum.photos/seed/waterbottle/600/600"] },
  { id: id(), name: "Resistance Bands Set", slug: "resistance-bands-set", description: "Set of 5 fabric resistance bands with different resistance levels. Includes carrying bag, exercise guide, and door anchor.", price: 1999, compareAtPrice: 2999, categorySlug: "sports-outdoors", sellerEmail: "seller5@amazone.com", stock: 0, isFeatured: false, images: ["https://picsum.photos/seed/bands/600/600"] },

  // ── Beauty & Personal Care (seller2 + seller1) ─────────────────
  { id: id(), name: "Vitamin C Brightening Serum", slug: "vitamin-c-brightening-serum", description: "20% Vitamin C serum with hyaluronic acid and vitamin E. Brightens skin, reduces dark spots, and boosts collagen production.", price: 2499, compareAtPrice: 3499, categorySlug: "beauty-personal-care", sellerEmail: "seller2@amazone.com", stock: 180, isFeatured: false, images: ["https://picsum.photos/seed/serum/600/600"] },
  { id: id(), name: "Electric Toothbrush Pro", slug: "electric-toothbrush-pro", description: "Sonic electric toothbrush with 5 cleaning modes, pressure sensor, 2-minute timer, and 30-day battery life. Includes 3 brush heads.", price: 6999, compareAtPrice: 8999, categorySlug: "beauty-personal-care", sellerEmail: "seller1@amazone.com", stock: 95, isFeatured: false, images: ["https://picsum.photos/seed/toothbrush/600/600"] },
  { id: id(), name: "Hair Dryer with Ionic Technology", slug: "hair-dryer-ionic", description: "Professional-grade hair dryer with ionic technology for frizz-free results. 3 heat settings, 2 speed settings, concentrator and diffuser attachments.", price: 5999, compareAtPrice: null, categorySlug: "beauty-personal-care", sellerEmail: "seller2@amazone.com", stock: 5, isFeatured: false, images: ["https://picsum.photos/seed/hairdryer/600/600"] },

  // ── Toys & Games (seller3) ─────────────────────────────────────
  { id: id(), name: "Building Blocks 1000-Piece Set", slug: "building-blocks-1000-piece", description: "Compatible building blocks mega set with 1000 pieces in 15 colors. Includes baseplates, wheels, windows, and idea booklet. Ages 4+.", price: 3499, compareAtPrice: 4499, categorySlug: "toys-games", sellerEmail: "seller3@amazone.com", stock: 100, isFeatured: false, images: ["https://picsum.photos/seed/blocks/600/600"] },
  { id: id(), name: "Strategy Board Game: Kingdoms", slug: "strategy-board-game-kingdoms", description: "Epic strategy board game for 2-6 players. Build your kingdom, manage resources, and outmaneuver opponents. Average game: 90 minutes.", price: 4999, compareAtPrice: null, categorySlug: "toys-games", sellerEmail: "seller3@amazone.com", stock: 45, isFeatured: true, images: ["https://picsum.photos/seed/boardgame/600/600"] },
  { id: id(), name: "Remote Control Racing Car", slug: "rc-racing-car", description: "High-speed RC car with 2.4GHz remote control, rechargeable battery, all-terrain tires. Top speed 25 mph. Ages 8+.", price: 3999, compareAtPrice: 5499, categorySlug: "toys-games", sellerEmail: "seller3@amazone.com", stock: 60, isFeatured: false, images: ["https://picsum.photos/seed/rccar/600/600"] },

  // ── Automotive (seller5) ───────────────────────────────────────
  { id: id(), name: "Dash Cam 4K Front and Rear", slug: "dash-cam-4k-front-rear", description: "Dual dash cam system with 4K front and 1080p rear cameras. Night vision, GPS tracking, parking mode, and 128GB storage support.", price: 12999, compareAtPrice: 15999, categorySlug: "automotive", sellerEmail: "seller5@amazone.com", stock: 40, isFeatured: false, images: ["https://picsum.photos/seed/dashcam/600/600"] },
  { id: id(), name: "Car Phone Mount Magnetic", slug: "car-phone-mount-magnetic", description: "Universal magnetic phone mount for car dashboard and air vent. Strong N52 magnets, 360-degree rotation, one-hand operation.", price: 1499, compareAtPrice: null, categorySlug: "automotive", sellerEmail: "seller5@amazone.com", stock: 500, isFeatured: false, images: ["https://picsum.photos/seed/carmount/600/600"] },

  // ── Office Supplies (seller4 + seller1) ────────────────────────
  { id: id(), name: "Ergonomic Office Chair", slug: "ergonomic-office-chair", description: "Adjustable ergonomic mesh chair with lumbar support, headrest, 4D armrests, and breathable mesh back. Supports up to 300 lbs.", price: 39999, compareAtPrice: 49999, categorySlug: "office-supplies", sellerEmail: "seller4@amazone.com", stock: 20, isFeatured: true, images: ["https://picsum.photos/seed/officechair/600/600"] },
  { id: id(), name: "Mechanical Keyboard RGB", slug: "mechanical-keyboard-rgb", description: "Compact mechanical keyboard with hot-swappable switches, per-key RGB lighting, PBT keycaps, and USB-C connection.", price: 8999, compareAtPrice: null, categorySlug: "office-supplies", sellerEmail: "seller1@amazone.com", stock: 65, isFeatured: false, images: ["https://picsum.photos/seed/mechkeyboard/600/600"] },
  { id: id(), name: "Standing Desk Converter", slug: "standing-desk-converter", description: "Height-adjustable standing desk converter. Fits on existing desk, holds two monitors. Smooth gas-spring lift with 15 height positions.", price: 19999, compareAtPrice: 24999, categorySlug: "office-supplies", sellerEmail: "seller4@amazone.com", stock: 12, isFeatured: false, images: ["https://picsum.photos/seed/standingdesk/600/600"] },

  // ── Pet Supplies (seller4) ─────────────────────────────────────
  { id: id(), name: "Automatic Pet Feeder", slug: "automatic-pet-feeder", description: "Programmable pet feeder with 6L capacity, Wi-Fi connectivity, portion control, and voice recording. Schedule up to 6 meals per day.", price: 6999, compareAtPrice: 8999, categorySlug: "pet-supplies", sellerEmail: "seller4@amazone.com", stock: 30, isFeatured: false, images: ["https://picsum.photos/seed/petfeeder/600/600"] },
  { id: id(), name: "Orthopedic Dog Bed Large", slug: "orthopedic-dog-bed-large", description: "Memory foam dog bed with waterproof liner and removable, machine-washable cover. Supportive bolster edges. For dogs up to 90 lbs.", price: 5999, compareAtPrice: null, categorySlug: "pet-supplies", sellerEmail: "seller4@amazone.com", stock: 55, isFeatured: false, images: ["https://picsum.photos/seed/dogbed/600/600"] },
  { id: id(), name: "Interactive Cat Toy Laser", slug: "interactive-cat-toy-laser", description: "Automatic laser toy with random patterns to keep cats entertained. Timer settings, adjustable speed, and silent motor. USB rechargeable.", price: 1999, compareAtPrice: 2499, categorySlug: "pet-supplies", sellerEmail: "seller4@amazone.com", stock: 0, isFeatured: false, images: ["https://picsum.photos/seed/cattoy/600/600"] },
];

// ---------------------------------------------------------------------------
// Review templates
// ---------------------------------------------------------------------------

const reviewTemplates = [
  { rating: 5, title: "Absolutely love it!", comment: "This exceeded all my expectations. The quality is outstanding and it arrived quickly. Highly recommend to anyone considering this purchase." },
  { rating: 5, title: "Best purchase this year", comment: "I've been using this for a few weeks now and it's been amazing. Great value for the price." },
  { rating: 5, title: "Perfect quality", comment: "Exactly as described. The build quality is excellent and it works perfectly out of the box." },
  { rating: 5, title: "Would buy again", comment: "So happy with this purchase. Already recommended it to friends and family." },
  { rating: 5, title: "Exceeds expectations", comment: "I was skeptical at first but this product truly delivers. Excellent craftsmanship and attention to detail." },
  { rating: 4, title: "Very good, minor issues", comment: "Overall great product. The only reason I'm not giving 5 stars is the packaging could be better, but the product itself is solid." },
  { rating: 4, title: "Great value", comment: "Does exactly what it's supposed to do. Good quality for the price point. Shipping was fast." },
  { rating: 4, title: "Impressed overall", comment: "Really nice product. A small improvement in the instructions would make it perfect, but I figured it out easily enough." },
  { rating: 4, title: "Solid purchase", comment: "Happy with this buy. It's well-made and functional. The color is slightly different from the photos but still looks good." },
  { rating: 4, title: "Almost perfect", comment: "Great product overall. Lost one star because the packaging was a bit damaged on arrival, but the product inside was fine." },
  { rating: 3, title: "It's okay", comment: "Decent product for the price. Nothing special but gets the job done. Would be nice if it had a few more features." },
  { rating: 3, title: "Average quality", comment: "Not bad, not great. The materials feel a bit cheap compared to the photos, but it functions as expected." },
  { rating: 3, title: "Mixed feelings", comment: "Some aspects are good, others not so much. The core functionality works but the finish could be better." },
  { rating: 2, title: "Disappointed", comment: "Expected better quality based on the description. It works but feels flimsy. Might return it." },
  { rating: 2, title: "Not as described", comment: "The product looks different from the images. It works but I expected more for this price." },
  { rating: 1, title: "Returned immediately", comment: "Arrived damaged and didn't work properly. Very disappointed with the quality. Save your money." },
  { rating: 1, title: "Waste of money", comment: "Broke within a week of use. Customer service was unhelpful. Would not recommend." },
];

// ---------------------------------------------------------------------------
// Q&A templates
// ---------------------------------------------------------------------------

const questionTemplates = [
  "Is this product compatible with older models?",
  "What is the warranty period for this item?",
  "Can you ship this internationally?",
  "Does this come with batteries included?",
  "What are the exact dimensions of this product?",
  "Is this product suitable for professional use?",
  "How long does the battery last with regular use?",
  "Is this item available in other colors?",
  "Can I get a replacement if it arrives damaged?",
  "What material is this made from?",
  "Is this product eco-friendly or sustainably sourced?",
  "Does this work with a standard US power outlet?",
  "How difficult is the assembly process?",
  "Is this safe for children under 5?",
  "What is the weight including packaging?",
  "Do you offer bulk pricing for orders over 10 units?",
  "Has the design changed from the previous version?",
  "Is the sizing true to standard measurements?",
  "Can this be used outdoors in wet conditions?",
  "What is the return policy for this product?",
];

const answerTemplates = [
  "Yes, this is fully compatible with all previous models going back 3 years.",
  "The warranty covers 2 years from the date of purchase for manufacturing defects.",
  "We ship to most countries worldwide. Delivery typically takes 7-14 business days for international orders.",
  "Yes, batteries are included in the package along with a quick-start guide.",
  "The exact dimensions are listed in the product specifications section below the description.",
  "Absolutely, this is designed for both professional and home use.",
  "With regular daily use, you can expect the battery to last about 2-3 weeks between charges.",
  "Currently available in Black, White, and Navy Blue. We plan to add more colors soon.",
  "Yes, our return policy covers damaged items. Please contact support within 30 days of receiving your order.",
  "This is made from premium-grade materials. Check the product specs for detailed material composition.",
  "We use sustainable materials and eco-friendly packaging wherever possible.",
  "Yes, it works with standard 110V US outlets. An adapter is included for international use.",
  "Assembly takes about 15-20 minutes with basic tools. Video instructions are available on our website.",
  "This is recommended for ages 8 and up due to small parts.",
  "The total shipping weight including packaging is approximately 2.5 lbs.",
];

// ---------------------------------------------------------------------------
// Shipping address pool
// ---------------------------------------------------------------------------

const addressPool = [
  { name: "John Doe", address: "123 Main St", city: "New York", state: "NY", country: "US", zip: "10001" },
  { name: "Jane Smith", address: "456 Oak Avenue", city: "Los Angeles", state: "CA", country: "US", zip: "90001" },
  { name: "Bob Wilson", address: "789 Pine Road", city: "Chicago", state: "IL", country: "US", zip: "60601" },
  { name: "Alice Johnson", address: "321 Elm Street", city: "Houston", state: "TX", country: "US", zip: "77001" },
  { name: "Charlie Brown", address: "654 Maple Drive", city: "Phoenix", state: "AZ", country: "US", zip: "85001" },
  { name: "Diana Prince", address: "987 Cedar Lane", city: "Philadelphia", state: "PA", country: "US", zip: "19101" },
  { name: "Edward Norton", address: "147 Birch Court", city: "San Antonio", state: "TX", country: "US", zip: "78201" },
  { name: "Fiona Green", address: "258 Walnut Way", city: "San Diego", state: "CA", country: "US", zip: "92101" },
  { name: "George Kim", address: "369 Spruce Blvd", city: "Dallas", state: "TX", country: "US", zip: "75201" },
  { name: "Hannah Lee", address: "480 Willow Place", city: "Seattle", state: "WA", country: "US", zip: "98101" },
  { name: "Ivan Petrov", address: "591 Aspen Circle", city: "Denver", state: "CO", country: "US", zip: "80201" },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  console.log("=== Amazone Database Seed ===\n");

  // ── Truncate all tables ────────────────────────────────────────
  console.log("[1/14] Clearing existing data...");
  await db.execute(sql`
    TRUNCATE TABLE
      answer_helpful_votes,
      product_answers,
      product_questions,
      order_coupons,
      return_requests,
      order_items,
      orders,
      reviews,
      wishlists,
      cart_items,
      products,
      categories,
      coupons,
      stripe_webhook_events,
      users
    CASCADE
  `);
  console.log("        All tables truncated.\n");

  // ── Categories ─────────────────────────────────────────────────
  console.log("[2/14] Seeding categories...");
  await db.insert(schema.categories).values(
    categoryRecords.map((c) => ({
      ...c,
      createdAt: daysAgo(180),
      updatedAt: daysAgo(30),
    }))
  );
  console.log(`        Inserted ${categoryRecords.length} categories.\n`);

  // ── Users ──────────────────────────────────────────────────────
  console.log("[3/14] Seeding users...");
  await db.insert(schema.users).values(
    userRecords.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      hashedPassword: BCRYPT_HASH_PASSWORD123,
      emailVerified: daysAgo(randomInt(30, 365)),
      image: null,
      notificationPreferences: {
        orderUpdates: true,
        shippingUpdates: true,
        promotions: u.role === "customer",
      },
      createdAt: daysAgo(randomInt(90, 365)),
      updatedAt: daysAgo(randomInt(1, 30)),
    }))
  );
  console.log(`        Inserted ${userRecords.length} users.\n`);

  // ── Products ───────────────────────────────────────────────────
  console.log("[4/14] Seeding products...");
  const productDbRows = productRecords.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    categoryId: catId(p.categorySlug),
    sellerId: userId(p.sellerEmail),
    images: p.images,
    stock: p.stock,
    isActive: true,
    isFeatured: p.isFeatured,
    avgRating: 0,
    reviewCount: 0,
    createdAt: daysAgo(randomInt(30, 150)),
    updatedAt: daysAgo(randomInt(1, 20)),
  }));
  await db.insert(schema.products).values(productDbRows);
  console.log(`        Inserted ${productDbRows.length} products.\n`);

  // ── Reviews ────────────────────────────────────────────────────
  console.log("[5/14] Seeding reviews...");

  type ReviewRow = {
    id: string;
    userId: string;
    productId: string;
    rating: number;
    title: string;
    comment: string;
    isVerifiedPurchase: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  const reviewRows: ReviewRow[] = [];
  const reviewPairs = new Set<string>();

  // Give each product 0-4 reviews
  for (const product of productRecords) {
    const n = randomInt(0, 4);
    const reviewers = pickN(customers, Math.min(n, customers.length));
    for (const reviewer of reviewers) {
      const key = `${reviewer.id}:${product.id}`;
      if (reviewPairs.has(key)) continue;
      reviewPairs.add(key);
      const t = pick(reviewTemplates);
      reviewRows.push({
        id: id(),
        userId: reviewer.id,
        productId: product.id,
        rating: t.rating,
        title: t.title,
        comment: t.comment,
        isVerifiedPurchase: Math.random() > 0.3,
        createdAt: daysAgo(randomInt(1, 90)),
        updatedAt: daysAgo(randomInt(0, 10)),
      });
    }
  }

  // Pad to at least 70 reviews
  while (reviewRows.length < 70) {
    const product = pick(productRecords);
    const reviewer = pick(customers);
    const key = `${reviewer.id}:${product.id}`;
    if (reviewPairs.has(key)) continue;
    reviewPairs.add(key);
    const t = pick(reviewTemplates);
    reviewRows.push({
      id: id(),
      userId: reviewer.id,
      productId: product.id,
      rating: t.rating,
      title: t.title,
      comment: t.comment,
      isVerifiedPurchase: Math.random() > 0.3,
      createdAt: daysAgo(randomInt(1, 90)),
      updatedAt: daysAgo(randomInt(0, 10)),
    });
  }

  for (let i = 0; i < reviewRows.length; i += 50) {
    await db.insert(schema.reviews).values(reviewRows.slice(i, i + 50));
  }
  console.log(`        Inserted ${reviewRows.length} reviews.\n`);

  // ── Update product rating aggregates ───────────────────────────
  console.log("[6/14] Updating product rating aggregates...");
  const ratingMap: Record<string, { sum: number; count: number }> = {};
  for (const r of reviewRows) {
    if (!ratingMap[r.productId]) ratingMap[r.productId] = { sum: 0, count: 0 };
    ratingMap[r.productId].sum += r.rating;
    ratingMap[r.productId].count += 1;
  }
  for (const [productId, { sum, count }] of Object.entries(ratingMap)) {
    const avg = Math.round((sum / count) * 100);
    await db
      .update(schema.products)
      .set({ avgRating: avg, reviewCount: count })
      .where(sql`${schema.products.id} = ${productId}`);
  }
  console.log(`        Updated ratings for ${Object.keys(ratingMap).length} products.\n`);

  // ── Orders ─────────────────────────────────────────────────────
  console.log("[7/14] Seeding orders...");
  const orderStatuses = [
    "pending", "confirmed", "processing", "shipped",
    "delivered", "delivered", "delivered", "delivered",
    "cancelled", "return_requested",
  ] as const;

  type OrderRow = {
    id: string;
    userId: string;
    status: (typeof orderStatuses)[number];
    totalInCents: number;
    shippingName: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingCountry: string;
    shippingZip: string;
    stripePaymentIntentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type OrderItemRow = {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    priceInCents: number;
    createdAt: Date;
  };

  const orderRows: OrderRow[] = [];
  const orderItemRows: OrderItemRow[] = [];

  for (let i = 0; i < 35; i++) {
    const customer = pick(customers);
    const addr = addressPool.find((a) => a.name === customer.name) ?? pick(addressPool);
    const status = pick(orderStatuses);
    const orderId = id();
    const numItems = randomInt(1, 4);
    const chosenProducts = pickN(productRecords, numItems);
    let orderTotal = 0;

    for (const prod of chosenProducts) {
      const qty = randomInt(1, 3);
      orderTotal += prod.price * qty;
      orderItemRows.push({
        id: id(),
        orderId,
        productId: prod.id,
        quantity: qty,
        priceInCents: prod.price,
        createdAt: daysAgo(randomInt(1, 60)),
      });
    }

    const createdDays = randomInt(1, 90);
    orderRows.push({
      id: orderId,
      userId: customer.id,
      status,
      totalInCents: orderTotal,
      shippingName: addr.name,
      shippingAddress: addr.address,
      shippingCity: addr.city,
      shippingState: addr.state,
      shippingCountry: addr.country,
      shippingZip: addr.zip,
      stripePaymentIntentId: status !== "pending" ? `pi_seed_${orderId.slice(0, 8)}` : null,
      createdAt: daysAgo(createdDays),
      updatedAt: daysAgo(Math.max(0, createdDays - randomInt(0, 10))),
    });
  }

  await db.insert(schema.orders).values(orderRows);
  console.log(`        Inserted ${orderRows.length} orders.\n`);

  // ── Order Items ────────────────────────────────────────────────
  console.log("[8/14] Seeding order items...");
  for (let i = 0; i < orderItemRows.length; i += 50) {
    await db.insert(schema.orderItems).values(orderItemRows.slice(i, i + 50));
  }
  console.log(`        Inserted ${orderItemRows.length} order items.\n`);

  // ── Cart Items ─────────────────────────────────────────────────
  console.log("[9/14] Seeding cart items...");
  const cartPairs = new Set<string>();
  const cartRows: Array<{
    id: string;
    userId: string;
    productId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (let i = 0; i < 14; i++) {
    const c = pick(customers);
    const p = pick(productRecords);
    const key = `${c.id}:${p.id}`;
    if (cartPairs.has(key)) continue;
    cartPairs.add(key);
    cartRows.push({
      id: id(),
      userId: c.id,
      productId: p.id,
      quantity: randomInt(1, 3),
      createdAt: daysAgo(randomInt(0, 7)),
      updatedAt: daysAgo(randomInt(0, 3)),
    });
  }
  await db.insert(schema.cartItems).values(cartRows);
  console.log(`        Inserted ${cartRows.length} cart items.\n`);

  // ── Wishlists ──────────────────────────────────────────────────
  console.log("[10/14] Seeding wishlists...");
  const wishPairs = new Set<string>();
  const wishRows: Array<{
    id: string;
    userId: string;
    productId: string;
    createdAt: Date;
  }> = [];

  for (let i = 0; i < 10; i++) {
    const c = pick(customers);
    const p = pick(productRecords);
    const key = `${c.id}:${p.id}`;
    if (wishPairs.has(key)) continue;
    wishPairs.add(key);
    wishRows.push({
      id: id(),
      userId: c.id,
      productId: p.id,
      createdAt: daysAgo(randomInt(1, 30)),
    });
  }
  await db.insert(schema.wishlists).values(wishRows);
  console.log(`        Inserted ${wishRows.length} wishlists.\n`);

  // ── Product Questions ──────────────────────────────────────────
  console.log("[11/14] Seeding product questions and answers...");
  const questionRows: Array<{
    id: string;
    productId: string;
    userId: string;
    question: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const qaProducts = pickN(productRecords, 15);
  for (const product of qaProducts) {
    const nq = randomInt(1, 2);
    for (let q = 0; q < nq; q++) {
      questionRows.push({
        id: id(),
        productId: product.id,
        userId: pick(customers).id,
        question: pick(questionTemplates),
        createdAt: daysAgo(randomInt(5, 60)),
        updatedAt: daysAgo(randomInt(0, 5)),
      });
    }
  }
  await db.insert(schema.productQuestions).values(questionRows);
  console.log(`        Inserted ${questionRows.length} questions.`);

  // ── Product Answers ────────────────────────────────────────────
  const answerRows: Array<{
    id: string;
    questionId: string;
    userId: string;
    answer: string;
    isSellerAnswer: boolean;
    helpfulCount: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const question of questionRows) {
    const na = randomInt(1, 3);
    for (let a = 0; a < na; a++) {
      const isSeller = a === 0 && Math.random() > 0.3;
      const answerer = isSeller ? pick(sellers) : pick(customers);
      answerRows.push({
        id: id(),
        questionId: question.id,
        userId: answerer.id,
        answer: pick(answerTemplates),
        isSellerAnswer: isSeller,
        helpfulCount: randomInt(0, 15),
        createdAt: daysAgo(randomInt(0, 30)),
        updatedAt: daysAgo(randomInt(0, 5)),
      });
    }
  }
  await db.insert(schema.productAnswers).values(answerRows);
  console.log(`        Inserted ${answerRows.length} answers.`);

  // ── Helpful Votes ──────────────────────────────────────────────
  const voteRows: Array<{
    id: string;
    answerId: string;
    userId: string;
    createdAt: Date;
  }> = [];
  const votePairs = new Set<string>();

  for (const answer of answerRows) {
    if (answer.helpfulCount > 0) {
      const nv = Math.min(answer.helpfulCount, 5);
      const voters = pickN(customers, nv);
      for (const voter of voters) {
        const key = `${answer.id}:${voter.id}`;
        if (votePairs.has(key)) continue;
        votePairs.add(key);
        voteRows.push({
          id: id(),
          answerId: answer.id,
          userId: voter.id,
          createdAt: daysAgo(randomInt(0, 20)),
        });
      }
    }
  }
  if (voteRows.length > 0) {
    for (let i = 0; i < voteRows.length; i += 50) {
      await db.insert(schema.answerHelpfulVotes).values(voteRows.slice(i, i + 50));
    }
  }
  console.log(`        Inserted ${voteRows.length} helpful votes.\n`);

  // ── Coupons ────────────────────────────────────────────────────
  console.log("[12/14] Seeding coupons...");
  const couponRows = [
    { id: id(), code: "WELCOME10", discountType: "percentage" as const, discountValue: 10, minOrderCents: 2000, maxUsages: 1000, usageCount: 142, expiresAt: new Date("2026-12-31"), isActive: true },
    { id: id(), code: "SAVE20", discountType: "percentage" as const, discountValue: 20, minOrderCents: 5000, maxUsages: 500, usageCount: 89, expiresAt: new Date("2026-06-30"), isActive: true },
    { id: id(), code: "FLAT5", discountType: "fixed" as const, discountValue: 500, minOrderCents: 2500, maxUsages: null, usageCount: 312, expiresAt: null, isActive: true },
    { id: id(), code: "SUMMER25", discountType: "percentage" as const, discountValue: 25, minOrderCents: 10000, maxUsages: 200, usageCount: 200, expiresAt: new Date("2025-09-01"), isActive: false },
    { id: id(), code: "EXPIRED50", discountType: "percentage" as const, discountValue: 50, minOrderCents: null, maxUsages: 50, usageCount: 50, expiresAt: new Date("2025-01-01"), isActive: false },
    { id: id(), code: "FREESHIP", discountType: "fixed" as const, discountValue: 999, minOrderCents: 3000, maxUsages: null, usageCount: 1024, expiresAt: new Date("2026-12-31"), isActive: true },
    { id: id(), code: "VIP30", discountType: "percentage" as const, discountValue: 30, minOrderCents: 15000, maxUsages: 100, usageCount: 12, expiresAt: new Date("2026-09-15"), isActive: true },
    { id: id(), code: "NEWYEAR15", discountType: "fixed" as const, discountValue: 1500, minOrderCents: 7500, maxUsages: 300, usageCount: 278, expiresAt: new Date("2026-02-28"), isActive: false },
  ].map((c) => ({
    ...c,
    createdAt: daysAgo(randomInt(30, 180)),
    updatedAt: daysAgo(randomInt(0, 15)),
  }));

  await db.insert(schema.coupons).values(couponRows);
  console.log(`        Inserted ${couponRows.length} coupons.\n`);

  // ── Order Coupons ──────────────────────────────────────────────
  console.log("[13/14] Seeding order coupons...");
  const deliveredOrders = orderRows.filter((o) => o.status === "delivered");
  const ordersWithCoupons = pickN(deliveredOrders, Math.min(5, deliveredOrders.length));
  const activeCoupons = couponRows.filter((c) => c.isActive);

  const orderCouponRows = ordersWithCoupons.map((order) => {
    const coupon = pick(activeCoupons);
    const discountCents =
      coupon.discountType === "percentage"
        ? Math.round(order.totalInCents * (coupon.discountValue / 100))
        : coupon.discountValue;
    return {
      id: id(),
      orderId: order.id,
      couponId: coupon.id,
      discountCents,
      createdAt: order.createdAt,
    };
  });

  if (orderCouponRows.length > 0) {
    await db.insert(schema.orderCoupons).values(orderCouponRows);
  }
  console.log(`        Inserted ${orderCouponRows.length} order coupons.\n`);

  // ── Return Requests ────────────────────────────────────────────
  console.log("[14/14] Seeding return requests...");
  const returnStatuses = ["pending", "approved", "rejected", "completed"] as const;
  const returnReasons = [
    "Item arrived damaged. The packaging was crushed and the product has visible dents.",
    "Product does not match the description. The color and size are different from what was shown.",
    "Received wrong item. I ordered a different variant but got this one instead.",
    "Quality is much lower than expected. Materials feel cheap compared to what was advertised.",
    "Changed my mind after purchase. The product is fine but I no longer need it.",
  ];

  const returnRequestedOrders = orderRows.filter((o) => o.status === "return_requested");
  const extraReturns = pickN(
    deliveredOrders.filter((o) => !ordersWithCoupons.some((oc) => oc.id === o.id)),
    Math.min(2, deliveredOrders.length)
  );
  const allReturnOrders = [...returnRequestedOrders, ...extraReturns].slice(0, 5);

  // Deduplicate by orderId (return_requests has unique constraint on order_id)
  const seenOrderIds = new Set<string>();
  const uniqueReturnOrders = allReturnOrders.filter((o) => {
    if (seenOrderIds.has(o.id)) return false;
    seenOrderIds.add(o.id);
    return true;
  });

  const returnRows = uniqueReturnOrders.map((order, i) => ({
    id: id(),
    orderId: order.id,
    userId: order.userId,
    reason: returnReasons[i % returnReasons.length]!,
    status: returnStatuses[i % returnStatuses.length]!,
    adminNotes:
      i % 2 === 0
        ? "Reviewed the claim. Photos confirm the issue. Approved for full refund."
        : null,
    createdAt: daysAgo(randomInt(1, 20)),
    updatedAt: daysAgo(randomInt(0, 5)),
  }));

  if (returnRows.length > 0) {
    await db.insert(schema.returnRequests).values(returnRows);
  }
  console.log(`        Inserted ${returnRows.length} return requests.\n`);

  // ── Summary ────────────────────────────────────────────────────
  console.log("==================================================");
  console.log("  Seed completed successfully!");
  console.log("==================================================\n");
  console.log("Summary:");
  console.log(`  Categories ........... ${categoryRecords.length}`);
  console.log(`  Users ................ ${userRecords.length}`);
  console.log(`  Products ............. ${productRecords.length}`);
  console.log(`  Reviews .............. ${reviewRows.length}`);
  console.log(`  Orders ............... ${orderRows.length}`);
  console.log(`  Order Items .......... ${orderItemRows.length}`);
  console.log(`  Cart Items ........... ${cartRows.length}`);
  console.log(`  Wishlists ............ ${wishRows.length}`);
  console.log(`  Questions ............ ${questionRows.length}`);
  console.log(`  Answers .............. ${answerRows.length}`);
  console.log(`  Helpful Votes ........ ${voteRows.length}`);
  console.log(`  Coupons .............. ${couponRows.length}`);
  console.log(`  Order Coupons ........ ${orderCouponRows.length}`);
  console.log(`  Return Requests ...... ${returnRows.length}`);
  console.log("");
  console.log("Test credentials (password: password123):");
  console.log("  Admin:    admin@amazone.com");
  console.log("  Seller:   seller1@amazone.com .. seller5@amazone.com");
  console.log("  Customer: john@example.com, jane@example.com, etc.");
}

// ── Export for programmatic use ──────────────────────────────────
export default seed;

// ── CLI entrypoint ───────────────────────────────────────────────
seed()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
