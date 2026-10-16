import{readFile,stat,open,realpath}from'node:fs/promises';import path from'node:path';import{fileURLToPath}from'node:url';
import{initializeApp,applicationDefault}from'firebase-admin/app';import{getFirestore}from'firebase-admin/firestore';
import{SOURCE_PROJECT,RECOVERY_PROJECT,MAX_PLAINTEXT,encryptBackup,decryptBackup,validateSnapshot}from'./backup-codec.mjs';import{collectFirestore,rehearseFirestore,recoveryTarget}from'./backup-operations.mjs';
let database;
try{
 const[mode,...args]=process.argv.slice(2);if(!['export','inspect','rehearse'].includes(mode)||args.length%2)throw Error('Usage: npm run backup -- export|inspect|rehearse --file PRIVATE_PATH [--actor SUPER_ADMIN_UID (export only)]');
 const options={};for(let i=0;i<args.length;i+=2){if(!['--file','--actor'].includes(args[i])||options[args[i]])throw Error('Unknown or duplicate backup option.');options[args[i]]=args[i+1];}
 if(!options['--file']||mode!=='export'&&options['--actor'])throw Error('Supply --file; --actor is accepted only for export.');
 const password=process.env.PROJECTTRACK_BACKUP_PASSPHRASE;delete process.env.PROJECTTRACK_BACKUP_PASSPHRASE;if(!password||password.trim().length<20||password.length>1024)throw Error('Set PROJECTTRACK_BACKUP_PASSPHRASE privately (20–1,024 characters); do not put it in a command or source file.');
 const file=path.resolve(options['--file']);
 if(mode==='export'){
  const actorId=options['--actor'];if(!actorId||! /^[A-Za-z0-9_-]{1,128}$/.test(actorId))throw Error('Supply an active Super Admin UID for export attribution.');if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Unset emulator hosts before a production export.');
  const repository=await realpath(fileURLToPath(new URL('..',import.meta.url))),parent=await realpath(path.dirname(file)),relative=path.relative(repository,path.join(parent,path.basename(file)));if(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative))throw Error('Choose a private output path outside the repository.');
  try{await stat(file);throw Error('Output file already exists; choose a new private backup filename.');}catch(error){if(error.code!=='ENOENT')throw error;}
  const app=initializeApp({credential:applicationDefault(),projectId:SOURCE_PROJECT}),db=getFirestore(app);database=db;db.settings({useBigInt:true});const actor=await db.doc(`staff/${actorId}`).get();if(!actor.exists||actor.data().active!==true||actor.data().role!=='admin')throw Error('An active Super Admin staff UID is required. Application-default credentials remain the trusted authority.');
  const snapshot=await collectFirestore(db,actorId),encrypted=encryptBackup(snapshot,password);const handle=await open(file,'wx',0o600);try{await handle.writeFile(encrypted);await handle.sync();}finally{await handle.close();}validateSnapshot(decryptBackup(await readFile(file),password),db);
  console.log(`Encrypted Firestore-only export verified: ${snapshot.documents.length} documents. Rolling reads: ${snapshot.startedAt} to ${snapshot.finishedAt}. Existing files were not overwritten. Auth, original files and Firebase configuration are excluded.`);
 }else{
  if((await stat(file)).size>MAX_PLAINTEXT*2+4096)throw Error('Backup file exceeds the pilot size limit.');const snapshot=decryptBackup(await readFile(file),password);validateSnapshot(snapshot,{doc:p=>({path:p})});if(snapshot.sourceProject!==SOURCE_PROJECT)throw Error('Backup source does not match this ProjectTrack project.');
  if(mode==='inspect')console.log(`Authenticated Firestore-only backup: ${snapshot.documents.length} documents; ${snapshot.startedAt} to ${snapshot.finishedAt}; consistency: rolling. Document contents are not printed.`);
  else{recoveryTarget(RECOVERY_PROJECT,process.env.FIRESTORE_EMULATOR_HOST);const app=initializeApp({projectId:RECOVERY_PROJECT}),db=getFirestore(app);database=db;db.settings({useBigInt:true});const result=await rehearseFirestore(db,snapshot);console.log(`Isolated emulator rehearsal passed: ${result.restored} documents restored; ${result.verified} verified. Production was not restored. Auth and files were not restored.`);}
 }
}catch(error){console.error(error.code||error.message);process.exitCode=1;}finally{await database?.terminate().catch(()=>undefined);}
