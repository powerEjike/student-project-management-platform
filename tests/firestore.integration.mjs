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
test('completion and archive are atomic, scoped to HOD or primary supervisor and immutable',async()=>{
 async function setup(id){await seedWorkflow(id);await topicDecision(id);await env.withSecurityRulesDisabled(async c=>{await updateDoc(doc(c.firestore(),'projects',id),{defenceCleared:true});await updateDoc(doc(c.firestore(),'students',id),{name:'Synthetic student'});});}
 async function complete(id,uid='sup',options={}){const {archive=true,history=true,consent=true,author='Synthetic student',date='2020-10-11'}=options;const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);const archiveId=(id==='complete-hod'?'d':'c').repeat(64);b.update(doc(db,'projects',id),{status:'Completed',completedDate:date,completedBy:uid,completedByName:uid,completionNote:'Defence finished',archiveId,lastCompletionEventId:'completion',updatedBy:uid,updatedAt:serverTimestamp()});if(history)b.set(doc(db,'projects',id,'completionHistory','completion'),{date,note:'Defence finished',archiveId,actorId:uid,actorName:uid,createdAt:serverTimestamp(),archiveConsentConfirmed:consent});if(archive){const data={departmentId:'dept-a',title:'Synthetic research topic',titleKey:'synthetic research topic',author,year:Number(date.slice(0,4)),programme:'BSc Biochemistry',active:true,sourceProjectId:id,createdBy:uid,createdAt:serverTimestamp(),updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:'completion'};b.set(doc(db,'archive',archiveId),data);b.set(doc(db,'archive',archiveId,'history','completion'),{...data,actorId:uid,recordedAt:serverTimestamp(),reason:'Completed after defence'});}return b.commit();}
 const id='complete-supervisor';await setup(id);for(const uid of ['admin','hod-b','co','other','inactive-sup'])await assertFails(complete(id,uid));await assertFails(complete(id,'sup',{archive:false}));await assertFails(complete(id,'sup',{history:false}));await assertFails(complete(id,'sup',{consent:false}));await assertFails(complete(id,'sup',{author:'Wrong student'}));await assertFails(complete(id,'sup',{date:'2999-10-11'}));await assertFails(complete(id,'sup',{date:'2020-02-30'}));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Withheld'}));await assertFails(complete(id));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Pending'}));await assertFails(complete(id));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Declined'}));await assertSucceeds(complete(id));await assertFails(complete(id));await assertFails(updateDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id),{completedDate:'2020-10-12'}));await assertFails(deleteDoc(doc(env.authenticatedContext('hod-a').firestore(),'projects',id,'completionHistory','completion')));
 await setup('complete-hod');await assertSucceeds(complete('complete-hod','hod-a'));
});
test('defence clearance requires primary supervisor approved topic explicit exception and immutable atomic history',async()=>{
 const id='defence-clearance';await seedWorkflow(id);
 async function change(uid='sup',cleared=true,note='',override='Final work reviewed outside the platform.',audit=true){const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);const eventId=cleared?'clear':'withdraw';b.update(doc(db,'projects',id),{defenceCleared:cleared,defenceDate:cleared?serverTimestamp():null,defenceBy:uid,defenceByName:uid,defenceNote:note,defenceOverride:cleared?override:'',lastDefenceEventId:eventId,updatedBy:uid,updatedAt:serverTimestamp()});if(audit)b.set(doc(db,'projects',id,'defenceHistory',eventId),{cleared,previousCleared:!cleared,note,override:cleared?override:'',actorId:uid,actorName:uid,createdAt:serverTimestamp()});return b.commit();}
 await assertFails(change());await topicDecision(id);for(const uid of ['admin','hod-a','hod-b','co','other','inactive-sup'])await assertFails(change(uid));await assertFails(change('sup',true,'',''));await assertFails(change('sup',true,'','Reviewed final work',false));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Withheld'}));await assertFails(change());await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Reinstated'}));await assertSucceeds(change());await assertFails(change());
 await assertSucceeds(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'projects',id,'defenceHistory','clear')));await assertFails(updateDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id,'defenceHistory','clear'),{note:'Changed history'}));await assertFails(change('sup',false));await assertSucceeds(change('sup',false,'Further corrections required.'));
 await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{supervisorId:'other',coSupervisorId:''}));await assertFails(change());
});
test('supervisor registration is atomic, departmental, self-assigned and cannot capture existing students',async()=>{
 const id='dept-a__20262027__NEW001';
 function registration(uid='sup',departmentId='dept-a',supervisorId=uid,includeStudent=true,includeAudit=true){const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);if(includeStudent)b.set(doc(db,'students',id),{departmentId,name:'Synthetic new student',matricNumber:'NEW001',matricKey:'NEW001',programme:'BSc Biochemistry',level:'Final year',session:'2026/2027',email:'',createdBy:uid,createdAt:serverTimestamp()});b.set(doc(db,'projects',id),{departmentId,studentId:id,supervisorId,coSupervisorId:'',supervisorName:supervisorId,coSupervisorName:'',title:'New synthetic title',status:'Awaiting topic',createdBy:uid,createdAt:serverTimestamp(),updatedBy:uid,updatedAt:serverTimestamp(),lastAllocationEventId:'first'});if(includeAudit)b.set(doc(db,'projects',id,'allocations','first'),{departmentId,studentId:id,supervisorId,coSupervisorId:'',previousSupervisorId:'',previousCoSupervisorId:'',reason:'Supervisor registration after archive check',actorId:uid,createdAt:serverTimestamp()});return b.commit();}
 for(const uid of ['admin','inactive-sup','foreign','hod-a'])await assertFails(registration(uid));
 await assertFails(registration('sup','dept-b'));await assertFails(registration('sup','dept-a','other'));await assertFails(registration('sup','dept-a','sup',false));await assertFails(registration('sup','dept-a','sup',true,false));
 await assertSucceeds(registration());await assertFails(registration('other'));await assertFails(registration());
 await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'students',id)));await assertSucceeds(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'students',id)));for(const uid of ['other','foreign','admin'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'students',id)));
});


