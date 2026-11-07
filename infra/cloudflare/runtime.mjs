import { DurableObject } from 'cloudflare:workers';
import { checkedOrigin } from './gateway.mjs';
const IDLE_MS = 30 * 60 * 1000;
/** One isolated instance shares the original PostgreSQL database between both apps. */
export class TwelveSpecPreview extends DurableObject {
  starting;
  constructor(ctx,env) {
    super(ctx,env);
    if(ctx.container?.running)ctx.blockConcurrencyWhile(()=>ctx.container.setInactivityTimeout(IDLE_MS));
  }
  async fetch(request) {
    const application = request.headers.get('x-twelvespec-application');
    const port = application === 'shop' ? 3000 : application === 'os' ? 3001 : null;
    if (!port) return new Response('Invalid application', { status: 403 });
    const origin = checkedOrigin(application === 'shop' ? this.env.SHOP_ORIGIN : this.env.OS_ORIGIN);
    if (new URL(request.url).origin !== origin) return new Response('Invalid application origin', { status: 403 });
    this.starting ??= this.startAndWait().finally(() => { this.starting = undefined; });
    await this.starting;
    await this.ctx.container.setInactivityTimeout(IDLE_MS);
    const url = new URL(request.url); url.protocol = 'http:'; url.host = 'container';
    const forwarded = new Request(url, request);
    forwarded.headers.delete('host');
    return this.ctx.container.getTcpPort(port).fetch(forwarded);
  }
  async startAndWait() {
    const container = this.ctx.container;
    const databaseUrl=this.env.PREVIEW_DATABASE_ENABLED==='true'?this.env.DATABASE_URL:undefined;
    if (!container) throw new Error('CONTAINER_BINDING_REQUIRED');
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({image:container.images.base,database:databaseUrl??'',auth:this.env.BETTER_AUTH_SECRET})));
    const revision=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    if(container.running&&await this.ctx.storage.get('preview_revision')!==revision)await container.destroy('Preview configuration changed');
    if (!container.running) container.start({ image: container.images.base, instance: 'standard-1', enableInternet: !!databaseUrl, env: {
      TWELVESPEC_PREVIEW: '1', TWELVESPEC_ROOT: '/app', TWELVESPEC_ENV: 'local',
      SHOP_ORIGIN: checkedOrigin(this.env.SHOP_ORIGIN), OS_ORIGIN: checkedOrigin(this.env.OS_ORIGIN),
      BETTER_AUTH_SECRET: this.env.BETTER_AUTH_SECRET, ASSET_SIGNING_KEY: this.env.ASSET_SIGNING_KEY,
      WEBHOOK_SIGNING_KEY: this.env.WEBHOOK_SIGNING_KEY, TWELVESPEC_DEMO_PASSWORD: this.env.TWELVESPEC_DEMO_PASSWORD,
      ...(databaseUrl ? {DATABASE_URL:databaseUrl,SUPABASE_PROJECT_REF:'mtihnarlkprmyahbxlrl'} : {}),
      NEXT_TELEMETRY_DISABLED: '1',
    } });
    await this.ctx.storage.put('preview_revision',revision);
    await container.setInactivityTimeout(IDLE_MS);
    const started = Date.now();
    while (Date.now() - started < 120000) {
      const health = await Promise.all([3000, 3001].map(async port => {
        try { const r = await container.getTcpPort(port).fetch('http://container/api/health', { signal: AbortSignal.timeout(1500) }); await r.body?.cancel(); return r.ok; } catch { return false; }
      }));
      if (health.every(Boolean)) return;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('PREVIEW_STARTUP_TIMEOUT');
  }
}
export default { fetch(request, env) { return env.PREVIEW.getByName('twelvespec-synthetic-v3').fetch(request); } };
