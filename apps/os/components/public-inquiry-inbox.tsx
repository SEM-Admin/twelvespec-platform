'use client';
import {useEffect,useState} from 'react';
import {asString,request,type Data,type Row} from './types';
type Inbox={rows:Row[];total:number;page:number;totalPages:number};
export function PublicInquiryInbox({onChanged}:{onChanged:()=>Promise<void>}){
 const [page,setPage]=useState(1),[status,setStatus]=useState('OPEN'),[inbox,setInbox]=useState<Inbox|null>(null),[selected,setSelected]=useState<Row|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[generation,setGeneration]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setError('');setInbox(null);setSelected(null);
  request<{result:Inbox}>('/api/platform',{method:'POST',body:JSON.stringify({module:'crm',action:'public_inquiry_inbox',input:{page,status}}),signal:controller.signal}).then(v=>setInbox(v.result)).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'The inbox could not load.');});
  return()=>controller.abort();
 },[page,status,generation]);
 async function review(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!selected||busy)return;const f=new FormData(event.currentTarget);setBusy(true);setError('');setNotice('');
  try{await request('/api/platform',{method:'POST',body:JSON.stringify({module:'crm',action:'review_public_inquiry',input:{id:selected.id,expectedRevision:selected.revision,status:f.get('status'),note:f.get('note'),contacted:f.get('contacted')==='on'}})});setSelected(null);setGeneration(n=>n+1);setNotice('Review saved. No email was sent by this action.');await onChanged();}
  catch(e){setError(e instanceof Error?e.message:'The review could not be saved.');}finally{setBusy(false);}
 }
 const brief=(selected?.data.brief??{}) as Data;
 return <section className="records-panel" aria-label="Website quote request inbox"><div className="panel-heading"><div><h2>Website quote requests</h2><p>Account-free inquiries assigned to this workspace. Verify contact details and review the project before quoting.</p></div><button className="button secondary" disabled={busy} onClick={()=>setGeneration(n=>n+1)}>Refresh requests</button></div>
  <div className="table-toolbar"><label>Request status<select aria-label="Website request status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>{['ALL','OPEN','IN_REVIEW','RESPONDED','CLOSED','SPAM'].map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select></label>{inbox&&<p>{inbox.total} matching requests</p>}</div>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {!inbox&&!error?<p role="status">Loading requests…</p>:inbox?.rows.length===0?<p>No website requests match this view.</p>:<ul>{inbox?.rows.map(row=><li key={row.id}><button type="button" className="text-button" onClick={()=>{setSelected(row);setError('');}}>{row.title}</button> · {row.status.replaceAll('_',' ')} · {new Date(row.created_at).toLocaleString()}</li>)}</ul>}
  {inbox&&<div className="table-footer"><span>Page {page} of {inbox.totalPages}</span><div><button type="button" className="button secondary compact" disabled={page<=1||busy} onClick={()=>setPage(n=>n-1)}>Previous requests</button><button type="button" className="button secondary compact" disabled={page>=inbox.totalPages||busy} onClick={()=>setPage(n=>n+1)}>Next requests</button></div></div>}
  {selected&&<section className="workbench-panel" aria-label="Review website quote request"><h3>{selected.title}</h3><p>Receipt: {selected.id}</p><dl className="data-details"><div><dt>Submitted name</dt><dd>{asString(brief.contactName)}</dd></div><div><dt>Submitted email</dt><dd>{asString(selected.data.submittedEmail)} (unverified)</dd></div><div><dt>Company</dt><dd>{asString(brief.company)||'Not supplied'}</dd></div><div><dt>Phone</dt><dd>{asString(brief.phone)||'Not supplied'}</dd></div><div><dt>Project</dt><dd style={{whiteSpace:'pre-wrap'}}>{asString(brief.notes)}</dd></div><div><dt>Destination</dt><dd>{asString(brief.deliveryCountry)} {asString(brief.deliveryPostalCode)}</dd></div><div><dt>Requested date</dt><dd>{asString(brief.requestedDate)||'Not supplied'}{brief.hardDeadline===true?' · Firm event deadline, unconfirmed':''}</dd></div></dl>
   <p>Permission covers this project discussion only. No marketing consent, verified account, stock reservation or production commitment is created.</p><p>Reply using your approved business communication process. This inbox does not send email. Continue product scope and pricing through the existing reviewed quote workflow once the customer identity is established.</p>
   <form key={selected.id+':'+selected.revision} onSubmit={review} aria-label="Website inquiry review"><fieldset disabled={busy}><legend>Record your review</legend><label>Review status<select name="status" aria-label="Review status" defaultValue={selected.status}>{['OPEN','IN_REVIEW','RESPONDED','CLOSED','SPAM'].map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select></label><label>Review note<textarea name="note" aria-label="Review note" required minLength={3} maxLength={2000} rows={3} defaultValue={asString((selected.data.review as Data|undefined)?.note)}/></label><label className="checkbox-label"><input name="contacted" type="checkbox"/>I contacted this customer outside this system (required to mark responded).</label></fieldset><button className="button primary" disabled={busy}>{busy?'Saving…':'Save request review'}</button></form>
  </section>}
 </section>;
}
