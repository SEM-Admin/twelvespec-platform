import {describe,it,expect} from 'vitest';
import {projectedOrderStatus} from '../../packages/fulfillment/src/index';
describe('fulfillment allocation projections',()=>{it('exposes partial shipment and rejects overshipment',()=>{expect(projectedOrderStatus(24,12)).toBe('PARTIALLY_FULFILLED');expect(projectedOrderStatus(24,24)).toBe('FULFILLED');expect(()=>projectedOrderStatus(24,25)).toThrow('INVALID_FULFILLMENT_QUANTITY');});});
