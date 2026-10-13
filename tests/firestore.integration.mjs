import {emptyContacts,nextContactSummary} from '../src/contact.ts';
import {todayInLagos} from '../src/workflow.ts';
import {findTopicMatches} from '../src/topicSimilarity.ts';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, deleteDoc, where, writeBatch, orderBy, limit } from 'firebase/firestore';
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
test('pilot lifecycle connects admin roster, HOD allocation, supervisor approval and progress, automatic defence eligibility and archiving',async()=>{
 const admin=env.authenticatedContext('admin').firestore();const hod=env.authenticatedContext('hod-a').firestore();const supervisor=env.authenticatedContext('sup').firestore();
 const id='dept-a__20252026__PILOT001';const steps=[{name:'Proposal',days:14},{name:'Final Submission',days:112}];
 const roster=writeBatch(admin);roster.set(doc(admin,'students',id),{...studentData('PILOT001','admin'),session:'2025/2026',admissionSession:'2022/2023',programme:'BSc Biochemistry'});roster.set(doc(admin,'rosterImports','pilot-lifecycle'),{departmentId:'dept-a',session:'2025/2026',admissionSession:'2022/2023',added:1,skipped:0,actorId:'admin',createdAt:serverTimestamp()});await assertSucceeds(roster.commit());
 const student=(await assertSucceeds(getDoc(doc(hod,'students',id)))).data();if(student.session!=='2025/2026'||student.admissionSession!=='2022/2023')throw Error('Current and admission sessions must remain distinct.');
 await assertFails(getDoc(doc(supervisor,'students',id)));await assertSucceeds(assignment(hod,id));await assertSucceeds(getDoc(doc(supervisor,'students',id)));await assertFails(getDoc(doc(admin,'projects',id)));
 const templateId='dept-a__BSCBIOCHEMISTRY';const template=writeBatch(admin);const templateValue={departmentId:'dept-a',programme:'BSc Biochemistry',programmeKey:'BSCBIOCHEMISTRY',steps,updatedBy:'admin',updatedAt:serverTimestamp(),lastEventId:'pilot-template'};template.set(doc(admin,'milestoneTemplates',templateId),templateValue);template.set(doc(admin,'milestoneTemplates',templateId,'history','pilot-template'),{...templateValue,actorId:'admin',createdAt:serverTimestamp()});await assertSucceeds(template.commit());
 const archive=await assertSucceeds(getDocs(query(collection(supervisor,'archive'),where('departmentId','==','dept-a'),where('active','==',true))));if(findTopicMatches('Synthetic research topic',archive.docs.map(d=>({id:d.id,...d.data()}))).some(m=>m.matchKind==='exact'))throw Error('Pilot topic must be available before approval.');
 await assertSucceeds(topicDecision(id));let project=(await getDoc(doc(supervisor,'projects',id))).data();if(project.topicDecision!=='Approved'||Object.keys(project.milestones).length!==2)throw Error('Approval must create the saved milestone plan.');
 for(const key of ['m0','m1']){project=(await getDoc(doc(supervisor,'projects',id))).data();const previous=project.milestones[key];const current={...previous,status:'Completed',note:'Synthetic work reviewed.'};const batch=writeBatch(supervisor);const eventId=`pilot-progress-${key}`;batch.update(doc(supervisor,'projects',id),{milestones:{...project.milestones,[key]:current},lastMilestoneKey:key,lastSupervisorUpdateAt:serverTimestamp(),lastProgressEventId:eventId,updatedBy:'sup',updatedAt:serverTimestamp()});batch.set(doc(supervisor,'projects',id,'progressHistory',eventId),{milestoneKey:key,previous,current,actorId:'sup',actorName:'sup',createdAt:serverTimestamp()});await assertSucceeds(batch.commit());}
 const clearance=writeBatch(supervisor);clearance.update(doc(supervisor,'projects',id),{status:'Completed',defenceCleared:true,defenceDate:serverTimestamp(),defenceBy:'sup',defenceByName:'sup',defenceNote:'Ready for defence',defenceOverride:'Synthetic final work reviewed outside the platform.',lastDefenceEventId:'pilot-ready',updatedBy:'sup',updatedAt:serverTimestamp()});clearance.set(doc(supervisor,'projects',id,'defenceHistory','pilot-ready'),{cleared:true,previousCleared:false,note:'Ready for defence',override:'Synthetic final work reviewed outside the platform.',actorId:'sup',actorName:'sup',createdAt:serverTimestamp()});await assertSucceeds(clearance.commit());
 const defenceQueue=async()=>{const projects=await assertSucceeds(getDocs(query(collection(hod,'projects'),where('departmentId','==','dept-a'))));return projects.docs.filter(d=>d.id===id&&d.data().defenceCleared&&!d.data().completedDate&&d.data().releaseState!=='Withheld'&&d.data().defenceDate?.toDate);};
 if((await defenceQueue()).length!==1)throw Error('Supervisor completion must automatically populate the HOD defence queue.');
 const date=todayInLagos();const archiveId='e'.repeat(64);const final=writeBatch(supervisor);final.update(doc(supervisor,'projects',id),{status:'Completed',completedDate:date,completedBy:'sup',completedByName:'sup',completionNote:'Synthetic defence finished',archiveId,lastCompletionEventId:'pilot-finished',updatedBy:'sup',updatedAt:serverTimestamp()});final.set(doc(supervisor,'projects',id,'completionHistory','pilot-finished'),{date,note:'Synthetic defence finished',archiveId,actorId:'sup',actorName:'sup',createdAt:serverTimestamp(),archiveConsentConfirmed:true});const record={departmentId:'dept-a',title:'Synthetic research topic',titleKey:'synthetic research topic',author:student.name,year:Number(date.slice(0,4)),programme:student.programme,active:true,sourceProjectId:id,createdBy:'sup',createdAt:serverTimestamp(),updatedBy:'sup',updatedAt:serverTimestamp(),lastEventId:'pilot-finished'};final.set(doc(supervisor,'archive',archiveId),record);final.set(doc(supervisor,'archive',archiveId,'history','pilot-finished'),{...record,actorId:'sup',recordedAt:serverTimestamp(),reason:'Completed after defence'});await assertSucceeds(final.commit());
 if((await defenceQueue()).length!==0)throw Error('Archived project must leave the pending defence queue.');const savedArchive=(await assertSucceeds(getDoc(doc(hod,'archive',archiveId)))).data();if(findTopicMatches('Synthetic research topic',[{id:archiveId,...savedArchive}])[0]?.matchKind!=='exact')throw Error('Completed topic must be discoverable in the archive.');
 for(const [path,count] of [['allocations',1],['topicHistory',1],['progressHistory',2],['defenceHistory',1],['completionHistory',1]]){const history=await assertSucceeds(getDocs(collection(hod,'projects',id,path)));if(history.size!==count)throw Error(`Pilot ${path} audit did not survive the complete workflow.`);}
 await assertFails(updateDoc(doc(supervisor,'projects',id),{status:'Research in progress'}));
});
test('completion and archive are atomic, scoped to HOD or primary supervisor and immutable',async()=>{
 async function setup(id){await seedWorkflow(id);await topicDecision(id);await env.withSecurityRulesDisabled(async c=>{await updateDoc(doc(c.firestore(),'projects',id),{defenceCleared:true});await updateDoc(doc(c.firestore(),'students',id),{name:'Synthetic student'});});}
 async function complete(id,uid='sup',options={}){const {archive=true,history=true,consent=true,author='Synthetic student',date='2020-10-11'}=options;const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);const archiveId=(id==='complete-hod'?'d':'c').repeat(64);b.update(doc(db,'projects',id),{status:'Completed',completedDate:date,completedBy:uid,completedByName:uid,completionNote:'Defence finished',archiveId,lastCompletionEventId:'completion',updatedBy:uid,updatedAt:serverTimestamp()});if(history)b.set(doc(db,'projects',id,'completionHistory','completion'),{date,note:'Defence finished',archiveId,actorId:uid,actorName:uid,createdAt:serverTimestamp(),archiveConsentConfirmed:consent});if(archive){const data={departmentId:'dept-a',title:'Synthetic research topic',titleKey:'synthetic research topic',author,year:Number(date.slice(0,4)),programme:'BSc Biochemistry',active:true,sourceProjectId:id,createdBy:uid,createdAt:serverTimestamp(),updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:'completion'};b.set(doc(db,'archive',archiveId),data);b.set(doc(db,'archive',archiveId,'history','completion'),{...data,actorId:uid,recordedAt:serverTimestamp(),reason:'Completed after defence'});}return b.commit();}
 const id='complete-supervisor';await setup(id);for(const uid of ['admin','hod-b','co','other','inactive-sup'])await assertFails(complete(id,uid));await assertFails(complete(id,'sup',{archive:false}));await assertFails(complete(id,'sup',{history:false}));await assertFails(complete(id,'sup',{consent:false}));await assertFails(complete(id,'sup',{author:'Wrong student'}));await assertFails(complete(id,'sup',{date:'2999-10-11'}));await assertFails(complete(id,'sup',{date:'2020-02-30'}));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Withheld'}));await assertFails(complete(id));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Pending'}));await assertFails(complete(id));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Declined'}));await assertSucceeds(complete(id));await assertFails(complete(id));await assertFails(updateDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id),{completedDate:'2020-10-12'}));await assertFails(deleteDoc(doc(env.authenticatedContext('hod-a').firestore(),'projects',id,'completionHistory','completion')));
 await setup('complete-hod');await assertSucceeds(complete('complete-hod','hod-a'));
});
test('defence clearance requires primary supervisor approved topic explicit exception and immutable atomic history',async()=>{
 const id='defence-clearance';await seedWorkflow(id);
 async function change(uid='sup',cleared=true,note='',override='Final work reviewed outside the platform.',audit=true){const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);const eventId=cleared?'clear':'withdraw';b.update(doc(db,'projects',id),{status:cleared?'Completed':'Research in progress',defenceCleared:cleared,defenceDate:cleared?serverTimestamp():null,defenceBy:uid,defenceByName:uid,defenceNote:note,defenceOverride:cleared?override:'',lastDefenceEventId:eventId,updatedBy:uid,updatedAt:serverTimestamp()});if(audit)b.set(doc(db,'projects',id,'defenceHistory',eventId),{cleared,previousCleared:!cleared,note,override:cleared?override:'',actorId:uid,actorName:uid,createdAt:serverTimestamp()});return b.commit();}
 await assertFails(change());await topicDecision(id);for(const uid of ['admin','hod-a','hod-b','co','other','inactive-sup'])await assertFails(change(uid));await assertFails(change('sup',true,'',''));await assertFails(change('sup',true,'','Reviewed final work',false));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Withheld'}));await assertFails(change());await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Reinstated'}));await assertSucceeds(change());const changed=(await getDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id))).data();if(changed.status!=='Completed'||!changed.defenceCleared)throw Error('Completion must automatically qualify for defence');await assertFails(updateDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id),{status:'Research in progress'}));await assertFails(change());
 await assertSucceeds(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'projects',id,'defenceHistory','clear')));await assertFails(updateDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id,'defenceHistory','clear'),{note:'Changed history'}));await assertFails(change('sup',false));await assertSucceeds(change('sup',false,'Further corrections required.'));const withdrawn=(await getDoc(doc(env.authenticatedContext('hod-a').firestore(),'projects',id))).data();if(withdrawn.status!=='Research in progress'||withdrawn.defenceCleared)throw Error('Returning to In progress must remove defence eligibility');
 await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{supervisorId:'other',coSupervisorId:''}));await assertFails(change());
});
test('supervisor registration is atomic, departmental, self-assigned and cannot capture existing students',async()=>{
 const id='dept-a__20262027__NEW001';
 function registration(uid='sup',departmentId='dept-a',supervisorId=uid,includeStudent=true,includeAudit=true){const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);if(includeStudent)b.set(doc(db,'students',id),{departmentId,name:'Synthetic new student',matricNumber:'NEW001',matricKey:'NEW001',programme:'BSc Biochemistry',level:'Final year',session:'2026/2027',email:'',createdBy:uid,createdAt:serverTimestamp()});b.set(doc(db,'projects',id),{departmentId,studentId:id,supervisorId,coSupervisorId:'',supervisorName:supervisorId,coSupervisorName:'',title:'New synthetic title',status:'Awaiting topic',createdBy:uid,createdAt:serverTimestamp(),updatedBy:uid,updatedAt:serverTimestamp(),lastAllocationEventId:'first'});if(includeAudit)b.set(doc(db,'projects',id,'allocations','first'),{departmentId,studentId:id,supervisorId,coSupervisorId:'',previousSupervisorId:'',previousCoSupervisorId:'',reason:'Supervisor registration after archive check',actorId:uid,createdAt:serverTimestamp()});return b.commit();}
 for(const uid of ['admin','inactive-sup','foreign','hod-a'])await assertFails(registration(uid));
 await assertFails(registration('sup','dept-b'));await assertFails(registration('sup','dept-a','other'));await assertFails(registration('sup','dept-a','sup',false));await assertFails(registration('sup','dept-a','sup',true,false));
 await assertSucceeds(registration());await assertFails(registration('other'));await assertFails(registration());
 await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'students',id)));await assertSucceeds(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'students',id)));for(const uid of ['other','foreign'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'students',id)));
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
 batch.update(doc(db,'projects',id),{title:'Synthetic research topic',abstract:'A short synthetic abstract.',topicDecision:decision,decisionNote:note,topicApprovedBy:decision==='Approved'?uid:'',topicApprovedAt:decision==='Approved'?serverTimestamp():null,templateId:decision==='Approved'?'dept-a__BSCBIOCHEMISTRY':'',milestonePlan:decision==='Approved'?steps:[],milestones,status:decision==='Approved'?'Research in progress':decision,updatedBy:uid,updatedAt:serverTimestamp(),lastSupervisorUpdateAt:options.updateTime===undefined?serverTimestamp():options.updateTime,lastTopicEventId:eventId});
 batch.set(doc(db,'projects',id,'topicHistory',eventId),{title:'Synthetic research topic',abstract:'A short synthetic abstract.',decision,note,previousDecision,actorId:actor,actorName:actor,createdAt:serverTimestamp()});return batch.commit();
}

