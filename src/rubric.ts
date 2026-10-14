export type Criterion={name:string;maximum:number};
export function rubricStage(key:string,milestones:Record<string,{name:string}>={}){if(key&&!milestones[key])throw Error('This review stage is no longer available. Choose a current milestone.');return {milestoneKey:key,milestoneName:key?milestones[key].name:'Overall project'};}
export function rubricCriteria(rows:Criterion[]){
 if(!rows.length||rows.length>5)throw Error('Configure between one and five criteria.');
 const result=rows.map(row=>({name:row.name.trim(),maximum:Number(row.maximum)}));
 if(result.some(row=>!row.name||row.name.length>100||!Number.isInteger(row.maximum)||row.maximum<1||row.maximum>100))throw Error('Each criterion needs a name and a whole-number maximum from 1 to 100.');
 if(new Set(result.map(row=>row.name.toLowerCase())).size!==result.length)throw Error('Use distinct criterion names.');return result;
}
export function rubricReview(criteria:Criterion[],scores:number[],summary:string){
 const checked=rubricCriteria(criteria);if(scores.length!==checked.length||scores.some((score,i)=>!Number.isInteger(score)||score<0||score>checked[i].maximum))throw Error('Enter a whole-number score within each criterion maximum.');
 summary=summary.trim();if(!summary||summary.length>2000)throw Error('Enter a review summary up to 2,000 characters.');return {criteria:checked,scores,summary};
}
