import {todayInLagos} from './workflow.ts';
export type AuditEvent={id:string;kind:'staff'|'roster';actorId:string;createdAt?:{toDate:()=>Date};staffId?:string;role?:string;active?:boolean;departmentId:string;previousRole?:string;previousActive?:boolean;previousDepartmentId?:string;session?:string;admissionSession?:string;added?:number;skipped?:number};
export function filterAuditEvents(events:AuditEvent[],kind:string,from:string,to:string){
 if(from&&to&&from>to)return [];
 return events.filter(e=>{if(kind&&e.kind!==kind)return false;const date=e.createdAt?.toDate?.();if(!date||Number.isNaN(date.getTime()))return !from&&!to;const day=todayInLagos(date);return (!from||day>=from)&&(!to||day<=to);}).sort((a,b)=>(b.createdAt?.toDate?.().getTime()||0)-(a.createdAt?.toDate?.().getTime()||0)||a.id.localeCompare(b.id));
}
