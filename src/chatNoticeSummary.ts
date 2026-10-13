export type ChatNotice={id:string;label:string;unread:number;muted:boolean;ready:boolean;error:boolean};
export function summarizeChatNotices(rows:ChatNotice[]){
 const known=rows.filter(row=>row.ready&&!row.error);
 return {total:known.reduce((sum,row)=>sum+row.unread,0),notices:known.filter(row=>row.unread>0&&!row.muted).sort((a,b)=>b.unread-a.unread||a.label.localeCompare(b.label)||a.id.localeCompare(b.id)),complete:rows.every(row=>row.ready&&!row.error)};
}
