# Approved development PostgreSQL trust root

`prod-ca-2021.crt` is a public CA certificate, not a password, API key or private key. It was downloaded with HTTPS verification from Supabase's public distribution endpoint:

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

Subject/issuer: Supabase Root 2021 CA, Supabase Inc. Valid April 28, 2021 through April 26, 2031. SHA-256 fingerprint:

`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`

The server loads this trust root only for the explicitly approved development project and restricted PostgreSQL login. TLS certificate and hostname verification stay enabled. Other nonlocal staging connections retain their normal trust configuration. Tests check the root's identity, strict TLS settings and rejection of unapproved project/host/login/port/URL parameters.

This prepares the client trust configuration; it does not establish runtime connectivity, successful authentication or durable hosted storage. The last workspace probe returned `ECONNREFUSED`, and the hosted persistent-database flag remains disabled. Those gates require an actual successful connection and restart/restore verification. No database filesystem read, TLS bypass or production-system access is part of this configuration.
