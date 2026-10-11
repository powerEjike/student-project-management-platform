export const milestoneStatuses=['Not started','In progress','Under review','Completed','Delayed'] as const;
export type Milestone={name:string;dueDate:string;status:string;note:string};
export type TemplateStep={name:string;days:number};
export const programmeKey=(name:string)=>name.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
export const templateIdFor=(department:string,programme:string)=>`${department}__${programmeKey(programme)}`;
export function todayInLagos(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function milestonesFrom(steps:TemplateStep[],date=new Date()){
 const today=todayInLagos(date);
 return Object.fromEntries(steps.map((step,index)=>{const deadline=new Date(`${today}T12:00:00+01:00`);deadline.setUTCDate(deadline.getUTCDate()+step.days);return [`m${index}`,{name:step.name,dueDate:todayInLagos(deadline),status:'Not started',note:''}];}));
}
export const overdue=(milestone:Milestone,today=todayInLagos())=>milestone.status!=='Completed'&&milestone.dueDate<today;
