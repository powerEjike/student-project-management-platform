import type {Lecturer,Project} from './models';
import {freshnessEligible,progressAge} from './progressFreshness.ts';
export function updateCurrency(projects:Project[],lecturers:Lecturer[],today:string,threshold:number){
 const rows=new Map(lecturers.map(l=>[l.id,{...l,total:0,recent:0,stale:0,unknown:0}]));
 for(const p of projects){
  if(!freshnessEligible(p))continue;
  if(!rows.has(p.supervisorId))rows.set(p.supervisorId,{id:p.supervisorId,displayName:p.supervisorName||'Previously assigned lecturer',total:0,recent:0,stale:0,unknown:0});
  const row=rows.get(p.supervisorId)!;row.total++;const age=progressAge(p,today);
  if(age===null)row.unknown++;else if(age<threshold)row.recent++;else row.stale++;
 }
 return [...rows.values()].map(r=>({...r,percent:r.total?Math.round(r.recent/r.total*100):null})).sort((a,b)=>a.displayName.localeCompare(b.displayName)||a.id.localeCompare(b.id));
}
