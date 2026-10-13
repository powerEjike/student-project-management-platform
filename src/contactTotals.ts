export function contactTotals(rows:{channel:string;outcome:string;date:string}[]){
 const result={meetings:0,otherContacts:0,noResponse:0,cancelled:0,lastMeeting:''};
 for(const row of rows){
  if(row.outcome==='Contacted'&&row.channel==='Meeting'){result.meetings++;if(row.date>result.lastMeeting)result.lastMeeting=row.date;}
  else if(row.outcome==='Contacted')result.otherContacts++;
  else if(row.outcome==='No response')result.noResponse++;
  else if(row.outcome==='Cancelled')result.cancelled++;
 }
 return result;
}
