import test from 'node:test';
import assert from 'node:assert/strict';
import { canReadProject, validProfile } from '../src/access.mjs';
const profile = (role, departmentId='dept-a') => ({role,departmentId,active:true,displayName:'Test Staff'});
const project = {departmentId:'dept-a',supervisorId:'lecturer-a',coSupervisorId:'co-a'};
test('unknown, inactive and unassigned staff fail closed', () => {
  for (const p of [null,{},profile('student'),{...profile('hod'),active:false},{...profile('lecturer'),departmentId:''}]) assert.equal(validProfile(p),false);
});
test('admin cannot read project records', () => assert.equal(canReadProject(profile('admin'),'admin-a',project),false));
test('HOD is restricted to their department', () => {
  assert.equal(canReadProject(profile('hod'),'hod-a',project),true);
  assert.equal(canReadProject(profile('hod','dept-b'),'hod-b',project),false);
});
test('supervisor and co-supervisor require allocation and same department', () => {
  assert.equal(canReadProject(profile('lecturer'),'lecturer-a',project),true);
  assert.equal(canReadProject(profile('lecturer'),'co-a',project),true);
  assert.equal(canReadProject(profile('lecturer'),'other',project),false);
  assert.equal(canReadProject(profile('lecturer','dept-b'),'lecturer-a',project),false);
});
