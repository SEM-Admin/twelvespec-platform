import {beforeAll,afterAll,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import research from '../../docs/catalog-curation/inputs/TwelveSpec_Decoration_Library.json';
import {actors} from '../helpers';
import {pool,transaction,create,type Actor} from '../../packages/kernel/src';
import {handleCatalog,publicProduct} from '../../packages/catalog/src';
let owner:Actor,customer:Actor;
beforeAll(async()=>({owner,customer}=await actors()));afterAll(async()=>{await pool().end();});
it('protects reference access and leaves catalog/production state unchanged',async()=>{
 const before=(await pool().query('select (select count(*) from app.products) products,(select count(*) from app.variants) variants,(select count(*) from app.process_profile_versions) profiles')).rows[0];
 const result=await transaction(owner,tx=>handleCatalog(tx,owner,'decoration_guidance',{search:'polo'})) as {total:number};expect(result.total).toBeGreaterThan(0);
 await expect(transaction(customer,tx=>handleCatalog(tx,customer,'decoration_guidance',{}))).rejects.toThrow('PERMISSION_DENIED');
 expect((await pool().query('select (select count(*) from app.products) products,(select count(*) from app.variants) variants,(select count(*) from app.process_profile_versions) profiles')).rows[0]).toEqual(before);
});
it('does not turn research IDs into active SKU methods or expose family/source guidance in public products',async()=>{
 await expect(transaction(owner,tx=>handleCatalog(tx,owner,'create',{title:'SYNTHETIC unapproved puff',methods:['EMB_PUFF']}))).rejects.toThrow('DECORATION_METHOD_INVALID');
 const product=await transaction(owner,tx=>create(tx,owner,'products',{title:'SYNTHETIC privacy reference',status:'DRAFT',data:{methods:['embroidery'],locations:['front'],internalResearch:{family:'Nylon windbreakers / rainwear',sourceUrl:'https://reference.example.test/private',methodId:'EMB_PUFF'}}}));
 const projection=publicProduct(product);expect(projection.methods).toEqual(['embroidery']);expect(JSON.stringify(projection)).not.toMatch(/internalResearch|private|EMB_PUFF|Nylon windbreakers/);
});
it('rejects the attached research JSON and matrix CSV as supplier SKU feeds without staging fake products',async()=>{
 const before=(await pool().query('select (select count(*) from app.source_records) sources,(select count(*) from app.products) products')).rows[0];
 await expect(transaction(owner,tx=>handleCatalog(tx,owner,'stage_source_file',{format:'JSON',content:JSON.stringify(research)}))).rejects.toThrow('SOURCE_FILE_ROW_LIMIT');
 const content=readFileSync(resolve(process.env.TWELVESPEC_ROOT!,'docs/catalog-curation/inputs/TwelveSpec_Product_Method_Matrix.csv'),'utf8');
 await expect(transaction(owner,tx=>handleCatalog(tx,owner,'stage_source_file',{format:'CSV',supplier:'SYNTHETIC research, not a supplier',content}))).rejects.toThrow('INVALID_TEXT');
 expect((await pool().query('select (select count(*) from app.source_records) sources,(select count(*) from app.products) products')).rows[0]).toEqual(before);
});
