import{useState}from'react';
import{attendanceCourses,attendanceHistory,classEndsAt,classFinished,classSessionOpen,type ClassSession,type AttendanceHistoryFilters}from'./classAttendanceData';
import{studentPage}from'./studentPages';

const empty:AttendanceHistoryFilters={course:'',session:'',from:'',to:'',report:'',search:''};
export default function ClassAttendanceHistory({rows,now,hod,busy,loading,canLoadMore,onLoadMore,onOpen}:{rows:ClassSession[];now:number;hod:boolean;busy:boolean;loading:boolean;canLoadMore:boolean;onLoadMore:()=>void;onOpen:(id:string)=>void}){
 const[filters,setFilters]=useState(empty),[page,setPage]=useState(0),shown=attendanceHistory(rows,filters,now),paging=studentPage(shown,page),courses=attendanceCourses(rows),sessions=[...new Set(rows.map(row=>row.session))].sort().reverse();
 function change(key:keyof AttendanceHistoryFilters,value:string){setFilters(previous=>({...previous,[key]:value}));setPage(0);}
 const date=(value?:{toDate:()=>Date})=>value?.toDate().toLocaleString('en-GB',{timeZone:'Africa/Lagos'})||'Not recorded';
 return <section className="panel"><h2>{hod?'My attendance history and received reports':'My attendance history'}</h2>
 <div className="form-grid">
 <label>Course / class<select value={filters.course} onChange={e=>change('course',e.target.value)}><option value="">All courses</option>{courses.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 <label>Academic session<select value={filters.session} onChange={e=>change('session',e.target.value)}><option value="">All sessions</option>{sessions.map(session=><option key={session}>{session}</option>)}</select></label>
 <label>From (Lagos)<input type="date" value={filters.from} onChange={e=>change('from',e.target.value)}/></label>
 <label>Through (Lagos)<input type="date" value={filters.to} onChange={e=>change('to',e.target.value)}/></label>
 <label>Report status<select value={filters.report} onChange={e=>change('report',e.target.value)}><option value="">All classes</option><option value="finished">Class finished</option><option value="generated">Report generated</option><option value="sent">Sent to HOD</option><option value="private">Not sent to HOD</option></select></label>
 <label>Search history<input value={filters.search} onChange={e=>change('search',e.target.value)} placeholder="Course, lecturer or session"/></label>
 </div>
 {Object.values(filters).some(Boolean)&&<button className="secondary" onClick={()=>{setFilters(empty);setPage(0);}}>Clear filters</button>}
 {filters.from&&filters.to&&filters.from>filters.to&&<p role="alert">The end date must be on or after the start date.</p>}
 <p role="status">{shown.length} matching classes · {rows.length} loaded. Dates use the class start in Lagos.</p>
 {!shown.length&&<p>{rows.length?'No loaded classes match these filters.':'No class attendance history yet.'}</p>}
 {paging.rows.map(row=><article className="history-row" key={row.id}><div><strong>{row.title}</strong><p>{row.ownerName} · {row.session}</p><p>Started: {date(row.createdAt)}<br/>Ended / ends: {classEndsAt(row)?.toLocaleString('en-GB',{timeZone:'Africa/Lagos'})||'Not recorded'} (Lagos)</p><p>{classFinished(row,now)?'Class finished':classSessionOpen(row,now)?'Check-in open':'Class in progress'} · {row.sharedWithHod?'Sent to HOD':row.reportGeneratedAt?'Report generated · Not sent to HOD':'Report not generated'}</p><button className="secondary" disabled={busy} onClick={()=>onOpen(row.id)}>Open register / report</button></div></article>)}
 {paging.pages>1&&<div className="form-actions"><button disabled={paging.current===0} onClick={()=>setPage(paging.current-1)}>Previous classes</button><span>{paging.current+1}/{paging.pages}</span><button disabled={paging.current===paging.pages-1} onClick={()=>setPage(paging.current+1)}>Next classes</button></div>}
 {canLoadMore&&<div><p>Older classes may not be loaded yet. Load more to search earlier history.</p><button className="secondary" disabled={loading||busy} onClick={onLoadMore}>{loading?'Loading older classes…':'Load older classes'}</button></div>}
 </section>;
}
