import{lowerUndergraduateLevel}from'./projectCohort.ts';
import type{Student,Project,Lecturer}from'./models.ts';
export function balancedAllocation(ids:string[],students:Student[],projects:Project[],lecturers:Lecturer[],participants:string[],departmentId:string,capacities:Record<string,string>={}){
 const issues:string[]=[];const selected=[...new Set(ids)],pool=[...new Set(participants)].sort().map(id=>lecturers.find(l=>l.id===id));
 if(!selected.length||selected.length>1000)issues.push('Select between 1 and 1000 unassigned students.');
 if(!pool.length||pool.some(l=>!l))issues.push('Choose available lecturers for the proposal.');
 const chosen=selected.map(id=>students.find(s=>s.id===id));
 if(chosen.some(s=>s&&lowerUndergraduateLevel(s.level)))issues.push('Project allocation is for final-year students.');
 if(chosen.some(s=>!s||s.departmentId!==departmentId))issues.push('A selected student is unavailable in this department.');
 if(projects.some(p=>selected.includes(p.studentId)))issues.push('Only students without a project folder can use this planner. Use the regular allocation form for changes.');
 const active=projects.filter(p=>p.departmentId===departmentId&&!p.completedDate&&p.releaseState!=='Withheld');
 const workloads=pool.filter((l):l is Lecturer=>!!l).map(l=>({...l,before:active.filter(p=>p.supervisorId===l.id).length,after:active.filter(p=>p.supervisorId===l.id).length,co:active.filter(p=>p.coSupervisorId===l.id).length}));
 const limits=Object.fromEntries(workloads.map(w=>[w.id,capacities[w.id]?.trim()||'']));
 for(const w of workloads){const value=limits[w.id];if(value&&(!/^(0|[1-9]\d{0,3})$/.test(value)||Number(value)>1000))issues.push(`${w.displayName}: enter a maximum from 0 to 1000, or leave it blank.`);}
 if(!issues.length&&workloads.reduce((n,w)=>n+(limits[w.id]===''?selected.length:Math.max(0,Number(limits[w.id])-w.before)),0)<selected.length)issues.push('Not enough capacity for the selected students. Increase the limits or choose more lecturers.');
 const rows:{studentId:string;name:string;matricNumber:string;supervisorId:string;supervisorName:string}[]=[];
 if(!issues.length)for(const s of(chosen as Student[]).slice().sort((a,b)=>a.matricNumber.localeCompare(b.matricNumber)||a.id.localeCompare(b.id))){const next=workloads.filter(w=>limits[w.id]===''||w.after<Number(limits[w.id])).sort((a,b)=>a.after-b.after||a.id.localeCompare(b.id))[0];next.after++;rows.push({studentId:s.id,name:s.name,matricNumber:s.matricNumber,supervisorId:next.id,supervisorName:next.displayName});}
 const fingerprint=JSON.stringify({departmentId,limits,students:chosen.filter(Boolean).map(s=>({id:s!.id,name:s!.name,matricNumber:s!.matricNumber,session:s!.session,programme:s!.programme,level:s!.level,currentCGPA:s!.currentCGPA??null})).sort((a,b)=>a.id.localeCompare(b.id)),pool:workloads.map(w=>({id:w.id,name:w.displayName,before:w.before,co:w.co})),rows});
 return{issues,rows,workloads,fingerprint};
}
