import {useEffect,useRef,useState,type ReactNode} from 'react';
import {MessageCircle,Minus} from 'lucide-react';

export default function FloatingStaffChat({open,onOpenChange,unread,children}:{open:boolean;onOpenChange:(open:boolean)=>void;unread:number;children:(active:boolean)=>ReactNode}){
 const [opened,setOpened]=useState(open);
 const trigger=useRef<HTMLButtonElement>(null),minimize=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(open){setOpened(true);minimize.current?.focus();}},[open]);
 function close(){onOpenChange(false);trigger.current?.focus();}
 return <div className="floating-staff-chat">
  <section id="floating-staff-chat-panel" className="floating-chat-panel" role="region" aria-label="Staff chat" hidden={!open} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close();}}}>
   <div className="floating-chat-header"><div><MessageCircle size={21}/><strong>Staff chat</strong></div><button ref={minimize} type="button" aria-label="Minimize staff chat" onClick={close}><Minus size={22}/></button></div>
   <div className="floating-chat-content">{(open||opened)&&children(open)}</div>
  </section>
  <button ref={trigger} type="button" className="floating-chat-launcher" aria-label={open?'Minimize staff chat':`Open staff chat${unread?`, ${unread} unread messages`:''}`} aria-expanded={open} aria-controls="floating-staff-chat-panel" onClick={()=>open?close():onOpenChange(true)}><MessageCircle size={27}/>{!open&&unread>0&&<span className="floating-chat-unread">{unread>99?'99+':unread}</span>}</button>
 </div>;
}
