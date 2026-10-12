import {useEffect,useRef,useState} from 'react';import {checkArchive} from './archiveStore';import {titleKey} from './archive';
import type {TopicMatch} from './topicSimilarity';
export default function ArchiveCheck({departmentId,title,onChecked}:{departmentId:string;title:string;onChecked?:(title:string|null)=>void}){
 const [matches,setMatches]=useState<TopicMatch[]|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const request=useRef(0);
 useEffect(()=>{++request.current;setMatches(null);setError('');setBusy(false);onChecked?.(null);},[title,departmentId]);
 useEffect(()=>()=>{++request.current;},[]);
 async function check(){const generation=++request.current;setBusy(true);setMatches(null);onChecked?.(null);setError('');try{const items=await checkArchive(departmentId,title);if(generation!==request.current)return;setMatches(items);onChecked?.(titleKey(title));}catch{if(generation===request.current){setError('Could not check the archive. Check your connection and try again.');onChecked?.(null);}}finally{if(generation===request.current)setBusy(false);}}
 return <div className="archive-check"><h3>Topic archive check</h3><button type="button" className="secondary" onClick={check} disabled={busy||!titleKey(title)}>{busy?'Checking archive…':'Check department archive'}</button>{error&&<p className="notice error" role="alert">{error}</p>}{matches&&<div role="status">{matches.length?<><p className="notice">{matches.length} exact or similar archived project{matches.length===1?'':'s'}. The supervisor decides whether to proceed.</p>{matches.map(m=><div className="archive-match" key={m.id}><strong>{m.title}</strong><small>{m.matchKind==='exact'?'Exact title match':'Possible similar topic'}</small><p>{m.year} · {m.author}</p><small>{m.programme}</small></div>)}</>:<p>No exact or similar title found. This title-based check cannot guarantee that the research has never been done.</p>}</div>}</div>;
}

