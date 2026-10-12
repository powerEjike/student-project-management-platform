import type {Milestone} from './workflow.ts';
export function editedMilestone(current:Milestone,expected:Milestone,draft:Milestone):Milestone{
 if((['name','status','dueDate','note'] as const).some(key=>current[key]!==expected[key]))throw new Error('This milestone changed while you were editing it. Reopen Update progress and review the latest deadline and notes.');
 const next={...draft,name:current.name,note:draft.note.trim()};
 if(next.status===current.status&&next.dueDate===current.dueDate&&next.note===current.note)throw new Error('Change the status, deadline or note before saving.');
 return next;
}
