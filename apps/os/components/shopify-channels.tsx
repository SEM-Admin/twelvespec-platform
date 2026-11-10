'use client';
import {useState} from 'react';
import {ArrowRight,Link2,ShieldCheck} from 'lucide-react';
import {SHOPIFY_API_VERSION,SHOPIFY_ACTIVATION_REQUIREMENTS} from '../../../packages/contracts/src/shopify';
import {asString,key,type Data,type Row} from './types';

export function ShopifyChannels({connections,run}:{connections:Row[];run:(action:string,input?:Data)=>Promise<unknown>}){
 const [name,setName]=useState('Shopify development channel'),[domain,setDomain]=useState('twelvespec-example.myshopify.com'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const channels=connections.filter(c=>c.data.providerType==='SHOPIFY');
 async function execute(action:string,input:Data){setBusy(true);setError('');setNotice('');try{const result=await run(action,input);setNotice(action==='create_connection'?'Shopify development channel saved. No store contacted.':action==='shopify_demo_import'?'Synthetic Shopify records staged privately. Open Products to review them; no products published.':action==='disable'?'Channel disabled.':'Mock capability check saved. No Shopify store contacted.');return result;}catch(e){setError(e instanceof Error?e.message:'The channel action failed.');}finally{setBusy(false);}}
 return <section className="owned-catalog" aria-label="Shopify sales channels">
  <div className="workbench-heading"><div><span className="eyebrow">OPTIONAL SALES CHANNEL</span><h2>Shopify, on your terms.</h2><p>Keep TwelveSpec as your catalog and operations workspace. Prepare a separate Shopify connection for each merchant.</p></div><span className="badge neutral"><ShieldCheck size={14}/>Development preview</span></div>
  <p className="workbench-note">This preview uses synthetic products and makes no Shopify requests. The read-only adapter uses Admin GraphQL {SHOPIFY_API_VERSION}. Real installations, product publishing, order imports, payments and fulfillment updates are unavailable.</p>
  {error&&<p className="alert error" role="alert">{error}</p>}{notice&&<p className="alert" role="status">{notice}</p>}
  <form onSubmit={e=>{e.preventDefault();void execute('create_connection',{providerType:'SHOPIFY',displayName:name,shopDomain:domain,environment:'mock'});}}>
   <fieldset disabled={busy} style={{border:0,padding:0,margin:0}}><div className="workbench-form-row"><label>Shopify channel name<input required maxLength={200} value={name} onChange={e=>setName(e.target.value)}/></label><label>Shopify store domain<input required maxLength={80} value={domain} placeholder="your-store.myshopify.com" onChange={e=>setDomain(e.target.value)}/></label></div><button className="button secondary" type="submit"><Link2 size={16}/>Save Shopify development channel</button></fieldset>
  </form>
  <div className="connections-grid">{channels.map(c=><article className="connection-card" key={c.id}><h3>{c.title}</h3><p>{asString(c.data.shopDomain)}</p><span className="badge neutral">{c.status==='DISABLED'?'Disabled':c.data.verification==='MOCKED'?'Mocked · no store connection':'Installation required'}</span><p>Catalog reads only. Shopify selling prices are never supplier costs.</p><div className="row-actions"><button className="button secondary compact" disabled={busy||c.status==='DISABLED'} onClick={()=>void execute('test_connection',{id:c.id})}>Test demo capabilities</button><button className="button secondary compact" disabled={busy||c.status==='DISABLED'} onClick={()=>void execute('shopify_demo_import',{id:c.id,idempotencyKey:key()})}>Stage Shopify demo products<ArrowRight size={14}/></button><button className="text-button" disabled={busy||c.status==='DISABLED'} onClick={()=>void execute('disable',{id:c.id})}>Disable channel</button></div></article>)}</div>
  <details className="source-facts"><summary>Requirements before connecting a real Shopify store</summary><ul>{SHOPIFY_ACTIVATION_REQUIREMENTS.map(requirement=><li key={requirement}>{requirement}</li>)}</ul><p>Importing a real catalog does not grant photo reuse rights or establish supplier costs, stock or production requirements. Future order workflows also need customer-data authorization and duplicate-order protection.</p></details>
 </section>;
}
