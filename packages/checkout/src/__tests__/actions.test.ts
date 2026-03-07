import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before the module under test is imported
// ---------------------------------------------------------------------------

// Mock @amazone/db
const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbInsert = vi.fn();
const mockDbTransaction = vi.fn();

function createSelectChain(result: unknown[] = []) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

vi.mock("@amazone/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      const override = mockDbSelect(...args);
      if (override && typeof override === "object" && "from" in override) {
        return override;
      }
      return createSelectChain();
    },
    update: (...args: unknown[]) => {
      const override = mockDbUpdate(...args);
      if (override && typeof override === "object" && "set" in override) {
        return override;
      }
      return {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{}]),
        }),
      };
    },
    insert: (...args: unknown[]) => {
      const override = mockDbInsert(...args);
      if (override && typeof override === "object" && "values" in override) {
        return override;
      }
      return {
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        }),
      };
    },
    transaction: (...args: unknown[]) => mockDbTransaction(...args),
  },
  products: { id: "products.id", stock: "products.stock", price: "products.price" },
  orders: {
    id: "orders.id",
    status: "orders.status",
    userId: "orders.userId",
    stripeSessionId: "orders.stripeSessionId",
    stripePaymentIntentId: "orders.stripePaymentIntentId",
  },
  orderItems: {
    orderId: "orderItems.orderId",
    productId: "orderItems.productId",
    quantity: "orderItems.quantity",
  },
  stripeWebhookEvents: { id: "events.id", type: "events.type" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_a: unknown, _b: unknown) => ({ eq: true })),
  inArray: vi.fn((_col: unknown, _vals: unknown) => ({ inArray: true })),
  sql: vi.fn(),
}));

// Mock @amazone/cart
const mockGetCart = vi.fn();
vi.mock("@amazone/cart", () => ({
  getCart: (...args: unknown[]) => mockGetCart(...args),
}));

// Mock @amazone/orders
const mockCreateOrder = vi.fn();
vi.mock("@amazone/orders", () => ({
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
}));

// Mock Stripe constructor
const mockSessionsCreate = vi.fn();
const mockWebhooksConstructEvent = vi.fn();

vi.mock("stripe", () => {
  class MockStripe {
    checkout = {
      sessions: {
        create: (...args: unknown[]) => mockSessionsCreate(...args),
      },
    };
    webhooks = {
      constructEvent: (...args: unknown[]) =>
        mockWebhooksConstructEvent(...args),
    };
  }
  return { default: MockStripe };
});

// ---------------------------------------------------------------------------
// Import under test AFTER mocks are established
// ---------------------------------------------------------------------------

import { createCheckoutSession, handleWebhookEvent } from "../actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validShippingInput = {
  shippingName: "John Doe",
  shippingAddress: "123 Main St",
  shippingCity: "New York",
  shippingCountry: "US",
  shippingZip: "10001",
  successUrl: "http://localhost:3000/success",
  cancelUrl: "http://localhost:3000/cart",
};

function makeCartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "cart-item-1",
    quantity: 2,
    product: {
      id: "prod-1",
      name: "Widget",
      slug: "widget",
      price: 2500,
      images: ["https://example.com/widget.jpg"],
      stock: 10,
      ...((overrides.product as Record<string, unknown>) ?? {}),
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests: createCheckoutSession
// ---------------------------------------------------------------------------

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Stripe is configured
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
  });

  it("throws if Stripe is not configured (no STRIPE_SECRET_KEY)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    await expect(
      createCheckoutSession("user-1", validShippingInput)
    ).rejects.toThrow("Payment processing is currently unavailable");
  });

  it("throws if cart is empty", async () => {
    mockGetCart.mockResolvedValue({ items: [], totalItems: 0, totalInCents: 0 });

    await expect(
      createCheckoutSession("user-1", validShippingInput)
    ).rejects.toThrow("Cart is empty");
  });

  it("throws if insufficient stock", async () => {
    const cartItem = makeCartItem({ quantity: 20 });
    mockGetCart.mockResolvedValue({
      items: [cartItem],
      totalItems: 20,
      totalInCents: 50000,
    });

    // DB returns product with only 5 in stock
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: "prod-1", stock: 5, price: 2500 },
        ]),
      }),
    });

    await expect(
      createCheckoutSession("user-1", validShippingInput)
    ).rejects.toThrow("Insufficient stock for product: Widget");
  });

  it("creates order and Stripe session on success", async () => {
    const cartItem = makeCartItem({ quantity: 2 });
    mockGetCart.mockResolvedValue({
      items: [cartItem],
      totalItems: 2,
      totalInCents: 5000,
    });

    // DB returns product with sufficient stock
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: "prod-1", stock: 10, price: 2500 },
        ]),
      }),
    });

    // createOrder returns an order with an ID
    mockCreateOrder.mockResolvedValue({
      id: "order-123",
      userId: "user-1",
      status: "pending",
      totalInCents: 5000,
    });

    // Stripe session creation succeeds
    mockSessionsCreate.mockResolvedValue({
      id: "cs_test_session",
      url: "https://checkout.stripe.com/session/cs_test_session",
    });

    // DB update for storing session ID
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}]),
      }),
    });

    const result = await createCheckoutSession("user-1", validShippingInput);

    expect(mockGetCart).toHaveBeenCalledWith("user-1");
    expect(mockCreateOrder).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        shippingName: "John Doe",
        shippingAddress: "123 Main St",
        shippingCity: "New York",
        shippingCountry: "US",
        shippingZip: "10001",
      }),
      expect.arrayContaining([
        expect.objectContaining({
          productId: "prod-1",
          quantity: 2,
          priceInCents: 2500,
        }),
      ])
    );
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        metadata: { orderId: "order-123", userId: "user-1" },
      })
    );
    expect(result).toEqual({
      sessionId: "cs_test_session",
      url: "https://checkout.stripe.com/session/cs_test_session",
    });
  });

  it("stores Stripe session ID on order after creation", async () => {
    const cartItem = makeCartItem({ quantity: 1 });
    mockGetCart.mockResolvedValue({
      items: [cartItem],
      totalItems: 1,
      totalInCents: 2500,
    });

    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: "prod-1", stock: 10, price: 2500 },
        ]),
      }),
    });

    mockCreateOrder.mockResolvedValue({
      id: "order-456",
      userId: "user-1",
      status: "pending",
      totalInCents: 2500,
    });

    mockSessionsCreate.mockResolvedValue({
      id: "cs_test_789",
      url: "https://checkout.stripe.com/session/cs_test_789",
    });

    const mockSetChain = {
      where: vi.fn().mockResolvedValue([{}]),
    };
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue(mockSetChain),
    });

    await createCheckoutSession("user-1", validShippingInput);

    // Verify db.update was called (to store session ID on order)
    expect(mockDbUpdate).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: handleWebhookEvent
// ---------------------------------------------------------------------------