test('archive creation and withdrawal are HOD-only, scoped, atomic and preserve original details',async()=>{
 const id='a'.repeat(64);const db=env.authenticatedContext('hod-a').firestore();
 const details={departmentId:'dept-a',title:'  ENZYME:  Activity In Maize! ',titleKey:'enzyme activity in maize',author:'Synthetic author',year:2024,programme:'BSc Biochemistry',active:true};
 async function create(uid='hod-a',overrides={}){const userdb=env.authenticatedContext(uid).firestore();const batch=writeBatch(userdb);const data={...details,...overrides,createdBy:uid,createdAt:serverTimestamp(),updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:'archive-1'};batch.set(doc(userdb,'archive',id),data);batch.set(doc(userdb,'archive',id,'history','archive-1'),{...data,actorId:uid,recordedAt:serverTimestamp(),reason:'Historical entry'});return batch.commit();}
 for(const uid of ['admin','sup','co','hod-b','inactive'])await assertFails(create(uid));
 await assertFails(create('hod-a',{titleKey:'wrong key'}));await assertFails(setDoc(doc(db,'archive',id),details));await assertSucceeds(create());
 for(const uid of ['sup','co','hod-a'])await assertSucceeds(getDocs(query(collection(env.authenticatedContext(uid).firestore(),'archive'),where('departmentId','==','dept-a'),where('titleKey','==','enzyme activity in maize'),where('active','==',true))));
 for(const uid of ['admin','hod-b','foreign'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'archive',id)));
 await assertFails(getDocs(collection(env.authenticatedContext('sup').firestore(),'archive')));
 await assertFails(updateDoc(doc(db,'archive',id),{active:false}));await assertFails(updateDoc(doc(db,'archive',id),{author:'Rewritten author'}));
 const before=(await getDoc(doc(db,'archive',id))).data();const data={...before,active:false,updatedBy:'hod-a',updatedAt:serverTimestamp(),lastEventId:'archive-2'};const batch=writeBatch(db);batch.update(doc(db,'archive',id),{active:false,updatedBy:'hod-a',updatedAt:serverTimestamp(),lastEventId:'archive-2'});batch.set(doc(db,'archive',id,'history','archive-2'),{...data,actorId:'hod-a',recordedAt:serverTimestamp(),reason:'Incorrect historical entry withdrawn'});await assertSucceeds(batch.commit());
 await assertFails(deleteDoc(doc(db,'archive',id)));await assertFails(updateDoc(doc(db,'archive',id,'history','archive-1'),{reason:'Changed history'}));
 await assertFails(getDoc(doc(env.authenticatedContext('sup').firestore(),'archive',id,'history','archive-1')));
 const matches=await getDocs(query(collection(db,'archive'),where('departmentId','==','dept-a'),where('titleKey','==','enzyme activity in maize'),where('active','==',true)));if(!matches.empty)throw new Error('Withdrawn archive entries should not match.');
 const unicode='b'.repeat(64);const unicodeData={...details,title:'Étude du résumé!',titleKey:'étude du résumé',createdBy:'hod-a',createdAt:serverTimestamp(),updatedBy:'hod-a',updatedAt:serverTimestamp(),lastEventId:'unicode-1'};const unicodeBatch=writeBatch(db);unicodeBatch.set(doc(db,'archive',unicode),unicodeData);unicodeBatch.set(doc(db,'archive',unicode,'history','unicode-1'),{...unicodeData,actorId:'hod-a',recordedAt:serverTimestamp(),reason:'Historical entry'});await assertSucceeds(unicodeBatch.commit());
});

