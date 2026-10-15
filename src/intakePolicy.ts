export type IntakePolicy={maxMiB:number;pdfAllowed:boolean;wordAllowed:boolean;revision:string;note:string};
export const defaultIntakePolicy:IntakePolicy={maxMiB:20,pdfAllowed:true,wordAllowed:true,revision:'',note:''};
export function intakePolicyValue(maxMiB:number,pdfAllowed:boolean,wordAllowed:boolean,note:string){
 if(!Number.isInteger(maxMiB)||maxMiB<1||maxMiB>20)throw Error('Choose a whole-number limit from 1 to 20 MB.');
 if(typeof pdfAllowed!=='boolean'||typeof wordAllowed!=='boolean'||!pdfAllowed&&!wordAllowed)throw Error('Allow at least one document type.');
 if(typeof note!=='string'||!note.trim()||note.trim().length>500)throw Error('Enter a policy reason up to 500 characters.');
 return {maxMiB,pdfAllowed,wordAllowed,note:note.trim()};
}
export function checkIntakeFile(policy:Pick<IntakePolicy,'maxMiB'|'pdfAllowed'|'wordAllowed'>,name:string,size:number){
 if(!Number.isInteger(policy.maxMiB)||policy.maxMiB<1||policy.maxMiB>20||typeof policy.pdfAllowed!=='boolean'||typeof policy.wordAllowed!=='boolean'||!policy.pdfAllowed&&!policy.wordAllowed)throw Error('The document intake policy is invalid. Contact the Super Admin.');
 const kind=name.toLowerCase().endsWith('.pdf')?'PDF':name.toLowerCase().endsWith('.docx')?'Word':null;
 if(!kind||kind==='PDF'&&!policy.pdfAllowed||kind==='Word'&&!policy.wordAllowed)throw Error('This document type is not permitted by the department intake policy.');
 if(!Number.isInteger(size)||size<1||size>policy.maxMiB*1024*1024)throw Error(`The department intake limit is ${policy.maxMiB} MB per file.`);
}
export function intakePolicyLabel(policy:Pick<IntakePolicy,'maxMiB'|'pdfAllowed'|'wordAllowed'>){return `${policy.maxMiB} MB per file · ${[policy.pdfAllowed?'PDF':'',policy.wordAllowed?'Word (.docx)':''].filter(Boolean).join(' and ')}`;}
