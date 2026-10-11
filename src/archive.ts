export type ArchiveEntry={id:string;departmentId:string;title:string;titleKey:string;author:string;year:number;programme:string;active:boolean};
export type ArchiveInput=Pick<ArchiveEntry,'title'|'author'|'year'|'programme'>;
export const titleKey=(title:string)=>title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/gu,' ').trim();
export async function archiveId(departmentId:string,input:ArchiveInput){const bytes=new TextEncoder().encode(JSON.stringify([departmentId,titleKey(input.title),titleKey(input.author),input.year,titleKey(input.programme)]));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}

