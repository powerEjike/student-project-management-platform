export async function progressPdf(rows:(string|number)[][],department:string,filters:Record<string,string>,fontBytes:Uint8Array,generated=new Date()){
 const {PDFDocument,rgb}=await import('pdf-lib');const {default:fontkit}=await import('@pdf-lib/fontkit');const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes,{subset:true});pdf.setTitle(`${department} — Student progress report`);pdf.setCreator('ProjectTrack');
 let page=pdf.addPage([595.28,841.89]);let y=795;
 function wrap(value:string,size:number){const words=value.replace(/\s+/g,' ').trim().split(' ').flatMap(word=>{const parts:string[]=[];let part='';for(const c of word){if(part&&font.widthOfTextAtSize(part+c,size)>500){parts.push(part);part=c;}else part+=c;}if(part)parts.push(part);return parts;});const lines:string[]=[];let line='';for(const word of words){if(line&&font.widthOfTextAtSize(line+' '+word,size)>500){lines.push(line);line=word;}else line=line?line+' '+word:word;}if(line)lines.push(line);return lines;}
 function header(){for(const [value,size]of [[`${department} — Student progress report`,14],[`Generated: ${generated.toLocaleString('en-NG',{timeZone:'Africa/Lagos'})} (Lagos) | Students: ${rows.length}`,8],[Object.entries(filters).map(([k,v])=>`${k}: ${v||'All'}`).join(' | '),8]] as [string,number][]){for(const line of wrap(value,size)){page.drawText(line,{x:45,y,size,font});y-=size+5;}}y-=12;}
 function nextPage(){page=pdf.addPage([595.28,841.89]);y=795;header();}
 header();
 rows.forEach((r,index)=>{const texts:[string,number][]=[
  [`${index+1}. ${r[0]} | ${r[1]}`,11],
  [`${r[2]} | ${r[3]} | Current session: ${r[4]} | Admission: ${r[5]}`,9],
  [`Supervisor: ${r[6]} | Co-supervisor: ${r[7]||'None'}`,9],
  [`Topic: ${r[8]||'Not recorded'}`,9],
  [`Status: ${r[9]} | Topic decision: ${r[10]}`,9],
  [`Milestones completed: ${r[11]}/${r[12]} | Overdue milestones: ${r[13]}`,9],
  [`Days since topic/progress update: ${r[14]}`,9],
  [`Defence cleared: ${r[15]||'Not recorded'} | Completed: ${r[16]||'Not recorded'}`,9]
 ];const lines=texts.flatMap(([value,size])=>wrap(value,size).map(text=>({text,size})));const height=lines.reduce((sum,l)=>sum+l.size+5,0)+14;
 if(y-height<60&&height<650)nextPage();
 for(const line of lines){if(y-line.size-5<60)nextPage();page.drawText(line.text,{x:45,y,size:line.size,font});y-=line.size+5;}
 page.drawLine({start:{x:45,y:y-3},end:{x:545,y:y-3},thickness:0.5,color:rgb(0.8,0.85,0.82)});y-=18;
 });
 if(y<90)nextPage();page.drawText('HOD signature: ____________________    Date: ____________________',{x:45,y,size:9,font});const pages=pdf.getPages();pages.forEach((p,i)=>p.drawText(`Page ${i+1} of ${pages.length}`,{x:45,y:25,size:8,font}));return pdf.save();
}