test('only the assigned supervisor decides topics and approval requires the programme template and atomic history',async()=>{
 const id='workflow-topic';await seedWorkflow(id);
 for(const uid of ['admin','hod-a','hod-b','co','other','inactive-sup'])await assertFails(topicDecision(id,uid));
 const db=env.authenticatedContext('sup').firestore();await assertFails(updateDoc(doc(db,'projects',id),{title:'Bypassed approval'}));
 await assertFails(topicDecision(id,'sup',{actor:'co'}));await assertFails(topicDecision(id,'sup',{updateTime:null}));for(const uid of ['sup','hod-a','admin','co'])await assertFails(updateDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id),{lastSupervisorUpdateAt:serverTimestamp()}));
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
  batch.update(doc(db,'projects',id),{milestones,lastMilestoneKey:'m0',lastSupervisorUpdateAt:options.updateTime===undefined?serverTimestamp():options.updateTime,lastProgressEventId:eventId,updatedBy:uid,updatedAt:serverTimestamp()});batch.set(doc(db,'projects',id,'progressHistory',eventId),{milestoneKey:'m0',previous:before,current:value,actorId:actor,actorName:actor,createdAt:serverTimestamp()});return batch.commit();
 }
 for(const uid of ['admin','hod-a','co','other'])await assertFails(progress(uid));
 await assertFails(progress('sup',{updateTime:null}));await assertFails(progress('sup',{name:'Renamed stage'}));await assertFails(progress('sup',{changeSecond:true}));await assertFails(progress('sup',{before:{...previous,status:'Completed'}}));await assertFails(progress('sup',{actor:'co'}));
 const db=env.authenticatedContext('sup').firestore();await assertFails(updateDoc(doc(db,'projects',id),{'milestones.m0.status':'Completed'}));await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Withheld'}));await assertFails(progress());await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Reinstated'}));await assertSucceeds(progress());
 const stamp=(await getDoc(doc(db,'projects',id))).data().lastSupervisorUpdateAt;const auditTime=(await getDoc(doc(db,'projects',id,'progressHistory','progress-1'))).data().createdAt;if(!stamp.isEqual(auditTime))throw Error('Progress tracking must use the same server time as its audit');await assertFails(updateDoc(doc(db,'projects',id),{lastSupervisorUpdateAt:serverTimestamp()}));await assertFails(deleteDoc(doc(db,'projects',id,'progressHistory','progress-1')));
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
 const historyQuery=userdb=>query(collection(userdb,'milestoneTemplates',id,'history'),orderBy('createdAt','desc'),limit(10));
 const versions=await assertSucceeds(getDocs(historyQuery(db)));if(versions.size!==2||versions.docs.some(d=>d.data().actorId!=='admin'))throw Error('Super Admin must receive the two saved template versions.');
 await assertSucceeds(getDoc(doc(db,'milestoneTemplates',id,'history','template-1')));
 for(const uid of ['hod-a','hod-b','sup','co','other','foreign','inactive','inactive-sup','unknown']){const restricted=env.authenticatedContext(uid).firestore();await assertFails(getDoc(doc(restricted,'milestoneTemplates',id,'history','template-1')));await assertFails(getDocs(historyQuery(restricted)));}
 const anonymous=env.unauthenticatedContext().firestore();await assertFails(getDoc(doc(anonymous,'milestoneTemplates',id,'history','template-1')));await assertFails(getDocs(historyQuery(anonymous)));
 await assertFails(updateDoc(doc(db,'milestoneTemplates',id,'history','template-1'),{steps:[{name:'Changed old version',days:1}]}));
 const original=(await getDoc(doc(db,'milestoneTemplates',id,'history','template-1'))).data();await assertFails(setDoc(doc(db,'milestoneTemplates',id,'history','invented-version'),{...original,lastEventId:'invented-version',createdAt:serverTimestamp()}));
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
  for(const uid of ['sup','inactive','unapproved'])await assertFails(setDoc(doc(env.authenticatedContext(uid).firestore(),'students',studentId('BIO004')),studentData('BIO004',uid)));
  await assertSucceeds(getDoc(doc(env.authenticatedContext('admin').firestore(),'students',id)));
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
  for(const uid of ['hod-b','other'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'students',id)));
  await assertSucceeds(getDoc(doc(env.authenticatedContext('admin').firestore(),'students',id)));
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
test('Super Admin manages departments and rosters without project access',async()=>{
  const db=env.authenticatedContext('admin').firestore();
  await assertSucceeds(setDoc(doc(db,'departments','new-department'),{name:'New Department',createdBy:'admin',createdAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(db,'departments','new-department'),{name:'Renamed Department'}));
  await assertFails(setDoc(doc(env.authenticatedContext('hod-a').firestore(),'departments','bad-department'),{name:'Other Department',createdBy:'hod-a',createdAt:serverTimestamp()}));
  await assertSucceeds(getDocs(collection(db,'students')));
  await assertFails(getDoc(doc(db,'projects','p1')));
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
 async function request(uid='sup',options={}){const {audit=true,project=true,activity=true}=options;const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);b.set(doc(db,'releaseRequests','release-one'),{studentName:'',projectId:id,departmentId:'dept-a',supervisorId:uid,reason:'Other',note:'Synthetic evidence\nSecond contact attempt.',state:'Pending',decisionNote:'',activity:{milestones:activity?{}:{fake:true},lastProjectUpdate:null,contactEvidence:'Not recorded',uploadEvidence:'Uploads disabled'},createdAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedBy:uid,lastEventId:'request'});if(project)b.update(doc(db,'projects',id),{releaseState:'Pending',releaseRequestId:'release-one',updatedBy:uid,updatedAt:serverTimestamp()});if(audit)b.set(doc(db,'releaseRequests','release-one','history','request'),{state:'Pending',note:'Synthetic evidence\nSecond contact attempt.',actorId:uid,createdAt:serverTimestamp()});return b.commit();}
 for(const uid of ['co','other','foreign','admin','hod-a','inactive-sup'])await assertFails(request(uid));await assertFails(request('sup',{audit:false}));await assertFails(request('sup',{project:false}));await assertFails(request('sup',{activity:false}));await assertSucceeds(request());await assertFails(request());
 for(const uid of ['sup','hod-a'])await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'releaseRequests','release-one')));for(const uid of ['co','other','foreign','admin','hod-b'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'releaseRequests','release-one')));
 await assertSucceeds(getDocs(query(collection(env.authenticatedContext('sup').firestore(),'releaseRequests'),where('departmentId','==','dept-a'),where('supervisorId','==','sup'))));await assertSucceeds(getDocs(query(collection(env.authenticatedContext('hod-a').firestore(),'releaseRequests'),where('departmentId','==','dept-a'))));await assertFails(getDocs(collection(env.authenticatedContext('sup').firestore(),'releaseRequests')));
 async function decision(state,uid='hod-a',options={}){const {audit=true,allocation=true,supervisor='other',note='Synthetic decision'}=options;const db=env.authenticatedContext(uid).firestore();const b=writeBatch(db);const eid=state.toLowerCase();b.update(doc(db,'releaseRequests','release-one'),{state,decisionNote:note,updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:eid});if(audit)b.set(doc(db,'releaseRequests','release-one','history',eid),{state,note,actorId:uid,createdAt:serverTimestamp()});const patch={releaseState:state,updatedBy:uid,updatedAt:serverTimestamp()};if(['Reassigned','Reinstated'].includes(state))Object.assign(patch,{supervisorId:supervisor,supervisorName:supervisor,coSupervisorId:'',coSupervisorName:'',lastAllocationEventId:eid});b.update(doc(db,'projects',id),patch);if(['Reassigned','Reinstated'].includes(state)&&allocation)b.set(doc(db,'projects',id,'allocations',eid),{departmentId:'dept-a',studentId:id,supervisorId:supervisor,coSupervisorId:'',previousSupervisorId:'sup',previousCoSupervisorId:'co',reason:note,actorId:uid,createdAt:serverTimestamp()});return b.commit();}
 for(const uid of ['sup','co','other','hod-b','admin','inactive'])await assertFails(decision('Withheld',uid));await assertFails(decision('Withheld','hod-a',{audit:false}));await assertFails(decision('Withheld','hod-a',{note:''}));await assertFails(decision('Reassigned','hod-a',{allocation:false}));await assertFails(decision('Reassigned','hod-a',{supervisor:'foreign'}));await assertFails(decision('Reassigned','hod-a',{supervisor:'sup'}));await assertSucceeds(decision('Withheld'));await assertFails(topicDecision(id));await assertFails(decision('Declined'));await assertSucceeds(decision('Reinstated'));await assertFails(decision('Reinstated'));await assertFails(updateDoc(doc(env.authenticatedContext('hod-a').firestore(),'releaseRequests','release-one','history','request'),{note:'Rewritten'}));await assertFails(deleteDoc(doc(env.authenticatedContext('hod-a').firestore(),'releaseRequests','release-one')));await assertSucceeds(getDoc(doc(env.authenticatedContext('sup').firestore(),'releaseRequests','release-one')));await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(),'releaseRequests','release-one')));await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects',id)));await assertFails(getDoc(doc(env.authenticatedContext('sup').firestore(),'projects',id)));
});