async function seedWorkflow(id,steps=[{name:'Proposal',days:14},{name:'Final Submission',days:112}]){
 await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,'students',id),{departmentId:'dept-a',programme:'BSc Biochemistry'});await setDoc(doc(db,'projects',id),{departmentId:'dept-a',studentId:id,supervisorId:'sup',coSupervisorId:'co',title:'',status:'Awaiting topic'});await setDoc(doc(db,'milestoneTemplates','dept-a__BSCBIOCHEMISTRY'),{departmentId:'dept-a',programme:'BSc Biochemistry',steps});});
}
async function topicDecision(id,uid='sup',options={}){
 const {decision='Approved',eventId='topic-1',note='',previousDecision='Awaiting topic',steps=[{name:'Proposal',days:14},{name:'Final Submission',days:112}],actor=uid}=options;
 const db=env.authenticatedContext(uid).firestore();const batch=writeBatch(db);
 const milestones=decision==='Approved'?Object.fromEntries(steps.map((s,i)=>[`m${i}`,{name:s.name,dueDate:'2027-01-31',status:'Not started',note:''}])):{};
 batch.update(doc(db,'projects',id),{title:'Synthetic research topic',abstract:'A short synthetic abstract.',topicDecision:decision,decisionNote:note,topicApprovedBy:decision==='Approved'?uid:'',topicApprovedAt:decision==='Approved'?serverTimestamp():null,templateId:decision==='Approved'?'dept-a__BSCBIOCHEMISTRY':'',milestonePlan:decision==='Approved'?steps:[],milestones,status:decision==='Approved'?'Research in progress':decision,updatedBy:uid,updatedAt:serverTimestamp(),lastTopicEventId:eventId});
 batch.set(doc(db,'projects',id,'topicHistory',eventId),{title:'Synthetic research topic',abstract:'A short synthetic abstract.',decision,note,previousDecision,actorId:actor,actorName:actor,createdAt:serverTimestamp()});return batch.commit();
}

