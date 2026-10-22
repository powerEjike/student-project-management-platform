import type{Student,Project}from'./models';
export function lowerUndergraduateLevel(level:unknown){const key=(typeof level==='string'?level:'').toLowerCase().replace(/[^a-z0-9]/g,'');return /^(100|200|300)(level)?$/.test(key)||/^(level)(100|200|300)$/.test(key)||['firstyear','secondyear','thirdyear','year1','year2','year3'].includes(key);}
export function projectWorkspaceStudents(students:Student[],projects:Project[]){const existing=new Set(projects.map(p=>p.studentId));return students.filter(student=>!lowerUndergraduateLevel(student.level)||existing.has(student.id));}
