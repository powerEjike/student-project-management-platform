import{readFile,readdir}from'node:fs/promises';
import{createHash}from'node:crypto';
const dist=new URL('../dist/',import.meta.url),hosts=['projecttrack-biochemistry.web.app','student-project-manageme-7efae.web.app'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const index=await readFile(new URL('index.html',dist)),html=index.toString('utf8'),assets=new Set([...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match=>match[1]).filter(path=>/^\/assets\/[^/]+\.(js|css)$/.test(path)));
if(!assets.size)throw Error('Build entry assets were not found. Run npm run build first.');
const files=await readdir(new URL('assets/',dist));
for(const prefix of['ProjectsWorkspace-','StudentPortal-','ClassAttendance-','AttendanceReportNotifications-','StaffChat-','DocumentReview-']){
 const file=files.find(name=>name.startsWith(prefix)&&name.endsWith('.js'));if(!file)throw Error('Missing built feature chunk: '+prefix);assets.add('/assets/'+file);
}
const expected=new Map();for(const path of assets)expected.set(path,digest(await readFile(new URL(path.slice(1),dist))));
async function verify(host,path,hash){const response=await fetch('https://'+host+path,{signal:AbortSignal.timeout(30000),cache:'no-store'});if(!response.ok)throw Error(host+path+' returned HTTP '+response.status);if(digest(Buffer.from(await response.arrayBuffer()))!==hash)throw Error(host+path+' differs from the local build.');}
for(const host of hosts){
 await verify(host,'/?release='+digest(index),digest(index));
 const entries=[...expected];for(let i=0;i<entries.length;i+=4)await Promise.all(entries.slice(i,i+4).map(([path,hash])=>verify(host,path,hash)));
 console.log(host+': index and '+assets.size+' entry/feature assets match the local build.');
}