test('only the assigned supervisor decides topics and approval requires the programme template and atomic history',async()=>{
 const id='workflow-topic';await seedWorkflow(id);
 for(const uid of ['admin','hod-a','hod-b','co','other','inactive-sup'])await assertFails(topicDecision(id,uid));
 const db=env.authenticatedContext('sup').firestore();await assertFails(updateDoc(doc(db,'projects',id),{title:'Bypassed approval'}));
 await assertFails(topicDecision(id,'sup',{actor:'co'}));
 await assertFails(topicDecision(id,'sup',{steps:[{name:'Wrong stage',days:14}]}));
 await assertFails(topicDecision(id,'sup',{decision:'Rejected'}));
 await assertSucceeds(topicDecision(id,'sup',{decision:'Changes requested',note:'Narrow the scope.'}));
 await assertSucceeds(topicDecision(id,'sup',{eventId:'topic-2',previousDecision:'Changes requested'}));
 await assertFails(topicDecision(id,'sup',{eventId:'topic-3',previousDecision:'Approved'}));
 for(const uid of ['hod-a','co'])await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id,'topicHistory','topic-2')));
 for(const uid of ['admin','hod-b','other'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id,'topicHistory','topic-2')));
 await assertFails(updateDoc(doc(db,'projects',id,'topicHistory','topic-2'),{decision:'Rejected'}));
});

test('ten-stage approval stays atomic and within permission evaluation limits',async()=>{
 const steps=Array.from({length:10},(_,i)=>({name:`Stage ${i+1}`,days:i*7}));const id='workflow-ten';await seedWorkflow(id,steps);await assertSucceeds(topicDecision(id,'sup',{steps}));
});

test('progress and deadline changes require the current primary supervisor and immutable matching audit',async()=>{
 const id='workflow-progress';await seedWorkflow(id);await topicDecision(id);
 const previous={name:'Proposal',dueDate:'2027-01-31',status:'Not started',note:''};const current={...previous,dueDate:'2027-02-14',status:'Completed',note:'Reviewed and accepted.'};
 async function progress(uid='sup',options={}){
  const {eventId='progress-1',actor=uid,name='Proposal',before=previous,changeSecond=false}=options;const db=env.authenticatedContext(uid).firestore();const batch=writeBatch(db);
  const value={...current,name};const milestones={m0:value,m1:{name:'Final Submission',dueDate:'2027-01-31',status:changeSecond?'Completed':'Not started',note:''}};
  batch.update(doc(db,'projects',id),{milestones,lastMilestoneKey:'m0',lastProgressEventId:eventId,updatedBy:uid,updatedAt:serverTimestamp()});batch.set(doc(db,'projects',id,'progressHistory',eventId),{milestoneKey:'m0',previous:before,current:value,actorId:actor,actorName:actor,createdAt:serverTimestamp()});return batch.commit();
 }
 for(const uid of ['admin','hod-a','co','other'])await assertFails(progress(uid));
 await assertFails(progress('sup',{name:'Renamed stage'}));await assertFails(progress('sup',{changeSecond:true}));await assertFails(progress('sup',{before:{...previous,status:'Completed'}}));await assertFails(progress('sup',{actor:'co'}));
 const db=env.authenticatedContext('sup').firestore();await assertFails(updateDoc(doc(db,'projects',id),{'milestones.m0.status':'Completed'}));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Withheld'}));await assertFails(progress());await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Reinstated'}));await assertSucceeds(progress());
 await assertFails(deleteDoc(doc(db,'projects',id,'progressHistory','progress-1')));
 await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{supervisorId:'other',coSupervisorId:''}));
 await assertFails(progress('sup',{eventId:'progress-2',before:current}));await assertFails(getDoc(doc(db,'projects',id,'progressHistory','progress-1')));
 await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects',id,'progressHistory','progress-1')));
});

