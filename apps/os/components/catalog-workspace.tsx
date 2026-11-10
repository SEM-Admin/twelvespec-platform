'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowRight,CheckCircle2,ChevronLeft,ChevronRight,FileUp,Search,ShieldCheck} from 'lucide-react';
import {asString,command,key,pretty,request,type Data,type Row} from './types';

type Run=(action:string,input:Data)=>Promise<unknown>;
type Library={items:Row[];total:number;page:number;pageSize:number;sourceCounts:{supplier:string;count:number}[]};
const empty:Library={items:[],total:0,page:1,pageSize:20,sourceCounts:[]};
const methods=['screen_print','embroidery','digital','sublimation','laser','offset','heat_transfer','none'];
const locations=['front','back','left_chest','right_chest','side','full_bleed'];
const categories=['APPAREL','PROMO','PRINT','SIGNAGE','EVENT','PACKAGING','KIT','CUSTOM_MANUFACTURED','SERVICE'];

export function CatalogWorkspace({tables,run}:{tables:Record<string,Row[]>;run:Run}){
 const [library,setLibrary]=useState<Library>(empty),[search,setSearch]=useState(''),[supplier,setSupplier]=useState(''),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[editorId,setEditorId]=useState(''),[defaultSupplier,setDefaultSupplier]=useState('S&S Activewear');
 const file=useRef<HTMLInputElement>(null);
 const [opened,setOpened]=useState<{product:Row;variants:Row[]}|null>(null);
 useEffect(()=>{if(!editorId){setOpened(null);return;}let active=true;void command('catalog','read_product',{id:editorId}).then(result=>{if(active)setOpened(result.result as {product:Row;variants:Row[]});}).catch(e=>{if(active)setError(e instanceof Error?e.message:'The selected product could not load.');});return()=>{active=false;};},[editorId,tables.products,tables.variants]);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);
  try{const query=new URLSearchParams({search,supplier,page:String(page),pageSize:'20'});const result=await request<Library>(`/api/catalog/sources?${query}`,{signal});if(!signal?.aborted){setLibrary(result);setError('');}}
  catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'The source library could not load.');}
  finally{if(!signal?.aborted)setLoading(false);}
 },[search,supplier,page]);
 useEffect(()=>{const controller=new AbortController(),timer=setTimeout(()=>void load(controller.signal),200);return()=>{clearTimeout(timer);controller.abort();};},[load]);
 async function promote(source:Row){setBusy(source.id);setError('');try{const draft=await run('create_from_source',{id:source.id}) as Row;setEditorId(draft.id);setNotice('Draft opened. Confirm variants, configuration and licensed media before publication.');await load();}catch(e){setError(e instanceof Error?e.message:'Draft creation failed.');}finally{setBusy('');}}
 async function upload(selected:File){
  setBusy('upload');setError('');setNotice('');
  try{if(selected.size>10*1024*1024)throw new Error('Use a source file smaller than 10 MB.');const content=await selected.text();const result=await command('catalog','stage_source_file',{content,format:selected.name.toLowerCase().endsWith('.json')?'JSON':'CSV',supplier:defaultSupplier});const counts=result.result as Data;setNotice(`${counts.created} source records staged; ${counts.unchanged} unchanged. No products published.`);await load();}
  catch(e){setError(e instanceof Error?e.message:'The source file could not be staged.');}finally{setBusy('');if(file.current)file.current.value='';}
 }
 async function runEditor(action:string,input:Data){setBusy('editor');try{const result=await run(action,input);if(editorId){const fresh=await command('catalog','read_product',{id:editorId});setOpened(fresh.result as {product:Row;variants:Row[]});}return result;}finally{setBusy('');}}
 const products=tables.products??[],listed=products.find(p=>p.id===editorId),selected=listed??(opened?.product.id===editorId?opened.product:undefined);
 const variantMap=new Map<string,Row>();for(const v of [...(opened?.product.id===editorId?opened.variants:[]),...(tables.variants??[]).filter(v=>v.product_id===editorId)])if(!variantMap.has(v.id)||(variantMap.get(v.id)?.revision??0)<=v.revision)variantMap.set(v.id,v);const selectedVariants=[...variantMap.values()];
 return <section className="owned-catalog" aria-label="Owned catalog workspace">
  <div className="workbench-heading"><div><span className="eyebrow">YOUR CATALOG, YOUR CUSTOMER EXPERIENCE</span><h2>Build from verified facts.</h2><p>Keep source evidence private. Review your own product copy, exact options and media before it appears on the website.</p></div><span className="badge neutral"><ShieldCheck size={14}/> Review before publication</span></div>
  {error&&<p className="alert error" role="alert">{error}</p>}{notice&&<p className="alert" role="status">{notice}</p>}
  <div className="source-metrics">{library.sourceCounts.map(s=><div key={s.supplier}><span>{s.supplier}</span><strong>{s.count.toLocaleString()}</strong><small>private source records</small></div>)}{!library.sourceCounts.length&&!loading&&<p>No source records yet. Upload supplier-authorized source data to start.</p>}</div>
  <details className="source-upload"><summary><FileUp size={16}/> Stage a source file</summary><p>CSV supports supplier, externalId (or styleID/sku), title, brand, model, description, category, sourceUrl and imageUrl. Prepared source bundles also support JSON. Missing price, variants and MOQ stay unknown.</p><div className="workbench-form-row"><label>Supplier for CSV rows without a supplier column<input value={defaultSupplier} maxLength={100} onChange={e=>setDefaultSupplier(e.target.value)}/></label><label>Catalog source file<input ref={file} type="file" accept=".csv,.json" disabled={!!busy} onChange={e=>{const chosen=e.target.files?.[0];if(chosen)void upload(chosen);}}/></label></div></details>
  <div className="source-toolbar"><label><Search size={16}/><input aria-label="Search source library" placeholder="Search all source titles, brands or model numbers" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label><select aria-label="Filter source supplier" value={supplier} onChange={e=>{setSupplier(e.target.value);setPage(1);}}><option value="">All sources</option>{library.sourceCounts.map(s=><option key={s.supplier}>{s.supplier}</option>)}</select></div>
  {loading&&<p role="status" className="workbench-loading">Searching source records…</p>}
  <div className="source-list">{library.items.map(source=><article key={source.id}><div><strong>{source.title}</strong><p>{asString(source.data.supplier)} · {asString(source.data.model)||asString(source.data.externalId)} · {pretty(asString(source.data.environment))}</p><small>Options, prices and publication rights need review.</small><details className="source-facts"><summary>View source evidence</summary><p>{asString(source.data.description)||'No source description supplied.'}</p><p>Source category: {asString(source.data.sourceCategory)||'Unknown'} · Observed {asString(source.data.observedAt)}</p>{source.data.sourceEnabled===false&&<p>The source lists this record as disabled. Confirm its meaning and current availability with the supplier.</p>}{!!source.data.sourceUrl&&<a href={asString(source.data.sourceUrl)} target="_blank" rel="noreferrer">Source reference ↗</a>}{!!source.data.imageUrl&&<a href={asString(source.data.imageUrl)} target="_blank" rel="noreferrer">Source image — reuse review required ↗</a>}</details></div><button className="button secondary compact" disabled={!!busy} onClick={()=>void promote(source)} aria-label={`${source.draft_id?'Open draft':'Create draft'}: ${source.title}`}>{source.draft_id?'Open product':'Create draft'}<ArrowRight size={14}/></button></article>)}</div>
  {!loading&&!library.items.length&&<p className="workbench-empty">No source records match. Adjust the search or upload an authorized file.</p>}
  <div className="source-pagination"><span>{library.total.toLocaleString()} matching records · page {page} of {Math.max(1,Math.ceil(library.total/library.pageSize))}</span><div><button className="iconbutton" aria-label="Previous source page" disabled={page===1||loading} onClick={()=>setPage(v=>v-1)}><ChevronLeft size={17}/></button><button className="iconbutton" aria-label="Next source page" disabled={page*library.pageSize>=library.total||loading} onClick={()=>setPage(v=>v+1)}><ChevronRight size={17}/></button></div></div>
  <div className="owned-editor"><h3>Curate a TwelveSpec product</h3><label>Product to edit<select value={editorId} disabled={!!busy} onChange={e=>setEditorId(e.target.value)}><option value="">Choose a recent product or open a source draft</option>{selected&&!products.some(p=>p.id===selected.id)&&<option value={selected.id}>{selected.title} · {pretty(selected.status)}</option>}{products.map(p=><option key={p.id} value={p.id}>{p.title} · {pretty(p.status)}</option>)}</select></label>{selected&&<fieldset disabled={!!busy} aria-busy={busy==='editor'} style={{border:0,margin:0,padding:0,minWidth:0}}><ProductEditor key={`${selected.id}:${selected.revision}`} product={selected} variants={selectedVariants} run={runEditor}/></fieldset>}</div>
 </section>;
}

