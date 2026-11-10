/** TwelveSpec native integration SDK — compile-target contract, NOT a live implementation. */
export type Environment = 'mock' | 'sandbox' | 'production';
export type Capability =
  | 'catalog' | 'variants' | 'media' | 'inventory' | 'pricing_configuration'
  | 'quote' | 'artwork_validation' | 'purchase_order' | 'order_status'
  | 'shipment' | 'invoice' | 'tracking' | 'webhooks';
export type CapabilityState = 'available' | 'unsupported' | 'credential_required' |
  'license_required' | 'failed' | 'unverified';
export interface CapabilityEvidence {
  capability: Capability;
  state: CapabilityState;
  version?: string;
  lastTestedAt?: string;
  message?: string;
  evidenceSource: 'mock' | 'official_docs' | 'vendor_sandbox' | 'live_test';
}
export interface ProviderManifest {
  id: string; label: string;
  protocol: 'promostandards_soap' | 'asi_smartlink' | 'rest' | 'csv' | 'xml' | 'fulfillment' | 'shipping';
  allowedEnvironments: Environment[];
  credentialSchemaId?: string;
  services: CapabilityEvidence[];
}
export interface ProviderContext {
  tenantId: string;
  workspaceId: string;
  providerConnectionId: string;
  environment: Environment;
  correlationId: string;
  credentialRef?: string; // NEVER credential secret text
}
export interface ImportBatch {
  batchId: string;
  sourceConnectionId: string;
  sourceHash: string;
  observedAt: string;
  status: 'staged' | 'needs_review' | 'approved' | 'published' | 'rejected';
}
export interface IntegrationError {
  code: 'UNSUPPORTED' | 'AUTH_REQUIRED' | 'LICENSE_REQUIRED' | 'INVALID_INPUT' |
        'STALE_DATA' | 'RATE_LIMIT' | 'UPSTREAM_UNAVAILABLE' | 'UNKNOWN_OUTCOME';
  safeMessage: string;
  correlationId: string;
  retryable: boolean;
}
export interface SupplierAdapter {
  readonly manifest: ProviderManifest;
  testConnection(ctx: ProviderContext): Promise<CapabilityEvidence[]>;
  discoverCapabilities(ctx: ProviderContext): Promise<CapabilityEvidence[]>;
  fetchCatalog(ctx: ProviderContext, cursor?: string): Promise<{ records: unknown[]; cursor?: string }>;
  fetchPricing(ctx: ProviderContext, sourceProductId: string, qty: number): Promise<unknown>;
  fetchInventory(ctx: ProviderContext, sourceVariantIds: string[]): Promise<unknown>;
  submitPurchaseOrder(ctx: ProviderContext, command: {
    idempotencyKey: string; approvedOrderId: string; immutableSnapshotHash: string;
  }): Promise<{ externalOrderId?: string; state: 'acknowledged' | 'submitted' | 'unknown' }>;
}
// Unsupported methods must throw a typed IntegrationError, not return a fake success.
// Implement adapters only for provider APIs with verified legal access and tested wire contracts.
