import {doc,onSnapshot,serverTimestamp,setDoc,getFirestore} from 'firebase/firestore';
import {app,auth} from './firebase';
const db=getFirestore(app!);
export function watchAllocationLimit(departmentId:string,receive:(limit:number)=>void,fail:()=>void){return onSnapshot(doc(db,'departmentSettings',departmentId),snapshot=>receive(snapshot.exists()?snapshot.data().primaryLimit:0),fail);}
export async function saveAllocationLimit(departmentId:string,limit:number){if(!Number.isInteger(limit)||limit<0||limit>1000)throw Error('Enter a whole number from 1 to 1000, or leave blank to remove the limit.');await setDoc(doc(db,'departmentSettings',departmentId),{primaryLimit:limit,updatedBy:auth!.currentUser!.uid,updatedAt:serverTimestamp()});}
