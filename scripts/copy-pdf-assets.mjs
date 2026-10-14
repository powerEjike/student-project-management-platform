import {cp,mkdir} from 'node:fs/promises';
const target=process.argv.includes('--dev')?'public/pdfjs':'dist/pdfjs';await mkdir(target,{recursive:true});for(const name of ['cmaps','standard_fonts','wasm'])await cp(`node_modules/pdfjs-dist/${name}`,`${target}/${name}`,{recursive:true});await cp('node_modules/pdfjs-dist/LICENSE',`${target}/LICENSE`);
