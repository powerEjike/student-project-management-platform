import type {Project} from './models';
import {overdue} from './workflow.ts';
export function matchesMilestone(p:Project|undefined,name:string,status:string,today:string){
 if(!name&&!status)return true;
 return Object.values(p?.milestones||{}).some(m=>(!name||m.name===name)&&(!status||(status==='Overdue'?overdue(m,today):m.status===status)));
}
