import type{Student,Project,Lecturer}from'./models';
import{supervisorWorkloads}from'./workloads.ts';
import{hodMatches}from'./hodOverview.ts';
export function hodWorkloadSummary(students:Student[],projects:Project[],lecturers:Lecturer[],session:string,today:string){
 const cohort=students.filter(s=>!session||s.session===session),ids=new Set(cohort.map(s=>s.id));
 const scoped=projects.filter(p=>ids.has(p.studentId));const assigned=new Set(scoped.map(p=>p.studentId));
 const rows=supervisorWorkloads(scoped,lecturers,today).map(row=>({...row,folder:scoped.filter(p=>p.supervisorId===row.id&&hodMatches(p,'folder',today)).length,overdue:scoped.filter(p=>p.supervisorId===row.id&&hodMatches(p,'overdue',today)).length,defence:scoped.filter(p=>p.supervisorId===row.id&&hodMatches(p,'ready',today)).length})).sort((a,b)=>Number(b.inDirectory)-Number(a.inDirectory)||a.active-b.active||a.displayName.localeCompare(b.displayName));
 const current=rows.filter(row=>row.inDirectory),loads=current.map(row=>row.active);
 return{rows,unassigned:cohort.filter(s=>!assigned.has(s.id)).length,lecturers:current.length,minimum:loads.length?Math.min(...loads):0,maximum:loads.length?Math.max(...loads):0};
}
