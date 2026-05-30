/**
 * Soledgic SDK Type Definitions
 * All request/response interfaces and type aliases
 */

export interface SoledgicConfig {
  apiKey: string
  /** API base URL. Defaults to Soledgic's public v1 API endpoint. */
  baseUrl?: string
  /** Request timeout in milliseconds. Default: 30000 (30s). */
  timeout?: number
  /** API version header to send with requests. Default: 2026-03-01. */
  apiVersion?: string
}

export type WebhookPayloadInput =
  | string
  | ArrayBuffer
  | ArrayBufferView
  | Record<string, unknown>

export interface VerifyWebhookSignatureOptions {
  toleranceSeconds?: number
  now?: number | Date
}

export interface ParsedWebhookEvent<T = Record<string, unknown>> {
  id: string | null
  type: string
  createdAt: string | null
  livemode: boolean | null
  data: T | null
  raw: Record<string, unknown>
}

export interface WebhookEndpoint {
  id: string
  url: string
  description: string | null
  events: string[]
  isActive: boolean
  createdAt: string
  secretRotatedAt: string | null
}

export interface WebhookEndpointSecretResult extends WebhookEndpoint {
  secret: string | null
}

export interface WebhookDelivery {
  id: string
  endpointId: string | null
  endpointUrl: string | null
  eventType: string
  status: string
  attempts: number
  maxAttempts: number | null
  responseStatus: number | null
  responseBody: string | null
  responseTimeMs: number | null
  createdAt: string
  deliveredAt: string | null
  nextRetryAt: string | null
  payload: Record<string, unknown> | null
}

export interface WebhookDeliveriesRequest {
  endpointId?: string
  eventType?: string
  status?: string
  checkoutId?: string
  orderId?: string
  paymentId?: string
  limit?: number
}

export interface WebhookDeliveriesResponse {
  success: boolean
  data: WebhookDelivery[]
}

export type SandboxWebhookEventType =
  | 'sandbox.test'
  | 'checkout.completed'
  | 'checkout.failed'
  | 'dispute.created'
  | 'dispute.funds_withdrawn'
  | 'chargeback.created'
  | 'chargeback.funds_withdrawn'
  | 'hold.created'
  | 'hold.released'
  | 'hold.failed'
  | 'refund_request.created'
  | 'refund_request.completed'
  | 'refund_request.rejected'
  | 'refund_request.cancelled'
  | 'refund.created'
  | 'sale.refunded'
  | 'payout.created'
  | 'payout.executed'
  | 'payout.failed'

export type SandboxScenarioType =
  | 'checkout.failed'
  | 'refund.created'
  | 'sale.refunded'
  | 'payout.failed'
  | 'dispute.created'
  | 'dispute.funds_withdrawn'
  | 'chargeback.created'
  | 'chargeback.funds_withdrawn'
  | 'hold.created'
  | 'hold.released'
  | 'hold.failed'

export interface SandboxScenarioRequest {
  idempotencyKey: string
  scenario: SandboxScenarioType
  source?: string
  runId?: string
  checkoutId?: string
  orderId?: string
  externalOrderId?: string
  paymentId?: string
  participantId?: string
  creatorId?: string
  customerId?: string
  externalUserId?: string
  amountCents?: number
  currency?: string
  reason?: string
  occurredAt?: string | Date
  metadata?: Record<string, unknown>
}

// === REQUEST TYPES ===

export interface RecordIncomeRequest {
  referenceId: string
  amount: number
  description?: string
  category?: string
  customerId?: string
  customerName?: string
  receivedTo?: string
  invoiceId?: string
  transactionDate?: string
  metadata?: Record<string, unknown>
}

export interface RecordExpenseRequest {
  referenceId: string
  amount: number
  description?: string
  category?: string
  vendorId?: string
  vendorName?: string
  paidFrom?: 'cash' | 'credit_card' | string
  receiptUrl?: string
  taxDeductible?: boolean
  transactionDate?: string
  metadata?: Record<string, unknown>
  authorizingInstrumentId?: string
  riskEvaluationId?: string
  authorizationDecisionId?: string
}

export interface RecordBillRequest {
  amount: number
  description: string
  vendorName: string
  vendorId?: string
  referenceId?: string
  dueDate?: string
  expenseCategory?: string
  paid?: boolean
  metadata?: Record<string, unknown>
  authorizingInstrumentId?: string
  riskEvaluationId?: string
  authorizationDecisionId?: string
}

// === AUTHORIZING INSTRUMENTS ===

export interface ExtractedTerms {
  amount: number          // Amount in cents
  currency: string        // ISO currency code (e.g., "USD")
  cadence?: 'one_time' | 'monthly' | 'quarterly' | 'annual' | 'weekly' | 'bi_weekly'
  counterpartyName: string
}

export interface RegisterInstrumentRequest {
  externalRef: string
  extractedTerms: ExtractedTerms
}

export interface RegisterInstrumentResponse {
  success: boolean
  instrumentId: string
  fingerprint: string
  externalRef: string
}

export interface AuthorizationResult {
  verified: boolean
  instrumentId: string
  externalRef: string
  mismatches?: string[]
}

// === SHADOW LEDGER (GHOST ENTRIES) ===

export interface ProjectIntentRequest {
  authorizingInstrumentId: string
  untilDate: string  // ISO date string
  horizonCount?: number  // Max projections to create (default 12, max 60)
}

