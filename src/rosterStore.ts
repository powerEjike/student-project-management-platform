import{importBatchMetadata}from'./importHistory';
import {collection,doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import {getFirestore} from 'firebase/firestore';import {app} from './firebase';
import {rosterKey,validateRosterSessions,type RosterRow} from './studentRoster';
export async function importRoster(rows:RosterRow[],settings:{departmentId:string;session:string;admissionSession:string;programme:string;level:string},uid:string,onProgress:(added:number,skipped:number)=>void,sourceName='Student roster'){
 validateRosterSessions(settings.session,settings.admissionSession);
 if(!settings.departmentId||!settings.programme.trim()||!settings.level.trim())throw Error('Choose a department, programme and level.');
 const db=getFirestore(app!);if(!rows.length||rows.length>1000)throw Error('Choose between 1 and 1000 student records.');const runId=doc(collection(db,'rosterImports')).id;let added=0,skipped=0;
 for(let start=0;start<rows.length;start+=10){
  const part=rows.slice(start,start+10),metadata=importBatchMetadata(runId,sourceName,rows.length,start/10+1,settings.programme,settings.level);const result=await runTransaction(db,async tx=>{
   const refs=part.map(r=>doc(db,'students',`${settings.departmentId}__${rosterKey(settings.session)}__${rosterKey(r.matricNumber)}`));
   const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));let created=0;let existing=0;
   snapshots.forEach((s,i)=>{if(s.exists()){existing++;return;}tx.set(refs[i],{...settings,...part[i],programme:settings.programme.trim(),level:settings.level.trim(),matricKey:rosterKey(part[i].matricNumber),email:part[i].email||'',createdBy:uid,createdAt:serverTimestamp()});created++;});
   tx.set(doc(db,'rosterImports',`${runId}_${metadata.batchNumber}`),{...metadata,departmentId:settings.departmentId,session:settings.session,admissionSession:settings.admissionSession,added:created,skipped:existing,actorId:uid,createdAt:serverTimestamp()});
   return {created,existing};
  });added+=result.created;skipped+=result.existing;onProgress(added,skipped);
 }
 return {added,skipped};
}
