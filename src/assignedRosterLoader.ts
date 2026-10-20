import type {Student} from './models';
// Keep an open folder mounted during refresh, but remove revoked assignments immediately.
export function createAssignedRosterLoader(read:(id:string)=>Promise<Student|null>,publish:(rows:Student[])=>void,fail:()=>void){
 let rows:Student[]=[],generation=0,active=true;
 return {
  async refresh(ids:string[]){
   const current=++generation,allowed=new Set(ids);
   rows=rows.filter(row=>allowed.has(row.id));publish(rows);
   try{
    const result=await Promise.all([...allowed].map(read));
    if(!active||current!==generation)return;
    rows=result.filter((row):row is Student=>row!==null);publish(rows);
   }catch{
    if(!active||current!==generation)return;
    rows=[];publish(rows);fail();
   }
  },
  clear(){generation++;rows=[];publish(rows);},
  dispose(){active=false;generation++;rows=[];}
 };
}
