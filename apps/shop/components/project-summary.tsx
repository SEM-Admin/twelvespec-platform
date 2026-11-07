import {record,stringValue} from './types';

export function ProjectSummary({brief:value,assumptions:review}:{brief:unknown;assumptions?:unknown}){
 const brief=record(value),assumptions=record(review);
 if(!Object.keys(brief).length&&!Object.keys(assumptions).length)return null;
 return <div className="customer-project-summary">
  {!!(brief.deliveryPostalCode||brief.requestedDate||brief.artworkStatus)&&<dl><div><dt>Delivery destination</dt><dd>{[brief.deliveryPostalCode,brief.deliveryCountry].filter(Boolean).join(', ')||'To be confirmed'}</dd></div><div><dt>Requested date</dt><dd>{stringValue(brief.requestedDate,'To be discussed')}{brief.hardDeadline===true?' · Firm deadline requested':''}</dd></div><div><dt>Artwork</dt><dd>{stringValue(brief.artworkStatus,'To be discussed').replaceAll('_',' ').toLowerCase()}</dd></div></dl>}
  {!!brief.notes&&<p>{stringValue(brief.notes)}</p>}{!!assumptions.deliveryNote&&<p><strong>Reviewed scope:</strong> {stringValue(assumptions.deliveryNote)}</p>}{!!assumptions.taxNote&&<p>{stringValue(assumptions.taxNote)}</p>}
 </div>;
}

export function RequestLineSummary({lines}:{lines:unknown}){
 if(!Array.isArray(lines))return null;
 return <div className="request-product-summary">{lines.map((value,i)=>{const line=record(value);return <div key={i}><strong>{stringValue(line.title,'Configured product')} × {stringValue(line.quantity)}</strong><small>{[line.color,line.size,line.method,line.location].filter(Boolean).map(value=>String(value).replaceAll('_',' ')).join(' · ')}</small>{!!line.notes&&<p>{stringValue(line.notes)}</p>}</div>;})}</div>;
}
