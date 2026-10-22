import{useState,type ReactNode}from'react';
export default function ReviewTools({children}:{children:ReactNode}){const[opened,setOpened]=useState(false);return <details className="review-tools" onToggle={e=>{if(e.currentTarget.open)setOpened(true);}}><summary>More review tools</summary>{opened&&<div className="review-tools-body">{children}</div>}</details>;}
