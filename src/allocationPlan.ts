import type {Student,Project,Lecturer} from './models';
export function allocationPlan(selected:string[],students:Student[],projects:Project[],lecturers:Lecturer[],supervisorId:string,coSupervisorId:string){
 const byStudent=new Map(projects.map(p=>[p.studentId,p]));const byId=new Map(students.map(s=>[s.id,s]));
 const issues:string[]=[];
 if(!lecturers.some(l=>l.id===supervisorId))issues.push('Choose an active supervisor.');
 if(coSupervisorId&&!lecturers.some(l=>l.id===coSupervisorId))issues.push('Choose an active co-supervisor.');
 if(supervisorId&&supervisorId===coSupervisorId)issues.push('Supervisor and co-supervisor must be different.');
 const rows=[...new Set(selected)].map(id=>{const student=byId.get(id);const project=byStudent.get(id);
  const blocked=!student?'Student record unavailable':project?.completedDate?'Completed project':project?.releaseState==='Pending'?'Release decision pending':project?.releaseState==='Withheld'?'Withheld project':'';
  const unchanged=!!project&&project.supervisorId===supervisorId&&project.coSupervisorId===coSupervisorId;
  return {id,name:student?.name||'Unavailable student',matricNumber:student?.matricNumber||'',previousSupervisor:project?.supervisorName||'Unassigned',previousCo:project?.coSupervisorName||'',action:blocked|| (unchanged?'Unchanged':project?'Reassign':'First allocation'),blocked,unchanged};
 });
 if(!rows.length)issues.push('Select at least one student.');
 if(rows.some(r=>r.blocked))issues.push('Remove unavailable, completed, pending-release or withheld students before allocating.');
 const changed=rows.filter(r=>!r.blocked&&!r.unchanged);
 if(rows.length&&!changed.length&&!rows.some(r=>r.blocked))issues.push('The selected students already have this allocation.');
 const active=projects.filter(p=>!p.completedDate&&p.releaseState!=='Withheld');
 const after=active.map(p=>changed.some(r=>r.id===p.studentId)?{...p,supervisorId,coSupervisorId}:p);
 for(const r of changed)if(!byStudent.has(r.id))after.push({studentId:r.id,supervisorId,coSupervisorId} as Project);
 const workloads=[supervisorId,coSupervisorId].filter(Boolean).filter((id,i,ids)=>ids.indexOf(id)===i).map(id=>({id,name:lecturers.find(l=>l.id===id)?.displayName||'Unavailable lecturer',primaryBefore:active.filter(p=>p.supervisorId===id).length,primaryAfter:after.filter(p=>p.supervisorId===id).length,coBefore:active.filter(p=>p.coSupervisorId===id).length,coAfter:after.filter(p=>p.coSupervisorId===id).length}));
 return {rows,workloads,issues,changeIds:changed.map(r=>r.id),unchanged:rows.filter(r=>r.unchanged&&!r.blocked).length};
}
