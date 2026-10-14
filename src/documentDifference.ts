export type Difference={kind:'same'|'added'|'removed';text:string};
/** Page comparison is bounded; whitespace-only layout changes are ignored. */
export function documentDifference(before:string,after:string):Difference[]{
 const tokens=(text:string)=>text.match(/[\p{L}\p{N}\p{M}]+|[^\s\p{L}\p{N}\p{M}]/gu)??[];
 const a=tokens(before),b=tokens(after);if(a.length>2000||b.length>2000)throw Error('This page has too much text for comparison. Compare a shorter review copy.');
 const cols=b.length+1,grid=new Uint16Array((a.length+1)*cols);
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)grid[i*cols+j]=a[i]===b[j]?grid[(i+1)*cols+j+1]+1:Math.max(grid[(i+1)*cols+j],grid[i*cols+j+1]);
 const result:Difference[]=[];function push(kind:Difference['kind'],token:string){const previous=result.at(-1);if(previous?.kind===kind)previous.text+=' '+token;else result.push({kind,text:token});}
 let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){push('same',a[i]);i++;j++;}else if(j<b.length&&(i===a.length||grid[i*cols+j+1]>grid[(i+1)*cols+j])){push('added',b[j++]);}else push('removed',a[i++]);}
 return result;
}
