import type{ClassSession,ClassCheckIn}from'./classAttendanceData.ts';
import{classEndsAt}from'./classAttendanceData.ts';
export async function classAttendanceWorkbook(session:ClassSession,rows:ClassCheckIn[]){
 const{default:ExcelJS}=await import('exceljs'),book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Attendance');
 const date=(value?:{toDate:()=>Date})=>value?.toDate().toLocaleString('en-GB',{timeZone:'Africa/Lagos'})||'Not recorded';
 sheet.addRow(['ProjectTrack — Class attendance']);sheet.addRow([session.title+' · '+session.session]);sheet.addRow(['Lecturer: '+session.ownerName]);sheet.addRow(['Started: '+date(session.createdAt)+' | Ended: '+(classEndsAt(session)?.toLocaleString('en-GB',{timeZone:'Africa/Lagos'})||'Not recorded')+' (Lagos)']);sheet.addRow([rows.length+' students checked in']);sheet.addRow(['Student','Registration number','Checked in (Lagos)']);
 for(const row of [...rows].sort((a,b)=>a.studentName.localeCompare(b.studentName)))sheet.addRow([row.studentName,row.matricNumber,date(row.checkedAt)]);
 sheet.columns.forEach((c,i)=>c.width=[40,30,30][i]);for(let i=1;i<=5;i++){sheet.mergeCells(i,1,i,3);sheet.getRow(i).height=i===4?44:30;}sheet.eachRow(row=>{row.alignment={wrapText:true,vertical:'top'};});sheet.getRow(1).font={bold:true,size:16};sheet.getRow(6).font={bold:true};sheet.views=[{state:'frozen',ySplit:6}];sheet.autoFilter={from:{row:6,column:1},to:{row:6,column:3}};
 return new Uint8Array(await book.xlsx.writeBuffer());
}
export async function downloadClassAttendance(session:ClassSession,rows:ClassCheckIn[]){const bytes=await classAttendanceWorkbook(session,rows),url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));try{const a=document.createElement('a');a.href=url;a.download='ProjectTrack-attendance-'+session.id+'.xlsx';a.click();}finally{setTimeout(()=>URL.revokeObjectURL(url),10000);}}
