import {validAcademicSession,type RegistrationSession} from './academicSession.ts';
import {programmeKey,templateIdFor,type TemplateStep} from './workflow.ts';
import type {DirectoryStaff,AdminDepartment} from './adminDirectory.ts';
export type SetupDestination='staff'|'sessions'|'templates';
export type SetupDepartment=AdminDepartment&{programme?:string};
export type SetupTemplate={id:string;departmentId:string;programme:string;steps:TemplateStep[]};
export function departmentReadiness(department:SetupDepartment,directory:DirectoryStaff[],sessions:RegistrationSession[],templates:SetupTemplate[]){
 const members=directory.filter(s=>s.active&&s.departmentId===department.id),hods=members.filter(s=>s.role==='hod'),lecturers=members.filter(s=>s.role==='lecturer').length;
 const programme=typeof department.programme==='string'?department.programme.trim():'',session=sessions.find(s=>s.id===department.id);
 const hasProgramme=!!programmeKey(programme)&&programme.length<=80;
 const template=hasProgramme?templates.find(t=>t.id===templateIdFor(department.id,programme)&&t.departmentId===department.id&&typeof t.programme==='string'&&programmeKey(t.programme)===programmeKey(programme)):undefined;
 const templateReady=!!template&&Array.isArray(template.steps)&&template.steps.length>=1&&template.steps.length<=10&&template.steps.every(s=>s&&typeof s.name==='string'&&s.name.trim().length>0&&s.name.length<=100&&Number.isInteger(s.days)&&s.days>=0&&s.days<=730);
 const checks:{id:string;label:string;done:boolean;destination:SetupDestination}[]=[
  {id:'hod',label:'HOD assigned',done:hods.length>0,destination:'staff'},
  {id:'lecturers',label:`${lecturers} active lecturer${lecturers===1?'':'s'} (five suggested)`,done:lecturers>0,destination:'staff'},
  {id:'programme',label:hasProgramme?programme:'Default programme',done:hasProgramme,destination:'staff'},
  {id:'session',label:session&&typeof session.session==='string'&&validAcademicSession(session.session)&&session.departmentName===department.name?`Academic session ${session.session}`:'Current academic session',done:!!session&&typeof session.session==='string'&&validAcademicSession(session.session)&&session.departmentName===department.name,destination:'sessions'},
  {id:'template',label:'Programme milestone template',done:templateReady,destination:'templates'}
 ];
 return{checks,completed:checks.filter(c=>c.done).length,next:checks.find(c=>!c.done),lecturers};
}
