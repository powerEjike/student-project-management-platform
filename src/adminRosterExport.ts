import type{Student}from'./models';
import{recordedCgpa}from'./adminRoster.ts';
export async function adminRosterWorkbook(students:Student[],department:string,filters:{session:string;search:string;check:string},generated=new Date()){
 const{default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Student roster');
 sheet.addRow([department+' — Student roster']);sheet.addRow([`Academic session: ${filters.session||'All'} | Search: ${filters.search||'None'} | Record check: ${filters.check==='cgpa'?'CGPA missing or invalid':filters.check==='admission'?'Admission session missing':'All records'}`]);sheet.addRow([`Generated: ${generated.toLocaleString('en-GB',{timeZone:'Africa/Lagos'})} (Lagos) | ${students.length} students`]);
 sheet.addRow(['Student name','Registration number','CGPA','Academic session','Admission session','Programme','Level']);
 for(const student of students)sheet.addRow([student.name,student.matricNumber,recordedCgpa(student)?student.currentCGPA:student.currentCGPA===undefined?'Not recorded':'Check record',student.session,student.admissionSession||'Not recorded',student.programme,student.level]);
 sheet.columns.forEach((column,i)=>{column.width=[32,28,20,23,23,30,20][i];});sheet.getColumn(2).numFmt='@';sheet.getColumn(3).numFmt='0.00';
 for(const n of[1,2,3])sheet.mergeCells(n,1,n,7);sheet.getRow(1).font={bold:true,size:16};sheet.getRow(1).height=30;sheet.getRow(2).height=44;sheet.getRow(3).height=30;
 sheet.eachRow((row,i)=>{row.alignment={vertical:'top',wrapText:true};if(i>=4){let lines=1;row.eachCell((cell,column)=>{lines=Math.max(lines,Math.ceil(String(cell.value??'').length/Math.max(8,(sheet.getColumn(column).width||20)-3)));});row.height=Math.max(30,lines*16+10);}});
 sheet.getRow(4).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(4).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF214D3F'}};sheet.views=[{state:'frozen',ySplit:4}];sheet.autoFilter={from:{row:4,column:1},to:{row:4,column:7}};
 return new Uint8Array(await book.xlsx.writeBuffer());
}
export async function downloadAdminRoster(students:Student[],department:string,filters:{session:string;search:string;check:string}){const bytes=await adminRosterWorkbook(students,department,filters),url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));try{const link=document.createElement('a');link.href=url;link.download='ProjectTrack-student-roster.xlsx';link.click();}finally{setTimeout(()=>URL.revokeObjectURL(url),10000);}}
