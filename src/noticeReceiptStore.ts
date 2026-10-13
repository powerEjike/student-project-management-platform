import {collection,doc,getFirestore,onSnapshot,setDoc,serverTimestamp} from 'firebase/firestore';import {app} from './firebase';
const db=getFirestore(app!);
export function watchNoticeReceipts(uid:string,receive:(ids:Set<string>)=>void,fail:()=>void){return onSnapshot(collection(db,'notificationReceipts',uid,'items'),s=>receive(new Set(s.docs.map(d=>d.id))),fail);}
export async function markNoticeSeen(uid:string,id:string){await setDoc(doc(db,'notificationReceipts',uid,'items',id),{seenAt:serverTimestamp()});}
