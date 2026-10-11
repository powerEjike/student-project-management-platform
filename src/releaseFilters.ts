import {todayInLagos} from './workflow.ts';
export type ReleaseFilters={state:string;search:string;from:string;to:string};
type ReleaseRecord={id:string;projectId:string;studentName:string;reason:string;note:string;state:string;createdAt?:{toDate?:()=>Date;seconds?:number}};
export function filterReleaseRequests<T extends ReleaseRecord>(rows:T[],names:Map<string,string>,filters:ReleaseFilters){
 if(filters.from&&filters.to&&filters.from>filters.to)return [];
 const words=filters.search.normalize('NFC').toLowerCase().trim().split(/\s+/).filter(Boolean);
 const time=(r:T)=>r.createdAt?.seconds??(r.createdAt?.toDate?.().getTime()??0)/1000;
 return rows.filter(r=>{
  if(filters.state==='Open'&&!['Pending','Withheld'].includes(r.state)||filters.state&&filters.state!=='Open'&&r.state!==filters.state)return false;
  const date=r.createdAt?.toDate?.();const day=date&&!Number.isNaN(date.getTime())?todayInLagos(date):'';
  if((filters.from||filters.to)&&(!day||filters.from&&day<filters.from||filters.to&&day>filters.to))return false;
  const text=[names.get(r.projectId)||r.studentName,r.reason,r.note].join(' ').normalize('NFC').toLowerCase();return words.every(word=>text.includes(word));
 }).sort((a,b)=>time(b)-time(a)||a.id.localeCompare(b.id));
}
