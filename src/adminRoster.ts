import type{Student}from'./models';
export function recordedCgpa(student:Student){return typeof student.currentCGPA==='number'&&Number.isFinite(student.currentCGPA)&&student.currentCGPA>=0&&student.currentCGPA<=5;}
export function browseRoster(students:Student[],filters:{session:string;search:string;check:string}){
 const words=filters.search.normalize('NFC').trim().toLowerCase().split(/\s+/).filter(Boolean);
 return students.filter(student=>{if(filters.session&&student.session!==filters.session)return false;if(filters.check==='cgpa'&&recordedCgpa(student))return false;if(filters.check==='admission'&&student.admissionSession?.trim())return false;const text=[student.name,student.matricNumber,student.session,student.admissionSession,student.programme].join(' ').normalize('NFC').toLowerCase();const reg=student.matricNumber.toLowerCase().replace(/[^a-z0-9]/g,'');return words.every(word=>text.includes(word)||/\d/.test(word)&&!!word.replace(/[^a-z0-9]/g,'')&&reg.includes(word.replace(/[^a-z0-9]/g,'')));}).sort((a,b)=>a.name.localeCompare(b.name)||a.matricNumber.localeCompare(b.matricNumber)||a.session.localeCompare(b.session)||a.id.localeCompare(b.id));
}