test('release decline retains supervisors; reassignment removes former access and forbids foreign allocations',async()=>{
 for(const state of ['Declined','Reassigned']){const id='release-'+state;await seedWorkflow(id);const rid='r-'+state;const db=env.authenticatedContext('sup').firestore();const b=writeBatch(db);b.set(doc(db,'releaseRequests',rid),{studentName:'',projectId:id,departmentId:'dept-a',supervisorId:'sup',reason:'Other',note:'Synthetic request',state:'Pending',decisionNote:'',activity:{milestones:{},lastProjectUpdate:null,contacts:{},uploadEvidence:'Uploads disabled'},createdAt:serverTimestamp(),updatedBy:'sup',updatedAt:serverTimestamp(),lastEventId:'request'});b.set(doc(db,'releaseRequests',rid,'history','request'),{state:'Pending',note:'Synthetic request',actorId:'sup',createdAt:serverTimestamp()});b.update(doc(db,'projects',id),{releaseState:'Pending',releaseRequestId:rid,updatedBy:'sup',updatedAt:serverTimestamp()});await assertSucceeds(b.commit());
 const hdb=env.authenticatedContext('hod-a').firestore();const d=writeBatch(hdb);d.update(doc(hdb,'releaseRequests',rid),{state,decisionNote:'Synthetic decision',updatedBy:'hod-a',updatedAt:serverTimestamp(),lastEventId:'decision'});d.set(doc(hdb,'releaseRequests',rid,'history','decision'),{state,note:'Synthetic decision',actorId:'hod-a',createdAt:serverTimestamp()});const patch={releaseState:state,updatedBy:'hod-a',updatedAt:serverTimestamp()};if(state==='Reassigned'){Object.assign(patch,{supervisorId:'other',supervisorName:'other',coSupervisorId:'',coSupervisorName:'',lastAllocationEventId:'decision'});d.set(doc(hdb,'projects',id,'allocations','decision'),{departmentId:'dept-a',studentId:id,supervisorId:'other',coSupervisorId:'',previousSupervisorId:'sup',previousCoSupervisorId:'co',reason:'HOD allocation following a release decision',actorId:'hod-a',createdAt:serverTimestamp()});}d.update(doc(hdb,'projects',id),patch);await assertSucceeds(d.commit());const project=(await getDoc(doc(hdb,'projects',id))).data();if(project.supervisorId!==(state==='Reassigned'?'other':'sup'))throw Error('Incorrect supervisor after decision');if(state==='Reassigned'){await assertFails(getDoc(doc(db,'projects',id)));await assertFails(getDoc(doc(env.authenticatedContext('co').firestore(),'projects',id)));await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects',id)));await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(),'releaseRequests',rid)));}await assertSucceeds(getDoc(doc(db,'releaseRequests',rid)));}
});

test('meeting and contact records are primary-only, atomic, immutable, private and chronologically summarized',async()=>{
 const id='contact-project';await seedWorkflow(id);
 async function log(uid='sup',input={date:'2020-03-01',channel:'Meeting',outcome:'Contacted',note:'Synthetic meeting\nFollow-up agreed.'},options={}){const {summary=true,event=true,forge=false,actor=uid}=options;const db=env.authenticatedContext(uid).firestore();let prior;await env.withSecurityRulesDisabled(async c=>{prior=(await getDoc(doc(c.firestore(),'projects',id,'contactSummary','current'))).data()||emptyContacts;});const eid='contact-'+(prior.total+1);const b=writeBatch(db);if(event)b.set(doc(db,'projects',id,'contacts',eid),{...input,actorId:actor,actorName:actor,createdAt:serverTimestamp()});if(summary)b.set(doc(db,'projects',id,'contactSummary','current'),{...nextContactSummary(prior,input),lastContact:forge?'2010-01-01':nextContactSummary(prior,input).lastContact,lastEventId:eid,updatedBy:uid,updatedAt:serverTimestamp()});return b.commit();}
 for(const uid of ['hod-a','hod-b','co','other','admin','inactive-sup','foreign'])await assertFails(log(uid));await assertFails(log('sup',undefined,{summary:false}));await assertFails(log('sup',undefined,{event:false}));await assertFails(log('sup',undefined,{forge:true}));await assertFails(log('sup',undefined,{actor:'co'}));await assertFails(log('sup',{date:'2020-02-30',channel:'Meeting',outcome:'Contacted',note:'Invalid date'}));await assertFails(log('sup',{date:'2999-01-01',channel:'Meeting',outcome:'Contacted',note:'Future'}));await assertFails(log('sup',{date:'2020-03-01',channel:'Meeting',outcome:'Contacted',note:'   '}));await assertSucceeds(log());await assertSucceeds(log('sup',{date:'2020-03-03',channel:'Phone',outcome:'No response',note:'Synthetic unanswered attempt'}));await assertSucceeds(log('sup',{date:'2020-02-29',channel:'Meeting',outcome:'Contacted',note:'Earlier meeting entered later'}));const db=env.authenticatedContext('sup').firestore();const snapshot=(await getDoc(doc(db,'projects',id,'contactSummary','current'))).data();if(snapshot.total!==3||snapshot.lastMeeting!=='2020-03-01'||snapshot.lastContact!=='2020-03-01'||snapshot.lastAttempt!=='2020-03-03')throw Error('Incorrect contact evidence chronology');
 for(const uid of ['sup','hod-a'])await assertSucceeds(getDocs(collection(env.authenticatedContext(uid).firestore(),'projects',id,'contacts')));for(const uid of ['co','other','hod-b','admin','inactive-sup']){await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id,'contactSummary','current')));await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id,'contacts','contact-1')));}await assertFails(updateDoc(doc(db,'projects',id,'contacts','contact-1'),{note:'Edited history'}));await assertFails(deleteDoc(doc(db,'projects',id,'contacts','contact-1')));await assertFails(updateDoc(doc(db,'projects',id,'contactSummary','current'),{total:999}));
 async function request(contacts=snapshot){const b=writeBatch(db);b.set(doc(db,'releaseRequests','contact-release'),{studentName:'',projectId:id,departmentId:'dept-a',supervisorId:'sup',reason:'Other',note:'Review the recorded attempts',state:'Pending',decisionNote:'',activity:{milestones:{},lastProjectUpdate:null,contacts,uploadEvidence:'Uploads disabled'},createdAt:serverTimestamp(),updatedBy:'sup',updatedAt:serverTimestamp(),lastEventId:'request'});b.set(doc(db,'releaseRequests','contact-release','history','request'),{state:'Pending',note:'Review the recorded attempts',actorId:'sup',createdAt:serverTimestamp()});b.update(doc(db,'projects',id),{releaseState:'Pending',releaseRequestId:'contact-release',updatedBy:'sup',updatedAt:serverTimestamp()});return b.commit();}
 await assertFails(request({...snapshot,lastContact:'2010-01-01'}));await assertFails(request({}));await assertSucceeds(request());await assertSucceeds(log('sup',{date:'2020-03-04',channel:'Phone',outcome:'Contacted',note:'Contact while request pending'}));const frozen=(await getDoc(doc(db,'releaseRequests','contact-release'))).data();if(frozen.activity.contacts.lastContact!=='2020-03-01')throw Error('Release evidence must remain frozen');await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Withheld'}));await assertFails(log());await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{releaseState:'Reinstated',completedDate:'2020-03-05'}));await assertFails(log());await env.withSecurityRulesDisabled(async c=>await updateDoc(doc(c.firestore(),'projects',id),{supervisorId:'other',coSupervisorId:''}));await assertFails(getDoc(doc(db,'projects',id,'contacts','contact-1')));await assertSucceeds(getDoc(doc(env.authenticatedContext('other').firestore(),'projects',id,'contacts','contact-1')));
});

