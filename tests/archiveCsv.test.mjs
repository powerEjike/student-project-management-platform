import test from 'node:test';import assert from 'node:assert/strict';import {parseArchiveCsv as parse,archiveImportPlan} from '../src/archiveCsv.ts';
test('archive CSV preserves quoted titles, ignores registration numbers and needs no supervisor',()=>{
 const rows=parseArchiveCsv('Student Name,Reg Number,Project Topic,Year\r\nStudent,BIO/001,"Enzyme, activity",2020');assert.deepEqual(rows,[{author:'Student',title:'Enzyme, activity',year:2020,programme:'Biochemistry'}]);assert.equal(parseArchiveCsv('Student Name,Topic Title,Year of Research\nStudent,Topic,2021')[0].year,2021);
});
test('archive CSV rejects malformed metadata and duplicate normalized records while different years remain separate',()=>{
 for(const text of ['Student Name,Project Topic,Year\n,Topic,2020','Student Name,Project Topic,Year\nStudent,!!!,2020','Student Name,Project Topic,Year\nStudent,Topic,20','Student Name,Project Topic,Year\nStudent,Topic,2020\nSTUDENT,TOPIC!,2020'])assert.throws(()=>parseArchiveCsv(text));assert.equal(parseArchiveCsv('Student Name,Project Topic,Year\nStudent,Topic,2020\nStudent,Topic,2021').length,2);
});
test('archive import preview skips original and withdrawn entries without restoring them',()=>{
 const rows=parseArchiveCsv('Student Name,Project Topic,Year\nStudent,Topic,2020\nOther,Other topic,2021');const existing=[{author:'STUDENT',title:'TOPIC!',year:2020,active:false}];const plan=archiveImportPlan(rows,existing);assert.equal(plan.skipped,1);assert.equal(plan.withdrawn,1);assert.deepEqual(plan.newRows,[rows[1]]);assert.equal(existing[0].active,false);
});

function parseArchiveCsv(text,programme='Biochemistry'){return parse(text,programme);}
test('archive CSV uses the chosen department programme and rejects an unspecified programme',()=>{const csv='Student Name,Project Topic,Year\nSynthetic,Enzyme activity,2024';assert.equal(parse(csv,'BSc Chemistry')[0].programme,'BSc Chemistry');assert.equal(parse(csv,'BSc Physics')[0].programme,'BSc Physics');assert.throws(()=>parse(csv,''));assert.throws(()=>parse(csv,undefined));});
