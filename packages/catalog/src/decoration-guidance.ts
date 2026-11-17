import {z} from 'zod';
import input from '../../../docs/catalog-curation/inputs/TwelveSpec_Decoration_Library.json';
import {fail,type Input} from '../../kernel/src';

const referenceUrl=z.url().refine(value=>{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash;},'An HTTPS research reference is required.');
const methodSchema=z.object({id:z.string().regex(/^[A-Z][A-Z0-9_]{1,50}$/),name:z.string().min(1).max(200),group:z.string().min(1).max(100),best_for:z.string().min(1).max(1000),limitation:z.string().min(1).max(1000),web_description:z.string().min(1).max(1000)}).strict();
const sourceSchema=z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(300),url:referenceUrl}).strict();
const familySchema=z.object({category:z.string().min(1).max(200),product:z.string().min(1).max(200),material:z.string().min(1).max(500),recommended:z.string().max(500),alternate:z.string().max(500),premium:z.string().max(500),locations:z.string().max(500),fit:z.string().max(1000),watch_out:z.string().max(1000),production_route:z.string().max(1000),source_ids:z.string().max(1000),source_urls:z.string().max(3000),sku_verified:z.literal('No - category-level guidance'),web_status:z.literal('Conditional; confirm actual SKU')}).strict();
const library=z.object({title:z.string().min(1).max(200),research_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),scope:z.string().min(1).max(500),source_directory:z.array(sourceSchema).min(1),methods:z.array(methodSchema).min(1),products:z.array(familySchema).min(1)}).strict().parse(input);
const methodById=new Map(library.methods.map(m=>[m.id,m])),sourceById=new Map(library.source_directory.map(s=>[s.id,s]));
const codes=(value:string)=>value?value.split('|'):[];
if(methodById.size!==library.methods.length||sourceById.size!==library.source_directory.length||new Set(library.products.map(p=>p.category+'/'+p.product)).size!==library.products.length)throw new Error('DUPLICATE_DECORATION_RESEARCH_IDENTITY');
for(const family of library.products){
 if([...codes(family.recommended),...codes(family.alternate),...codes(family.premium)].some(id=>!methodById.has(id))||codes(family.source_ids).some(id=>!sourceById.has(id)))throw new Error('UNRESOLVED_DECORATION_RESEARCH_REFERENCE');
 for(const url of family.source_urls.split(' | '))referenceUrl.parse(url);
}
const families=library.products.map((family,index)=>({
 referenceId:'decoration-family-'+(index+1),category:family.category,name:family.product,material:family.material,
 suggested:codes(family.recommended),alternatives:codes(family.alternate),premium:codes(family.premium),
 commonLocations:family.locations,fit:family.fit,watchOut:family.watch_out,suggestedRoute:family.production_route,
 sources:codes(family.source_ids).map(id=>sourceById.get(id)!),verification:'CATEGORY_GUIDANCE_ONLY' as const,
 skuVerified:false,availableForSelection:false,
}));
const categories=[...new Set(families.map(p=>p.category))];
const querySchema=z.object({search:z.string().trim().max(200).default(''),category:z.string().max(200).default(''),methodId:z.string().max(51).default(''),page:z.number().int().min(1).max(100000).default(1),pageSize:z.number().int().min(1).max(20).default(10)}).strict();

/** Pure reference reader. Controllers must authorize; this never writes a SKU or enables a method. */
export function readDecorationGuidance(value:Input){
 const parsed=querySchema.safeParse(value);if(!parsed.success)fail('DECORATION_GUIDANCE_QUERY_INVALID',400);
 const q=parsed.data;if(q.category&&!categories.includes(q.category))fail('DECORATION_GUIDANCE_CATEGORY_UNKNOWN',400);if(q.methodId&&!methodById.has(q.methodId))fail('DECORATION_GUIDANCE_METHOD_UNKNOWN',400);
 const tokens=q.search.toLowerCase().split(/\s+/).filter(Boolean);
 const matches=families.filter(family=>{
  if(q.category&&family.category!==q.category)return false;
  const methods=[...family.suggested,...family.alternatives,...family.premium];if(q.methodId&&!methods.includes(q.methodId))return false;
  const search=[family.name,family.category,family.material,family.fit,family.watchOut,...methods.map(id=>methodById.get(id)!.name)].join(' ').toLowerCase();
  return tokens.every(token=>search.includes(token));
 });
 return {version:'owner-decoration-research/2026-11-17',title:library.title,researchDate:library.research_date,scope:library.scope,status:'PRIVATE_REFERENCE_ONLY' as const,
  familyCount:families.length,methodCount:library.methods.length,sourceCount:library.source_directory.length,categories,
  methods:library.methods.map(m=>({id:m.id,name:m.name,group:m.group,bestFor:m.best_for,limitation:m.limitation,description:m.web_description,availableForSelection:false})),
  families:matches.slice((q.page-1)*q.pageSize,q.page*q.pageSize),total:matches.length,page:q.page,pageSize:q.pageSize,totalPages:Math.max(1,Math.ceil(matches.length/q.pageSize)),
  automaticCatalogWrites:0,automaticPublications:0,
 };
}