test('Super Admin roster import preserves existing students and cannot allocate or read projects',async()=>{
 const db=env.authenticatedContext('admin').firestore();const id=studentId('ROSTER001');const data={...studentData('ROSTER001','admin'),admissionSession:'2022/2023',currentCGPA:3.35,gender:'Female'};
 for(const extra of [{currentCGPA:5.1},{currentCGPA:'3.35'},{admissionSession:'2028/2029'},{gender:''}])await assertFails(setDoc(doc(db,'students',id),{...data,...extra}));
 await assertSucceeds(setDoc(doc(db,'students',id),data));await assertSucceeds(getDoc(doc(db,'students',id)));await assertSucceeds(getDocs(collection(db,'students')));
 await assertSucceeds(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'students',id)));
 for(const uid of ['hod-b','sup','inactive','unapproved'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'students',id)));
 await assertFails(setDoc(doc(db,'students',id),{...data,name:'Overwrite'}));await assertFails(deleteDoc(doc(db,'students',id)));await assertFails(assignment(db,id));await assertFails(getDoc(doc(db,'projects','p1')));
 const receipt={departmentId:'dept-a',session:'2026/2027',admissionSession:'2022/2023',added:1,skipped:0,actorId:'admin',createdAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(db,'rosterImports','synthetic-import'),receipt));await assertFails(updateDoc(doc(db,'rosterImports','synthetic-import'),{added:2}));await assertFails(deleteDoc(doc(db,'rosterImports','synthetic-import')));
 await assertSucceeds(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'rosterImports','synthetic-import')));for(const uid of ['hod-b','sup'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'rosterImports','synthetic-import')));
});

