const INDEX_URL='https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
const SUPPORTED=new Set(['numpy','pandas','pydantic']);
const MAX_OUTPUT=32000;
let pyodide;
self.onmessage=async({data})=>{
 const {id,code,tests,hiddenTests,allowedPackages,testing}=data;
 const status=value=>self.postMessage({id,type:'status',status:value});
 let stdout='',stderr='',started=0,namespace;
 const result={success:false,stdout:'',stderr:'',executionTime:0,testResults:[],error:null,timedOut:false};
 try{
  if(!pyodide){
   status('Starting Python');
   const {loadPyodide}=await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`);
   pyodide=await loadPyodide({indexURL:INDEX_URL,stdout:()=>{},stderr:()=>{}});
   pyodide.setStdin({error:true});
  }
  for(const name of allowedPackages){
   if(!SUPPORTED.has(name))throw new Error(`Package ${name} is not enabled for browser exercises.`);
   status(`Loading Packages: ${name}`);await pyodide.loadPackage(name);
  }
  status('Ready');status(testing?'Testing':'Running');started=performance.now();
  let capture=true;
  pyodide.setStdout({batched:text=>{if(capture&&stdout.length<MAX_OUTPUT)stdout=(stdout+text+'\n').slice(0,MAX_OUTPUT);}});
  pyodide.setStderr({batched:text=>{if(capture&&stderr.length<MAX_OUTPUT)stderr=(stderr+text+'\n').slice(0,MAX_OUTPUT);}});
  const dict=pyodide.globals.get('dict');
  const fresh=()=>{const value=dict();value.set('__name__','__main__');return value;};
  namespace=fresh();
  const value=await pyodide.runPythonAsync(code,{globals:namespace,filename:'student.py'});value?.destroy?.();
  result.success=true;
  if(testing){
   capture=false;
   for(const [hidden,cases] of [[false,tests],[true,hiddenTests]]){
    for(const test of cases){
     const scope=fresh();let passed=false,feedback='';
     try{
      const studentValue=await pyodide.runPythonAsync(code,{globals:scope,filename:'student.py'});studentValue?.destroy?.();
      const testValue=await pyodide.runPythonAsync(test.code,{globals:scope,filename:hidden?'hidden_test.py':'visible_test.py'});testValue?.destroy?.();
      passed=true;
     }catch(error){feedback=test.feedback||'The implementation does not yet meet this behavior.';}
     finally{scope.destroy();}
     result.testResults.push({id:test.id,name:test.name,hidden,passed,feedback});
    }
   }
   result.success=result.testResults.length>0&&result.testResults.every(t=>t.passed);
  }
 }catch(error){
  const message=String(error.message||error);
  result.error=error.name==='PythonError'||message.includes('Traceback')?message.slice(-MAX_OUTPUT):
   started?'Python could not finish this program. Check imports and browser compatibility.':
   `Could not prepare Python. ${message.includes('not enabled')?message:'Check your internet connection and try again.'}`;
 }finally{
  namespace?.destroy();result.stdout=stdout;result.stderr=stderr;
  result.executionTime=started?performance.now()-started:0;
  self.postMessage({id,type:'result',result});
 }
};
