'use client';
import {useEffect,useRef,useState} from 'react';
import Script from 'next/script';

type IntakeConfig={enabled:boolean;synthetic?:boolean;sitekey?:string;action?:string};
type Turnstile={render:(node:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
const widget=()=> (window as unknown as {turnstile?:Turnstile}).turnstile;
const messages:Record<string,string>={INQUIRY_RATE_LIMIT:'Too many requests have been received. Please try again later.',INQUIRY_CHALLENGE_FAILED:'Please complete the security check again, then retry.',INQUIRY_INPUT_INVALID:'Please check the required fields and try again.',REQUESTED_DATE_INVALID:'Please choose a valid date that has not passed.',DEADLINE_DATE_REQUIRED:'Please select a date for your firm deadline.',IDEMPOTENCY_CONFLICT:'A request was already saved using this receipt key. Restore the original details to confirm its receipt, or reload to start a separate request.'};

function SecurityCheck({config,reset,onToken}:{config:IntakeConfig;reset:number;onToken:(token:string)=>void}){
 const container=useRef<HTMLDivElement>(null),callback=useRef(onToken);callback.current=onToken;
 const [ready,setReady]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{
  if(config.synthetic||!ready||!container.current||!widget())return;
  setError(false);const api=widget()!;let id:string;
  try{id=api.render(container.current,{sitekey:config.sitekey,action:config.action,callback:(token:string)=>callback.current(token),'expired-callback':()=>callback.current(''),'error-callback':()=>{callback.current('');setError(true);}});}
  catch{callback.current('');setError(true);return;}
  return ()=>{api.remove(id);};
 },[config,ready,reset]);
 if(config.synthetic)return <label className="checkbox-label"><input key={reset} type="checkbox" required onChange={e=>onToken(e.target.checked?'synthetic-local-inquiry':'')}/>Confirm this is a synthetic test request.</label>;
 return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setError(true)}/><div ref={container} aria-label="Security check"/>{error&&<p role="alert">The security check could not load. Please reload this page to retry.</p>}</>;
}

export default function GuestInquiry({onSignIn}:{onSignIn:()=>void}){
 const [config,setConfig]=useState<IntakeConfig|null>(null),[loadError,setLoadError]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[token,setToken]=useState(''),[reset,setReset]=useState(0),[reference,setReference]=useState('');
 const [key]=useState(()=>crypto.randomUUID());
 useEffect(()=>{const controller=new AbortController();fetch('/api/inquiry',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();setConfig(await r.json());}).catch(()=>{if(!controller.signal.aborted)setLoadError(true);});return()=>controller.abort();},[]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!token)return;const f=new FormData(event.currentTarget);setBusy(true);setError('');
  try{
   const response=await fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,projectName:f.get('project'),contactName:f.get('name'),email:f.get('email'),company:f.get('company'),phone:f.get('phone'),notes:f.get('notes'),deliveryCountry:f.get('country'),deliveryPostalCode:f.get('postal'),requestedDate:f.get('date'),hardDeadline:f.get('deadline')==='on',contactPermission:f.get('permission')==='on',website:f.get('website'),challengeToken:token})});
   const data=await response.json();if(!response.ok)throw new Error(messages[data.code]??'Your request could not be confirmed. Please retry; a repeated request will not be saved twice.');
   if(data.receipt?.status!=='RECEIVED'||typeof data.receipt.reference!=='string')throw new Error('Your request could not be confirmed. Please retry.');setReference(data.receipt.reference);
  }catch(e){setError(e instanceof Error?e.message:'Your request could not be confirmed. Please retry.');}
  finally{setBusy(false);setToken('');setReset(v=>v+1);}
 }
 if(loadError)return <section className="account-card" role="alert"><h2>The request form is temporarily unavailable.</h2><p>Please reload to retry. You can also sign in to use your existing account.</p><button className="button secondary" onClick={()=>window.location.reload()}>Retry loading form</button><button className="button secondary" onClick={onSignIn}>Sign in to discuss a project</button></section>;
 if(!config)return <p role="status">Opening the project request form…</p>;
 if(!config.enabled)return <section className="account-card"><h2>Keep the conversation in your account.</h2><p>Sign in to save your inquiry and follow its progress.</p><button className="button primary" onClick={onSignIn}>Sign in to discuss a project</button></section>;
 if(reference)return <section className="account-card" role="status" aria-label="Quote request receipt"><h2>Your quote request is saved.</h2><p>Please keep this reference: <strong>{reference}</strong></p><p>The team can review your project and contact you at the email address you supplied. Pricing, availability and delivery require a reviewed quote. No order or payment has been created.</p><p>This confirms receipt in the project inbox. It does not confirm an email was sent.</p>{config.synthetic&&<p>Synthetic local test only. This is not a live business request.</p>}</section>;
 return <form className="account-card" aria-label="Guest quote request" onSubmit={submit}><p>No account is needed to request a quote. Please use an email address where we can reach you.</p>{config.synthetic&&<p className="info-box">Synthetic local testing only. Do not enter real customer details.</p>}<fieldset disabled={busy}><legend>Your project and contact details</legend>
  <label>Project name<input name="project" required minLength={3} maxLength={200}/></label><label>Your name<input name="name" required maxLength={150} autoComplete="name"/></label><label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email"/></label><label>Company or organization<input name="company" maxLength={200} autoComplete="organization"/></label><label>Phone (optional)<input name="phone" type="tel" maxLength={50} autoComplete="tel"/></label>
  <label>What would you like to make?<textarea name="notes" required minLength={20} maxLength={4000} rows={5}/></label><label>Delivery country<select name="country" required defaultValue=""><option value="">Choose the destination</option>{[['US','United States'],['CA','Canada'],['GB','United Kingdom'],['AU','Australia'],['NZ','New Zealand']].map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label><label>Delivery postal code (optional)<input name="postal" maxLength={20} autoComplete="postal-code"/></label><label>Requested date (optional)<input name="date" type="date" min={new Date().toISOString().slice(0,10)}/></label><label className="checkbox-label"><input type="checkbox" name="deadline"/>This date is a firm event deadline.</label>
  <label className="checkbox-label"><input type="checkbox" name="permission" required/>You may contact me about this project. This is not marketing consent.</label><label hidden aria-hidden="true">Organization website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  <SecurityCheck config={config} reset={reset} onToken={setToken}/>
 </fieldset>{error&&<p className="info-box" role="alert">{error}</p>}<button className="button primary" disabled={busy||!token}>{busy?'Saving request…':'Request a quote'}</button><p>Your contact details are used for this requested project discussion. An inquiry does not reserve stock or confirm a delivery date.</p><p>Already have an account? <button type="button" className="text-button" onClick={onSignIn}>Sign in to discuss a project</button></p></form>;
}
