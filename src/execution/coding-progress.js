export const freshCodingState=exercise=>({code:exercise.starterCode||'',attempts:0,testAttempts:0,hintsUsed:0,solutionRevealed:false,aiUsed:false,completed:false,bestPassed:0,confidence:null,repeatability:'',prediction:'',predictionSubmitted:false,history:[]});
export function recordCodingAttempt(previous,exercise,result,mode,now=new Date()){
 const passed=result.testResults.filter(t=>t.passed).length;
 const total=exercise.tests.length+exercise.hiddenTests.length;
 const predictionMatches=exercise.type==='Prediction'&&result.success&&previous.prediction.trim()===result.stdout.trim();
 const complete=exercise.completionRule==='prediction'?predictionMatches:mode==='tests'&&total>0&&result.success&&passed===total;
 const event={at:now.toISOString(),mode,passed,total,success:complete,duration:result.executionTime,timedOut:result.timedOut};
 return {...previous,topic:exercise.topic,type:exercise.type,exerciseTitle:exercise.title,attempts:(previous.attempts||0)+1,
  testAttempts:(previous.testAttempts||0)+(mode==='tests'?1:0),lastAttemptedAt:event.at,lastResult:result,lastMode:mode,
  testsPassed:mode==='tests'?passed:previous.testsPassed||0,totalTests:total,bestPassed:Math.max(previous.bestPassed||0,passed),
  completed:previous.completed||complete,completedCode:complete?previous.code:previous.completedCode,
  completedAt:previous.completedAt||(complete?event.at:null),predictionMatches:exercise.type==='Prediction'?predictionMatches:null,
  history:[...(previous.history||[]),event].slice(-50)};
}
export const isIndependent=state=>!!state.completed&&!state.aiUsed&&!state.hintsUsed&&!state.solutionRevealed;
export function codingSummary(records={}){
 const values=Object.values(records).filter(s=>s.testAttempts||s.predictionSubmitted&&s.attempts);
 return {exercises:values.length,completed:values.filter(s=>s.completed).length,independent:values.filter(isIndependent).length,
  attempts:values.reduce((n,s)=>n+(s.attempts||0),0),hints:values.reduce((n,s)=>n+(s.hintsUsed||0),0),
  revealed:values.filter(s=>s.solutionRevealed).length,testsPassed:values.reduce((n,s)=>n+(s.testsPassed||0),0),
  tests:values.reduce((n,s)=>n+(s.totalTests||0),0)};
}
