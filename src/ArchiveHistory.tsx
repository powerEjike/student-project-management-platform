import {useEffect,useState} from 'react';
import {watchArchiveHistory,type ArchiveChange} from './archiveStore';
import type {ArchiveEntry} from './archive';
export default function ArchiveHistory({entry,onClose}:{entry:ArchiveEntry;onClose:()=>void}){
 const [items,setItems]=useState<ArchiveChange[]>([]);const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{setItems([]);setLoaded(false);setError('');return watchArchiveHistory(entry.id,changes=>{setItems(changes);setLoaded(true);},()=>{setLoaded(true);setError('Could not load this archive history. Close and reopen it to try again.');});},[entry.id]);
 return <section className="allocation-history"><div className="section-heading"><div><h3>Archive entry history</h3><p>{entry.title} · {entry.author} · {entry.year}</p></div><button className="secondary" onClick={onClose}>Close history</button></div>{error&&<p role="alert" className="notice error">{error}</p>}{!loaded&&<p role="status">Loading recorded changes...</p>}{!error&&items.map(item=><div key={item.id}><p><strong>{item.active?'Active':'Withdrawn'}</strong> · {item.recordedAt?.toDate?.().toLocaleString('en-NG',{timeZone:'Africa/Lagos'})||'Date unavailable'}</p><p style={{whiteSpace:'pre-wrap'}}>{item.reason}</p><small>Recorded staff account ID: {item.actorId}</small></div>)}{loaded&&!error&&!items.length&&<p>No recorded history is available for this entry.</p>}<p className="muted">Latest ten recorded changes, newest first. Earlier unrecorded changes are not reconstructed.</p></section>;
}
