import {createHmac} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {verifyWebhookSignature} from '../../packages/finance/src/index';
describe('payment webhook integrity',()=>{it('requires signature, bounded age, and exact payload',()=>{const now=Date.now(),ts=String(Math.floor(now/1000)),body='{"id":"test"}',secret='synthetic-test-only';const sig=createHmac('sha256',secret).update(ts+'.'+body).digest('hex');expect(verifyWebhookSignature(body,sig,ts,secret,now)).toBe(true);expect(verifyWebhookSignature(body+'x',sig,ts,secret,now)).toBe(false);expect(verifyWebhookSignature(body,sig,ts,secret,now+301000)).toBe(false);expect(verifyWebhookSignature(body,'bad',ts,secret,now)).toBe(false);});});
