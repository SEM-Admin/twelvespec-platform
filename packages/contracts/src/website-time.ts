/** Calendar time conversion with explicit DST ambiguity; no server timezone assumptions. */
export function websiteTimeChoices(local:string,timeZone:string):{iso:string;offsetMinutes:number;label:string}[]{
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(local))throw new Error('WEBSITE_LOCAL_TIME_INVALID');
 let formatter:Intl.DateTimeFormat;try{formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});}catch{throw new Error('WEBSITE_TIMEZONE_INVALID');}
 const values=local.match(/\d+/g)!.map(Number),wall=Date.UTC(values[0],values[1]-1,values[2],values[3],values[4]);const choices=[];
 for(let offset=-14*60;offset<=14*60;offset+=15){
  const candidate=new Date(wall-offset*60000);const parts=Object.fromEntries(formatter.formatToParts(candidate).map(p=>[p.type,p.value]));
  if(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`===local)choices.push({iso:candidate.toISOString(),offsetMinutes:offset,label:`UTC${offset<0?'-':'+'}${String(Math.floor(Math.abs(offset)/60)).padStart(2,'0')}:${String(Math.abs(offset)%60).padStart(2,'0')}`});
 }
 return choices.sort((a,b)=>a.iso.localeCompare(b.iso));
}
