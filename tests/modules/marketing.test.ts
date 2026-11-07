import {describe,it,expect} from 'vitest';
import {marketingAllowed,safeContent,handleMarketing} from '../../packages/marketing/src/index';
import type {Actor,Tx} from '../../packages/kernel/src/index';
describe('Marketing consent and preview gates',()=>{
 it('requires an affirmative recorded marketing consent',()=>{expect(marketingAllowed({consent:{marketing:true}})).toBe(true);for(const c of [{},{consent:{marketing:false}},{consent:true},{marketing:true}])expect(marketingAllowed(c)).toBe(false);});
 it('rejects executable content while preserving plain editorial copy',()=>{expect(safeContent('Our autumn launch')).toBe('Our autumn launch');for(const v of ['<script>alert(1)</script>','<img onerror=alert(1)>','javascript:evil()','<iframe src="x"></iframe>'])expect(()=>safeContent(v)).toThrow('UNSAFE_CONTENT');});
 it('blocks customer campaign access and all external sends',async()=>{await expect(handleMarketing({} as Tx,{role:'customer'} as Actor,'create_campaign',{})).rejects.toThrow('PERMISSION_DENIED');await expect(handleMarketing({} as Tx,{role:'owner'} as Actor,'send_campaign',{})).rejects.toThrow('EXTERNAL_COMMUNICATION_BLOCKED');});
});
