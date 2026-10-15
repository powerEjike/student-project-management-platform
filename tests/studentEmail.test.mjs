import{test}from'node:test';import assert from'node:assert/strict';import{studentEmailValue,studentEmailChange,emailCoverage,contactSessionValue}from'../src/studentEmail.ts';
test('student email updates permit clearing but reject multiple recipients, headers and malformed local/domain labels',()=>{
 assert.equal(studentEmailValue(' Student.Name+project@example.edu '),'Student.Name+project@example.edu');assert.equal(studentEmailValue('',true),'');
 for(const input of['','a@example.edu\r\nBcc: b@example.edu','a@example.edu,b@example.edu','a@example.edu; b@example.edu','.a@example.edu','a..b@example.edu','a.@example.edu','a@-example.edu','a@example-.edu','a@example..edu','a@'+ 'x'.repeat(64)+'.edu'])assert.throws(()=>studentEmailValue(input));
 assert.deepEqual(studentEmailChange('',' Outdated address ','old@example.edu',true),{email:'',reason:'Outdated address',confirmed:true});assert.throws(()=>studentEmailChange('a@example.edu','Reason','a@example.edu',true));assert.throws(()=>studentEmailChange('a@example.edu','Reason','',false));assert.throws(()=>studentEmailChange('a@example.edu',' ','',true));
});
test('contact coverage distinguishes missing, invalid and valid-format records without claiming verified ownership',()=>{
 assert.deepEqual(emailCoverage([{email:''},{email:'  '},{email:'bad-address'},{email:'student@example.edu'}]),{total:4,missing:2,invalid:1,recorded:1});assert.equal(contactSessionValue('2025/2026'),'2025/2026');for(const session of['2022/2026','2025/25','2025-2026',''])assert.throws(()=>contactSessionValue(session));
});