test('Super Admin alone manages validated programme templates with an atomic immutable history',async()=>{
 const id='dept-a__MSC';
 async function save(uid,steps=[{name:'Proposal',days:7}],eventId='template-1'){
  const db=env.authenticatedContext(uid).firestore();const batch=writeBatch(db);const value={departmentId:'dept-a',programme:'MSc',programmeKey:'MSC',steps,updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:eventId};batch.set(doc(db,'milestoneTemplates',id),value);batch.set(doc(db,'milestoneTemplates',id,'history',eventId),{...value,actorId:uid,createdAt:serverTimestamp()});return batch.commit();
 }
 await assertFails(save('hod-a'));await assertFails(save('sup'));await assertFails(save('admin',[]));await assertFails(save('admin',[{name:'',days:7}]));await assertFails(save('admin',[{name:'Proposal',days:-1}]));await assertSucceeds(save('admin'));
 await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'milestoneTemplates',id)));
 await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'milestoneTemplates','dept-a__MISSING')));
 await assertFails(getDoc(doc(env.authenticatedContext('hod-b').firestore(),'milestoneTemplates',id)));
 const db=env.authenticatedContext('admin').firestore();await assertFails(updateDoc(doc(db,'milestoneTemplates',id),{steps:[{name:'Bypass audit',days:8}]}));await assertFails(deleteDoc(doc(db,'milestoneTemplates',id,'history','template-1')));
 await assertSucceeds(save('admin',Array.from({length:10},(_,i)=>({name:`Stage ${i+1}`,days:i*7})),'template-10'));
});
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



test('release requests are private, atomic, evidence-preserving and HOD decisions preserve allocation history',async()=>{
 const id='release-test';await seedWorkflow(id);
 async function request(uid='sup',options={}){const {audit=true,project=true,activity=true}=options;const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);b.set(doc(db,'releaseRequests','release-one'),{studentName:'',projectId:id,departmentId:'dept-a',supervisorId:uid,reason:'Other',note:'Synthetic evidence',state:'Pending',decisionNote:'',activity:{milestones:activity?{}:{fake:true},lastProjectUpdate:null,contactEvidence:'Not recorded',uploadEvidence:'Uploads disabled'},createdAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedBy:uid,lastEventId:'request'});if(project)b.update(doc(db,'projects',id),{releaseState:'Pending',releaseRequestId:'release-one',updatedBy:uid,updatedAt:serverTimestamp()});if(audit)b.set(doc(db,'releaseRequests','release-one','history','request'),{state:'Pending',note:'Synthetic evidence',actorId:uid,createdAt:serverTimestamp()});return b.commit();}
 for(const uid of ['co','other','foreign','admin','hod-a','inactive-sup'])await assertFails(request(uid));await assertFails(request('sup',{audit:false}));await assertFails(request('sup',{project:false}));await assertFails(request('sup',{activity:false}));await assertSucceeds(request());await assertFails(request());
 for(const uid of ['sup','hod-a'])await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'releaseRequests','release-one')));for(const uid of ['co','other','foreign','admin','hod-b'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'releaseRequests','release-one')));
 await assertSucceeds(getDocs(query(collection(env.authenticatedContext('sup').firestore(),'releaseRequests'),where('departmentId','==','dept-a'),where('supervisorId','==','sup'))));await assertSucceeds(getDocs(query(collection(env.authenticatedContext('hod-a').firestore(),'releaseRequests'),where('departmentId','==','dept-a'))));await assertFails(getDocs(collection(env.authenticatedContext('sup').firestore(),'releaseRequests')));
 async function decision(state,uid='hod-a',options={}){const {audit=true,allocation=true,supervisor='other',note='Synthetic decision'}=options;const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);const eid=state.toLowerCase();b.update(doc(db,'releaseRequests','release-one'),{state,decisionNote:note,updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:eid});if(audit)b.set(doc(db,'releaseRequests','release-one','history',eid),{state,note,actorId:uid,createdAt:serverTimestamp()});const patch={releaseState:state,updatedBy:uid,updatedAt:serverTimestamp()};if(['Reassigned','Reinstated'].includes(state))Object.assign(patch,{supervisorId:supervisor,supervisorName:supervisor,coSupervisorId:'',coSupervisorName:'',lastAllocationEventId:eid});b.update(doc(db,'projects',id),patch);if(['Reassigned','Reinstated'].includes(state)&&allocation)b.set(doc(db,'projects',id,'allocations',eid),{departmentId:'dept-a',studentId:id,supervisorId:supervisor,coSupervisorId:'',previousSupervisorId:'sup',previousCoSupervisorId:'co',reason:note,actorId:uid,createdAt:serverTimestamp()});return b.commit();}
 for(const uid of ['sup','co','other','hod-b','admin','inactive'])await assertFails(decision('Withheld',uid));await assertFails(decision('Withheld','hod-a',{audit:false}));await assertFails(decision('Withheld','hod-a',{note:''}));await assertFails(decision('Reassigned','hod-a',{allocation:false}));await assertFails(decision('Reassigned','hod-a',{supervisor:'foreign'}));await assertFails(decision('Reassigned','hod-a',{supervisor:'sup'}));await assertSucceeds(decision('Withheld'));await assertFails(topicDecision(id));await assertFails(decision('Declined'));await assertSucceeds(decision('Reinstated'));await assertFails(decision('Reinstated'));await assertFails(updateDoc(doc(env.authenticatedContext('hod-a').firestore(),'releaseRequests','release-one','history','request'),{note:'Rewritten'}));await assertFails(deleteDoc(doc(env.authenticatedContext('hod-a').firestore(),'releaseRequests','release-one')));await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'releaseRequests','release-one')));await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(),'releaseRequests','release-one')));await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects',id)));await assertFails(getDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id)));
});

