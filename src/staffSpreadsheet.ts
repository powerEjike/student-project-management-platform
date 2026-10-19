import type{Worksheet}from'exceljs';import{csvRows}from'./csvRows.ts';import{importWorksheetTable}from'./importWorksheet.ts';import{parseStaffBatch}from'./staffBatchInput.mjs';import{studentEmailValue}from'./studentEmail.ts';
type Department={id:string;name:string};
export function staffSpreadsheetTable(rawHeaders:string[],rows:string[][],departments:Department[]){
 const headers=rawHeaders.map(h=>h.trim().toLowerCase());const required=['staff name','email','role','department'];
 if(headers.length!==4||new Set(headers).size!==4||required.some(h=>!headers.includes(h)))throw Error('Use exactly these columns: Staff Name, Email, Role, Department. Do not include passwords or credentials.');
 if(!rows.length||rows.length>100)throw Error('Prepare between 1 and 100 staff records.');
 return parseStaffBatch(rows.map((values,i)=>{
  if(values.length!==headers.length)throw Error(`Row ${i+2}: column count does not match the header.`);
  const value=(header:string)=>values[headers.indexOf(header)].trim();const department=value('department').toLowerCase();const matches=departments.filter(d=>d.id.toLowerCase()===department||d.name.trim().toLowerCase()===department);
  if(matches.length!==1)throw Error(`Row ${i+2}: department is unavailable or ambiguous. Use an exact department ID from the list.`);
  let email='';try{email=studentEmailValue(value('email'));}catch{throw Error(`Row ${i+2}: enter one valid staff email address.`);}return{displayName:value('staff name'),email,role:value('role').toLowerCase(),departmentId:matches[0].id};
 }));
}
export function parseStaffCsv(text:string,departments:Department[]){const{headers,rows}=csvRows(text);return staffSpreadsheetTable(headers,rows,departments);}
export function parseStaffWorksheet(sheet:Worksheet,departments:Department[]){const{headers,rows}=importWorksheetTable(sheet,100);return staffSpreadsheetTable(headers,rows,departments);}
