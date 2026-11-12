'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {asString,command,key,pretty,type Data} from './types';
import {EvidencePaging,type EvidencePage} from './evidence-library';
type Context={products:Data[];variants:Data[];totalPages:number;variantTotalPages:number;accounts:Data[];configuration:Data|null;sources:EvidencePage};
const blankPage:EvidencePage={rows:[],page:1,total:0,totalPages:1};
const blank:Context={products:[],variants:[],accounts:[],totalPages:1,variantTotalPages:1,configuration:null,sources:blankPage};
async function query<T>(action:string,input:Data){return (await command('orders',action,input)).result as T;}
export function ProcessProfiles({run}:{run:(action:string,input:Data)=>Promise<unknown>}){
 const [history,setHistory]=useState(blankPage),[historyPage,setHistoryPage]=useState(1),[historySearch,setHistorySearch]=useState(''),[generation,setGeneration]=useState(0);
 const [context,setContext]=useState(blank),[search,setSearch]=useState(''),[page,setPage]=useState(1),[product,setProduct]=useState<Data|null>(null),[variantId,setVariant]=useState(''),[variantPage,setVariantPage]=useState(1),[variantSearch,setVariantSearch]=useState(''),[sourcePage,setSourcePage]=useState(1),[sourceSearch,setSourceSearch]=useState(''),[source,setSource]=useState<Data|null>(null);
 const [method,setMethod]=useState(''),[location,setLocation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[profileKey,setProfileKey]=useState(key);
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{void query<Context>('process_profile_context',{search,page,...(product?{productId:product.id}:{}),variantPage,variantSearch,sourcePage,sourceSearch}).then(value=>{if(active)setContext(value);}).catch(e=>{if(active)setError(e.message);});},150);return()=>{active=false;clearTimeout(timer);};},[search,page,product,variantPage,variantSearch,sourcePage,sourceSearch,generation]);
 useEffect(()=>{let active=true;void query<EvidencePage>('process_profile_library',{search:historySearch,page:historyPage}).then(value=>{if(active)setHistory(value);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[historySearch,historyPage,generation]);
 const products=product&&!context.products.some(p=>p.id===product.id)?[product,...context.products]:context.products;
 const sources=source&&!context.sources.rows.some(s=>s.id===source.id)?[source,...context.sources.rows]:context.sources.rows;
 const methods=(context.configuration?.methods??[]) as string[],locations=(context.configuration?.locations??[]) as string[];
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget,values=new FormData(form);setBusy(true);setError('');try{
   const variant=context.variants.find(v=>v.id===variantId);if(!product||!variant||!source)throw new Error('Choose the exact product, variant and source.');
   const optional=(name:string)=>asString(values.get(name)).trim()||null;
   await run('record_process_profile',{profileKey,title:values.get('title'),sourceId:source.id,productId:product.id,variantId,expectedProductRevision:context.configuration?.revision,expectedVariantRevision:variant.revision,method,location,producerReference:optional('producer'),facilityReference:optional('facility'),substrateReference:optional('substrate'),zoneWidthMm:values.get('width')?Number(values.get('width')):null,zoneHeightMm:values.get('height')?Number(values.get('height')):null,outputContractReference:optional('contract'),documentationReviewed:values.get('reviewed')==='on',reviewReference:optional('review')});
   setProfileKey(key());setNotice('Planning profile recorded. It does not authorize manufacturing or validate a production file.');setGeneration(g=>g+1);
  }catch(e){setError(e instanceof Error?e.message:'Profile could not be recorded.');}finally{setBusy(false);}
 }
 return <section className="quote-workbench" aria-label="Producer planning profiles">
  <h2>Plan for the exact producer.</h2><p>Record documented method, substrate, facility and imprint zone. Unknown values stay unknown. Manufacturer acceptance and production checks remain separate.</p>
  {error&&<p className="alert error" role="alert">{error}</p>}{notice&&<p className="workbench-note" role="status">{notice}</p>}
  <details><summary>Record a producer planning profile</summary><form onSubmit={save} className="cost-worksheet"><fieldset disabled={busy}><legend>Versioned planning evidence</legend>
   <label>Planning profile name<input name="title" required maxLength={200}/></label>
   <label>Find profile product<input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label>
   <label>Profile product<select required value={asString(product?.id)} onChange={e=>{setProduct(products.find(p=>p.id===e.target.value)??null);setVariant('');setVariantPage(1);setMethod('');setLocation('');}}><option value="">Choose a product</option>{products.map(p=><option value={asString(p.id)} key={asString(p.id)}>{asString(p.title)}</option>)}</select></label><EvidencePaging page={page} totalPages={context.totalPages} onPage={setPage}/>
   <label>Find profile variant<input type="search" value={variantSearch} onChange={e=>{setVariantSearch(e.target.value);setVariant('');setVariantPage(1);}}/></label><label>Profile variant<select required value={variantId} onChange={e=>setVariant(e.target.value)}><option value="">Choose an exact variant</option>{context.variants.map(v=><option key={asString(v.id)} value={asString(v.id)}>{asString(v.color)} · {asString(v.size)} · {asString(v.title)}</option>)}</select></label><EvidencePaging page={variantPage} totalPages={context.variantTotalPages} onPage={n=>{setVariantPage(n);setVariant('');}}/>
   <label>Profile method<select required value={method} onChange={e=>setMethod(e.target.value)}><option value="">Choose a supported method</option>{methods.map(m=><option value={m} key={m}>{pretty(m)}</option>)}</select></label><label>Profile imprint location<select required value={location} onChange={e=>setLocation(e.target.value)}><option value="">Choose a supported location</option>{locations.map(l=><option value={l} key={l}>{pretty(l)}</option>)}</select></label>
   <label>Find profile source<input type="search" value={sourceSearch} onChange={e=>{setSourceSearch(e.target.value);setSourcePage(1);}}/></label><label>Profile source<select required value={asString(source?.id)} onChange={e=>setSource(sources.find(s=>s.id===e.target.value)??null)}><option value="">Choose permitted evidence</option>{sources.map(s=><option key={asString(s.id)} value={asString(s.id)}>{asString(s.title)} · {asString(s.edition)}{s.restricted_at?' · Restricted':''}</option>)}</select></label><EvidencePaging page={sourcePage} totalPages={context.sources.totalPages} onPage={setSourcePage}/><p><Link href="/supplier">Register source permissions in Integration Center.</Link></p>
   <label>Producer reference<input name="producer" maxLength={500}/></label><label>Facility reference<input name="facility" maxLength={500}/></label><label>Substrate reference<input name="substrate" maxLength={500}/></label>
   <label>Producer zone width (mm; blank means unknown)<input name="width" type="number" min="0.001" max={100000} step="any"/></label><label>Producer zone height (mm; blank means unknown)<input name="height" type="number" min="0.001" max={100000} step="any"/></label>
   <label>Method output contract reference<textarea name="contract" maxLength={1000}/></label><label className="workbench-check"><input name="reviewed" type="checkbox"/>I reviewed this profile against its source document.</label><label>Profile review reference<textarea name="review" maxLength={1000}/></label>
  </fieldset><button className="button primary" disabled={busy}>Save planning profile</button></form></details>
  <label>Search planning history<input type="search" value={historySearch} onChange={e=>{setHistorySearch(e.target.value);setHistoryPage(1);}}/></label>
  <div className="table-scroll"><table><thead><tr><th>Profile</th><th>Exact product</th><th>Planning state</th></tr></thead><tbody>{history.rows.map(r=><tr key={asString(r.id)}><td>{asString(r.title)}<small>Version {asString(r.version_number)} · {asString((r.data as Data).method)} · {asString((r.data as Data).location)}</small></td><td>{asString(r.product_title)}<small>{asString(r.variant_title)}</small></td><td>{pretty(asString(r.verification).toLowerCase())}<small>Production release blocked</small></td></tr>)}</tbody></table></div><EvidencePaging page={historyPage} totalPages={history.totalPages} onPage={setHistoryPage}/>
 </section>;
}
