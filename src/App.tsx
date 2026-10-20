import FloatingStaffChat from './FloatingStaffChat';
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { ArrowRight, BookOpen, Check, ChevronRight, Eye, EyeOff, GraduationCap, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { auth, authReady, configured } from './firebase';
import { ROLE_LABELS, validProfile } from './access.mjs';
import { staleStaffModule } from './staffRecovery';
const StudentApprovalNotification=lazy(()=>import('./StudentApprovalQueue').then(module=>({default:module.StudentApprovalNotification})));
const StudentApprovalQueue=lazy(()=>import('./StudentApprovalQueue'));
const StudentPortal=lazy(()=>import('./StudentPortal'));
const StudentSignIn=lazy(()=>import('./StudentPortal').then(module=>({default:module.StudentSignIn})));
const ProjectNotifications = lazy(() => import('./ProjectNotifications'));
const ChatNotifications = lazy(() => import('./ChatNotifications'));
const StaffChat = lazy(() => import('./StaffChat'));
const WorkflowGuide = lazy(() => import('./WorkflowGuide'));
const MessageReportInbox=lazy(()=>import('./MessageReportInbox'));
const ProjectsWorkspace = lazy(() => import('./ProjectsWorkspace'));
type Profile = { role: 'admin' | 'hod' | 'lecturer'; active: boolean; displayName: string; departmentId?: string; departmentName?: string };
function errorMessage(error: unknown) {
  const code = (error as {code?: string}).code;
  if (code === 'auth/network-request-failed') return 'Could not connect. Check your connection and try again.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a little before trying again.';
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') return 'Staff sign-in is not ready yet. Please contact your administrator.';
  return 'Unable to sign in. Check your email and password, or contact your administrator.';
}
function Brand() {return <a className="brand" href="/" aria-label="ProjectTrack home"><span className="brand-mark"><GraduationCap size={25}/></span><span>Project<span className="brand-light">Track</span></span></a>;}
export default function App() {
  const [studentEntry,setStudentEntry]=useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!auth);
  const [profileError, setProfileError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [projectUnread,setProjectUnread]=useState(0);
  const [chatOpen,setChatOpen]=useState(false);
  const [chatUnread,setChatUnread]=useState(0);const [requestedChatId,setRequestedChatId]=useState<string|null>(null);
  const [requestedProjectId,setRequestedProjectId]=useState<string|null>(null);
 const [page, setPage] = useState('Workspace');
  useEffect(() => {
    if (!auth) return;
    let generation = 0;
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async next => {
      const current = ++generation;
      unsubscribeProfile?.(); setUser(next); setProfile(null); setProfileError(''); setPage('Workspace');setRequestedProjectId(null);setRequestedChatId(null);setChatUnread(0);setChatOpen(false);setProjectUnread(0);
      if (!next) {setLoading(false); return;}
      setLoading(true);
      const fail = (cause?: unknown) => {if (current !== generation) return; const code=(cause as {code?:string})?.code; console.warn('Staff access check failed',code||'module-load-failed'); setProfileError(`Your staff access could not be checked${code?` (${code})`:''}. Try signing out and back in, or contact your administrator.`); setLoading(false);};
      try {
        const { watchStaff } = await import('./staffStore');
        if (current !== generation) return;
        unsubscribeProfile = watchStaff(next.uid, data => {
          if (current !== generation) return;
          setProfile(validProfile(data) ? data as Profile : null); setLoading(false); try {sessionStorage.removeItem('projecttrack-staff-recovery');} catch {}
        }, fail);
      } catch (cause) {if(staleStaffModule(cause)){try {if(!sessionStorage.getItem('projecttrack-staff-recovery')){sessionStorage.setItem('projecttrack-staff-recovery','1');window.location.reload();return;}}catch {}}fail(cause);}
    });
    return () => {++generation; unsubscribe(); unsubscribeProfile?.();};
  }, []);
  async function login(event: FormEvent) {
    event.preventDefault(); if (!auth) return;
    setBusy(true); setError(''); setMessage('');
    try {await authReady; await signInWithEmailAndPassword(auth, email.trim(), password); setPassword('');}
    catch (e) {setError(errorMessage(e));} finally {setBusy(false);}
  }
  async function reset() {
    setError(''); setMessage('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {setError('Enter your staff email above first.'); return;}
    if (!auth) return; setBusy(true);
    try {await sendPasswordResetEmail(auth, email.trim()); setMessage('If this email has a staff account, you will receive a password reset link.');}
    catch {setError('Could not send the reset request. Please try again later.');} finally {setBusy(false);}
  }
  async function logout() {setError(''); try {await signOut(auth!);} catch {setError('Could not sign out. Please try again.');}}
  if (loading) return <main className="loading"><Brand/><span className="spinner"/><p>Opening your workspace…</p></main>;
  if(user&&!profile&&!profileError)return <Suspense fallback={<p role="status">Opening student portal…</p>}><StudentPortal key={user.uid} user={user} onLogout={logout}/></Suspense>;
  if (user && !profile) return <main className="access-state"><Brand/><ShieldCheck size={46}/><h1>Staff access required</h1><p>{profileError || 'Your account does not have an active staff assignment. Ask your administrator to approve your role and department.'}</p><p className="muted">Signed in as {user.email}</p><button className="secondary" onClick={()=>window.location.reload()}>Refresh workspace</button><button className="primary" onClick={logout}>Sign out</button>{error && <p role="alert">{error}</p>}</main>;
  if (user && profile) return <div className="workspace">
    <aside><Brand/><div className="workspace-label">STAFF WORKSPACE</div><nav aria-label="Main navigation">{(profile.role==='admin'?['Workspace','Student approvals','Message reports']:['Workspace','Notifications']).map(item => <button key={item} className={page === item ? 'nav-item selected' : 'nav-item'} onClick={() => setPage(item)}>{item === 'Workspace' ? <LayoutDashboard size={19}/> : <ShieldCheck size={19}/>} {item}{item==='Notifications'&&projectUnread+chatUnread>0&&<span className="badge">{projectUnread+chatUnread} unread</span>}{item==='Staff chat'&&chatUnread>0&&<span className="badge">{chatUnread} unread</span>}</button>)}</nav><div className="sidebar-bottom"><span className="avatar">{profile.displayName.slice(0,1)}</span><div><strong>{profile.displayName}</strong><small>{ROLE_LABELS[profile.role]}</small></div><button aria-label="Sign out" onClick={logout}><LogOut size={19}/></button></div></aside>
    <main className="workspace-main"><header><span>{profile.departmentName || (profile.role === 'admin' ? 'Super Admin workspace' : profile.departmentId)}</span><span className="badge"><ShieldCheck size={14}/> Approved staff</span></header><div className="workspace-content"><div className="eyebrow">PROJECTTRACK / {page.toUpperCase()}</div><h1>{page === 'Workspace' ? (profile.role==='admin'?'Administration':profile.role==='hod'?'Department dashboard':'My supervision') : page==='Notifications'?'Notifications':page==='Staff chat'?'Staff chat':page==='Student approvals'?'Student approvals':page==='Message reports'?'Message reports':page==='Workflow guide'?'Workflow guide':'Your access, explained.'}</h1>
    {profile.role==='admin'&&<Suspense fallback={null}><StudentApprovalNotification key={user.uid} onOpen={()=>setPage('Student approvals')}/></Suspense>}
    {profile.role!=='admin'&&<Suspense fallback={null}><ChatNotifications key={user.uid+'__'+profile.departmentId} departmentId={profile.departmentId!} uid={user.uid} hidden={chatOpen} onCount={setChatUnread} onOpen={id=>{setRequestedChatId(id);setChatOpen(true);}}/></Suspense>}
    {profile.role!=='admin'&&<Suspense fallback={null}><ProjectNotifications key={user.uid+'__'+profile.departmentId} profile={profile} uid={user.uid} visible={page==='Notifications'} onCount={setProjectUnread} onOpen={id=>{setRequestedProjectId(id);setPage('Workspace');}}/></Suspense>}
    {page==='Workflow guide'?<Suspense fallback={<p role="status">Loading workflow guide...</p>}><WorkflowGuide key={profile.role} role={profile.role} onNavigate={setPage}/></Suspense>:page === 'Workspace' ? <Suspense fallback={<p role="status">Loading your workspace…</p>}><ProjectsWorkspace profile={profile} uid={user.uid} requestedProjectId={requestedProjectId} onProjectRequestHandled={()=>setRequestedProjectId(null)}/></Suspense>:page==='Student approvals'&&profile.role==='admin'?<Suspense fallback={<p>Loading student requests…</p>}><StudentApprovalQueue uid={user.uid} actorName={profile.displayName}/></Suspense>:page==='Message reports'?<Suspense fallback={<p role="status">Loading message reports...</p>}><MessageReportInbox key={user.uid+'__'+profile.role+'__'+profile.departmentId} profile={profile} uid={user.uid}/></Suspense>: <section className="panel policy"><h2>Staff permissions</h2><table><thead><tr><th>Role</th><th>Project access</th></tr></thead><tbody><tr><td>Super Admin</td><td>Manages departments, staff access and student roster uploads. Project folders and private supervisor records remain restricted.</td></tr><tr><td>Head of Department</td><td>Projects in their assigned department.</td></tr><tr><td>Supervisor</td><td>Assigned and co-supervised projects in their department.</td></tr></tbody></table><p>Students use a separate read-only portal enabled by the Super Admin. Staff roles and department assignments remain managed here.</p></section>}{error && <p role="alert">{error}</p>}</div></main>{profile.role!=='admin'&&<FloatingStaffChat key={user.uid+'__'+profile.departmentId+'__'+profile.role} open={chatOpen} onOpenChange={setChatOpen} unread={chatUnread}>{active=><Suspense fallback={<p role="status">Opening staff chat…</p>}><StaffChat profile={profile} uid={user.uid} active={active} initialChatId={requestedChatId} onOpenProject={id=>{setRequestedProjectId(id);setPage('Workspace');setChatOpen(false);}}/></Suspense>}</FloatingStaffChat>}</div>;
  if(studentEntry)return <Suspense fallback={<p role="status">Opening student sign-in…</p>}><StudentSignIn onBack={()=>setStudentEntry(false)}/></Suspense>;
  return <div className="signin-layout"><section className="story"><Brand/><div className="story-content"><div className="eyebrow">BETTER SUPERVISION. CLEARER PROGRESS.</div><h1>Good projects.<br/>Guided every<br/><em>step of the way.</em></h1><p>One shared workspace for the people who guide student research.</p><div className="project-illustration" aria-hidden="true"><div className="illustration-top"><span>THE PROJECT JOURNEY</span><BookOpen size={19}/></div>{['Topic approved', 'Research in progress', 'Ready for defence'].map((label,i) => <div className={'journey-row step-'+i} key={label}><span className="step-icon">{i === 0 ? <Check size={15}/> : i+1}</span><span>{label}</span>{i === 1 && <span className="live-dot"/>}</div>)}<div className="illustration-bottom"><span>Every milestone. One place.</span><ChevronRight size={17}/></div></div></div><footer>Built for departments. Designed around supervision.</footer></section><main className="signin-main"><span className="staff-tag"><ShieldCheck size={15}/> STAFF ACCESS</span><div className="signin-card"><span className="mobile-brand"><Brand/></span><div className="eyebrow">WELCOME TO PROJECTTRACK</div><h2>Sign in to your<br/>workspace.</h2><p className="signin-description">Use your approved staff email to continue.</p><form onSubmit={login}><label htmlFor="email">Staff email</label><input id="email" name="email" type="email" autoComplete="username" placeholder="you@institution.edu.ng" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/><div className="password-heading"><label htmlFor="password">Password</label><button type="button" className="text-button" onClick={reset} disabled={busy || !configured}>Forgot password?</button></div><div className="password-field"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" disabled={busy}/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={()=>setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>{error && <div className="notice error" role="alert">{error}</div>}{message && <div className="notice" role="status">{message}</div>}{!configured && <div className="notice error" role="alert">This workspace is awaiting its Firebase configuration.</div>}<button className="primary" type="submit" disabled={busy || !configured}>{busy ? 'Please wait…' : 'Sign in'}<ArrowRight size={18}/></button></form><button className="secondary" onClick={()=>setStudentEntry(true)}>Student portal</button><div className="access-note"><ShieldCheck size={20}/><p>Access is managed by your department.<br/><span>Need an account? Contact your HOD or administrator.</span></p></div></div><footer>Student Project Management Platform <span>•</span> Staff only</footer></main></div>;
}

