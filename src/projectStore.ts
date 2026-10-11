import {collection,doc,getDoc,onSnapshot,query,runTransaction,serverTimestamp,where,type DocumentData} from 'firebase/firestore';
import {app} from './firebase';
import {getFirestore} from 'firebase/firestore';
import type {StaffProfile,Student,Project,Lecturer} from './models';
const db=getFirestore(app!);
export const canonical=(value:string)=>value.toUpperCase().replace(/[^A-Z0-9]/g,'');
export const studentIdFor=(departmentId:string,session:string,matric:string)=>`${departmentId}__${canonical(session)}__${canonical(matric)}`;
export function watchDepartments(receive:(data:{id:string;name:string}[])=>void,fail:()=>void){return onSnapshot(collection(db,'departments'),s=>receive(s.docs.map(d=>({id:d.id,name:d.data().name}))),fail);}
export function watchStaffDirectory(receive:(data:(StaffProfile&{id:string})[])=>void,fail:()=>void){return onSnapshot(collection(db,'staff'),s=>receive(s.docs.map(d=>({id:d.id,...d.data()} as StaffProfile&{id:string}))),fail);}
export async function updateStaffAssignment(id:string,role:StaffProfile['role'],active:boolean,department:{id:string;name:string}|undefined){
  if(role!=='admin'&&!department)throw new Error('Select a department for this staff account.');
  const {auth}=await import('./firebase');
  await runTransaction(db,async tx=>{
    const ref=doc(db,'staff',id);const before=(await tx.get(ref)).data();if(!before)throw new Error('This staff record no longer exists.');
    const event=doc(collection(db,'staffAccessChanges'));
    const departmentId=role==='admin'?'':department!.id;
    tx.update(ref,{role,active,departmentId,departmentName:role==='admin'?'':department!.name,updatedAt:serverTimestamp(),lastAccessEventId:event.id});
    tx.set(event,{staffId:id,role,active,departmentId,previousRole:before.role,previousActive:before.active,previousDepartmentId:before.departmentId||'',actorId:auth!.currentUser!.uid,createdAt:serverTimestamp()});
  });
}
export async function createDepartment(name:string,uid:string){
  const id=name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!id)throw new Error('Enter a department name using letters and numbers.');
  await runTransaction(db,async tx=>{const ref=doc(db,'departments',id);if((await tx.get(ref)).exists())throw new Error('This department already exists.');tx.set(ref,{name:name.trim(),createdBy:uid,createdAt:serverTimestamp()});});
}
export function watchLecturers(departmentId:string,receive:(data:Lecturer[])=>void,fail:()=>void){return onSnapshot(query(collection(db,'staff'),where('departmentId','==',departmentId),where('role','==','lecturer'),where('active','==',true)),s=>receive(s.docs.map(d=>({id:d.id,displayName:d.data().displayName}))),fail);}
export function watchStudents(departmentId:string,receive:(data:Student[])=>void,fail:()=>void){return onSnapshot(query(collection(db,'students'),where('departmentId','==',departmentId)),s=>receive(s.docs.map(d=>({id:d.id,...d.data()} as Student))),fail);}
export function watchProjects(profile:StaffProfile,uid:string,receive:(data:Project[])=>void,fail:()=>void){
  const base=collection(db,'projects');const department=where('departmentId','==',profile.departmentId);
  if(profile.role==='hod')return onSnapshot(query(base,department),s=>receive(s.docs.map(d=>({id:d.id,...d.data()} as Project))),fail);
  let primary:Project[]=[],co:Project[]=[];
  const merge=()=>receive([...new Map([...primary,...co].map(p=>[p.id,p])).values()]);
  const a=onSnapshot(query(base,department,where('supervisorId','==',uid)),s=>{primary=s.docs.map(d=>({id:d.id,...d.data()} as Project));merge();},fail);
  const b=onSnapshot(query(base,department,where('coSupervisorId','==',uid)),s=>{co=s.docs.map(d=>({id:d.id,...d.data()} as Project));merge();},fail);
  return()=>{a();b();};
}
export async function readStudent(id:string){const s=await getDoc(doc(db,'students',id));return s.exists()?{id:s.id,...s.data()} as Student:null;}
export async function registerSupervisorProject(input:{title:string;name:string;matricNumber:string;session:string},profile:StaffProfile,uid:string){
 if(profile.role!=='lecturer'||!profile.departmentId)throw Error('An active departmental supervisor is required.');
 if(!input.name.trim()||!canonical(input.matricNumber)||!canonical(input.session))throw Error('Enter the student name, registration number and academic session.');
 const id=studentIdFor(profile.departmentId,input.session,input.matricNumber);const studentRef=doc(db,'students',id);const projectRef=doc(db,'projects',id);const eventRef=doc(collection(projectRef,'allocations'));
 await runTransaction(db,async tx=>{if((await tx.get(studentRef)).exists())throw Error('This registration number already exists for that session. Ask the HOD to check its allocation.');
 tx.set(studentRef,{departmentId:profile.departmentId,name:input.name.trim(),matricNumber:input.matricNumber.trim(),matricKey:canonical(input.matricNumber),programme:'BSc Biochemistry',level:'Final year',session:input.session.trim(),email:'',createdBy:uid,createdAt:serverTimestamp()});
 tx.set(projectRef,{departmentId:profile.departmentId,studentId:id,supervisorId:uid,coSupervisorId:'',supervisorName:profile.displayName,coSupervisorName:'',title:input.title.trim(),status:'Awaiting topic',createdBy:uid,createdAt:serverTimestamp(),updatedBy:uid,updatedAt:serverTimestamp(),lastAllocationEventId:eventRef.id});
 tx.set(eventRef,{departmentId:profile.departmentId,studentId:id,supervisorId:uid,coSupervisorId:'',previousSupervisorId:'',previousCoSupervisorId:'',reason:'Supervisor registered student after an archive title check',actorId:uid,createdAt:serverTimestamp()});});
}
export async function addStudent(data:Omit<Student,'id'|'matricKey'>,uid:string){
  const id=studentIdFor(data.departmentId,data.session,data.matricNumber);
  const value={...data,name:data.name.trim(),matricNumber:data.matricNumber.trim(),programme:data.programme.trim(),level:data.level.trim(),session:data.session.trim(),email:data.email.trim(),matricKey:canonical(data.matricNumber),createdBy:uid,createdAt:serverTimestamp()};
  await runTransaction(db,async tx=>{const ref=doc(db,'students',id);if((await tx.get(ref)).exists())throw new Error('This matric number is already registered for that session.');tx.set(ref,value);});
}
export async function allocateStudent(student:Student,supervisorId:string,coSupervisorId:string,reason:string,uid:string){
  if(supervisorId===coSupervisorId)throw new Error('Choose a different co-supervisor.');
  await runTransaction(db,async tx=>{
    const ref=doc(db,'projects',student.id);const existing=await tx.get(ref);const before=existing.exists()?existing.data():null;
    if(before&&['Pending','Withheld'].includes(before.releaseState))throw Error('Decide the release request before changing allocation.');
    if(before&&before.supervisorId===supervisorId&&before.coSupervisorId===coSupervisorId)throw new Error('This student already has that allocation.');
    if(!reason.trim())throw new Error('Enter a reason for this allocation.');
    const supervisor=await tx.get(doc(db,'staff',supervisorId));
    const co=coSupervisorId?await tx.get(doc(db,'staff',coSupervisorId)):null;
    const eventRef=doc(collection(db,'projects',student.id,'allocations'));
    const allocation={supervisorId,coSupervisorId,supervisorName:supervisor.data()?.displayName||'',coSupervisorName:co?.data()?.displayName||'',updatedBy:uid,updatedAt:serverTimestamp(),lastAllocationEventId:eventRef.id};
    if(before)tx.update(ref,allocation);else tx.set(ref,{...allocation,departmentId:student.departmentId,studentId:student.id,title:'',status:'Awaiting topic',createdBy:uid,createdAt:serverTimestamp()});
    tx.set(eventRef,{departmentId:student.departmentId,studentId:student.id,supervisorId,coSupervisorId,previousSupervisorId:before?.supervisorId||'',previousCoSupervisorId:before?.coSupervisorId||'',reason:reason.trim(),actorId:uid,createdAt:serverTimestamp()});
  });
}
export function watchAllocationHistory(projectId:string,receive:(data:DocumentData[])=>void,fail:()=>void){return onSnapshot(collection(db,'projects',projectId,'allocations'),s=>receive(s.docs.map(d=>({id:d.id,...d.data()})).sort((a:DocumentData,b:DocumentData)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))),fail);}
