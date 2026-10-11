import type {Lecturer,Project} from './models';
import {overdue} from './workflow.ts';
export function supervisorWorkloads(projects:Project[],lecturers:Lecturer[],today:string){
 const rows=new Map(lecturers.map(l=>[l.id,{...l,inDirectory:true,active:0,co:0,overdue:0,pending:0,defence:0,completed:0,withheld:0}]));
 for(const p of projects){
  for(const [id,name] of [[p.supervisorId,p.supervisorName],[p.coSupervisorId,p.coSupervisorName]])if(id&&!rows.has(id))rows.set(id,{id,displayName:name||'Previously assigned lecturer',inDirectory:false,active:0,co:0,overdue:0,pending:0,defence:0,completed:0,withheld:0});
  const row=rows.get(p.supervisorId);if(!row)continue;
  if(p.completedDate){row.completed++;continue;}
  if(p.releaseState==='Withheld'){row.withheld++;continue;}
  row.active++;if(p.releaseState==='Pending')row.pending++;
  if(p.defenceCleared)row.defence++;
  if(Object.values(p.milestones||{}).some(m=>overdue(m,today)))row.overdue++;
  if(p.coSupervisorId&&p.coSupervisorId!==p.supervisorId)rows.get(p.coSupervisorId)!.co++;
 }
 return [...rows.values()].sort((a,b)=>b.active-a.active||a.displayName.localeCompare(b.displayName));
}
