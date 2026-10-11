import {progressColumns} from './progressReport.ts';
export async function progressWorkbook(rows:(string|number)[][],department:string,filters:Record<string,string>,generated=new Date()){
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();book.creator='ProjectTrack';
 const sheet=book.addWorksheet('Student progress');
 sheet.addRow([`${department} — Student progress report`]);
 sheet.addRow([`Generated: ${generated.toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} (Lagos) | Students: ${rows.length}`]);
 sheet.addRow([Object.entries(filters).map(([k,v])=>`${k}: ${v||'All'}`).join(' | ')]);
 sheet.addRow(progressColumns);rows.forEach(row=>sheet.addRow(row));
 sheet.columns.forEach((c,i)=>{c.width=[28,24,24,16,20,20,28,28,65,24,22,18,18,18,26,22,20][i];});
 sheet.getRow(1).font={bold:true,size:14};sheet.getRow(4).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(4).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF183F33'}};
 sheet.eachRow(row=>{row.alignment={vertical:'top',wrapText:true};});
 sheet.views=[{state:'frozen',ySplit:4,xSplit:2}];sheet.autoFilter={from:{row:4,column:1},to:{row:4+rows.length,column:progressColumns.length}};
 sheet.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'4:4'};
 return new Uint8Array(await book.xlsx.writeBuffer());
}
export async function exportProgress(rows:(string|number)[][],department:string,filters:Record<string,string>,kind:'xlsx'|'pdf'='xlsx'){
 let bytes:Uint8Array;if(kind==='pdf'){const {progressPdf}=await import('./progressPdf');const response=await fetch('/fonts/NotoSans-Regular.ttf');if(!response.ok)throw Error('Could not load report font.');bytes=await progressPdf(rows,department,filters,new Uint8Array(await response.arrayBuffer()));}else bytes=await progressWorkbook(rows,department,filters);
 const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:kind==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const link=document.createElement('a');link.href=url;link.download=`ProjectTrack-student-progress.${kind}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