export interface ProjectIntentResponse {
  success: boolean
  instrumentId: string
  externalRef: string
  cadence: string
  projectionsCreated: number
  projectionsRequested: number
  duplicatesSkipped: number
  dateRange: {
    from: string
    to: string
  }
  projectedDates: string[]
}

export interface ProjectionMatch {
  matched: boolean
  projectionId: string
  expectedDate: string
  instrumentId: string
}

export interface ObligationItem {
  expectedDate: string
  amount: number
  currency: string
  counterparty: string | null
}

export interface Obligations {
  pendingTotal: number
  pendingCount: number
  items: ObligationItem[]
}

export interface BreachRisk {
  atRisk: boolean
  shortfall: number
  coverageRatio: number
}

// === BREACH ALERTS ===

export type AlertType = 'breach_risk' | 'projection_created' | 'instrument_invalidated'
export type AlertChannel = 'slack' | 'email' | 'webhook'

export interface AlertThresholds {
  coverageRatioBelow?: number  // Trigger when coverage drops below (default 0.5 = 50%)
  shortfallAbove?: number      // Trigger when shortfall exceeds (default 0)
}

export interface SlackAlertConfig {
  webhookUrl: string
  channel?: string
}

export interface EmailAlertConfig {
  recipients: string[]
}

export interface AlertConfiguration {
  id: string
  alertType: AlertType
  channel: AlertChannel
  config: SlackAlertConfig | EmailAlertConfig | Record<string, any>
  thresholds: AlertThresholds
  isActive: boolean
  lastTriggeredAt?: string
  triggerCount: number
  createdAt: string
}

export interface CreateAlertRequest {
  alertType: AlertType
  channel: AlertChannel
  config: SlackAlertConfig | EmailAlertConfig
  thresholds?: AlertThresholds
  isActive?: boolean
}

export interface UpdateAlertRequest {
  configId: string
  config?: Partial<SlackAlertConfig | EmailAlertConfig>
  thresholds?: AlertThresholds
  isActive?: boolean
}

export interface AlertTestResult {
  success: boolean
  message: string
  channel?: string
  error?: string
}

// === PREFLIGHT AUTHORIZATION (Phase 3) ===

export type PolicyType = 'require_instrument' | 'budget_cap' | 'projection_guard'
export type PolicySeverity = 'hard' | 'soft'
export type AuthorizationDecisionType = 'allowed' | 'warn' | 'blocked'

export interface PolicyViolation {
  policyId: string
  policyType: PolicyType
  severity: PolicySeverity
  reason: string
}

export interface PreflightAuthorizationRequest {
  idempotencyKey: string
  amount: number  // In cents
  currency?: string
  counterpartyName?: string
  authorizingInstrumentId?: string
  expectedDate?: string
  category?: string
}

export interface PreflightAuthorizationResponse {
  success: boolean
  cached: boolean
  decision: {
    id: string
    decision: AuthorizationDecisionType
    violatedPolicies: PolicyViolation[]
    expiresAt: string
    createdAt: string
  }
  message?: string
}

export interface AuthorizationPolicy {
  id: string
  policyType: PolicyType
  config: Record<string, any>
  severity: PolicySeverity
  priority: number
  isActive: boolean
  createdAt: string
}

export interface CreatePolicyRequest {
  policyType: PolicyType
  config: Record<string, any>
  severity?: PolicySeverity
  priority?: number
}

export interface PreflightResult {
  decisionId: string
  decision: AuthorizationDecisionType
  warning?: string
}

export interface RecordRefundResponse {
  success: boolean
  transactionId: string | null
  referenceId: string | null
  saleReference: string | null
  refundedAmount: number | null
  currency: string | null
  status: string | null
  breakdown: {
    fromCreator: number
    fromPlatform: number
  } | null
  isFullRefund: boolean | null
  repairPending?: boolean | null
  warning?: string | null
  warningCode?: string | null
}

export interface ListRefundsRequest {
  saleReference?: string
  limit?: number
}

export interface RefundSummary {
  id: string
  transactionId: string | null
  referenceId: string | null
  saleReference: string | null
  refundedAmount: number
  currency: string
  status: string
  reason: string | null
  refundFrom: string | null
  externalRefundId: string | null
  createdAt: string | null
  breakdown: {
    fromCreator: number
    fromPlatform: number
  } | null
  repairPending?: boolean | null
  lastError?: string | null
}

export interface ListRefundsResponse {
  success: boolean
  refunds: RefundSummary[]
  count: number
}

