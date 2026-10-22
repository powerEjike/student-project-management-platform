import{useEffect,useState}from'react';
import{filterStudentAttendance,studentAttendanceCourses,type StudentAttendanceEntry,type StudentAttendanceFilters}from'./studentAttendanceData';
import{watchStudentAttendance}from'./studentAttendanceStore';
import{studentPage}from'./studentPages';
const empty:StudentAttendanceFilters={course:'',session:'',from:'',to:''};
export function StudentAttendanceHistoryView({rows,loading,error,canLoadMore,onRetry,onLoadMore}:{rows:StudentAttendanceEntry[];loading:boolean;error:string;canLoadMore:boolean;onRetry:()=>void;onLoadMore:()=>void}){
 const[filters,setFilters]=useState(empty),[page,setPage]=useState(0),shown=filterStudentAttendance(rows,filters),paging=studentPage(shown,page),courses=studentAttendanceCourses(rows),sessions=[...new Set(rows.map(row=>row.session).filter(Boolean))].sort().reverse();
 function change(key:keyof StudentAttendanceFilters,value:string){setFilters(previous=>({...previous,[key]:value}));setPage(0);}
 return <section className="panel form-panel"><h2>My attendance history</h2><p>Your recorded check-ins only. Dates and times are shown in Lagos time.</p>
 {error?<><p role="alert" className="notice error">{error}</p><button className="secondary" onClick={onRetry}>Retry attendance history</button></>:<>
 <div className="form-grid"><label>Course / class<select value={filters.course} onChange={e=>change('course',e.target.value)}><option value="">All courses</option>{courses.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Academic session<select value={filters.session} onChange={e=>change('session',e.target.value)}><option value="">All sessions</option>{sessions.map(session=><option key={session}>{session}</option>)}</select></label><label>Check-in from (Lagos)<input type="date" value={filters.from} onChange={e=>change('from',e.target.value)}/></label><label>Check-in through (Lagos)<input type="date" value={filters.to} onChange={e=>change('to',e.target.value)}/></label></div>
 {Object.values(filters).some(Boolean)&&<button className="secondary" onClick={()=>{setFilters(empty);setPage(0);}}>Clear filters</button>}
 {filters.from&&filters.to&&filters.from>filters.to&&<p role="alert">The end date must be on or after the start date.</p>}
 {loading&&<p role="status">Loading attendance history…</p>}
 <p>{shown.length} matching check-ins · {rows.length} loaded.</p>
 {!loading&&!shown.length&&<p>{rows.length?'No loaded check-ins match these filters.':'No attendance check-ins recorded yet.'}</p>}
 {paging.rows.map(row=><article className="history-row" key={row.id}><div><strong>{row.title||'Class details unavailable'}</strong><p>{[row.lecturerName,row.session].filter(Boolean).join(' · ')}</p><p>Checked in: {row.checkedAt?.toDate().toLocaleString('en-GB',{timeZone:'Africa/Lagos'})||'Time not recorded'} (Lagos)</p>{row.classStartedAt&&<p>Class started: {row.classStartedAt.toDate().toLocaleString('en-GB',{timeZone:'Africa/Lagos'})} (Lagos)</p>}{row.detailsUnavailable&&<p>Class details could not load. Your check-in is recorded.</p>}<span className="badge">Checked in</span></div></article>)}
 {paging.pages>1&&<div className="form-actions"><button disabled={paging.current===0} onClick={()=>setPage(paging.current-1)}>Previous check-ins</button><span>{paging.current+1}/{paging.pages}</span><button disabled={paging.current===paging.pages-1} onClick={()=>setPage(paging.current+1)}>Next check-ins</button></div>}
 {canLoadMore&&<><p>Load older check-ins to search more of your history.</p><button className="secondary" disabled={loading} onClick={onLoadMore}>Load older check-ins</button></>}
 {rows.some(row=>row.detailsUnavailable)&&<button className="secondary" disabled={loading} onClick={onRetry}>Retry class details</button>}
 </>}
 </section>;
}
export default function StudentAttendanceHistory({studentId}:{studentId:string}){
 const[count,setCount]=useState(100),[retry,setRetry]=useState(0),[state,setState]=useState<{studentId:string;rows:StudentAttendanceEntry[];loading:boolean;error:string}>({studentId,rows:[],loading:true,error:''});
 useEffect(()=>{setState(previous=>({studentId,rows:previous.studentId===studentId?previous.rows:[],loading:true,error:''}));return watchStudentAttendance(studentId,count,rows=>setState({studentId,rows,loading:false,error:''}),()=>setState({studentId,rows:[],loading:false,error:'Could not load your attendance history. Retry or ask your administrator to check access.'}));},[studentId,count,retry]);
 const current=state.studentId===studentId?state:{studentId,rows:[],loading:true,error:''};
 return <StudentAttendanceHistoryView key={studentId} rows={current.rows} loading={current.loading} error={current.error} canLoadMore={current.rows.length>=count} onRetry={()=>setRetry(value=>value+1)} onLoadMore={()=>setCount(value=>value+100)}/>;
}
