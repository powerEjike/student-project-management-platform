import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {rosterTable} from './studentRoster.ts';
export async function loadRosterWorkbook(source:Uint8Array){
 if(!source.length||source.length>2_000_000)throw Error('Use an Excel workbook smaller than 2 MB.');
 const zip=await JSZip.loadAsync(source);const entries=Object.values(zip.files).filter(e=>!e.dir);let expanded=0;
 for(const entry of entries){const size=(entry as unknown as {_data?:{uncompressedSize:number}})._data?.uncompressedSize;if(size===undefined||size>5_000_000)throw Error('Workbook expansion exceeds the import limit.');expanded+=size;}
 if(entries.length>200||expanded>10_000_000)throw Error('Workbook expansion exceeds the import limit.');
 if(!zip.file('xl/workbook.xml')||entries.some(e=>/vbaProject|externalLinks|embeddings/i.test(e.name)))throw Error('Use a plain .xlsx workbook without macros, embedded files or external links.');
 const book=new ExcelJS.Workbook();await book.xlsx.load(source as never);
 const sheets=book.worksheets.filter(s=>s.state==='visible');if(!sheets.length)throw Error('The workbook has no visible worksheets.');
 return sheets;
}
export function parseRosterWorksheet(sheet:ExcelJS.Worksheet){
 if(sheet.rowCount>1001||sheet.columnCount>20)throw Error('Use a worksheet with a header on row 1, at most 1,000 students and 20 columns. Remove unused formatted rows and columns.');
 const width=sheet.getRow(1).cellCount;if(!width)throw Error('Put column names on row 1.');
 const table:string[][]=[];
 for(let r=1;r<=sheet.rowCount;r++){
  const row=sheet.getRow(r);if(row.hidden)throw Error(`Row ${r}: unhide all rows before importing.`);
  const values:string[]=[];
  for(let c=1;c<=Math.max(width,row.cellCount);c++){
   if(sheet.getColumn(c).hidden)throw Error('Unhide all columns before importing.');
   const cell=row.getCell(c),value=cell.value;
   if(cell.isMerged)throw Error(`Row ${r}: remove merged cells before importing.`);
   if(value!==null&&typeof value!=='string'&&typeof value!=='number')throw Error(`Row ${r}: use plain text or numbers, without formulas, dates or linked cells.`);
   if(typeof value==='number'&&!Number.isFinite(value))throw Error(`Row ${r}: invalid number.`);
   if(r>1&&sheet.getRow(1).getCell(c).text.trim().toLowerCase()==='reg number'&&value!==null&&typeof value!=='string')throw Error(`Row ${r}: registration numbers must be stored as text to preserve leading zeros. Format the cells as Text and re-enter the original numbers.`);
   values.push(value===null?'':String(value));
  }
  if(r===1||values.some(v=>v.trim())){if(values.slice(width).some(v=>v.trim()))throw Error(`Row ${r}: data has no column heading.`);table.push(values.slice(0,width));}
 }
 return rosterTable(table[0],table.slice(1));
}