test('department allocation settings are scoped to HOD or admin with valid limits and trusted stamps',async()=>{
 const setting=async(uid,id='dept-a',overrides={})=>{const db=env.authenticatedContext(uid).firestore();let previousLimit=0;await env.withSecurityRulesDisabled(async c=>{previousLimit=(await getDoc(doc(c.firestore(),'departmentSettings',id))).data()?.primaryLimit||0;});const event=doc(collection(db,'departmentSettings',id,'history'));const batch=writeBatch(db);const data={primaryLimit:10,updatedBy:uid,updatedAt:serverTimestamp(),lastEventId:event.id,...overrides};batch.set(doc(db,'departmentSettings',id),data);batch.set(event,{primaryLimit:data.primaryLimit,previousLimit,actorId:uid,actorName:uid,createdAt:serverTimestamp()});return batch.commit();};
 for(const uid of ['sup','co','other','foreign','inactive','hod-b'])await assertFails(setting(uid));
 await assertFails(setting('hod-a','missing'));for(const primaryLimit of [-1,1001,1.5,'10'])await assertFails(setting('hod-a','dept-a',{primaryLimit}));await assertFails(setting('hod-a','dept-a',{updatedBy:'admin'}));await assertFails(setting('hod-a','dept-a',{extra:true}));
 await assertSucceeds(setting('hod-a'));await assertSucceeds(getDoc(doc(env.authenticatedContext('hod-a').firestore(),'departmentSettings','dept-a')));for(const uid of ['sup','co','hod-b','inactive'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'departmentSettings','dept-a')));
 await assertSucceeds(setting('admin','dept-a',{primaryLimit:20}));await assertSucceeds(setting('hod-a','dept-a',{primaryLimit:0}));await assertFails(deleteDoc(doc(env.authenticatedContext('hod-a').firestore(),'departmentSettings','dept-a')));await assertFails(getDocs(collection(env.authenticatedContext('admin').firestore(),'departmentSettings')));
});

