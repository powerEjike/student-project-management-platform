import test from 'node:test';import assert from 'node:assert/strict';import {progressColumns,progressRows} from '../src/progressReport.ts';
const student=(id)=>({id,name:'Synthetic Student',matricNumber:'001/BCH',programme:'BSc Biochemistry',level:'Final year',session:'2025/2026',admissionSession:'2022/2023'});
test('progress report exports only supplied students and preserves sessions, unknown timing and numeric counts',()=>{
 const rows=progressRows([student('selected')],[{studentId:'hidden',status:'Active',supervisorName:'Other'}],'2026-10-11');
 assert.equal(rows.length,1);assert.equal(rows[0].length,progressColumns.length);assert.equal(rows[0][4],'2025/2026');assert.equal(rows[0][5],'2022/2023');assert.equal(rows[0][9],'Awaiting allocation');assert.equal(rows[0][14],'Not recorded');assert.equal(rows[0][12],0);
});
test('progress report distinguishes completed, withheld, pending release and cleared projects without exporting private notes',()=>{
 const projects=['completed','withheld','pending','cleared'].map(id=>({studentId:id,status:'Active',supervisorName:'Supervisor',coSupervisorName:'Co',title:'Topic',note:'Private note',milestones:{a:{status:'Completed',dueDate:'2020-01-01'},b:{status:'In progress',dueDate:'2020-01-01'}},...({completed:{completedDate:'2026-10-10'},withheld:{releaseState:'Withheld'},pending:{releaseState:'Pending'},cleared:{defenceCleared:true,defenceDate:{toDate:()=>new Date('2026-10-10T23:30:00Z')}}}[id])}));
 const rows=progressRows(projects.map(p=>student(p.studentId)),projects,'2026-10-11');
 assert.deepEqual(rows.map(r=>r[9]),['Defence finished & archived','Withheld','Release requested','Completed — ready for defence']);assert.equal(rows[0][13],0);assert.equal(rows[2][13],1);assert.equal(rows[3][15],'2026-10-11');assert.equal(rows[0][16],'2026-10-10');assert.ok(!JSON.stringify(rows).includes('Private note'));
});
import {progressWorkbook} from '../src/progressExport.ts';import ExcelJS from 'exceljs';
test('Excel report preserves registration text and formula-like names as literal values with usable table filters',async()=>{
 const row=['=SUM(1,1)','001/BCH','Biochemistry','Final year','2025/2026','2022/2023','Élodie','', 'Résumé','Awaiting topic','Awaiting topic',0,0,0,'Not recorded','',''];
 const bytes=await progressWorkbook([row],'Department of Biochemistry',{Session:'2025/2026'},new Date('2026-10-11T12:00:00Z'));
 const book=new ExcelJS.Workbook();await book.xlsx.load(bytes);const sheet=book.getWorksheet('Student progress');assert.equal(sheet.getCell('A5').value,'=SUM(1,1)');assert.equal(sheet.getCell('B5').value,'001/BCH');assert.equal(sheet.getCell('G5').value,'Élodie');assert.equal(sheet.getCell('L5').value,0);assert.equal(sheet.getCell('O5').value,'Not recorded');assert.equal(sheet.autoFilter,'A4:Q5');assert.equal(sheet.views[0].ySplit,4);assert.ok(sheet.getCell('C3').value===null);assert.match(sheet.getCell('A3').value,/2025\/2026/);
});
