export const SHOPIFY_API_VERSION='2026-10';
export const SHOPIFY_SCOPES=['read_products'] as const;
export const SHOPIFY_ACTIVATION_REQUIREMENTS=[
 'Registered Shopify app and an explicitly authorized development store',
 'Merchant installation, verified granted scopes and expiring offline OAuth tokens',
 'Durable tenant-scoped token storage, refresh, revocation and uninstall handling',
 'Reachable authenticated callback and signed mandatory privacy webhooks',
 'Development-store contract tests and approval before any production-store connection',
 'Public distribution and Shopify review before installations by unrelated merchants',
] as const;
