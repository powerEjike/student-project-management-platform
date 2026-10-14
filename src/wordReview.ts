import JSZip from 'jszip';
import {DOMParser} from '@xmldom/xmldom';
import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const unsupported='This Word document contains unsupported content. Export it from Word as PDF to preserve its layout and content.';
/** Deliberately conservative OOXML reader: never fetch external content or silently omit complex objects. */
export async function wordReviewPdf(source:Uint8Array,fontBytes:Uint8Array){
 if(!source.length||source.length>20*1024*1024)throw Error('Choose a Word document up to 20 MB.');
 const zip=await JSZip.loadAsync(source);const entries=Object.values(zip.files).filter(f=>!f.dir);let expanded=0;
 for(const entry of entries){const internal=entry as unknown as {_data?:{uncompressedSize:number};unsafeOriginalName?:string};const size=internal._data?.uncompressedSize;if(size===undefined||size>20*1024*1024)throw Error('Word document expansion exceeds the review limit.');expanded+=size;if(internal.unsafeOriginalName&&internal.unsafeOriginalName!==entry.name)throw Error('Unsafe Word document path.');}
 if(entries.length>1000||expanded>80*1024*1024)throw Error('Word document expansion exceeds the review limit.');
 if(entries.some(e=>/vbaProject|_xmlsignatures|embeddings|charts|diagrams/i.test(e.name)))throw Error(unsupported);
 async function xml(path:string){const entry=zip.file(path);if(!entry)throw Error('This file is not a supported Word document.');const raw=await entry.async('string');if(raw.length>2*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(raw))throw Error(unsupported);return new DOMParser({onError:()=>{throw Error('Malformed Word document XML.');}}).parseFromString(raw,'application/xml');}
 const doc=await xml('word/document.xml');if(doc.documentElement?.namespaceURI!==W)throw Error(unsupported);
 const blocked=['oMath','oMathPara','object','pict','altChunk','sdt','ins','del','fldSimple','instrText','footnoteReference','endnoteReference','textbox','txbxContent','sym','chart','graphicFrame','wsp','group','contentPart','crop','srcRect'];
 if(blocked.some(name=>doc.getElementsByTagNameNS('*',name).length)||entries.some(e=>/^word\/(header|footer|footnotes|endnotes)\d*\.xml$/.test(e.name)))throw Error(unsupported);
 if(Array.from(doc.getElementsByTagNameNS(W,'drawing')).some(d=>d.getElementsByTagNameNS('*','blip').length!==1))throw Error(unsupported);
 const relationships=new Map<string,string>();if(zip.file('word/_rels/document.xml.rels')){const rels=await xml('word/_rels/document.xml.rels');for(const rel of Array.from(rels.getElementsByTagName('Relationship'))){const target=rel.getAttribute('Target')??'';if(rel.getAttribute('Type')?.endsWith('/image')){if(rel.getAttribute('TargetMode')==='External'||!/^media\/[\w .-]+\.(png|jpe?g)$/i.test(target))throw Error(unsupported);relationships.set(rel.getAttribute('Id')??'','word/'+target);}}}
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes,{subset:true,customName:'ProjectTrackWordReview'});pdf.setCreationDate(new Date(0));pdf.setModificationDate(new Date(0));pdf.setCreator('ProjectTrack Word review converter v1');pdf.setProducer('ProjectTrack');
 let page=pdf.addPage([595.28,841.89]),y=790;function next(){if(pdf.getPageCount()>=100)throw Error('The converted Word document exceeds 100 review pages.');page=pdf.addPage([595.28,841.89]);y=790;}function room(height:number){if(height>730)throw Error(unsupported);if(y-height<50)next();}
 function lines(text:string,width:number,size:number){const result:string[]=[];for(const para of text.replace(/\r/g,'').split('\n')){let line='';for(const word of para.split(/\s+/)){if(!word)continue;for(const char of (line?' ':'')+word){if(font.widthOfTextAtSize(line+char,size)>width){result.push(line);line='';}line+=char;}}result.push(line);}return result;}
 function paragraph(element:Element){let text='';function visit(node:Node){if(node.nodeType===1){const el=node as Element;if(el.localName==='t')text+=el.textContent??'';else if(el.localName==='tab')text+='    ';else if(el.localName==='br'||el.localName==='cr')text+='\n';else for(const child of Array.from(el.childNodes))visit(child);}}visit(element);return text;}
 const body=doc.getElementsByTagNameNS(W,'body')[0];if(!body)throw Error(unsupported);
 for(const node of Array.from(body.childNodes)){if(node.nodeType!==1)continue;const element=node as unknown as Element;
  if(element.localName==='p'){
   if(Array.from(element.getElementsByTagNameNS(W,'br')).some(b=>b.getAttributeNS(W,'type')==='page')&&y<790)next();
   const heading=element.getElementsByTagNameNS(W,'pStyle')[0]?.getAttributeNS(W,'val')??'';const size=/heading|title/i.test(heading)?15:11;
   let text=paragraph(element);if(element.getElementsByTagNameNS(W,'numPr').length)text='• '+text;
   for(const line of lines(text,495,size)){room(size+6);if(line)page.drawText(line,{x:50,y,size,font});y-=size+6;}y-=7;
   for(const blip of Array.from(element.getElementsByTagNameNS('*','blip'))){const id=blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed')??'';const path=relationships.get(id);if(!path||!zip.file(path))throw Error(unsupported);const bytes=await zip.file(path)!.async('uint8array');if(bytes.length>10*1024*1024)throw Error(unsupported);const image=/\.png$/i.test(path)?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);const scale=Math.min(495/image.width,650/image.height,1);const width=image.width*scale,height=image.height*scale;room(height+12);page.drawImage(image,{x:50,y:y-height,width,height});y-=height+12;}
  }else if(element.localName==='tbl'){
   if(element.getElementsByTagNameNS(W,'tbl').length||element.getElementsByTagNameNS(W,'vMerge').length||element.getElementsByTagNameNS('*','blip').length)throw Error(unsupported);
   const rows=Array.from(element.childNodes).filter(n=>n.nodeType===1&&(n as Element).localName==='tr') as unknown as Element[];
   const count=element.getElementsByTagNameNS(W,'gridCol').length||Math.max(...rows.map(r=>r.getElementsByTagNameNS(W,'tc').length));if(!count||count>12)throw Error(unsupported);const unit=495/count;
   for(const row of rows){const cells=Array.from(row.childNodes).filter(n=>n.nodeType===1&&(n as Element).localName==='tc') as unknown as Element[];const spans=cells.map(c=>Number(c.getElementsByTagNameNS(W,'gridSpan')[0]?.getAttributeNS(W,'val')??1));if(spans.some(s=>!Number.isInteger(s)||s<1)||spans.reduce((a,b)=>a+b,0)!==count)throw Error(unsupported);const wrapped=cells.map((c,i)=>lines(Array.from(c.getElementsByTagNameNS(W,'p')).map(paragraph).join('\n'),unit*spans[i]-12,10));const height=Math.max(...wrapped.map(a=>a.length))*15+12;room(height);let x=50;wrapped.forEach((list,i)=>{const width=unit*spans[i];page.drawRectangle({x,y:y-height,width,height,borderWidth:0.5,borderColor:rgb(0.5,0.5,0.5)});list.forEach((line,j)=>{if(line)page.drawText(line,{x:x+6,y:y-16-j*15,size:10,font});});x+=width;});y-=height;}y-=12;
  }else if(element.localName!=='sectPr')throw Error(unsupported);
 }
 return pdf.save();
}
