type Selection={page:number;anchorKind:string;quote:string;pageWidth:number;pageHeight:number;rects:{x:number;y:number;width:number;height:number}[]};
export function hasDocumentCommentDraft(selection:Selection|null,comment:string){return !!selection&&!!comment.trim();}
export function canReplaceCommentSelection(current:Selection|null,comment:string,next:Selection|null){return !hasDocumentCommentDraft(current,comment)||JSON.stringify(current)===JSON.stringify(next);}
