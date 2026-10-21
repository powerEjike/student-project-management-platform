import type{StaffProfile}from'./models';
export type DirectoryStaff=StaffProfile&{id:string};export type AdminDepartment={id:string;name:string};
export function departmentStaffSummary(departments:AdminDepartment[],directory:DirectoryStaff[]){return departments.map(department=>{const members=directory.filter(s=>s.active&&s.departmentId===department.id&&s.role!=='admin');const hods=members.filter(s=>s.role==='hod').sort((a,b)=>a.displayName.localeCompare(b.displayName)),lecturers=members.filter(s=>s.role==='lecturer').length;return{...department,hods,lecturers,needsHod:!hods.length,needsLecturers:!lecturers};}).sort((a,b)=>a.name.localeCompare(b.name));}
export function staffDepartmentName(staff:DirectoryStaff,departments:AdminDepartment[]){return staff.role==='admin'?'Platform':departments.find(d=>d.id===staff.departmentId)?.name||'Needs department';}
export function filterAdminStaff(directory:DirectoryStaff[],departments:AdminDepartment[],filters:{search:string;department:string;role:string;status:string}){
 return directory.filter(staff=>{
 if(filters.role&&staff.role!==filters.role)return false;if(filters.status==='active'&&!staff.active||filters.status==='inactive'&&staff.active)return false;
 if(filters.department==='missing'&&(staff.role==='admin'||departments.some(d=>d.id===staff.departmentId)))return false;
 if(filters.department==='platform'&&staff.role!=='admin')return false;
 if(filters.department.startsWith('department:')&&(staff.role==='admin'||staff.departmentId!==filters.department.slice(11)))return false;
 const role=staff.role==='admin'?'Super Admin':staff.role==='hod'?'HOD':'Lecturer',text=[staff.displayName,role,staffDepartmentName(staff,departments)].join(' ').normalize('NFC').toLowerCase();return filters.search.trim().normalize('NFC').toLowerCase().split(/\s+/).every(word=>text.includes(word));
 }).sort((a,b)=>a.displayName.localeCompare(b.displayName));
}
