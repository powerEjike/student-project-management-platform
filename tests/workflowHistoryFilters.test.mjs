import test from 'node:test';import assert from 'node:assert/strict';import {filterWorkflowHistory} from '../src/workflowHistoryFilters.ts';
const filters={kind:'',search:'',from:'',to:''};const rows=[{id:'topic',kind:'topic',decision:'Changes requested',note:'Revise objectives',actorName:'Élodie',createdAt:{toDate:()=>new Date('2026-10-10T23:30:00Z')}},{id:'stage',kind:'progress',actorName:'Roland',current:{name:'Chapter one',status:'Completed',note:'Objectives reviewed'},createdAt:{toDate:()=>new Date('2026-10-10T12:00:00Z')}},{id:'legacy',kind:'topic',decision:'Rejected'}];
test('workflow history combines type and all-word Unicode searches and preserves newest-first order',()=>{
 assert.deepEqual(filterWorkflowHistory(rows,{...filters,kind:'topic',search:'e\u0301lodie objectives'}).map(r=>r.id),['topic']);
 assert.deepEqual(filterWorkflowHistory(rows,{...filters,kind:'progress',search:'chapter reviewed'}).map(r=>r.id),['stage']);
 assert.deepEqual(filterWorkflowHistory(rows,filters).map(r=>r.id),['topic','stage','legacy']);
});
test('workflow history dates use inclusive Nigerian recording dates and exclude missing dates only when filtered',()=>{
 assert.deepEqual(filterWorkflowHistory(rows,{...filters,from:'2026-10-11',to:'2026-10-11'}).map(r=>r.id),['topic']);
 assert.deepEqual(filterWorkflowHistory(rows,{...filters,to:'2026-10-10'}).map(r=>r.id),['stage']);
 assert.deepEqual(filterWorkflowHistory(rows,{...filters,from:'2026-10-12',to:'2026-10-01'}),[]);
});
