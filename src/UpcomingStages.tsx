import type {Project} from './models';
import {upcomingMilestones} from './projectSummary';
export default function UpcomingStages({project,today}:{project:Project;today:string}){
 const stages=upcomingMilestones(project,today);if(!stages.length)return null;
 return <details><summary>{stages.length} stage{stages.length===1?'':'s'} due within 7 days</summary><ul>{stages.map(stage=><li key={stage.key}><strong>{stage.name}</strong><br/>{stage.dueDate} · {stage.days===0?'Due today':stage.days===1?'Due tomorrow':`Due in ${stage.days} days`}<br/><span className="muted">{stage.status}</span></li>)}</ul></details>;
}
