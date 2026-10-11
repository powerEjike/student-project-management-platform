import {useState} from 'react';import type {Project,Student} from './models';import {progressRows} from './progressReport';
export default function ProgressReportButton({students,projects,today,department,filters,disabled}:{students:Student[];projects:Project[];today:string;department:string;filters:Record<string,string>;disabled:boolean}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function download(){setBusy(true);setError('');try{const {exportProgress}=await import('./progressExport');await exportProgress(progressRows(students,projects,today),department,filters);}catch{setError('Could not download the report. Please try again.');}finally{setBusy(false);}}
 return <div><button className="secondary" disabled={disabled||busy||!students.length} onClick={()=>void download()}>{busy?'Preparing report…':'Export progress report (Excel)'}</button>{error&&<p role="alert">{error}</p>}</div>;
}
