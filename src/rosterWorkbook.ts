import{importWorksheetTable}from'./importWorksheet.ts';
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
export function parseRosterWorksheet(sheet:ExcelJS.Worksheet){const{headers,rows}=importWorksheetTable(sheet,1000,true);return rosterTable(headers,rows);}
