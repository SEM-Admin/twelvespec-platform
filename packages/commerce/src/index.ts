import {type Actor,type Tx,type Input,authorize,create,get,list,update,event,idempotent,fail,text} from '../../kernel/src/index';
import {normalizeQuoteBrief,briefMissingFields} from './brief';
import {safeLines,validateLine,quoteLineSnapshot,publicOrder} from '../../sales/src/index';
export async function handleCommerce(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'commerce',action);
 if(action==='create'){
  const lines=safeLines(input.lines);for(const l of lines)await validateLine(tx,a,l);
  const row=await create(tx,a,'carts',{title:input.title?text(input.title):'Your quote cart',status:'DRAFT',data:{lines,currency:'USD',quoteFirst:true}});await event(tx,a,'cart.created',row.id);return row;
 }
 if(action==='update'){
  const cart=await get(tx,a,'carts',input.id,true);if(cart.owner_id!==a.userId&&a.role==='customer')fail('NOT_FOUND',404);if(cart.status!=='DRAFT')fail('CART_NOT_EDITABLE');
  const lines=safeLines(input.lines);for(const line of lines)await validateLine(tx,a,line);
  const row=await update(tx,a,'carts',cart.id,{data:{...cart.data,lines}});await event(tx,a,'cart.updated',cart.id);return row;
 }
 if(action==='archive'){
  const cart=await get(tx,a,'carts',input.id,true);if(cart.owner_id!==a.userId&&a.role==='customer')fail('NOT_FOUND',404);if(cart.status!=='DRAFT')fail('CART_NOT_EDITABLE');const row=await update(tx,a,'carts',cart.id,{status:'ARCHIVED'});await event(tx,a,'cart.archived',cart.id);return row;
 }
 if(action==='submit_request')return idempotent(tx,a,'request.submit',input.key,{id:input.id,brief:input.brief??null,note:input.note??''},async()=>{
  const cart=await get(tx,a,'carts',input.id,true);if(cart.owner_id!==a.userId&&a.role==='customer')fail('NOT_FOUND',404);if(cart.status!=='DRAFT')fail('CART_ALREADY_SUBMITTED');
  const lines=safeLines(cart.data.lines),snapshots=[];for(const line of lines)snapshots.push(await quoteLineSnapshot(tx,a,line));
  const brief=normalizeQuoteBrief(input.brief,cart.title),missingFields=briefMissingFields(brief);
  const request=await create(tx,a,'requests',{title:String(brief.projectName),status:'NEW',owner_id:cart.owner_id,cart_id:cart.id,data:{lines,lineSnapshots:snapshots,brief,intakeReview:{status:missingFields.length?'NEEDS_DETAILS':'READY_FOR_REVIEW',missingFields},cartId:cart.id,customerId:cart.owner_id,note:input.note?text(input.note,2000):'',currency:'USD',submittedAt:new Date().toISOString()}});
  for(let i=0;i<lines.length;i++)await create(tx,a,'request_lines',{title:String(snapshots[i].title),status:'SUBMITTED',owner_id:cart.owner_id,request_id:request.id,product_id:lines[i].productId,...(lines[i].variantId?{variant_id:lines[i].variantId}:{}),data:{...lines[i],snapshot:snapshots[i],lineNumber:i+1}});
  await update(tx,a,'carts',cart.id,{status:'SUBMITTED'});await event(tx,a,'request.submitted',request.id,{cartId:cart.id,lineCount:lines.length,needsDetails:missingFields.length>0});return request;
 });
 if(action==='reorder')return idempotent(tx,a,'order.reorder',input.key,{id:input.id},async()=>{
  const order=await get(tx,a,'orders',input.id);if(a.role==='customer'&&order.owner_id!==a.userId)fail('NOT_FOUND',404);const lines=safeLines(order.data.lines);for(const line of lines)await validateLine(tx,a,line);
  const cart=await create(tx,a,'carts',{title:'Reorder · '+order.title,owner_id:a.userId,data:{lines,currency:'USD',previousOrderId:order.id,quoteFirst:true,requiresRepricing:true}});await event(tx,a,'order.reorder_requested',order.id,{cartId:cart.id});return cart;
 });
 if(action==='read')return (await list(tx,a,'orders')).filter(x=>a.role!=='customer'||x.owner_id===a.userId).map(publicOrder);
 return fail('UNSUPPORTED_ACTION',400);
}