test('allocation setting changes require immutable atomic history and support legacy settings',async()=>{
 await env.withSecurityRulesDisabled(async c=>await setDoc(doc(c.firestore(),'departmentSettings','dept-b'),{primaryLimit:5,updatedBy:'admin'}));const db=env.authenticatedContext('hod-b').firestore();
 const data={primaryLimit:8,updatedBy:'hod-b',updatedAt:serverTimestamp(),lastEventId:'history-1'};
 await assertFails(setDoc(doc(db,'departmentSettings','dept-b'),data));
 async function change(overrides={}){const b=writeBatch(db);b.set(doc(db,'departmentSettings','dept-b'),data);b.set(doc(db,'departmentSettings','dept-b','history','history-1'),{previousLimit:5,primaryLimit:8,actorId:'hod-b',actorName:'hod-b',createdAt:serverTimestamp(),...overrides});return b.commit();}
 await assertFails(change({previousLimit:0}));await assertFails(change({actorName:'Other person'}));await assertFails(change({actorId:'admin'}));await assertSucceeds(change());
 for(const uid of ['admin','hod-b'])await assertSucceeds(getDocs(collection(env.authenticatedContext(uid).firestore(),'departmentSettings','dept-b','history')));for(const uid of ['hod-a','sup','foreign','inactive'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'departmentSettings','dept-b','history','history-1')));
 await assertFails(updateDoc(doc(db,'departmentSettings','dept-b','history','history-1'),{previousLimit:1}));await assertFails(deleteDoc(doc(db,'departmentSettings','dept-b','history','history-1')));await assertFails(change());
});

