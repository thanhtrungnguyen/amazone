import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  check,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
]);

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "seller",
  "admin",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "return_requested",
]);

export const returnStatusEnum = pgEnum("return_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
]);

// ─── Users ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  hashedPassword: text("hashed_password"),
  role: userRoleEnum("role").default("customer").notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 255 }),
  verificationTokenExpiry: timestamp("verification_token_expiry", {
    mode: "date",
  }),
  notificationPreferences: jsonb("notification_preferences").$type<{
    orderUpdates: boolean;
    shippingUpdates: boolean;
    promotions: boolean;
  }>(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Categories ─────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  parentId: uuid("parent_id"),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Products ───────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    description: text("description"),
    price: integer("price").notNull(), // in cents
    compareAtPrice: integer("compare_at_price"), // original price in cents
    categoryId: uuid("category_id").references(() => categories.id),
    sellerId: uuid("seller_id")
      .references(() => users.id)
      .notNull(),
    images: text("images").array(),
    stock: integer("stock").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    avgRating: integer("avg_rating").default(0).notNull(), // stored as rating * 100 (e.g., 450 = 4.50)
    reviewCount: integer("review_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("products_category_idx").on(table.categoryId),
    index("products_seller_idx").on(table.sellerId),
    index("products_price_idx").on(table.price),
    index("products_active_featured_idx").on(table.isActive, table.isFeatured),
    index("products_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.name} || ' ' || coalesce(${table.description}, ''))`
    ),
  ]
);

// ─── Cart Items ─────────────────────────────────────────

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cart_items_user_product_variant_idx").on(
      table.userId,
      table.productId,
      table.variantId
    ),
    index("cart_items_variant_idx").on(table.variantId),
  ]
);

// ─── Wishlists ──────────────────────────────────────────

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    shareToken: varchar("share_token", { length: 64 }).unique(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wishlists_user_product_idx").on(
      table.userId,
      table.productId
    ),
    index("wishlists_share_token_idx").on(table.shareToken),
  ]
);

// ─── Price Alerts ──────────────────────────────────────

export const priceAlerts = pgTable(
  "price_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    targetPrice: integer("target_price").notNull(), // in cents
    isActive: boolean("is_active").default(true).notNull(),
    triggeredAt: timestamp("triggered_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("price_alerts_user_idx").on(table.userId),
    index("price_alerts_product_idx").on(table.productId),
    index("price_alerts_active_product_idx").on(table.isActive, table.productId),
    uniqueIndex("price_alerts_user_product_idx").on(table.userId, table.productId),
  ]
);

// ─── Orders ─────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    totalInCents: integer("total_in_cents").notNull(),
    shippingName: varchar("shipping_name", { length: 255 }).notNull(),
    shippingAddress: text("shipping_address").notNull(),
    shippingCity: varchar("shipping_city", { length: 255 }).notNull(),
    shippingState: varchar("shipping_state", { length: 255 }),
    shippingCountry: varchar("shipping_country", { length: 2 }).notNull(),
    shippingZip: varchar("shipping_zip", { length: 20 }).notNull(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 255,
    }),
    stripeSessionId: varchar("stripe_session_id", { length: 255 }),
    shippingCarrier: varchar("shipping_carrier", { length: 100 }),
    trackingNumber: varchar("tracking_number", { length: 200 }),
    estimatedDelivery: timestamp("estimated_delivery", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
  ]
);

// ─── Order Items ────────────────────────────────────────

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    quantity: integer("quantity").notNull(),
    priceInCents: integer("price_in_cents").notNull(), // snapshot at purchase time
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
    index("order_items_order_product_idx").on(table.orderId, table.productId),
  ]
);

// ─── Stripe Webhook Events (idempotency) ────────────

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: varchar("id", { length: 255 }).primaryKey(), // Stripe event ID (evt_...)
  type: varchar("type", { length: 255 }).notNull(),
  processedAt: timestamp("processed_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Return Requests ────────────────────────────────────

export const returnRequests = pgTable(
  "return_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull()
      .unique(), // one return request per order
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    reason: text("reason").notNull(),
    status: returnStatusEnum("status").default("pending").notNull(),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("return_requests_order_idx").on(table.orderId),
    index("return_requests_user_idx").on(table.userId),
    index("return_requests_status_idx").on(table.status),
  ]
);

// ─── Reviews ────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(), // 1-5
    title: varchar("title", { length: 255 }),
    comment: text("comment"),
    isVerifiedPurchase: boolean("is_verified_purchase")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reviews_user_product_idx").on(table.userId, table.productId),
    index("reviews_product_idx").on(table.productId),
    index("reviews_rating_idx").on(table.rating),
  ]
);

