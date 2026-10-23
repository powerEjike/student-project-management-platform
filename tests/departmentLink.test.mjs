import test from 'node:test';
import assert from 'node:assert/strict';
import {linkedDepartment,departmentStudentLink} from '../src/departmentLink.ts';
test('department registration links select a department without granting access or accepting unsafe identifiers',()=>{
 const link=departmentStudentLink('https://projecttrack-departments.web.app','department-of-chemistry');
 assert.equal(link,'https://projecttrack-departments.web.app/?department=department-of-chemistry&portal=student');
 assert.equal(linkedDepartment(new URL(link).search),'department-of-chemistry');
 for(const query of ['', '?department=../staff', '?department=chemistry%2Fstudents', '?department=Chemistry', '?department='+ 'a'.repeat(101)])assert.equal(linkedDepartment(query),'');
 assert.throws(()=>departmentStudentLink('https://example.org','chemistry/students'));
});
