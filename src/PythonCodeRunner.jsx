import React,{useState,useRef,useEffect} from 'react';
import {Play,RotateCcw,Check,Square} from 'lucide-react';
import {CodeEditor} from './CodeEditor.jsx';
import {PyodideExecutionProvider} from './execution/PyodideExecutionProvider.js';
import {freshCodingState,recordCodingAttempt,isIndependent} from './execution/coding-progress.js';
import {confidenceFlag} from './learning-engine.js';
import './runner.css';

export function PythonCodeRunner({exercise,state,onChange,onResult,onMistake,locked=false,playground=false,compact=false,hideHelp=false,providerFactory=()=>new PyodideExecutionProvider()}){
 const current={...freshCodingState(exercise),...state};
 const stateRef=useRef(current);stateRef.current=current;
 const provider=useRef(null);const mounted=useRef(true);
 const [status,setStatus]=useState('Ready'),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState(null),[solutionOpen,setSolutionOpen]=useState(false),[consoleHidden,setConsoleHidden]=useState(false);
 const busyRef=useRef(false);const changeRef=useRef(onChange);changeRef.current=onChange;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;provider.current?.dispose();};},[]);
 function update(patch){const next={...stateRef.current,...patch};stateRef.current=next;changeRef.current(next);}
 const gated=exercise.type==='Prediction'&&!current.predictionSubmitted;
 const designGated=exercise.type==='Architecture'&&!current.designCommitted;
 const totalTests=exercise.tests.length+exercise.hiddenTests.length;
 async function execute(mode){
  if(busyRef.current||locked||gated||designGated)return;
  busyRef.current=true;setBusy(true);setConsoleHidden(false);
  const snapshot={...stateRef.current};
  try{
   provider.current??=providerFactory();
   const result=await provider.current.execute(snapshot.code,{...exercise,testing:mode==='tests',onStatus:s=>mounted.current&&setStatus(s)});
   if(!mounted.current)return;
   setConsoleHidden(false);
   const next=recordCodingAttempt({...stateRef.current,code:snapshot.code},exercise,result,mode);
   stateRef.current=next;changeRef.current(next);
   setStatus(result.timedOut?'Timed Out':result.error||mode==='tests'&&!result.success?'Execution Failed':'Ready');
   onResult?.(result,next,mode);
  }catch{if(mounted.current)setStatus('Execution Failed');}
  finally{busyRef.current=false;if(mounted.current)setBusy(false);}
 }
 function resetCode(){
  provider.current?.reset();update({code:exercise.starterCode||'',prediction:'',predictionSubmitted:false,predictionMatches:null});
  setConfirm(null);setConsoleHidden(true);setStatus('Ready');
 }
 const result=current.lastResult;
 const performance=current.lastMode==='tests'&&totalTests?(current.testsPassed||0)/totalTests:current.predictionMatches==null?null:current.predictionMatches?1:0;
 const calibration=confidenceFlag(current.confidence,performance);
 return <section className={`python-runner ${compact?'compact':''}`} aria-label={`Coding environment: ${exercise.title}`}>
  <div className="runner-heading"><div><span className="eyebrow green">{playground?'PYTHON PLAYGROUND':'EXECUTABLE PRACTICE'}</span>{compact?<strong>Python workspace</strong>:<h3>{exercise.title}</h3>}</div><span className={`runtime-status ${busy?'working':''}`} role="status">{status}</span></div>
  {!compact&&<div className="runner-instructions"><h4>Exercise Instructions</h4><p>{exercise.description}</p><div className="concept-chips"><span>{exercise.difficulty}</span><span>{exercise.type}</span>{exercise.expectedConcepts.map(c=><span key={c}>{c}</span>)}</div></div>}
  {exercise.type==='Prediction'&&<div className="prediction-panel"><label>What do you expect this code to output?<textarea aria-label="Predicted output" value={current.prediction} disabled={current.predictionSubmitted||busy||locked} onChange={e=>update({prediction:e.target.value})}/></label><button className="secondary" disabled={!current.prediction.trim()||current.predictionSubmitted||locked} onClick={()=>update({predictionSubmitted:true,predictionAt:new Date().toISOString()})}>{current.predictionSubmitted?'Prediction recorded':'Submit Prediction'}</button>{current.predictionMatches!=null&&<p>{current.predictionMatches?'Your prediction matches the output.':'Your prediction differs from the output. Trace the program and explain the difference.'}</p>}</div>}
  {exercise.type==='Architecture'&&<div className="prediction-panel"><label>My design before coding<textarea aria-label="My design before coding" disabled={current.designCommitted||locked} value={current.design||''} onChange={e=>update({design:e.target.value})} placeholder="Data flow, ownership, failure boundaries, and alternatives."/></label><button className="secondary" disabled={!current.design?.trim()||current.designCommitted||locked} onClick={()=>update({designCommitted:true,designAt:new Date().toISOString()})}>{current.designCommitted?'Design recorded':'Save Design'}</button></div>}
  <CodeEditor label={playground?'Playground Python code':`Python code: ${exercise.title}`} value={current.code} onChange={code=>update({code})} readOnly={busy||locked||exercise.type==='Prediction'||designGated} onRun={()=>execute('run')} height={compact?220:360}/>
  <div className="runner-actions"><button className="primary" disabled={busy||locked||gated||designGated} onClick={()=>execute('run')}><Play size={14}/>Run Code</button>{!playground&&<button className="secondary" disabled={busy||locked||gated||designGated||!totalTests} onClick={()=>execute('tests')}><Check size={14}/>Run Tests</button>}<button className="secondary" disabled={busy||locked} onClick={()=>current.code!==exercise.starterCode&&current.code.trim().length>20?setConfirm('reset'):resetCode()}><RotateCcw size={14}/>Reset Code</button>{busy&&<button className="secondary" onClick={()=>provider.current?.reset()}><Square size={14}/>Stop</button>}{playground&&<><button className="secondary" onClick={()=>setConsoleHidden(true)}>Clear Console</button><button className="secondary" onClick={()=>{provider.current?.reset();setStatus('Ready');setConsoleHidden(true);}}>Reset Environment</button></>}</div>
  {confirm==='reset'&&<div className="runner-confirm" role="alert"><p>Restore the starter code? Your current edits will be replaced. Attempt and assistance history will stay recorded.</p><button className="secondary" onClick={resetCode}>Confirm Reset</button><button className="secondary" onClick={()=>setConfirm(null)}>Keep My Code</button></div>}
  {busy&&<p className="runtime-loading">{status.startsWith('Loading')?status:'Preparing or executing Python in an isolated worker…'} The first download can take a moment; you can keep using the page.</p>}
  <p className="runner-caption">{exercise.timeLimit/1000}s execution limit · Fresh Python environment each run · {exercise.allowedPackages.length?`Loads on demand: ${exercise.allowedPackages.join(', ')}`:'Standard Python'}{!playground&&!totalTests&&exercise.type!=='Prediction'?' · Open practice: no automated completion checks for this task.':''}</p>
  <div className="runner-results"><div className="console-panel"><h4>Console Output</h4>{!result||consoleHidden?<p className="muted">Output and Python tracebacks appear here.</p>:<><pre aria-label="Python stdout">{result.stdout||'(No output)'}</pre>{result.stderr&&<pre className="console-error" aria-label="Python stderr">{result.stderr}</pre>}{result.error&&<pre className="console-error" aria-label="Python error">{result.error}</pre>}<p>{result.error?'Execution did not complete.':result.success?'Execution completed successfully.':'Execution finished; some tests need attention.'} <small>{Math.round(result.executionTime)} ms</small></p></>}</div>
  {!playground&&<div className="test-panel"><h4>Test Results</h4>{result&&current.lastMode==='tests'?<><p>Passed {result.testResults.filter(t=>t.passed).length} of {totalTests}</p>{result.testResults.map(t=><div className={`test-result ${t.passed?'passed':'failed'}`} key={t.id}><strong>{t.name}</strong><span>{t.passed?'Passed':'Failed'}{t.hidden?' · hidden case':''}</span>{!t.passed&&<p>{t.feedback}</p>}</div>)}{result.error&&<p>Tests could not finish because the submitted program failed or timed out.</p>}</>:<p className="muted">{totalTests?`${exercise.tests.length} visible and ${exercise.hiddenTests.length} hidden checks. Run tests to assess behavior.`:'This task has no automated test suite.'}</p>}{!!exercise.tests.length&&<details><summary>Visible test implementation</summary>{exercise.tests.map(test=><div key={test.id}><h4>{test.name}</h4><CodeEditor value={test.code} label={`Visible test: ${test.name}`} readOnly height={160}/></div>)}</details>}</div>}</div>
  {!playground&&<><div className="coding-evidence"><span>{current.attempts} attempts</span><span>Best: {current.bestPassed}/{totalTests} tests</span><span>{current.hintsUsed} hints</span><span>{current.completed?(isIndependent(current)?'Completed independently':'Completed with assistance'):'In progress'}</span></div>{current.completed&&current.completedCode!==current.code&&<p className="muted">Completion was earned on an earlier code version. Run tests to verify these edits.</p>}<label className="checkbox-label"><input type="checkbox" disabled={locked} checked={current.aiUsed} onChange={e=>update({aiUsed:e.target.checked||current.aiUsed,aiUsedAt:current.aiUsedAt||new Date().toISOString()})}/>I used AI assistance for this exercise (retained in history)</label>
  {!hideHelp&&<><div className="runner-help"><h4>Hints</h4><button className="secondary" disabled={busy||locked||current.hintsUsed>=exercise.hints.length} onClick={()=>update({hintsUsed:current.hintsUsed+1,firstHelpAt:current.firstHelpAt||new Date().toISOString()})}>{current.hintsUsed?'Show Another Hint':'Show Hint'}</button>{exercise.hints.slice(0,current.hintsUsed).map((hint,i)=><p className="callout" key={i}>Hint {i+1}: {hint}</p>)}</div><div className="runner-help"><h4>Solution</h4><button className="secondary" disabled={busy||locked} onClick={()=>current.solutionRevealed?setSolutionOpen(!solutionOpen):setConfirm('solution')}>{solutionOpen?'Hide Solution':'Reveal Solution'}</button>{confirm==='solution'&&<div className="runner-confirm" role="alert"><p>Revealing the solution will mark this exercise as completed with assistance. Completion still requires passing the required checks.</p><button className="secondary" onClick={()=>{update({solutionRevealed:true,firstHelpAt:current.firstHelpAt||new Date().toISOString()});setSolutionOpen(true);setConfirm(null);}}>Confirm Reveal Solution</button><button className="secondary" onClick={()=>setConfirm(null)}>Keep Working</button></div>}{solutionOpen&&<><div className="solution-comparison"><CodeEditor value={current.code} label="Your implementation" readOnly/><CodeEditor value={exercise.solution} label="Reference implementation" readOnly/></div><h4>Why this works</h4><p className="preserve">{exercise.explanation}</p><h4>Common mistakes</h4><ul>{exercise.commonMistakes.map(m=><li key={m}>{m}</li>)}</ul></>}</div></>}
  {current.completed&&<div className="runner-reflection"><label>How confident are you with this concept?<select aria-label="Coding confidence" disabled={locked} value={current.confidence||''} onChange={e=>update({confidence:Number(e.target.value)})}><option value="">Rate confidence</option>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label><label>Could you implement this again without looking at your current solution?<select aria-label="Repeat independently" disabled={locked} value={current.repeatability} onChange={e=>update({repeatability:e.target.value})}><option value="">Choose honestly</option>{['Yes','Maybe','No'].map(x=><option key={x}>{x}</option>)}</select></label>{calibration&&<p className="calibration-flag">{calibration}</p>}</div>}
  {onMistake&&current.history.filter(h=>!h.success&&h.mode==='tests').length>=2&&<button className="secondary" onClick={()=>onMistake(exercise,current)}>Add failed attempt to Mistakes</button>}</>}
 </section>;
}