test('release decline retains supervisors; reassignment removes former access and forbids foreign allocations',async()=>{
 for(const state of ['Declined','Reassigned']){const id='release-'+state;await seedWorkflow(id);const rid='r-'+state;const db=env.authenticatedContext('sup').firestore();const b=writeBatch(db);b.set(doc(db,'releaseRequests',rid),{studentName:'',projectId:id,departmentId:'dept-a',supervisorId:'sup',reason:'Other',note:'Synthetic request',state:'Pending',decisionNote:'',activity:{milestones:{},lastProjectUpdate:null,contactEvidence:'Not recorded',uploadEvidence:'Uploads disabled'},createdAt:serverTimestamp(),updatedBy:'sup',updatedAt:serverTimestamp(),lastEventId:'request'});b.set(doc(db,'releaseRequests',rid,'history','request'),{state:'Pending',note:'Synthetic request',actorId:'sup',createdAt:serverTimestamp()});b.update(doc(db,'projects',id),{releaseState:'Pending',releaseRequestId:rid,updatedBy:'sup',updatedAt:serverTimestamp()});await assertSucceeds(b.commit());
 const hdb=env.authenticatedContext('hod-a').firestore();const d=writeBatch(hdb);d.update(doc(hdb,'releaseRequests',rid),{state,decisionNote:'Synthetic decision',updatedBy:'hod-a',updatedAt:serverTimestamp(),lastEventId:'decision'});d.set(doc(hdb,'releaseRequests',rid,'history','decision'),{state,note:'Synthetic decision',actorId:'hod-a',createdAt:serverTimestamp()});const patch={releaseState:state,updatedBy:'hod-a',updatedAt:serverTimestamp()};if(state==='Reassigned'){Object.assign(patch,{supervisorId:'other',supervisorName:'other',coSupervisorId:'',coSupervisorName:'',lastAllocationEventId:'decision'});d.set(doc(hdb,'projects',id,'allocations','decision'),{departmentId:'dept-a',studentId:id,supervisorId:'other',coSupervisorId:'',previousSupervisorId:'sup',previousCoSupervisorId:'co',reason:'HOD allocation following a release decision',actorId:'hod-a',createdAt:serverTimestamp()});}d.update(doc(hdb,'projects',id),patch);await assertSucceeds(d.commit());const project=(await getDoc(doc(hdb,'projects',id))).data();if(project.supervisorId!==(state==='Reassigned'?'other':'sup'))throw Error('Incorrect supervisor after decision');if(state==='Reassigned'){await assertFails(getDoc(doc(db,'projects',id)));await assertFails(getDoc(doc(env.authenticatedContext('co').firestore(),'projects',id)));await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects',id)));await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(),'releaseRequests',rid)));}await assertSucceeds(getDoc(doc(db,'releaseRequests',rid)));}
});
