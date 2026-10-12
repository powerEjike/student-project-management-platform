import test from 'node:test';import assert from 'node:assert/strict';import {validateArchiveChange} from '../src/archiveChange.ts';
test('archive changes reject stale submissions including a withdraw and restore cycle',()=>{
 assert.throws(()=>validateArchiveChange({active:true,lastEventId:'restored'},'original',false,'Duplicate'),/changed after/);
 assert.throws(()=>validateArchiveChange({active:false,lastEventId:'withdrawn'},'original',false,'Duplicate'),/changed after/);
 assert.throws(()=>validateArchiveChange({active:true,lastEventId:'first'},undefined,false,'Duplicate'),/changed after/);
});
test('archive changes validate reasons and preserve legacy entries without recorded revisions',()=>{
 assert.equal(validateArchiveChange({active:true},undefined,false,'  Duplicate record  '),'Duplicate record');
 assert.equal(validateArchiveChange({active:false,lastEventId:'v1'},'v1',true,'Verified original'),'Verified original');
 assert.throws(()=>validateArchiveChange({active:true},undefined,true,'Unchanged'),/already has/);
 assert.throws(()=>validateArchiveChange({active:true},undefined,false,'   '),/reason/);
 assert.throws(()=>validateArchiveChange({active:true},undefined,false,'x'.repeat(501)),/500/);
});
