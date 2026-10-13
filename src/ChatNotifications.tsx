import {useEffect,useState} from 'react';
import {watchChats,watchMessages,watchChatRead,type ChatRead} from './chatStore';
import {unreadMessages,type Chat,type ChatMessage} from './chat';
import {summarizeChatNotices,type ChatNotice} from './chatNoticeSummary';
export default function ChatNotifications({departmentId,uid,hidden,onCount,onOpen}:{departmentId:string;uid:string;hidden:boolean;onCount:(count:number)=>void;onOpen:(chatId:string)=>void}){
 const [rows,setRows]=useState<ChatNotice[]>([]);const [error,setError]=useState('');const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  let active=true;type State={chat:Chat;messages:ChatMessage[];read:ChatRead;messagesReady:boolean;readReady:boolean;error:boolean;off:()=>void};const states=new Map<string,State>();
  const emit=()=>{if(active)setRows([...states.values()].map(state=>({id:state.chat.id,label:state.chat.kind==='direct'?'Private conversation':state.chat.name,unread:unreadMessages(state.messages,uid,state.read.lastReadAt),muted:state.read.muted,ready:state.messagesReady&&state.readReady,error:state.error})));};
  setRows([]);setError('');setLoaded(false);onCount(0);
  const off=watchChats(departmentId,uid,chats=>{if(!active)return;setLoaded(true);for(const [id,state] of states)if(!chats.some(chat=>chat.id===id)){state.off();states.delete(id);}for(const chat of chats){const existing=states.get(chat.id);if(existing){existing.chat=chat;continue;}const state:State={chat,messages:[],read:{muted:false},messagesReady:false,readReady:false,error:false,off:()=>{}};states.set(chat.id,state);const failed=()=>{state.error=true;state.messages=[];emit();};const a=watchMessages(chat.id,messages=>{state.messages=messages;state.messagesReady=true;emit();},failed);const b=watchChatRead(chat.id,uid,read=>{state.read=read;state.readReady=true;emit();},failed);state.off=()=>{a();b();};}emit();},()=>{for(const state of states.values())state.off();states.clear();setRows([]);setLoaded(true);setError('Chat notifications could not be checked. Open Staff chat or refresh the workspace to retry.');});
  return()=>{active=false;off();for(const state of states.values())state.off();onCount(0);};
 },[departmentId,uid,onCount]);
 const summary=summarizeChatNotices(rows);useEffect(()=>onCount(summary.total),[summary.total,onCount]);
 if(hidden)return null;
 if(error)return <p className="notice error" role="alert">{error}</p>;
 if(!loaded)return <p className="muted" role="status">Checking chat notifications...</p>;
 return <>{!summary.complete&&<p className="muted">Some chat notifications are still loading or could not be checked.</p>}{summary.notices.length>0&&<section className="panel"><h2>New staff messages</h2><p role="status">{summary.notices.reduce((sum,row)=>sum+row.unread,0)} unread messages in {summary.notices.length} unmuted conversation{summary.notices.length===1?'':'s'}.</p><div className="template-list">{summary.notices.slice(0,5).map(row=><button className="secondary" key={row.id} onClick={()=>onOpen(row.id)}>{row.label} · {row.unread} unread</button>)}</div>{summary.notices.length>5&&<p className="muted">Open Staff chat to view all unread conversations.</p>}<p className="muted">Opening a visible conversation marks its messages as read. Muted conversations stay in the Staff chat unread count.</p></section>}</>;
}