function ProductEditor({product,variants,run}:{product:Row;variants:Row[];run:Run}){
 const d=product.data;
 const [form,setForm]=useState({title:product.title,brand:asString(d.brand),description:asString(d.description),category:asString(d.category),minimumQuantity:d.minimumQuantity===null?'':asString(d.minimumQuantity),leadTimeDays:d.leadTimeDays===null?'':asString(d.leadTimeDays),image:asString(d.image),licenseApproved:d.licenseApproved===true,methods:Array.isArray(d.methods)?d.methods as string[]:[],locations:Array.isArray(d.locations)?d.locations as string[]:[]});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[review,setReview]=useState<Data|null>(null),[reason,setReason]=useState('');
 const set=(field:string,value:unknown)=>setForm(old=>({...old,[field]:value}));
 async function act(action:string,input:Data){setBusy(true);setError('');try{return await run(action,input);}catch(e){setError(e instanceof Error?e.message:'The product change failed.');}finally{setBusy(false);}}
 async function uploadImage(file:File){
  setError('');if(file.size>5*1024*1024){setError('Use a PNG, JPEG or WebP image smaller than 5 MB.');return;}
  try{const content=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('The image could not be read.'));reader.readAsDataURL(file);});const result=await act('save_catalog_image',{productId:product.id,content,fileName:file.name,rightsConfirmed:form.licenseApproved}) as Data|undefined;if(result?.imagePath)set('image',String(result.imagePath));}
  catch(e){setError(e instanceof Error?e.message:'The image upload failed.');}
 }
 function toggle(field:'methods'|'locations',value:string){setForm(old=>({...old,[field]:old[field].includes(value)?old[field].filter(v=>v!==value):[...old[field],value]}));}
 return <div className="product-editor">
  <p className="workbench-note">{product.status==='PUBLISHED'?'Draft edits preserve the last published website version until you review and publish again.':'This draft is private. Fill the missing facts and review its publication checks.'}</p>
  {d.sourceEnvironment==='STAGING'&&<p className="workbench-note">This product starts from supplier development data. Confirm current product facts and commercial availability independently.</p>}
  {error&&<p role="alert" className="alert error">{error}</p>}
  <form onSubmit={e=>{e.preventDefault();void act('update',{id:product.id,expectedRevision:product.revision,title:form.title,data:{brand:form.brand,description:form.description,category:form.category||null,minimumQuantity:form.minimumQuantity===''?null:Number(form.minimumQuantity),leadTimeDays:form.leadTimeDays===''?null:Number(form.leadTimeDays),methods:form.methods,locations:form.locations,image:form.image||null,licenseApproved:form.licenseApproved}});}}>
   <div className="workbench-form-row"><label>Customer product name<input required maxLength={500} value={form.title} onChange={e=>set('title',e.target.value)}/></label><label>Consumer brand<input maxLength={200} value={form.brand} onChange={e=>set('brand',e.target.value)}/></label></div>
   <label>Customer product description<textarea rows={4} maxLength={10000} value={form.description} onChange={e=>set('description',e.target.value)}/></label>
   <div className="workbench-form-row three"><label>Catalog category<select value={form.category} onChange={e=>set('category',e.target.value)}><option value="">Needs review</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Minimum quantity<input type="number" min={1} step={1} value={form.minimumQuantity} onChange={e=>set('minimumQuantity',e.target.value)}/></label><label>Indicative lead time (days)<input type="number" min={0} max={365} value={form.leadTimeDays} onChange={e=>set('leadTimeDays',e.target.value)}/></label></div>
   <fieldset className="option-checks"><legend>Reviewed decoration methods</legend>{methods.map(m=><label key={m}><input type="checkbox" checked={form.methods.includes(m)} onChange={()=>toggle('methods',m)}/>{pretty(m)}</label>)}</fieldset>
   <fieldset className="option-checks"><legend>Reviewed locations</legend>{locations.map(l=><label key={l}><input type="checkbox" checked={form.locations.includes(l)} onChange={()=>toggle('locations',l)}/>{pretty(l)}</label>)}</fieldset>
   <label className="workbench-check"><input type="checkbox" checked={form.licenseApproved} onChange={e=>set('licenseApproved',e.target.checked)}/>I have confirmed publication rights for the product copy and images.</label>
   <label>Upload approved product photo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||!form.licenseApproved} onChange={e=>{const chosen=e.target.files?.[0];if(chosen)void uploadImage(chosen);e.target.value='';}}/><small>Confirm publication rights above to enable upload. The uploaded image remains private until this product is published.</small></label>
   <label>Approved local product image<input value={form.image} placeholder="Upload a photo or use an existing approved local image" onChange={e=>set('image',e.target.value)}/><small>Source image URLs remain private until an approved local derivative is available.</small></label>
   <button className="button primary" disabled={busy} type="submit">Save catalog draft<CheckCircle2 size={16}/></button>
  </form>
  <h4>Exact color and size variants</h4><p>Enter reviewed combinations. Missing source variants are not generated automatically.</p>
  {variants.map(v=><VariantEditor key={`${v.id}:${v.revision}`} product={product} variant={v} run={run}/>)}<VariantEditor key={`new-${variants.length}`} product={product} run={run}/>
  <div className="publish-review"><button className="button secondary" disabled={busy} onClick={()=>void act('publish',{ids:[product.id],dryRun:true}).then(result=>{if(result)setReview(result as Data);})}>Check website publication</button>
   {review&&<div><p>{Array.isArray(review.blocked)&&review.blocked.length?'Publication needs more work.':'Publication checks passed for this draft.'}</p>{Array.isArray(review.blocked)&&review.blocked.map((r,i)=>{const row=r as Data;return <ul key={i}>{(row.issues as string[]).map(issue=><li key={issue}>{pretty(issue)}</li>)}</ul>;})}
    {Array.isArray(review.eligible)&&review.eligible.includes(product.id)&&<><label>Publication review note<textarea value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label><button className="button primary" disabled={busy||!reason.trim()} onClick={()=>void act('publish',{ids:[product.id],dryRun:false,previewHash:review.previewHash,approvalReason:reason,idempotencyKey:key()})}>Publish reviewed product</button></>}
   </div>}
  </div>
 </div>;
}

