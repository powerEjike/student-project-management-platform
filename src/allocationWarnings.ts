import type {allocationPlan} from './allocationPlan';
export function allocationWarnings(plan:ReturnType<typeof allocationPlan>,limit:string){
 if(!/^\d+$/.test(limit)||Number(limit)<1||Number(limit)>1000)return [];
 const maximum=Number(limit);
 return plan.workloads.filter(w=>w.primaryAfter>maximum).map(w=>({id:w.id,name:w.name,total:w.primaryAfter,excess:w.primaryAfter-maximum,maximum}));
}
