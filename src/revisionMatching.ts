import type {PdfRemarkInput,PdfRect} from './pdfReview.ts';
export type RevisionPage={page:number;width:number;height:number;runs:{text:string;rect:PdfRect}[]};
export type RevisionMatch={state:'Matched'|'Ambiguous'|'Not found'|'Manual review';anchor?:Omit<PdfRemarkInput,'comment'|'category'|'severity'>};
const normal=(value:string)=>value.normalize('NFC').toLowerCase().replace(/\s+/g,' ').trim();
export function matchRevisionPassage(remark:Pick<PdfRemarkInput,'quote'|'anchorKind'>,pages:RevisionPage[]):RevisionMatch{
 const quote=normal(remark.quote);if(remark.anchorKind!=='Text'||quote.length<20||(quote.match(/[\p{L}\p{N}]+/gu)??[]).length<3)return {state:'Manual review'};
 let found:RevisionMatch['anchor']|undefined;
 for(const page of pages){const text=page.runs.map(r=>normal(r.text)).join(' ');let offset=text.indexOf(quote);while(offset!==-1){const before=text[offset-1]??'',after=text[offset+quote.length]??'';if(!/[\p{L}\p{N}]/u.test(before)&&!/[\p{L}\p{N}]/u.test(after)){if(found)return {state:'Ambiguous'};let position=0;const runs=page.runs.filter(run=>{const start=position;position+=normal(run.text).length+1;return start<offset+quote.length&&position-1>offset;});const x=Math.min(...runs.map(r=>r.rect.x)),y=Math.min(...runs.map(r=>r.rect.y));const right=Math.max(...runs.map(r=>r.rect.x+r.rect.width)),top=Math.max(...runs.map(r=>r.rect.y+r.rect.height));if(runs.length)found={anchorKind:'Area',page:page.page,pageWidth:page.width,pageHeight:page.height,rects:[{x,y,width:right-x,height:top-y}],quote:remark.quote};}offset=text.indexOf(quote,offset+1);}}
 return found?{state:'Matched',anchor:found}:{state:'Not found'};
}