test('agreed actions are optional private immutable contact evidence and require successful contact',async()=>{
 const id='contact-actions';await seedWorkflow(id);const db=env.authenticatedContext('sup').firestore();
 async function record(agreedActions,outcome='Contacted'){const b=writeBatch(db);const input={date:'2020-01-01',channel:'Meeting',outcome,note:'Synthetic meeting summary',agreedActions};b.set(doc(db,'projects',id,'contacts','actions-1'),{...input,actorId:'sup',actorName:'sup',createdAt:serverTimestamp()});b.set(doc(db,'projects',id,'contactSummary','current'),{...nextContactSummary(emptyContacts,input),lastEventId:'actions-1',updatedBy:'sup',updatedAt:serverTimestamp()});return b.commit();}
 await assertFails(record('Agreed task','No response'));await assertFails(record('Agreed task','Cancelled'));await assertFails(record('a'.repeat(2001)));await assertFails(record(42));await assertSucceeds(record('Student: revise methods\nSupervisor: review draft'));
 for(const uid of ['sup','hod-a'])await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id,'contacts','actions-1')));for(const uid of ['admin','co','hod-b','other'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'projects',id,'contacts','actions-1')));
 await assertFails(updateDoc(doc(db,'projects',id,'contacts','actions-1'),{agreedActions:'Changed tasks'}));
});


