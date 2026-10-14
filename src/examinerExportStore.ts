import {doc,getDocFromServer,getFirestore} from 'firebase/firestore';import {app} from './firebase';
import type {Project,Student,StaffProfile} from './models';import type {ReviewDocument} from './reviewDocumentLoader';import {examinerCopyContext} from './examinerCopy';import {pdfExportRemarks} from './pdfReviewStore';
const db=getFirestore(app!);
export async function examinerExportData(projectId:string,file:ReviewDocument,uid:string,confirmed:boolean){
 const snapshot=await getDocFromServer(doc(db,'projects',projectId));if(!snapshot.exists())throw Error('Project no longer available.');const project={id:snapshot.id,...snapshot.data()} as Project;
 const results=await Promise.allSettled([getDocFromServer(doc(db,'students',project.studentId)),getDocFromServer(doc(db,'staff',uid)),getDocFromServer(doc(db,'departments',project.departmentId)),getDocFromServer(doc(db,'projects',projectId,'documentReviews',file.hash))]);
 const snapshots=results.map(result=>{if(result.status==='rejected')throw result.reason;return result.value;});const [student,staff,department,review]=snapshots;if(!student.exists()||!staff.exists()||!department.exists())throw Error('Could not load current student, staff or department details.');
 if(review.exists()&&(review.data().pages!==file.pdf.numPages||review.data().size!==file.size))throw Error('This file does not match the saved document review. Reopen the original final file.');
 const context=examinerCopyContext(project,{id:student.id,...student.data()} as Student,staff.data() as StaffProfile,uid,department.data().name||'',file,confirmed);
 const remarks=await pdfExportRemarks(projectId,file.hash);return {context,remarks};
}
