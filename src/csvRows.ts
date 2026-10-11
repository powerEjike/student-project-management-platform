export function csvRows(text:string){
 if(text.length>2_000_000)throw Error('Use a CSV smaller than 2 MB.');
 const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;let closed=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}else if(c==='"'){if(cell||closed)throw Error('Invalid CSV quotation.');quoted=true;}else if(c===','||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(v=>v.trim()))rows.push(row);row=[];}}else{if(closed)throw Error('Unexpected text after a quoted CSV value.');cell+=c;}}
 if(quoted)throw Error('The CSV contains an unfinished quoted value.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 const headers=rows.shift()?.map(h=>h.trim().toLowerCase())||[];
 if(new Set(headers).size!==headers.length)throw Error('CSV column names must be unique.');

 return {headers,rows};
}
