export function validateArchiveChange(current:{active:boolean;lastEventId?:string},expectedEventId:string|undefined,active:boolean,reason:string){
 if(current.lastEventId!==expectedEventId)throw new Error('This archive entry changed after you opened it. Cancel and reopen the entry to review its latest state.');
 if(current.active===active)throw new Error('This archive entry already has the requested status. Cancel and reopen the entry.');
 const note=reason.trim();if(!note||note.length>500)throw new Error('Enter a reason between 1 and 500 characters.');
 return note;
}
