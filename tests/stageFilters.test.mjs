import test from 'node:test';import assert from 'node:assert/strict';import {matchesMilestone} from '../src/milestoneSelection.ts';
const p={milestones:{a:{name:'Proposal',status:'Completed',dueDate:'2020-01-01'},b:{name:'Analysis',status:'In progress',dueDate:'2026-10-11'},c:{name:'Final draft',status:'Delayed',dueDate:'2026-10-10'}}};
test('milestone name and status match the same stage, never separate stages',()=>{
 assert.equal(matchesMilestone(p,'Proposal','Completed','2026-10-11'),true);assert.equal(matchesMilestone(p,'Proposal','Delayed','2026-10-11'),false);assert.equal(matchesMilestone(p,'','Delayed','2026-10-11'),true);assert.equal(matchesMilestone(p,'Analysis','','2026-10-11'),true);
});
test('overdue filtering respects inclusive due date and completion; missing milestones match only unrestricted filters',()=>{
 assert.equal(matchesMilestone(p,'Proposal','Overdue','2026-10-11'),false);assert.equal(matchesMilestone(p,'Analysis','Overdue','2026-10-11'),false);assert.equal(matchesMilestone(p,'Analysis','Overdue','2026-10-12'),true);assert.equal(matchesMilestone(p,'Final draft','Overdue','2026-10-11'),true);assert.equal(matchesMilestone(undefined,'','','2026-10-11'),true);assert.equal(matchesMilestone(undefined,'','In progress','2026-10-11'),false);
});
