export type ContactInput={date:string;channel:string;outcome:string;note:string;agreedActions?:string};
export type ContactSummary={total:number;lastMeeting:string;lastContact:string;lastAttempt:string};
export const emptyContacts:ContactSummary={total:0,lastMeeting:'',lastContact:'',lastAttempt:''};
export function nextContactSummary(previous:ContactSummary,input:ContactInput):ContactSummary{return {total:previous.total+1,lastMeeting:input.channel==='Meeting'&&input.outcome==='Contacted'&&input.date>previous.lastMeeting?input.date:previous.lastMeeting,lastContact:input.outcome==='Contacted'&&input.date>previous.lastContact?input.date:previous.lastContact,lastAttempt:input.date>previous.lastAttempt?input.date:previous.lastAttempt};}
export function daysSince(date:string,today:string){return date?Math.max(0,Math.round((Date.parse(today+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000)):null;}

export function contactAge(date:string,today:string){const days=daysSince(date,today);return days===null?'Not recorded':date+' ('+days+' '+(days===1?'day':'days')+' before this request)';}

export function contactActions(input:ContactInput){const actions=input.agreedActions??'';if(typeof actions!=='string'||actions.length>2000)throw Error('Agreed actions must be no more than 2000 characters.');if(input.outcome!=='Contacted'&&actions.trim())throw Error('Agreed actions require successful contact.');return actions.trim();}
