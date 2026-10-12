import {collection,doc,getDocs,getFirestore,onSnapshot,query,runTransaction,serverTimestamp,where,orderBy,limit,type Timestamp} from 'firebase/firestore';
import {app} from './firebase';import {archiveId,titleKey,type ArchiveEntry,type ArchiveInput} from './archive';
import {findTopicMatches} from './topicSimilarity';
const db=getFirestore(app!);
export type ArchiveChange={id:string;active:boolean;reason:string;actorId:string;recordedAt?:Timestamp};
export function watchArchiveHistory(id:string,receive:(items:ArchiveChange[])=>void,fail:()=>void){return onSnapshot(query(collection(db,'archive',id,'history'),orderBy('recordedAt','desc'),limit(10)),s=>receive(s.docs.map(d=>({id:d.id,...d.data()} as ArchiveChange))),fail);}
export function watchArchive(departmentId:string,receive:(items:ArchiveEntry[])=>void,fail:()=>void){return onSnapshot(query(collection(db,'archive'),where('departmentId','==',departmentId)),s=>receive(s.docs.map(d=>({id:d.id,...d.data()} as ArchiveEntry))),fail);}
export async function checkArchive(departmentId:string,title:string){if(!titleKey(title))throw new Error('Enter a topic title containing letters or numbers.');const result=await getDocs(query(collection(db,'archive'),where('departmentId','==',departmentId),where('active','==',true)));return findTopicMatches(title,result.docs.map(d=>({id:d.id,...d.data()} as ArchiveEntry)));}
export class ArchiveDuplicateError extends Error {}
export async function addArchiveEntry(departmentId:string,input:ArchiveInput,uid:string){
 const value={title:input.title.trim(),author:input.author.trim(),year:input.year,programme:input.programme.trim()};
 if(!titleKey(value.title)||!value.author||!value.programme||!Number.isInteger(value.year)||value.year<1900||value.year>2100)throw new Error('Enter all archive details and a valid year.');
 const existing=await getDocs(query(collection(db,'archive'),where('departmentId','==',departmentId),where('titleKey','==',titleKey(value.title))));
 if(existing.docs.some(d=>titleKey(d.data().author)===titleKey(value.author)&&d.data().year===value.year))throw new ArchiveDuplicateError('This student’s project already exists in the archive.');
 const ref=doc(db,'archive',await archiveId(departmentId,value));
 await runTransaction(db,async tx=>{if((await tx.get(ref)).exists())throw new ArchiveDuplicateError('These project details already exist in the archive.');const event=doc(collection(ref,'history'));const data={...value,departmentId,titleKey:titleKey(value.title),active:true,createdBy:uid,createdAt:serverTimestamp(),updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:event.id};tx.set(ref,data);tx.set(event,{...data,actorId:uid,recordedAt:serverTimestamp(),reason:'Historical archive entry added'});});
}
export async function setArchiveActive(id:string,active:boolean,reason:string,uid:string){if(!reason.trim())throw new Error('Enter a reason for changing the archive entry.');await runTransaction(db,async tx=>{const ref=doc(db,'archive',id);const before=(await tx.get(ref)).data();if(!before)throw new Error('Archive entry not found.');const event=doc(collection(ref,'history'));const data={...before,active,updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:event.id};tx.update(ref,{active,updatedBy:data.updatedBy,updatedAt:data.updatedAt,lastEventId:event.id});tx.set(event,{...data,actorId:uid,recordedAt:serverTimestamp(),reason:reason.trim()});});}

