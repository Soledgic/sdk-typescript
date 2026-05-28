# Soledgic TypeScript SDK

Platform payment infrastructure for creator economy platforms, backed by a live ledger
for every sale, split, wallet balance, refund, and payout.

## First sandbox checkout in 2 minutes

```bash
npm install @soledgic/sdk@0.5.2
npx soledgic init                     # Browser auth → writes .env + a runnable test file
node soledgic-test-checkout.mjs       # Runs a sandbox checkout end-to-end
```

You'll see a creator created, a checkout completed, a payment simulated, and the creator's
earnings balance — without writing a line of code. No production approval, no real money,
no signup form (the init command does it for you).

Or grab a key manually from the Soledgic signup page.

## What's in the box

Use the SDK to accept payments, create wallets, split revenue, issue refunds, run payouts,
reconcile balances, keep tax-ready records, and subscribe to signed webhooks from one API
surface. Built for marketplaces, creator platforms, embedded finance products, and
closed-loop app economies that need more than a processor checkout.

Supported API surface:

- `participants`, `wallets`, `transfers`, `holds`
- `checkout-sessions`, `payouts`, `refunds`, `refundRequests`
- `sandbox`, `receipts`, `activity`
- webhook endpoint management and signature verification

## Network Access

This SDK makes HTTPS requests only when you call client methods. Requests go to
the configured Soledgic API base URL.

By default the SDK uses the exported `DEFAULT_BASE_URL` value. You may
override this for sandbox, staging, or internal testing with the `baseUrl`
client option. The SDK does not perform background telemetry, install-time
network calls, or calls to third-party analytics endpoints.

## Quick Start

```ts
import Soledgic from '@soledgic/sdk'

const soledgic = new Soledgic({
  apiKey: process.env.SOLEDGIC_API_KEY!,
  baseUrl: process.env.SOLEDGIC_BASE_URL,
  apiVersion: '2026-03-01',
})

const successUrl = process.env.CHECKOUT_SUCCESS_URL!
const cancelUrl = process.env.CHECKOUT_CANCEL_URL!

const userWallet = await soledgic.users.upsertWallet({
  externalUserId: 'user_123',
  name: 'User 123 wallet',
})

const creator = await soledgic.creators.upsert({
  externalCreatorId: 'creator_456',
  userId: '9f9b62d2-2f32-4b20-bc24-1f86b16cb9eb',
  displayName: 'Jane Creator',
  defaultSplitPercent: 80,
})

const checkout = await soledgic.orders.createCheckout({
  creatorId: creator.participant.id,
  externalUserId: 'user_123',
  externalProductId: 'chapter_001',
  externalOrderId: 'order_1001',
  amount: 999,
  currency: 'USD',
  productName: 'Chapter 1',
  successUrl,
  cancelUrl,
})

const activity = await soledgic.activity.listWallet(userWallet.wallet.id, { limit: 10 })

console.log({
  checkoutUrl: checkout.checkoutSession.checkoutUrl,
  walletBalance: userWallet.wallet.availableBalance,
  activityItems: activity.entries.length,
})
```

The wallet API is uniform across integrations, but balances remain scoped.
Every wallet object belongs to one ledger, one owner, and one wallet type.
Soledgic derives the organization from the API key's ledger, links wallet
usage to that organization server-side, and does not accept a client-supplied
`organizationId`. Soledgic does not expose a shared universal wallet balance.

## Public Treasury Namespaces

### Platform and Creators

| Method | Description |
| --- | --- |
| `platform.getStatus()` | Read current API and treasury health |
| `creators.upsert(req)` | Create or update a creator-backed treasury account |
| `creators.get(creatorId)` | Get one creator with active hold detail |
| `creators.getPayoutEligibility(creatorId)` | Check payout readiness |
| `creators.createWallet(req)` | Create a creator earnings wallet when the integration manages wallets directly |
| `kyc.submitBusiness(req)` | Submit business KYB for review |
| `kyc.getBusiness()` | Get business KYB status |
| `kyc.submitCreator(req)` | Submit creator KYC bound to a participant |
| `kyc.getCreator(participantId)` | Get creator KYC status |

