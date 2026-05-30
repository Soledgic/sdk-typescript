import type { SandboxScenarioRequest, SandboxWebhookEventType, WebhookPayloadInput } from './types'
import { hmacHex, parseWebhookEvent, webhookPayloadToString } from './webhooks'

export const SOLEDGIC_SANDBOX_WEBHOOK_EVENTS = [
  'sandbox.test',
  'checkout.completed',
  'checkout.failed',
  'dispute.created',
  'dispute.funds_withdrawn',
  'chargeback.created',
  'chargeback.funds_withdrawn',
  'hold.created',
  'hold.released',
  'hold.failed',
  'refund_request.created',
  'refund_request.completed',
  'refund_request.rejected',
  'refund_request.cancelled',
  'refund.created',
  'sale.refunded',
  'payout.created',
  'payout.executed',
  'payout.failed',
] as const satisfies readonly SandboxWebhookEventType[]

export const SOLEDGIC_SANDBOX_TEST_CARDS = [
  {
    brand: 'visa',
    cardId: 'sandbox_visa_success',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    last4: '4242',
    number: '4242 4242 4242 4242',
    outcome: 'succeeded',
    postalCode: '10001',
  },
  {
    brand: 'mastercard',
    cardId: 'sandbox_mastercard_success',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    last4: '4444',
    number: '5555 5555 5555 4444',
    outcome: 'succeeded',
    postalCode: '10001',
  },
  {
    brand: 'visa',
    cardId: 'sandbox_visa_declined',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    last4: '0002',
    number: '4000 0000 0000 0002',
    outcome: 'declined',
    postalCode: '10001',
  },
] as const

export interface SandboxRunMetadataInput {
  source: string
  runId: string
  externalOrderId?: string
  externalUserId?: string
  extra?: Record<string, unknown>
}

export interface SandboxCheckoutCompletedAssertion {
  checkoutSessionId: string
  paymentId: string
  externalOrderId: string | null
  externalUserId: string | null
  currency: string
  sandboxIdempotencyKey: string
  source: string | null
  runId: string | null
}

export interface BuildTestWebhookInput {
  eventType?: SandboxWebhookEventType
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  secret: string
  deliveryId?: string
  timestamp?: number | Date
  attempt?: number
}

export interface BuiltTestWebhook {
  payload: Record<string, unknown>
  rawBody: string
  headers: Record<string, string>
}

export type SandboxScenarioPayloadInput = Omit<SandboxScenarioRequest, 'idempotencyKey'>

function asObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`)
  }
  return value as Record<string, unknown>
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function requireString(value: unknown, field: string): string {
  const result = stringOrNull(value)
  if (!result) {
    throw new Error(`${field} must be a non-empty string`)
  }
  return result
}

function epochSeconds(value?: number | Date): number {
  if (value instanceof Date) return Math.floor(value.getTime() / 1000)
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value)
  return Math.floor(Date.now() / 1000)
}

function randomId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, '')}`
  }
  return `${prefix}_${Date.now().toString(36)}`
}

export function buildSandboxRunMetadata(input: SandboxRunMetadataInput): Record<string, unknown> {
  return {
    ...input.extra,
    mode: 'sandbox',
    source: input.source,
    run_id: input.runId,
    ...(input.externalOrderId ? { external_order_id: input.externalOrderId } : {}),
    ...(input.externalUserId ? { external_user_id: input.externalUserId } : {}),
  }
}

function amountCents(value: unknown, fallback = 1000): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : fallback
}

function isoString(value: string | Date | undefined): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value.trim().length > 0) return value
  return new Date().toISOString()
}

function scenarioResourceId(prefix: string, input: SandboxScenarioPayloadInput): string {
  const seed = input.paymentId || input.checkoutId || input.orderId || input.runId
  return seed ? `${prefix}_${seed.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40)}` : randomId(prefix)
}

