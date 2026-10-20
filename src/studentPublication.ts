import type{Project,Student}from'./models';
export function studentPublication(project:Project,student:Student,feedback:string){
 if(project.studentId!==student.id||project.departmentId!==student.departmentId)throw Error('Student and project do not match.');
 if(feedback.trim().length>4000)throw Error('Student feedback must be at most 4,000 characters.');
 const entries=Object.entries(project.milestones||{}).sort(([a],[b])=>Number(a.slice(1))-Number(b.slice(1)));
 if(entries.length>10||entries.some(([key],i)=>key!==`m${i}`))throw Error('This project needs a standard progress template before publication.');
 return {studentId:student.id,departmentId:student.departmentId,name:student.name,matricNumber:student.matricNumber,session:student.session,programme:student.programme,supervisorName:project.supervisorName,topic:project.title,topicDecision:project.topicDecision||'',projectStatus:project.completedDate?'Archived':project.defenceCleared?'Completed — ready for defence':project.status,stages:entries.map(([,m])=>({name:m.name,status:m.status,dueDate:m.dueDate})),feedback:feedback.trim()};
}
export type StudentPublication=ReturnType<typeof studentPublication>&{publishedAt?:{seconds:number;nanoseconds:number;toDate:()=>Date};publishedBy:string};