`creators.upsert` accepts an optional `userId` so a public creator can be linked to a shared identity record without exposing the operator APIs directly.

KYC/KYB submission stores a review packet and updates the existing status gates;
it does not approve verification by itself. Creator packets are anchored to the
participant `creator_balance`, not the consumer wallet:

```ts
await soledgic.kyc.submitCreator({
  participantId: 'creator_456',
  legalName: 'Jane Creator',
  email: process.env.CREATOR_EMAIL!,
  dateOfBirth: '1990-01-01',
  taxIdType: 'ssn',
  taxIdLast4: '1234',
  address: {
    line1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  documentEvidence: [{
    documentType: 'government_id',
    providerDocumentId: 'persona_doc_123',
  }],
  certifyTaxInfo: true,
})
```

### Wallets, Transfers, and Holds

| Method | Description |
| --- | --- |
| `users.upsertWallet(req)` | Create or update a user wallet |
| `wallets.list(filters?)` | List wallet objects by owner or wallet type |
| `wallets.create(req)` | Create a scoped wallet object |
| `wallets.get(walletId)` | Fetch a wallet object by wallet id |
| `wallets.listActivity(walletId, opts?)` | List entries for a wallet object |
| `walletSessions.create(req)` | Create a short-lived hosted wallet page session |
| `wallets.createHostedSession(req)` | Alias for hosted wallet session creation |
| `wallets.topUp(req)` | Top up a wallet object |
| `wallets.withdraw(req)` | Withdraw from a wallet object |
| `wallets.transfer(req)` | Move funds between wallets when transfer is permitted |
| `holds.list(opts?)` | List held funds |
| `holds.release(req)` | Release a hold and optionally execute the transfer |

Supported wallet types:

- `consumer_credit`: closed-loop platform credits
- `creator_earnings`: payout-eligible seller or creator proceeds

`wallets.create` currently provisions scoped consumer-credit wallets. Creator
earnings wallets are provisioned through participant and treasury flows.
Wallets and hosted wallet sessions are always bound to the organization behind
the API key's ledger. Use stable `ownerId` / `externalUserId` values for your
users; do not pass organization identifiers from your frontend.

Hosted wallet sessions have two explicit account paths. Buyer sessions use
`ownerType: 'consumer'` or `'user'` and open a `user_wallet`:

```ts
await soledgic.walletSessions.create({
  ownerId: 'sole_user_123',
  ownerType: 'consumer',
  customerEmail: process.env.BUYER_EMAIL,
  permissions: ['view_balance', 'list_activity', 'top_up'],
  idempotencyKey: 'wallet_session_user_123_001',
})
```

Creator earnings sessions use `ownerType: 'participant'` or `'creator'`; the
`ownerId` must be the creator `participant_id`, and the participant must already
have an active identity link and `creator_balance`:

```ts
await soledgic.walletSessions.create({
  ownerId: 'creator_456',
  ownerType: 'participant',
  permissions: ['view_balance', 'list_activity'],
  idempotencyKey: 'wallet_session_creator_456_001',
})
```

### Checkout, Payouts, and Refunds

| Method | Description |
| --- | --- |
| `orders.createCheckout(req)` | Create hosted or direct checkout flows for an order |
| `purchases.create(req)` | Create a purchase checkout flow |
| `payouts.request(req)` | Create a payout request |
| `payouts.getEligibility(creatorId)` | Check creator payout readiness |
| `refunds.request(req)` | Request a refund through Soledgic |
| `refunds.list(req?)` | Query refunds, including by `saleReference` |
| `refundRequests.create(req)` | Create a buyer-facing refund request without moving money |
| `refundRequests.list(req?)` | List refund requests by status, sale, or buyer |
| `refundRequests.approve(req)` | Approve a pending request and execute the Soledgic-routed refund |
| `refundRequests.reject(req)` | Reject a pending request without moving funds |
| `refundRequests.cancel(req)` | Cancel a pending buyer request before approval |
| `reversals.create(req)` | Create an accounting reversal |
| `receipts.generate(req)` | Generate a Soledgic-owned financial receipt for a checkout or sale |
| `receipts.get(receiptId)` | Fetch a Soledgic-owned receipt reference |
| `receipts.upload(req)` | Legacy app-owned proof document upload, not the preferred checkout receipt path |
| `activity.listWallet(walletId, opts?)` | List wallet activity for a user-facing activity feed |
| `activity.listRefunds(req?)` | List refund activity |

