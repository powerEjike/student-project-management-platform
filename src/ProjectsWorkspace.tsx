import AdminRosterBrowser from'./AdminRosterBrowser';
import AdminStaffDirectory from'./AdminStaffDirectory';
import StudentAccessManager from './StudentAccessManager';
import {createAssignedRosterLoader} from './assignedRosterLoader';
import SimpleStudentDashboard from './SimpleStudentDashboard';
import SimpleProjectFolder from './SimpleProjectFolder';
import AdminControlCentre from './AdminControlCentre';
import StudentContactManager from './StudentContactManager';
import DocumentIntakeSettings from './DocumentIntakeSettings';
import StaffBatchPreparation from './StaffBatchPreparation';
import {RepositoryNoticeManager} from './RepositoryNoticePanels';
import ProgressReminderSettings from './ProgressReminderSettings';
import {EthicsPolicyManager} from './EthicsPanels';
import {MeetingMinimumManager} from './MeetingMinimumPanels';
import {RubricManager} from './RubricPanels';
import AllocationSettings from './AllocationSettings';
import AdminActivity from './AdminActivity';
import RosterUpload from './RosterUpload';
import {useEffect,useState,type FormEvent} from 'react';
import {BookOpen,Plus} from 'lucide-react';
import {createDepartment,readStudent,updateStaffAssignment,watchDepartments,watchLecturers,watchProjects,watchStaffDirectory,watchStudents} from './projectStore';
import type {StaffProfile,Student,Project,Lecturer} from './models';
import TemplateManager from './TemplateManager';
type Props={profile:StaffProfile;uid:string;requestedProjectId?:string|null;onProjectRequestHandled?:()=>void};
function readableError(error:unknown){const e=error as {code?:string;message?:string};return e.code==='permission-denied'?'Your account does not have permission for this action.':e.code?'Could not save this change. Check your connection and try again.':e.message||'Could not save this change.';}
export default function ProjectsWorkspace({profile,uid,requestedProjectId,onProjectRequestHandled}:Props){
 const [students,setStudents]=useState<Student[]>([]),[projects,setProjects]=useState<Project[]>([]),[lecturers,setLecturers]=useState<Lecturer[]>([]),[departments,setDepartments]=useState<{id:string;name:string}[]>([]);
 const[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[departmentName,setDepartmentName]=useState(''),[openProject,setOpenProject]=useState<string|null>(null);
  const[staffDepartmentFilter,setStaffDepartmentFilter]=useState('');
  const [adminDepartmentsReady,setAdminDepartmentsReady]=useState(false),[adminDirectoryReady,setAdminDirectoryReady]=useState(false);
  const [directory,setDirectory]=useState<(StaffProfile&{id:string})[]>([]);const [editStaff,setEditStaff]=useState<string|null>(null);const [editRole,setEditRole]=useState<StaffProfile['role']>('lecturer');const [editActive,setEditActive]=useState(true);const [editDepartment,setEditDepartment]=useState('');
  useEffect(()=>{
    setAdminDepartmentsReady(false);setAdminDirectoryReady(false);setDepartments([]);setDirectory([]);setLoaded(false);setError('');setOpenProject(null);setStudents([]);setProjects([]);
    const fail=()=>{setError('Could not load this workspace. Check your connection and staff assignment.');setLoaded(true);};
    if(profile.role==='admin'){const a=watchDepartments(data=>{setDepartments(data);setLoaded(true);setAdminDepartmentsReady(true);},()=>{setAdminDepartmentsReady(false);fail();});const b=watchStaffDirectory(data=>{setDirectory(data);setAdminDirectoryReady(true);},()=>{setAdminDirectoryReady(false);fail();});return()=>{a();b();};}
    const roster=createAssignedRosterLoader(readStudent,setStudents,fail);
    const offProjects=watchProjects(profile,uid,data=>{setProjects(data);setLoaded(true);if(profile.role==='lecturer')roster.refresh(data.map(p=>p.studentId));},()=>{roster.clear();setProjects([]);fail();});
    const offStudents=profile.role==='hod'?watchStudents(profile.departmentId!,setStudents,fail):()=>{};
    const offLecturers=profile.role==='hod'?watchLecturers(profile.departmentId!,setLecturers,fail):()=>{};
    return()=>{roster.dispose();offProjects();offStudents();offLecturers();};
  },[profile.role,profile.departmentId,uid]);
  useEffect(()=>{if(!requestedProjectId||!loaded||profile.role==='admin')return;const target=projects.find(p=>p.id===requestedProjectId);if(target&&students.some(s=>s.id===target.studentId)){setOpenProject(target.id);onProjectRequestHandled?.();return;}const timer=setTimeout(()=>{setError('Could not open this linked project. Your access may have changed; select an available folder or try the link again.');onProjectRequestHandled?.();},10000);return()=>clearTimeout(timer);},[requestedProjectId,loaded,projects,students,profile.role]);
  async function saveDepartment(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await createDepartment(departmentName,uid);setDepartmentName('');setMessage('Department created. Staff access is provisioned by the administrator.');}catch(err){setError(readableError(err));}finally{setBusy(false);}}
  async function saveStaff(e:FormEvent){e.preventDefault();if(!editStaff)return;setBusy(true);setError('');try{await updateStaffAssignment(editStaff,editRole,editActive,departments.find(d=>d.id===editDepartment));setEditStaff(null);setMessage('Staff access updated. The change applies immediately.');}catch(err){setError(readableError(err));}finally{setBusy(false);}}
  const feedback=<>{error&&<div className="notice error" role="alert">{error}</div>}{message&&<div className="notice" role="status">{message}</div>}</>;
  if(profile.role==='admin')return <>{feedback}<AdminControlCentre onStaffDepartment={setStaffDepartmentFilter} departments={departments} directory={directory} departmentsReady={adminDepartmentsReady} directoryReady={adminDirectoryReady} busy={busy}
   staffPanel={<><section className="panel"><form className="department-form" onSubmit={saveDepartment}><div><label htmlFor="department-name">Department name</label><input id="department-name" value={departmentName} onChange={e=>setDepartmentName(e.target.value)} maxLength={120} required placeholder="Department of Biochemistry" disabled={busy}/></div><button className="primary compact" disabled={busy}><Plus size={17}/>Create department</button></form></section><div className="department-list">{departments.map(d=><section className="panel department-card" key={d.id}><div className="department-icon"><BookOpen size={23}/></div><div><h2>{d.name}</h2><p>Department workspace</p></div><ShieldLabel/></section>)}{adminDepartmentsReady&&!departments.length&&<div className="empty-state"><BookOpen/><h2>Create your first department</h2><p>Departments keep project access and staff assignments separate.</p></div>}</div><AdminStaffDirectory directory={directory} departments={departments} ready={adminDepartmentsReady&&adminDirectoryReady} busy={busy} uid={uid} department={staffDepartmentFilter} onDepartment={setStaffDepartmentFilter} onManage={staff=>{setEditStaff(staff.id);setEditRole(staff.role);setEditActive(staff.active);setEditDepartment(staff.departmentId||'');setError('');}}/>{editStaff&&<section className="panel form-panel"><h2>Manage {directory.find(s=>s.id===editStaff)?.displayName}</h2><form onSubmit={saveStaff}><div className="form-grid"><div><label htmlFor="staff-role">Role</label><select id="staff-role" value={editRole} onChange={e=>setEditRole(e.target.value as StaffProfile['role'])} disabled={busy}><option value="lecturer">Lecturer</option><option value="hod">HOD</option><option value="admin">Super Admin</option></select></div>{editRole!=='admin'&&<div><label htmlFor="staff-department">Department</label><select id="staff-department" value={editDepartment} onChange={e=>setEditDepartment(e.target.value)} required disabled={busy}><option value="">Choose a department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>}</div><label className="inline-label"><input type="checkbox" checked={editActive} onChange={e=>setEditActive(e.target.checked)} disabled={busy}/>Active staff access</label><div className="form-actions"><button type="button" className="secondary" onClick={()=>setEditStaff(null)} disabled={busy}>Cancel</button><button className="primary compact" disabled={busy}>{busy?'Saving…':'Save access'}</button></div></form></section>}<StaffBatchPreparation departments={departments} uid={uid}/><p className="muted">New HOD and lecturer accounts are provisioned through trusted administrator tooling.</p></>}
   studentsPanel={<><AdminRosterBrowser departments={departments} departmentsReady={adminDepartmentsReady}/><details className="admin-record-tool"><summary>Upload student roster</summary><RosterUpload departments={departments} uid={uid}/></details><details className="admin-record-tool"><summary>Manage approved portal access</summary><StudentAccessManager departments={departments} uid={uid}/></details><details className="admin-record-tool"><summary>Manage student emails</summary><StudentContactManager departments={departments} uid={uid}/></details></>}
   templatesPanel={<TemplateManager departments={departments} uid={uid}/>}
   activityPanel={<AdminActivity directory={directory} departments={departments}/>}
   policyPanel={d=><><AllocationSettings departmentId={d.id} departmentName={d.name}/><DocumentIntakeSettings departmentId={d.id} departmentName={d.name} uid={uid}/><RepositoryNoticeManager departmentId={d.id} name={d.name} uid={uid}/><ProgressReminderSettings departmentId={d.id} departmentName={d.name} uid={uid}/><EthicsPolicyManager departmentId={d.id} name={d.name} uid={uid}/><MeetingMinimumManager departmentId={d.id} name={d.name} uid={uid}/><RubricManager departmentId={d.id} name={d.name} uid={uid}/></>}
  /></>;
  const currentProject=projects.find(p=>p.id===openProject);const currentStudent=students.find(s=>s.id===currentProject?.studentId);
  if(currentProject&&currentStudent)return <SimpleProjectFolder key={currentProject.id} project={currentProject} student={currentStudent} profile={profile} uid={uid} onBack={()=>setOpenProject(null)}/>;
  return <>{feedback}<SimpleStudentDashboard students={students} projects={projects} lecturers={lecturers} profile={profile} uid={uid} loaded={loaded} onOpen={setOpenProject}/></>;
}

function ShieldLabel(){return <span className="badge">SEPARATE WORKSPACE</span>;}







