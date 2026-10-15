import {useRef,useState,type FormEvent} from 'react';
import {parseStaffBatch} from './staffBatchInput.mjs';

type Row={email:string;displayName:string;role:'hod'|'lecturer';departmentId:string};
type Department={id:string;name:string};
const blank:Row={email:'',displayName:'',role:'lecturer',departmentId:''};
export default function StaffBatchPreparation({departments,uid}:{departments:Department[];uid:string}) {
  const [rows,setRows]=useState<Row[]>([]);const [draft,setDraft]=useState<Row>(blank);
  const [error,setError]=useState('');const [reviewed,setReviewed]=useState(false);const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');const generation=useRef(0);
  const invalid=rows.filter(row=>!departments.some(d=>d.id===row.departmentId));
  function change(next:Row[]) {setRows(next);setReviewed(false);setMessage('');setError('');}
  function add(e:FormEvent) {e.preventDefault();try{change(parseStaffBatch([...rows,draft]) as Row[]);setDraft({...blank,departmentId:draft.departmentId});}catch(e){setError((e as Error).message);}}
  async function load(file?:File) {
    const run=++generation.current;setError('');setMessage('');setReviewed(false);if(!file)return;
    setBusy(true);
    try {if(file.size>100_000)throw Error('Use a JSON batch smaller than 100 KB.');const parsed=parseStaffBatch(JSON.parse((await file.text()).replace(/^\uFEFF/,''))) as Row[];if(run===generation.current)change(parsed);}
    catch(e){if(run===generation.current){setRows([]);setError((e as Error).message);}}
    finally{if(run===generation.current)setBusy(false);}
  }
  function download() {
    try {
      const validated=parseStaffBatch(rows);
      if(!reviewed||invalid.length)throw Error('Review all rows and choose an existing department for each account.');
      const url=URL.createObjectURL(new Blob([JSON.stringify(validated,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='projecttrack-staff-batch.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setMessage('Batch downloaded. No accounts have been created. The trusted operator must run the preview before applying it.');
    }catch(e){setError((e as Error).message);}
  }
  return <section className="panel form-panel"><h2>Prepare staff onboarding</h2>
    <p>Build a batch of lecturer or HOD accounts for the trusted administrator tool. This preparation stays in this browser tab and is cleared when you leave or reload.</p>
    <p className="muted">Existing Authentication accounts and email ownership are checked by the operator tool. Preparing or downloading a batch does not create accounts, change staff access or send invitations.</p>
    {error&&<p className="notice error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
    <form onSubmit={add}><div className="form-grid">
      <div><label htmlFor="batch-name">Staff name</label><input id="batch-name" value={draft.displayName} maxLength={120} required disabled={busy} onChange={e=>setDraft({...draft,displayName:e.target.value})}/></div>
      <div><label htmlFor="batch-email">Email</label><input id="batch-email" type="email" value={draft.email} maxLength={254} required disabled={busy} onChange={e=>setDraft({...draft,email:e.target.value})}/></div>
      <div><label htmlFor="batch-role">Role</label><select id="batch-role" value={draft.role} disabled={busy} onChange={e=>setDraft({...draft,role:e.target.value as Row['role']})}><option value="lecturer">Lecturer</option><option value="hod">HOD</option></select></div>
      <div><label htmlFor="batch-department">Department</label><select id="batch-department" value={draft.departmentId} required disabled={busy} onChange={e=>setDraft({...draft,departmentId:e.target.value})}><option value="">Choose a department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
    </div><button className="secondary" disabled={busy||rows.length>=100}>Add to batch</button></form>
    <details><summary>Load an existing prepared batch</summary><p>Loading a JSON file replaces the current batch. Use only email, displayName, role and departmentId fields. Never include passwords or credentials.</p><input aria-label="Prepared staff JSON batch" type="file" accept=".json,application/json" disabled={busy} onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/></details>
    {rows.length>0&&<><h3>{rows.length} of 100 staff records prepared</h3>
      {invalid.length>0&&<p className="notice error" role="alert">{invalid.length} rows reference unavailable departments. Remove those rows and add them again with a current department.</p>}
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Action</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.email}><td>{r.displayName}</td><td>{r.email}</td><td>{r.role==='hod'?'HOD':'Lecturer'}</td><td>{departments.find(d=>d.id===r.departmentId)?.name||`Unavailable: ${r.departmentId}`}</td><td><button className="text-button" disabled={busy} onClick={()=>{change(rows.filter((_,n)=>n!==i));setDraft(r);}}>Edit</button><button className="text-button" disabled={busy} onClick={()=>change(rows.filter((_,n)=>n!==i))}>Remove</button></td></tr>)}</tbody></table></div>
      <p className="muted">Edit moves a row back into the form; use Add to batch to include its replacement. Review HOD appointments carefully—more than one HOD can be prepared for a department.</p>
      <label className="inline-label"><input type="checkbox" checked={reviewed} disabled={busy||!!invalid.length} onChange={e=>setReviewed(e.target.checked)}/>I reviewed every email, name, role and department in this batch.</label>
      <div className="form-actions"><button className="primary compact" disabled={busy||!reviewed||!!invalid.length} onClick={download}>Download prepared batch</button><button className="secondary" disabled={busy} onClick={()=>{generation.current++;change([]);setDraft(blank);}}>Clear batch</button></div>
      <details><summary>Trusted operator next step</summary><p>Keep the downloaded file outside the repository. From the repository folder, preview with the active Super Admin UID below. Add <code>--apply</code> only after reviewing the tool’s account checks.</p><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>npm.cmd run staff:batch -- 'C:\private\projecttrack-staff-batch.json' --actor {uid}</pre><p>After approval, staff use Forgot password to set their own passwords. No invitation email is sent by this workflow.</p></details>
    </>}
  </section>;
}
