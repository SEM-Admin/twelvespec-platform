'use client';
import type {Data} from './types';

export function LineSpecifications({category,notes,onNotes,specifications,onSpecifications}:{category:string;notes:string;onNotes:(value:string)=>void;specifications:Data;onSpecifications:(value:Data)=>void}){
 const set=(key:string,value:string)=>onSpecifications({...specifications,[key]:value});
 const isPrint=['PRINT','SIGNAGE','PACKAGING','EVENT'].includes(category);
 return <details className="line-specifications"><summary>Additional quote specifications</summary><p>Requested details are subject to product and production review.</p>
  <div className="brief-fields">
   {isPrint?<><label>Finished width (mm)<input type="number" min="1" max="100000" value={String(specifications.widthMm??'')} onChange={e=>set('widthMm',e.target.value)}/></label><label>Finished height (mm)<input type="number" min="1" max="100000" value={String(specifications.heightMm??'')} onChange={e=>set('heightMm',e.target.value)}/></label><label>Paper or material<input maxLength={200} value={String(specifications.paperStock??'')} onChange={e=>set('paperStock',e.target.value)}/></label><label>Finish<input maxLength={200} value={String(specifications.finish??'')} onChange={e=>set('finish',e.target.value)}/></label><label>Printed sides<select value={String(specifications.printSides??'')} onChange={e=>set('printSides',e.target.value)}><option value="">To be discussed</option><option value="SINGLE">Single sided</option><option value="DOUBLE">Double sided</option></select></label>{category==='PRINT'&&<label>Page count<input type="number" min="1" max="100000" value={String(specifications.pageCount??'')} onChange={e=>set('pageCount',e.target.value)}/></label>}</>:<label>Requested imprint colors<input type="number" min="1" max="32" value={String(specifications.imprintColors??'')} onChange={e=>set('imprintColors',e.target.value)}/></label>}
  </div><label>Item notes<textarea rows={3} value={notes} maxLength={2000} onChange={e=>onNotes(e.target.value)} placeholder="Specify color matching, decoration details or other requirements."/></label>
 </details>;
}
