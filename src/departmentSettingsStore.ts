import {collection,doc,limit,onSnapshot,orderBy,query,runTransaction,serverTimestamp,getFirestore} from 'firebase/firestore';
import {app,auth} from './firebase';
const db=getFirestore(app!);
export type LimitChange={id:string;previousLimit:number;primaryLimit:number;actorName:string;createdAt?:{toDate:()=>Date}};
export function watchAllocationLimit(departmentId:string,receive:(limit:number)=>void,fail:()=>void){return onSnapshot(doc(db,'departmentSettings',departmentId),snapshot=>receive(snapshot.exists()?snapshot.data().primaryLimit:0),fail);}
export function watchLimitHistory(departmentId:string,receive:(changes:LimitChange[])=>void,fail:()=>void){return onSnapshot(query(collection(db,'departmentSettings',departmentId,'history'),orderBy('createdAt','desc'),limit(10)),snapshot=>receive(snapshot.docs.map(d=>({id:d.id,...d.data()} as LimitChange))),fail);}
export async function saveAllocationLimit(departmentId:string,maximum:number,expected:number){
 if(!Number.isInteger(maximum)||maximum<0||maximum>1000)throw Error('Enter a whole number from 1 to 1000, or leave blank to remove the limit.');
 const uid=auth!.currentUser!.uid;
 await runTransaction(db,async tx=>{const ref=doc(db,'departmentSettings',departmentId);const before=await tx.get(ref);const staff=await tx.get(doc(db,'staff',uid));const previousLimit=before.exists()?before.data().primaryLimit:0;
 if(previousLimit!==expected)throw Error('The department limit changed. Review the latest value before saving.');if(previousLimit===maximum)return;
 const event=doc(collection(ref,'history'));tx.set(ref,{primaryLimit:maximum,updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:event.id});tx.set(event,{previousLimit,primaryLimit:maximum,actorId:uid,actorName:staff.data()!.displayName,createdAt:serverTimestamp()});
 });
}
