import{useEffect,useState,type ReactNode}from'react';
const sections=[['overview','Overview'],['checkin','Check in'],['attendance','Attendance history'],['feedback','Feedback']]as const;
type Section=typeof sections[number][0];
export default function StudentDashboardLayout({overview,checkIn,attendance,feedback}:{overview:ReactNode;checkIn:ReactNode;attendance:ReactNode;feedback:ReactNode}){
 const initial:Section=location.hash.startsWith('#attendance=')?'checkin':'overview';
 const[active,setActive]=useState<Section>(initial),[visited,setVisited]=useState(new Set<Section>([initial]));
 function open(section:Section){setVisited(previous=>new Set([...previous,section]));setActive(section);}
 useEffect(()=>{function changed(){if(location.hash.startsWith('#attendance='))open('checkin');}window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
 const content={overview,checkin:checkIn,attendance,feedback};
 return <div className="student-dashboard"><nav className="student-dashboard-nav" aria-label="Student dashboard sections">{sections.map(([key,label])=><button key={key} className={active===key?'selected':''} aria-pressed={active===key} aria-controls={'student-section-'+key} onClick={()=>open(key)}>{label}</button>)}</nav>{sections.map(([key,label])=><div key={key} id={'student-section-'+key} className="student-dashboard-section" role="region" aria-label={label} hidden={active!==key}>{visited.has(key)&&content[key]}</div>)}</div>;
}
