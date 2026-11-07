# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
ENV NEXT_TELEMETRY_DISABLED=1 TWELVESPEC_ROOT=/app
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node . .
# Optional local managed-environment CA is never copied into image layers.
RUN --mount=type=secret,id=proxy_ca,uid=1000,gid=1000,mode=0400 \
    if [ -f /run/secrets/proxy_ca ]; then NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci --strict-ssl=true; else npm ci --strict-ssl=true; fi \
    && npm run build \
    && rm -rf /home/node/.npm .local apps/os/.next/cache apps/shop/.next/cache
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 TWELVESPEC_ROOT=/app TWELVESPEC_PREVIEW=1
EXPOSE 3000 3001
CMD ["node", "--import", "tsx", "scripts/preview-runtime.ts"]
