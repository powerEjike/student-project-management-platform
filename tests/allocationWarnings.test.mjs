import test from 'node:test';import assert from 'node:assert/strict';import {allocationWarnings} from '../src/allocationWarnings.ts';
const plan={workloads:[{id:'one',name:'One',primaryAfter:10,coAfter:30},{id:'two',name:'Two',primaryAfter:12,coAfter:0}]};
test('allocation warnings use projected primary workloads and warn only above the chosen limit',()=>{assert.deepEqual(allocationWarnings(plan,'10'),[{id:'two',name:'Two',total:12,excess:2,maximum:10}]);assert.equal(allocationWarnings(plan,'12').length,0);});
test('blank or invalid limits never become invented capacity policies',()=>{for(const value of ['', '0','-1','2.5','abc','1001'])assert.deepEqual(allocationWarnings(plan,value),[]);assert.equal(allocationWarnings(plan,'1').length,2);});
