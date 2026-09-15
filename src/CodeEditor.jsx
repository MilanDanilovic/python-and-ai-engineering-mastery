import React,{lazy,Suspense,useState} from 'react';
const MonacoSurface=lazy(()=>import('./MonacoSurface.jsx'));
export function CodeEditor(props){return <Suspense fallback={<div className="editor-loading">Preparing Python editor...</div>}><MonacoSurface {...props}/></Suspense>;}
export function SolutionReveal({code,label='Reference solution',onReveal}){
 const [open,setOpen]=useState(false);
 return <div className="solution-reveal"><button className="secondary" aria-expanded={open} onClick={()=>{if(!open&&!window.confirm('Revealing the solution records assistance for this exercise. Reveal it now?'))return;if(!open)onReveal?.();setOpen(!open);}}>{open?'Hide Solution':'Reveal Solution'}</button>{open&&<CodeEditor value={code} label={label} readOnly/>}</div>;
}