function VariantEditor({product,variant,run}:{product:Row;variant?:Row;run:Run}){
 const [color,setColor]=useState(asString(variant?.data.color)),[size,setSize]=useState(asString(variant?.data.size)),[hex,setHex]=useState(asString(variant?.data.hex,'#64748b')),[image,setImage]=useState(asString(variant?.data.image)),[status,setStatus]=useState(variant?.status??'ACTIVE'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form className="variant-editor" onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void run('save_variant',{productId:product.id,expectedProductRevision:product.revision,...(variant?{id:variant.id,expectedRevision:variant.revision}:{}),color,size,hex,image:image||null,status}).catch(e=>setError(e instanceof Error?e.message:'Variant save failed.')).finally(()=>setBusy(false));}}>
  <strong>{variant?'Edit variant':'Add a reviewed variant'}</strong><div className="workbench-form-row three"><label>Variant color<input required maxLength={100} value={color} onChange={e=>setColor(e.target.value)}/></label><label>Variant size<input required maxLength={100} value={size} onChange={e=>setSize(e.target.value)}/></label><label>Swatch hex<input required pattern="#[a-fA-F0-9]{6}" value={hex} maxLength={7} onChange={e=>setHex(e.target.value)}/></label></div>
  <div className="workbench-form-row"><label>Approved variant image<input value={image} onChange={e=>setImage(e.target.value)}/></label><label>Variant status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="ACTIVE">Active in draft</option><option value="ARCHIVED">Archive in draft</option></select></label></div>{error&&<p role="alert">{error}</p>}<button className="button secondary compact" disabled={busy}>{variant?'Save variant':'Add variant'}</button>
 </form>;
}
