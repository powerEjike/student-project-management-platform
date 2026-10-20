import{checkArchive}from'./archiveStore';
import {checkEthicsProgress} from './ethicsStore';
import {validateTemplateRevision,type TemplateRevision} from './templateRevision';
import {validateTopicRevision} from './topicRevision';
import {editedMilestone} from './milestoneEdit';
import {quickMilestone} from './quickMilestone';
import {collection,doc,getFirestore,onSnapshot,runTransaction,serverTimestamp,query,orderBy,limit,type Timestamp} from 'firebase/firestore';
import {app} from './firebase';
import {milestonesFrom,programmeKey,templateIdFor,type TemplateStep,type Milestone} from './workflow';
const db=getFirestore(app!);
export type TemplateChange={id:string;programme:string;steps:TemplateStep[];actorId:string;createdAt?:Timestamp};
export function watchTemplateHistory(id:string,receive:(items:TemplateChange[])=>void,fail:()=>void){return onSnapshot(query(collection(db,'milestoneTemplates',id,'history'),orderBy('createdAt','desc'),limit(10)),s=>receive(s.docs.map(d=>({id:d.id,...d.data()} as TemplateChange))),fail);}
export function watchTemplates(receive:(data:any[])=>void,fail:()=>void){return onSnapshot(collection(db,'milestoneTemplates'),s=>receive(s.docs.map(d=>({id:d.id,...d.data()}))),fail);}
export async function saveTemplate(departmentId:string,programme:string,steps:TemplateStep[],uid:string,opened:TemplateRevision|null){
 if(!programmeKey(programme)||!steps.length||steps.length>10||steps.some(s=>!s.name.trim()||!Number.isInteger(s.days)||s.days<0||s.days>730))throw new Error('Add 1–10 named stages with deadline offsets between 0 and 730 days.');
 const ref=doc(db,'milestoneTemplates',templateIdFor(departmentId,programme));
 return runTransaction(db,async tx=>{const current=(await tx.get(ref)).data();validateTemplateRevision(ref.id,current,opened);const event=doc(collection(ref,'history'));const value={departmentId,programme:programme.trim(),programmeKey:programmeKey(programme),steps:steps.map(s=>({...s,name:s.name.trim()})),updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:event.id};tx.set(ref,value);tx.set(event,{...value,actorId:uid,createdAt:serverTimestamp()});return {id:ref.id,lastEventId:event.id};});
}
export async function decideTopic(projectId:string,programme:string,title:string,abstract:string,decision:string,note:string,uid:string,expectedEventId:string|undefined){
 await runTransaction(db,async tx=>{
  const ref=doc(db,'projects',projectId);const before=(await tx.get(ref)).data();if(!before)throw new Error('Project folder not found.');validateTopicRevision(before,expectedEventId);if(decision==='Approved'&&(await checkArchive(before.departmentId,title)).some(m=>m.matchKind==='exact'))throw Error('This topic already exists in the archive. Choose another topic.');
  const actor=(await tx.get(doc(db,'staff',uid))).data();
  const templateId=templateIdFor(before.departmentId,programme);
  const template=decision==='Approved'?(await tx.get(doc(db,'milestoneTemplates',templateId))).data():null;
  if(decision==='Approved'&&!template)throw new Error('Ask the Super Admin to configure a milestone template for this programme first.');
  const event=doc(collection(ref,'topicHistory'));const value={title:title.trim(),abstract:abstract.trim(),topicDecision:decision,decisionNote:note.trim(),topicApprovedBy:decision==='Approved'?uid:'',topicApprovedAt:decision==='Approved'?serverTimestamp():null,templateId:decision==='Approved'?templateId:'',milestonePlan:template?.steps||[],milestones:template?milestonesFrom(template.steps):{},status:decision==='Approved'?'Research in progress':decision,updatedBy:uid,updatedAt:serverTimestamp(),lastSupervisorUpdateAt:serverTimestamp(),lastTopicEventId:event.id};
  tx.update(ref,value);tx.set(event,{title:value.title,abstract:value.abstract,decision,note:value.decisionNote,previousDecision:before.topicDecision||'Awaiting topic',actorId:uid,actorName:actor!.displayName,createdAt:serverTimestamp()});
 });
}
export async function updateMilestone(projectId:string,key:string,milestone:Milestone,uid:string,expected:Milestone){
 await runTransaction(db,async tx=>{const ref=doc(db,'projects',projectId);const before=(await tx.get(ref)).data();if(!before?.milestones?.[key])throw new Error('This milestone no longer exists.');
  const actor=(await tx.get(doc(db,'staff',uid))).data();
  const event=doc(collection(ref,'progressHistory'));const next=editedMilestone(before.milestones[key],expected,milestone);await checkEthicsProgress(tx,projectId,before.departmentId,before.milestones[key],next.status);
  tx.update(ref,{milestones:{...before.milestones,[key]:next},lastMilestoneKey:key,lastSupervisorUpdateAt:serverTimestamp(),lastProgressEventId:event.id,updatedBy:uid,updatedAt:serverTimestamp()});
  tx.set(event,{milestoneKey:key,previous:before.milestones[key],current:next,actorId:uid,actorName:actor!.displayName,createdAt:serverTimestamp()});
 });
}
export function watchWorkflowHistory(projectId:string,kind:'topicHistory'|'progressHistory',receive:(items:any[])=>void,fail:()=>void){return onSnapshot(collection(db,'projects',projectId,kind),s=>receive(s.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))),fail);}

