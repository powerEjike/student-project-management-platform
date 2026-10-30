import {useEffect,useState} from 'react';
import {collection,getFirestore,onSnapshot} from 'firebase/firestore';
import {app} from './firebase';
import type {DirectoryStaff} from './adminDirectory';
import type {RegistrationSession} from './academicSession';
import type {SetupDepartment,SetupTemplate,SetupDestination} from './departmentReadiness';
import DepartmentStaffOverview from './DepartmentStaffOverview';
export default function DepartmentSetupOverview({departments,directory,ready,busy,onOpen}:{departments:SetupDepartment[];directory:DirectoryStaff[];ready:boolean;busy:boolean;onOpen:(id:string,destination?:SetupDestination)=>void}){
 const[sessions,setSessions]=useState<RegistrationSession[]>([]),[templates,setTemplates]=useState<SetupTemplate[]>([]),[loaded,setLoaded]=useState<[boolean,boolean]>([false,false]),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let alive=true;setLoaded([false,false]);setSessions([]);setTemplates([]);setError('');const fail=()=>{if(alive){setLoaded([false,false]);setSessions([]);setTemplates([]);setError('Could not verify department setup. Retry to check the latest settings.');}};
  const db=getFirestore(app!);const a=onSnapshot(collection(db,'registrationSessions'),s=>{if(alive){setSessions(s.docs.map(d=>({id:d.id,...d.data()}as RegistrationSession)));setLoaded(v=>[true,v[1]]);}},fail);
  const b=onSnapshot(collection(db,'milestoneTemplates'),s=>{if(alive){setTemplates(s.docs.map(d=>({id:d.id,...d.data()}as SetupTemplate)));setLoaded(v=>[v[0],true]);}},fail);
  return()=>{alive=false;a();b();};
 },[retry]);
 return <>{error&&<p className="notice error" role="alert">{error}<button type="button" className="secondary" onClick={()=>setRetry(v=>v+1)}>Retry setup check</button></p>}<DepartmentStaffOverview departments={departments} directory={directory} ready={ready} busy={busy} onOpen={onOpen} setup={loaded.every(Boolean)&&!error?{sessions,templates}:undefined}/></>;
}
