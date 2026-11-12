'use client';
import {useState} from 'react';
import Link from 'next/link';
import {stringValue,type Command,type Session} from './types';
export default function ProjectInquiry({session,command,onSignIn,onSubmitted}:{session:Session|null;command:Command;onSignIn:()=>void;onSubmitted:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[inquiryKey]=useState(()=>crypto.randomUUID());
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const values=new FormData(event.currentTarget);setBusy(true);setError('');try{
   await command('commerce','submit_inquiry',{key:inquiryKey,projectName:values.get('project'),contactName:values.get('name'),company:values.get('company'),phone:values.get('phone'),notes:values.get('notes'),deliveryCountry:values.get('country'),deliveryPostalCode:values.get('postal'),requestedDate:values.get('date'),hardDeadline:values.get('deadline')==='on',contactPermission:values.get('permission')==='on',website:values.get('website')});await onSubmitted();
  }catch(e){setError(e instanceof Error?e.message:'Your inquiry could not be saved.');}finally{setBusy(false);}
 }
 return <main className="container account-page"><div className="page-heading"><div><span className="eyebrow">START WITH YOUR PROJECT</span><h1>Let’s find the right approach.</h1><p>Tell us what you need, even if you haven’t chosen a product. Your inquiry starts a discussion; specifications, pricing and delivery need a reviewed quote.</p></div></div>
  {!session?<section className="account-card"><h2>Keep the conversation in your account.</h2><p>Sign in to save your inquiry and follow its progress.</p><button className="button primary" onClick={onSignIn}>Sign in to discuss a project</button></section>:<form onSubmit={submit} className="account-card" aria-label="Project inquiry"><fieldset disabled={busy}><legend>Project and requested follow-up</legend>
   <label>Project name<input name="project" required minLength={3} maxLength={200}/></label><label>Your name<input name="name" required maxLength={150} autoComplete="name" defaultValue={stringValue(session.user?.name)}/></label><label>Company or organization<input name="company" maxLength={200} autoComplete="organization"/></label><label>Phone (optional)<input name="phone" maxLength={50} autoComplete="tel" type="tel"/></label>
   <label>What would you like to make?<textarea name="notes" required minLength={20} maxLength={4000} rows={5}/></label><label>Delivery country<select name="country" required defaultValue=""><option value="">Choose the destination</option>{[['US','United States'],['CA','Canada'],['GB','United Kingdom'],['AU','Australia'],['NZ','New Zealand']].map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label><label>Delivery postal code (optional)<input name="postal" maxLength={20} autoComplete="postal-code"/></label><label>Requested date (optional)<input name="date" type="date" min={new Date().toISOString().slice(0,10)}/></label><label className="checkbox-label"><input type="checkbox" name="deadline"/>This date is a firm event deadline.</label>
   <label className="checkbox-label"><input type="checkbox" name="permission" required/>You may contact me about this project. This is not marketing consent.</label><label hidden aria-hidden="true">Organization website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  </fieldset>{error&&<p className="info-box" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy?'Saving inquiry…':'Save project inquiry'}</button><p>Saved to your account. No order or payment is created.</p></form>}
  <p><Link href="/catalog">Browse products</Link> if you’re ready to choose.</p>
 </main>;
}
