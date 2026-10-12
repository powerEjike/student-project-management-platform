import test from 'node:test';import assert from 'node:assert/strict';import {validateTemplateRevision} from '../src/templateRevision.ts';
test('existing programme templates require explicit selection and reject newer revisions',()=>{
 assert.throws(()=>validateTemplateRevision('bio',{lastEventId:'one'},null),/Select it/);
 assert.throws(()=>validateTemplateRevision('bio',{lastEventId:'one'},{id:'other',lastEventId:'one'}),/Select it/);
 assert.throws(()=>validateTemplateRevision('bio',{lastEventId:'two'},{id:'bio',lastEventId:'one'}),/changed while/);
 assert.doesNotThrow(()=>validateTemplateRevision('bio',{lastEventId:'one'},{id:'bio',lastEventId:'one'}));
});
test('new templates remain creatable while selected legacy templates retain compatibility',()=>{
 assert.doesNotThrow(()=>validateTemplateRevision('new',undefined,null));
 assert.doesNotThrow(()=>validateTemplateRevision('new',undefined,{id:'other',lastEventId:'one'}));
 assert.doesNotThrow(()=>validateTemplateRevision('legacy',{}, {id:'legacy'}));
 assert.throws(()=>validateTemplateRevision('bio',undefined,{id:'bio',lastEventId:'one'}),/no longer available/);
});
