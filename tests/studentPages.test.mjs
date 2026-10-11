import test from 'node:test';import assert from 'node:assert/strict';import {studentPage,selectStudentPage} from '../src/studentPages.ts';
test('student pagination shows 25 records, clamps after filters shrink and preserves empty ranges',()=>{
 const rows=Array.from({length:200},(_,i)=>i);const last=studentPage(rows,7);assert.equal(last.pages,8);assert.equal(last.first,176);assert.equal(last.last,200);assert.equal(last.rows.length,25);assert.deepEqual(studentPage([1,2],7).rows,[1,2]);assert.equal(studentPage([],7).first,0);
});
test('page selection preserves other pages and removes only visible eligible students without duplicates',()=>{
 assert.deepEqual(selectStudentPage(['other','a'],['a','b'],true),['other','a','b']);assert.deepEqual(selectStudentPage(['other','a','b'],['a','b'],false),['other']);assert.deepEqual(selectStudentPage(['other'],[],true),['other']);
});
