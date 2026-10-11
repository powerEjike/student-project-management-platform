export type ContactRecord={id:string;date:string;channel:string;outcome:string;note:string;agreedActions?:string;actorName:string;createdAt?:{toDate:()=>Date}};
export type ContactFilters={search:string;from:string;to:string;channel:string;outcome:string;actionsOnly:boolean};
const normalize=(text:string)=>text.normalize('NFC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
export function filterContacts(rows:ContactRecord[],filters:ContactFilters){
 if(filters.from&&filters.to&&filters.from>filters.to)return [];
 const words=normalize(filters.search).split(' ').filter(Boolean);
 return rows.filter(r=>(!filters.from||r.date>=filters.from)&&(!filters.to||r.date<=filters.to)&&(!filters.channel||r.channel===filters.channel)&&(!filters.outcome||r.outcome===filters.outcome)&&(!filters.actionsOnly||!!r.agreedActions?.trim())&&words.every(word=>normalize([r.note,r.agreedActions||'',r.actorName].join(' ')).includes(word)));
}