export async function quickUpdateMilestone(projectId:string,key:string,status:string,note:string,expectedStatus:string,uid:string){await runTransaction(db,async tx=>{const ref=doc(db,'projects',projectId);const before=(await tx.get(ref)).data();if(!before?.milestones?.[key])throw Error('This stage no longer exists.');if(before.completedDate||before.releaseState==='Withheld'||before.supervisorId!==uid||before.topicDecision!=='Approved')throw Error('This project cannot receive a quick progress update.');const actor=(await tx.get(doc(db,'staff',uid))).data();const next=quickMilestone(before.milestones[key],status,note,expectedStatus);await checkEthicsProgress(tx,projectId,before.departmentId,before.milestones[key],next.status);const event=doc(collection(ref,'progressHistory'));tx.update(ref,{milestones:{...before.milestones,[key]:next},lastMilestoneKey:key,lastSupervisorUpdateAt:serverTimestamp(),lastProgressEventId:event.id,updatedBy:uid,updatedAt:serverTimestamp()});tx.set(event,{milestoneKey:key,previous:before.milestones[key],current:next,actorId:uid,actorName:actor!.displayName,createdAt:serverTimestamp()});});}

export async function reviseApprovedTopic(id:string,title:string,abstract:string,uid:string,expected:string|undefined){await runTransaction(db,async tx=>{const ref=doc(db,'projects',id),before=(await tx.get(ref)).data();if(!before||before.supervisorId!==uid||before.topicDecision!=='Approved'||before.completedDate||before.defenceCleared||['Pending','Withheld'].includes(before.releaseState))throw Error('This topic cannot be changed.');if(before.lastTopicEventId!==expected)throw Error('The topic changed. Reopen the folder and try again.');if(title.trim()===before.title&&abstract.trim()===(before.abstract||''))throw Error('No changes to save.');if((await checkArchive(before.departmentId,title)).some(m=>m.matchKind==='exact'))throw Error('This topic already exists in the archive.');const actor=(await tx.get(doc(db,'staff',uid))).data(),event=doc(collection(ref,'topicHistory'));tx.update(ref,{title:title.trim(),abstract:abstract.trim(),decisionNote:'Topic updated by supervisor',topicApprovedBy:uid,topicApprovedAt:serverTimestamp(),lastSupervisorUpdateAt:serverTimestamp(),lastTopicEventId:event.id,updatedBy:uid,updatedAt:serverTimestamp()});tx.set(event,{title:title.trim(),abstract:abstract.trim(),decision:'Approved',note:'Topic updated by supervisor',previousDecision:'Approved',actorId:uid,actorName:actor!.displayName,createdAt:serverTimestamp()});});}