describe("handleWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_123");
  });

  it("throws if STRIPE_SECRET_KEY is not set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    await expect(
      handleWebhookEvent("payload", "sig")
    ).rejects.toThrow("STRIPE_SECRET_KEY environment variable is not set");
  });

  it("throws if STRIPE_WEBHOOK_SECRET is not set", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    await expect(
      handleWebhookEvent("payload", "sig")
    ).rejects.toThrow("STRIPE_WEBHOOK_SECRET environment variable is not set");
  });

  it("skips already-processed events (idempotency)", async () => {
    mockWebhooksConstructEvent.mockReturnValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: {} },
    });

    // isEventProcessed returns existing record (event already processed)
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "evt_duplicate" }]),
        }),
      }),
    });

    const result = await handleWebhookEvent("payload", "sig_test");

    expect(result).toEqual({ action: "skipped" });
  });

  it("confirms order on checkout.session.completed", async () => {
    mockWebhooksConstructEvent.mockReturnValue({
      id: "evt_session_complete",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { orderId: "order-abc" },
          payment_intent: "pi_test_123",
        },
      },
    });

    // isEventProcessed: not yet processed
    const notProcessedChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    // Order lookup: pending order exists
    const orderLookupChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { status: "pending", userId: "user-abc" },
          ]),
        }),
      }),
    };

    // Mock for markEventProcessed insert
    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    mockDbSelect
      .mockReturnValueOnce(notProcessedChain)
      .mockReturnValueOnce(orderLookupChain);

    // Transaction mock — executes the callback immediately
    mockDbTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{}]),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
        };
        await fn(tx);
      }
    );

    const result = await handleWebhookEvent("payload", "sig_test");

    expect(result).toEqual({
      action: "confirmed",
      orderId: "order-abc",
      userId: "user-abc",
    });
  });

  it("confirms order on payment_intent.succeeded", async () => {
    mockWebhooksConstructEvent.mockReturnValue({
      id: "evt_pi_succeeded",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_succeeded_123",
          metadata: { orderId: "order-pi" },
        },
      },
    });

    mockDbSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // not processed
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { status: "pending", userId: "user-pi" },
            ]),
          }),
        }),
      });

    mockDbTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{}]),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
        };
        await fn(tx);
      }
    );

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await handleWebhookEvent("payload", "sig_test");

    expect(result).toEqual({
      action: "confirmed",
      orderId: "order-pi",
      userId: "user-pi",
    });
  });

  it("cancels order on payment_intent.payment_failed", async () => {
    mockWebhooksConstructEvent.mockReturnValue({
      id: "evt_pi_failed",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_failed_456",
          metadata: { orderId: "order-fail" },
        },
      },
    });

    mockDbSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // not processed
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { status: "pending", userId: "user-fail" },
            ]),
          }),
        }),
      });

    // payment_failed uses db.update directly (no transaction)
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}]),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await handleWebhookEvent("payload", "sig_test");

    expect(result).toEqual({
      action: "cancelled",
      orderId: "order-fail",
      userId: "user-fail",
    });
  });

  it("refunds order on charge.refunded", async () => {
    mockWebhooksConstructEvent.mockReturnValue({
      id: "evt_charge_refunded",
      type: "charge.refunded",
      data: {
        object: {
          payment_intent: "pi_refund_789",
        },
      },
    });

    mockDbSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // not processed
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: "order-refund", status: "confirmed", userId: "user-refund" },
            ]),
          }),
        }),
      });

    mockDbTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{}]),
            }),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          }),
        };
        await fn(tx);
      }
    );

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await handleWebhookEvent("payload", "sig_test");

    expect(result).toEqual({
      action: "refunded",
      orderId: "order-refund",
      userId: "user-refund",
    });
  });

  it("cancels order on checkout.session.expired", async () => {
    mockWebhooksConstructEvent.mockReturnValue({
      id: "evt_session_expired",
      type: "checkout.session.expired",
      data: {
        object: {
          metadata: { orderId: "order-expired" },
        },
      },
    });

    mockDbSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // not processed
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { status: "pending", userId: "user-expired" },
            ]),
          }),
        }),
      });

    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}]),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await handleWebhookEvent("payload", "sig_test");

    expect(result).toEqual({
      action: "cancelled",
      orderId: "order-expired",
      userId: "user-expired",
    });
  });

  it("marks event as processed after handling", async () => {
    mockWebhooksConstructEvent.mockReturnValue({
      id: "evt_to_mark",
      type: "checkout.session.expired",
      data: {
        object: {
          metadata: { orderId: "order-mark" },
        },
      },
    });

    mockDbSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { status: "pending", userId: "user-mark" },
            ]),
          }),
        }),
      });

    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}]),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    });

    await handleWebhookEvent("payload", "sig_test");

    // Verify markEventProcessed was called via db.insert
    expect(mockDbInsert).toHaveBeenCalled();
  });
});
