// Section links are checked by scripts/check-documentation.mjs.
const py='https://docs.python.org/3/';
const rows=`bindings|reference/executionmodel.html#binding-of-names|Binding of names|Read how assignment binds names; distinguish a name from the object it refers to.
mutability|reference/datamodel.html#objects-values-and-types|Objects, values and types|Find the distinction between identity, type and value, including mutable contents inside tuples.
identity|reference/expressions.html#is-not|Identity comparisons|Compare is with ==; identify when object identity is the intended question.
truth|library/stdtypes.html#truth-value-testing|Truth value testing|Find the false values and explain why zero is different from missing.
numbers|library/decimal.html#quick-start-tutorial|Decimal quick-start|Compare construction from strings and floats, then inspect rounding with quantize.
strings|library/stdtypes.html#text-sequence-type-str|Text sequence type str|Read about Unicode strings and encoding before applying sequence slicing.
lists|tutorial/datastructures.html#more-on-lists|More on lists|Compare append and extend and note which operations mutate the list.
dicts|library/stdtypes.html#dict.setdefault|dict.setdefault|Trace the returned value for an existing key and a missing key.
sets|tutorial/datastructures.html#sets|Sets|Try union and intersection, then explain why set elements must be hashable.
unpack|tutorial/datastructures.html#tuples-and-sequences|Tuples and sequences|Find sequence unpacking and contrast creating a tuple with assigning its elements.
loops|tutorial/controlflow.html#the-range-function|The range function|Check the exclusive stop and connect range to zero-based sequence indexes.
comprehensions|tutorial/datastructures.html#list-comprehensions|List comprehensions|Identify the output expression, iteration clause and filter in that order.
exceptions|tutorial/errors.html#handling-exceptions|Handling exceptions|Follow where execution resumes after a matching handler; avoid catching unrelated errors.
files|library/pathlib.html#pathlib.Path.open|Path.open|Read the encoding parameter and the with-block example for reliable cleanup.
json|library/json.html#json.loads|json.loads|Check the conversion table and JSONDecodeError; decoding is not domain validation.
define|tutorial/controlflow.html#defining-functions|Defining functions|Follow when def executes and when the function body runs.
returns|reference/simple_stmts.html#the-return-statement|The return statement|Distinguish sending a value to the caller from displaying text.
positional|tutorial/controlflow.html#positional-or-keyword-arguments|Positional-or-keyword arguments|Match arguments to parameter positions and compare the same call using names.
keywords|tutorial/controlflow.html#keyword-arguments|Keyword arguments|Read the invalid-call examples, especially duplicate values for one parameter.
defaults|tutorial/controlflow.html#default-argument-values|Default argument values|Find when a default expression is evaluated, not just how to omit an argument.
mutable-defaults|tutorial/controlflow.html#default-argument-values|Mutable default example|Trace the accumulating list example and the None-sentinel repair.
args|tutorial/controlflow.html#arbitrary-argument-lists|Arbitrary argument lists|Identify the tuple collected by *args and why later parameters are keyword-only.
kwargs|tutorial/controlflow.html#keyword-arguments|Collecting keyword arguments|Find the **name example and distinguish that dictionary from explicitly declared parameters.
argument-unpack|tutorial/controlflow.html#unpacking-argument-lists|Unpacking argument lists|Compare * at a call site with * in a parameter list.
annotations|tutorial/controlflow.html#function-annotations|Function annotations|Read where annotations are stored and why they do not by themselves validate inputs.
function-objects|reference/datamodel.html#user-defined-functions|User-defined functions|Inspect function attributes and distinguish a function object from its return value.
higher-order|library/functions.html#sorted|sorted and its key function|Follow how a callable is passed as key without being called at the call site.
scope|reference/executionmodel.html#resolution-of-names|Resolution of names|Read why assigning a name makes it local throughout a function block.
legb|tutorial/classes.html#python-scopes-and-namespaces|Python scopes and namespaces|Trace local, enclosing, module and built-in namespaces for ordinary function code.
closures|reference/executionmodel.html#interaction-with-dynamic-features|Free-variable lookup|Find when free variables are resolved; compare capturing a binding with saving a value.
shallow-copy|library/copy.html#copy.copy|Shallow copy|Read the shallow/deep distinction above the API and trace nested references.
deep-copy|library/copy.html#copy.deepcopy|Deep copy|Read about recursive copying and the memo dictionary before copying arbitrary objects.
classes|tutorial/classes.html#class-objects|Class objects|Follow instantiation and __init__; distinguish creating an instance from initializing it.
attributes|tutorial/classes.html#class-and-instance-variables|Class and instance variables|Trace the shared mutable class-variable example and its instance-owned repair.
composition|tutorial/classes.html#inheritance|Inheritance|Find method lookup in base classes, then compare delegation to a contained collaborator.
dataclasses|library/dataclasses.html#dataclasses.dataclass|The dataclass decorator|Check generated methods and defaults; then inspect field(default_factory=...).
properties|library/functions.html#property|property|Read the getter/setter example and separate attribute syntax from stored data.
method-kinds|library/functions.html#classmethod|classmethod|Compare the implicit class argument with an instance method and staticmethod.
dunders|reference/datamodel.html#special-method-names|Special method names|Choose one syntax operation and find the method Python calls for it.
iterables|library/stdtypes.html#typeiter|Iterator types|Distinguish obtaining an iterator with iter from advancing it with next.
iterators|library/stdtypes.html#iterator.__next__|iterator.__next__|Check StopIteration and the requirement that exhausted iterators remain exhausted.
generators|tutorial/classes.html#generators|Generators|Trace suspension at yield and resumption at the next request.
generator-pipelines|tutorial/classes.html#generator-expressions|Generator expressions|Compare lazy consumption with building a list and note single-pass behavior.
generator-cleanup|reference/expressions.html#generator.close|generator.close|Read GeneratorExit and cleanup semantics; do not depend on garbage collection timing.
decorators|reference/compound_stmts.html#function-definitions|Function definitions and decorators|Find the transformation from decorator syntax to nested function calls.
decorator-forwarding|library/functools.html#functools.wraps|functools.wraps|Read which metadata is copied and why forwarding arguments is a separate responsibility.
decorator-factories|reference/compound_stmts.html#function-definitions|Decorator expressions|Separate evaluating the decorator factory, wrapping the function and calling the wrapper.
decorator-order|reference/compound_stmts.html#function-definitions|Nested decorators|Expand two decorators into outer(inner(function)) and trace call order.
context-managers|reference/compound_stmts.html#the-with-statement|The with statement|Follow __enter__, the body and __exit__; inspect the meaning of a truthy exit result.
contextlib|library/contextlib.html#contextlib.contextmanager|contextmanager|Locate the single yield and the try/finally pattern around it.
packages|tutorial/modules.html#packages|Packages|Read package-qualified imports and distinguish importing a module from running it as a script.
environment|https://packaging.python.org/en/latest/tutorials/packaging-projects/#configuring-metadata|Configuring project metadata|Find requires-python and dependencies; distinguish project metadata from the active interpreter.
configuration|library/logging.html#logging.LoggerAdapter|LoggerAdapter|Follow adding request context through extra instead of concatenating ad hoc log messages.
unions|library/typing.html#typing.Optional|Optional|Read why Optional[T] means T or None, not that an argument can be omitted.
callable-types|library/typing.html#annotating-callable-objects|Annotating callable objects|Match argument types and return type; distinguish the callable itself from its result.
generics|library/typing.html#generics|Generics|Trace the same type variable from an input container to the returned element.
protocol|library/typing.html#typing.Protocol|Protocol|Read structural subtyping: satisfying the required interface does not require inheritance.
typeddict|library/typing.html#typing.TypedDict|TypedDict|Check required and optional keys and the fact that values remain ordinary dictionaries at runtime.
type-narrowing|library/typing.html#typing.TypeGuard|TypeGuard|Read how a predicate changes a checker's knowledge; verify the predicate actually checks the claim.
pytest|https://docs.pytest.org/en/stable/how-to/assert.html#asserting-with-the-assert-statement|Assertions in tests|Read failure introspection; assertions belong here because the topic is testing behavior.
fixtures|https://docs.pytest.org/en/stable/how-to/fixtures.html#fixture-scopes|Fixture scopes|Compare per-test and shared fixture lifetimes, especially when values are mutable.
parametrize|https://docs.pytest.org/en/stable/how-to/parametrize.html#pytest-mark-parametrize-parametrizing-test-functions|Parametrizing test functions|Follow how each input/expected pair becomes an independently reported case.
exception-tests|https://docs.pytest.org/en/stable/how-to/assert.html#assertions-about-expected-exceptions|Expected exceptions|Read pytest.raises and matching messages; place only the failing operation inside the block.
mocking|library/unittest.mock.html#where-to-patch|Where to patch|Patch the name looked up by the system under test, not automatically its defining module.
monkeypatch|https://docs.pytest.org/en/stable/how-to/monkeypatch.html#monkeypatching-environment-variables|Environment variables|Trace setenv and automatic restoration after the test.
fakes|library/unittest.mock.html#unittest.mock.Mock.side_effect|Mock side_effect|Compare configured mock outcomes with a small stateful fake implementing a real interface.
debugging|library/pdb.html#debugger-commands|Debugger commands|Find where, p and next; inspect a failing value before changing the implementation.
test-boundaries|https://docs.pytest.org/en/stable/how-to/fixtures.html#safe-fixture-structure|Safe fixture structure|Trace setup and teardown boundaries; decide which external dependency each test actually exercises.
coroutines|library/asyncio-task.html#coroutines|Coroutines|Separate a coroutine function, the object it creates and the execution driven by awaiting it.
coroutine-call|library/asyncio-task.html#awaitables|Awaitables|Read why calling an async function creates an object without automatically scheduling work.
await|reference/expressions.html#await-expression|Await expression|Trace result propagation and remember that an already-ready operation need not suspend.
event-loop|library/asyncio-eventloop.html#running-and-stopping-the-loop|Running and stopping the loop|Understand the loop lifecycle before using lower-level APIs; prefer asyncio.run in ordinary scripts.
tasks|library/asyncio-task.html#creating-tasks|Creating tasks|Read task ownership, references and scheduling; inspect eager-start behavior in newer Python versions.
gather|library/asyncio-task.html#asyncio.gather|asyncio.gather|Check result ordering and sibling behavior when a child raises; compare TaskGroup.
cancellation|library/asyncio-task.html#task-cancellation|Task cancellation|Read cleanup with try/finally and why CancelledError normally needs to propagate.
timeouts|library/asyncio-task.html#timeouts|Timeouts|Compare timeout, timeout_at and wait_for; identify where TimeoutError is caught.
async-errors|library/asyncio-task.html#task-groups|Task groups|Trace child failure, sibling cancellation and the resulting exception group.
queues|library/asyncio-queue.html#asyncio.Queue|asyncio.Queue|Read maxsize, task_done and join together; queue removal is not task completion.
locks|library/asyncio-sync.html#asyncio.Lock|asyncio.Lock|Find async with and the lock acquisition semantics for cooperating tasks.
semaphores|library/asyncio-sync.html#asyncio.Semaphore|asyncio.Semaphore|Trace the shared counter and distinguish concurrent occupancy from requests per second.
async-context|reference/datamodel.html#asynchronous-context-managers|Asynchronous context managers|Follow awaited __aenter__ and __aexit__ around an async with block.
async-iterators|reference/datamodel.html#asynchronous-iterators|Asynchronous iterators|Read __aiter__, __anext__ and StopAsyncIteration as separate protocol responsibilities.
blocking|library/asyncio-dev.html#running-blocking-code|Running blocking code|Find why synchronous CPU work delays all tasks on the event-loop thread.
async-threads|library/asyncio-task.html#asyncio.to_thread|asyncio.to_thread|Read its I/O use case and cancellation limitations; a cancelled await does not forcibly stop a thread.
cpu-work|library/threading.html#gil-and-performance-considerations|GIL and performance|Compare conventional CPython with free-threaded builds; do not assume all threading workloads scale.
processes|library/concurrent.futures.html#processpoolexecutor|ProcessPoolExecutor|Read pickling and importability requirements before moving work to processes.
fastapi-routing|https://fastapi.tiangolo.com/tutorial/first-steps/#step-3-create-a-path-operation|Path operations|Trace the HTTP method, path registration and the function that produces the response.
fastapi-deps|https://fastapi.tiangolo.com/tutorial/dependencies/#declare-the-dependency-in-the-dependant|Declaring dependencies|Follow Depends and parameter injection, then inspect dependency reuse and overrides.
fastapi-validation|https://fastapi.tiangolo.com/tutorial/query-params-str-validations/#additional-validation|Additional validation|Find Annotated and Query constraints; distinguish rejected requests from handler failures.
fastapi-middleware|https://fastapi.tiangolo.com/tutorial/handling-errors/#install-custom-exception-handlers|Custom exception handlers|Find how an application exception becomes an HTTP response; compare middleware wrapping all requests.
fastapi-resources|https://fastapi.tiangolo.com/advanced/events/#lifespan|Lifespan|Trace resource acquisition before yield and cleanup afterward.
fastapi-background|https://fastapi.tiangolo.com/tutorial/background-tasks/#caveat|Background-task caveat|Read when heavier or distributed work needs a job system beyond in-process background tasks.`;
export const readingRows=rows.split('\n').map(row=>{const [id,path,title,focus]=row.split('|');return [id,{url:path.startsWith('https:')?path:py+path,title,focus}];});
const bases={pd:'https://pydantic.dev/docs/validation/latest/concepts/',ai:'https://pydantic.dev/docs/ai/',mcp:'https://modelcontextprotocol.io/',rag:'https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/',dbos:'https://docs.dbos.dev/python/'};
const advanced=`base-model|pd:models/#basic-model-usage|Basic model usage|Trace a dictionary through model_validate and inspect the resulting field types.
pydantic-fields|pd:fields/#numeric-constraints|Numeric constraints|Read gt/ge and lt/le, then find string constraints and default validation.
field-validators|pd:validators/#field-after-validator|After field validators|Check the value's type when the validator runs and remember to return the accepted value.
model-validators|pd:validators/#model-after-validator|After model validators|Find how to compare already-validated fields and why the validator returns self.
nested-models|pd:models/#nested-models|Nested models|Trace recursive construction and inspect the nested path in a validation error.
discriminators|pd:unions/#discriminated-unions-with-string-discriminators|String discriminators|Follow how a Literal field chooses one union branch before validation.
serialization|pd:serialization/#python-mode|Python-mode serialization|Compare model_dump with JSON output and inspect by_alias and field exclusion.
json-schema|pd:json_schema/#generating-json-schema|Generating JSON Schema|Find properties, required and constraints; a schema describes data but does not authorize actions.
agent-loop|ai:core-concepts/agent/#iterating-over-an-agents-graph|Iterating over the agent graph|Trace model requests, tool execution and the end node as separate runtime decisions.
pydantic-agent|ai:core-concepts/agent/#running-agents|Running agents|Compare run, run_sync and streaming; find where dependencies and results enter the run.
run-context|ai:core-concepts/dependencies/#accessing-dependencies|Accessing dependencies|Follow RunContext.deps and distinguish per-run services from generated model arguments.
agent-tools|ai:tools-toolsets/tools/#registering-function-tools-via-decorator|Registering function tools|Compare tool with tool_plain; trace validated inputs into a Python function and its result back to the model.
structured-output|ai:core-concepts/output/#structured-output|Structured output|Read output validation and retry behavior; valid shape does not guarantee truthful content.
streaming-history|ai:core-concepts/agent/#runs-vs-conversations|Runs versus conversations|Follow message history between runs and compare complete output with partial streamed output.
usage-limits|ai:core-concepts/agent/#usage-limits|Usage limits|Distinguish model requests, tokens, tool calls and wall-clock time as different budgets.
agent-tests|ai:guides/testing/#unit-testing-with-functionmodel|FunctionModel tests|Read how controlled model responses isolate application behavior from model quality.
tool-schemas|mcp:specification/latest/server/tools#tool|Tool definition|Inspect name, description and inputSchema, then check the output schema contract.
tool-validation|mcp:specification/latest/server/tools#error-handling|Tool errors|Distinguish protocol errors from tool execution errors reported through isError.
tool-effects|mcp:specification/latest/server/tools#security-considerations|Tool safety boundaries|Read input validation and access controls; idempotency must also be enforced by the application.
tool-permissions|mcp:specification/latest/basic/authorization#scope-selection-strategy|Scope selection|Trace granted scopes and resource access; a schema-valid request can still be unauthorized.
mcp-roles|mcp:docs/learn/architecture#participants|MCP participants|Identify the host, its clients and each server; distinguish process boundaries from protocol roles.
mcp-discovery|mcp:specification/latest/server/tools#listing-tools|Listing tools|Follow tools/list and pagination before issuing tools/call.
mcp-primitives|mcp:docs/learn/architecture#primitives|MCP primitives|Compare tools, resources and prompts by purpose and who selects them.
mcp-transport|mcp:specification/latest/basic/transports/streamable-http#request-metadata|Streamable HTTP|Read per-request metadata and cancellation rules; compare older session-based revisions separately from authorization.
harness-runtime|ai:core-concepts/agent/#iterating-over-an-agents-graph|Runtime control of an agent graph|Locate the loop owned by application code; attach budgets, tool policy and stopping rules there.
harness-context|ai:core-concepts/agent/#runs-vs-conversations|Conversation state|Follow explicit history reuse and decide which state belongs in durable application storage.
harness-observation|ai:integrations/logfire/#debugging|Agent observability|Trace model and tool spans while keeping sensitive input out of routine logs.
ontology-entities|https://www.w3.org/TR/rdf11-primer/#section-IRI|IRIs and identity|Read how identifiers name resources independently of their human-readable labels.
ontology-relations|https://www.w3.org/TR/rdf11-primer/#section-triple|RDF triples|Identify subject, predicate and object; cardinality constraints require an additional schema or application rule.
ontology-contracts|https://www.w3.org/TR/rdf11-primer/#section-vocabulary|RDF vocabularies|Trace shared terms for classes and properties into consistent API and retrieval contracts.
ingestion|rag:rag-solution-design-and-evaluation-guide#rag-data-pipeline-flow|RAG data pipeline|Separate loading, transformation, indexing and refresh; preserve source identity through every stage.
chunking|rag:rag-chunking-phase#fixed-size-parsing-with-overlap|Fixed-size parsing with overlap|Read why overlap preserves boundaries but increases duplication and cost.
metadata|rag:rag-information-retrieval#filter-queries|Filter queries|Apply tenant and access constraints before selecting context; metadata alone is not enforcement.
embeddings|https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html#semantic-search|Semantic search embeddings|Read query/document encoding and similarity; keep model version and dimensions compatible.
cosine|https://github.com/pgvector/pgvector#distances|Distances|Find cosine distance and its conversion to similarity; compare direction with magnitude.
vector-search|https://github.com/pgvector/pgvector#querying|Querying vectors|Read the distance operator, ascending ordering and LIMIT together.
vector-indexes|https://github.com/pgvector/pgvector#indexing|Approximate indexing|Compare exact search with HNSW and IVFFlat; measure recall before choosing speed settings.
full-text|https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-PARSING-DOCUMENTS|Parsing documents|Follow to_tsvector, language configuration and query matching; lexical search is not substring search.
hybrid|https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion#rrf-api|Reciprocal rank fusion|Combine ranks rather than adding incomparable vector and lexical scores.
basic-rag|rag:rag-solution-design-and-evaluation-guide#rag-application-flow|RAG application flow|Follow retrieval, context assembly and generation as separate steps with separate failure modes.
reranking|rag:rag-information-retrieval#cross-encoder-reranking|Cross-encoder reranking|Read why a reranker examines query-document pairs after initial candidate retrieval.
query-rewriting|rag:rag-information-retrieval#rewriting|Query rewriting|Preserve intent while improving retrieval wording; measure changes against the original query.
citations|rag:rag-prompt-engineering#design-grounding-instructions|Grounding instructions|Connect claims to evidence and define behavior for missing or conflicting context.
retrieval-eval|rag:rag-information-retrieval#evaluate-your-search-results|Evaluate search results|Use labeled relevant documents to measure retrieval independently of generated answer quality.
workflow-concepts|dbos:tutorials/workflow-tutorial#workflow-guarantees|Workflow guarantees|Read persisted progress and retry semantics, especially the boundary around external effects.
dbos-workflows|dbos:tutorials/workflow-tutorial#starting-workflows-in-the-background|Starting workflows|Compare invoking a workflow, starting it in the background and retrieving its handle.
dbos-steps|dbos:tutorials/step-tutorial#configurable-retries|Steps and configurable retries|Read the introduction above this section: nondeterministic work belongs in steps with serializable results.
recovery|dbos:tutorials/workflow-tutorial#determinism|Deterministic replay|Identify what is replayed and what result is loaded from durable history.
durable-queues|dbos:tutorials/queue-tutorial#managing-concurrency|Queue concurrency|Distinguish queued durable work from worker concurrency and global limits.
retries|dbos:tutorials/step-tutorial#configurable-retries|Configurable retries|Check attempts, backoff and retryable errors, then budget the total elapsed time.
idempotency|https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT|ON CONFLICT|Use an atomic uniqueness constraint; a prior SELECT is not a concurrency-safe deduplication guard.
observability|https://opentelemetry-python.readthedocs.io/en/latest/api/trace.html#opentelemetry.trace.Span|Trace spans|Distinguish a trace's causal chain from aggregated metrics and individual log events.
agent-evaluation|ai:evals/evals/#evaluators|Evaluators|Separate outcome quality, tool behavior, cost and safety as independently inspectable scores.
tool-evaluation|ai:evals/evals/#datasets-and-cases|Datasets and cases|Create tool boundary cases for invalid arguments, denied access and transient failures.
regression-eval|ai:evals/evals/#running-experiments|Running experiments|Compare candidate and baseline on the same versioned cases and thresholds.
cost-fallbacks|ai:core-concepts/agent/#usage-limits|Usage limits and fallback budgets|Read run limits before adding another attempt or model; fallback work consumes the same end-to-end budget.
secrets|https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/#oauth2-scopes-and-openapi|OAuth2 scopes|Trace declared scopes into enforced checks; secret storage and log redaction are separate responsibilities.
prompt-injection|mcp:docs/2026-07-28/tutorials/security/security_best_practices#confused-deputy-problem|Confused deputy problem|Read the trust-boundary failure and enforce authorization independently of untrusted text.
human-approval|dbos:tutorials/workflow-communication#workflow-messaging-and-notifications|Workflow messaging|Use a resumable wait for a decision, then validate the approver and exact proposed action before execution.
failure-compensation|https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction#solution|Compensating transactions|Read why compensation is business-specific and may not restore the exact original state.`;
readingRows.push(...advanced.split('\n').map(row=>{const [id,path,title,focus]=row.split('|');const key=path.split(':')[0];return [id,{url:bases[key]?bases[key]+path.slice(key.length+1):path,title,focus}];}));
export const readings=Object.fromEntries(readingRows);