export interface ReverseTransactionRequest {
  transactionId: string
  reason: string
  partialAmount?: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface CreatePeriodRequest {
  startDate: string
  endDate: string
  name?: string
}

export interface ReconcileMatchRequest {
  transactionId: string
  bankTransactionId: string
}

export interface CreateSnapshotRequest {
  periodId?: string
  asOfDate?: string
}

export interface BackdatePolicyRequest {
  policyType: 'none' | 'soft' | 'hard'
  gracePeriodDays?: number
  maxBackdateDays?: number
  requireApproval?: boolean
  allowCurrentMonth?: boolean
  allowPriorMonth?: boolean
  blockPriorQuarter?: boolean
}

export interface ParticipantTaxInfo {
  taxIdType?: 'ssn' | 'ein' | 'itin'
  taxIdLast4?: string
  legalName?: string
  businessType?: 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 'partnership'
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
}

export interface ParticipantPayoutPreferences {
  schedule?: 'manual' | 'weekly' | 'biweekly' | 'monthly'
  minimumAmount?: number
  method?: 'card' | 'manual'
}

export interface CreateParticipantRequest {
  participantId: string
  userId?: string
  displayName?: string
  email?: string
  defaultSplitPercent?: number
  taxInfo?: ParticipantTaxInfo
  payoutPreferences?: ParticipantPayoutPreferences
  metadata?: Record<string, unknown>
}

/**
 * @deprecated Public ledger creation is retired. Use authenticated onboarding.
 */
export interface CreateLedgerRequest {
  businessName: string
  ownerEmail: string
  ledgerMode?: 'standard' | 'platform'
  settings?: {
    defaultTaxRate?: number
    defaultSplitPercent?: number
    platformFeePercent?: number
    minPayoutAmount?: number
    payoutSchedule?: 'manual' | 'weekly' | 'monthly'
    taxWithholdingPercent?: number
    currency?: string
    fiscalYearStart?: string
    receiptThreshold?: number
  }
}

export interface ExportReportRequest {
  reportType: 'transaction_detail' | 'creator_earnings' | 'platform_revenue' | 'payout_summary' | 'reconciliation' | 'audit_log'
  format: 'csv' | 'json'
  startDate?: string
  endDate?: string
  creatorId?: string
}

export interface RecordAdjustmentRequest {
  adjustmentType: 'correction' | 'reclassification' | 'accrual' | 'deferral' | 'depreciation' | 'write_off' | 'year_end' | 'opening_balance' | 'other'
  entries: Array<{
    accountType: string
    entityId?: string
    entryType: 'debit' | 'credit'
    amount: number
  }>
  reason: string
  adjustmentDate?: string
  originalTransactionId?: string
  supportingDocumentation?: string
  preparedBy: string
}

export interface RecordOpeningBalanceRequest {
  asOfDate: string
  source: 'manual' | 'imported' | 'migrated' | 'year_start'
  sourceDescription?: string
  balances: Array<{
    accountType: string
    entityId?: string
    balance: number
  }>
}

export interface RecordTransferRequest {
  fromAccountType: string
  toAccountType: string
  amount: number
  transferType: 'tax_reserve' | 'payout_reserve' | 'owner_draw' | 'owner_contribution' | 'operating' | 'savings' | 'investment' | 'other'
  description?: string
  referenceId?: string
}

export interface RiskEvaluationRequest {
  idempotencyKey: string
  amount: number
  currency?: string
  counterpartyName?: string
  authorizingInstrumentId?: string
  expectedDate?: string
  category?: string
}

export interface UploadReceiptRequest {
  fileUrl: string
  fileName?: string
  fileSize?: number
  mimeType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'
  merchantName?: string
  transactionDate?: string
  totalAmount?: number
  transactionId?: string
}

export interface GenerateReceiptRequest {
  checkoutId?: string
  checkoutSessionId?: string
  transactionId?: string
  saleTransactionId?: string
  orderId?: string
  externalOrderId?: string
  metadata?: Record<string, unknown>
}

export interface ReceiptResource {
  id: string
  receiptId: string
  status: string
  hostedUrl: string | null
  fileUrl: string | null
  checkoutSessionId: string | null
  saleTransactionId: string | null
  orderId: string | null
  externalOrderId: string | null
  totalAmount: number | null
  currency: string | null
  createdAt: string | null
  metadata: Record<string, unknown>
}

export interface GenerateReceiptResponse {
  success: boolean
  idempotent?: boolean
  receipt: ReceiptResource | null
  receiptId: string | null
  hostedUrl: string | null
}

export interface GetReceiptResponse {
  success: boolean
  receipt: ReceiptResource | null
}

export interface ReceivePaymentRequest {
  amount: number
  invoiceTransactionId?: string
  customerName?: string
  customerId?: string
  referenceId?: string
  paymentMethod?: string
  paymentDate?: string
  metadata?: Record<string, unknown>
}

export interface ParticipantWalletMutationRequest {
  participantId: string
  amount: number
  referenceId: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface ParticipantTransferRequest {
  fromParticipantId: string
  toParticipantId: string
  amount: number
  referenceId: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface HoldQueryOptions {
  participantId?: string
  ventureId?: string
  readyOnly?: boolean
  limit?: number
}

export interface ReleaseHoldRequest {
  holdId: string
  executeTransfer?: boolean
}

export type CreateCheckoutSessionRequest = {
  participantId: string
  amount: number
  currency?: 'USD'
  productId?: string
  productName?: string
  /** Customer email for hosted display/receipts. Sandbox buyer sessions can use this alone to derive a stable test wallet. */
  customerEmail?: string
  customerId?: string
  buyerUserId?: string
  purchaseMode?: 'direct_funded_wallet'
  sandboxCheckoutProvider?: 'soledgic' | 'stripe'
  metadata?: Record<string, string>
} & (
  { paymentMethodId: string; sourceId?: string; idempotencyKey: string; successUrl?: string; cancelUrl?: string } |
  { paymentMethodId?: string; sourceId: string; idempotencyKey: string; successUrl?: string; cancelUrl?: string } |
  { paymentMethodId?: undefined; sourceId?: undefined; successUrl: string; cancelUrl?: string; idempotencyKey?: string }
)

export type WalletSessionPermission =
  | 'view_balance'
  | 'list_activity'
  | 'top_up'
  | 'request_refund'

export type WalletSessionOwnerType =
  | 'user'
  | 'consumer'
  | 'participant'
  | 'creator'
  | (string & {})

export interface CreateWalletSessionRequest {
  /** Existing wallet id in the API key's ledger. Soledgic binds the session to that ledger's organization. */
  walletId?: string
  /** Your app's stable customer/user id, or the participant id for creator earnings sessions. */
  ownerId?: string
  /** Alias for ownerId. */
  externalUserId?: string
  /**
   * Use user/consumer for buyer wallet sessions and participant/creator for creator earnings sessions.
   * Creator sessions resolve participant_identity_links and require an existing creator_balance account.
   */
  ownerType?: WalletSessionOwnerType
  customerEmail?: string
  permissions?: WalletSessionPermission[]
  successUrl?: string
  cancelUrl?: string
  expiresInMinutes?: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface CreatePayoutRequest {
  participantId: string
  walletId?: string
  amount: number
  referenceId: string
  referenceType?: string
  description?: string
  payoutMethod?: string
  fees?: number
  feesPaidBy?: 'platform' | 'creator'
  metadata?: Record<string, unknown>
}

export interface CreateRefundRequest {
  saleReference: string
  reason: string
  amount?: number
  refundFrom?: 'both' | 'platform_only' | 'creator_only'
  externalRefundId?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export type RefundRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'failed'

export type RefundFrom = 'both' | 'platform_only' | 'creator_only'

export interface RefundRequestResource {
  id: string
  saleReference: string | null
  saleTransactionId: string | null
  customerId: string | null
  customerEmail: string | null
  amount: number
  amountCents: number
  currency: string | null
  reason: string | null
  refundFrom: RefundFrom | string | null
  status: RefundRequestStatus | string
  refundTransactionId: string | null
  rejectionReason: string | null
  failureReason: string | null
  createdAt: string | null
  updatedAt: string | null
  reviewedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  metadata: Record<string, unknown>
}

export interface CreateRefundRequestParams {
  saleReference: string
  originalSaleReference?: string
  amount?: number
  reason: string
  refundFrom?: RefundFrom
  customerId?: string
  customerEmail?: string
  requesterUserId?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface ListRefundRequestsParams {
  status?: RefundRequestStatus | string
  saleReference?: string
  customerId?: string
  limit?: number
}

export interface ReviewRefundRequestParams {
  refundRequestId: string
  reason?: string
  reviewedByUserId?: string
  reviewedByActor?: string
  metadata?: Record<string, unknown>
}

export interface RefundRequestResourceResponse {
  success: boolean
  idempotent?: boolean
  refundRequest: RefundRequestResource | null
  refund?: RefundResourceResponse['refund'] | null
  error?: string
  errorCode?: string
}

export interface ListRefundRequestsResponse {
  success: boolean
  refundRequests: RefundRequestResource[]
  count: number
}

export interface SandboxCheckoutCompleteRequest {
  checkoutSessionId: string
  idempotencyKey: string
  paymentId?: string
  metadata?: Record<string, unknown>
}

export interface SandboxCheckoutFailRequest {
  checkoutSessionId: string
  idempotencyKey: string
  reason?: string
  metadata?: Record<string, unknown>
}

export interface SandboxWebhookTestRequest {
  idempotencyKey: string
  eventType?: SandboxWebhookEventType
  payload?: Record<string, unknown>
}

export interface SandboxEventsRequest {
  eventType?: SandboxWebhookEventType | string
  limit?: number
  checkoutId?: string
  orderId?: string
  paymentId?: string
}

export interface SandboxCheckoutActionResponse {
  success: boolean
  idempotent?: boolean
  alreadyExists?: boolean
  status?: string | null
  checkoutSession: {
    id: string
    status: string | null
    mode: string | null
    paymentId: string | null
    referenceId: string | null
    amount: number | null
    currency: string | null
    creatorId: string | null
    productId: string | null
    productName: string | null
    completedAt: string | null
    saleTransactionId?: string | null
    webhookDeliveriesQueued?: number | null
    webhookDeliveriesDelivered?: number | null
  } | null
  webhookDeliveries?: WebhookDelivery[]
  webhookDeliveryOutcomes?: Array<{ id: string; outcome: 'delivered' | 'failed' | 'blocked' }>
  error?: string
  errorCode?: string
}

export interface SandboxWebhookTestResponse {
  success: boolean
  eventType: string
  webhookDeliveriesQueued: number
  webhookDeliveriesDelivered?: number
  webhookDeliveries: WebhookDelivery[]
  webhookDeliveryOutcomes?: Array<{ id: string; outcome: 'delivered' | 'failed' | 'blocked' }>
}

export interface SandboxEventsResponse {
  success: boolean
  count: number
  events: WebhookDelivery[]
}

export interface WebhookReplayResponse {
  success: boolean
  message?: string
  data: WebhookDelivery | null
  outcomes?: Array<{ id: string; outcome: 'delivered' | 'failed' | 'blocked' }>
}

export interface SandboxCleanupRequest {
  /** Defaults to true unless confirm is true. Set false with confirm to execute cleanup. */
  dryRun?: boolean
  /** run deletes rows matching source/runId; sandbox_ledger resets runtime data and preserves webhook endpoints. */
  scope?: 'run' | 'sandbox_ledger'
  source?: string
  runId?: string
  /** Pass true to send the required cleanup confirmation token for the selected scope. */
  confirm?: boolean
}

export interface SandboxCleanupResponse {
  success: boolean
  mode: 'sandbox'
  dryRun: boolean
  scope: 'run' | 'sandbox_ledger'
  ledgerId: string
  source: string | null
  runId: string | null
  counts: Record<string, number>
  errors?: Record<string, string>
  estimatedDeleted?: number
  cleaned?: boolean
  deleted?: Record<string, number>
  cleanup?: Record<string, unknown>
  preserved?: Record<string, number>
  message?: string
  error?: string
  errorCode?: string
}

// === UNIVERSAL INTEGRATION CONTRACT ===

export interface UpsertUserWalletRequest {
  /** Your app's stable user/customer id. The wallet is bound to the API key's organization server-side. */
  externalUserId: string
  /** Optional label for the wallet owner type. Defaults to "user". */
  ownerType?: string
  name?: string
  metadata?: Record<string, unknown>
}

export interface UpsertCreatorRequest {
  /** Your app's stable creator/seller id. */
  externalCreatorId: string
  userId?: string
  displayName?: string
  email?: string
  defaultSplitPercent?: number
  taxInfo?: ParticipantTaxInfo
  payoutPreferences?: ParticipantPayoutPreferences
  metadata?: Record<string, unknown>
}

export interface CreateCreatorWalletRequest {
  /** Your app's stable creator/seller id, mapped to a Soledgic participant. */
  creatorId: string
  name?: string
  metadata?: Record<string, unknown>
}

export type UniversalCheckoutRequest = {
  /** Your app's stable creator/seller id, mapped to participant_id. */
  creatorId: string
  amount: number
  currency?: string
  /** Your app's stable product/session id, mapped to product_id. */
  externalProductId?: string
  productName?: string
  /** Your app's stable buyer/user id, mapped to customer_id. */
  externalUserId?: string
  customerEmail?: string
  /** Your app's stable order/purchase id. Used as idempotency_key when no explicit idempotencyKey is provided. */
  externalOrderId?: string
  metadata?: Record<string, string>
} & (
  { paymentMethodId: string; sourceId?: string; idempotencyKey: string; successUrl?: string; cancelUrl?: string } |
  { paymentMethodId?: string; sourceId: string; idempotencyKey: string; successUrl?: string; cancelUrl?: string } |
  { paymentMethodId?: undefined; sourceId?: undefined; successUrl: string; cancelUrl?: string; idempotencyKey?: string }
)

// === INVOICE TYPES ===

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  amount?: number
}

export interface CreateInvoiceRequest {
  customerName: string
  customerEmail?: string
  customerId?: string
  customerAddress?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  lineItems: InvoiceLineItem[]
  taxAmount?: number
  discountAmount?: number
  dueDate?: string
  notes?: string
  terms?: string
  referenceId?: string
  metadata?: Record<string, unknown>
}

export interface RecordInvoicePaymentRequest {
  amount: number
  paymentMethod?: string
  paymentDate?: string
  referenceId?: string
  notes?: string
}

export interface PayBillRequest {
  billTransactionId?: string
  amount: number
  vendorName?: string
  referenceId?: string
  paymentMethod?: string
  paymentDate?: string
  metadata?: Record<string, unknown>
}

export interface CreateBudgetRequest {
  name: string
  categoryCode?: string
  budgetAmount: number
  budgetPeriod: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  alertAtPercentage?: number
}

export interface CreateRecurringRequest {
  name: string
  merchantName: string
  categoryCode: string
  amount: number
  recurrenceInterval: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  recurrenceDay?: number
  startDate: string
  endDate?: string
  businessPurpose: string
  isVariableAmount?: boolean
}

export interface CreateContractorRequest {
  name: string
  email?: string
  companyName?: string
}

export interface RecordContractorPaymentRequest {
  contractorId: string
  amount: number
  paymentDate: string
  paymentMethod?: string
  paymentReference?: string
  description?: string
}

export interface CreateBankAccountRequest {
  bankName: string
  accountName: string
  accountType: 'checking' | 'savings' | 'credit_card' | 'other'
  accountLastFour?: string
}

export interface SubmitTaxInfoRequest {
  participantId: string
  legalName: string
  taxIdType: 'ssn' | 'ein' | 'itin'
  taxIdLast4: string
  businessType: 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 'partnership'
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  certify: boolean
}

export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
export type KycTaxIdType = 'ssn' | 'ein' | 'itin'
export type KycBusinessType = 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 'partnership' | 'nonprofit'
export type CreatorKycBusinessType = Exclude<KycBusinessType, 'nonprofit'>
export type KycDocumentType =
  | 'government_id'
  | 'proof_of_address'
  | 'w9'
  | 'ein_letter'
  | 'articles_of_incorporation'
  | 'beneficial_owner_id'
  | 'processor_verification'
  | 'other'

export interface KycAddress {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface KycDocumentEvidence {
  documentType: KycDocumentType
  fileName?: string
  fileUrl?: string
  providerDocumentId?: string
  processorVerificationId?: string
  mimeType?: string
  fileSizeBytes?: number
  metadata?: Record<string, unknown>
}

export interface BusinessKybPrimaryContact {
  name: string
  email: string
  phone?: string
}

export interface BusinessKybBeneficialOwner {
  name?: string
  email?: string
  title?: string
  ownershipPercent?: number
  dateOfBirth?: string
  address?: KycAddress
  governmentIdLast4?: string
}

export interface SubmitBusinessKybRequest {
  businessType: KycBusinessType
  legalName: string
  taxIdType?: KycTaxIdType
  taxIdLast4?: string
  taxIdFull?: string
  primaryContact: BusinessKybPrimaryContact
  businessAddress: KycAddress
  beneficialOwners?: BusinessKybBeneficialOwner[]
  documentEvidence: KycDocumentEvidence[]
  /** Defaults to true. When false, Soledgic stores a pending draft instead of marking KYB under review. */
  submitForReview?: boolean
  metadata?: Record<string, unknown>
}

export interface SubmitCreatorKycRequest {
  participantId: string
  legalName: string
  displayName?: string
  email: string
  dateOfBirth: string
  taxIdType?: KycTaxIdType
  taxIdLast4?: string
  taxIdFull?: string
  businessType?: CreatorKycBusinessType
  address: KycAddress
  documentEvidence: KycDocumentEvidence[]
  /** Certifies the shared creator tax profile when an active participant identity link exists. */
  certifyTaxInfo?: boolean
  /** Defaults to true. When false, Soledgic stores a pending draft instead of marking KYC under review. */
  submitForReview?: boolean
  metadata?: Record<string, unknown>
}

export interface KycSubmissionSummary {
  id: string
  status: KycStatus
  submitted_at: string
  reviewed_at?: string | null
  rejection_reason?: string | null
}

export interface BusinessKybResponse {
  success: boolean
  business_kyb: {
    organization_id: string
    status: KycStatus
    missing_fields?: string[]
    latest_submission?: KycSubmissionSummary | null
    [key: string]: unknown
  }
}

export interface CreatorKycResponse {
  success: boolean
  creator_kyc: {
    participant_id: string
    connected_account_id?: string | null
    status: KycStatus
    tax_certified?: boolean
    missing_fields?: string[]
    latest_submission?: KycSubmissionSummary | null
    [key: string]: unknown
  }
}

export interface ImportBankStatementLine {
  transactionDate: string
  postDate?: string
  description: string
  amount: number
  referenceNumber?: string
  checkNumber?: string
  merchantName?: string
  categoryHint?: string
}

export interface ImportBankStatementRequest {
  bankAccountId: string
  lines: ImportBankStatementLine[]
  autoMatch?: boolean
}

// === RESPONSE TYPES ===

export interface CheckoutBreakdown {
  grossAmount: number
  creatorAmount: number
  platformAmount: number
  creatorPercent: number
}

export interface ReverseResponse {
  success: boolean
  voidType: string
  message: string
  transactionId: string
  reversalId: string | null
  reversedAmount: number | null
  isPartial: boolean | null
  voidedAt: string | null
  reversedAt: string | null
  warning: string | null
}

export interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'open' | 'closed' | 'locked' | 'archived'
  lockedAt?: string
  balanceCheck?: {
    isBalanced: boolean
    totalDebits: number
    totalCredits: number
  }
}

export interface ReconciliationSnapshot {
  id: string
  periodStart: string
  periodEnd: string
  integrityHash: string
  integrityValid: boolean
  summary: {
    totalMatched: number
    totalUnmatched: number
    matchedAmount: number
    unmatchedAmount: number
  }
}

export interface FrozenStatement {
  type: 'profit_loss' | 'balance_sheet' | 'trial_balance'
  periodId: string
  generatedAt: string
  integrityHash: string
  integrityValid: boolean
  readOnly: true
  data: any
}

export interface ParticipantSummary {
  id: string
  linkedUserId: string | null
  name: string | null
  tier: string | null
  ledgerBalance: number
  heldAmount: number
  availableBalance: number
}

export interface ParticipantDetail {
  id: string
  linkedUserId: string | null
  name: string | null
  tier: string | null
  customSplitPercent: number | null
  ledgerBalance: number
  heldAmount: number
  availableBalance: number
  holds: Array<{
    amount: number
    reason: string | null
    releaseDate: string | null
    status: string
  }>
}

export interface CreateParticipantResponse {
  success: boolean
  participant: {
    id: string
    accountId: string
    created: boolean
    linkedUserId: string | null
    identityLinkId: string | null
    identityLinkStatus: 'active' | 'pending' | null
    displayName: string | null
    email: string | null
    defaultSplitPercent: number
    payoutPreferences: Record<string, unknown>
    createdAt: string
  }
}

export interface ParticipantPayoutEligibilityResponse {
  success: boolean
  eligibility: {
    participantId: string
    eligible: boolean
    availableBalance: number
    issues: string[]
    requirements: Record<string, unknown>
  }
}

/**
 * @deprecated Public ledger creation is retired. The SDK method now throws a
 * 410 ENDPOINT_RETIRED error instead of calling /v1/create-ledger.
 */
export interface CreateLedgerResponse {
  success: boolean
  ledger: {
    id: string
    businessName: string
    ledgerMode: string
    apiKey: string
    status: string
    createdAt: string
  }
  warning: string
}

export interface ExportReportJsonResponse {
  success: boolean
  reportType: string
  generatedAt: string
  rowCount: number
  data: any[]
}

export interface ExportReportCsvResponse {
  csv: string
  filename: string
}

export interface RiskEvaluationResponse {
  success: boolean
  cached: boolean
  evaluation: {
    id: string
    signal: 'within_policy' | 'elevated_risk' | 'high_risk'
    riskFactors: Array<{
      policyId: string
      policyType: string
      severity: 'hard' | 'soft'
      indicator: string
    }>
    validUntil: string
    createdAt: string
    acknowledgedAt: string | null
  }
}

export interface FraudPolicyResource {
  id: string
  type: PolicyType
  severity: PolicySeverity
  priority: number
  isActive: boolean
  config: Record<string, unknown>
  createdAt: string | null
  updatedAt: string | null
}

export interface FraudPolicyListResponse {
  success: boolean
  policies: FraudPolicyResource[]
}

export interface FraudPolicyResponse {
  success: boolean
  policy: FraudPolicyResource
}

export interface FraudPolicyDeleteResponse {
  success: boolean
  deleted: boolean
  policyId: string
}

export interface ReconciliationMatchResponse {
  success: boolean
  match: {
    id: string
    transactionId: string
    bankTransactionId: string
    status: string
    matchedAt: string
  }
}

export interface ReconciliationUnmatchResponse {
  success: boolean
  deleted: boolean
  transactionId: string
}

export interface UnmatchedTransactionsResponse {
  success: boolean
  unmatchedCount: number
  transactions: Array<{
    id: string
    referenceId: string | null
    description: string | null
    amount: number
    currency: string
    createdAt: string
    status: string
    metadata: Record<string, unknown>
  }>
}

export interface AutoMatchReconciliationResponse {
  success: boolean
  result: {
    matched: boolean
    matchType: string | null
    matchedTransactionId: string | null
    bankAggregatorTransactionId: string
  }
}

export interface TaxDocumentsResponse {
  success: boolean
  taxYear: number
  summary: {
    totalDocuments: number
    totalAmount: number
    byStatus: {
      calculated: number
      exported: number
      filed: number
    }
  }
  documents: any[]
}

export interface TaxDocumentResponse {
  success: boolean
  document: any
}

export interface TaxDocumentGenerationResponse {
  success: boolean
  generation: {
    taxYear: number
    created: number
    skipped: number
    totalAmount: number
  }
}

export interface TaxCalculationResponse {
  success: boolean
  calculation: {
    participantId: string
    taxYear: number
    grossPayments: number
    transactionCount: number
    requires1099: boolean
    monthlyTotals: Record<string, unknown>
    threshold: number
    linkedUserId: string | null
    sharedTaxProfile: {
      status: string
      legalName: string | null
      taxIdLast4: string | null
    } | null
  }
}

export interface TaxSummaryResponse {
  success: boolean
  taxYear: number
  note: string
  summaries: Array<{
    participantId: string
    linkedUserId: string | null
    grossEarnings: number
    refundsIssued: number
    netEarnings: number
    totalPaidOut: number
    requires1099: boolean
    sharedTaxProfile: {
      status: string
      legalName: string | null
      taxIdLast4: string | null
    } | null
  }>
  totals: {
    totalGross: number
    totalRefunds: number
    totalNet: number
    totalPaid: number
    participantsRequiring1099: number
  }
}

export interface ComplianceOverviewResponse {
  success: boolean
  overview: {
    windowDays: number
    accessWindowHours: number
    totalEvents: number
    uniqueIps: number
    uniqueActors: number
    highRiskEvents: number
    criticalRiskEvents: number
    failedAuthEvents: number
    payoutsFailed: number
    refundsRecorded: number
    disputeEvents: number
  }
  note: string
}

export interface ComplianceAccessPatternsResponse {
  success: boolean
  windowHours: number
  count: number
  patterns: Array<{
    ipAddress: string
    hour: string
    requestCount: number
    uniqueActions: number
    actions: string[]
    maxRiskScore: number
    failedAuths: number
  }>
}

export interface ComplianceFinancialActivityResponse {
  success: boolean
  windowDays: number
  activity: Array<{
    date: string
    payoutsInitiated: number
    payoutsCompleted: number
    payoutsFailed: number
    salesRecorded: number
    refundsRecorded: number
    disputeEvents: number
  }>
}

export interface ComplianceSecuritySummaryResponse {
  success: boolean
  windowDays: number
  summary: Array<{
    date: string
    action: string
    eventCount: number
    uniqueIps: number
    uniqueActors: number
    avgRiskScore: number
    maxRiskScore: number
    highRiskCount: number
    criticalRiskCount: number
  }>
}

export interface UploadReceiptResponse {
  success: boolean
  receiptId: string
  status: 'uploaded' | 'matched' | 'orphan'
  linkedTransactionId: string | null
}

export interface ReceivePaymentResponse {
  success: boolean
  transactionId: string
  amount: number
}

// === WALLET TYPES ===

export interface WalletObject {
  id: string
  object: 'wallet'
  walletType: 'consumer_credit' | 'creator_earnings'
  scopeType: 'customer' | 'participant'
  ownerId: string | null
  ownerType: string | null
  participantId: string | null
  accountType: string
  name: string | null
  currency: string
  status: string
  balance: number
  heldAmount: number
  availableBalance: number
  redeemable: boolean
  transferable: boolean
  topupSupported: boolean
  payoutSupported: boolean
  createdAt: string | null
  metadata: Record<string, unknown>
}

export interface ListWalletsRequest {
  ownerId?: string
  ownerType?: string
  walletType?: WalletObject['walletType']
  limit?: number
  offset?: number
}

export interface ListWalletsResponse {
  success: boolean
  wallets: WalletObject[]
  total: number
  limit: number
  offset: number
}

export interface CreateWalletRequest {
  /** Your app's stable customer/user id. The wallet is scoped to the API key's ledger organization. */
  ownerId?: string
  /** Participant id for creator earnings wallets. */
  participantId?: string
  ownerType?: string
  walletType: WalletObject['walletType']
  name?: string
  metadata?: Record<string, unknown>
}

export interface CreateWalletResponse {
  success: boolean
  created: boolean
  wallet: WalletObject
}

export interface GetWalletResponse {
  success: boolean
  wallet: WalletObject
}

export interface WalletEntriesResponse {
  success: boolean
  wallet: WalletObject | null
  entries: WalletHistoryEntry[]
  total: number
  limit: number
  offset: number
}

export interface WalletTopupRequest {
  walletId: string
  amount: number
  referenceId: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface WalletTopupResponse {
  success: boolean
  walletId: string | null
  ownerId: string | null
  transactionId: string | null
  balance: number | null
}

export interface WalletWithdrawRequest {
  walletId: string
  /** Amount in cents */
  amount: number
  referenceId: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface WalletWithdrawalResponse {
  success: boolean
  walletId: string | null
  ownerId: string | null
  transactionId: string | null
  balance: number | null
}

export interface WalletHistoryEntry {
  entryId: string
  entryType: 'debit' | 'credit'
  amount: number
  transactionId: string
  referenceId: string
  transactionType: string
  description: string | null
  status: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface ParticipantTransferResponse {
  success: boolean
  transfer: {
    transactionId: string
    fromParticipantId: string
    toParticipantId: string
    fromBalance: number
    toBalance: number
  }
}

export interface HeldFund {
  id: string
  participantId: string | null
  participantName: string | null
  amount: number
  currency: string
  heldSince: string
  daysHeld: number
  holdReason: string | null
  holdReasonCode: string
  holdReasonDescription: string
  holdUntil: string | null
  readyForRelease: boolean
  releaseStatus: string
  transactionReference: string | null
  productName: string | null
  ventureId: string | null
  connectedAccountReady: boolean
}

export interface HeldFundsResponse {
  success: boolean
  holds: HeldFund[]
  count: number
}

export interface HeldFundsSummaryResponse {
  success: boolean
  summary: Record<string, unknown>
}

export interface ReleaseHoldResponse {
  success: boolean
  release: {
    id: string
    holdId: string
    executed: boolean
    transferId: string | null
    transferStatus: string | null
    amount: number | null
    currency: string | null
  }
}

export interface CheckoutSessionResourceResponse {
  success: boolean
  checkoutSession: {
    id: string
    mode: 'session' | 'direct' | string
    provider: string | null
    checkoutUrl: string | null
    paymentId: string | null
    paymentIntentId: string | null
    status: string | null
    requiresAction: boolean
    amount: number
    currency: string
    expiresAt: string | null
    sandbox: boolean
    fundingTransactionId: string | null
    saleTransactionId: string | null
    saleReference: string | null
    breakdown: CheckoutBreakdown | null
  }
}

export interface WalletSessionObject {
  id: string
  object: 'wallet_session'
  walletId: string
  externalUserId: string | null
  customerEmail: string | null
  permissions: WalletSessionPermission[]
  status: string
  walletUrl: string
  successUrl: string | null
  cancelUrl: string | null
  expiresAt: string
  createdAt: string | null
  metadata: Record<string, unknown>
}

export interface CreateWalletSessionResponse {
  success: boolean
  alreadyExists?: boolean
  walletSession: WalletSessionObject
}

export interface PayoutResourceResponse {
  success: boolean
  payout: {
    id: string
    transactionId: string
    grossAmount: number | null
    grossAmountCents?: number | null
    fees: number | null
    feesCents?: number | null
    netAmount: number | null
    netAmountCents?: number | null
    previousBalance: number | null
    previousBalanceCents?: number | null
    newBalance: number | null
    newBalanceCents?: number | null
    status?: string | null
    simulated?: boolean
    livemode?: boolean
    payoutRail?: 'processor' | 'sandbox' | string | null
    processorTransferId?: string | null
    processorTransferStatus?: string | null
    webhookDeliveriesQueued?: number | null
    webhookDeliveriesDelivered?: number | null
    webhookDeliveryOutcomes?: Array<{ id: string; outcome: 'delivered' | 'failed' | 'blocked' }>
  }
}

export interface RefundResourceResponse {
  success: boolean
  refund: {
    id: string
    transactionId: string | null
    referenceId: string | null
    saleReference: string | null
    refundedAmount: number | null
    currency: string | null
    status: string | null
    breakdown: {
      fromCreator: number
      fromPlatform: number
    } | null
    isFullRefund: boolean | null
    repairPending?: boolean | null
  }
  warning?: string | null
  warningCode?: string | null
}
