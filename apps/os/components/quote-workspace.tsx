'use client';
import {useState} from 'react';
import {ArrowRight,CheckCircle2,ClipboardList,FileCheck2} from 'lucide-react';
import {asString,key,money,pretty,type Data,type Row} from './types';
import {QuoteEvidenceReview} from './evidence-library';
import {QuoteQualification} from './quote-qualification';

type Run=(action:string,input:Data)=>Promise<unknown>;
const object=(v:unknown):Data=>v&&typeof v==='object'&&!Array.isArray(v)?v as Data:{};
const rows=(v:unknown):Data[]=>Array.isArray(v)?v.map(object):[];
const fields=[['material_cost','Materials / blank goods'],['decoration_run_cost','Decoration run'],['setup','Setup'],['prepress','Prepress / design'],['outsourced_labor','Outside labor'],['packaging','Packaging / assembly'],['allocated_freight','Freight'],['other_direct_cost','Other direct costs']] as const;
const dateInput=(date:Date)=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);

export function QuoteWorkspace({tables,run}:{tables:Record<string,Row[]>;run:Run}){
 const requests=tables.requests??[],quotes=tables.quotes??[];
 const [requestId,setRequestId]=useState(''),[quoteId,setQuoteId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 const request=requests.find(r=>r.id===requestId)??requests[0],quote=quotes.find(q=>q.id===quoteId)??quotes.find(q=>q.request_id===request?.id||q.data.requestId===request?.id);
 const brief=object(request?.data.brief),snapshots=rows(request?.data.lineSnapshots).length?rows(request?.data.lineSnapshots):rows(request?.data.lines);
 async function act(action:string,input:Data){setBusy(true);setError('');try{return await run(action,input);}catch(e){setError(e instanceof Error?e.message:'The quote operation failed.');}finally{setBusy(false);}}
 return <section className="quote-workbench" aria-label="Customer requests and reviewed quoting">
  <div className="workbench-heading"><div><span className="eyebrow">FROM CUSTOMER BRIEF TO REVIEWED PRICE</span><h2>Your quote workbench.</h2><p>Review exact requirements, enter complete costs, then issue the customer’s quote.</p></div><ClipboardList size={29}/></div>
  {error&&<p className="alert error" role="alert">{error}</p>}
  <label>Customer request<select value={request?.id??''} onChange={e=>{setRequestId(e.target.value);setQuoteId('');setNote('');}}><option value="" disabled>Select a request</option>{requests.map(r=><option key={r.id} value={r.id}>{r.title} · {pretty(r.status)}</option>)}</select></label>
  {!request?<p className="workbench-empty">Customer quote requests will appear here with their selected products and project brief.</p>:<div className="request-review">
   <div className="workbench-heading"><h3>{request.title}</h3><span className="badge neutral">{pretty(request.status)}</span></div>
   <dl className="brief-facts"><div><dt>Contact</dt><dd>{asString(brief.contactName)||'Account holder'}{brief.company?` · ${brief.company}`:''}{brief.phone?` · ${brief.phone}`:''}</dd></div><div><dt>Destination</dt><dd>{[brief.deliveryPostalCode,brief.deliveryCountry].filter(Boolean).join(', ')||'Needs confirmation'}</dd></div><div><dt>Requested date</dt><dd>{asString(brief.requestedDate)||'To be discussed'}{brief.hardDeadline===true?' · Firm event deadline':''}</dd></div><div><dt>Artwork</dt><dd>{pretty(asString(brief.artworkStatus,'UNKNOWN'))}</dd></div></dl>
   {!!brief.notes&&<p className="customer-notes">{asString(brief.notes)}</p>}
   {!!request.data.note&&<p className="customer-notes">{asString(request.data.note)}</p>}
   {snapshots.map((line,i)=><div className="request-line" key={i}><strong>{asString(line.title)||asString(line.productId)} × {asString(line.quantity)}</strong><p>{[line.color,line.size,pretty(asString(line.method)),pretty(asString(line.location))].filter(Boolean).join(' · ')}</p>{!!line.notes&&<p>{asString(line.notes)}</p>}{Object.keys(object(line.specifications)).length>0&&<small>{Object.entries(object(line.specifications)).map(([name,value])=>`${pretty(name)}: ${value}`).join(' · ')}</small>}</div>)}
   {Array.isArray(object(request.data.intakeReview).missingFields)&&object(request.data.intakeReview).status==='NEEDS_DETAILS'&&<p className="workbench-note">Missing intake details: {(object(request.data.intakeReview).missingFields as string[]).map(pretty).join(', ')}. Confirm these with the customer before issuing a price.</p>}
   {!quote&&request.status!=='CLOSED'&&<button className="button primary" disabled={busy} onClick={()=>void act('create',{requestId:request.id,idempotencyKey:`prepare-${request.id}`}).then(value=>{if(value)setQuoteId((value as Row).id);})}>Prepare quote from request<ArrowRight size={16}/></button>}
   {!['CLOSED','QUOTED'].includes(request.status)&&<details className="request-follow-up"><summary>Request follow-up</summary><label>Internal review note<textarea value={note} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label><div className="workbench-buttons">{request.status!=='AWAITING_CUSTOMER'&&<button className="button secondary compact" disabled={busy||!note.trim()} onClick={()=>void act('review_request',{id:request.id,status:'AWAITING_CUSTOMER',note,expectedRevision:request.revision})}>Mark waiting for customer</button>}{request.status==='AWAITING_CUSTOMER'&&<button className="button secondary compact" disabled={busy||!note.trim()} onClick={()=>void act('review_request',{id:request.id,status:'IN_REVIEW',note,expectedRevision:request.revision})}>Resume review</button>}<button className="button secondary compact" disabled={busy||!note.trim()} onClick={()=>void act('review_request',{id:request.id,status:'CLOSED',note,expectedRevision:request.revision})}>Close request</button></div></details>}
  </div>}
  {quotes.length>0&&<label>Quote to review<select value={quote?.id??''} onChange={e=>setQuoteId(e.target.value)}><option value="">Choose a quote</option>{quotes.map(q=><option key={q.id} value={q.id}>{q.title} · {pretty(q.status)}</option>)}</select></label>}
  {quote&&<QuoteReview key={`${quote.id}:${quote.revision}`} quote={quote} run={run}/>}
 </section>;
}

function QuoteReview({quote,run}:{quote:Row;run:Run}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reason,setReason]=useState('');
 async function act(action:string,input:Data){setBusy(true);setError('');try{await run(action,input);}catch(e){setError(e instanceof Error?e.message:'Quote review failed.');}finally{setBusy(false);}}
 const assumptions=object(quote.data.commercialAssumptions);
 return <div className="quote-review"><div className="workbench-heading"><div><h3>{quote.title}</h3><p>Quote revision {quote.revision} · {pretty(quote.status)}</p></div>{quote.data.total?<strong className="reviewed-total">{money(quote.data.total)}</strong>:<FileCheck2 size={25}/>}</div>
  {error&&<p role="alert" className="alert error">{error}</p>}
  {quote.status==='DRAFT'&&<><QuoteEvidenceReview quote={quote} run={run}/><QuoteQualification quote={quote} run={run}/></>}
  {['DRAFT','COSTED'].includes(quote.status)&&<CostWorksheet quote={quote} run={run}/>}
  {quote.status==='APPROVAL_REQUIRED'&&<><p>A margin exception needs owner or manager approval.</p><label>Margin exception reason<textarea value={reason} maxLength={2000} onChange={e=>setReason(e.target.value)}/></label><button className="button secondary" disabled={busy||!reason.trim()} onClick={()=>void act('approve_margin',{id:quote.id,reason})}>Approve margin exception</button></>}
  {['READY_TO_ISSUE','ISSUED','ACCEPTED'].includes(quote.status)&&<><p className="workbench-note">{assumptions.deliveryNote?asString(assumptions.deliveryNote):'Review the quote specifications and delivery assumptions before issue.'}</p>{assumptions.taxNote&&<p>{asString(assumptions.taxNote)}</p>}<p>Quote valid until {quote.data.validUntil?new Date(String(quote.data.validUntil)).toLocaleString():'not set'}.</p>
   {quote.status==='READY_TO_ISSUE'&&<button className="button primary" disabled={busy} onClick={()=>void act('issue_quote',{id:quote.id,key:key(),expectedRevision:quote.revision})}>Issue reviewed quote<CheckCircle2 size={16}/></button>}
   {quote.status==='ISSUED'&&<p className="workbench-note">The issued revision is available in this customer’s account. Issuing does not send email, collect payment or place a supplier order.</p>}
  </>}
 </div>;
}

