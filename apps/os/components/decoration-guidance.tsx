'use client';
import {useEffect,useState} from 'react';
import {request} from './types';

type Method={id:string;name:string;group:string;bestFor:string;limitation:string;description:string;availableForSelection:false};
type Family={referenceId:string;category:string;name:string;material:string;suggested:string[];alternatives:string[];premium:string[];commonLocations:string;fit:string;watchOut:string;suggestedRoute:string;sources:{id:string;title:string;url:string}[];skuVerified:false;availableForSelection:false};
type Guidance={researchDate:string;familyCount:number;methodCount:number;sourceCount:number;categories:string[];methods:Method[];families:Family[];total:number;page:number;pageSize:number;totalPages:number};

export function DecorationGuidance(){
 const [open,setOpen]=useState(false);
 return <details className="records-panel" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Decoration guidance — view research</summary>{open&&<GuidanceReference/>}</details>;
}
function GuidanceReference(){
 const [search,setSearch]=useState(''),[category,setCategory]=useState(''),[method,setMethod]=useState(''),[page,setPage]=useState(1),[data,setData]=useState<Guidance|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController(),timer=setTimeout(async()=>{setLoading(true);setError('');try{const response=await request<{result:Guidance}>('/api/platform',{method:'POST',body:JSON.stringify({module:'catalog',action:'decoration_guidance',input:{search,category,methodId:method,page,pageSize:10}}),signal:controller.signal});if(!controller.signal.aborted)setData(response.result);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Guidance could not load.');}finally{if(!controller.signal.aborted)setLoading(false);}},150);
  return()=>{clearTimeout(timer);controller.abort();};
 },[search,category,method,page]);
 const names=(ids:string[])=>ids.map(id=>data?.methods.find(m=>m.id===id)?.name??id).join(', ')||'None listed';
 return <section className="records-panel" aria-label="Decoration research reference"><div className="panel-heading"><div><h2>Decoration guidance for curation</h2><p>{data?`${data.familyCount} product families · ${data.methodCount} methods and finishes · ${data.sourceCount} references`:'Owner-supplied product-family and method research'}</p></div><span className="badge amber">REFERENCE ONLY</span></div>
  <p className="workbench-note">This is category-level research, not a verified supplier catalog. It does not add products or enable decoration choices. Confirm the exact supplier SKU, variant, method, location, template, costs and publication rights before offering an option.</p>
  <div className="table-toolbar"><label>Search decoration guidance<input aria-label="Search decoration guidance" value={search} maxLength={200} placeholder="Try nylon, caps, cotton or laser" onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label><label>Product family category<select aria-label="Guidance category" value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">All categories</option>{data?.categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Research method<select aria-label="Guidance method" value={method} onChange={e=>{setMethod(e.target.value);setPage(1);}}><option value="">All methods</option>{data?.methods.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label></div>
  {error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading decoration guidance…</p>}
  {data&&<><p>{data.total} matching families · Research dated {data.researchDate}. No exact SKU is verified by this library.</p><div className="source-list">{data.families.map(f=><article key={f.referenceId}><div><h3>{f.name}</h3><p>{f.category} · {f.material}</p><p><strong>Starting recommendations:</strong> {names(f.suggested)}</p><details><summary>Review guidance for {f.name}</summary><p><strong>Alternatives:</strong> {names(f.alternatives)}</p><p><strong>Premium ideas:</strong> {names(f.premium)}</p><p><strong>Common locations:</strong> {f.commonLocations}</p><p><strong>When it fits:</strong> {f.fit}</p><p><strong>Verify:</strong> {f.watchOut}</p><p><strong>Suggested route:</strong> {f.suggestedRoute}. This does not establish an in-house capability or approved producer.</p><p>These are research suggestions. Available decoration options still require exact product verification.</p><ul>{f.sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ul></details></div></article>)}</div>{!data.families.length&&<p>No matching research. Change the search or filters.</p>}<div className="table-footer"><span>Page {page} of {data.totalPages}</span><div><button type="button" className="button secondary compact" disabled={loading||page<=1} onClick={()=>setPage(p=>p-1)}>Previous guidance page</button><button type="button" className="button secondary compact" disabled={loading||page>=data.totalPages} onClick={()=>setPage(p=>p+1)}>Next guidance page</button></div></div>
   <details><summary>Method glossary — all {data.methodCount} research methods</summary>{data.methods.map(m=><section key={m.id}><h3>{m.name}</h3><p>{m.group} · {m.description}</p><p><strong>Best for:</strong> {m.bestFor}</p><p><strong>Limitations:</strong> {m.limitation}</p><small>{m.id} is a research identifier, not an application imprint code or an approved supplier method.</small></section>)}</details>
  </>}
 </section>;
}
