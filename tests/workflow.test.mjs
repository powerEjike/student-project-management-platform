import {test} from 'node:test';
import assert from 'node:assert/strict';
import {todayInLagos,milestonesFrom,overdue} from '../src/workflow.ts';

test('deadline offsets use the Nigerian calendar across midnight and leap day',()=>{
 const approval=new Date('2028-02-28T23:30:00Z');
 assert.equal(todayInLagos(approval),'2028-02-29');
 const plan=milestonesFrom([{name:'Proposal',days:0},{name:'Next stage',days:1}],approval);
 assert.equal(plan.m0.dueDate,'2028-02-29');assert.equal(plan.m1.dueDate,'2028-03-01');
});

test('a deadline becomes overdue the next day and completion removes the flag',()=>{
 const milestone={name:'Proposal',dueDate:'2026-10-11',status:'Under review',note:''};
 assert.equal(overdue(milestone,'2026-10-11'),false);
 assert.equal(overdue(milestone,'2026-10-12'),true);
 assert.equal(overdue({...milestone,status:'Completed'},'2026-10-12'),false);
});
