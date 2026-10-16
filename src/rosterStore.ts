import {collection,doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import {getFirestore} from 'firebase/firestore';import {app} from './firebase';
import {rosterKey,validateRosterSessions,type RosterRow} from './studentRoster';
export async function importRoster(rows:RosterRow[],settings:{departmentId:string;session:string;admissionSession:string;programme:string;level:string},uid:string,onProgress:(added:number,skipped:number)=>void){
 validateRosterSessions(settings.session,settings.admissionSession);
 if(!settings.departmentId||!settings.programme.trim()||!settings.level.trim())throw Error('Choose a department, programme and level.');
 const db=getFirestore(app!);let added=0,skipped=0;
 for(let start=0;start<rows.length;start+=10){
  const part=rows.slice(start,start+10);const result=await runTransaction(db,async tx=>{
   const refs=part.map(r=>doc(db,'students',`${settings.departmentId}__${rosterKey(settings.session)}__${rosterKey(r.matricNumber)}`));
   const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));let created=0;let existing=0;
   snapshots.forEach((s,i)=>{if(s.exists()){existing++;return;}tx.set(refs[i],{...settings,...part[i],programme:settings.programme.trim(),level:settings.level.trim(),matricKey:rosterKey(part[i].matricNumber),email:part[i].email||'',createdBy:uid,createdAt:serverTimestamp()});created++;});
   if(created)tx.set(doc(collection(db,'rosterImports')),{departmentId:settings.departmentId,session:settings.session,admissionSession:settings.admissionSession,added:created,skipped:existing,actorId:uid,createdAt:serverTimestamp()});
   return {created,existing};
  });added+=result.created;skipped+=result.existing;onProgress(added,skipped);
 }
 return {added,skipped};
}
