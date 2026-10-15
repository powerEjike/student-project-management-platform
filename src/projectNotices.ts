import type {Project,StaffProfile} from './models';import {upcomingMilestones} from './projectSummary.ts';
export type ProjectNotice={key:string;projectId:string;studentId:string;kind:'deadline'|'topic'|'defence'|'release'|'feedback'|'submission'|'progress';heading:string;detail:string;priority:number};
export function projectNotices(projects:Project[],profile:StaffProfile,uid:string,today:string){
 const rows:ProjectNotice[]=[];if(profile.role==='admin')return rows;
 for(const p of projects){if(p.departmentId!==profile.departmentId||profile.role!=='hod'&&p.supervisorId!==uid&&p.coSupervisorId!==uid||p.completedDate)continue;
  const add=(kind:ProjectNotice['kind'],key:string,heading:string,detail:string,priority:number)=>rows.push({kind,key:`${p.id}:${key}`,projectId:p.id,studentId:p.studentId,heading,detail,priority});
  if(profile.role==='hod'&&p.releaseState==='Pending')add('release',`release:${p.releaseRequestId||'pending'}`,'Supervisor release needs a decision','Review the private release evidence in the project folder.',0);
  if(p.releaseState==='Withheld')continue;
  if(p.lastFeedbackEventId&&p.lastFeedbackBy!==uid)add('feedback',`feedback:${p.lastFeedbackEventId}`,'New supervisor feedback','Review the categorized remark and summary in the project folder.',2);
  if(p.defenceCleared){if(profile.role==='hod')add('defence',`defence:${p.lastDefenceEventId||'current'}`,'Project ready for defence','The supervisor marked the work Completed. This student is on the defence list.',1);continue;}
  if(profile.role==='lecturer'&&p.supervisorId===uid&&p.topicDecision!=='Approved')add('topic',`topic-action:${p.lastTopicEventId||p.lastAllocationEventId}`,'Topic needs supervisor attention',p.topicDecision?`Current decision: ${p.topicDecision}. Review the topic in the folder.`:'Check the topic archive and record the topic decision.',2);
  if((profile.role==='hod'||p.coSupervisorId===uid)&&p.lastTopicEventId)add('topic',`topic-decision:${p.lastTopicEventId}`,`Topic decision: ${p.topicDecision||'Recorded'}`,'Open the folder to review the saved topic decision and note.',3);
  for(const [key,m] of Object.entries(p.milestones||{})){const date=Date.parse(m.dueDate+'T00:00:00Z');if(m.status!=='Completed'&&Number.isFinite(date)&&new Date(date).toISOString().slice(0,10)===m.dueDate&&m.dueDate<today)add('deadline',`overdue:${key}:${m.dueDate}:${m.status}`,`${m.name} is overdue`,`Recorded deadline: ${m.dueDate}. Current stage status: ${m.status}.`,0);}
  for(const m of upcomingMilestones(p,today))add('deadline',`upcoming:${m.key}:${m.dueDate}:${m.status}`,`${m.name} ${m.days===0?'is due today':'is due soon'}`,`Recorded deadline: ${m.dueDate}. ${m.days} day${m.days===1?'':'s'} remaining.`,1);
 }
 return rows.sort((a,b)=>a.priority-b.priority||a.heading.localeCompare(b.heading)||a.key.localeCompare(b.key));
}
export async function projectNoticeId(key:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key))),n=>n.toString(16).padStart(2,'0')).join('');}