test('department staff chat scopes membership, protects private messages and supports only own edits and read settings',async()=>{
 const hod=env.authenticatedContext('hod-a').firestore();const sup=env.authenticatedContext('sup').firestore();const co=env.authenticatedContext('co').firestore();
 const chat=(kind,memberIds=[],name='Synthetic conversation')=>({departmentId:'dept-a',kind,name,memberIds,createdBy:'sup',createdAt:serverTimestamp()});
 await assertSucceeds(setDoc(doc(sup,'chats','general__dept-a'),chat('general')));
 await assertFails(setDoc(doc(sup,'chats','wrong-general'),chat('general')));
 await assertSucceeds(setDoc(doc(sup,'chats','chat-direct'),chat('direct',['sup','co'])));
 await assertSucceeds(setDoc(doc(sup,'chats','chat-group'),chat('group',['sup','co','hod-a'])));
 await env.withSecurityRulesDisabled(async c=>{for(const id of ['chat1','chat2','chat3','chat4','chat5'])await setDoc(doc(c.firestore(),'staff',id),{role:'lecturer',departmentId:'dept-a',active:true,displayName:id});});
 const eight=['sup','co','hod-a','other','chat1','chat2','chat3','chat4'];await assertSucceeds(setDoc(doc(sup,'chats','chat-eight'),chat('group',eight)));await assertFails(setDoc(doc(sup,'chats','chat-nine'),chat('group',[...eight,'chat5'])));
 for(const ids of [['sup','foreign'],['sup','inactive-sup'],['sup','admin'],['co','hod-a'],['sup','sup'],['sup','co','hod-a']])await assertFails(setDoc(doc(sup,'chats','invalid-chat'),chat('direct',ids)));
 const peerQuery=db=>query(collection(db,'staff'),where('departmentId','==','dept-a'),where('active','==',true),where('role','in',['hod','lecturer']));await assertSucceeds(getDocs(peerQuery(sup)));await assertFails(getDocs(collection(sup,'staff')));
 for(const uid of ['sup','co'])await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(),'chats','chat-direct')));
 for(const uid of ['hod-a','admin','other','foreign','inactive-sup'])await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(),'chats','chat-direct')));
 await assertSucceeds(getDocs(query(collection(sup,'chats'),where('departmentId','==','dept-a'),where('memberIds','array-contains','sup'))));await assertFails(getDocs(collection(sup,'chats')));
 const msg=(uid,announcement=false)=>({body:'Hello team',senderId:uid,senderName:uid,removed:false,announcement,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 await assertSucceeds(setDoc(doc(sup,'chats','chat-direct','messages','first'),{...msg('sup'),body:'Hello team'+String.fromCharCode(10)+'Please review the schedule.'}));await assertSucceeds(getDocs(query(collection(co,'chats','chat-direct','messages'),orderBy('createdAt','desc'))));
 for(const uid of ['hod-a','admin','other','foreign','inactive-sup'])await assertFails(getDocs(collection(env.authenticatedContext(uid).firestore(),'chats','chat-direct','messages')));
 await assertFails(setDoc(doc(co,'chats','chat-direct','messages','forged'),msg('sup')));await assertFails(setDoc(doc(sup,'chats','general__dept-a','messages','fake-announcement'),msg('sup',true)));
 await assertSucceeds(setDoc(doc(hod,'chats','general__dept-a','messages','announcement'),msg('hod-a',true)));await assertSucceeds(getDoc(doc(co,'chats','general__dept-a','messages','announcement')));
 await assertFails(updateDoc(doc(co,'chats','chat-direct','messages','first'),{body:'Someone else edit',updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(doc(sup,'chats','chat-direct','messages','first'),{body:'Edited own message',updatedAt:serverTimestamp()}));await assertFails(deleteDoc(doc(sup,'chats','chat-direct','messages','first')));
 await assertSucceeds(updateDoc(doc(sup,'chats','chat-direct','messages','first'),{body:'',removed:true,updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(sup,'chats','chat-direct','messages','first'),{body:'Restored',removed:false,updatedAt:serverTimestamp()}));
 await assertSucceeds(setDoc(doc(sup,'chats','chat-direct','readStates','sup'),{lastReadAt:serverTimestamp(),muted:true}));await assertFails(getDoc(doc(co,'chats','chat-direct','readStates','sup')));await assertFails(setDoc(doc(co,'chats','chat-direct','readStates','sup'),{lastReadAt:serverTimestamp(),muted:false}));
 await assertFails(updateDoc(doc(sup,'chats','chat-direct'),{memberIds:['sup','other']}));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'chats','general__dept-a')));
});
