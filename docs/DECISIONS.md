# Engineering decisions

- Architecture and scope follow the master handoff. Two Next.js deployments (`apps/shop`, `apps/os`) share server-only domain packages and one PostgreSQL database; a separate worker handles outbox work.
- Embedded native PostgreSQL provides a clean local database with no Docker/account dependency; production uses an independently provisioned Postgres DSN. No existing TwelveSpec system is accessed.
- Better Auth owns password/session handling. Explicit server-resolved memberships determine the actor; clients cannot select arbitrary workspace/role.
- PostgreSQL RLS is enforced using a non-superuser runtime role inside scoped transactions. Every business table has composite scoped keys. Public catalog output is an allowlist.
- Local secrets use authenticated AES-GCM with an independent local key. This is a development vault, not KMS. Production activation requires an external managed secret provider and rotation evidence.
- Actual ASI wire protocols remain blocked until authorized schemas/entitlement exist. SOAP is implemented against versioned fixture WSDLs; genuine supplier sandbox access is a separate evidence gate.
- The selected GitHub repository is public, although the handoff proposes a private repository. No secrets, customer data, or production resources enter source control. Repository privacy must be resolved before confidential deployment configuration is added.
- Original reference packages are preserved verbatim under specification/master-v1. New reviewed migrations replace illustrative scaffolds; no legacy migrations are replayed.
