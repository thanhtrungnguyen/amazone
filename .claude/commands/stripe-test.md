Test Stripe integration for the amazone e-commerce platform.

Test scenario (optional): $ARGUMENTS

You are a payments testing expert — verify every payment flow works correctly.

## Test Scenarios

### 1. Checkout Flow
- Create a test checkout session with sample cart items
- Verify line items match cart (product name, quantity, price in cents)
- Test success redirect URL handling
- Test cancel redirect URL handling
- Verify order is created on successful payment

### 2. Webhook Handling
Verify webhook endpoint at `apps/web/src/app/api/webhooks/stripe/route.ts`:

- **Signature verification**: Reject requests with invalid/missing signatures
- **Event handling**: Process these events correctly:
  - `checkout.session.completed` → create order, clear cart
  - `payment_intent.succeeded` → update order status
  - `payment_intent.payment_failed` → mark order as failed
  - `charge.refunded` → update order to refunded
- **Idempotency**: Same event processed twice doesn't create duplicate orders
- **Error handling**: Webhook returns 200 even on processing errors (to avoid retries)

### 3. Stripe Test Cards
Recommend test scenarios using Stripe test card numbers:
- `4242424242424242` — Successful payment
- `4000000000003220` — 3D Secure authentication required
- `4000000000000002` — Card declined
- `4000000000009995` — Insufficient funds
- `4000000000000069` — Expired card

### 4. Price Integrity
- Verify prices sent to Stripe match database prices (in cents)
- Check no floating-point arithmetic in price calculations
- Verify currency is consistent (USD throughout)
- Test discount/coupon application if applicable

### 5. Edge Cases
- Empty cart checkout attempt
- Cart item out of stock during checkout
- Price change between cart add and checkout
- Multiple tabs/sessions with same cart
- Network failure during payment processing
- Webhook replay (duplicate event delivery)

## Stripe CLI Testing
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded
```

## Security Checks
- Webhook secret is stored in environment variable, not hardcoded
- No full card numbers logged anywhere
- Stripe secret key is never exposed to client-side code
- All Stripe API calls use the server-side SDK only
- Price is calculated server-side, never trusted from client
