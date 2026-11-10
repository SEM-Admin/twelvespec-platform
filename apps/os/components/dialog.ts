'use client';
import {useEffect} from 'react';
export function useDialogKeyboard(onClose:()=>void){
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const dialog=document.querySelector<HTMLElement>('[role="dialog"]');
  const focusable=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')??[]).filter(e=>e.getClientRects().length>0);
  const initial=focusable()[0];initial?.focus();
  const keydown=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();onClose();}
   if(e.key==='Tab'){
    const items=focusable(),first=items[0],last=items.at(-1);
    if(!first){e.preventDefault();return;}
    if(e.shiftKey&&(document.activeElement===first||!dialog?.contains(document.activeElement))){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||!dialog?.contains(document.activeElement))){e.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',keydown);
  return()=>{document.removeEventListener('keydown',keydown);previous?.focus();};
 },[onClose]);
}
