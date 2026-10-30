import test from 'node:test';import assert from 'node:assert/strict';
import {departmentReadiness} from '../src/departmentReadiness.ts';
const department={id:'chem',name:'Department of Chemistry',programme:'BSc Chemistry'};
const directory=[{id:'h',role:'hod',active:true,departmentId:'chem',displayName:'HOD'},{id:'l',role:'lecturer',active:true,departmentId:'chem',displayName:'Lecturer'}];
const sessions=[{id:'chem',departmentName:department.name,session:'2025/2026'}];
const templates=[{id:'chem__BSCCHEMISTRY',departmentId:'chem',programme:'BSc Chemistry',steps:[{name:'Proposal',days:14}]}];
test('department readiness requires scoped staff, a configured programme, current session and matching usable template',()=>{
 const result=departmentReadiness(department,directory,sessions,templates);assert.equal(result.completed,5);assert.equal(result.next,undefined);assert.equal(result.lecturers,1);
 // Five lecturers is a suggestion; a smaller department is not blocked.
 assert.equal(result.checks.find(c=>c.id==='lecturers').done,true);
 const empty=departmentReadiness({id:'new',name:'New department'},directory,sessions,templates);assert.equal(empty.completed,0);assert.equal(empty.next.destination,'staff');
});
test('inactive and foreign staff, stale session names and other programme templates never mark a department configured',()=>{
 const result=departmentReadiness(department,directory.map(s=>({...s,active:false})),[{...sessions[0],departmentName:'Old department name'}],[{...templates[0],departmentId:'another'}]);
 assert.equal(result.completed,1);assert.equal(result.checks.find(c=>c.id==='session').done,false);assert.equal(result.checks.find(c=>c.id==='template').done,false);
 assert.equal(departmentReadiness(department,directory.map(s=>({...s,departmentId:'foreign'})),sessions,templates).completed,3);
 for(const changes of [{id:'chem__BSCBIOLOGY'},{programme:null},{steps:[null]},{steps:[]},{steps:[{name:'',days:14}]},{steps:[{name:'Proposal',days:-1}]},{steps:[{name:'Proposal',days:1.5}]}])assert.equal(departmentReadiness(department,directory,sessions,[{...templates[0],...changes}]).checks.find(c=>c.id==='template').done,false);
 assert.equal(departmentReadiness(department,directory,[{...sessions[0],session:'2025/2027'}],templates).checks.find(c=>c.id==='session').done,false);
 assert.equal(departmentReadiness({...department,programme:' '},directory,sessions,templates).checks.find(c=>c.id==='template').done,false);
});
