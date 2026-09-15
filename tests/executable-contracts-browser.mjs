import {chromium} from '@playwright/test';
const browser=await chromium.launch();const page=await browser.newPage();
try{
 await page.goto('http://127.0.0.1:5188');
 const results=await page.evaluate(async()=>{
  const {PyodideExecutionProvider}=await import('/src/execution/PyodideExecutionProvider.js');
  const {executableExercises}=await import('/src/execution/exercises.js');
  const results=[];
  for(const exercise of executableExercises){
   const provider=new PyodideExecutionProvider();
   const result=await provider.execute(exercise.solution,{...exercise,testing:exercise.type!=='Prediction'});
   results.push({id:exercise.id,success:result.success,error:result.error,tests:result.testResults,
    prediction:exercise.type!=='Prediction'||result.stdout.trim()===exercise.expectedOutput.trim()});provider.dispose();
  }
  return results;
 });
 const failed=results.filter(r=>!r.success||!r.prediction);
 if(failed.length)throw new Error(JSON.stringify(failed,null,2));
 console.log(`All ${results.length} executable reference contracts passed in real browser Pyodide, including async and Pydantic.`);
}finally{await browser.close();}
