import week1 from './week1.js';
import week2 from './week2.js';
import week3 from './week3.js';
import week4 from './week4.js';
import week5 from './week5.js';
import week6 from './week6.js';
import week7 from './week7.js';
import week8 from './week8.js';
import {readings} from './reading.js';

const models=new Set(`fixtures parametrize monkeypatch test-boundaries agent-loop run-context agent-tools structured-output streaming-history usage-limits agent-tests tool-schemas tool-validation tool-effects tool-permissions mcp-roles mcp-discovery mcp-primitives mcp-transport harness-runtime harness-context harness-observation ontology-entities ontology-relations ontology-contracts ingestion chunking metadata embeddings vector-search vector-indexes full-text basic-rag reranking query-rewriting citations workflow-concepts dbos-workflows dbos-steps recovery durable-queues idempotency observability cost-fallbacks human-approval failure-compensation`.split(' '));
const local=new Set(['async-threads','processes','pydantic-agent','fastapi-routing','fastapi-deps','fastapi-validation','fastapi-middleware','fastapi-resources','fastapi-background']);
export const guides=Object.fromEntries([week1,week2,week3,week4,week5,week6,week7,week8].flatMap(week=>week.split('\n').map(row=>{
 const fields=row.split('|');
 if(fields.length!==6)throw new Error(`Invalid learning guide row: ${fields[0]}`);
 const [id,code,output,walkthrough,pitfall,experiment]=fields;
 const packages=code.includes('from pydantic_ai ')?['pydantic-ai']:code.includes('from pydantic ')?['pydantic']:code.includes('from fastapi ')?['fastapi','httpx']:[];
 return [id,{code:code.replaceAll('\\n','\n'),output:output.replaceAll('\\n','\n'),walkthrough,pitfall,experiment,reading:readings[id],packages,execution:local.has(id)?'local':'browser',kind:models.has(id)?'Concept model':'Worked example'}];
})));
