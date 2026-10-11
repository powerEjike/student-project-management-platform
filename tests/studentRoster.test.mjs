import test from 'node:test';import assert from 'node:assert/strict';
import {parseRoster,validateRosterSessions} from '../src/studentRoster.ts';
test('student CSV preserves quoted names, CGPA zero and optional metadata',()=>{
 const rows=parseRoster('\uFEFFStudent Name,Reg Number,Current CGPA,Gender\r\n"Test, Student",BIO/001,0,Female\r\nOther,BIO/002,,\r\n');
 assert.deepEqual(rows,[{name:'Test, Student',matricNumber:'BIO/001',currentCGPA:0,gender:'Female'},{name:'Other',matricNumber:'BIO/002'}]);
 assert.equal(parseRoster('Student Name,Reg Number\n"Test ""Name""",BIO003')[0].name,'Test "Name"');
});
test('student CSV rejects canonical duplicates, malformed rows and invalid grades',()=>{
 for(const input of ['Student Name,Reg Number\nOne,BIO/001\nTwo,bio-001','Student Name,Reg Number\n,BIO001','Student Name,Reg Number\nOne,','Student Name,Reg Number,Current CGPA\nOne,BIO001,5.1','Student Name,Reg Number,Current CGPA\nOne,BIO001,NaN','Student Name,Reg Number\n"One,BIO001','Student Name,Reg Number\nOne,BIO001,extra','Student Name,Reg Number\n"One"extra,BIO001','Student Name,Student Name,Reg Number\nOne,Two,BIO001'])assert.throws(()=>parseRoster(input));
});
test('admission and current sessions must be consecutive-year sessions in chronological order',()=>{
 assert.doesNotThrow(()=>validateRosterSessions('2025/2026','2022/2023'));
 for(const pair of [['2025/2027','2022/2023'],['2025/2026','2026/2027'],['2025','2022/2023']])assert.throws(()=>validateRosterSessions(...pair));
});
