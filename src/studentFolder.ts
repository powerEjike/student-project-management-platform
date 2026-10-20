import type {Project} from './models';
export function hasStudentFolder(p:Project){return !!(p.folderCreatedAt||p.title?.trim()||p.topicDecision||p.completedDate||Object.keys(p.milestones||{}).length);}
export function folderCreationAllowed(p:Project,uid:string){return p.supervisorId===uid&&!p.completedDate&&!['Pending','Withheld'].includes(p.releaseState||'');}
