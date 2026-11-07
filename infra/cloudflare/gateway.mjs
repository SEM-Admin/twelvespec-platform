/** Edge entry used by BOTH temporary preview Workers. Backend has no public route. */
export function checkedOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.workers.dev') || url.port || url.pathname !== '/' || url.search || url.hash) throw new Error('INVALID_PREVIEW_ORIGIN');
  return url.origin;
}
const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
export async function verifyAccessJwt(token, { teamDomain, audience, now = Date.now() }, loadKeys) {
  try {
    if (!token || token.length > 16000 || !audience) return false;
    const issuer = new URL(teamDomain);
    if (issuer.protocol !== 'https:' || !issuer.hostname.endsWith('.cloudflareaccess.com') || issuer.port || issuer.pathname !== '/' || issuer.search || issuer.hash) return false;
    const parts = token.split('.'); if (parts.length !== 3) return false;
    const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.iss !== issuer.origin || typeof claims.exp !== 'number' || claims.exp * 1000 <= now || (claims.nbf && claims.nbf * 1000 > now + 30000)) return false;
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(audience)) return false;
    const keys = loadKeys ? await loadKeys() : await (await fetch(issuer.origin + '/cdn-cgi/access/certs', { cf: { cacheTtl: 300, cacheEverything: true } })).json();
    const jwk = keys.keys?.find(key => key.kid === header.kid && key.kty === 'RSA' && (!key.use || key.use === 'sig'));
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  } catch { return false; }
}
export async function gatewayFetch(request, env) {
  const requestId = crypto.randomUUID();
  try {
    const origin = checkedOrigin(env.PREVIEW_ORIGIN), url = new URL(request.url);
    if (url.origin !== origin || !['shop', 'os'].includes(env.APPLICATION)) return new Response('Unknown preview host', { status: 421 });
    if (url.pathname.startsWith('/__preview/')) return new Response('Not found', { status: 404 });
    if (env.REQUIRE_ACCESS !== 'true') return new Response('Preview protection is not configured', { status: 503 });
    if (!await verifyAccessJwt(request.headers.get('cf-access-jwt-assertion'), { teamDomain: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD })) return new Response('Sign in through Cloudflare Access to open this preview.', { status: 403 });
    const forwarded = new Request(request);
    forwarded.headers.delete('x-twelvespec-application');
    forwarded.headers.delete('x-forwarded-host');
    forwarded.headers.delete('x-forwarded-proto');
    forwarded.headers.set('x-twelvespec-application', env.APPLICATION);
    forwarded.headers.set('x-forwarded-host', url.host);
    forwarded.headers.set('x-forwarded-proto', 'https');
    const upstream = await env.RUNTIME.fetch(forwarded);
    const result = new Response(upstream.body, upstream);
    result.headers.set('X-TwelveSpec-Preview', 'synthetic');
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('Referrer-Policy', 'same-origin');
    result.headers.set('X-Request-ID', requestId);
    if (url.pathname.startsWith('/api/')) result.headers.set('Cache-Control', 'private, no-store');
    return result;
  } catch {
    console.error(JSON.stringify({ event: 'preview_request_failed', requestId }));
    return new Response('The temporary preview is starting or needs attention.', { status: 503, headers: { 'Retry-After': '10', 'X-Request-ID': requestId } });
  }
}
export default { fetch: gatewayFetch };
