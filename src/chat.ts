export type Chat={id:string;departmentId:string;kind:'general'|'direct'|'group';name:string;memberIds:string[];createdBy:string};
export type ChatMessage={id:string;body:string;senderId:string;senderName:string;removed:boolean;announcement:boolean;projectRefId?:string;createdAt?:{seconds:number;nanoseconds:number;toDate:()=>Date};updatedAt?:{seconds:number;nanoseconds:number}};
export function messageText(body:string){const text=body.trim();if(!text||text.length>4000)throw Error('Enter a message between 1 and 4,000 characters.');return text;}
export function stamp(value?:{seconds:number;nanoseconds:number}){return value?value.seconds*1000+value.nanoseconds/1000000:0;}
export function unreadMessages(rows:ChatMessage[],uid:string,lastRead?:{seconds:number;nanoseconds:number}){return rows.filter(r=>r.senderId!==uid&&!r.removed&&stamp(r.createdAt)>stamp(lastRead)).length;}
export function searchMessages(rows:ChatMessage[],search:string){const words=search.normalize('NFC').toLowerCase().trim().split(/\s+/).filter(Boolean);return rows.filter(r=>!words.length||!r.removed&&words.every(w=>`${r.body} ${r.senderName}`.normalize('NFC').toLowerCase().includes(w)));}
