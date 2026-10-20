import test from 'node:test';
import assert from 'node:assert/strict';
import {createAssignedRosterLoader} from '../src/assignedRosterLoader.ts';
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
test('saved project refresh keeps the current student available and removes revoked students immediately',async()=>{
 const pending=[];let rows=[],errors=0;
 const loader=createAssignedRosterLoader(()=>{const d=deferred();pending.push(d);return d.promise;},value=>{rows=value;},()=>errors++);
 const first=loader.refresh(['a','b']);pending[0].resolve({id:'a'});pending[1].resolve({id:'b'});await first;
 const student=rows[0],refresh=loader.refresh(['a']);assert.deepEqual(rows,[student]);assert.equal(rows[0],student);
 pending[2].resolve({id:'a',name:'Updated'});await refresh;assert.equal(rows[0].name,'Updated');
 const denied=loader.refresh(['a']);pending[3].reject(new Error('Denied'));await denied;assert.deepEqual(rows,[]);assert.equal(errors,1);
});
test('older reads and errors cannot restore revoked data or overwrite newer snapshots',async()=>{
 const pending=[];let rows=[],errors=0;
 const loader=createAssignedRosterLoader(()=>{const d=deferred();pending.push(d);return d.promise;},value=>{rows=value;},()=>errors++);
 const older=loader.refresh(['old']),newer=loader.refresh(['new']);pending[1].resolve({id:'new'});await newer;pending[0].reject(new Error('Old failure'));await older;
 assert.deepEqual(rows,[{id:'new'}]);assert.equal(errors,0);
 const revoked=loader.refresh(['new']);loader.clear();pending[2].resolve({id:'new'});await revoked;assert.deepEqual(rows,[]);
 const disposed=loader.refresh(['other']);loader.dispose();pending[3].resolve({id:'other'});await disposed;assert.deepEqual(rows,[]);
});
