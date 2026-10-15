import{doc,getDocFromServer,getFirestore}from'firebase/firestore';import{app,auth}from'./firebase';import type{Project,Student,StaffProfile}from'./models';import{todayInLagos}from'./workflow';import{checkReminderContext,type ReminderContext}from'./studentReminder';
const db=getFirestore(app!);
export async function studentReminderContext(projectId:string,uid:string):Promise<ReminderContext>{
 if(auth?.currentUser?.uid!==uid)throw Error('Sign in as the current supervisor before preparing a reminder.');
 const snapshot=await getDocFromServer(doc(db,'projects',projectId));if(!snapshot.exists())throw Error('This project is no longer available.');const project={id:snapshot.id,...snapshot.data()}as Project;
 const[student,staff,department]=await Promise.all([getDocFromServer(doc(db,'students',project.studentId)),getDocFromServer(doc(db,'staff',uid)),getDocFromServer(doc(db,'departments',project.departmentId))]);if(!student.exists()||!staff.exists()||!department.exists())throw Error('Could not verify the current student, supervisor and department.');
 const latest=await getDocFromServer(doc(db,'projects',projectId));if(!latest.exists()||latest.data().studentId!==project.studentId||latest.data().departmentId!==project.departmentId)throw Error('Project details changed. Reload the reminder.');
 const context={project:{id:latest.id,...latest.data()}as Project,student:{id:student.id,...student.data()}as Student,staff:staff.data()as StaffProfile,uid,departmentName:department.data().name||'',today:todayInLagos()};checkReminderContext(context);return context;
}
