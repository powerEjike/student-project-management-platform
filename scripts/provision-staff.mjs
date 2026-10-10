import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const [email, role, displayName, departmentId = '', departmentName = ''] = process.argv.slice(2);
if (!email || !displayName?.trim() || !['admin', 'hod', 'lecturer'].includes(role) || (role !== 'admin' && !departmentId.trim())) {
  console.error('Usage: npm run staff -- email admin|hod|lecturer "Display name" [departmentId] ["Department name"]');
  process.exit(1);
}
// Uses the operator's application-default credentials, never a credential in source control.
initializeApp({ credential: applicationDefault(), projectId: 'student-project-manageme-7efae' });
const auth = getAuth();
let user;
try { user = await auth.getUserByEmail(email); }
catch (error) {
  if (error.code !== 'auth/user-not-found') throw error;
  user = await auth.createUser({ email, displayName });
}
await getFirestore().doc(`staff/${user.uid}`).set({role, displayName:displayName.trim(), departmentId, departmentName, active:true, updatedAt:FieldValue.serverTimestamp()}, {merge:true});
console.log(`Approved staff record saved for ${email} (${role}). The staff member can use Forgot password to set their password.`);
