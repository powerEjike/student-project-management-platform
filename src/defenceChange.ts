export function validateDefenceRevision(current:{lastDefenceEventId?:string;defenceCleared?:boolean},expected:string|undefined,cleared:boolean){
 if(current.lastDefenceEventId!==expected)throw new Error('The project status changed after you opened this form. Review the latest status history before trying again.');
 if(!!current.defenceCleared===cleared)throw new Error('The project already has this status. Review the latest status history.');
}
