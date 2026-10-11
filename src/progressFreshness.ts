import type {Project} from './models';import {todayInLagos} from './workflow.ts';import {daysSince} from './contact.ts';
export function freshnessEligible(p:Project){return !p.completedDate&&p.releaseState!=='Withheld'&&!p.defenceCleared;}
export function progressAge(p:Project,today:string){const date=p.lastSupervisorUpdateAt?.toDate?.();return date&&!Number.isNaN(date.getTime())?daysSince(todayInLagos(date),today):null;}
export function needsProgressUpdate(p:Project,today:string,threshold=14){const age=progressAge(p,today);return freshnessEligible(p)&&age!==null&&age>=threshold;}
export function progressAgeLabel(p:Project,today:string){const age=progressAge(p,today);return age===null?'Topic/progress update time not recorded':'Topic/progress updated '+age+' '+(age===1?'day':'days')+' ago';}
