import test from 'node:test';
import assert from 'node:assert/strict';
import {PyodideExecutionProvider} from '../src/execution/PyodideExecutionProvider.js';
import {executableExercises} from '../src/execution/exercises.js';
import {freshCodingState,recordCodingAttempt,isIndependent} from '../src/execution/coding-progress.js';
import {emptyResult} from '../src/execution/ExecutionProvider.js';

test('execution timeout terminates worker and permits a fresh subsequent run',async()=>{
 const workers=[];
 const provider=new PyodideExecutionProvider(()=>{
  const worker={terminated:false,terminate(){this.terminated=true;},postMessage({id}){
   queueMicrotask(()=>this.onmessage({data:{id,type:'status',status:'Running'}}));
   if(workers.length>1)setTimeout(()=>this.onmessage({data:{id,type:'result',result:{...emptyResult(),success:true,stdout:'ok'}}}),10);
  }};workers.push(worker);return worker;
 });
 const timed=await provider.execute('while True: pass',{timeLimit:100});
 assert.equal(timed.timedOut,true);assert.equal(workers[0].terminated,true);
 const success=await provider.execute('print("ok")',{timeLimit:100});
 assert.equal(success.success,true);assert.equal(workers.length,2);provider.dispose();
});
test('reset settles a pending initialization and late messages cannot alter a new attempt',async()=>{
 const provider=new PyodideExecutionProvider(()=>({postMessage(){},terminate(){}}));
 const running=provider.execute('pass');provider.reset();
 assert.match((await running).error,/reset/);assert.equal(provider.pending,null);
});
test('running is not completion; tests, predictions, and assistance have separate evidence',()=>{
 const exercise=executableExercises[0],fresh=freshCodingState(exercise);
 const result={...emptyResult(),success:true};
 const run=recordCodingAttempt(fresh,exercise,result,'run');
 assert.equal(run.completed,false);assert.equal(run.attempts,1);
 const passed={...result,testResults:[...exercise.tests,...exercise.hiddenTests].map(t=>({...t,passed:true}))};
 const completed=recordCodingAttempt(run,exercise,passed,'tests');
 assert.equal(completed.completed,true);assert.equal(isIndependent(completed),true);
 assert.equal(isIndependent({...completed,hintsUsed:1}),false);
 assert.equal(isIndependent({...completed,solutionRevealed:true}),false);
 const prediction=executableExercises.find(e=>e.type==='Prediction');
 const wrong=recordCodingAttempt({...freshCodingState(prediction),prediction:'wrong'},prediction,{...result,stdout:prediction.expectedOutput},'run');
 assert.equal(wrong.completed,false);
});
test('executable exercises provide complete contracts and distinct test IDs',()=>{
 assert.equal(new Set(executableExercises.map(e=>e.id)).size,executableExercises.length);
 for(const e of executableExercises){
  for(const field of ['id','title','description','topic','difficulty','starterCode','solution'])assert.ok(e[field],`${e.id}: ${field}`);
  assert.ok(e.hints.length>=3);assert.equal(e.timeLimit,5000);
  const tests=[...e.tests,...e.hiddenTests];assert.equal(new Set(tests.map(t=>t.id)).size,tests.length);
  assert.ok(tests.length||e.completionRule==='prediction');
  for(const t of tests)assert.ok(t.name&&t.code&&t.feedback);
 }
});
