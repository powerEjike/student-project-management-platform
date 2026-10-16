import{randomBytes,scryptSync,createCipheriv,createDecipheriv}from'node:crypto';
import{Timestamp,GeoPoint,DocumentReference}from'firebase-admin/firestore';
export const SOURCE_PROJECT='student-project-manageme-7efae';
export const RECOVERY_PROJECT='demo-projecttrack-recovery';
export const MAX_DOCUMENTS=50000,MAX_PLAINTEXT=32*1024*1024;
const aad=Buffer.from('ProjectTrack Firestore backup v1');
function fail(){throw Error('Invalid or unsupported backup data.');}
function exact(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join('|')!==keys.slice().sort().join('|'))fail();}
export function documentPath(path){if(typeof path!=='string'||Buffer.byteLength(path)>6144)fail();const parts=path.split('/');if(!parts.length||parts.length%2||parts.length>200||parts.some(s=>!s||s==='.'||s==='..'||s.includes('\0')||Buffer.byteLength(s)>1500))fail();return path;}
function integer(value){if(typeof value!=='string'||! /^-?(0|[1-9][0-9]*)$/.test(value))fail();const n=BigInt(value);if(n.toString()!==value||n<-(1n<<63n)||n>(1n<<63n)-1n)fail();return n;}
function timestamp(value){exact(value,['seconds','nanoseconds']);if(!Number.isSafeInteger(value.seconds)||value.seconds < -62135596800||value.seconds > 253402300799||!Number.isInteger(value.nanoseconds)||value.nanoseconds<0||value.nanoseconds>=1000000000)fail();return new Timestamp(value.seconds,value.nanoseconds);}
function bytes(value,expected){if(typeof value!=='string'||value.length>MAX_PLAINTEXT*2)fail();const b=Buffer.from(value,'base64');if(b.toString('base64')!==value||expected!==undefined&&b.length!==expected)fail();return b;}
export function encodeValue(value,sourceProject,depth=0){
 if(depth>40)fail();const next=v=>encodeValue(v,sourceProject,depth+1);
 if(value===null)return{type:'null',value:null};
 if(typeof value==='boolean'||typeof value==='string')return{type:typeof value,value};
 if(typeof value==='bigint')return{type:'integer',value:integer(value.toString()).toString()};
 if(typeof value==='number'){if(Number.isSafeInteger(value))return{type:'integer',value:BigInt(value).toString()};return{type:'double',value:Number.isNaN(value)?'NaN':value===Infinity?'Infinity':value===-Infinity?'-Infinity':String(value)};}
 if(value instanceof Timestamp)return{type:'timestamp',value:{seconds:value.seconds,nanoseconds:value.nanoseconds}};
 if(value instanceof GeoPoint)return{type:'geopoint',value:[value.latitude,value.longitude]};
 if(Buffer.isBuffer(value)||value instanceof Uint8Array)return{type:'bytes',value:Buffer.from(value).toString('base64')};
 if(value instanceof DocumentReference){if(value.firestore.projectId!==sourceProject||value.firestore.databaseId!=='(default)')throw Error('Cross-project or named-database references are not supported.');return{type:'reference',value:documentPath(value.path)};}
 if(Array.isArray(value))return{type:'array',value:value.map(next)};
 if(value&&Object.getPrototypeOf(value)===Object.prototype||value&&Object.getPrototypeOf(value)===null)return{type:'map',value:Object.keys(value).sort().map(key=>[key,next(value[key])])};
 throw Error('Unsupported Firestore value; export stopped rather than dropping it.');
}
export function decodeValue(node,db,depth=0,budget={nodes:0}){
 if(depth>40||++budget.nodes>2000000)fail();exact(node,['type','value']);const v=node.value,next=n=>decodeValue(n,db,depth+1,budget);
 switch(node.type){
  case'null':if(v!==null)fail();return null;
  case'boolean':if(typeof v!=='boolean')fail();return v;
  case'string':if(typeof v!=='string')fail();return v;
  case'integer':return integer(v);
  case'double':if(typeof v!=='string')fail();if(v==='NaN')return NaN;if(v==='Infinity')return Infinity;if(v==='-Infinity')return-Infinity;if(!v.trim()||!Number.isFinite(Number(v))||String(Number(v))!==v)fail();return Number(v);
  case'timestamp':return timestamp(v);
  case'geopoint':if(!Array.isArray(v)||v.length!==2||v.some(n=>typeof n!=='number'||!Number.isFinite(n))||Math.abs(v[0])>90||Math.abs(v[1])>180)fail();return new GeoPoint(v[0],v[1]);
  case'bytes':return bytes(v);
  case'reference':return db.doc(documentPath(v));
  case'array':if(!Array.isArray(v))fail();return v.map(next);
  case'map':{if(!Array.isArray(v))fail();const seen=new Set();return Object.fromEntries(v.map(pair=>{if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||seen.has(pair[0]))fail();seen.add(pair[0]);return[pair[0],next(pair[1])];}));}
  default:fail();
 }
}
function iso(value){if(typeof value!=='string'||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)fail();}
export function validateSnapshot(snapshot,db){
 exact(snapshot,['format','version','sourceProject','database','actorId','startedAt','finishedAt','consistency','documents']);
 if(snapshot.format!=='projecttrack-firestore'||snapshot.version!==1||snapshot.database!=='(default)'||snapshot.consistency!=='rolling'||typeof snapshot.sourceProject!=='string'||! /^[a-z][a-z0-9-]{4,62}$/.test(snapshot.sourceProject)||typeof snapshot.actorId!=='string'||!snapshot.actorId||snapshot.actorId.length>128)fail();iso(snapshot.startedAt);iso(snapshot.finishedAt);if(snapshot.startedAt>snapshot.finishedAt||!Array.isArray(snapshot.documents)||snapshot.documents.length>MAX_DOCUMENTS)fail();
 const paths=new Set(),budget={nodes:0};for(const record of snapshot.documents){exact(record,['path','updateTime','data']);documentPath(record.path);if(paths.has(record.path)||record.data?.type!=='map')fail();paths.add(record.path);timestamp(record.updateTime);decodeValue(record.data,db,0,budget);}return snapshot;
}
function passphrase(value){if(typeof value!=='string'||value.trim().length<20||value.length>1024)throw Error('Set PROJECTTRACK_BACKUP_PASSPHRASE to a private passphrase of 20–1,024 characters.');}
function key(password,salt){passphrase(password);return scryptSync(password,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});}
export function encryptBackup(snapshot,password){const plaintext=Buffer.from(JSON.stringify(snapshot));if(plaintext.length>MAX_PLAINTEXT)throw Error('Backup exceeds the pilot 32 MB plaintext limit. No partial file was written.');const salt=randomBytes(16),iv=randomBytes(12),derived=key(password,salt);try{const cipher=createCipheriv('aes-256-gcm',derived,iv);cipher.setAAD(aad);const ciphertext=Buffer.concat([cipher.update(plaintext),cipher.final()]);return Buffer.from(JSON.stringify({format:'projecttrack-encrypted',version:1,kdf:'scrypt-32768-8-1',salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')}));}finally{derived.fill(0);plaintext.fill(0);}}
export function decryptBackup(input,password){if(input.length>MAX_PLAINTEXT*2+4096)fail();let envelope;try{envelope=JSON.parse(Buffer.from(input).toString('utf8'));}catch{throw Error('Invalid encrypted backup envelope.');}exact(envelope,['format','version','kdf','salt','iv','tag','ciphertext']);if(envelope.format!=='projecttrack-encrypted'||envelope.version!==1||envelope.kdf!=='scrypt-32768-8-1')fail();const salt=bytes(envelope.salt,16),iv=bytes(envelope.iv,12),tag=bytes(envelope.tag,16),ciphertext=bytes(envelope.ciphertext);if(ciphertext.length>MAX_PLAINTEXT)fail();const derived=key(password,salt);let plaintext;try{const decipher=createDecipheriv('aes-256-gcm',derived,iv);decipher.setAAD(aad);decipher.setAuthTag(tag);plaintext=Buffer.concat([decipher.update(ciphertext),decipher.final()]);return JSON.parse(plaintext.toString('utf8'));}catch{throw Error('Backup could not be authenticated. Check the passphrase and file integrity.');}finally{derived.fill(0);plaintext?.fill(0);}}
