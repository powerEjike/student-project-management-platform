import {needsProgressUpdate,freshnessEligible,progressAge} from './progressFreshness.ts';
import type {Project} from './models';import {overdue} from './workflow.ts';
export type ProjectFilter='all'|'active'|'overdue'|'awaitingTopic'|'defence'|'completed'|'stale'|'unrecorded'|'upcoming';
export function upcomingMilestones(p:Project,today:string){
 if(p.completedDate||p.releaseState==='Withheld'||p.defenceCleared)return [];
 const start=Date.parse(today+'T00:00:00Z');
 return Object.entries(p.milestones||{}).flatMap(([key,m])=>{
  if(m.status==='Completed'||!/^\d{4}-\d{2}-\d{2}$/.test(m.dueDate))return [];
  const due=Date.parse(m.dueDate+'T00:00:00Z');
  return Number.isFinite(due)&&new Date(due).toISOString().slice(0,10)===m.dueDate&&due>=start&&due<=start+7*86400000?[{key,...m,days:(due-start)/86400000}]:[];
 }).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||Number(a.key.slice(1))-Number(b.key.slice(1))||a.key.localeCompare(b.key));
}
export function upcomingCount(p:Project,today:string){return upcomingMilestones(p,today).length;}
export function overdueCount(p:Project,today:string){return p.completedDate||p.defenceCleared||p.releaseState==='Withheld'?0:Object.values(p.milestones||{}).filter(m=>overdue(m,today)).length;}
export function matchesProjectFilter(p:Project|undefined,filter:ProjectFilter,today:string,threshold=14){if(filter==='all')return true;if(!p)return false;if(filter==='completed')return !!p.completedDate;if(p.completedDate||p.releaseState==='Withheld')return false;if(filter==='upcoming')return upcomingCount(p,today)>0;if(filter==='stale')return needsProgressUpdate(p,today,threshold);if(filter==='unrecorded')return freshnessEligible(p)&&progressAge(p,today)===null;if(filter==='overdue')return overdueCount(p,today)>0;if(filter==='awaitingTopic')return p.topicDecision!=='Approved';if(filter==='defence')return !!p.defenceCleared;return true;}
export function projectOverview(projects:Project[],today:string){const filters=['active','overdue','upcoming','awaitingTopic','defence','completed'] as const;return Object.fromEntries(filters.map(filter=>[filter,projects.filter(p=>matchesProjectFilter(p,filter,today)).length])) as Record<typeof filters[number],number>;}
