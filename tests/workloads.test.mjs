import {test} from 'node:test';import assert from 'node:assert/strict';import {supervisorWorkloads} from '../src/workloads.ts';
test('workload counts primary and co roles separately and preserves paused and historical allocations',()=>{
 const base={supervisorId:'primary',supervisorName:'Primary',coSupervisorId:'co',coSupervisorName:'Co',milestones:{m0:{status:'Delayed',dueDate:'2020-01-01'},m1:{status:'In progress',dueDate:'2020-01-01'}}};
 const rows=supervisorWorkloads([{...base,releaseState:'Pending'},{...base,defenceCleared:true},{...base,completedDate:'2020-01-01',defenceCleared:true},{...base,releaseState:'Withheld'},{...base,supervisorId:'former',supervisorName:'Former',coSupervisorId:''}], [{id:'primary',displayName:'Primary'},{id:'co',displayName:'Co'},{id:'zero',displayName:'No allocations'}],'2026-10-11');
 const primary=rows.find(r=>r.id==='primary');assert.deepEqual([primary.active,primary.co,primary.overdue,primary.pending,primary.defence,primary.completed,primary.withheld],[2,0,1,1,1,1,1]);assert.equal(rows.find(r=>r.id==='co').co,2);assert.equal(rows.find(r=>r.id==='former').inDirectory,false);assert.equal(rows.find(r=>r.id==='zero').active,0);
});
