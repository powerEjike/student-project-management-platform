import type{Project,Student}from'./models';import{hasStudentFolder}from'./studentFolder.ts';import{validCompletionDate}from'./completion.ts';
export type HodFilter='all'|'unassigned'|'folder'|'topic'|'overdue'|'ready'|'active'|'paused'|'archived';
export function hodMatches(project:Project|undefined,filter:HodFilter,today:string){
 if(filter==='all')return true;if(filter==='unassigned')return !project;if(!project)return false;
 const archived=!!project.completedDate,paused=!archived&&['Pending','Withheld'].includes(project.releaseState||''),active=!archived&&!paused;
 if(filter==='archived')return archived;if(filter==='paused')return paused;
 if(filter==='ready'){try{return !archived&&project.releaseState!=='Withheld'&&!!project.defenceCleared&&!!project.defenceDate?.toDate&&!Number.isNaN(project.defenceDate.toDate().getTime());}catch{return false;}}
 if(!active||project.defenceCleared)return false;
 if(filter==='folder')return !hasStudentFolder(project);
 if(filter==='topic')return hasStudentFolder(project)&&project.topicDecision!=='Approved';
 if(filter==='active')return hasStudentFolder(project)&&project.topicDecision==='Approved';
 return Object.values(project.milestones||{}).some(m=>m.status!=='Completed'&&validCompletionDate(m.dueDate,today)&&m.dueDate<today);
}
export function hodOverview(students:Student[],projects:Project[],today:string){const map=new Map(projects.map(p=>[p.studentId,p]));return Object.fromEntries((['unassigned','folder','overdue','ready']as const).map(key=>[key,students.filter(s=>hodMatches(map.get(s.id),key,today)).length]))as Record<'unassigned'|'folder'|'overdue'|'ready',number>;}
export function hodSearch(student:Student,project:Project|undefined,query:string){const text=[student.name,student.matricNumber,project?.title||'',project?.supervisorName||''].join(' ').normalize('NFC').toLowerCase();return query.normalize('NFC').toLowerCase().trim().split(/\s+/).filter(Boolean).every(word=>text.includes(word));}

export function hodProgress(project:Project|undefined){
 const stages=Object.entries(project?.milestones||{}).sort(([a],[b])=>Number(a.slice(1))-Number(b.slice(1))).map(([,stage])=>stage);
 const complete=stages.filter(stage=>stage.status==='Completed').length;
 const paused=!!project?.completedDate||!!project?.defenceCleared||['Pending','Withheld'].includes(project?.releaseState||'');
 const next=paused?undefined:stages.find(stage=>stage.status!=='Completed');
 let updated='';try{const date=project?.lastSupervisorUpdateAt?.toDate();if(date&&!Number.isNaN(date.getTime()))updated=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'short',year:'numeric'}).format(date);}catch{}
 return {stages,complete,next,updated};
}
