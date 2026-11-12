import {describe,it,expect,beforeAll,afterAll} from 'vitest';
import {randomUUID} from 'node:crypto';
import {actors} from '../helpers';
import {transaction,pool,create,get,update,hash,type Actor,type Input,type Row} from '../../packages/kernel/src';
import {handleSupplier} from '../../packages/supplier/src';
import {handleSales,costLine,publicQuote,publicOrder,safeLines} from '../../packages/sales/src';
import {recordPriceObservation,readPriceObservation,registerEvidenceSource,restrictEvidenceSource,type EvidenceSource,type PriceObservation} from '../../packages/intelligence/src';
import golden from '../fixtures/cia-price-golden.json';
let owner:Actor,customer:Actor,otherOwner:Actor;
beforeAll(async()=>({owner,customer,otherOwner}=await actors()));
afterAll(async()=>{await pool().end();});
const future=()=>new Date(Date.now()+86400000).toISOString();
async function fixture(origin:'SYNTHETIC'|'OPERATOR_DOCUMENT'='SYNTHETIC'){
 const {product,variant,otherVariant}=await transaction(owner,async tx=>{
  const product=await create(tx,owner,'products',{title:'SYNTHETIC CIA test cap',data:{minimumQuantity:1,methods:['none','embroidery'],locations:['front'],synthetic:true}});
  const variant=await create(tx,owner,'variants',{title:'SYNTHETIC navy cap',product_id:product.id,status:'ACTIVE',data:{color:'Navy',size:'One size'}});
  const otherVariant=await create(tx,owner,'variants',{title:'SYNTHETIC clay cap',product_id:product.id,status:'ACTIVE',data:{color:'Clay',size:'One size'}});
  return {product,variant,otherVariant};
 });
 const sourceInput={sourceKey:randomUUID(),title:'SYNTHETIC TEST source only',publisher:'TwelveSpec test fixtures',edition:'2026',contentHash:hash('SYNTHETIC EVIDENCE'),origin,rightsReference:'SYNTHETIC test permission; no actual supplier agreement',allowedUses:['INTERNAL_RESEARCH','QUOTE_COST'],rightsValidFrom:new Date(Date.now()-60000).toISOString(),rightsValidUntil:future(),retentionUntil:new Date(Date.now()+2*86400000).toISOString(),parserVersion:'fixture/1'};
 const source=await transaction(owner,tx=>handleSupplier(tx,owner,'register_evidence_source',sourceInput)) as EvidenceSource;
 const observationInput={sourceId:source.id,observationKey:randomUUID(),productId:product.id,variantId:variant.id,expectedProductRevision:product.revision,expectedVariantRevision:variant.revision,priceClass:'DISTRIBUTOR_NET',originalValue:'0.0250',currency:'USD',unitBasis:'EACH',unitsPerPrice:1,minimumQuantity:24,maximumQuantity:1000,orderMultiple:1,territory:'US',channel:'DIRECT',observedAt:new Date().toISOString(),effectiveFrom:new Date(Date.now()-3600000).toISOString(),effectiveUntil:future(),freshnessHours:24,evidenceState:origin==='SYNTHETIC'?'SYNTHETIC':'OPERATOR_REVIEWED',...(origin==='OPERATOR_DOCUMENT'?{reviewReference:'SYNTHETIC manually reviewed fixture'}:{})};
 const record=(change:Input={})=>transaction(owner,tx=>handleSupplier(tx,owner,'record_price_observation',{...observationInput,...change})) as Promise<PriceObservation>;
 return {product,variant,otherVariant,source,sourceInput,observationInput,record};
}
async function draft(product:Row,variant:Row,quantity=1000){
 const request=await transaction(owner,tx=>create(tx,owner,'requests',{title:'SYNTHETIC quote requirement',status:'NEW',owner_id:customer.userId,data:{lines:[{productId:product.id,variantId:variant.id,quantity,method:'none',location:'front'}]}}));
 return transaction(owner,tx=>handleSales(tx,owner,'create',{requestId:request.id,title:'SYNTHETIC evidence assessment'})) as Promise<Row>;
}
const assessmentInput=(quote:Row,observation:PriceObservation)=>({quoteId:quote.id,lineIndex:0,observationId:observation.id,currency:'USD',territory:'US',channel:'DIRECT',idempotencyKey:randomUUID()});

