import {describe,it,expect} from 'vitest';
import {escapeCsv,freshnessState} from '../../packages/analytics/src/index';
describe('Reporting export and freshness',()=>{
 it('escapes CSV formula prefixes and embedded delimiters',()=>{for(const value of ['=SUM(A1)','+cmd','-cmd','@x',' \t=evil'])expect(escapeCsv(value)).toMatch(/^"'/);expect(escapeCsv('a,"b"')).toBe('"a,""b"""');});
 it('marks unknown or stale upstream evidence truthfully',()=>{const now=new Date('2026-11-05T12:00:00Z');expect(freshnessState(undefined,60,now)).toBe('UNKNOWN');expect(freshnessState('bad',60,now)).toBe('UNKNOWN');expect(freshnessState('2026-11-05T10:59:00Z',60,now)).toBe('STALE');expect(freshnessState('2026-11-05T11:30:00Z',60,now)).toBe('FRESH');});
});
