import {useEffect,useState} from 'react';
import {doc,getFirestore,onSnapshot,updateDoc} from 'firebase/firestore';
import {app} from './firebase';
import {departmentStudentLink} from './departmentLink';
export type Department={id:string;name:string;programme?:string;accent?:string;welcome?:string};
export function DepartmentLink({department}:{department:Department}){
 const[ready,setReady]=useState(false),[session,setSession]=useState(''),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 useEffect(()=>{setReady(false);setSession('');setError('');return onSnapshot(doc(getFirestore(app!),'registrationSessions',department.id),s=>{setSession(s.data()?.session||'');setReady(true);},()=>setError('Could not check registration setup.'));},[department.id]);
 const link=departmentStudentLink(location.origin,department.id);
 return <div className="department-share"><label>Student registration link<input readOnly aria-label={`${department.name} student link`} value={link} onFocus={e=>e.target.select()}/></label><button className="secondary" type="button" disabled={!ready||!session} onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(true);}catch{setError('Select and copy the link above.');}}}>{copied?'Link copied':'Copy student link'}</button><p className="muted">{!ready?'Checking registration setup…':session?`Registration session: ${session}. Students still need Super Admin approval.`:'Set an active academic session in Super Admin settings before sharing.'}</p>{error&&<p role="alert">{error}</p>}</div>;
}
export function DepartmentCard({department}:{department:Department}){
 const[programme,setProgramme]=useState(department.programme||''),[accent,setAccent]=useState(department.accent||'#133d33'),[welcome,setWelcome]=useState(department.welcome||''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{setProgramme(department.programme||'');setAccent(department.accent||'#133d33');setWelcome(department.welcome||'');},[department.programme,department.accent,department.welcome]);
 return <section className="panel" style={{borderTop:`4px solid ${department.accent||'#133d33'}`}}><h3>{department.name}</h3><DepartmentLink department={department}/><details><summary>Customize department</summary><form className="form-panel" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{await updateDoc(doc(getFirestore(app!),'departments',department.id),{programme:programme.trim(),accent,welcome:welcome.trim()});setMessage('Department appearance and default programme saved.');}catch{setMessage('Could not save department settings. Try again.');}finally{setBusy(false);}}}><label>Default programme<input required maxLength={80} placeholder="For example, BSc Chemistry" value={programme} onChange={e=>setProgramme(e.target.value)} disabled={busy}/></label><label>Welcome line<input maxLength={160} placeholder="A short welcome for your department workspace" value={welcome} onChange={e=>setWelcome(e.target.value)} disabled={busy}/></label><label>Department colour<input type="color" value={accent} onChange={e=>setAccent(e.target.value)} disabled={busy}/></label><button className="primary compact" disabled={busy}>{busy?'Saving…':'Save customization'}</button>{message&&<p role="status">{message}</p>}</form></details></section>;
}
export function DepartmentIdentity({id}:{id:string}){
 const[department,setDepartment]=useState<Department|null>(null);
 useEffect(()=>{setDepartment(null);return onSnapshot(doc(getFirestore(app!),'departments',id),s=>setDepartment(s.exists()?{id:s.id,...s.data()}as Department:null),()=>setDepartment(null));},[id]);
 if(!department)return null;
 return <section className="panel department-identity" style={{borderLeft:`5px solid ${department.accent||'#133d33'}`}}><h2>{department.name}</h2>{department.welcome&&<p>{department.welcome}</p>}</section>;
}