describe('CIA immutable source → catalog identity → precise price → Sales assessment',()=>{
 it('retains two published editions, original scale and independent immutable price facts',async()=>{
  const f=await fixture();const rows:PriceObservation[]=[];
  for(const edition of golden.editions){
   const source=await transaction(owner,tx=>registerEvidenceSource(tx,owner,{...f.sourceInput,sourceKey:randomUUID(),edition:edition.edition}));
   rows.push(await f.record({sourceId:source.id,priceClass:edition.priceClass,originalValue:edition.originalValue}));
  }
  expect(rows.map(r=>r.original_value)).toEqual(['0.0400','0.0500']);expect(rows.map(r=>r.source_scale)).toEqual([4,4]);
  const stored=await pool().query('select s.edition,p.price_class from app.price_observations p join app.intelligence_sources s on s.id=p.source_id where p.id=any($1::uuid[]) order by s.edition',[rows.map(r=>r.id)]);
  expect(stored.rows).toEqual([{edition:'2025',price_class:'PUBLISHED_LIST'},{edition:'2026',price_class:'PUBLISHED_LIST'}]);
 });
 it('deduplicates concurrent source/observation retries and rejects conflicting reused identities',async()=>{
  const f=await fixture();const [s1,s2]=await Promise.all([transaction(owner,tx=>registerEvidenceSource(tx,owner,f.sourceInput)),transaction(owner,tx=>registerEvidenceSource(tx,owner,f.sourceInput))]);expect(s1.id).toBe(s2.id);
  const [p1,p2]=await Promise.all([f.record(),f.record()]);expect(p1.id).toBe(p2.id);
  await expect(transaction(owner,tx=>registerEvidenceSource(tx,owner,{...f.sourceInput,edition:'different'}))).rejects.toThrow('EVIDENCE_SOURCE_KEY_CONFLICT');
  await expect(f.record({originalValue:'99.0000'})).rejects.toThrow('PRICE_OBSERVATION_KEY_CONFLICT');
  expect((await pool().query('select count(*)::int n from app.price_observations where source_id=$1',[f.source.id])).rows[0].n).toBe(1);
 });
 it.each([true,false])('corrects actual Sales unit extension (tier=%s) without replacing the pricing service',async tier=>{
  const f=await fixture();
  await transaction(owner,tx=>create(tx,owner,'supplier_offers',{title:'SYNTHETIC subcent regression',product_id:f.product.id,variant_id:f.variant.id,status:'ACTIVE',data:{...(tier?{priceBreaks:[{minimum:1,cost:'0.0250'}]}:{unitCost:'0.0250'}),currency:'USD',observedAt:new Date().toISOString(),freight:'0.00',verification:'MOCKED'}}));
  const result=await transaction(owner,tx=>costLine(tx,owner,{productId:f.product.id,variantId:f.variant.id,quantity:1000,method:'none',location:'front'},undefined,'.40'));
  expect(result.components.material_cost).toBe('25.00');expect(result.landedCost).toBe('25.00');
 });
 it('stores an explainable assessment while leaving the original customer quote and commitments unchanged',async()=>{
  const f=await fixture('OPERATOR_DOCUMENT'),observation=await f.record(),quote=await draft(f.product,f.variant);
  const input=assessmentInput(quote,observation);
  const assessment=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',input)) as Input;
  expect(assessment.result).toMatchObject({materialCost:'25.00',landedCost:null,customerPrice:null,productionReadiness:'BLOCKED',eligibleForQuoteCost:true,recheckRequiredBeforeCommit:true});
  // JSONB key order is not the Sales configuration protocol: normalized lines are.
  expect(assessment.request).toMatchObject({productId:f.product.id,variantId:f.variant.id,productRevision:f.product.revision,quantity:1000,configurationHash:hash(safeLines(quote.data.lines)[0])});
  expect(assessment.assessment_version).toBe('price-evidence/1');
  const unchanged=await transaction(owner,tx=>get(tx,owner,'quotes',quote.id));expect(unchanged).toEqual(quote);expect(unchanged.status).toBe('DRAFT');
  const repeated=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',input)) as Input;expect(repeated.id).toBe(assessment.id);
  await expect(transaction(owner,tx=>handleSales(tx,owner,'issue_quote',{id:quote.id,key:randomUUID()}))).rejects.toThrow('QUOTE_NOT_READY');
  const counts=await pool().query('select (select count(*) from app.orders where quote_id=$1)::int orders,(select count(*) from app.quote_revisions where quote_id=$1)::int revisions',[quote.id]);expect(counts.rows[0]).toEqual({orders:0,revisions:0});
  for(const view of [publicQuote({...quote,data:{...quote.data,priceAssessment:assessment}}),publicOrder({...quote,data:{...quote.data,priceAssessment:assessment}})])expect(JSON.stringify(view)).not.toMatch(/priceAssessment|materialCost|sourceFingerprint|observationId|landedCost/);
 });
 it('rejects account-cost evidence for a different customer, currency, channel and variant',async()=>{
  const f=await fixture('OPERATOR_DOCUMENT');
  const account=await transaction(owner,tx=>create(tx,owner,'accounts',{title:'SYNTHETIC account',data:{customerUserId:customer.userId}}));
  const observation=await f.record({priceClass:'ACCOUNT_NET',accountId:account.id});const quote=await draft(f.product,f.variant);
  const base=assessmentInput(quote,observation);
  const missing=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',base)) as {result:Input};expect(missing.result.reasons).toContain('ACCOUNT_SCOPE_MISMATCH');
  const pass=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',{...base,accountId:account.id,idempotencyKey:randomUUID()})) as {result:Input};expect(pass.result.eligibleForQuoteCost).toBe(true);
  const wrongCustomer=await transaction(owner,tx=>create(tx,owner,'accounts',{title:'SYNTHETIC different customer',data:{customerUserId:owner.userId}}));
  await expect(transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',{...base,accountId:wrongCustomer.id,idempotencyKey:randomUUID()}))).rejects.toThrow('QUOTE_ACCOUNT_MISMATCH');
  await expect(transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',{...base,currency:'CAD',idempotencyKey:randomUUID()}))).rejects.toThrow('CURRENCY_MISMATCH');
  const wrongVariantQuote=await draft(f.product,f.otherVariant);
  const wrong=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',{...assessmentInput(wrongVariantQuote,observation),accountId:account.id,channel:'MARKETPLACE'})) as {result:Input};expect(wrong.result.reasons).toEqual(expect.arrayContaining(['EXACT_VARIANT_MISMATCH','CHANNEL_MISMATCH']));
 });
 it('blocks stale product revisions and new use after rights revocation without erasing history',async()=>{
  const f=await fixture('OPERATOR_DOCUMENT'),observation=await f.record(),quote=await draft(f.product,f.variant);
  await transaction(owner,tx=>update(tx,owner,'variants',f.variant.id,{data:{...f.variant.data,material:'SYNTHETIC changed substrate'}}));
  const revised=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',assessmentInput(quote,observation))) as {result:Input};expect(revised.result.reasons).toContain('PRODUCT_REVISION_CHANGED');
  const input={sourceId:f.source.id,reason:'SYNTHETIC rights revoked'};const restriction=await transaction(owner,tx=>handleSupplier(tx,owner,'restrict_evidence_source',input)) as Input;
  const replay=await transaction(owner,tx=>restrictEvidenceSource(tx,owner,input));expect(replay.id).toBe(restriction.id);
  const restricted=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',assessmentInput(quote,observation))) as {result:Input};expect(restricted.result.reasons).toContain('SOURCE_RIGHTS_RESTRICTED');expect(restricted.result.materialCost).toBeNull();
  expect((await transaction(owner,tx=>readPriceObservation(tx,owner,observation.id))).original_value).toBe('0.0250');
  await expect(f.record({observationKey:randomUUID()})).rejects.toThrow('EVIDENCE_SOURCE_RESTRICTED');
 });
 it('never upgrades synthetic source facts into commercial cost eligibility',async()=>{
  const f=await fixture(),observation=await f.record(),quote=await draft(f.product,f.variant,48);
  const assessment=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',assessmentInput(quote,observation))) as {result:Input};
  expect(assessment.result).toMatchObject({eligibleForQuoteCost:false,materialCost:null,productionReadiness:'BLOCKED'});expect(assessment.result.reasons).toContain('SYNTHETIC_EVIDENCE');
 });
 it('requires an explicit integer line and a draft; no assessment can rewrite a costed commitment',async()=>{
  const f=await fixture(),observation=await f.record(),quote=await draft(f.product,f.variant);
  for(const lineIndex of [null,undefined,false,0.5,-1])await expect(transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',{...assessmentInput(quote,observation),lineIndex}))).rejects.toThrow('INVALID_LINE_INDEX');
  await transaction(owner,tx=>update(tx,owner,'quotes',quote.id,{status:'COSTED'}));
  await expect(transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',assessmentInput(quote,observation)))).rejects.toThrow('PRICE_ASSESSMENT_REQUIRES_DRAFT');
  expect((await pool().query('select count(*)::int n from app.price_assessments where quote_id=$1',[quote.id])).rows[0].n).toBe(0);
 });
 it('enforces role and workspace isolation at commands, direct SQL and foreign keys',async()=>{
  const f=await fixture(),observation=await f.record(),quote=await draft(f.product,f.variant);
  await expect(transaction(customer,tx=>handleSupplier(tx,customer,'register_evidence_source',f.sourceInput))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(customer,tx=>handleSales(tx,customer,'assess_quote_price',assessmentInput(quote,observation)))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(otherOwner,tx=>readPriceObservation(tx,otherOwner,observation.id))).rejects.toThrow('PRICE_OBSERVATION_NOT_FOUND');
  await transaction(customer,async tx=>{for(const table of ['intelligence_sources','intelligence_restrictions','price_observations','price_assessments'])expect((await tx.query(`select * from app.${table}`)).rows).toEqual([]);});
  await expect(transaction(otherOwner,tx=>tx.query('insert into app.intelligence_restrictions(tenant_id,workspace_id,created_by,source_id,reason)values($1,$2,$3,$4,$5)',[otherOwner.tenantId,otherOwner.workspaceId,otherOwner.userId,f.source.id,'SYNTHETIC illegal cross-tenant link']))).rejects.toThrow();
  const differentProduct=await transaction(owner,tx=>create(tx,owner,'products',{title:'SYNTHETIC other product'}));
  await expect(transaction(owner,tx=>recordPriceObservation(tx,owner,{...f.observationInput,productId:differentProduct.id}))).rejects.toThrow('EVIDENCE_VARIANT_PRODUCT_MISMATCH');
  await expect(pool().query('insert into app.price_observations select (jsonb_populate_record(null::app.price_observations,$1::jsonb)).*',[JSON.stringify({...observation,id:randomUUID(),observation_key:randomUUID(),product_id:differentProduct.id})])).rejects.toThrow();
 });
 it('denies changes even at the migration-identity SQL boundary; ordinary runtime cannot update history',async()=>{
  const f=await fixture('OPERATOR_DOCUMENT'),observation=await f.record(),quote=await draft(f.product,f.variant);
  const assessment=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',assessmentInput(quote,observation))) as Input;
  const restriction=await transaction(owner,tx=>restrictEvidenceSource(tx,owner,{sourceId:f.source.id,reason:'SYNTHETIC restriction'}));
  const rows=[['intelligence_sources',f.source.id],['price_observations',observation.id],['price_assessments',assessment.id],['intelligence_restrictions',restriction.id]];
  for(const [table,id] of rows){
   await expect(pool().query(`delete from app.${table} where id=$1`,[id])).rejects.toThrow('IMMUTABLE_RECORD');
   await expect(pool().query(`update app.${table} set created_by=created_by where id=$1`,[id])).rejects.toThrow('IMMUTABLE_RECORD');
   await expect(transaction(owner,tx=>tx.query(`update app.${table} set created_by=created_by where id=$1`,[id]))).rejects.toThrow();
  }
 });
 it('requires real review metadata and excludes authentication-bearing URLs from manifests',async()=>{
  const f=await fixture('OPERATOR_DOCUMENT');
  await expect(f.record({reviewReference:undefined})).rejects.toThrow('EVIDENCE_REVIEW_REQUIRED');
  for(const sourceUri of ['https://user:password@example.test/file','https://example.test/file?token=secret','http://example.test/file'])await expect(transaction(owner,tx=>registerEvidenceSource(tx,owner,{...f.sourceInput,sourceKey:randomUUID(),sourceUri}))).rejects.toThrow('EVIDENCE_URI_INVALID');
  await expect(f.record({originalValue:'0.000000001'})).rejects.toThrow('PRICE_OBSERVATION_INVALID');
  await expect(f.record({priceClass:'ACCOUNT_NET'})).rejects.toThrow('EVIDENCE_ACCOUNT_REQUIRED');
 });
});
