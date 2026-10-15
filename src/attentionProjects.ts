import type {Project,Student} from './models';
import {freshnessEligible,progressAge} from './progressFreshness.ts';
export function attentionProjects(projects:Project[],students:Student[],today:string,threshold:number,escalationDays=7){
 const studentMap=new Map(students.map(s=>[s.id,s]));
 return projects.flatMap(project=>{const student=studentMap.get(project.studentId);const age=progressAge(project,today);return student&&freshnessEligible(project)&&age!==null&&age>=threshold+escalationDays?[{project,student,age}]:[];}).sort((a,b)=>b.age-a.age||a.student.name.localeCompare(b.student.name)||a.project.id.localeCompare(b.project.id));
}
