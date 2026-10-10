import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
let env;
before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-projecttrack',firestore:{rules:await readFile('firestore.rules','utf8')}});
  await env.withSecurityRulesDisabled(async context => {
    const db=context.firestore();
    for (const [uid,role,departmentId,active] of [['admin','admin','',true],['hod-a','hod','dept-a',true],['hod-b','hod','dept-b',true],['sup','lecturer','dept-a',true],['co','lecturer','dept-a',true],['other','lecturer','dept-a',true],['inactive','hod','dept-a',false]]) await setDoc(doc(db,'staff',uid),{role,departmentId,active,displayName:uid});
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