Buyer-facing apps should create refund requests from their server, then approve,
reject, or cancel those requests through platform support or admin tooling.
`refunds.request()` remains available as the approved execution path for existing
server integrations.

### Sandbox Helpers

| Method | Description |
| --- | --- |
| `sandbox.completeCheckout(req)` | Complete a hosted sandbox checkout and queue checkout webhooks |
| `sandbox.failCheckout(req)` | Fail a hosted sandbox checkout and queue failure webhooks |
| `sandbox.sendTestWebhook(req)` | Send a signed sandbox test event such as `payout.failed` |
| `sandbox.sendScenario(req)` | Send a canned bridge scenario such as `refund.created`, `payout.failed`, or `dispute.created` |
| `sandbox.listEvents(req?)` | Inspect recent sandbox webhook deliveries |
| `sandbox.cleanup(req?)` | Preview or reset sandbox runtime data while preserving webhook endpoints |

Sandbox helpers require test API keys, never run against live ledgers, and never
call a payment processor. Sandbox payout testing uses the normal
`payouts.request()` path with a test key; it does not call a bank rail and can
emit `payout.created` or `payout.failed` webhook events for integration testing.

Use `sandbox.cleanup()` for cleanup previews and controlled resets:

```ts
const preview = await soledgic.sandbox.cleanup({
  scope: 'run',
  source: 'sole_society_smoke',
  runId: 'run_2026_05_13_001',
})

const reset = await soledgic.sandbox.cleanup({
  scope: 'sandbox_ledger',
  confirm: true,
})
```

Run-scoped cleanup deletes one selected smoke run when `confirm: true` is passed
with `source` or `runId`. `scope: 'sandbox_ledger'` resets sandbox runtime
records for the test ledger and preserves webhook endpoint configuration.

Use canned scenarios to test non-happy-path bridge handling:

```ts
await soledgic.sandbox.sendScenario({
  scenario: 'dispute.created',
  idempotencyKey: 'sandbox_dispute_order_1001',
  source: 'bridge_smoke',
  runId: 'run_2026_05_13_001',
  checkoutId: 'chk_test_123',
  orderId: 'order_1001',
  paymentId: 'pay_test_123',
  amountCents: 2999,
  reason: 'customer_dispute',
})
```

### Webhooks

| Method | Description |
| --- | --- |
| `webhooks.listEndpoints()` | List configured webhook endpoints |
| `webhooks.createEndpoint(config)` | Create a webhook endpoint |
| `webhooks.updateEndpoint(endpointId, updates)` | Update a webhook endpoint |
| `webhooks.deleteEndpoint(endpointId)` | Delete a webhook endpoint |
| `webhooks.listDeliveries(endpointId?, limit?)` | Inspect recent deliveries |
| `webhooks.listDeliveries(filters)` | Inspect deliveries by endpoint, event, status, checkout ID, order ID, or payment ID |
| `webhooks.rotateSecret(endpointId)` | Rotate an endpoint secret |
| `webhooks.replayDelivery(deliveryId)` | Immediately replay a delivery and return delivery outcomes |
| `webhooks.retryDelivery(deliveryId)` | Queue a delivery for the normal retry worker |
| `webhooks.verifySignature(...)` | Verify `X-Soledgic-Signature` |
| `webhooks.parseEvent(payload)` | Parse a webhook payload into an event object |

