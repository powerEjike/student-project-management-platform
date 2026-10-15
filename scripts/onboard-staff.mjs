import {readFile} from 'node:fs/promises';
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {parseStaffBatch,staffBatchUid,existingStaffDecision,runStaffBatch} from './staff-batch-core.mjs';

const projectId = 'student-project-manageme-7efae';
const args = process.argv.slice(2);
const file = args[0];
const actorIndex = args.indexOf('--actor');
const actorId = actorIndex >= 0 ? args[actorIndex + 1] : '';
const apply = args.includes('--apply');
try {
  const allowed = new Set([0,actorIndex,actorIndex + 1,...(apply?[args.indexOf('--apply')]:[])]);
  if (!file || !actorId || actorIndex < 1 || args.some((_,i)=>!allowed.has(i)) || !/^[A-Za-z0-9_-]{1,128}$/.test(actorId)) throw Error('Usage: npm run staff:batch -- path/to/private-staff.json --actor SUPER_ADMIN_UID [--apply]');
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) throw Error('Unset emulator hosts before using this production onboarding tool.');
  const bytes = await readFile(file);
  if (bytes.length > 100_000) throw Error('Input exceeds 100 KB.');
  const rows = parseStaffBatch(JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,'')));
  initializeApp({credential:applicationDefault(),projectId});
  const auth = getAuth();const db = getFirestore();
  const actorRef = db.doc(`staff/${actorId}`);
  async function checkActor(snapshot) {
    if (!snapshot.exists || snapshot.data().role !== 'admin' || snapshot.data().active !== true) throw Error('An active Super Admin staff UID is required.');
    const user = await auth.getUser(actorId);
    if (user.disabled) throw Error('The Super Admin Authentication account is disabled.');
  }
  await checkActor(await actorRef.get());
  const adapter = {
    async inspect(row) {
      const department = await db.doc(`departments/${row.departmentId}`).get();
      if (!department.exists || typeof department.data().name !== 'string' || !department.data().name.trim()) return {state:'conflict',message:'Department does not exist or has no name.'};
      let user;
      try {user = await auth.getUserByEmail(row.email);} catch(error) {if(error.code !== 'auth/user-not-found') throw error;}
      const staff = user ? await db.doc(`staff/${user.uid}`).get() : null;
      return existingStaffDecision(row,user,staff?.data());
    },
    async createAuth(row) {
      await checkActor(await actorRef.get());
      const user = await auth.createUser({uid:staffBatchUid(row.email),email:row.email,displayName:row.displayName,emailVerified:false});
      return user.uid;
    },
    async approve(row,uid) {
      const ref = db.doc(`staff/${uid}`);const event = db.collection('staffAccessChanges').doc();
      await db.runTransaction(async tx => {
        const [actor,department,before] = await Promise.all([tx.get(actorRef),tx.get(db.doc(`departments/${row.departmentId}`)),tx.get(ref)]);
        if (actor.data()?.role !== 'admin' || actor.data()?.active !== true) throw Error('Super Admin access changed.');
        if (!department.exists || typeof department.data().name !== 'string' || !department.data().name.trim()) throw Error('Department changed.');
        if (before.exists) throw Error('Staff record already exists; no overwrite performed.');
        tx.create(ref,{displayName:row.displayName,role:row.role,departmentId:row.departmentId,departmentName:department.data().name,active:true,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),lastAccessEventId:event.id});
        tx.create(event,{staffId:uid,role:row.role,active:true,departmentId:row.departmentId,previousRole:'',previousActive:false,previousDepartmentId:'',actorId,createdAt:FieldValue.serverTimestamp()});
      });
    }
  };
  const result = await runStaffBatch(rows,adapter,apply);
  console.log(`Project: ${projectId}. Mode: ${apply?'APPLY':'PREVIEW (no writes)'}.`);
  console.table(result.plan.map(({email,displayName,role,departmentId,state,message})=>({email,displayName,role,departmentId,state,message:message||''})));
  if (result.results.length) console.table(result.results);
  if (result.plan.some(row=>row.state==='conflict') || result.incomplete) process.exitCode=1;
  else console.log(apply?'Batch finished. No emails were sent. Staff use Forgot password to set their own passwords.':'Review every row, then rerun with --apply to create accounts and audited staff access.');
  if (result.incomplete) console.error('Stopped after a failure. Earlier successful rows remain saved. If access is pending, repair that UID through trusted administrator tooling; reruns will flag it as a conflict. No accounts were deleted.');
} catch(error) {console.error(error.code || error.message);process.exitCode=1;}
