import {test} from 'node:test';import assert from 'node:assert/strict';import {titleKey,archiveId} from '../src/archive.ts';
test('archive matching ignores punctuation, case and whitespace without treating different words as a match',()=>{
 assert.equal(titleKey('  ENZYME:  Activity\nIn Maize! '),'enzyme activity in maize');
 assert.equal(titleKey('Enzyme activity in maize'),'enzyme activity in maize');
 assert.notEqual(titleKey('Enzyme activity in rice'),titleKey('Enzyme activity in maize'));
 assert.equal(titleKey('Étude du résumé!'),'étude du résumé');
});
test('identical historical metadata has one deterministic identity and different years remain separate',async()=>{
 const entry={title:'Enzyme activity!',author:'Student A',year:2024,supervisor:'Staff A',programme:'BSc Biochemistry'};
 assert.equal(await archiveId('dept-a',entry),await archiveId('dept-a',{...entry,title:'ENZYME ACTIVITY'}));
 assert.notEqual(await archiveId('dept-a',entry),await archiveId('dept-a',{...entry,year:2025}));
 assert.notEqual(await archiveId('dept-a',entry),await archiveId('dept-b',entry));
});
