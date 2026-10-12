import {todayInLagos} from './workflow.ts';
type Update={id:string;kind:string;actorName?:string;decision?:string;note?:string;current?:{name?:string;status?:string;note?:string};createdAt?:{toDate?:()=>Date;seconds?:number;nanoseconds?:number}};
export type WorkflowHistoryFilters={kind:string;search:string;from:string;to:string};
export function filterWorkflowHistory<T extends Update>(rows:T[],filters:WorkflowHistoryFilters):T[]{
 if(filters.from&&filters.to&&filters.from>filters.to)return [];
 const words=filters.search.normalize('NFC').toLowerCase().trim().split(/\s+/).filter(Boolean);
 const time=(row:T)=>row.createdAt?.seconds??(row.createdAt?.toDate?.().getTime()??0)/1000;
 return rows.filter(row=>{
  if(filters.kind&&row.kind!==filters.kind)return false;
  const date=row.createdAt?.toDate?.();const day=date&&!Number.isNaN(date.getTime())?todayInLagos(date):'';
  if((filters.from||filters.to)&&(!day||filters.from&&day<filters.from||filters.to&&day>filters.to))return false;
  const text=[row.actorName,row.decision,row.note,row.current?.name,row.current?.status,row.current?.note].filter(Boolean).join(' ').normalize('NFC').toLowerCase();
  return words.every(word=>text.includes(word));
 }).sort((a,b)=>time(b)-time(a)||(b.createdAt?.nanoseconds||0)-(a.createdAt?.nanoseconds||0)||`${a.kind}-${a.id}`.localeCompare(`${b.kind}-${b.id}`));
}
