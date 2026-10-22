import test from'node:test';import assert from'node:assert/strict';
import{filterStudentAttendance,studentAttendanceCourses}from'../src/studentAttendanceData.ts';
test('student attendance history combines course session and inclusive Lagos check-in dates without inventing missing details',()=>{
 const stamp=value=>({toDate:()=>new Date(value)}),base={title:'BCH 301',lecturerName:'Synthetic lecturer',session:'2025/2026',detailsUnavailable:false},rows=Array.from({length:105},(_,i)=>({...base,id:String(i),title:'BCH 401',checkedAt:stamp('2026-10-22T08:00:00Z')}));
 rows.push({...base,id:'old',title:' bch  301 ',checkedAt:stamp('2026-07-17T23:30:00Z')},{...base,id:'new',checkedAt:stamp('2026-07-18T12:00:00Z')},{...base,id:'other-session',session:'2024/2025',checkedAt:stamp('2026-07-18T12:00:00Z')},{...base,id:'unknown',title:'',session:'',detailsUnavailable:true});
 const filters={course:'bch 301',session:'2025/2026',from:'2026-07-18',to:'2026-07-18'};
 assert.deepEqual(filterStudentAttendance(rows,filters).map(row=>row.id),['new','old']);assert.equal(filterStudentAttendance(rows,{...filters,from:'2026-07-19'}).length,0);assert.equal(studentAttendanceCourses(rows).filter(([key])=>key==='bch 301').length,1);assert.equal(studentAttendanceCourses(rows).some(([key])=>key===''),false);assert.equal(filterStudentAttendance(rows,{course:'',session:'',from:'',to:''}).at(-1).id,'unknown');assert.equal(filterStudentAttendance(rows,{course:'',session:'',from:'',to:'2026-07-18'}).some(row=>row.id==='unknown'),false);
});
