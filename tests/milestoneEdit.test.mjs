import test from 'node:test';import assert from 'node:assert/strict';import {editedMilestone} from '../src/milestoneEdit.ts';
const original={name:'Chapter one',status:'In progress',dueDate:'2026-10-20',note:'Original note'};
test('full milestone edits reject newer status, deadline or notes rather than overwriting them',()=>{
 for(const changed of [{status:'Under review'},{dueDate:'2026-10-25'},{note:'New feedback'},{name:'Renamed stage'}])assert.throws(()=>editedMilestone({...original,...changed},original,{...original,status:'Completed'}),/changed while/);
});
test('full milestone edits preserve stage identity and trim notes while rejecting unchanged saves',()=>{
 assert.deepEqual(editedMilestone(original,original,{...original,name:'Untrusted name',status:'Under review',note:'  Review submitted  '}),{...original,status:'Under review',note:'Review submitted'});
 assert.throws(()=>editedMilestone(original,original,{...original,note:' Original note '}),/before saving/);
 assert.equal(editedMilestone(original,original,{...original,dueDate:'2026-10-25'}).dueDate,'2026-10-25');
});
