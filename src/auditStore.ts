import {collection,getFirestore,limit,onSnapshot,orderBy,query} from 'firebase/firestore';import {app} from './firebase';import type {AuditEvent} from './auditEvents';
export function watchAdminActivity(receive:(events:AuditEvent[])=>void,fail:()=>void){
 const db=getFirestore(app!);let staff:AuditEvent[]=[],roster:AuditEvent[]=[];let readyStaff=false,readyRoster=false;
 const merge=()=>{if(readyStaff&&readyRoster)receive([...staff,...roster]);};
 const a=onSnapshot(query(collection(db,'staffAccessChanges'),orderBy('createdAt','desc'),limit(200)),s=>{staff=s.docs.map(d=>({...d.data(),id:`staff-${d.id}`,kind:'staff'} as AuditEvent));readyStaff=true;merge();},()=>{readyStaff=false;fail();});
 const b=onSnapshot(query(collection(db,'rosterImports'),orderBy('createdAt','desc'),limit(200)),s=>{roster=s.docs.map(d=>({...d.data(),id:`roster-${d.id}`,kind:'roster'} as AuditEvent));readyRoster=true;merge();},()=>{readyRoster=false;fail();});
 return()=>{a();b();};
}
