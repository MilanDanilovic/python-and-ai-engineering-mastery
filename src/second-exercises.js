// A second small experiment for each outcome; these are deliberately distinct from the practical task.
export const secondExercises = Object.fromEntries(`bindings|Rebind one alias to a new list and verify that the other alias still refers to the original.
mutability|Put a list inside a tuple, mutate the list, and explain which object changed.
identity|Create two distinct dictionaries with equal contents and test both identity and equality.
truth|Write a decision table distinguishing None, an empty string, zero, and False.
numbers|Round two Decimal values at a half-cent boundary using an explicit rounding mode.
strings|Reverse a string with slicing and compare a full slice with an out-of-range slice.
lists|Compare a negative index with its positive equivalent and demonstrate an invalid index.
dicts|Compare direct lookup, get, and membership for a missing key and a key mapped to None.
sets|Add a tuple to a set, then try a tuple containing a list and explain the different results.
unpack|Capture the first and last items with a starred middle, including a two-item input.
loops|Write a loop with break and else; demonstrate both branches with different inputs.
comprehensions|Create a dictionary comprehension that maps each nonempty word to its length.
exceptions|Trace the order of try, except, else, and finally for successful and failing operations.
files|Join paths with pathlib and compare relative and resolved absolute paths.
json|Decode a JSON null, boolean, number, and array and identify each Python type.
define|Add a docstring to a helper and inspect it without calling the helper.
returns|Compare explicit return None, bare return, and falling off the end of a function.
positional|Define a positional-only parameter and demonstrate the failure of a keyword call.
keywords|Add a required keyword-only option and demonstrate the error when it is omitted.
defaults|Override a default explicitly and compare the result with a call that omits it.
mutable-defaults|Test a None-sentinel implementation with two omitted arguments and an explicitly supplied list.
args|Call the same variadic helper with zero, one, and three arguments and inspect the tuple.
kwargs|Separate one named parameter from two extra keyword options and inspect the collected dictionary.
argument-unpack|Expand an empty tuple and a nonempty option dictionary into one function call.
annotations|Inspect a function's annotations and compare them with what a static checker reports.
function-objects|Compare callable() for a function, its returned value, and an ordinary integer.
higher-order|Write a factory that returns either an uppercase or lowercase formatter.
scope|Demonstrate that mutating a referenced global list differs from rebinding the global name.
legb|Use a nested function to show an enclosing binding taking precedence over a global binding.
closures|Use nonlocal to maintain a counter and show that two factory calls keep separate state.
shallow-copy|Replace an item in a shallow outer copy, then contrast that with mutating a nested item.
deep-copy|Deep-copy a structure containing the same nested list twice and inspect alias preservation within the copy.
classes|Call an instance method on two independently initialized objects and compare their state.
attributes|Shadow a class attribute on one instance and compare lookup on another instance.
composition|Replace a composed sink with an in-memory implementation without changing the writer.
dataclasses|Compare equality of two dataclass instances before and after changing one field.
properties|Create a read-only property and capture the error raised by attempted assignment.
method-kinds|Call an inherited classmethod factory on a subclass and inspect the returned type.
dunders|Implement equality for two value objects and return NotImplemented for unsupported types.
iterables|Compare iter(collection) is collection for a list and for an iterator.
iterators|Exhaust a custom iterator and verify that later next calls continue raising StopIteration.
generators|Insert a message after the final yield and observe when it runs during exhaustion.
generator-pipelines|Use yield from to delegate to two small iterables and predict the emitted sequence.
generator-cleanup|Compare normal exhaustion with explicit close using an observable finally block.
decorators|Make a decorator return a different callable and inspect the decorated name.
decorator-forwarding|Inspect __wrapped__ and __doc__ with and without functools.wraps.
decorator-factories|Create two decorated functions with different thresholds and verify independent configuration.
decorator-order|Expand two stacked decorators into ordinary function calls and compare output order.
context-managers|Raise inside a with block and record the exception details received by __exit__.
contextlib|Raise during a generator context manager's body and verify state restoration.
packages|Compare a module's __name__ when imported and when run as the entry point.
environment|Install your package into a second empty environment and verify its public import path.
configuration|Emit two structured log events with the same request ID and different event names.
unions|Narrow a Literal-based status with explicit branches and check an invalid assignment statically.
callable-types|Compare a correctly typed callback with one that accepts the wrong number of arguments.
generics|Use the same generic helper with strings and integers and inspect inferred result types.
protocol|Provide a compatible class without inheriting from the Protocol and run a static check.
typeddict|Mark one field NotRequired and compare a missing field with a field whose value is None.
type-narrowing|Use isinstance to separate two union branches and annotate the type expected in each.
pytest|Run one selected test by node ID and inspect the failure output after changing its assertion.
fixtures|Use a yield fixture and prove that teardown happens after a failing test.
parametrize|Give each parameter case a descriptive ID and run a single failing case.
exception-tests|Verify that a function does not raise on a valid boundary input alongside the failure test.
mocking|Assert the arguments supplied to a patched dependency without asserting internal call order.
monkeypatch|Temporarily remove an environment variable and verify the loader's missing-value behavior.
fakes|Use the same writer contract assertions against an in-memory fake and a file implementation.
debugging|Set a breakpoint before a failing call and inspect the actual argument types.
test-boundaries|Introduce an adapter-specific failure that only an integration test can detect.
coroutines|Use inspect.iscoroutinefunction and inspect.iscoroutine to distinguish the function from its call result.
coroutine-call|Create two coroutine objects from one function and await them separately.
await|Await a coroutine that returns immediately and compare the trace with one that awaits a sleep.
event-loop|Print the running loop from two tasks and verify they share it.
tasks|Name a task, inspect its pending state, then await it and inspect its completed state.
gather|Make tasks finish in a different order from creation and inspect gather's result ordering.
cancellation|Request cancellation after a task has finished and inspect the outcome.
timeouts|Compare a completed operation with one exceeding the same timeout and inspect the exception boundary.
async-errors|Raise in two tasks inside a TaskGroup and inspect the resulting grouped failure behavior.
queues|Fill a size-one queue and show that a second producer waits until a consumer removes an item.
locks|Add an exception inside async with lock and prove another task can acquire the released lock.
semaphores|Raise inside the limited region and verify the semaphore permit is returned.
async-context|Raise inside an async with block and record the exception received by __aexit__.
async-iterators|Exhaust an async iterator and verify that StopAsyncIteration ends the loop.
blocking|Add a periodic heartbeat and measure its delay while a CPU loop runs on the event-loop thread.
async-threads|Pass arguments into to_thread and verify that its result returns to the awaiting coroutine.
cpu-work|Measure wall time and CPU time for a sleep-heavy task and a calculation-heavy task.
processes|Compare transferring a small integer with transferring a large payload to a worker process.
fastapi-routing|Add a path parameter and inspect the route's path and method in OpenAPI.
fastapi-deps|Override a dependency in one endpoint test and then restore the override map.
fastapi-validation|Send a missing and an invalid query parameter and compare validation error locations.
fastapi-middleware|Raise a known domain error and verify the response status and structured error body.
fastapi-resources|Count resource startup and shutdown events during one application's lifespan.
fastapi-background|Verify which work happens before the response and which is scheduled afterward.
base-model|Inspect the structured validation errors for a payload with two invalid fields.
pydantic-fields|Use default_factory for a list and prove that two model instances do not share it.
field-validators|Compare raw and parsed input observed by before and after validators.
model-validators|Test equal, increasing, and decreasing timestamp pairs against the same invariant.
nested-models|Introduce an error in the second nested order and inspect its indexed error path.
discriminators|Validate one instance of every tagged variant, then try an unknown tag.
serialization|Compare Python-mode and JSON-mode dumps of a model containing a datetime.
json-schema|Compare generated required fields for a required value and one with a default.
agent-loop|Simulate a model response with no tool request and verify that the loop terminates.
pydantic-agent|Replace the test model without changing the assistant's dependency or output contract.
run-context|Run the same agent with two fake repositories and verify that their data stays separate.
agent-tools|Invoke a tool with an invalid ID and inspect how the failure reaches the caller.
structured-output|Supply an invalid result variant through a fake model and observe bounded correction behavior.
streaming-history|Compare the stored history after a new run with the history used for a follow-up.
usage-limits|Simulate a run that requests another step at its budget boundary and verify termination.
agent-tests|Make a fake tool fail deterministically and assert the application's chosen error behavior.
tool-schemas|Mark a required input explicitly and inspect the schema for accidental optionality.
tool-validation|Return distinct stable error codes for missing customers and unavailable storage.
tool-effects|Repeat the same write with a changed payload and specify whether it must be rejected.
tool-permissions|Create a small matrix of caller roles, target tenants, and allowed operations.
mcp-roles|Trace a single tool call from host to client to server and the result back again.
mcp-discovery|Compare capability discovery against tools/list for a server exposing no tools.
mcp-primitives|Describe who selects a prompt, who reads a resource, and who invokes a tool.
mcp-transport|Simulate a dropped connection and list which state must be renegotiated.
harness-runtime|Remove one filesystem permission and demonstrate the resulting denied operation.
harness-context|Trim an oversized context bundle while retaining the task goal and source provenance.
harness-observation|Trace a denied tool call separately from a tool implementation failure.
ontology-entities|Distinguish a customer entity's identity from two mutable display attributes.
ontology-relations|Represent a many-to-many employee-to-ticket relationship without duplicating entities.
ontology-contracts|Trace one customer ID from a document through retrieval into a structured tool result.
ingestion|Modify one document version and distinguish an update from an unchanged reingestion.
chunking|Compare a heading-aware split with a fixed-size split on a short structured policy.
metadata|Filter two versions of one document so only the intended active version is returned.
embeddings|Store model identity with a vector and reject a query vector from a different representation.
cosine|Compare parallel, perpendicular, and opposite vectors using cosine similarity.
vector-search|Query the same tiny dataset with two explicit K values and inspect result ordering.
vector-indexes|Use exact search as a baseline and count indexed-search misses for several queries.
full-text|Compare a phrase containing stopwords under two explicit text-search configurations.
hybrid|Change the RRF rank constant on two toy result lists and inspect the merged ordering.
basic-rag|Remove the only supporting passage and verify that the answering behavior changes.
reranking|Hold candidates fixed and compare the context selected before and after reranking.
query-rewriting|Keep both the original and rewritten query in a trace and identify unsupported added details.
citations|Write one supported claim and one unsupported claim against the same retrieved passage.
retrieval-eval|Increase K on a fixed result list and calculate the new precision and recall.
workflow-concepts|Mark which transitions are deterministic and which cross an external side-effect boundary.
dbos-workflows|Retrieve or inspect the outcome associated with one known workflow identity.
dbos-steps|Record a step result and distinguish it from a fresh execution of its external operation.
recovery|Repeat the interruption experiment at a different boundary and compare which steps rerun.
durable-queues|Submit more work than the concurrency limit and observe waiting versus active jobs.
retries|Inject a permanent error and verify that the retry policy stops without consuming every attempt.
idempotency|Submit the same key with a different payload and verify the defined conflict behavior.
observability|Compute a simple failure-rate metric from a set of correlated run events.
agent-evaluation|Score an answer-correct run that nevertheless calls an unauthorized tool.
tool-evaluation|Inject a timeout after a successful write and verify duplicate-submission handling.
regression-eval|Keep a held-out query subset separate from the cases used to refine the prompt.
cost-fallbacks|Compare structured output and tool behavior of a primary and fallback fake model.
secrets|Identify which components need each credential and remove one unnecessary grant.
prompt-injection|Place adversarial text in a tool result instead of a document and verify the same boundary.
human-approval|Reject an approval whose actor, action digest, or expiration no longer matches.
failure-compensation|Retry a compensation operation and verify that it does not reverse the same effect twice.`.split('\n').map(row=>row.split('|')));
