import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PDFDocument} from 'pdf-lib';import {progressPdf} from '../src/progressPdf.ts';
test('progress PDF embeds accented text, preserves report metadata and paginates long multi-student reports',async()=>{
 const row=['Élodie Student','001/BCH','Biochemistry','Final year','2025/2026','2022/2023','Supervisor','','Long research topic '.repeat(15),'Active','Approved',2,7,1,'Not recorded','',''];
 const bytes=await progressPdf(Array.from({length:40},()=>row),'Department of Biochemistry',{Session:'2025/2026'},new Uint8Array(await readFile('public/fonts/NotoSans-Regular.ttf')),new Date('2026-10-11T12:00:00Z'));const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>1);assert.equal(pdf.getTitle(),'Department of Biochemistry — Student progress report');assert.equal(pdf.getPages()[0].getWidth(),595.28);
});
