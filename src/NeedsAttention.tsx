import {useEffect,useState} from 'react';
import type {Project,Student} from './models';
import {attentionProjects} from './attentionProjects';
import {freshnessEligible,progressAge} from './progressFreshness';
import {studentPage} from './studentPages';
import StudentPagination from './StudentPagination';
export default function NeedsAttention({projects,students,today,threshold,escalationDays=7,onOpen}:{projects:Project[];students:Student[];today:string;threshold:number;escalationDays?:number;onOpen:(id:string)=>void}){
 const [page,setPage]=useState(0);const [expanded,setExpanded]=useState(false);
 useEffect(()=>setPage(0),[threshold,escalationDays,today,projects,students]);
 const rows=attentionProjects(projects,students,today,threshold,escalationDays);const paged=studentPage(rows,page);const unknown=projects.filter(p=>freshnessEligible(p)&&progressAge(p,today)===null).length;
 return <section className="panel allocation-history"><div className="section-heading"><h2>Needs attention ({rows.length})</h2><button className="text-button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Hide attention list':'Review attention list'}</button></div><p>Private HOD review of projects with no recorded topic or milestone update for {threshold+escalationDays} days: the {threshold}-day reminder period plus {escalationDays} additional days.</p>{expanded&&<><div className="table-wrap"><table><thead><tr><th>Student</th><th>Registration number</th><th>Supervisor</th><th>Days since update</th><th></th></tr></thead><tbody>{paged.rows.map(({project,student,age})=><tr key={project.id}><td>{student.name}</td><td>{student.matricNumber}</td><td>{project.supervisorName}</td><td>{age}</td><td><button className="text-button" onClick={()=>onOpen(project.id)}>Open project</button></td></tr>)}</tbody></table></div>{!rows.length&&<p>No projects have reached this review threshold.</p>}<StudentPagination {...paged} total={rows.length} busy={false} onPage={setPage}/></>}<p className="muted">Uses the academic session, programme and level filters. Completed, withheld and defence-cleared projects are excluded. {unknown} eligible project{unknown===1?' has':'s have'} no recorded update time and cannot be dated for this list. This is a review cue, not evidence of an ignored reminder or student non-response.</p></section>;
}
