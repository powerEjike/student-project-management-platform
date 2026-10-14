import {getDocument,GlobalWorkerOptions,type PDFDocumentProxy,type PDFDocumentLoadingTask} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {pdfFileValue} from './pdfReview';
GlobalWorkerOptions.workerSrc=workerUrl;
export type ReviewDocument={name:string;size:number;sourceKind:'PDF'|'Word';originalBytes:Uint8Array;bytes:Uint8Array;hash:string;pdf:PDFDocumentProxy;pageSizes:{width:number;height:number}[]};
export async function loadReviewDocument(file:File,onTask?:(task:PDFDocumentLoadingTask)=>void):Promise<ReviewDocument>{
 const word=file.name.toLowerCase().endsWith('.docx');if((!word&&!file.name.toLowerCase().endsWith('.pdf'))||file.size>20*1024*1024||file.size<1)throw Error('Choose a PDF or .docx Word document up to 20 MB.');pdfFileValue(file.name,file.size,1);
 const originalBytes=new Uint8Array(await file.arrayBuffer());let bytes:Uint8Array=originalBytes;
 if(word){const font=await fetch('/fonts/NotoSans-Regular.ttf');if(!font.ok)throw Error('Could not load conversion font.');const {wordReviewPdf}=await import('./wordReview');bytes=await wordReviewPdf(originalBytes,new Uint8Array(await font.arrayBuffer()));if(bytes.length>20*1024*1024)throw Error('The converted PDF exceeds 20 MB. Export a smaller PDF from Word.');}
 if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw Error('This file does not contain a PDF header.');
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const task=getDocument({data:bytes.slice(),cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/',enableXfa:false,stopAtErrors:true,maxImageSize:16000000});onTask?.(task);
 try{const pdf=await task.promise;pdfFileValue(file.name,file.size,pdf.numPages);const {PDFDocument}=await import('pdf-lib');const original=await PDFDocument.load(bytes);return {name:file.name,size:file.size,sourceKind:word?'Word':'PDF',originalBytes,bytes,hash,pdf,pageSizes:original.getPages().map(p=>p.getSize())};}catch(error){await task.destroy().catch(()=>undefined);if((error as Error).name==='PasswordException')throw Error('Password-protected PDFs are not supported. Use an unlocked review copy.');throw error;}
}
export async function reviewPageText(file:ReviewDocument,pageNumber:number){const page=await file.pdf.getPage(pageNumber);const content=await page.getTextContent();return content.items.map(item=>'str'in item?item.str+('hasEOL'in item&&item.hasEOL?'\n':' '):'').join('').trim();}
