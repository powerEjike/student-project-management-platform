import test from 'node:test';import assert from 'node:assert/strict';import {validateDefenceRevision} from '../src/defenceChange.ts';
test('completion rejects a stale decision even after completion was withdrawn again',()=>{
 assert.throws(()=>validateDefenceRevision({lastDefenceEventId:'withdrawn',defenceCleared:false},'original',true),/changed after/);
 assert.throws(()=>validateDefenceRevision({lastDefenceEventId:'first',defenceCleared:true},undefined,false),/changed after/);
});
test('completion revision checks allow current and legacy decisions but reject unchanged status',()=>{
 assert.doesNotThrow(()=>validateDefenceRevision({lastDefenceEventId:'current',defenceCleared:true},'current',false));
 assert.doesNotThrow(()=>validateDefenceRevision({},undefined,true));
 assert.throws(()=>validateDefenceRevision({defenceCleared:true},undefined,true),/already has/);
 assert.throws(()=>validateDefenceRevision({},undefined,false),/already has/);
});
