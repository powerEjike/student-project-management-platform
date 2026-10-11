import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, deleteDoc, where, writeBatch } from 'firebase/firestore';
let env;
before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-projecttrack',firestore:{rules:await readFile('firestore.rules','utf8')}});
  await env.withSecurityRulesDisabled(async context => {
    const db=context.firestore();
    for (const [uid,role,departmentId,active] of [['admin','admin','',true],['hod-a','hod','dept-a',true],['hod-b','hod','dept-b',true],['sup','lecturer','dept-a',true],['co','lecturer','dept-a',true],['other','lecturer','dept-a',true],['inactive','hod','dept-a',false],['foreign','lecturer','dept-b',true],['inactive-sup','lecturer','dept-a',false]]) await setDoc(doc(db,'staff',uid),{role,departmentId,active,displayName:uid});
    await setDoc(doc(db,'departments','dept-a'),{name:'Department A'});
    await setDoc(doc(db,'departments','dept-b'),{name:'Department B'});
    await setDoc(doc(db,'projects','p1'),{departmentId:'dept-a',supervisorId:'sup',coSupervisorId:'co'});
    await setDoc(doc(db,'projects','p1','submissions','v1'),{filename:'draft.pdf'});
  });
});
after(async()=>await env?.cleanup());
test('rules restrict project reads, including nested submissions',async()=>{
  for(const uid of ['hod-a','sup','co']) for(const path of ['projects/p1','projects/p1/submissions/v1']) await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),path)));
  for(const uid of ['admin','hod-b','other','inactive','unapproved']) for(const path of ['projects/p1','projects/p1/submissions/v1']) await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),path)));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'projects/p1')));
});
test('users cannot promote themselves or alter staff access',async()=>{
  for(const uid of ['sup','admin','unapproved']) await assertFails(setDoc(doc(env.authenticatedContext(uid).firestore(),'staff',uid),{role:'admin',active:true}));
});
test('staff may read their own approval, but not another profile',async()=>{
  await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'staff','sup')));
  await assertFails(getDoc(doc(env.authenticatedContext('sup').firestore(),'staff','co')));
});
test('reassignment removes the former supervisor access',async()=>{
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(),'projects','reassigned'),{departmentId:'dept-a',supervisorId:'sup'});
  });
  await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'projects','reassigned')));
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(),'projects','reassigned'),{departmentId:'dept-a',supervisorId:'other'});
  });
  await assertFails(getDoc(doc(env.authenticatedContext('sup').firestore(),'projects','reassigned')));
  await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects','reassigned')));
});
function studentData(matric,actor='hod-a',departmentId='dept-a') {
  return {departmentId,name:'Synthetic Student',matricNumber:matric,matricKey:matric.toUpperCase().replace(/[^A-Z0-9]/g,''),programme:'BSc',level:'400',session:'2026/2027',email:'',createdBy:actor,createdAt:serverTimestamp()};
}
function studentId(matric,department='dept-a') {return `${department}__20262027__${matric.toUpperCase().replace(/[^A-Z0-9]/g,'')}`;}
function assignment(db,id,{supervisor='sup',co='co',reason='Initial allocation',actor='hod-a',eventId='event-1',previous='',previousCo='',existing=null}={}) {
  const batch=writeBatch(db);
  const allocation={supervisorId:supervisor,coSupervisorId:co,supervisorName:supervisor,coSupervisorName:co,updatedBy:actor,updatedAt:serverTimestamp(),lastAllocationEventId:eventId};
  if(existing)batch.update(doc(db,'projects',id),allocation);
  else batch.set(doc(db,'projects',id),{...allocation,departmentId:'dept-a',studentId:id,title:'',status:'Awaiting topic',createdBy:actor,createdAt:serverTimestamp()});
  batch.set(doc(db,'projects',id,'allocations',eventId),{departmentId:'dept-a',studentId:id,supervisorId:supervisor,coSupervisorId:co,previousSupervisorId:previous,previousCoSupervisorId:previousCo,reason,actorId:actor,createdAt:serverTimestamp()});
  return batch.commit();
}
test('student creation is department-scoped and canonical IDs prevent duplicate records',async()=>{
  const db=env.authenticatedContext('hod-a').firestore();const id=studentId('BIO/001');
  await assertSucceeds(setDoc(doc(db,'students',id),studentData('BIO/001')));
  await assertFails(setDoc(doc(db,'students',id),studentData('bio-001')));
  await assertFails(setDoc(doc(db,'students','random-id'),studentData('BIO/002')));
  await assertFails(setDoc(doc(db,'students',studentId('BIO003','dept-b')),studentData('BIO003','hod-a','dept-b')));
  for(const uid of ['admin','sup','inactive','unapproved'])await assertFails(setDoc(doc(env.authenticatedContext(uid).firestore(),'students',studentId('BIO004')),studentData('BIO004',uid)));
  await assertFails(getDoc(doc(env.authenticatedContext('admin').firestore(),'students',id)));
  await assertFails(deleteDoc(doc(db,'students',id)));
});
test('HOD roster queries are scoped; unassigned students remain private',async()=>{
  const db=env.authenticatedContext('hod-a').firestore();
  await assertSucceeds(getDocs(query(collection(db,'staff'),where('departmentId','==','dept-a'),where('role','==','lecturer'),where('active','==',true))));
  await assertFails(getDocs(collection(db,'staff')));
  await assertSucceeds(getDocs(query(collection(db,'students'),where('departmentId','==','dept-a'))));
  await assertFails(getDocs(collection(db,'students')));
  await assertFails(getDoc(doc(env.authenticatedContext('sup').firestore(),'students',studentId('BIO/001'))));
});
test('allocation requires a valid lecturer, matching department and an atomic reason/history record',async()=>{
  const db=env.authenticatedContext('hod-a').firestore();const id=studentId('ALLOC001');
  await setDoc(doc(db,'students',id),studentData('ALLOC001'));
  for(const options of [{supervisor:'foreign'},{supervisor:'inactive-sup'},{supervisor:'admin'},{supervisor:'sup',co:'sup'},{reason:''},{actor:'sup'}])await assertFails(assignment(db,id,options));
  await assertFails(setDoc(doc(db,'projects',id),{departmentId:'dept-a',studentId:id,supervisorId:'sup'}));
  await assertSucceeds(assignment(db,id));
  for(const uid of ['hod-a','sup','co'])await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'students',id)));
  for(const uid of ['admin','hod-b','other'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'students',id)));
  await assertFails(updateDoc(doc(db,'projects',id,'allocations','event-1'),{reason:'Changed history'}));
  await assertFails(deleteDoc(doc(db,'projects',id,'allocations','event-1')));
});
test('real reassignment preserves folder content, changes access and cannot bypass history',async()=>{
  const db=env.authenticatedContext('hod-a').firestore();const id=studentId('ALLOC002');
  await setDoc(doc(db,'students',id),studentData('ALLOC002'));await assignment(db,id);
  await env.withSecurityRulesDisabled(async context=>await setDoc(doc(context.firestore(),'projects',id,'submissions','v1'),{filename:'synthetic.pdf'}));
  await assertFails(updateDoc(doc(db,'projects',id),{supervisorId:'other'}));
  await assertFails(updateDoc(doc(db,'projects',id),{departmentId:'dept-b'}));
  await assertFails(updateDoc(doc(db,'projects',id),{title:'HOD must not approve the topic'}));
  await assertSucceeds(assignment(db,id,{supervisor:'other',co:'',eventId:'event-2',previous:'sup',previousCo:'co',reason:'Workload adjustment',existing:true}));
  for(const uid of ['sup','co']){
    await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id)));
    await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'students',id)));
    await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id,'submissions','v1')));
  }
  await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects',id,'submissions','v1')));
  await assertSucceeds(getDoc(doc(db,'projects',id,'allocations','event-1')));
});
test('lecturers may query only their assigned department projects',async()=>{
  const db=env.authenticatedContext('sup').firestore();
  await assertSucceeds(getDocs(query(collection(db,'projects'),where('departmentId','==','dept-a'),where('supervisorId','==','sup'))));
  await assertSucceeds(getDocs(query(collection(db,'projects'),where('departmentId','==','dept-a'),where('coSupervisorId','==','sup'))));
  await assertFails(getDocs(query(collection(db,'projects'),where('departmentId','==','dept-a'))));
});
test('Super Admin manages departments without access to student records',async()=>{
  const db=env.authenticatedContext('admin').firestore();
  await assertSucceeds(setDoc(doc(db,'departments','new-department'),{name:'New Department',createdBy:'admin',createdAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(db,'departments','new-department'),{name:'Renamed Department'}));
  await assertFails(setDoc(doc(env.authenticatedContext('hod-a').firestore(),'departments','bad-department'),{name:'Other Department',createdBy:'hod-a',createdAt:serverTimestamp()}));
  await assertFails(getDocs(collection(db,'students')));
});

test('Super Admin changes staff access atomically, cannot lock out self and keeps immutable audit records',async()=>{
  const db=env.authenticatedContext('admin').firestore();
  await env.withSecurityRulesDisabled(async c=>await setDoc(doc(c.firestore(),'staff','managed'),{role:'lecturer',active:true,departmentId:'dept-a',displayName:'Managed lecturer'}));
  await assertSucceeds(getDocs(collection(db,'staff')));
  await assertFails(updateDoc(doc(db,'staff','managed'),{active:false}));
  async function change(actor,target,eventId,previousActive=true){
    const actorDb=env.authenticatedContext(actor).firestore();const batch=writeBatch(actorDb);
    batch.update(doc(actorDb,'staff',target),{role:'lecturer',active:false,departmentId:'dept-a',departmentName:'Department A',updatedAt:serverTimestamp(),lastAccessEventId:eventId});
    batch.set(doc(actorDb,'staffAccessChanges',eventId),{staffId:target,role:'lecturer',active:false,departmentId:'dept-a',previousRole:'lecturer',previousActive,previousDepartmentId:'dept-a',actorId:actor,createdAt:serverTimestamp()});
    return batch.commit();
  }
  await assertFails(change('hod-a','managed','hod-edit'));
  await assertFails(change('admin','admin','self-edit'));
  await assertFails(change('admin','managed','false-history',false));
  await assertSucceeds(change('admin','managed','access-1'));
  await assertFails(getDoc(doc(env.authenticatedContext('managed').firestore(),'departments','dept-a')));
  await assertSucceeds(getDoc(doc(db,'staffAccessChanges','access-1')));
  await assertFails(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'staffAccessChanges','access-1')));
  await assertFails(updateDoc(doc(db,'staffAccessChanges','access-1'),{active:true}));
  await assertFails(deleteDoc(doc(db,'staffAccessChanges','access-1')));
});