Webhook endpoint secrets are opaque values returned by the API. New Soledgic
webhook secrets use the `wh_sec_slk` prefix.

```ts
const deliveries = await soledgic.webhooks.listDeliveries({
  eventType: 'checkout.completed',
  checkoutId: 'chk_test_123',
  orderId: 'order_1001',
  paymentId: 'pay_test_123',
  limit: 25,
})
```

## Testing Utilities

The package exports helpers for bridge smoke tests and webhook contract tests:

```ts
import {
  SOLEDGIC_SANDBOX_WEBHOOK_EVENTS,
  assertSandboxCheckoutCompleted,
  buildSandboxScenarioPayload,
  buildSandboxRunMetadata,
  buildTestWebhook,
  verifyWebhookSignature,
} from '@soledgic/sdk'

const metadata = buildSandboxRunMetadata({
  source: 'sole_society_smoke',
  runId: 'run_2026_05_13_001',
  externalOrderId: 'order_1001',
})

const webhook = await buildTestWebhook({
  secret: process.env.SOLEDGIC_WEBHOOK_SECRET!,
  eventType: 'checkout.completed',
  data: {
    checkout_session_id: 'chk_test_123',
    payment_id: 'pay_test_123',
    amount_cents: 2999,
    currency: 'USD',
    sandbox_idempotency_key: 'sandbox_complete_order_1001',
    metadata,
  },
})

const valid = await verifyWebhookSignature(
  webhook.rawBody,
  webhook.headers['X-Soledgic-Signature'],
  process.env.SOLEDGIC_WEBHOOK_SECRET!,
)

if (valid) {
  const completed = assertSandboxCheckoutCompleted(webhook.rawBody)
  console.log(completed.checkoutSessionId)
}

const payoutFailure = buildSandboxScenarioPayload({
  scenario: 'payout.failed',
  source: 'sole_society_smoke',
  runId: 'run_2026_05_13_001',
  paymentId: 'pay_test_123',
  participantId: 'creator_123',
  amountCents: 2999,
  reason: 'bank_account_closed',
})

console.log(SOLEDGIC_SANDBOX_WEBHOOK_EVENTS)
```

The signed test webhook builder is for local contract tests. For end-to-end
sandbox bridge smokes, prefer creating a sandbox checkout and calling
`sandbox.completeCheckout()` so Soledgic queues the real sandbox delivery.

## Replay Safety

Replay protection is endpoint-specific:

- direct checkout mode supports `idempotencyKey`
- refunds support `idempotencyKey`
- refund requests support `idempotencyKey`
- wallet writes, transfers, and payouts rely on stable `referenceId`

If your integration retries requests or replays processor events, treat `referenceId` as mandatory for treasury writes even when the type allows it.

## Error Handling

```ts
import { SoledgicError } from '@soledgic/sdk'

try {
  await soledgic.payouts.request({
    participantId: 'creator_456',
    referenceId: 'payout_retry_safe_001',
    amount: 999999,
    payoutMethod: 'bank',
  })
} catch (error) {
  if (error instanceof SoledgicError) {
    console.log(error.message)
    console.log(error.status)
    console.log(error.code)
  }
}
```

The SDK surfaces structured `error_code` values from the API when they are present. Use those codes for client logic instead of matching on human-readable messages.

## Release Notes

- `0.4.0` adds webhook replay/retry client helpers, sandbox cleanup/reset helpers, signed webhook testing utilities, sandbox mode assertions, and dispute/chargeback/hold webhook event types.
- `0.3.3` adds sandbox helpers, sandbox payout webhook event types, the buyer-facing `refundRequests` namespace, and Soledgic-owned receipt generation.
- `0.3.0` adds the namespaced SDK contract while keeping top-level compatibility shims for existing integrations.

## Security Boundary

This SDK is intentionally limited to the public integration contract:

- API-key treasury resources under `/v1/*`
- webhook verification helpers

The SDK performs network requests only to the configured Soledgic API endpoint.
It does not include analytics, telemetry, third-party trackers, or bundled
runtime dependencies.
