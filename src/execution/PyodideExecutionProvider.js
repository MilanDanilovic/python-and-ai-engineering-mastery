import {ExecutionProvider,emptyResult} from './ExecutionProvider.js';
export class PyodideExecutionProvider extends ExecutionProvider {
 constructor(workerFactory=()=>new Worker(new URL('./python.worker.js',import.meta.url),{type:'module'})){
  super();this.workerFactory=workerFactory;this.worker=null;this.pending=null;this.sequence=0;
 }
 execute(code,options={}){
  if(this.pending)return Promise.reject(new Error('An execution is already active.'));
  if(!this.worker)this.worker=this.workerFactory();
  const id=++this.sequence;
  return new Promise(resolve=>{
   const finish=result=>{if(this.pending?.id!==id)return;clearTimeout(this.pending.timer);this.pending=null;resolve(result);};
   const fail=(message,timedOut=false)=>{
    const started=this.pending?.started;this.worker?.terminate();this.worker=null;
    finish({...emptyResult(),error:message,timedOut,executionTime:started?performance.now()-started:0});
   };
   this.pending={id,finish,started:null,timer:setTimeout(()=>fail('Python preparation could not finish. Check your connection and try again.'),90000)};
   options.onStatus?.('Starting Python');
   this.worker.onerror=()=>fail('The Python environment stopped unexpectedly. Run again to restart it.');
   this.worker.onmessage=event=>{
    const message=event.data;if(message.id!==id||this.pending?.id!==id)return;
    if(message.type==='status'){
     options.onStatus?.(message.status);
     if(message.status==='Running'||message.status==='Testing'){
      clearTimeout(this.pending.timer);this.pending.started=performance.now();
      const limit=Math.max(100,Math.min(options.timeLimit??5000,60000));
      this.pending.timer=setTimeout(()=>fail('Execution stopped because the code exceeded the time limit.',true),limit);
     }
    }else if(message.type==='result'){
     this.worker?.terminate();this.worker=null;finish(message.result);
    }
   };
   this.worker.postMessage({id,code,tests:options.tests||[],hiddenTests:options.hiddenTests||[],allowedPackages:options.allowedPackages||[],testing:!!options.testing});
  });
 }
 reset(){
  this.worker?.terminate();this.worker=null;
  if(this.pending)this.pending.finish({...emptyResult(),error:'Execution stopped. Environment reset.'});
 }
}
