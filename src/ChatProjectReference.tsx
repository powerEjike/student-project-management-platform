import {useEffect,useState} from 'react';import {watchChatProject} from './chatStore';
export default function ChatProjectReference({chatId,referenceId,onOpen}:{chatId:string;referenceId:string;onOpen:(id:string)=>void}){
 const [project,setProject]=useState<{id:string;title:string}|null>(null);
 useEffect(()=>{setProject(null);return watchChatProject(chatId,referenceId,setProject);},[chatId,referenceId]);
 return project?<div><p className="muted">Linked project: {project.title||'Awaiting topic approval'}</p><button className="secondary" onClick={()=>onOpen(project.id)}>Open linked project</button></div>:<p className="muted">Project link · access restricted or unavailable</p>;
}
