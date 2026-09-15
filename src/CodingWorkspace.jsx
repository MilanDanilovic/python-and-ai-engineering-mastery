import React,{useState} from 'react';
import {PythonCodeRunner} from './PythonCodeRunner.jsx';
import {executableExercises,executableById,exerciseTypes,playgroundExamples,executableFor} from './execution/exercises.js';
import {codingSummary,freshCodingState,isIndependent} from './execution/coding-progress.js';
import {milestoneById} from './curriculum.js';
import {scheduleRevision,dateKey,markWeak} from './learning-engine.js';

export function openPractice(id,title,topic,description='',solution=''){
 return {id,title,topic,description,type:'Implementation',difficulty:'Medium',starterCode:'',tests:[],hiddenTests:[],hints:[],solution,timeLimit:5000,allowedPackages:[],expectedConcepts:[topic],learningObjectives:[description],explanation:'Compare the reference behavior with your own attempt and the original exercise contract.',commonMistakes:['Run server and database examples in the documented local environment.']};
}
export function SavedPythonRunner({exercise,saved,setSaved,storageKey=exercise.id,initialCode,compact=false,playground=false,hideHelp=false,legacyBinding}){
 const [mistake,setMistake]=useState(null);
 const state=saved.codingExercises?.[storageKey]||{...freshCodingState(exercise),...(initialCode!=null?{code:initialCode}:{})};
 const update=next=>setSaved(s=>{
  const previous=s.codingExercises?.[storageKey];
  let updated={...s,codingExercises:{...s.codingExercises,[storageKey]:next}};
  if(legacyBinding)updated.milestoneAnswers={...s.milestoneAnswers,[legacyBinding.milestone]:{...s.milestoneAnswers?.[legacyBinding.milestone],[legacyBinding.task]:next.code}};
  if(next.attempts!==(previous?.attempts||0))updated.codingEvents=[...(s.codingEvents||[]),{exerciseId:exercise.id,topic:exercise.topic,at:next.lastAttemptedAt,passed:next.testsPassed,total:next.totalTests,completed:next.completed,independent:isIndependent(next),hints:next.hintsUsed,solutionRevealed:next.solutionRevealed}].slice(-1000);
  if(milestoneById[exercise.topic]&&next.completed&&next.confidence&&next.repeatability&&(next.confidence!==previous?.confidence||next.repeatability!==previous?.repeatability)){
   const performance=next.totalTests?next.testsPassed/next.totalTests:next.predictionMatches?1:0;
   const revision=scheduleRevision(s.revisions[exercise.topic],{performance,confidence:next.confidence,assisted:!isIndependent(next)||next.repeatability!=='Yes'},dateKey());
   updated.revisions={...s.revisions,[exercise.topic]:revision};
   const title=milestoneById[exercise.topic].title;
   const level=isIndependent(next)&&next.repeatability==='Yes'&&next.confidence>=4?4:2;
   updated.mastery={...s.mastery,[title]:Math.max(s.mastery[title]||0,level)};
  }
  return updated;
 });
 function saveMistake(event){
  event.preventDefault();const values=Object.fromEntries(new FormData(event.target));
  setSaved(s=>markWeak({...s,mistakes:[...s.mistakes,{id:crypto.randomUUID(),createdAt:new Date().toISOString(),date:dateKey(),title:`Coding: ${exercise.title}`,topic:milestoneById[exercise.topic]?.title||exercise.topic,conceptId:exercise.topic,code:mistake.code,actual:mistake.actual,expected:values.expected,why:values.why,model:values.model,revise:'Yes'}]},exercise.topic));setMistake(null);
 }
 return <><PythonCodeRunner key={storageKey} exercise={exercise} state={state} onChange={update} compact={compact} playground={playground} hideHelp={hideHelp} onMistake={(ex,value)=>setMistake({code:value.code,actual:value.lastResult?.error||value.lastResult?.testResults.filter(t=>!t.passed).map(t=>`${t.name}: ${t.feedback}`).join('\n')||'Tests did not pass'})}/>{mistake&&<form className="card content-card" onSubmit={saveMistake}><h3>Explain the mistake before saving</h3><p>{exercise.title}</p><pre>{mistake.actual}</pre><label>What did I expect?<textarea name="expected" required/></label><label>Why was my assumption wrong?<textarea name="why" required/></label><label>What is the correct mental model?<textarea name="model" required/></label><button className="primary" type="submit">Save to Mistakes</button><button className="secondary" type="button" onClick={()=>setMistake(null)}>Cancel</button></form>}</>;
}
export function CodingLibrary({saved,setSaved,topic}){
 const initial=topic?executableFor(topic)?.id:null;
 const [selected,setSelected]=useState(initial||'group-users'),[search,setSearch]=useState(''),[difficulty,setDifficulty]=useState('All'),[type,setType]=useState('All');
 const items=executableExercises.filter(e=>(difficulty==='All'||e.difficulty===difficulty)&&(type==='All'||e.type===type)&&`${e.title} ${e.topic} ${e.description}`.toLowerCase().includes(search.toLowerCase()));
 const exercise=executableById[selected];
 return <><div className="coding-filters"><label>Find executable practice<input aria-label="Search executable exercises" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Decorator, generator, async…"/></label><label>Difficulty<select aria-label="Executable difficulty" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{['All','Easy','Medium','Hard','Advanced'].map(x=><option key={x}>{x}</option>)}</select></label><label>Exercise type<select aria-label="Exercise type" value={type} onChange={e=>setType(e.target.value)}>{['All',...exerciseTypes].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="coding-library"><aside className="coding-library-menu" aria-label="Executable exercise library">{items.map(e=><button key={e.id} className={selected===e.id?'selected':''} onClick={()=>setSelected(e.id)}>{e.title}<small>{e.difficulty} · {e.type}{saved.codingExercises?.[e.id]?.completed?' · completed':''}</small></button>)}{!items.length&&<p>No matching exercises. Try another search or filter.</p>}</aside><SavedPythonRunner key={exercise.id} exercise={exercise} saved={saved} setSaved={setSaved}/></div></>;
}
export function Playground({saved,setSaved}){
 const [packages,setPackages]=useState(saved.playgroundPackages||[]);
 const exercise={...openPractice('playground','Python Playground','playground','Experiment with Python directly in your browser. Each run starts fresh; code persists between visits.'),starterCode:'print("Hello, Python")\n',allowedPackages:packages};
 function loadExample(name){
  if(!name)return;
  const existing=saved.codingExercises?.playground?.code;
  if(existing?.trim().length>20&&!window.confirm('Replace your playground code with this example?'))return;
  setSaved(s=>({...s,codingExercises:{...s.codingExercises,playground:{...(s.codingExercises?.playground||freshCodingState(exercise)),code:playgroundExamples[name]}}}));
 }
 return <><div className="coding-filters"><label>Examples library<select aria-label="Playground examples" value="" onChange={e=>loadExample(e.target.value)}><option value="">Choose an experiment</option>{Object.keys(playgroundExamples).map(x=><option key={x}>{x}</option>)}</select></label><label>Optional package<select aria-label="Playground package" value={packages[0]||''} onChange={e=>{const values=e.target.value?[e.target.value]:[];setPackages(values);setSaved(s=>({...s,playgroundPackages:values}));}}><option value="">Standard library only</option>{['numpy','pandas','pydantic'].map(x=><option key={x}>{x}</option>)}</select></label></div><SavedPythonRunner exercise={exercise} saved={saved} setSaved={setSaved} playground/><p className="muted">Asyncio experiments can use top-level await. Browser Python cannot host FastAPI/MCP servers, run OS processes, or connect directly to PostgreSQL. Use the documented local environment for those lessons.</p></>;
}
export function CodingProgress({saved}){
 const value=codingSummary(saved.codingExercises);
 return <section className="card content-card"><h2>Browser coding evidence</h2><div className="coding-summary">{[[value.completed,'Exercises completed'],[value.independent,'Completed without assistance'],[value.attempts,'Execution attempts'],[`${value.testsPassed}/${value.tests}`,'Latest tests passed'],[value.hints,'Hints used'],[value.revealed,'Solutions revealed']].map(([n,label])=><div key={label}><strong>{n}</strong><span>{label}</span></div>)}</div><p className="muted">Completion requires passing tests or a correct committed prediction. Running code alone earns no completion. Exercise confidence and repeatability update mastery and revision; full mastery remains a separate assessment.</p></section>;
}
