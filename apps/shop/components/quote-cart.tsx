'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ChevronLeft,Loader2,Palette,Plus,ShieldCheck,ShoppingBag,Trash2,UserRound} from 'lucide-react';
import ProductVisual from './product-visual';
import type {CartLine,Data,Product,Row} from './types';

const label=(v:string)=>v.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
export default function QuoteCart({cart,lines,products,stores,signedIn,busy,onSignIn,onUpdate,onSubmit}:{cart:Row|null;lines:CartLine[];products:Product[];stores:Row[];signedIn:boolean;busy:boolean;onSignIn:()=>void;onUpdate:(lines:CartLine[])=>Promise<void>;onSubmit:(brief:Data)=>Promise<void>}){
 const [brief,setBrief]=useState({projectName:cart?.title??'My TwelveSpec project',company:'',contactName:'',phone:'',deliveryCountry:'US',deliveryPostalCode:'',requestedDate:'',hardDeadline:false,artworkStatus:'',notes:''});
 const set=(key:keyof typeof brief,value:string|boolean)=>setBrief(old=>({...old,[key]:value}));
 return <main className="container cart-page">
  <Link className="back-link" href="/"><ChevronLeft size={15}/> Keep exploring</Link>
  <div className="page-heading"><div><span className="eyebrow">ONE PROJECT. ALL THE POSSIBILITIES.</span><h1>Your quote cart.</h1><p>Choose your products and tell us what the project needs.</p></div><span className="soft-badge"><ShoppingBag size={15}/>{lines.length} configured item{lines.length===1?'':'s'}</span></div>
  {!signedIn?<div className="empty-state"><UserRound size={32}/><h2>Save your project with a sign in.</h2><p>Your quote cart stays connected to your account and artwork.</p><button className="button primary" onClick={onSignIn}>Sign in <ArrowRight size={16}/></button></div>:!lines.length?<div className="empty-state"><ShoppingBag size={35}/><h2>Room for your next big idea.</h2><p>Choose a product and add its exact options to your quote cart.</p><Link href="/" className="button primary">Find your canvas <ArrowRight size={16}/></Link></div>:<form className="cart-layout" onSubmit={e=>{e.preventDefault();void onSubmit(brief);}}>
   <section className="cart-items" aria-label="Configured products and project brief">
    {lines.map((line,i)=>{const p=products.find(p=>p.id===line.productId),variant=p?.variants.find(v=>v.id===line.variantId);return <article className="cart-item" key={`${line.productId}-${line.variantId}-${i}`}>
     <div className="cart-item-image">{p&&<ProductVisual product={p} variant={variant}/>}</div>
     <div className="cart-item-info"><span className="eyebrow">{p?.brand??p?.category}</span><Link href={`/products/${line.productId}`}><h2>{p?.title??'Configured product'}</h2></Link><p>{variant?.color}{variant?.size?` · ${variant.size}`:''} · {label(line.method)} · {label(line.location)}</p>
      {line.notes&&<p className="requested-detail">Requested details: {line.notes}</p>}
      {line.specifications&&<p className="requested-detail">{Object.entries(line.specifications).map(([key,value])=>`${label(key)}: ${value}`).join(' · ')}</p>}
      {line.storeId&&<small className="store-context"><ShieldCheck size={13}/>{stores.find(s=>s.id===line.storeId)?.title??'Store program'} · Final budget check at reviewed quote acceptance</small>}
      {line.designVersionId&&<small className="success-inline"><Palette size={13}/> Saved design revision attached</small>}
      <div className="cart-item-bottom"><label>Qty<input type="number" min={p?.minimumQuantity??1} max={100000} defaultValue={line.quantity} key={line.quantity} disabled={busy} onBlur={e=>{const quantity=Number(e.target.value);if(quantity===line.quantity)return;if(!Number.isInteger(quantity)||quantity<(p?.minimumQuantity??1)){e.target.value=String(line.quantity);return;}void onUpdate(lines.map((x,j)=>i===j?{...x,quantity}:x));}}/></label><span>Pricing and availability need review</span></div>
     </div><button type="button" className="icon-button remove-item" aria-label={`Remove ${p?.title??'product'} from quote cart`} disabled={busy} onClick={()=>void onUpdate(lines.filter((_,j)=>i!==j))}><Trash2 size={18}/></button>
    </article>;})}
    <Link className="text-button" href="/"><Plus size={16}/> Add another product or size</Link>
    <fieldset className="project-brief" disabled={busy}>
     <legend>Tell us about your project</legend><p>These details help us prepare a quote for the right quantities, artwork and destination.</p>
     <div className="brief-fields">
      <label>Project name<input value={brief.projectName} required maxLength={200} onChange={e=>set('projectName',e.target.value)}/></label>
      <label>Company or organization<input value={brief.company} maxLength={200} autoComplete="organization" onChange={e=>set('company',e.target.value)}/></label>
      <label>Contact name<input value={brief.contactName} maxLength={150} autoComplete="name" onChange={e=>set('contactName',e.target.value)}/></label>
      <label>Phone (optional)<input type="tel" value={brief.phone} maxLength={50} autoComplete="tel" onChange={e=>set('phone',e.target.value)}/></label>
      <label>Delivery country<select value={brief.deliveryCountry} onChange={e=>set('deliveryCountry',e.target.value)}><option value="US">United States</option><option value="CA">Canada</option><option value="GB">United Kingdom</option><option value="AU">Australia</option><option value="NZ">New Zealand</option></select></label>
      <label>Delivery ZIP or postal code<input required value={brief.deliveryPostalCode} maxLength={20} pattern="[A-Za-z0-9 \-]+" autoComplete="postal-code" onChange={e=>set('deliveryPostalCode',e.target.value)}/></label>
      <label>Requested delivery date (optional)<input type="date" value={brief.requestedDate} min={new Date().toISOString().slice(0,10)} onChange={e=>set('requestedDate',e.target.value)}/></label>
      <label>Artwork preparation<select required value={brief.artworkStatus} onChange={e=>set('artworkStatus',e.target.value)}><option value="">Choose an option</option><option value="READY">I have artwork ready</option><option value="NEED_HELP">I need design help</option><option value="LATER">I will provide artwork later</option><option value="NOT_REQUIRED">No decoration needed</option></select></label>
     </div>
     <label className="checkbox-label"><input type="checkbox" checked={brief.hardDeadline} onChange={e=>set('hardDeadline',e.target.checked)}/> This date is a firm event deadline.</label>
     <label>Project notes<textarea rows={4} value={brief.notes} maxLength={4000} placeholder="Tell us about packaging, split shipments, color matching or anything else we should review." onChange={e=>set('notes',e.target.value)}/></label>
     <p className="fine-print">Your requested date and options will be reviewed before a delivery commitment is made.</p>
    </fieldset>
   </section>
   <aside className="cart-summary"><span className="eyebrow">YOUR CONNECTED PROJECT</span><h2>Let’s make it happen.</h2><div className="summary-count"><span>Configured items</span><strong>{lines.length}</strong></div><div className="summary-count"><span>Total units</span><strong>{lines.reduce((sum,line)=>sum+line.quantity,0)}</strong></div><div className="cart-total"><span>Pricing</span><strong>By reviewed quote</strong></div><p>We’ll review the exact options, artwork, stock, delivery and costs before issuing a quote.</p><div className="info-box"><ShieldCheck size={20}/><span>No charge or supplier purchase occurs when you submit this request.</span></div><button className="button primary full" type="submit" disabled={busy}>{busy?<Loader2 className="spin" size={17}/>:'Submit quote request'}<ArrowRight size={17}/></button><small className="fine-print">Request {cart?.id.slice(0,8)} · Saved to your private account.</small></aside>
  </form>}
 </main>;
}
