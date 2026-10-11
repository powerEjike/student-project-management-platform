import {titleKey,type ArchiveEntry} from './archive.ts';
export function searchHistoricalProjects(entries:ArchiveEntry[],search:string,year:string,state:'active'|'withdrawn'|'all'='active'){
 const tokens=titleKey(search).split(' ').filter(Boolean);if(search.trim()&&!tokens.length)return [];
 return entries.filter(e=>(state==='all'||e.active===(state==='active'))&&(!year||String(e.year)===year)&&tokens.every(word=>titleKey(`${e.title} ${e.author} ${e.year}`).includes(word))).sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
}
