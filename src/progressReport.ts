import type {Student,Project} from './models';
import {overdueCount} from './projectSummary.ts';
import {progressAge} from './progressFreshness.ts';
export const progressColumns=['Student name','Registration number','Programme','Level','Current session','Admission session','Supervisor','Co-supervisor','Project title','Project status','Topic decision','Milestones completed','Milestones total','Overdue milestones','Days since topic/progress update','Defence clearance date','Completion date'];
export function progressRows(students:Student[],projects:Project[],today:string){
 const byStudent=new Map(projects.map(p=>[p.studentId,p]));
 return students.map(s=>{const p=byStudent.get(s.id);const milestones=Object.values(p?.milestones||{});const age=p?progressAge(p,today):null;
  const status=!p?'Awaiting allocation':p.completedDate?'Completed':p.releaseState==='Withheld'?'Withheld':p.releaseState==='Pending'?'Release requested':p.defenceCleared?'Ready for defence':p.status;
  return [s.name,s.matricNumber,s.programme,s.level,s.session,s.admissionSession||'Not recorded',p?.supervisorName||'Unassigned',p?.coSupervisorName||'',p?.title||'',status,p?.topicDecision||'Awaiting topic',milestones.filter(m=>m.status==='Completed').length,milestones.length,p?overdueCount(p,today):0,age??'Not recorded',p?.defenceCleared&&p.defenceDate?.toDate?new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(p.defenceDate.toDate()):'',p?.completedDate||''];
 });
}
