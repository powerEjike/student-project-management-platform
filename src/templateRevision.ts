export type TemplateRevision={id:string;lastEventId?:string};
export function validateTemplateRevision(id:string,current:{lastEventId?:string}|undefined,opened:TemplateRevision|null){
 if(current&&opened?.id!==id)throw new Error('A template already exists for this programme. Select it from the saved templates before editing.');
 if(current&&current.lastEventId!==opened?.lastEventId)throw new Error('This template changed while you were editing. Select the saved template again to review its latest stages.');
 if(!current&&opened?.id===id)throw new Error('The opened template is no longer available. Reload templates before saving.');
}