export function buildSandboxScenarioPayload(input: SandboxScenarioPayloadInput): Record<string, unknown> {
  const cents = amountCents(input.amountCents)
  const currency = input.currency || 'USD'
  const checkoutId = input.checkoutId || null
  const paymentId = input.paymentId || null
  const orderId = input.orderId || input.externalOrderId || null
  const externalOrderId = input.externalOrderId || input.orderId || null
  const participantId = input.participantId || input.creatorId || null
  const occurredAt = isoString(input.occurredAt)
  const metadata = {
    ...buildSandboxRunMetadata({
      source: input.source || 'sandbox_scenario',
      runId: input.runId || scenarioResourceId('run', input),
      externalOrderId: externalOrderId || undefined,
      externalUserId: input.externalUserId,
      extra: input.metadata,
    }),
    scenario: input.scenario,
    ...(checkoutId ? { checkout_session_id: checkoutId, checkout_id: checkoutId } : {}),
    ...(paymentId ? { payment_id: paymentId } : {}),
  }
  const common = {
    mode: 'sandbox',
    sandbox: true,
    scenario: input.scenario,
    occurred_at: occurredAt,
    amount: cents / 100,
    amount_cents: cents,
    currency,
    checkout_id: checkoutId,
    checkout_session_id: checkoutId,
    order_id: orderId,
    external_order_id: externalOrderId,
    payment_id: paymentId,
    participant_id: participantId,
    creator_id: input.creatorId || input.participantId || null,
    customer_id: input.customerId || input.externalUserId || null,
    external_user_id: input.externalUserId || input.customerId || null,
    reason: input.reason || null,
    metadata,
  }

  switch (input.scenario) {
    case 'checkout.failed':
      return {
        ...common,
        status: 'failed',
        failure_reason: input.reason || 'sandbox_checkout_failed',
      }
    case 'refund.created':
    case 'sale.refunded':
      return {
        ...common,
        refund_id: scenarioResourceId('refund', input),
        transaction_id: scenarioResourceId('txn_refund', input),
        original_sale_reference: paymentId || checkoutId || orderId,
        refunded_amount: cents / 100,
        refunded_amount_cents: cents,
      }
    case 'payout.failed':
      return {
        ...common,
        payout_id: scenarioResourceId('payout', input),
        status: 'failed',
        failure_reason: input.reason || 'sandbox_payout_failed',
      }
    case 'dispute.created':
    case 'dispute.funds_withdrawn':
      return {
        ...common,
        dispute_id: scenarioResourceId('dispute', input),
        dispute_status: input.scenario === 'dispute.created' ? 'created' : 'funds_withdrawn',
      }
    case 'chargeback.created':
    case 'chargeback.funds_withdrawn':
      return {
        ...common,
        chargeback_id: scenarioResourceId('chargeback', input),
        chargeback_status: input.scenario === 'chargeback.created' ? 'created' : 'funds_withdrawn',
      }
    case 'hold.created':
    case 'hold.released':
    case 'hold.failed':
      return {
        ...common,
        hold_id: scenarioResourceId('hold', input),
        hold_status: input.scenario.replace('hold.', ''),
      }
  }
}

export function assertSandboxWebhookMode(
  payload: WebhookPayloadInput,
  expectedEventType?: SandboxWebhookEventType | string,
) {
  const event = parseWebhookEvent<Record<string, unknown>>(payload)
  const root = asObject(event.raw, 'payload')
  const data = asObject(root.data, 'payload.data')

  if (expectedEventType && event.type !== expectedEventType) {
    throw new Error(`event must be ${expectedEventType}`)
  }
  if (root.mode !== 'sandbox' || data.mode !== 'sandbox') {
    throw new Error('sandbox webhook mode markers are required')
  }
  if (root.livemode !== false || data.sandbox !== true) {
    throw new Error('sandbox webhooks must be non-live sandbox events')
  }

  return event
}

export function assertSandboxCheckoutCompleted(payload: WebhookPayloadInput): SandboxCheckoutCompletedAssertion {
  const event = assertSandboxWebhookMode(payload, 'checkout.completed')
  const data = asObject(event.raw.data, 'payload.data')
  const metadata = asObject(data.metadata, 'payload.data.metadata')

  if (!Number.isInteger(data.amount_cents) || Number(data.amount_cents) <= 0) {
    throw new Error('payload.data.amount_cents must be a positive integer')
  }

  return {
    checkoutSessionId: requireString(data.checkout_session_id, 'payload.data.checkout_session_id'),
    paymentId: requireString(data.payment_id, 'payload.data.payment_id'),
    externalOrderId: stringOrNull(data.external_order_id),
    externalUserId: stringOrNull(data.external_user_id),
    currency: requireString(data.currency, 'payload.data.currency'),
    sandboxIdempotencyKey: requireString(data.sandbox_idempotency_key, 'payload.data.sandbox_idempotency_key'),
    source: stringOrNull(metadata.source),
    runId: stringOrNull(metadata.run_id),
  }
}

export async function buildTestWebhook(input: BuildTestWebhookInput): Promise<BuiltTestWebhook> {
  const eventType = input.eventType || 'sandbox.test'
  const timestamp = epochSeconds(input.timestamp)
  const deliveryId = input.deliveryId || randomId('wdel_test')
  const attempt = input.attempt ?? 1
  const metadata = {
    mode: 'sandbox',
    ...(input.metadata || {}),
  }
  const payload = {
    id: randomId('evt_test'),
    event: eventType,
    mode: 'sandbox',
    livemode: false,
    data: {
      mode: 'sandbox',
      sandbox: true,
      occurred_at: new Date(timestamp * 1000).toISOString(),
      metadata,
      ...(input.data || {}),
    },
  }
  const rawBody = webhookPayloadToString(payload)
  const signature = await hmacHex(input.secret, `${timestamp}.${rawBody}`)

  return {
    payload,
    rawBody,
    headers: {
      'Content-Type': 'application/json',
      'X-Soledgic-Signature': `t=${timestamp},v1=${signature}`,
      'X-Soledgic-Event': eventType,
      'X-Soledgic-Delivery-Id': deliveryId,
      'X-Soledgic-Attempt': String(attempt),
    },
  }
}
