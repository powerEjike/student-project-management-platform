import test from 'node:test';import assert from 'node:assert/strict';import {allocationPlan} from '../src/allocationPlan.ts';
const lecturers=[{id:'a',displayName:'A'},{id:'b',displayName:'B'}];const students=['new','moving','same','done','held','pending'].map(id=>({id,name:id,matricNumber:id}));
const projects=[{studentId:'moving',supervisorId:'b',coSupervisorId:'a'},{studentId:'same',supervisorId:'a',coSupervisorId:''},{studentId:'done',supervisorId:'a',completedDate:'2026-10-10'},{studentId:'held',supervisorId:'a',releaseState:'Withheld'},{studentId:'pending',supervisorId:'a',releaseState:'Pending'}];
test('allocation preview counts real changes once, skips identical allocations and projects role transitions',()=>{
 const p=allocationPlan(['new','new','moving','same'],students,projects,lecturers,'a','b');assert.equal(p.issues.length,0);assert.deepEqual(p.changeIds,['new','moving','same']);assert.deepEqual(p.workloads[0],{id:'a',name:'A',primaryBefore:2,primaryAfter:4,coBefore:1,coAfter:0});assert.equal(p.workloads[1].primaryAfter,0);assert.equal(p.workloads[1].coAfter,3);
 const same=allocationPlan(['same'],students,projects,lecturers,'a','');assert.equal(same.unchanged,1);assert.deepEqual(same.changeIds,[]);assert.ok(same.issues.length);
});
test('allocation preview blocks unavailable students, restricted projects and invalid supervisor choices',()=>{
 for(const id of ['missing','done','held','pending'])assert.ok(allocationPlan([id],students,projects,lecturers,'a','').issues.length);
 for(const [primary,co]of [['',''],['inactive',''],['a','a'],['a','inactive']])assert.ok(allocationPlan(['new'],students,projects,lecturers,primary,co).issues.length);
});