// ─── Coupons ────────────────────────────────────────────

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    discountType: discountTypeEnum("discount_type").notNull(),
    // For 'percentage': integer 1–100. For 'fixed': amount in cents.
    discountValue: integer("discount_value").notNull(),
    // Minimum order subtotal in cents required to use this coupon (null = no minimum)
    minOrderCents: integer("min_order_cents"),
    // Maximum total redemptions across all customers (null = unlimited)
    maxUsages: integer("max_usages"),
    usageCount: integer("usage_count").default(0).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("coupons_code_idx").on(table.code),
    index("coupons_active_idx").on(table.isActive),
    check(
      "coupons_discount_value_positive",
      sql`${table.discountValue} > 0`
    ),
    check(
      "coupons_percentage_range",
      sql`${table.discountType} != 'percentage' OR ${table.discountValue} <= 100`
    ),
  ]
);

// Records which coupon was applied to each order.
// Used by the webhook to increment usageCount exactly once per confirmed order.
export const orderCoupons = pgTable("order_coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull()
    .unique(), // one coupon application per order
  couponId: uuid("coupon_id")
    .references(() => coupons.id)
    .notNull(),
  // Discount amount actually applied at the time of order creation (snapshot)
  discountCents: integer("discount_cents").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Order Events (Tracking Timeline) ───────────────────

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("order_events_order_idx").on(table.orderId),
    index("order_events_type_idx").on(table.type),
    index("order_events_created_idx").on(table.createdAt),
  ]
);

// ─── Product Q&A ────────────────────────────────────────

export const productQuestions = pgTable(
  "product_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    question: text("question").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("product_questions_product_idx").on(table.productId),
    index("product_questions_user_idx").on(table.userId),
  ]
);

export const productAnswers = pgTable(
  "product_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .references(() => productQuestions.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    answer: text("answer").notNull(),
    isSellerAnswer: boolean("is_seller_answer").default(false).notNull(),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("product_answers_question_idx").on(table.questionId),
    index("product_answers_user_idx").on(table.userId),
  ]
);

export const answerHelpfulVotes = pgTable(
  "answer_helpful_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    answerId: uuid("answer_id")
      .references(() => productAnswers.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("answer_helpful_votes_answer_user_idx").on(
      table.answerId,
      table.userId
    ),
  ]
);

// ─── Product Variant Options ────────────────────────────

export const productVariantOptions = pgTable(
  "product_variant_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(), // e.g. "Size", "Color"
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("pvo_product_idx").on(table.productId),
    index("pvo_product_position_idx").on(table.productId, table.position),
  ]
);

// ─── Product Variant Values ─────────────────────────────

export const productVariantValues = pgTable(
  "product_variant_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    optionId: uuid("option_id")
      .references(() => productVariantOptions.id, { onDelete: "cascade" })
      .notNull(),
    value: varchar("value", { length: 255 }).notNull(), // e.g. "Large", "Red"
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("pvv_option_idx").on(table.optionId),
    index("pvv_option_position_idx").on(table.optionId, table.position),
  ]
);

// ─── Product Variants ───────────────────────────────────

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    sku: varchar("sku", { length: 255 }).unique(),
    priceInCents: integer("price_in_cents"), // null means use product base price
    stock: integer("stock").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("pv_product_idx").on(table.productId),
    index("pv_sku_idx").on(table.sku),
    index("pv_product_active_idx").on(table.productId, table.isActive),
  ]
);

// ─── Product Variant Combinations ───────────────────────

export const productVariantCombinations = pgTable(
  "product_variant_combinations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .references(() => productVariants.id, { onDelete: "cascade" })
      .notNull(),
    optionId: uuid("option_id")
      .references(() => productVariantOptions.id, { onDelete: "cascade" })
      .notNull(),
    valueId: uuid("value_id")
      .references(() => productVariantValues.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("pvc_variant_idx").on(table.variantId),
    index("pvc_option_value_idx").on(table.optionId, table.valueId),
    uniqueIndex("pvc_variant_option_idx").on(table.variantId, table.optionId),
  ]
);

// ─── Saved for Later ────────────────────────────────────

export const savedForLater = pgTable(
  "saved_for_later",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    variantId: uuid("variant_id").references(
      () => productVariantCombinations.id,
      { onDelete: "set null" }
    ),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("saved_for_later_user_product_variant_idx").on(
      table.userId,
      table.productId,
      table.variantId
    ),
    index("saved_for_later_user_idx").on(table.userId),
  ]
);

// ─── Product Bundles ────────────────────────────────────

export const productBundles = pgTable(
  "product_bundles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    description: text("description"),
    discountPercent: integer("discount_percent").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("product_bundles_active_idx").on(table.isActive),
    check(
      "product_bundles_discount_range",
      sql`${table.discountPercent} >= 0 AND ${table.discountPercent} <= 50`
    ),
  ]
);

export const productBundleItems = pgTable(
  "product_bundle_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bundleId: uuid("bundle_id")
      .references(() => productBundles.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").default(1).notNull(),
  },
  (table) => [
    index("product_bundle_items_bundle_idx").on(table.bundleId),
    index("product_bundle_items_product_idx").on(table.productId),
  ]
);

