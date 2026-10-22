import{attendanceCourseKey}from'./classAttendanceData.ts';
export type StudentAttendanceEntry={id:string;title:string;lecturerName:string;session:string;checkedAt?:{toDate:()=>Date};classStartedAt?:{toDate:()=>Date};detailsUnavailable:boolean};
export type StudentAttendanceFilters={course:string;session:string;from:string;to:string};
export function studentAttendanceCourses(rows:StudentAttendanceEntry[]){const values=new Map<string,string>();for(const row of rows)if(row.title){const key=attendanceCourseKey(row.title);if(!values.has(key))values.set(key,row.title.trim().replace(/\s+/g,' '));}return [...values].sort((a,b)=>a[1].localeCompare(b[1]));}
export function filterStudentAttendance(rows:StudentAttendanceEntry[],filters:StudentAttendanceFilters){
 if(filters.from&&filters.to&&filters.from>filters.to)return[];
 return rows.filter(row=>{const date=row.checkedAt?.toDate().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'})||'';return(!filters.course||attendanceCourseKey(row.title)===filters.course)&&(!filters.session||row.session===filters.session)&&(!filters.from||date>=filters.from)&&(!filters.to||!!date&&date<=filters.to);}).sort((a,b)=>(b.checkedAt?.toDate().getTime()||0)-(a.checkedAt?.toDate().getTime()||0)||a.id.localeCompare(b.id));
}
