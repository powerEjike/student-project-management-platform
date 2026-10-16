import{encodeValue,decodeValue,validateSnapshot,documentPath,SOURCE_PROJECT,RECOVERY_PROJECT,MAX_DOCUMENTS,MAX_PLAINTEXT}from'./backup-codec.mjs';
export function recoveryTarget(projectId,host){if(projectId!==RECOVERY_PROJECT||! /^127\.0\.0\.1:([0-9]{1,5})$/.test(host||'')||Number(host.split(':')[1])<1||Number(host.split(':')[1])>65535)throw Error('Recovery is restricted to demo-projecttrack-recovery on a loopback Firestore emulator.');}
export async function collectFirestore(db,actorId){
 const startedAt=new Date().toISOString(),documents=[],visited=new Set();let totalBytes=1024;
 async function visitCollection(collection){const refs=await collection.listDocuments();if(refs.length+visited.size>100000)throw Error('Export exceeds the pilot traversal limit.');for(const ref of refs.sort((a,b)=>a.path.localeCompare(b.path))){documentPath(ref.path);if(visited.has(ref.path))throw Error('Duplicate document path while exporting.');visited.add(ref.path);const snapshot=await ref.get();if(snapshot.exists){const record={path:ref.path,updateTime:{seconds:snapshot.updateTime.seconds,nanoseconds:snapshot.updateTime.nanoseconds},data:encodeValue(snapshot.data(),db.projectId)};totalBytes+=Buffer.byteLength(JSON.stringify(record));if(documents.length>=MAX_DOCUMENTS||totalBytes>MAX_PLAINTEXT)throw Error('Export exceeds the pilot 50,000-document or 32 MB limit. No backup file was written.');documents.push(record);}for(const child of await ref.listCollections())await visitCollection(child);}}
 for(const root of await db.listCollections())await visitCollection(root);
 const snapshot={format:'projecttrack-firestore',version:1,sourceProject:db.projectId,database:db.databaseId,actorId,startedAt,finishedAt:new Date().toISOString(),consistency:'rolling',documents:documents.sort((a,b)=>a.path.localeCompare(b.path))};validateSnapshot(snapshot,db);return snapshot;
}
export async function rehearseFirestore(db,snapshot){
 recoveryTarget(db.projectId,process.env.FIRESTORE_EMULATOR_HOST);if(db.databaseId!=='(default)'||snapshot.sourceProject!==SOURCE_PROJECT)throw Error('Unexpected database or source project.');validateSnapshot(snapshot,db);
 if((await db.listCollections()).length)throw Error('Recovery emulator database is not empty. Start a fresh isolated emulator; existing records are never overwritten or deleted.');
 let restored=0;
 try{for(let offset=0;offset<snapshot.documents.length;offset+=200){const chunk=snapshot.documents.slice(offset,offset+200),batch=db.batch();for(const record of chunk)batch.create(db.doc(record.path),decodeValue(record.data,db));await batch.commit();restored+=chunk.length;}
 const actual=await collectFirestore(db,'recovery-verifier');const values=rows=>rows.map(({path,data})=>({path,data}));if(JSON.stringify(values(actual.documents))!==JSON.stringify(values(snapshot.documents).sort((a,b)=>a.path.localeCompare(b.path))))throw Error('Restored values or document set did not match the backup.');return{restored,verified:actual.documents.length};
 }catch{throw Error(`Restore rehearsal failed after ${restored} committed documents. The isolated emulator may contain partial data; no production database was targeted. Restart it before retrying.`);}
}
