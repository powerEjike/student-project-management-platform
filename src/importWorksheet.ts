import type{Worksheet}from'exceljs';
export function importWorksheetTable(sheet:Worksheet,maxRows:number,registrationText=false){
 if(sheet.rowCount>maxRows+1||sheet.columnCount>20)throw Error(`Use a worksheet with a header on row 1, at most ${maxRows} records and 20 columns. Remove unused formatted rows and columns.`);
 const width=sheet.getRow(1).cellCount;if(!width)throw Error('Put column names on row 1.');const table:string[][]=[];
 for(let r=1;r<=sheet.rowCount;r++){
  const row=sheet.getRow(r);if(row.hidden)throw Error(`Row ${r}: unhide all rows before importing.`);const values:string[]=[];
  for(let c=1;c<=Math.max(width,row.cellCount);c++){
   if(sheet.getColumn(c).hidden)throw Error('Unhide all columns before importing.');const cell=row.getCell(c),value=cell.value;
   if(cell.isMerged)throw Error(`Row ${r}: remove merged cells before importing.`);
   if(value!==null&&typeof value!=='string'&&typeof value!=='number')throw Error(`Row ${r}: use plain text or numbers, without formulas, dates or linked cells.`);
   if(typeof value==='number'&&!Number.isFinite(value))throw Error(`Row ${r}: invalid number.`);
   if(registrationText&&r>1&&sheet.getRow(1).getCell(c).text.trim().toLowerCase()==='reg number'&&value!==null&&typeof value!=='string')throw Error(`Row ${r}: registration numbers must be stored as text to preserve leading zeros. Format the cells as Text and re-enter the original numbers.`);
   values.push(value===null?'':String(value));
  }
  if(r===1||values.some(v=>v.trim())){if(values.slice(width).some(v=>v.trim()))throw Error(`Row ${r}: data has no column heading.`);table.push(values.slice(0,width));}
 }
 return{headers:table[0],rows:table.slice(1)};
}
