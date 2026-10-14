import type {Project,StaffProfile,Student} from './models.ts';
export type ExaminerContext={student:string;registration:string;programme:string;level:string;session:string;department:string;title:string;abstract:string;supervisor:string;coSupervisor:string;preparedBy:string;defenceFinished:string;fileName:string;hash:string;convertedWord:boolean;generated:Date};
export function examinerCopyContext(project:Project,student:Student,profile:StaffProfile,uid:string,department:string,file:{name:string;hash:string;sourceKind:'PDF'|'Word'},confirmed:boolean,generated=new Date()):ExaminerContext{
 if(!profile.active||profile.departmentId!==project.departmentId||!(profile.role==='hod'||profile.role==='lecturer'&&[project.supervisorId,project.coSupervisorId].includes(uid)))throw Error('Only the department HOD or a currently assigned supervisor can prepare this copy.');
 if(project.studentId!==student.id||project.departmentId!==student.departmentId)throw Error('The student record does not match this project. Reopen the project folder.');
 if(project.releaseState==='Withheld'||project.releaseState==='Pending')throw Error('Resolve the supervisor release request before preparing an examiner copy.');
 if(project.topicDecision!=='Approved'||!project.title.trim()||project.status!=='Completed'||(!project.defenceCleared&&!project.completedDate))throw Error('The project needs an approved topic and completed work cleared for defence.');
 if(!confirmed)throw Error('Confirm that the opened document is this student’s final submission.');
 if(!/^[a-f0-9]{64}$/.test(file.hash)||!file.name.trim()||file.name.length>200||!Number.isFinite(generated.getTime()))throw Error('Reopen a valid final document before exporting.');
 return {student:student.name,registration:student.matricNumber,programme:student.programme,level:student.level,session:student.session,department:department.trim()||'Department',title:project.title,abstract:project.abstract||'',supervisor:project.supervisorName,coSupervisor:project.coSupervisorName||'',preparedBy:profile.displayName,defenceFinished:project.completedDate||'',fileName:file.name,hash:file.hash,convertedWord:file.sourceKind==='Word',generated};
}
