import{collectionGroup,doc,getDocFromServer,getFirestore,limit,onSnapshot,orderBy,query,where}from'firebase/firestore';
import{app}from'./firebase';
import type{StudentAttendanceEntry}from'./studentAttendanceData';
const db=getFirestore(app!);
export function watchStudentAttendance(studentId:string,count:number,receive:(rows:StudentAttendanceEntry[])=>void,fail:()=>void){
 let live=true,revision=0;const cache=new Map<string,{title:string;lecturerName:string;session:string;classStartedAt?:{toDate:()=>Date}}>();
 const off=onSnapshot(query(collectionGroup(db,'checkIns'),where('studentId','==',studentId),orderBy('checkedAt','desc'),limit(count)),snapshot=>{
  const version=++revision;
  void Promise.all(snapshot.docs.map(async receipt=>{
   const parent=receipt.ref.parent.parent;if(!parent||!/^classSessions\/[^/]+$/.test(parent.path))return null;
   let metadata=cache.get(parent.path);
   if(!metadata)try{const result=await getDocFromServer(doc(db,parent.path));if(result.exists()){const data=result.data();metadata={title:data.title,lecturerName:data.ownerName,session:data.session,classStartedAt:data.createdAt};cache.set(parent.path,metadata);}}catch{/* Keep the student's confirmed check-in visible when class metadata cannot load. */}
   return{id:parent.id,title:metadata?.title||'',lecturerName:metadata?.lecturerName||'',session:metadata?.session||'',classStartedAt:metadata?.classStartedAt,checkedAt:receipt.data().checkedAt,detailsUnavailable:!metadata}as StudentAttendanceEntry;
  })).then(rows=>{if(live&&version===revision)receive(rows.filter((row):row is StudentAttendanceEntry=>row!==null));}).catch(()=>{if(live&&version===revision)fail();});
 },()=>{revision++;if(live)fail();});
 return()=>{live=false;revision++;off();};
}
