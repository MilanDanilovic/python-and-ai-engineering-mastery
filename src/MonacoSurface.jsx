import 'monaco-editor/editor/browser/coreCommands';
import 'monaco-editor/editor/contrib/linesOperations/browser/linesOperations';
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching';
import 'monaco-editor/editor/contrib/folding/browser/folding';
import 'monaco-editor/editor/contrib/suggest/browser/suggestController';
import 'monaco-editor/editor/contrib/find/browser/findController';
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard';
import React,{useState,useRef} from 'react';
import Editor,{loader} from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/languages/definitions/python/register';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import './editor.css';
self.MonacoEnvironment={getWorker:()=>new EditorWorker()};
loader.config({monaco});
monaco.editor.defineTheme('mastery-dark',{base:'vs-dark',inherit:true,rules:[{token:'keyword',foreground:'C5A4E5'},{token:'string',foreground:'98C9A3'},{token:'number',foreground:'E5BD88'},{token:'comment',foreground:'91A098'}],colors:{'editor.background':'#18201c','editor.foreground':'#e0e9e3','editorLineNumber.foreground':'#83958a','editor.selectionBackground':'#355945','editorCursor.foreground':'#a2dfb8'}});
export default function MonacoCodeEditor({value='',onChange,label='Python code',readOnly=false,placeholder='',onRun,height=240}){
 const [copied,setCopied]=useState('');const runRef=useRef(onRun);runRef.current=onRun;
 async function copy(){try{await navigator.clipboard.writeText(value);setCopied('Copied');}catch{setCopied('Select the code and copy manually');}}
 return <div className="themed-editor"><div className="editor-toolbar"><span>{label}</span><span>Python | Monaco</span><button type="button" onClick={copy}>Copy</button></div><div className="monaco-resizable" style={{height}}><Editor defaultLanguage="python" theme="mastery-dark" value={value} onChange={v=>onChange?.(v??'')} loading={<p className="editor-loading">Preparing editor...</p>} options={{ariaLabel:label,readOnly,domReadOnly:readOnly,automaticLayout:true,minimap:{enabled:false},fontSize:13,lineHeight:22,fontFamily:'JetBrains Mono, monospace',scrollBeyondLastLine:false,wordWrap:'on',tabSize:4,insertSpaces:true,autoIndent:'full',matchBrackets:'always',folding:true,padding:{top:12,bottom:12},quickSuggestions:true,wordBasedSuggestions:'currentDocument',accessibilitySupport:'on',tabFocusMode:true}} onMount={(editor,api)=>{editor.addCommand(api.KeyMod.CtrlCmd|api.KeyCode.Enter,()=>runRef.current?.());}}/></div><div className="editor-caption"><span>{readOnly?'Reference | read only':onRun?'Autosaved | Ctrl/Cmd Enter to run':'Autosaved | Tab moves focus'}</span><span aria-live="polite">{copied}</span></div>{placeholder&&!value&&<p className="editor-caption">{placeholder}</p>}</div>;
}
