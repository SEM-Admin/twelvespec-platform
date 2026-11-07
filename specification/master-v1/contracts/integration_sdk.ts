export type Capability = 'product_data'|'media'|'inventory'|'pricing_configuration'|'quote'|'purchase_order'|'order_status'|'shipment'|'invoice';
export type Verification = 'NOT_CONFIGURED'|'MOCKED'|'SANDBOX_VERIFIED'|'LIVE_VERIFIED'|'BLOCKED';
export interface ConnectionContext { tenantId: string; workspaceId: string; connectionId: string; environment: 'mock'|'sandbox'|'live'; correlationId: string; }
export interface CapabilityState { capability: Capability; available: boolean; verification: Verification; version?: string; checkedAt?: string; reason?: string; }
export interface ProviderError { code: 'AUTH'|'RATE_LIMIT'|'UNSUPPORTED'|'INVALID_DATA'|'TIMEOUT'|'UNKNOWN_OUTCOME'|'PROVIDER_DOWN'; retryAfterSec?: number; providerRequestId?: string; redactedMessage: string; }
export interface ImportProduct { sourceId: string; sourceVariantId: string; name: string; brand?: string; color?: string; size?: string; currency: string; wholesaleUnitCost?: string; sourceTimestamp: string; rawHash: string; }
export interface PriceEvidence { currency: string; quantity: number; items: Array<{code:string; amount:string; source:string; verifiedAt:string}>; validUntil?:string; }
export interface ProviderAdapter {
  readonly type: string;
  supportedCapabilities(): Promise<CapabilityState[]>;
  verifyReadOnly(ctx: ConnectionContext, secretReference: string): Promise<CapabilityState[]>;
  readCatalog?(ctx: ConnectionContext, cursor?: string): AsyncIterable<ImportProduct>;
  quote?(ctx:ConnectionContext, sku:string, config:unknown, quantity:number): Promise<PriceEvidence>;
  submitPurchaseOrder?(ctx:ConnectionContext, payload:unknown, idempotencyKey:string): Promise<{externalId?:string; outcome:'ACKNOWLEDGED'|'REJECTED'|'UNKNOWN_OUTCOME'}>;
  reconcilePurchaseOrder?(ctx:ConnectionContext, idempotencyKey:string): Promise<{externalId?:string; outcome:'ACKNOWLEDGED'|'REJECTED'|'UNKNOWN_OUTCOME'}>;
}
// Secrets are resolved only by privileged server-side runtime. NEVER include raw credentials in ConnectionContext or client bundles.
