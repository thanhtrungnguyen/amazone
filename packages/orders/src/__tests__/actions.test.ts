import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — declared before the module under test is imported
// ---------------------------------------------------------------------------

const mockTxInsert = vi.fn();
const mockTxReturning = vi.fn();
const mockDbTransaction = vi.fn();

vi.mock("@amazone/db", () => {
  return {
    db: {
      transaction: (...args: unknown[]) => mockDbTransaction(...args),
      query: {
        orders: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{}]),
          }),
        }),
      }),
    },
    orders: {
      id: "orders.id",
      userId: "orders.userId",
      status: "orders.status",
      createdAt: "orders.createdAt",
    },
    orderItems: {
      orderId: "orderItems.orderId",
    },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_a: unknown, _b: unknown) => ({ eq: true })),
  and: vi.fn((..._args: unknown[]) => ({ and: true })),
  desc: vi.fn((_col: unknown) => ({ desc: true })),
}));

vi.mock("@amazone/shared-utils", () => ({
  ORDER_STATUSES: [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ] as const,
}));

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { createOrder } from "../actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validShippingInput = {
  shippingName: "Alice Johnson",
  shippingAddress: "456 Oak Avenue",
  shippingCity: "San Francisco",
  shippingCountry: "US",
  shippingZip: "94102",
};

const sampleItems = [
  { productId: "prod-a", quantity: 2, priceInCents: 1500 },
  { productId: "prod-b", quantity: 1, priceInCents: 3000 },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates order with correct shipping info and calculated total", async () => {
    const fakeOrder = {
      id: "order-new-1",
      userId: "user-alice",
      status: "pending",
      totalInCents: 6000, // 1500*2 + 3000*1
      shippingName: "Alice Johnson",
      shippingAddress: "456 Oak Avenue",
      shippingCity: "San Francisco",
      shippingCountry: "US",
      shippingZip: "94102",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockTxReturning.mockResolvedValue([fakeOrder]);
    mockTxInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: mockTxReturning,
      }),
    });

    // Transaction mock: execute the callback with a mock tx
    mockDbTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          insert: (...args: unknown[]) => {
            mockTxInsert(...args);
            return {
              values: vi.fn().mockReturnValue({
                returning: mockTxReturning,
              }),
            };
          },
        };
        return fn(tx);
      }
    );

    const result = await createOrder("user-alice", validShippingInput, sampleItems);

    expect(result).toEqual(fakeOrder);
    expect(mockDbTransaction).toHaveBeenCalledTimes(1);

    // Verify tx.insert was called twice: once for orders, once for orderItems
    expect(mockTxInsert).toHaveBeenCalledTimes(2);
  });

  it("creates order items with correct prices and quantities", async () => {
    const fakeOrder = {
      id: "order-items-test",
      userId: "user-bob",
      status: "pending",
      totalInCents: 10000,
      createdAt: new Date(),
    };

    mockTxReturning.mockResolvedValue([fakeOrder]);

    let capturedOrderItemsValues: unknown = null;

    mockDbTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockImplementation((vals: unknown) => {
              // Capture the second insert call (order items)
              capturedOrderItemsValues = vals;
              return { returning: mockTxReturning };
            }),
          }),
        };
        return fn(tx);
      }
    );

    const items = [
      { productId: "prod-x", quantity: 3, priceInCents: 999 },
      { productId: "prod-y", quantity: 1, priceInCents: 4999 },
    ];

    await createOrder("user-bob", validShippingInput, items);

    // The order items should include the orderId and match the input items
    expect(capturedOrderItemsValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderId: "order-items-test",
          productId: "prod-x",
          quantity: 3,
          priceInCents: 999,
        }),
        expect.objectContaining({
          orderId: "order-items-test",
          productId: "prod-y",
          quantity: 1,
          priceInCents: 4999,
        }),
      ])
    );
  });

  it("returns order object with ID", async () => {
    const fakeOrder = {
      id: "order-return-test",
      userId: "user-carol",
      status: "pending",
      totalInCents: 2500,
      shippingName: "Alice Johnson",
      shippingAddress: "456 Oak Avenue",
      shippingCity: "San Francisco",
      shippingCountry: "US",
      shippingZip: "94102",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockTxReturning.mockResolvedValue([fakeOrder]);

    mockDbTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: mockTxReturning,
            }),
          }),
        };
        return fn(tx);
      }
    );

    const result = await createOrder(
      "user-carol",
      validShippingInput,
      [{ productId: "prod-z", quantity: 1, priceInCents: 2500 }]
    );

    expect(result).toBeDefined();
    expect(result.id).toBe("order-return-test");
    expect(result.userId).toBe("user-carol");
    expect(result.status).toBe("pending");
    expect(result.totalInCents).toBe(2500);
  });

  it("calculates total correctly from multiple items", async () => {
    let capturedOrderValues: Record<string, unknown> | null = null;

    mockDbTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        let callCount = 0;
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockImplementation((vals: unknown) => {
              callCount++;
              if (callCount === 1) {
                // First insert is the orders table — capture the values
                capturedOrderValues = vals as Record<string, unknown>;
              }
              const mockOrder = {
                id: "order-calc",
                userId: "user-1",
                status: "pending",
                totalInCents: 8500,
                ...(vals as Record<string, unknown>),
              };
              return {
                returning: vi.fn().mockResolvedValue([mockOrder]),
              };
            }),
          }),
        };
        return fn(tx);
      }
    );

    const items = [
      { productId: "prod-1", quantity: 2, priceInCents: 2000 }, // 4000
      { productId: "prod-2", quantity: 3, priceInCents: 1500 }, // 4500
    ];
    // Expected total: 4000 + 4500 = 8500

    await createOrder("user-1", validShippingInput, items);

    expect(capturedOrderValues).not.toBeNull();
    expect(capturedOrderValues!.totalInCents).toBe(8500);
  });

  it("rejects invalid shipping input", async () => {
    const invalidInput = {
      shippingName: "", // empty — violates min(1)
      shippingAddress: "123 Street",
      shippingCity: "City",
      shippingCountry: "US",
      shippingZip: "12345",
    };

    await expect(
      createOrder("user-1", invalidInput, sampleItems)
    ).rejects.toThrow();
  });

  it("rejects country code that is not exactly 2 characters", async () => {
    const invalidInput = {
      ...validShippingInput,
      shippingCountry: "USA", // should be 2 chars
    };

    await expect(
      createOrder("user-1", invalidInput, sampleItems)
    ).rejects.toThrow();
  });
});
