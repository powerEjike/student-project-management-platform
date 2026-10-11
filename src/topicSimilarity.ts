import {titleKey,type ArchiveEntry} from './archive.ts';
export type TopicMatch=ArchiveEntry&{matchKind:'exact'|'similar';sharedWords:string[];rank:number};
const stop=new Set('a an the of in on at to for from by with and or as into among between using study studies effect effects analysis assessment determination evaluation comparative investigation influence impact'.split(' '));
function words(title:string){return [...new Set(title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/u).filter(w=>w.length>1&&!stop.has(w)))];}
function near(a:string,b:string){if(a===b)return true;if(Math.min(a.length,b.length)<6||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,edits=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return edits+(a.length-i)+(b.length-j)<=1;}
export function findTopicMatches(title:string,entries:ArchiveEntry[]):TopicMatch[]{
 const queryWords=words(title);const matches:TopicMatch[]=[];
 for(const entry of entries){if(!entry.active)continue;if(titleKey(title)===titleKey(entry.title)){matches.push({...entry,matchKind:'exact',sharedWords:queryWords,rank:2});continue;}
 const candidate=words(entry.title);const used=new Set<number>();const shared=queryWords.filter(w=>{const index=candidate.findIndex((v,i)=>!used.has(i)&&near(w,v));if(index<0)return false;used.add(index);return true;});
 const coverage=shared.length/Math.max(queryWords.length,candidate.length,1);
 if(shared.length>=3&&coverage>=0.65)matches.push({...entry,matchKind:'similar',sharedWords:shared,rank:coverage});
 }
 return matches.sort((a,b)=>b.rank-a.rank||b.year-a.year||a.id.localeCompare(b.id));
}

