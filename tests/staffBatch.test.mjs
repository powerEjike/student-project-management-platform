import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStaffBatch,existingStaffDecision,runStaffBatch,staffBatchUid} from '../scripts/staff-batch-core.mjs';
const row={email:'lecturer@example.edu',displayName:'Example Lecturer',role:'lecturer',departmentId:'biochemistry'};
test('staff batches validate the entire input, normalize email and forbid privilege/password fields',()=>{
  assert.equal(parseStaffBatch([{...row,email:' Lecturer@Example.edu '}])[0].email,row.email);
  for(const input of [[],Array(101).fill(row),[row,{...row,email:'LECTURER@example.edu'}],[{...row,role:'admin'}],[{...row,password:'secret'}],[{...row,departmentId:'../staff'}],[{...row,displayName:' '}],[{...row,email:'a@b'}]]) assert.throws(()=>parseStaffBatch(input));
  assert.equal(staffBatchUid(row.email),staffBatchUid(row.email));
  assert.notEqual(staffBatchUid(row.email),staffBatchUid('other@example.edu'));
});
test('existing staff are skipped only for an exact active assignment; accounts are never adopted or overwritten',()=>{
  const user={uid:'existing',disabled:false};const staff={...row,active:true};
  assert.equal(existingStaffDecision(row,null,null).state,'create');
  assert.equal(existingStaffDecision(row,user,staff).state,'skip');
  for(const [account,record] of [[user,null],[{...user,disabled:true},staff],[user,{...staff,active:false}],[user,{...staff,role:'hod'}],[user,{...staff,departmentId:'other'}],[user,{...staff,displayName:'Other'}]]) assert.equal(existingStaffDecision(row,account,record).state,'conflict');
});
test('preview and any preflight conflict perform zero mutations',async()=>{
  let writes=0;const adapter={inspect:async()=>({state:'create'}),createAuth:async()=>{writes++;},approve:async()=>{writes++;}};
  assert.equal((await runStaffBatch([row],adapter)).applied,false);
  const result=await runStaffBatch([row,{...row,email:'other@example.edu'}],{...adapter,inspect:async r=>({state:r.email===row.email?'create':'conflict'})},true);
  assert.equal(result.applied,false);assert.equal(writes,0);
});
test('onboarding retries skip completed accounts and stops on changed access or partial Auth failure',async()=>{
  const rows=[row,{...row,email:'second@example.edu'},{...row,email:'third@example.edu'}];
  const saved=new Map();let approvals=0;
  const adapter={inspect:async r=>({state:saved.has(r.email)?'skip':'create'}),createAuth:async r=>staffBatchUid(r.email),approve:async r=>{approvals++;if(r.email===rows[1].email)throw Error('database unavailable');saved.set(r.email,true);}};
  const result=await runStaffBatch(rows,adapter,true);
  assert.equal(result.incomplete,true);assert.equal(result.results.length,2);assert.equal(result.results[0].state,'created');assert.equal(result.results[1].state,'auth-created-access-pending');assert.equal(approvals,2);
  let inspections=0;let created=false;
  const changed=await runStaffBatch([row],{inspect:async()=>({state:++inspections===1?'create':'conflict'}),createAuth:async()=>{created=true;}},true);
  assert.equal(changed.results[0].state,'failed');assert.equal(created,false);
  const retry=await runStaffBatch([row],adapter,true);assert.equal(retry.results[0].state,'skipped');assert.equal(approvals,2);
});
test('a successful batch creates and approves sequentially and reruns without duplicate accounts',async()=>{
  const rows=[row,{...row,email:'head@example.edu',role:'hod'}];const saved=new Set();const calls=[];
  const adapter={inspect:async r=>({state:saved.has(r.email)?'skip':'create'}),createAuth:async r=>{calls.push(`auth:${r.email}`);return staffBatchUid(r.email);},approve:async(r,uid)=>{assert.equal(uid,staffBatchUid(r.email));calls.push(`approve:${r.email}`);saved.add(r.email);}};
  const result=await runStaffBatch(rows,adapter,true);
  assert.equal(result.incomplete,false);assert.deepEqual(result.results.map(r=>r.state),['created','created']);
  assert.deepEqual(calls,['auth:lecturer@example.edu','approve:lecturer@example.edu','auth:head@example.edu','approve:head@example.edu']);
  const retry=await runStaffBatch(rows,adapter,true);assert.deepEqual(retry.results.map(r=>r.state),['skipped','skipped']);assert.equal(calls.length,4);
});
