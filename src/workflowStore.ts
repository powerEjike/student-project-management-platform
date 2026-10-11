import {quickMilestone} from './quickMilestone';
import {collection,doc,getFirestore,onSnapshot,runTransaction,serverTimestamp} from 'firebase/firestore';
import {app} from './firebase';
import {milestonesFrom,programmeKey,templateIdFor,type TemplateStep,type Milestone} from './workflow';
const db=getFirestore(app!);
export function watchTemplates(receive:(data:any[])=>void,fail:()=>void){return onSnapshot(collection(db,'milestoneTemplates'),s=>receive(s.docs.map(d=>({id:d.id,...d.data()}))),fail);}
export async function saveTemplate(departmentId:string,programme:string,steps:TemplateStep[],uid:string){
 if(!programmeKey(programme)||!steps.length||steps.length>10||steps.some(s=>!s.name.trim()||!Number.isInteger(s.days)||s.days<0||s.days>730))throw new Error('Add 1–10 named stages with deadline offsets between 0 and 730 days.');
 const ref=doc(db,'milestoneTemplates',templateIdFor(departmentId,programme));
 await runTransaction(db,async tx=>{await tx.get(ref);const event=doc(collection(ref,'history'));const value={departmentId,programme:programme.trim(),programmeKey:programmeKey(programme),steps:steps.map(s=>({...s,name:s.name.trim()})),updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:event.id};tx.set(ref,value);tx.set(event,{...value,actorId:uid,createdAt:serverTimestamp()});});
}
export async function decideTopic(projectId:string,programme:string,title:string,abstract:string,decision:string,note:string,uid:string){
 await runTransaction(db,async tx=>{
  const ref=doc(db,'projects',projectId);const before=(await tx.get(ref)).data();if(!before)throw new Error('Project folder not found.');if(before.topicDecision==='Approved')throw new Error('This topic has already been approved.');
  const actor=(await tx.get(doc(db,'staff',uid))).data();
  const templateId=templateIdFor(before.departmentId,programme);
  const template=decision==='Approved'?(await tx.get(doc(db,'milestoneTemplates',templateId))).data():null;
  if(decision==='Approved'&&!template)throw new Error('Ask the Super Admin to configure a milestone template for this programme first.');
  const event=doc(collection(ref,'topicHistory'));const value={title:title.trim(),abstract:abstract.trim(),topicDecision:decision,decisionNote:note.trim(),topicApprovedBy:decision==='Approved'?uid:'',topicApprovedAt:decision==='Approved'?serverTimestamp():null,templateId:decision==='Approved'?templateId:'',milestonePlan:template?.steps||[],milestones:template?milestonesFrom(template.steps):{},status:decision==='Approved'?'Research in progress':decision,updatedBy:uid,updatedAt:serverTimestamp(),lastTopicEventId:event.id};
  tx.update(ref,value);tx.set(event,{title:value.title,abstract:value.abstract,decision,note:value.decisionNote,previousDecision:before.topicDecision||'Awaiting topic',actorId:uid,actorName:actor!.displayName,createdAt:serverTimestamp()});
 });
}
export async function updateMilestone(projectId:string,key:string,milestone:Milestone,uid:string){
 await runTransaction(db,async tx=>{const ref=doc(db,'projects',projectId);const before=(await tx.get(ref)).data();if(!before?.milestones?.[key])throw new Error('This milestone no longer exists.');
  const actor=(await tx.get(doc(db,'staff',uid))).data();
  const event=doc(collection(ref,'progressHistory'));const next={...milestone,name:before.milestones[key].name,note:milestone.note.trim()};
  tx.update(ref,{milestones:{...before.milestones,[key]:next},lastMilestoneKey:key,lastProgressEventId:event.id,updatedBy:uid,updatedAt:serverTimestamp()});
  tx.set(event,{milestoneKey:key,previous:before.milestones[key],current:next,actorId:uid,actorName:actor!.displayName,createdAt:serverTimestamp()});
 });
}
export function watchWorkflowHistory(projectId:string,kind:'topicHistory'|'progressHistory',receive:(items:any[])=>void,fail:()=>void){return onSnapshot(collection(db,'projects',projectId,kind),s=>receive(s.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))),fail);}

export async function quickUpdateMilestone(projectId:string,key:string,status:string,note:string,expectedStatus:string,uid:string){await runTransaction(db,async tx=>{const ref=doc(db,'projects',projectId);const before=(await tx.get(ref)).data();if(!before?.milestones?.[key])throw Error('This stage no longer exists.');if(before.completedDate||before.releaseState==='Withheld'||before.supervisorId!==uid||before.topicDecision!=='Approved')throw Error('This project cannot receive a quick progress update.');const actor=(await tx.get(doc(db,'staff',uid))).data();const next=quickMilestone(before.milestones[key],status,note,expectedStatus);const event=doc(collection(ref,'progressHistory'));tx.update(ref,{milestones:{...before.milestones,[key]:next},lastMilestoneKey:key,lastProgressEventId:event.id,updatedBy:uid,updatedAt:serverTimestamp()});tx.set(event,{milestoneKey:key,previous:before.milestones[key],current:next,actorId:uid,actorName:actor!.displayName,createdAt:serverTimestamp()});});}
