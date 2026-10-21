import test from 'node:test';
import assert from 'node:assert/strict';
import {hodMatches,hodOverview,hodSearch} from '../src/hodOverview.ts';
const today='2026-10-21', overdue={studentId:'a',title:'Enzyme activity',milestones:{a:{status:'In progress',dueDate:'2026-10-20'},b:{status:'Pending',dueDate:'2026-10-19'}}};
test('HOD totals count each roster student once and exclude unrelated projects',()=>{
 const students=['a','b','c','d'].map(id=>({id}));
 const projects=[overdue,{studentId:'c',title:'',milestones:{}},{studentId:'d',defenceCleared:true,defenceDate:{toDate:()=>new Date('2026-10-20')}},{...overdue,studentId:'outside'}];
 assert.deepEqual(hodOverview(students,projects,today),{unassigned:1,folder:1,overdue:1,ready:1});
});
test('overdue work uses real past dates and excludes finished or paused projects',()=>{
 for(const dueDate of['2026-10-21','2026-10-22','2026-02-30','2025-02-29',''])assert.equal(hodMatches({...overdue,milestones:{a:{status:'Pending',dueDate}}},'overdue',today),false);
 assert.equal(hodMatches({...overdue,milestones:{a:{status:'Pending',dueDate:'2024-02-29'}}},'overdue',today),true);
 for(const changes of[{completedDate:'2026-10-20'},{defenceCleared:true},{releaseState:'Pending'},{releaseState:'Withheld'},{milestones:{a:{status:'Completed',dueDate:'2026-10-20'}}}])assert.equal(hodMatches({...overdue,...changes},'overdue',today),false);
});
test('folder, topic, active and defence filters reflect the student lifecycle',()=>{
 assert.equal(hodMatches(undefined,'unassigned',today),true);
 assert.equal(hodMatches({title:'',milestones:{}},'folder',today),true);
 assert.equal(hodMatches(overdue,'topic',today),true);
 assert.equal(hodMatches({...overdue,topicDecision:'Approved'},'active',today),true);
 assert.equal(hodMatches({defenceCleared:true},'ready',today),false);
 assert.equal(hodMatches({defenceCleared:true,defenceDate:{toDate:()=>new Date('invalid')}},'ready',today),false);
 assert.equal(hodMatches({...overdue,completedDate:'2026-10-20'},'archived',today),true);
});
test('HOD search combines name registration topic and supervisor without case sensitivity',()=>{
 const student={name:'Ada Example',matricNumber:'BCH/001'},project={title:'Enzyme activity',supervisorName:'Roland Oplekwu'};
 assert.equal(hodSearch(student,project,' ADA enzyme roland '),true);
 assert.equal(hodSearch(student,project,'bch/001'),true);
 assert.equal(hodSearch(student,project,'enzyme glucose'),false);
 assert.equal(hodSearch(student,undefined,''),true);
});
import {hodProgress} from '../src/hodOverview.ts';
test('HOD next stage follows template order even when later stages finish first',()=>{
 const p={milestones:{m2:{name:'Methods',status:'Completed'},m1:{name:'Introduction',status:'Under review',dueDate:'2026-10-30'},m0:{name:'Abstract',status:'Completed'},m10:{name:'Final draft',status:'Not started'}}};
 const result=hodProgress(p);assert.equal(result.complete,2);assert.equal(result.next.name,'Introduction');assert.deepEqual(result.stages.map(s=>s.name),['Abstract','Introduction','Methods','Final draft']);
 for(const changes of[{completedDate:'2026-10-20'},{defenceCleared:true},{releaseState:'Pending'},{releaseState:'Withheld'}])assert.equal(hodProgress({...p,...changes}).next,undefined);
 assert.equal(hodProgress(undefined).next,undefined);assert.equal(hodProgress({milestones:{m0:{status:'Completed'}}}).next,undefined);
});
test('HOD last progress date uses Nigerian time and missing evidence stays unknown',()=>{
 assert.equal(hodProgress({lastSupervisorUpdateAt:{toDate:()=>new Date('2026-10-20T23:30:00Z')}}).updated,'21 Oct 2026');
 for(const lastSupervisorUpdateAt of[undefined,{toDate:()=>new Date('invalid')},{toDate:()=>{throw Error('Invalid timestamp')}}])assert.equal(hodProgress({lastSupervisorUpdateAt}).updated,'');
});