function CostWorksheet({quote,run}:{quote:Row;run:Run}){
 const inputs=rows(quote.costingInputs),snapshots=rows(quote.data.lineSnapshots),oldLines=rows(quote.data.lines);
 const [costs,setCosts]=useState<Data[]>(()=>inputs.map((_,i)=>Object.fromEntries(fields.map(([key])=>[key,asString(object(oldLines[i]?.components)[key])]))));
 const [reference,setReference]=useState(''),[observedAt,setObservedAt]=useState(()=>dateInput(new Date())),[validUntil,setValidUntil]=useState(()=>dateInput(new Date(Date.now()+86400000))),[margin,setMargin]=useState('40'),[deliveryNote,setDeliveryNote]=useState(''),[confirmed,setConfirmed]=useState({productOptionsConfirmed:false,availabilityConfirmed:false,deliveryConfirmed:false}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await run('cost_quote',{id:quote.id,expectedRevision:quote.revision,currency:'USD',targetMargin:String(Number(margin)/100),costReference:reference,observedAt:new Date(observedAt).toISOString(),validUntil:new Date(validUntil).toISOString(),lineCosts:inputs.map((line,i)=>({configurationHash:line.configurationHash,components:costs[i]})),commercialReview:{...confirmed,deliveryNote,taxTreatment:'EXCLUDED'}});}catch(e){setError(e instanceof Error?e.message:'The cost worksheet could not be calculated.');}finally{setBusy(false);}}
 return <form className="cost-worksheet" onSubmit={e=>void submit(e)}>
  <h4>Reviewed cost worksheet</h4><p>Enter total direct costs for each line’s full quantity in USD. Enter 0 only where you have confirmed no cost applies. Internal costs and evidence stay private.</p>
  {error&&<p className="alert error" role="alert">{error}</p>}
  {inputs.map((line,i)=><fieldset key={i}><legend>{asString(snapshots[i]?.title)||asString(line.title)||`Item ${i+1}`} · {asString(line.quantity)} units</legend><div className="cost-input-grid">{fields.map(([key,label])=><label key={key}>{label}<input aria-label={`${label} for item ${i+1}`} required type="number" min={0} step="0.01" value={asString(costs[i]?.[key])} onChange={e=>setCosts(old=>old.map((v,j)=>j===i?{...v,[key]:e.target.value}:v))}/></label>)}</div><button type="button" className="text-button" onClick={()=>setCosts(old=>old.map((v,j)=>j===i?Object.fromEntries(fields.map(([key])=>[key,v[key]||'0.00'])):v))}>Confirm remaining blank costs are zero</button></fieldset>)}
  <label>Cost evidence or supplier quote reference<input required maxLength={1000} value={reference} onChange={e=>setReference(e.target.value)} placeholder="Supplier quotation, reviewed rate sheet or approved internal job costing"/></label>
  <div className="workbench-form-row three"><label>Cost observed at<input required type="datetime-local" value={observedAt} onChange={e=>setObservedAt(e.target.value)}/></label><label>Quote valid until<input required type="datetime-local" value={validUntil} onChange={e=>setValidUntil(e.target.value)}/></label><label>Target gross margin (%)<input required type="number" min={0} max={99} step="0.1" value={margin} onChange={e=>setMargin(e.target.value)}/></label></div>
  <label>Customer delivery and scope statement<textarea required rows={3} maxLength={2000} value={deliveryNote} onChange={e=>setDeliveryNote(e.target.value)} placeholder="State the confirmed destination, delivery window, decoration, packing and any exclusions."/></label>
  <div className="commercial-review-checks">{[['productOptionsConfirmed','I confirmed exact product options and requested specifications.'],['availabilityConfirmed','I confirmed source availability for these quantities.'],['deliveryConfirmed','I confirmed delivery feasibility and included freight costs.']].map(([key,label])=><label className="workbench-check" key={key}><input type="checkbox" required checked={confirmed[key as keyof typeof confirmed]} onChange={e=>setConfirmed(old=>({...old,[key]:e.target.checked}))}/>{label}</label>)}</div>
  <p className="workbench-note">The issued quote will explicitly exclude sales tax. Tax is determined separately before invoicing. No supplier or payment action occurs here.</p>
  <button className="button primary" disabled={busy||!inputs.length} type="submit">Calculate reviewed quote<ArrowRight size={16}/></button>
 </form>;
}
