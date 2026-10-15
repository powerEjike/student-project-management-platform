import {createHash} from 'node:crypto';

export {parseStaffBatch} from '../src/staffBatchInput.mjs';

export const staffBatchUid = email => `batch_${createHash('sha256').update(email).digest('hex').slice(0,48)}`;

export function existingStaffDecision(row, user, staff) {
  if (!user) return {state:'create'};
  if (!user.disabled && staff?.active === true && staff.role === row.role && staff.departmentId === row.departmentId && staff.displayName === row.displayName) return {state:'skip',uid:user.uid};
  return {state:'conflict',message:'An Authentication account already exists with missing, disabled or different staff access. Manage it separately; this batch will not change it.'};
}

// The adapter performs trusted credential operations. All rows are preflighted before any write.
export async function runStaffBatch(rows, adapter, apply = false) {
  const plan = [];
  for (const row of rows) plan.push({...row,...await adapter.inspect(row)});
  if (!apply || plan.some(row => row.state === 'conflict')) return {applied:false,plan,results:[]};
  const results = [];
  for (const row of plan) {
    if (row.state === 'skip') {results.push({email:row.email,state:'skipped'});continue;}
    let createdUid;
    try {
      const fresh = await adapter.inspect(row);
      if (fresh.state === 'skip') {results.push({email:row.email,state:'skipped'});continue;}
      if (fresh.state !== 'create') throw Error(fresh.message || 'Account changed after preview.');
      createdUid = await adapter.createAuth(row);
      await adapter.approve(row,createdUid);
      results.push({email:row.email,state:'created',uid:createdUid});
    } catch (error) {
      results.push({email:row.email,state:createdUid?'auth-created-access-pending':'failed',uid:createdUid,message:error.code || error.message});
      // Stop after an uncertain result. Never delete accounts or silently overwrite access.
      return {applied:true,plan,results,incomplete:true};
    }
  }
  return {applied:true,plan,results,incomplete:false};
}
