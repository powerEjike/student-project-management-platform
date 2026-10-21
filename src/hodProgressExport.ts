import type{Student,Project}from'./models';
import{hodProgress}from'./hodOverview.ts';
import{projectStatusLabel}from'./projectStatusLabel.ts';
export async function hodProgressWorkbook(students:Student[],projects:Project[],department:string,filters:Record<string,string>,generated=new Date()){
 const{default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Student progress');const map=new Map(projects.map(p=>[p.studentId,p]));
 sheet.addRow([`${department} — Student progress`]);
 sheet.addRow([Object.entries(filters).map(([key,value])=>`${key}: ${value||'All'}`).join(' | ')]);
 sheet.addRow([`Generated: ${generated.toLocaleString('en-GB',{timeZone:'Africa/Lagos'})} (Lagos) · ${students.length} students`]);
 sheet.addRow(['Student name','Registration number','Academic session','Programme','Level','Supervisor','Project topic','Project status','Completed stages','Total stages','Next stage','Next stage status','Next deadline','Last supervisor update']);
 for(const student of students){const project=map.get(student.id),summary=hodProgress(project);sheet.addRow([student.name,student.matricNumber,student.session,student.programme,student.level,project?.supervisorName||'Unassigned',project?.title||'',projectStatusLabel(project)||'Awaiting update',summary.complete,summary.stages.length,summary.next?.name||'',summary.next?.status||'',summary.next?.dueDate||'',summary.updated||'Unknown']);}
 sheet.columns.forEach((column,i)=>{column.width=[28,26,22,24,18,28,65,32,18,16,25,20,20,25][i];});
 for(const row of[1,2,3])sheet.mergeCells(row,1,row,14);sheet.getRow(1).font={bold:true,size:16};sheet.getRow(1).height=30;sheet.getRow(2).height=44;sheet.getRow(3).height=24;
 sheet.eachRow((row,index)=>{row.alignment={vertical:'top',wrapText:true};if(index>=4){let lines=1;row.eachCell((cell,column)=>{lines=Math.max(lines,Math.ceil(String(cell.value??'').length/Math.max(8,(sheet.getColumn(column).width||20)-3)));});row.height=Math.max(index===4?36:30,lines*16+10);}});sheet.getRow(4).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(4).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF214D3F'}};
 sheet.views=[{state:'frozen',ySplit:4}];sheet.autoFilter={from:{row:4,column:1},to:{row:4,column:14}};sheet.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0};
 return new Uint8Array(await book.xlsx.writeBuffer());
}
export async function downloadHodProgress(students:Student[],projects:Project[],department:string,filters:Record<string,string>){
 const bytes=await hodProgressWorkbook(students,projects,department,filters);const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 try{const link=document.createElement('a');link.href=url;link.download='ProjectTrack-student-progress.xlsx';link.click();}finally{setTimeout(()=>URL.revokeObjectURL(url),10000);}
}
