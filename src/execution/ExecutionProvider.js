/** execute(code, {tests, hiddenTests, allowedPackages, timeLimit, onStatus})
 * -> Promise<{success,stdout,stderr,executionTime,testResults,error,timedOut}>
 * reset()/dispose() cancel work and release runtime resources.
 * Remote/Docker providers are deliberately not implemented.
 */
export class ExecutionProvider {
 execute(){throw new Error('Execution provider must implement execute');}
 reset(){}
 dispose(){this.reset();}
}
export const emptyResult=()=>({success:false,stdout:'',stderr:'',executionTime:0,testResults:[],error:null,timedOut:false});
