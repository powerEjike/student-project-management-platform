import {csvRows} from './csvRows.ts';
import {studentEmailValue} from './studentEmail.ts';
export type RosterRow={name:string;matricNumber:string;currentCGPA?:number;gender?:string;email?:string};
export const rosterKey=(value:string)=>value.toUpperCase().replace(/[^A-Z0-9]/g,'');
export function parseRoster(text:string):RosterRow[]{
 const {headers,rows}=csvRows(text);return rosterTable(headers,rows);
}
export function rosterTable(rawHeaders:string[],rows:string[][]):RosterRow[]{
 const headers=rawHeaders.map(h=>h.trim().toLowerCase());
 if(new Set(headers).size!==headers.length)throw Error('Column names must be unique.');
 const name=headers.indexOf('student name'),reg=headers.indexOf('reg number'),cgpa=headers.indexOf('current cgpa'),gender=headers.indexOf('gender'),email=headers.indexOf('email');
 if(name<0||reg<0)throw Error('Required columns: Student Name and Reg Number.');
 if(!rows.length||rows.length>1000)throw Error('Upload between 1 and 1,000 students at a time.');
 const seen=new Set<string>();return rows.map((values,i)=>{
  if(values.length!==headers.length)throw Error(`Row ${i+2}: column count does not match the header.`);
  const result:RosterRow={name:values[name].trim(),matricNumber:values[reg].trim()};const key=rosterKey(result.matricNumber);
  if(!result.name||result.name.length>120||!key||key.length>80||result.matricNumber.length>80)throw Error(`Row ${i+2}: invalid student name or registration number.`);
  if(seen.has(key))throw Error(`Row ${i+2}: duplicate registration number.`);seen.add(key);
  if(cgpa>=0&&values[cgpa].trim()){const raw=values[cgpa].trim();if(!/^\d+(\.\d+)?$/.test(raw)||Number(raw)>5)throw Error(`Row ${i+2}: CGPA must be between 0 and 5.`);result.currentCGPA=Number(raw);}
  if(gender>=0&&values[gender].trim()){result.gender=values[gender].trim();if(result.gender.length>40)throw Error(`Row ${i+2}: gender is too long.`);}
  if(email>=0&&values[email].trim()){try{result.email=studentEmailValue(values[email]);}catch{throw Error(`Row ${i+2}: enter one valid student email address.`);}}
  return result;
 });
}
export function validateRosterSessions(session:string,admissionSession:string){
 const valid=(s:string)=>/^\d{4}\/\d{4}$/.test(s)&&Number(s.slice(5))===Number(s.slice(0,4))+1;
 if(!valid(session)||!valid(admissionSession)||admissionSession>session)throw Error('Use consecutive-year sessions such as 2025/2026, with admission no later than the current session.');
}
