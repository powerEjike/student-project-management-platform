import type{Student,Project,Lecturer}from'./models.ts';
export function balancedAllocation(ids:string[],students:Student[],projects:Project[],lecturers:Lecturer[],participants:string[],departmentId:string){
 const issues:string[]=[];const selected=[...new Set(ids)],pool=[...new Set(participants)].sort().map(id=>lecturers.find(l=>l.id===id));
 if(!selected.length||selected.length>100)issues.push('Select between 1 and 100 unassigned students.');
 if(!pool.length||pool.some(l=>!l))issues.push('Choose available lecturers for the proposal.');
 const chosen=selected.map(id=>students.find(s=>s.id===id));
 if(chosen.some(s=>!s||s.departmentId!==departmentId))issues.push('A selected student is unavailable in this department.');
 if(projects.some(p=>selected.includes(p.studentId)))issues.push('Only students without a project folder can use this planner. Use the regular allocation form for changes.');
 const active=projects.filter(p=>p.departmentId===departmentId&&!p.completedDate&&p.releaseState!=='Withheld');
 const workloads=pool.filter((l):l is Lecturer=>!!l).map(l=>({...l,before:active.filter(p=>p.supervisorId===l.id).length,after:active.filter(p=>p.supervisorId===l.id).length,co:active.filter(p=>p.coSupervisorId===l.id).length}));
 const rows:{studentId:string;name:string;matricNumber:string;supervisorId:string;supervisorName:string}[]=[];
 if(!issues.length)for(const s of(chosen as Student[]).slice().sort((a,b)=>a.matricNumber.localeCompare(b.matricNumber)||a.id.localeCompare(b.id))){const next=workloads.slice().sort((a,b)=>a.after-b.after||a.id.localeCompare(b.id))[0];next.after++;rows.push({studentId:s.id,name:s.name,matricNumber:s.matricNumber,supervisorId:next.id,supervisorName:next.displayName});}
 const fingerprint=JSON.stringify({departmentId,students:chosen.filter(Boolean).map(s=>({id:s!.id,name:s!.name,matricNumber:s!.matricNumber,session:s!.session,programme:s!.programme,level:s!.level})).sort((a,b)=>a.id.localeCompare(b.id)),pool:workloads.map(w=>({id:w.id,name:w.displayName,before:w.before,co:w.co})),rows});
 return{issues,rows,workloads,fingerprint};
}