// ─── Addresses ─────────────────────────────────────────

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    label: varchar("label", { length: 50 }).notNull(), // "Home", "Work", etc.
    fullName: varchar("full_name", { length: 255 }).notNull(),
    streetAddress: varchar("street_address", { length: 500 }).notNull(),
    city: varchar("city", { length: 255 }).notNull(),
    state: varchar("state", { length: 255 }),
    zipCode: varchar("zip_code", { length: 20 }).notNull(),
    country: varchar("country", { length: 2 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("addresses_user_idx").on(table.userId),
    index("addresses_user_default_idx").on(table.userId, table.isDefault),
  ]
);

// ─── Relations ──────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  cartItems: many(cartItems),
  wishlists: many(wishlists),
  orders: many(orders),
  reviews: many(reviews),
  returnRequests: many(returnRequests),
  productQuestions: many(productQuestions),
  productAnswers: many(productAnswers),
  answerHelpfulVotes: many(answerHelpfulVotes),
  addresses: many(addresses),
  savedForLater: many(savedForLater),
  priceAlerts: many(priceAlerts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  cartItems: many(cartItems),
  wishlists: many(wishlists),
  orderItems: many(orderItems),
  reviews: many(reviews),
  questions: many(productQuestions),
  variantOptions: many(productVariantOptions),
  variants: many(productVariants),
  savedForLater: many(savedForLater),
  bundleItems: many(productBundleItems),
  priceAlerts: many(priceAlerts),
}));

export const priceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  user: one(users, {
    fields: [priceAlerts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [priceAlerts.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  events: many(orderEvents),
  returnRequest: one(returnRequests, {
    fields: [orders.id],
    references: [returnRequests.orderId],
  }),
  coupon: one(orderCoupons, {
    fields: [orders.id],
    references: [orderCoupons.orderId],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));

export const returnRequestsRelations = relations(returnRequests, ({ one }) => ({
  order: one(orders, {
    fields: [returnRequests.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [returnRequests.userId],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  orderCoupons: many(orderCoupons),
}));

export const orderCouponsRelations = relations(orderCoupons, ({ one }) => ({
  order: one(orders, {
    fields: [orderCoupons.orderId],
    references: [orders.id],
  }),
  coupon: one(coupons, {
    fields: [orderCoupons.couponId],
    references: [coupons.id],
  }),
}));

export const productQuestionsRelations = relations(
  productQuestions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productQuestions.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [productQuestions.userId],
      references: [users.id],
    }),
    answers: many(productAnswers),
  })
);

export const productAnswersRelations = relations(
  productAnswers,
  ({ one, many }) => ({
    question: one(productQuestions, {
      fields: [productAnswers.questionId],
      references: [productQuestions.id],
    }),
    user: one(users, {
      fields: [productAnswers.userId],
      references: [users.id],
    }),
    helpfulVotes: many(answerHelpfulVotes),
  })
);

export const answerHelpfulVotesRelations = relations(
  answerHelpfulVotes,
  ({ one }) => ({
    answer: one(productAnswers, {
      fields: [answerHelpfulVotes.answerId],
      references: [productAnswers.id],
    }),
    user: one(users, {
      fields: [answerHelpfulVotes.userId],
      references: [users.id],
    }),
  })
);

export const productVariantOptionsRelations = relations(
  productVariantOptions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariantOptions.productId],
      references: [products.id],
    }),
    values: many(productVariantValues),
    combinations: many(productVariantCombinations),
  })
);

export const productVariantValuesRelations = relations(
  productVariantValues,
  ({ one, many }) => ({
    option: one(productVariantOptions, {
      fields: [productVariantValues.optionId],
      references: [productVariantOptions.id],
    }),
    combinations: many(productVariantCombinations),
  })
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    combinations: many(productVariantCombinations),
    cartItems: many(cartItems),
  })
);

export const productVariantCombinationsRelations = relations(
  productVariantCombinations,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [productVariantCombinations.variantId],
      references: [productVariants.id],
    }),
    option: one(productVariantOptions, {
      fields: [productVariantCombinations.optionId],
      references: [productVariantOptions.id],
    }),
    value: one(productVariantValues, {
      fields: [productVariantCombinations.valueId],
      references: [productVariantValues.id],
    }),
  })
);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const savedForLaterRelations = relations(savedForLater, ({ one }) => ({
  user: one(users, {
    fields: [savedForLater.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [savedForLater.productId],
    references: [products.id],
  }),
  variant: one(productVariantCombinations, {
    fields: [savedForLater.variantId],
    references: [productVariantCombinations.id],
  }),
}));

export const productBundlesRelations = relations(
  productBundles,
  ({ many }) => ({
    items: many(productBundleItems),
  })
);

export const productBundleItemsRelations = relations(
  productBundleItems,
  ({ one }) => ({
    bundle: one(productBundles, {
      fields: [productBundleItems.bundleId],
      references: [productBundles.id],
    }),
    product: one(products, {
      fields: [productBundleItems.productId],
      references: [products.id],
    }),
  })
);
