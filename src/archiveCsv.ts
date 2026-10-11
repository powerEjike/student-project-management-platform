import {csvRows} from './csvRows.ts';import {titleKey,type ArchiveInput,type ArchiveEntry} from './archive.ts';
export function parseArchiveCsv(text:string):ArchiveInput[]{
 const {headers,rows}=csvRows(text);const author=headers.indexOf('student name'),title=headers.indexOf('project topic')>=0?headers.indexOf('project topic'):headers.indexOf('topic title'),year=headers.indexOf('year')>=0?headers.indexOf('year'):headers.indexOf('year of research');
 if(author<0||title<0||year<0)throw Error('Required columns: Student Name, Project Topic (or Topic Title), and Year.');
 if(!rows.length||rows.length>1000)throw Error('Upload between 1 and 1,000 archive records at a time.');
 const seen=new Set<string>();return rows.map((cells,i)=>{
  if(cells.length!==headers.length)throw Error(`Row ${i+2}: column count does not match the header.`);
  const value={author:cells[author].trim(),title:cells[title].trim(),year:Number(cells[year].trim()),programme:'Biochemistry'};
  if(!value.author||value.author.length>120||!titleKey(value.title)||value.title.length>300||!/^\d{4}$/.test(cells[year].trim())||value.year<1900||value.year>2100)throw Error(`Row ${i+2}: check the student name, topic title and research year.`);
  const key=archiveCsvKey(value);if(seen.has(key))throw Error(`Row ${i+2}: duplicate archive record in this CSV.`);seen.add(key);return value;
 });
}
export const archiveCsvKey=(r:Pick<ArchiveInput,'title'|'author'|'year'>)=>JSON.stringify([titleKey(r.title),titleKey(r.author),r.year]);
export function archiveImportPlan(rows:ArchiveInput[],entries:ArchiveEntry[]){const existing=new Map(entries.map(e=>[archiveCsvKey(e),e]));return {newRows:rows.filter(r=>!existing.has(archiveCsvKey(r))),skipped:rows.filter(r=>existing.has(archiveCsvKey(r))).length,withdrawn:rows.filter(r=>existing.get(archiveCsvKey(r))?.active===false).length};}
