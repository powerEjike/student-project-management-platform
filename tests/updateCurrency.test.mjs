import test from 'node:test';import assert from 'node:assert/strict';import {updateCurrency} from '../src/updateCurrency.ts';
const stamp=date=>({toDate:()=>new Date(date)});
test('currency separates recent, threshold-boundary stale and missing times with primary-only denominators',()=>{
 const p={supervisorId:'z',supervisorName:'Zed',coSupervisorId:'a'};
 const rows=updateCurrency([{...p,lastSupervisorUpdateAt:stamp('2026-10-10T23:00:00Z')},{...p,lastSupervisorUpdateAt:stamp('2026-09-27T12:00:00Z')},p,{...p,completedDate:'2026-10-01'},{...p,releaseState:'Withheld'},{...p,defenceCleared:true}],[{id:'a',displayName:'Amy'},{id:'z',displayName:'Zed'}],'2026-10-11',14);
 assert.deepEqual(rows.map(r=>r.displayName),['Amy','Zed']);assert.equal(rows[0].percent,null);assert.deepEqual([rows[1].total,rows[1].recent,rows[1].stale,rows[1].unknown,rows[1].percent],[3,1,1,1,33]);
});
test('currency responds to reminder period and retains former supervisors with pending projects',()=>{
 const p={supervisorId:'former',supervisorName:'Former',releaseState:'Pending',lastSupervisorUpdateAt:stamp('2026-10-01T12:00:00Z')};
 assert.equal(updateCurrency([p],[],'2026-10-11',7)[0].stale,1);assert.equal(updateCurrency([p],[],'2026-10-11',14)[0].recent,1);
});
