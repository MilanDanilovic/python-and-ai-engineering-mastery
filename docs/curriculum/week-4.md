# Week 4

[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)

<a id="coroutines"></a>

## What is a coroutine?

An async def function defines a coroutine function whose execution can suspend and resume.

**Why it matters:** Async APIs operate on deferred computations rather than immediate results.

**Prerequisites:** [Defining functions](week-1.md#define), [Generator functions and yield](week-2.md#generators)

**Difficulty:** Intermediate · **Code concepts:** async def, coroutine

[Coroutines](https://docs.python.org/3/library/asyncio-task.html#coroutines) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

**Read for:** Separate a coroutine function, the object it creates and the execution driven by awaiting it.

### Learn with an example

async def creates a coroutine function. Calling it produces a coroutine object; awaiting that object drives its body and receives its result. This example uses top-level await in the browser runner.

**Worked example** - Browser-compatible Python

```python
async def answer():
    return 42
operation = answer()
print(type(operation).__name__)
print(await operation)
```

**Expected output**

```text
coroutine
42
```

**Watch out for:** A coroutine object is not its final value.

**Change one thing:** Add a print inside answer and predict whether it appears before or after the first outer print.

### Simple exercise 1

Define an async helper and inspect the type of its call result.

<details>
<summary>Reveal reference solution</summary>

```python
import inspect
async def count(): return 3
result = count()
print(inspect.iscoroutine(result))  # Expected: True
result.close()  # Inspection only; release the unawaited coroutine.
```

</details>

### Simple exercise 2

Use inspect.iscoroutinefunction and inspect.iscoroutine to distinguish the function from its call result.

<details>
<summary>Reveal reference solution</summary>

```python
import inspect
async def count(): return 3
result = count()
print(inspect.iscoroutinefunction(count) and inspect.iscoroutine(result))  # Expected: True
print(not inspect.iscoroutine(count))  # Expected: True
result.close()
```

</details>

### Practical exercise

Identify coroutine boundaries in an asynchronous log uploader.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def upload(client, records):
    # Local transformation is synchronous; network IO is awaited.
    payload = [str(record) for record in records]
    return await client.send(payload)
class FakeClient:
    async def send(self, payload): return len(payload)
async def main(): print(await upload(FakeClient(), [1, 2]))  # Expected: 2

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A caller expects an integer from an async function without awaiting it. Inspect the returned object.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def count(): return 3
async def main():
    result = await count()  # count() alone returns a coroutine, not 3.
    print(result)  # Expected: 3

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** How does a coroutine differ from a normal function result?

**Explain in your own words:** Explain what is a coroutine? in your own words. Use a concrete example to show why this is true: An async def function defines a coroutine function whose execution can suspend and resume.

<a id="coroutine-call"></a>

## What happens when an async function is called?

Calling async def creates a coroutine object; normal execution of its body begins when awaited or scheduled.

**Why it matters:** Creating work is distinct from running work.

**Prerequisites:** [What is a coroutine?](week-4.md#coroutines)

**Difficulty:** Intermediate · **Code concepts:** coroutine object, await, asyncio.run

[Awaitables](https://docs.python.org/3/library/asyncio-task.html#awaitables) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#coroutines)

**Read for:** Read why calling an async function creates an object without automatically scheduling work.

### Learn with an example

The empty first list proves that a plain coroutine call did not execute the body. Awaiting the object performs the append. Merely creating objects without awaiting or scheduling them loses work.

**Worked example** - Browser-compatible Python

```python
events = []
async def work():
    events.append("ran")
operation = work()
print(events)
await operation
print(events)
```

**Expected output**

```text
[]
['ran']
```

**Watch out for:** Do not confuse creating a coroutine with creating a scheduled task.

**Change one thing:** Create two coroutine objects and await only one; then clean up the other by awaiting it too.

### Simple exercise 1

Place a print before the first await and compare calling with awaiting.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def work(trace):
    trace.append("started")
    await asyncio.sleep(0)
async def main():
    trace = []; pending = work(trace); print(trace)  # Expected: []
    await pending; print(trace)  # Expected: ["started"]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Create two coroutine objects from one function and await them separately.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def value(n): return n
async def main():
    a, b = value(1), value(2)
    print(await a, await b)  # Expected values: 1; 2

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Audit an uploader for created-but-never-awaited work.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def upload(record): return record["id"]
async def main():
    # Every created coroutine has an owner that awaits it.
    results = await asyncio.gather(*(upload({"id": n}) for n in range(3)))
    print(results)  # Expected: [0, 1, 2]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A coroutine is created and discarded, producing a warning. Ensure it is awaited or deliberately scheduled.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def work(): return "done"
async def main():
    print(await work())  # Expected: "done"
    task = asyncio.create_task(work())  # Deliberately scheduled and retained.
    print(await task)  # Expected: "done"

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** Does calling async def immediately execute its body?

**Explain in your own words:** Explain what happens when an async function is called? in your own words. Use a concrete example to show why this is true: Calling async def creates a coroutine object; normal execution of its body begins when awaited or scheduled.

<a id="await"></a>

## What does await actually do?

Await drives an awaitable and can suspend the current coroutine while it waits; it is not a blanket guarantee of yielding.

**Why it matters:** Reasoning about suspension points reveals interleaving and blocking.

**Prerequisites:** [What happens when an async function is called?](week-4.md#coroutine-call)

**Difficulty:** Intermediate · **Code concepts:** awaitable, await, suspension

[Await expression](https://docs.python.org/3/reference/expressions.html#await-expression) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#awaitables)

**Read for:** Trace result propagation and remember that an already-ready operation need not suspend.

### Learn with an example

The surrounding coroutine cannot pass the await until ready supplies a result. Because ready completes immediately, this await need not hand control to another task. Waiting and suspension are related but not identical.

**Worked example** - Browser-compatible Python

```python
async def ready():
    return "value"
print("before")
result = await ready()
print(result)
print("after")
```

**Expected output**

```text
before
value
after
```

**Watch out for:** Counting await keywords does not prove that code yields fairly.

**Change one thing:** Add await asyncio.sleep(0) inside ready and observe it alongside another task.

### Simple exercise 1

Trace messages around an awaited sleep.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    trace = ["before"]
    await asyncio.sleep(0)
    trace.append("after")
    print(trace)  # Expected: ["before", "after"]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Await a coroutine that returns immediately and compare the trace with one that awaits a sleep.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def immediate(): return 1
async def other(trace): trace.append("other")
async def main():
    trace = []; task = asyncio.create_task(other(trace))
    await immediate(); print(trace)  # Expected: []
    await asyncio.sleep(0); await task
    print(trace)  # Expected: ["other"]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Document suspension points around a shared request counter.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def request(state, lock):
    await asyncio.sleep(0)  # IO boundary: other tasks may run.
    async with lock:
        state["count"] += 1  # No suspension inside read-modify-write.
async def main():
    state = {"count": 0}; lock = asyncio.Lock()
    await asyncio.gather(request(state, lock), request(state, lock))
    print(state['count'])  # Expected: 2

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A developer assumes every await lets another task run, but the awaited operation completes immediately. Reproduce the distinction.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def immediate(): return None
async def main():
    trace = []
    async def other(): trace.append("other")
    task = asyncio.create_task(other())
    for _ in range(10): await immediate()
    print(trace)  # Expected: []  # Await did not necessarily suspend.
    await task; print(trace)  # Expected: ["other"]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** Does await always suspend the current task?

**Explain in your own words:** Explain what does await actually do? in your own words. Use a concrete example to show why this is true: Await drives an awaitable and can suspend the current coroutine while it waits; it is not a blanket guarantee of yielding.

<a id="event-loop"></a>

## The asyncio event loop

The loop coordinates ready callbacks, I/O, and task resumption on its thread.

**Why it matters:** Event-loop blocking stalls otherwise unrelated requests.

**Prerequisites:** [What does await actually do?](week-4.md#await)

**Difficulty:** Intermediate · **Code concepts:** asyncio.run, running loop, cooperative scheduling

[Running and stopping the loop](https://docs.python.org/3/library/asyncio-eventloop.html#running-and-stopping-the-loop) · [Additional reading](https://docs.python.org/3/reference/expressions.html#await-expression)

**Read for:** Understand the loop lifecycle before using lower-level APIs; prefer asyncio.run in ordinary scripts.

### Learn with an example

Under the default scheduler, each worker reaches a suspension point before resuming. The event loop coordinates these resumptions on one thread; sleep does not create a worker thread. Exact ordering can change with different scheduling configuration.

**Worked example** - Browser-compatible Python

```python
import asyncio
async def worker(name):
    print(name, "start")
    await asyncio.sleep(0)
    print(name, "end")
await asyncio.gather(worker("a"), worker("b"))
```

**Expected output**

```text
a start
b start
a end
b end
```

**Watch out for:** Cooperative concurrency is not simultaneous CPU execution.

**Change one thing:** Replace the awaited sleep with synchronous work and explain why the other task cannot progress during it.

### Simple exercise 1

Run two sleeping coroutines and trace their interleaving.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def work(name, trace):
    trace.append(name + " start"); await asyncio.sleep(0); trace.append(name + " end")
async def main():
    trace = []; await asyncio.gather(work("a", trace), work("b", trace))
    print(trace)
    print(trace.index('b start') < trace.index('a end'))  # Expected: True

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Print the running loop from two tasks and verify they share it.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def loop(): return asyncio.get_running_loop()
async def main():
    a, b = await asyncio.gather(loop(), loop())
    print(a is b is asyncio.get_running_loop())  # Expected: True

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Draw how an API request waits for I/O without occupying the loop continuously.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def request():
    # request -> await socket IO -> loop runs other ready tasks
    # IO ready -> request resumes -> response
    await asyncio.sleep(0.01)  # Fake IO readiness.
    return "response"
async def main(): print(await request())  # Expected: "response"

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

asyncio.run is called from an already running loop and fails. Use the existing async context.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def child(): return 1
async def main():
    # Already inside the loop: await child(), never asyncio.run(child()).
    print(await child())  # Expected: 1

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** What work does an event loop perform while a task waits for I/O?

**Explain in your own words:** Explain the asyncio event loop in your own words. Use a concrete example to show why this is true: The loop coordinates ready callbacks, I/O, and task resumption on its thread.

<a id="tasks"></a>

## Creating tasks

A task schedules a coroutine for execution under the event loop and represents its eventual outcome.

**Why it matters:** Concurrent work needs ownership, references, and result handling.

**Prerequisites:** [What is a coroutine?](week-4.md#coroutines), [The asyncio event loop](week-4.md#event-loop)

**Difficulty:** Intermediate · **Code concepts:** asyncio.create_task, Task

[Creating tasks](https://docs.python.org/3/library/asyncio-task.html#creating-tasks) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#coroutines)

**Read for:** Read task ownership, references and scheduling; inspect eager-start behavior in newer Python versions.

### Learn with an example

create_task gives the coroutine to the loop and returns a handle. Keeping both handles gives the caller ownership of their results and failures. Awaiting the first handle does not undo the second task's scheduling.

**Worked example** - Browser-compatible Python

```python
import asyncio
async def square(number):
    await asyncio.sleep(0)
    return number * number
first = asyncio.create_task(square(3))
second = asyncio.create_task(square(4))
print(await first, await second)
```

**Expected output**

```text
9 16
```

**Watch out for:** Unreferenced background tasks are not a reliable job system.

**Change one thing:** Make one task raise and ensure the owner still observes or cancels the other.

### Simple exercise 1

Schedule two tasks and await both results.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def value(n): return n
async def main():
    a = asyncio.create_task(value(1)); b = asyncio.create_task(value(2))
    print(await a, await b)  # Expected values: 1; 2

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Name a task, inspect its pending state, then await it and inspect its completed state.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    task = asyncio.create_task(asyncio.sleep(0.01, result=3), name="lookup")
    print(task.get_name() == 'lookup' and (not task.done()))  # Expected: True
    print(await task == 3 and task.done())  # Expected: True

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Launch independent metadata lookups while retaining their task handles.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def lookup(key): await asyncio.sleep(0); return key.upper()
async def main():
    async with asyncio.TaskGroup() as group:
        tasks = {key: group.create_task(lookup(key)) for key in ("name", "region")}
    print({key: task.result() for key, task in tasks.items()})  # Expected: {"name": "NAME", "region": "REGION"}

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A fire-and-forget task raises after the request ends. Add an owner that observes completion and failure.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def fail(): raise ValueError("lookup failed")
async def main():
    task = asyncio.create_task(fail())
    try: await task
    except ValueError as error: print(str(error))  # Expected: "lookup failed"
    # The request owns and observes completion; no orphan task.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** How does scheduling a task differ from awaiting a coroutine directly?

**Explain in your own words:** Explain creating tasks in your own words. Use a concrete example to show why this is true: A task schedules a coroutine for execution under the event loop and represents its eventual outcome.

<a id="gather"></a>

## Waiting for multiple tasks

gather collects ordered results; structured task groups coordinate lifetimes and failures differently.

**Why it matters:** Concurrent APIs need a deliberate result and failure policy.

**Prerequisites:** [Creating tasks](week-4.md#tasks)

**Difficulty:** Intermediate · **Code concepts:** asyncio.gather, TaskGroup

[asyncio.gather](https://docs.python.org/3/library/asyncio-task.html#asyncio.gather) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#creating-tasks)

**Read for:** Check result ordering and sibling behavior when a child raises; compare TaskGroup.

### Learn with an example

Both operations can wait concurrently. gather returns results in input order, so completion order does not rearrange this list. Its ordinary first-error behavior differs from TaskGroup's structured sibling cancellation.

**Worked example** - Browser-compatible Python

```python
import asyncio
async def value(label, delay):
    await asyncio.sleep(delay)
    return label
results = await asyncio.gather(value("slow", 0.01), value("fast", 0))
print(results)
```

**Expected output**

```text
['slow', 'fast']
```

**Watch out for:** Concurrency does not imply completion-order results.

**Change one thing:** Reverse the input order and predict the returned list.

### Simple exercise 1

Compare sequential awaits with gather on two sleeps.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
from time import perf_counter
async def main():
    start = perf_counter()
    await asyncio.sleep(.02); await asyncio.sleep(.02)
    sequential = perf_counter() - start; start = perf_counter()
    await asyncio.gather(asyncio.sleep(.02), asyncio.sleep(.02))
    print("sequential", sequential, "concurrent", perf_counter() - start)

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Make tasks finish in a different order from creation and inspect gather's result ordering.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    results = await asyncio.gather(asyncio.sleep(.02, result="first"), asyncio.sleep(0, result="second"))
    print(results)  # Expected: ["first", "second"]  # Input order, not completion order.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Fetch independent customer summaries concurrently.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def summary(customer): await asyncio.sleep(0); return {"id": customer}
async def main():
    results = await asyncio.gather(*(summary(c) for c in ("c1", "c2")))
    print(results)  # Expected: [{"id": "c1"}, {"id": "c2"}]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A gather call is mistaken for a guarantee that siblings stop after one fails. Reproduce and choose the intended policy.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def fail(): raise ValueError("bad")
async def main():
    sibling = asyncio.create_task(asyncio.sleep(.01, result="finished"))
    try: await asyncio.gather(fail(), sibling)
    except ValueError: pass
    print(await sibling)  # Expected: "finished"
    # Choose TaskGroup instead if sibling cancellation on failure is required.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** How do gather and TaskGroup differ in failure handling?

**Explain in your own words:** Explain waiting for multiple tasks in your own words. Use a concrete example to show why this is true: gather collects ordered results; structured task groups coordinate lifetimes and failures differently.

<a id="cancellation"></a>

## Task cancellation

Cancellation requests inject cancellation at a suspension point and should normally propagate after cleanup.

**Why it matters:** Shutdown and timeouts depend on cooperative cancellation.

**Prerequisites:** [Creating tasks](week-4.md#tasks), [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Intermediate · **Code concepts:** Task.cancel, CancelledError, finally

[Task cancellation](https://docs.python.org/3/library/asyncio-task.html#task-cancellation) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#creating-tasks)

**Read for:** Read cleanup with try/finally and why CancelledError normally needs to propagate.

### Learn with an example

The initial sleep lets the worker enter its try block. Cancellation interrupts its awaited sleep, runs finally and propagates to the caller awaiting the task. Cleanup and cancellation observation are separate responsibilities.

**Worked example** - Browser-compatible Python

```python
import asyncio
async def worker():
    try:
        await asyncio.sleep(10)
    finally:
        print("cleanup")
task = asyncio.create_task(worker())
await asyncio.sleep(0)
task.cancel()
try:
    await task
except asyncio.CancelledError:
    print("cancelled")
```

**Expected output**

```text
cleanup
cancelled
```

**Watch out for:** Suppressing CancelledError can break timeouts and shutdown.

**Change one thing:** Cancel before the worker starts and explain why entry-dependent cleanup may differ.

### Simple exercise 1

Cancel a sleeping task and confirm cleanup runs.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def work(started, trace):
    try: started.set(); await asyncio.sleep(100)
    finally: trace.append("cleanup")
async def main():
    started = asyncio.Event(); trace = []
    task = asyncio.create_task(work(started, trace)); await started.wait(); task.cancel()
    try: await task
    except asyncio.CancelledError: pass
    print(trace)  # Expected: ["cleanup"]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Request cancellation after a task has finished and inspect the outcome.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    task = asyncio.create_task(asyncio.sleep(0, result=1)); await task
    print(task.cancel() is False and task.result() == 1)  # Expected: True

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Stop an uploader gracefully when its request is abandoned.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def upload():
    try: await asyncio.sleep(100)
    finally: print("release uploader resources")
async def main():
    task = asyncio.create_task(upload()); await asyncio.sleep(0); task.cancel()
    try: await task
    except asyncio.CancelledError: print("request abandoned")

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A handler suppresses CancelledError and continues indefinitely. Restore cancellation propagation.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def work():
    try: await asyncio.sleep(100)
    except asyncio.CancelledError:
        print("cleanup, then propagate")
        raise
async def main():
    task = asyncio.create_task(work()); await asyncio.sleep(0); task.cancel()
    try: await task
    except asyncio.CancelledError: pass
    print(task.cancelled())  # Expected: True

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** Why is cancellation a request rather than an immediate thread kill?

**Explain in your own words:** Explain task cancellation in your own words. Use a concrete example to show why this is true: Cancellation requests inject cancellation at a suspension point and should normally propagate after cleanup.

<a id="timeouts"></a>

## Timeouts and deadlines

A timeout bounds waiting and commonly interacts with cancellation; a deadline represents a shared time budget.

**Why it matters:** Unbounded waits exhaust service capacity.

**Prerequisites:** [Task cancellation](week-4.md#cancellation)

**Difficulty:** Intermediate · **Code concepts:** asyncio.timeout, wait_for, TimeoutError

[Timeouts](https://docs.python.org/3/library/asyncio-task.html#timeouts) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#task-cancellation)

**Read for:** Compare timeout, timeout_at and wait_for; identify where TimeoutError is caught.

### Learn with an example

The timeout context bounds the awaited operation and translates its timeout-triggered cancellation into TimeoutError outside the context. The handler belongs outside that boundary.

**Worked example** - Browser-compatible Python

```python
import asyncio
try:
    async with asyncio.timeout(0.01):
        await asyncio.sleep(1)
except TimeoutError:
    print("deadline reached")
```

**Expected output**

```text
deadline reached
```

**Watch out for:** Giving each retry a fresh timeout can exceed the request's total budget.

**Change one thing:** Use timeout_at with one shared deadline around two sequential operations.

### Simple exercise 1

Bound a deliberately slow coroutine with a timeout.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    try:
        async with asyncio.timeout(.01): await asyncio.sleep(1)
    except TimeoutError: print("bounded operation")

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Compare a completed operation with one exceeding the same timeout and inspect the exception boundary.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    for delay in (0, .1):
        try:
            async with asyncio.timeout(.01): await asyncio.sleep(delay)
        except TimeoutError: print(delay)  # Expected: .1
        else: print(delay)  # Expected: 0

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Share an end-to-end deadline across successive API calls.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    deadline = asyncio.get_running_loop().time() + .1
    async with asyncio.timeout_at(deadline):
        await asyncio.sleep(.01)  # First API call.
        await asyncio.sleep(.01)  # Second shares the same deadline.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

Each retry receives the full original timeout and total latency explodes. Track the remaining budget.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    deadline = asyncio.get_running_loop().time() + .03
    try:
        async with asyncio.timeout_at(deadline):
            for _ in range(3):
                await asyncio.sleep(.02)  # Budget is not renewed per attempt.
    except TimeoutError: print("end-to-end deadline enforced")

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** How does a total deadline differ from a timeout per attempt?

**Explain in your own words:** Explain timeouts and deadlines in your own words. Use a concrete example to show why this is true: A timeout bounds waiting and commonly interacts with cancellation; a deadline represents a shared time budget.

<a id="async-errors"></a>

## Async exception propagation

Exceptions become observable when results are awaited or managed by a task owner.

**Why it matters:** Unobserved task failures can silently lose work.

**Prerequisites:** [Waiting for multiple tasks](week-4.md#gather), [Task cancellation](week-4.md#cancellation)

**Difficulty:** Intermediate · **Code concepts:** task.result, exception, ExceptionGroup

[Task groups](https://docs.python.org/3/library/asyncio-task.html#task-groups) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#asyncio.gather)

**Read for:** Trace child failure, sibling cancellation and the resulting exception group.

### Learn with an example

The task group owns the child lifetime and reports its failure when leaving the group. except* handles matching members of an exception group. Real groups can contain failures from more than one child.

**Worked example** - Browser-compatible Python

```python
import asyncio
async def fail():
    raise ValueError("invalid record")
try:
    async with asyncio.TaskGroup() as group:
        group.create_task(fail())
except* ValueError:
    print("child failure observed")
```

**Expected output**

```text
child failure observed
```

**Watch out for:** Reading only one task result can leave sibling failures unobserved.

**Change one thing:** Add a second failing task and inspect the exception group's contents.

### Simple exercise 1

Raise in a child task and observe the awaiting caller.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def child(): raise ValueError("child failed")
async def main():
    try: await asyncio.create_task(child())
    except ValueError as error: print(str(error))  # Expected: "child failed"

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Raise in two tasks inside a TaskGroup and inspect the resulting grouped failure behavior.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def fail(message): raise ValueError(message)
async def main():
    try:
        async with asyncio.TaskGroup() as group:
            group.create_task(fail("a")); group.create_task(fail("b"))
    except* ValueError as group_error:
        print(len(group_error.exceptions))  # Expected: 2

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Choose fail-fast or partial-results behavior for a batch uploader.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def upload(n):
    if n == 2: raise ValueError("invalid record")
    return n
async def main():
    results = await asyncio.gather(*(upload(n) for n in (1, 2)), return_exceptions=True)
    print(results[0] == 1 and isinstance(results[1], ValueError))  # Expected: True
    # Explicit partial-results policy; report failures alongside successes.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A task fails but no code awaits it, so business logic reports success. Attach result ownership.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def fail(): raise RuntimeError("failed upload")
async def main():
    try:
        async with asyncio.TaskGroup() as group: group.create_task(fail())
    except* RuntimeError: print("batch failed; do not report success")

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** Where does a task exception surface?

**Explain in your own words:** Explain async exception propagation in your own words. Use a concrete example to show why this is true: Exceptions become observable when results are awaited or managed by a task owner.

<a id="queues"></a>

## Async queues and backpressure

An async queue coordinates producers and consumers; a size bound limits queued work.

**Why it matters:** Backpressure prevents producers from overwhelming memory or downstream systems.

**Prerequisites:** [Creating tasks](week-4.md#tasks), [Async exception propagation](week-4.md#async-errors)

**Difficulty:** Intermediate · **Code concepts:** asyncio.Queue, put, get, task_done, join

[asyncio.Queue](https://docs.python.org/3/library/asyncio-queue.html#asyncio.Queue) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#creating-tasks)

**Read for:** Read maxsize, task_done and join together; queue removal is not task completion.

### Learn with an example

get removes an item but does not mark its work complete. task_done updates the unfinished-work count; join waits for that accounting to reach zero. A bound on queued items applies backpressure to producers.

**Worked example** - Browser-compatible Python

```python
import asyncio
queue = asyncio.Queue(maxsize=1)
await queue.put("job")
item = await queue.get()
try:
    print(item)
finally:
    queue.task_done()
await queue.join()
print("drained")
```

**Expected output**

```text
job
drained
```

**Watch out for:** Missing task_done on an error path can make join wait forever.

**Change one thing:** Use a consumer that raises and keep task_done in finally.

### Simple exercise 1

Connect one producer and consumer through a bounded queue.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    queue = asyncio.Queue(maxsize=1)
    async def producer(): await queue.put(1)
    async def consumer():
        value = await queue.get()
        try: assert value == 1
        finally: queue.task_done()
    await asyncio.gather(producer(), consumer()); await queue.join()

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Fill a size-one queue and show that a second producer waits until a consumer removes an item.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    queue = asyncio.Queue(maxsize=1); await queue.put(1)
    pending = asyncio.create_task(queue.put(2)); await asyncio.sleep(0)
    print(not pending.done())  # Expected: True
    print(await queue.get()); queue.task_done()
    await pending; print(await queue.get()); queue.task_done(); await queue.join()

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Build a bounded ingestion worker pipeline.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def worker(queue, results):
    while True:
        item = await queue.get()
        try:
            if item is None: return
            results.append(item * 2)
        finally: queue.task_done()
async def main():
    queue = asyncio.Queue(maxsize=2); results = []
    async with asyncio.TaskGroup() as group:
        group.create_task(worker(queue, results))
        for item in (1, 2, None): await queue.put(item)
        await queue.join()
    print(results)  # Expected: [2, 4]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

join never finishes because task_done is missing on an error path. Repair accounting in finally.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    queue = asyncio.Queue(); await queue.put("bad")
    item = await queue.get()
    try: int(item)
    except ValueError: print("record rejected")
    finally: queue.task_done()  # Exactly once for every successful get.
    async with asyncio.timeout(.1): await queue.join()

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** Why does a bounded queue improve stability?

**Explain in your own words:** Explain async queues and backpressure in your own words. Use a concrete example to show why this is true: An async queue coordinates producers and consumers; a size bound limits queued work.

<a id="locks"></a>

## Async locks and critical sections

An asyncio lock protects shared state across coroutine suspension points within its event loop.

**Why it matters:** Race conditions can exist without multiple OS threads.

**Prerequisites:** [What does await actually do?](week-4.md#await), [Creating tasks](week-4.md#tasks)

**Difficulty:** Intermediate · **Code concepts:** asyncio.Lock, async with

[asyncio.Lock](https://docs.python.org/3/library/asyncio-sync.html#asyncio.Lock) · [Additional reading](https://docs.python.org/3/reference/expressions.html#await-expression)

**Read for:** Find async with and the lock acquisition semantics for cooperating tasks.

### Learn with an example

Both tasks use the same lock around the complete read-modify-write sequence. The await would permit interleaving, but the lock keeps the second task out of this critical section until release.

**Worked example** - Browser-compatible Python

```python
import asyncio
lock = asyncio.Lock()
state = {"count": 0}
async def increment():
    async with lock:
        before = state["count"]
        await asyncio.sleep(0)
        state["count"] = before + 1
await asyncio.gather(increment(), increment())
print(state["count"])
```

**Expected output**

```text
2
```

**Watch out for:** A separate lock created inside each call protects nothing shared.

**Change one thing:** Remove the lock and explain why both tasks can write 1.

### Simple exercise 1

Create and fix a lost update with an await between read and write.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    state = {"n": 0}; lock = asyncio.Lock()
    async def increment(protect):
        if protect:
            async with lock:
                old = state["n"]; await asyncio.sleep(0); state["n"] = old + 1
        else:
            old = state["n"]; await asyncio.sleep(0); state["n"] = old + 1
    await asyncio.gather(increment(False), increment(False)); print(state['n'])  # Expected: 1
    state["n"] = 0
    await asyncio.gather(increment(True), increment(True)); print(state['n'])  # Expected: 2

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Add an exception inside async with lock and prove another task can acquire the released lock.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    lock = asyncio.Lock()
    try:
        async with lock: raise ValueError("fail")
    except ValueError: pass
    async with asyncio.timeout(.1):
        async with lock: print(lock.locked())  # Expected: True

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Protect a shared in-memory quota update.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    remaining = 1; lock = asyncio.Lock()
    async def reserve():
        nonlocal remaining
        async with lock:
            if remaining == 0: return False
            remaining -= 1; return True
    print(sorted(await asyncio.gather(reserve(), reserve())))  # Expected: [False, True]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A function reacquires the same non-reentrant lock and hangs. Redesign lock ownership.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    lock = asyncio.Lock(); state = []
    def update_locked(): state.append(1)  # Does not reacquire the lock.
    async with lock: update_locked()
    print(state)  # Expected: [1]
    # One layer owns locking. asyncio.Lock is not reentrant.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** When can two coroutines race on a single thread?

**Explain in your own words:** Explain async locks and critical sections in your own words. Use a concrete example to show why this is true: An asyncio lock protects shared state across coroutine suspension points within its event loop.

<a id="semaphores"></a>

## Semaphores and concurrency limits

A semaphore limits how many tasks may enter a region simultaneously.

**Why it matters:** Concurrency control protects scarce connections and downstream APIs.

**Prerequisites:** [Creating tasks](week-4.md#tasks), [Async locks and critical sections](week-4.md#locks)

**Difficulty:** Intermediate · **Code concepts:** asyncio.Semaphore, async with

[asyncio.Semaphore](https://docs.python.org/3/library/asyncio-sync.html#asyncio.Semaphore) · [Additional reading](https://docs.python.org/3/library/asyncio-task.html#creating-tasks)

**Read for:** Trace the shared counter and distinguish concurrent occupancy from requests per second.

### Learn with an example

The shared semaphore admits at most two workers into the guarded region. Other workers wait for a release. It limits occupancy, not how many requests may occur over a minute.

**Worked example** - Browser-compatible Python

```python
import asyncio
limit = asyncio.Semaphore(2)
async def work(number):
    async with limit:
        await asyncio.sleep(0)
        return number
print(await asyncio.gather(*(work(n) for n in range(4))))
```

**Expected output**

```text
[0, 1, 2, 3]
```

**Watch out for:** Creating the semaphore inside work gives each task its own unrelated limit.

**Change one thing:** Count active workers inside the region and record the maximum.

### Simple exercise 1

Record the maximum number of active workers under a limit of three.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    semaphore = asyncio.Semaphore(3); active = peak = 0
    async def worker():
        nonlocal active, peak
        async with semaphore:
            active += 1; peak = max(peak, active)
            try: await asyncio.sleep(.001)
            finally: active -= 1
    await asyncio.gather(*(worker() for _ in range(10)))
    print(peak, active)  # Expected values: 3; 0

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Raise inside the limited region and verify the semaphore permit is returned.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def main():
    semaphore = asyncio.Semaphore(1)
    try:
        async with semaphore: raise ValueError("fail")
    except ValueError: pass
    async with asyncio.timeout(.1):
        async with semaphore: pass  # Permit was returned.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Bound concurrent customer API calls.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def fetch(customer, semaphore):
    async with semaphore:
        async with asyncio.timeout(5):
            await asyncio.sleep(0); return {"id": customer}
async def main():
    semaphore = asyncio.Semaphore(3)
    print(len(await asyncio.gather(*(fetch(str(n), semaphore) for n in range(8)))))  # Expected: 8

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

A semaphore is created inside each worker, so nothing is limited. Share the controlling instance.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def worker(semaphore):
    async with semaphore: await asyncio.sleep(.001)
async def main():
    semaphore = asyncio.Semaphore(3)  # One instance for the entire group.
    await asyncio.gather(*(worker(semaphore) for _ in range(10)))
    # Creating Semaphore(3) inside worker would create ten independent limits.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** How does a semaphore differ from a requests-per-second rate limiter?

**Explain in your own words:** Explain semaphores and concurrency limits in your own words. Use a concrete example to show why this is true: A semaphore limits how many tasks may enter a region simultaneously.

<a id="async-context"></a>

## Async context managers

Async context managers allow acquisition and cleanup themselves to await.

**Why it matters:** Network sessions and transactions often need asynchronous teardown.

**Prerequisites:** [Context managers and exception-aware cleanup](week-2.md#context-managers), [What does await actually do?](week-4.md#await)

**Difficulty:** Intermediate · **Code concepts:** __aenter__, __aexit__, async with

[Asynchronous context managers](https://docs.python.org/3/reference/datamodel.html#asynchronous-context-managers) · [Additional reading](https://docs.python.org/3/reference/compound_stmts.html#the-with-statement)

**Read for:** Follow awaited __aenter__ and __aexit__ around an async with block.

### Learn with an example

An asynchronous context manager permits acquisition or cleanup to await. The resource's owner surrounds the whole usage block, including exceptional exits. The yielded value is what the caller receives.

**Worked example** - Browser-compatible Python

```python
from contextlib import asynccontextmanager
import asyncio
@asynccontextmanager
async def connection():
    print("open")
    try:
        yield "client"
    finally:
        await asyncio.sleep(0)
        print("closed")
async with connection() as client:
    print(client)
```

**Expected output**

```text
open
client
closed
```

**Watch out for:** Using with instead of async with selects the wrong protocol.

**Change one thing:** Raise inside the body and verify that asynchronous cleanup still completes.

### Simple exercise 1

Implement a context manager with awaited cleanup.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
class Client:
    async def __aenter__(self): self.closed = False; return self
    async def __aexit__(self, *exc): await asyncio.sleep(0); self.closed = True
async def main():
    async with Client() as client: print(not client.closed)  # Expected: True
    print(client.closed)  # Expected: True

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Raise inside an async with block and record the exception received by __aexit__.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
class Scope:
    async def __aenter__(self): return self
    async def __aexit__(self, kind, value, traceback):
        assert kind is ValueError and str(value) == "bad"; return False
async def main():
    try:
        async with Scope(): raise ValueError("bad")
    except ValueError: pass

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Own an async client over a batch of requests.

<details>
<summary>Reveal reference solution</summary>

```python
# Requires httpx; async client belongs to the whole batch.
import httpx
async def fetch_all(urls):
    async with httpx.AsyncClient(timeout=5) as client:
        results = []
        for url in urls:
            response = await client.get(url); response.raise_for_status(); results.append(response.json())
        return results
```

</details>

### Debugging exercise

Synchronous with is used on an async context manager. Correct the protocol and verify teardown.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
from contextlib import asynccontextmanager
@asynccontextmanager
async def resource():
    try: yield "ready"
    finally: await asyncio.sleep(0)
async def main():
    async with resource() as value: print(value)  # Expected: "ready"
    # 'with resource()' selects the wrong, synchronous protocol.

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** Why can't every async resource use a synchronous context manager?

**Explain in your own words:** Explain async context managers in your own words. Use a concrete example to show why this is true: Async context managers allow acquisition and cleanup themselves to await.

<a id="async-iterators"></a>

## Async iterators

Async iteration awaits successive values from an asynchronous iterator.

**Why it matters:** Network-backed streams can expose natural pull-based consumption.

**Prerequisites:** [Iterators and StopIteration](week-2.md#iterators), [Generator functions and yield](week-2.md#generators), [What does await actually do?](week-4.md#await)

**Difficulty:** Intermediate · **Code concepts:** __aiter__, __anext__, StopAsyncIteration, async for

[Asynchronous iterators](https://docs.python.org/3/reference/datamodel.html#asynchronous-iterators) · [Additional reading](https://docs.python.org/3/library/stdtypes.html#iterator.__next__)

**Read for:** Read __aiter__, __anext__ and StopAsyncIteration as separate protocol responsibilities.

### Learn with an example

The async generator can wait before providing each item. async for requests the next item through the asynchronous iteration protocol and awaits it. It ends on StopAsyncIteration.

**Worked example** - Browser-compatible Python

```python
import asyncio
async def rows():
    for number in range(2):
        await asyncio.sleep(0)
        yield number
async for row in rows():
    print(row)
```

**Expected output**

```text
0
1
```

**Watch out for:** An async iterator is not consumed by an ordinary for loop.

**Change one thing:** Try list(rows()) and explain why an async comprehension is needed instead.

### Simple exercise 1

Consume an async generator yielding delayed events.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def events():
    for n in range(3): await asyncio.sleep(0); yield n
async def main(): print([n async for n in events()])  # Expected: [0, 1, 2]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Exhaust an async iterator and verify that StopAsyncIteration ends the loop.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def events(): yield 1
async def main():
    iterator = events(); print(await anext(iterator))  # Expected: 1
    try: await anext(iterator)
    except StopAsyncIteration: pass
    print([x async for x in iterator])  # Expected: []

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Stream pages from an async API into the analyzer.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def pages(fetch):
    cursor = None
    while True:
        page = await fetch(cursor)
        for item in page["items"]: yield item
        cursor = page["next"]
        if cursor is None: break
async def main():
    async def fake(cursor): return {"items": [1], "next": None}
    print([x async for x in pages(fake)])  # Expected: [1]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

__aiter__ returns an unsuitable coroutine instead of an async iterator. Repair the protocol.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
class Values:
    def __init__(self): self.done = False
    def __aiter__(self): return self  # Regular def, returning async iterator.
    async def __anext__(self):
        if self.done: raise StopAsyncIteration
        self.done = True; return 1
async def main(): print([x async for x in Values()])  # Expected: [1]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

**Interview question:** What does async for await on each iteration?

**Explain in your own words:** Explain async iterators in your own words. Use a concrete example to show why this is true: Async iteration awaits successive values from an asynchronous iterator.

<a id="blocking"></a>

## Blocking code inside async functions

Synchronous blocking work still blocks the loop when executed inside async def.

**Why it matters:** An async signature alone provides no concurrency benefit.

**Prerequisites:** [The asyncio event loop](week-4.md#event-loop)

**Difficulty:** Intermediate · **Code concepts:** time.sleep, blocking I/O, event-loop latency

[Running blocking code](https://docs.python.org/3/library/asyncio-dev.html#running-blocking-code) · [Additional reading](https://docs.python.org/3/library/asyncio-eventloop.html#running-and-stopping-the-loop)

**Read for:** Find why synchronous CPU work delays all tasks on the event-loop thread.

### Learn with an example

The synchronous sum contains no suspension point, so other tasks cannot run on this loop thread while it executes. async def changes the calling protocol; it does not make every operation nonblocking.

**Worked example** - Browser-compatible Python

```python
import asyncio
events = []
async def compute():
    events.append("start")
    sum(range(10000))
    events.append("end")
await compute()
print(events)
```

**Expected output**

```text
['start', 'end']
```

**Watch out for:** Putting a blocking library call inside async def does not make that call asynchronous.

**Change one thing:** Replace the calculation with a real blocking I/O call in a local experiment and compare using to_thread.

### Simple exercise 1

Compare time.sleep with asyncio.sleep while a heartbeat runs.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
import time
async def main():
    async def heartbeat():
        start = time.perf_counter(); await asyncio.sleep(.01); return time.perf_counter() - start
    beat = asyncio.create_task(heartbeat()); await asyncio.sleep(0)
    time.sleep(.05); print("blocked delay", await beat)
    beat = asyncio.create_task(heartbeat()); await asyncio.sleep(.05)
    print("cooperative delay", await beat)

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Add a periodic heartbeat and measure its delay while a CPU loop runs on the event-loop thread.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
import time
async def main():
    async def beat():
        start = time.perf_counter(); await asyncio.sleep(.01); return time.perf_counter() - start
    task = asyncio.create_task(beat()); await asyncio.sleep(0)
    end = time.perf_counter() + .05
    while time.perf_counter() < end: pass
    print("heartbeat latency", await task)

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Measure the effect of a blocking file/API operation in a handler.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
import time
def blocking_read(): time.sleep(.05); return "data"
async def main():
    start = time.perf_counter()
    task = asyncio.create_task(asyncio.to_thread(blocking_read))
    await asyncio.sleep(.01)
    print("loop resumed after", time.perf_counter() - start)
    print(await task)  # Expected: "data"

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

An async endpoint calls a synchronous HTTP client and freezes other requests. Move or replace the blocking call.

<details>
<summary>Reveal reference solution</summary>

```python
import httpx
async def endpoint(url):
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
# Replace synchronous requests.get in the loop, or await asyncio.to_thread
# with bounded concurrency and an underlying blocking-client timeout.
```

</details>

**Interview question:** Does placing blocking code in async def make it nonblocking?

**Explain in your own words:** Explain blocking code inside async functions in your own words. Use a concrete example to show why this is true: Synchronous blocking work still blocks the loop when executed inside async def.

<a id="async-threads"></a>

## Threads with async code

Thread offloading can keep blocking I/O away from the loop, with explicit thread-safety constraints.

**Why it matters:** Legacy synchronous integrations need a controlled adapter.

**Prerequisites:** [Blocking code inside async functions](week-4.md#blocking), [Task cancellation](week-4.md#cancellation)

**Difficulty:** Intermediate · **Code concepts:** asyncio.to_thread, executor, thread safety

[asyncio.to_thread](https://docs.python.org/3/library/asyncio-task.html#asyncio.to_thread) · [Additional reading](https://docs.python.org/3/library/asyncio-dev.html#running-blocking-code)

**Read for:** Read its I/O use case and cancellation limitations; a cancelled await does not forcibly stop a thread.

### Learn with an example

to_thread runs the synchronous function in a thread while the coroutine awaits its result. This is useful for blocking I/O in local Python. Browser Python does not provide an ordinary native thread pool.

**Worked example** - Run in local Python

```python
import asyncio
def blocking_read():
    return "file contents"
result = await asyncio.to_thread(blocking_read)
print(result)
```

**Expected output**

```text
file contents
```

**Watch out for:** Cancelling the await does not forcibly terminate arbitrary synchronous work already running in the thread.

**Change one thing:** Make the function raise and observe the exception at the awaiting call.

### Simple exercise 1

Offload a blocking read while a heartbeat remains responsive.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
import time
def read(): time.sleep(.03); return "data"
async def main():
    task = asyncio.create_task(asyncio.to_thread(read))
    await asyncio.sleep(.001); print("heartbeat")
    print(await task)  # Expected: "data"

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Simple exercise 2

Pass arguments into to_thread and verify that its result returns to the awaiting coroutine.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
def add(a, b, *, offset=0): return a + b + offset
async def main(): print(await asyncio.to_thread(add, 1, 2, offset=3))  # Expected: 6

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Practical exercise

Wrap a legacy SDK call in a bounded async adapter.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def legacy_adapter(function, inputs, limit=3):
    semaphore = asyncio.Semaphore(limit)
    async def call(value):
        async with semaphore: return await asyncio.to_thread(function, value)
    return await asyncio.gather(*(call(value) for value in inputs))
async def main(): print(await legacy_adapter(str, [1, 2]))  # Expected: ["1", "2"]

if __name__ == "__main__":
    asyncio.run(main())
```

</details>

### Debugging exercise

Cancelling the awaiting task is assumed to stop a running thread. Design around the continuing operation.

<details>
<summary>Reveal reference solution</summary>

```python
# Cancelling to_thread's await does not terminate the OS thread.
# Give the SDK its own timeout and make writes idempotent by request key.
# Keep the worker lifetime/capacity owned by a dedicated bounded executor.
import threading
def cooperative_work(stop: threading.Event):
    while not stop.wait(.01):
        pass  # Bounded unit of work; real calls also need their own timeout.
stop = threading.Event(); thread = threading.Thread(target=cooperative_work, args=(stop,))
thread.start(); stop.set(); thread.join()
```

</details>

**Interview question:** What does cancellation of to_thread not guarantee?

**Explain in your own words:** Explain threads with async code in your own words. Use a concrete example to show why this is true: Thread offloading can keep blocking I/O away from the loop, with explicit thread-safety constraints.

<a id="cpu-work"></a>

## CPU-bound work and the GIL

CPU-heavy work needs a separate parallelism decision; behavior depends on interpreter and extension details.

**Why it matters:** Threads used for blocking I/O are not a universal CPU speedup.

**Prerequisites:** [Blocking code inside async functions](week-4.md#blocking), [Threads with async code](week-4.md#async-threads)

**Difficulty:** Intermediate · **Code concepts:** CPU bound, GIL, profiling

[GIL and performance](https://docs.python.org/3/library/threading.html#gil-and-performance-considerations) · [Additional reading](https://docs.python.org/3/library/asyncio-dev.html#running-blocking-code)

**Read for:** Compare conventional CPython with free-threaded builds; do not assume all threading workloads scale.

### Learn with an example

The first line is CPU work. The second reports whether this interpreter was built as free-threaded; False is expected on a conventional build. Choose concurrency based on the actual runtime and workload, not just the word async.

**Worked example** - Browser-compatible Python

```python
import sysconfig
print(sum(n * n for n in range(5)))
print(bool(sysconfig.get_config_var("Py_GIL_DISABLED")))
```

**Expected output**

```text
30
False
```

**Watch out for:** Threads do not automatically accelerate pure-Python CPU work on a conventional GIL build.

**Change one thing:** Inspect the result on a free-threaded build and benchmark rather than assuming a speedup.

### Simple exercise 1

Measure a CPU loop separately from an I/O wait.

<details>
<summary>Reveal reference solution</summary>

```python
import time
start = time.perf_counter(); sum(n*n for n in range(100000))
print("calculation", time.perf_counter() - start)
start = time.perf_counter(); time.sleep(.01)
print("IO-like wait", time.perf_counter() - start)
```

</details>

### Simple exercise 2

Measure wall time and CPU time for a sleep-heavy task and a calculation-heavy task.

<details>
<summary>Reveal reference solution</summary>

```python
import time
for work in (lambda: time.sleep(.02), lambda: sum(n*n for n in range(200000))):
    wall, cpu = time.perf_counter(), time.process_time()
    work(); print("wall", time.perf_counter() - wall, "CPU", time.process_time() - cpu)
```

</details>

### Practical exercise

Profile embedding preprocessing before selecting an execution strategy.

<details>
<summary>Reveal reference solution</summary>

```python
import cProfile
def preprocess(texts): return [text.lower().split() for text in texts]
cProfile.run("preprocess(['An example document'] * 10000)", sort="cumtime")
# Measure realistic batch sizes before choosing processes or a native library.
# Network embedding calls are a separate IO boundary.
```

</details>

### Debugging exercise

Adding many threads makes pure-Python work slower on a GIL-enabled build. Measure and select a better boundary.

<details>
<summary>Reveal reference solution</summary>

```python
from concurrent.futures import ThreadPoolExecutor
from time import perf_counter
def calculate(n): return sum(i*i for i in range(n))
start = perf_counter(); expected = [calculate(100000) for _ in range(4)]
print("serial", perf_counter() - start); start = perf_counter()
with ThreadPoolExecutor(4) as pool: print(list(pool.map(calculate, [100000] * 4)))  # Expected: expected
print("threads", perf_counter() - start)
# On a GIL-enabled build, pure Python threads add overhead without parallel bytecode execution.
```

</details>

**Interview question:** How do concurrency and parallelism differ?

**Explain in your own words:** Explain cpu-bound work and the gil in your own words. Use a concrete example to show why this is true: CPU-heavy work needs a separate parallelism decision; behavior depends on interpreter and extension details.

<a id="processes"></a>

## Process pools and serialization

Processes provide isolated execution and communicate through serializable boundaries.

**Why it matters:** CPU work can run separately from the event loop, but transfer has costs.

**Prerequisites:** [CPU-bound work and the GIL](week-4.md#cpu-work), [Modules, packages, and imports](week-3.md#packages)

**Difficulty:** Intermediate · **Code concepts:** ProcessPoolExecutor, pickle, __main__

[ProcessPoolExecutor](https://docs.python.org/3/library/concurrent.futures.html#processpoolexecutor) · [Additional reading](https://docs.python.org/3/library/threading.html#gil-and-performance-considerations)

**Read for:** Read pickling and importability requirements before moving work to processes.

### Learn with an example

Save this as a local Python file. Child processes import the module and receive serialized inputs; the main guard prevents recursive process creation. A top-level function can be imported by spawned workers.

**Worked example** - Run in local Python

```python
from concurrent.futures import ProcessPoolExecutor
def square(number):
    return number * number
if __name__ == "__main__":
    with ProcessPoolExecutor(max_workers=2) as pool:
        print(list(pool.map(square, [2, 3])))
```

**Expected output**

```text
[4, 9]
```

**Watch out for:** A lambda or local nested function is not a portable process-pool task.

**Change one thing:** Move square inside another function and investigate the serialization error.

### Simple exercise 1

Submit a top-level pure function to a process pool.

<details>
<summary>Reveal reference solution</summary>

```python
from concurrent.futures import ProcessPoolExecutor
def square(n): return n*n
if __name__ == "__main__":
    with ProcessPoolExecutor(2) as pool: print(list(pool.map(square, [2, 3])))  # Expected: [4, 9]
# Save as a .py file; top-level worker is importable by spawned processes.
```

</details>

### Simple exercise 2

Compare transferring a small integer with transferring a large payload to a worker process.

<details>
<summary>Reveal reference solution</summary>

```python
from concurrent.futures import ProcessPoolExecutor
from time import perf_counter
def size(value): return len(value) if isinstance(value, bytes) else value
if __name__ == "__main__":
    with ProcessPoolExecutor(1) as pool:
        pool.submit(size, 1).result()  # Warm the worker.
        for payload in (1, bytes(1000000)):
            start = perf_counter(); result = pool.submit(size, payload).result()
            print(result, perf_counter() - start)
```

</details>

### Practical exercise

Parallelize a CPU-heavy text normalization batch.

<details>
<summary>Reveal reference solution</summary>

```python
from concurrent.futures import ProcessPoolExecutor
def normalize(text): return " ".join(text.lower().split())
if __name__ == "__main__":
    with ProcessPoolExecutor(2) as pool:
        result = list(pool.map(normalize, [" A B ", "C"], chunksize=32))
    print(result)  # Expected: ["a b", "c"]
# Tiny inputs are slower in a pool; measure on representative CPU-heavy batches.
```

</details>

### Debugging exercise

A nested function or unguarded process startup fails on spawn platforms. Move the function and guard entry.

<details>
<summary>Reveal reference solution</summary>

```python
from concurrent.futures import ProcessPoolExecutor
def worker(n): return n + 1  # Module-level, serializable function.
def main():
    with ProcessPoolExecutor(1) as pool: print(pool.submit(worker, 1).result())  # Expected: 2
if __name__ == "__main__": main()  # Prevent recursive startup under spawn.
```

</details>

**Interview question:** What costs can erase a process pool's speedup?

**Explain in your own words:** Explain process pools and serialization in your own words. Use a concrete example to show why this is true: Processes provide isolated execution and communicate through serializable boundaries.

<a id="fastapi-routing"></a>

## FastAPI routing and the request lifecycle

A route connects an HTTP request to validation, dependency resolution, handler execution, and response creation.

**Why it matters:** Tracing the lifecycle identifies where latency and errors originate.

**Prerequisites:** [Applying a decorator](week-2.md#decorators), [The asyncio event loop](week-4.md#event-loop)

**Difficulty:** Intermediate · **Code concepts:** FastAPI, route decorator, ASGI

[Path operations](https://fastapi.tiangolo.com/tutorial/first-steps/#step-3-create-a-path-operation) · [Additional reading](https://docs.python.org/3/reference/compound_stmts.html#function-definitions)

**Read for:** Trace the HTTP method, path registration and the function that produces the response.

### Learn with an example

The decorator registers a GET path; FastAPI extracts the path value and calls hello. TestClient exercises request handling without opening a network port. Run this locally with fastapi and httpx installed.

**Worked example** - Run in local Python - Requires fastapi, httpx

```python
from fastapi import FastAPI
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/hello/{name}")
def hello(name: str):
    return {"hello": name}
with TestClient(app) as client:
    print(client.get("/hello/Ada").json())
```

**Expected output**

```text
{'hello': 'Ada'}
```

**Watch out for:** Defining a function alone does not expose an HTTP route.

**Change one thing:** Send a POST to the same path and inspect the status code.

### Simple exercise 1

Create a GET route and inspect its generated OpenAPI entry.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI
app = FastAPI()
@app.get("/reports")
def reports(): return []
print('get' in app.openapi()['paths']['/reports'])  # Expected: True
```

</details>

### Simple exercise 2

Add a path parameter and inspect the route's path and method in OpenAPI.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI
app = FastAPI()
@app.get("/reports/{report_id}")
def report(report_id: int): return {"id": report_id}
print(app.openapi()['paths']['/reports/{report_id}']['get']['parameters'][0]['in'])  # Expected: "path"
```

</details>

### Practical exercise

Expose the analyzer's latest report through an endpoint.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/reports/latest")
def latest(): return {"id": "r1", "count": 12}
print(TestClient(app).get('/reports/latest').json()['count'])  # Expected: 12
```

</details>

### Debugging exercise

Two conflicting route patterns match unexpectedly. Reorder or disambiguate paths.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI
app = FastAPI()
@app.get("/reports/latest")  # Static route before dynamic catch-all.
def latest(): return {"id": "latest"}
@app.get("/reports/{report_id}")
def report(report_id: str): return {"id": report_id}
# Or use separate namespaces such as /reports/by-id/{report_id}.
```

</details>

**Interview question:** Where would you investigate latency before handler execution?

**Explain in your own words:** Explain fastapi routing and the request lifecycle in your own words. Use a concrete example to show why this is true: A route connects an HTTP request to validation, dependency resolution, handler execution, and response creation.

<a id="fastapi-deps"></a>

## FastAPI dependency injection

Dependencies declare values or resources needed by handlers and can be overridden in tests.

**Why it matters:** Explicit dependencies simplify ownership and test isolation.

**Prerequisites:** [FastAPI routing and the request lifecycle](week-4.md#fastapi-routing), [Composition and inheritance](week-2.md#composition)

**Difficulty:** Intermediate · **Code concepts:** Depends, dependency override

[Declaring dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/#declare-the-dependency-in-the-dependant) · [Additional reading](https://fastapi.tiangolo.com/tutorial/first-steps/#step-3-create-a-path-operation)

**Read for:** Follow Depends and parameter injection, then inspect dependency reuse and overrides.

### Learn with an example

Depends asks FastAPI to resolve the collaborator before calling the endpoint. The endpoint receives a value, not the dependency function. Explicit injection creates a place to substitute test collaborators.

**Worked example** - Run in local Python - Requires fastapi, httpx

```python
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
app = FastAPI()
def region():
    return "eu"
@app.get("/region")
def read_region(value: str = Depends(region)):
    return {"region": value}
with TestClient(app) as client:
    print(client.get("/region").json())
```

**Expected output**

```text
{'region': 'eu'}
```

**Watch out for:** Calling region in the default value would evaluate it at definition time instead.

**Change one thing:** Override the region dependency with a function returning test.

### Simple exercise 1

Inject a configuration provider into a route.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI, Depends
app = FastAPI()
def config(): return {"limit": 10}
@app.get("/config")
def settings(value: dict = Depends(config)): return value
```

</details>

### Simple exercise 2

Override a dependency in one endpoint test and then restore the override map.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
app = FastAPI()
def config(): return {"limit": 10}
@app.get("/")
def read(value: dict = Depends(config)): return value
app.dependency_overrides[config] = lambda: {"limit": 1}
try: print(TestClient(app).get('/').json())  # Expected: {"limit": 1}
finally: app.dependency_overrides.clear()
```

</details>

### Practical exercise

Supply a report repository through a dependency.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI, Depends
app = FastAPI()
class Repository:
    def latest(self): return {"id": "r1"}
def repository(): return Repository()
@app.get("/latest")
def latest(repo: Repository = Depends(repository)): return repo.latest()
```

</details>

### Debugging exercise

A route constructs its own repository and ignores the test override. Move creation behind the dependency.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
app = FastAPI()
def repository(): return ["production"]
@app.get("/")
def read(repo: list = Depends(repository)): return repo
app.dependency_overrides[repository] = lambda: ["fake"]
try: print(TestClient(app).get('/').json())  # Expected: ["fake"]
finally: app.dependency_overrides.clear()
```

</details>

**Interview question:** How do dependency overrides improve endpoint tests?

**Explain in your own words:** Explain fastapi dependency injection in your own words. Use a concrete example to show why this is true: Dependencies declare values or resources needed by handlers and can be overridden in tests.

<a id="fastapi-validation"></a>

## FastAPI request validation boundaries

Request annotations and models define input parsing and validation before domain work.

**Why it matters:** Invalid input should fail before side effects occur.

**Prerequisites:** [FastAPI routing and the request lifecycle](week-4.md#fastapi-routing), [Function annotations](week-1.md#annotations)

**Difficulty:** Intermediate · **Code concepts:** request body, query parameter, validation error

[Additional validation](https://fastapi.tiangolo.com/tutorial/query-params-str-validations/#additional-validation) · [Additional reading](https://fastapi.tiangolo.com/tutorial/first-steps/#step-3-create-a-path-operation)

**Read for:** Find Annotated and Query constraints; distinguish rejected requests from handler failures.

### Learn with an example

The request boundary converts and validates the query value before the endpoint runs. Zero violates ge=1 and produces a validation response. Valid input reaches the handler as an integer.

**Worked example** - Run in local Python - Requires fastapi, httpx

```python
from fastapi import FastAPI, Query
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/items")
def items(limit: int = Query(5, ge=1)):
    return {"limit": limit}
with TestClient(app) as client:
    print(client.get("/items?limit=0").status_code)
    print(client.get("/items?limit=2").json())
```

**Expected output**

```text
422
{'limit': 2}
```

**Watch out for:** Validation of shape and range does not check a caller's authorization.

**Change one thing:** Try a nonnumeric limit and compare the error location with the zero case.

### Simple exercise 1

Require a positive integer query parameter.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated
from fastapi import FastAPI, Query
app = FastAPI()
@app.get("/reports")
def reports(limit: Annotated[int, Query(gt=0)]): return {"limit": limit}
```

</details>

### Simple exercise 2

Send a missing and an invalid query parameter and compare validation error locations.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated
from fastapi import FastAPI, Query
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/")
def read(limit: Annotated[int, Query(gt=0)]): return limit
client = TestClient(app)
for path in ("/", "/?limit=bad"):
    response = client.get(path); print(response.status_code)  # Expected: 422
    print(response.json()['detail'][0]['loc'])  # Expected: ["query", "limit"]
```

</details>

### Practical exercise

Reject invalid report limits before querying storage.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated
from fastapi import FastAPI, Query
app = FastAPI()
@app.get("/reports")
def reports(limit: Annotated[int, Query(gt=0, le=100)] = 10):
    return {"records": [], "limit": limit}
# Validation happens before database calls in the handler.
```

</details>

### Debugging exercise

An endpoint manually bypasses request validation then crashes in business logic. Restore a validated boundary.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated
from fastapi import FastAPI, Query
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/")
def read(limit: Annotated[int, Query(gt=0)]): return {"limit": limit}
print(TestClient(app).get('/?limit=-1').status_code)  # Expected: 422
# Use typed parameters instead of reading and trusting request.query_params manually.
```

</details>

**Interview question:** How do request validation errors differ from domain errors?

**Explain in your own words:** Explain fastapi request validation boundaries in your own words. Use a concrete example to show why this is true: Request annotations and models define input parsing and validation before domain work.

<a id="fastapi-middleware"></a>

## Middleware and exception handlers

Middleware wraps request processing; exception handlers translate known failures to HTTP responses.

**Why it matters:** Cross-cutting behavior should preserve clear error semantics.

**Prerequisites:** [FastAPI routing and the request lifecycle](week-4.md#fastapi-routing), [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Intermediate · **Code concepts:** middleware, HTTPException, exception_handler

[Custom exception handlers](https://fastapi.tiangolo.com/tutorial/handling-errors/#install-custom-exception-handlers) · [Additional reading](https://fastapi.tiangolo.com/tutorial/first-steps/#step-3-create-a-path-operation)

**Read for:** Find how an application exception becomes an HTTP response; compare middleware wrapping all requests.

### Learn with an example

A deliberate application failure becomes an HTTP response through exception handling. Middleware wraps the broader request/response path; it is a different extension point from a specific exception handler.

**Worked example** - Run in local Python - Requires fastapi, httpx

```python
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/missing")
def missing():
    raise HTTPException(status_code=404, detail="not found")
with TestClient(app) as client:
    response = client.get("/missing")
    print(response.status_code, response.json()["detail"])
```

**Expected output**

```text
404 not found
```

**Watch out for:** Converting every exception to a 200 response hides failures from callers and monitoring.

**Change one thing:** Add middleware that attaches a request ID to both successful and error responses.

### Simple exercise 1

Add a request ID to each response.

<details>
<summary>Reveal reference solution</summary>

```python
from uuid import uuid4
from fastapi import FastAPI
app = FastAPI()
@app.middleware("http")
async def request_id(request, call_next):
    request.state.request_id = str(uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response
```

</details>

### Simple exercise 2

Raise a known domain error and verify the response status and structured error body.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
app = FastAPI()
class MissingReport(Exception): pass
@app.exception_handler(MissingReport)
async def missing(request, error): return JSONResponse(status_code=404, content={"error": "report_not_found"})
@app.get("/")
def report(): raise MissingReport()
response = TestClient(app).get("/")
print(response.status_code, response.json())  # Expected values: 404; {'error': 'report_not_found'}
```

</details>

### Practical exercise

Translate a missing report into a consistent 404 body.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI, HTTPException
app = FastAPI(); reports = {}
@app.get("/reports/{report_id}")
def report(report_id: str):
    if report_id not in reports: raise HTTPException(404, detail={"code": "report_not_found"})
    return reports[report_id]
```

</details>

### Debugging exercise

A middleware catches every error and returns HTTP 200. Preserve failure status and diagnostic context.

<details>
<summary>Reveal reference solution</summary>

```python
import logging
from fastapi import FastAPI
app = FastAPI(); logger = logging.getLogger(__name__)
@app.middleware("http")
async def observe(request, call_next):
    try: return await call_next(request)
    except Exception:
        logger.exception("request failed")  # Keep diagnostics server-side.
        raise  # Preserve a failure response; do not return HTTP 200.
```

</details>

**Interview question:** What belongs in middleware rather than a route helper?

**Explain in your own words:** Explain middleware and exception handlers in your own words. Use a concrete example to show why this is true: Middleware wraps request processing; exception handlers translate known failures to HTTP responses.

<a id="fastapi-resources"></a>

## FastAPI lifespan and resource ownership

Application lifespan manages resources shared across requests; request-scoped resources need separate ownership.

**Why it matters:** Incorrect lifetimes leak connections or close resources too soon.

**Prerequisites:** [FastAPI dependency injection](week-4.md#fastapi-deps), [Async context managers](week-4.md#async-context)

**Difficulty:** Intermediate · **Code concepts:** lifespan, asynccontextmanager, client pool

[Lifespan](https://fastapi.tiangolo.com/advanced/events/#lifespan) · [Additional reading](https://fastapi.tiangolo.com/tutorial/dependencies/#declare-the-dependency-in-the-dependant)

**Read for:** Trace resource acquisition before yield and cleanup afterward.

### Learn with an example

Entering TestClient as a context runs startup before requests are served and shutdown on exit. A real application would acquire its shared client or pool before yield and release it afterward.

**Worked example** - Run in local Python - Requires fastapi, httpx

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.testclient import TestClient
@asynccontextmanager
async def lifespan(app):
    print("startup")
    yield
    print("shutdown")
app = FastAPI(lifespan=lifespan)
with TestClient(app):
    print("serving")
```

**Expected output**

```text
startup
serving
shutdown
```

**Watch out for:** Creating a new connection pool on every request wastes resources and complicates cleanup.

**Change one thing:** Store a fake client on app.state during startup and read it from a route.

### Simple exercise 1

Create and close a shared client in lifespan.

<details>
<summary>Reveal reference solution</summary>

```python
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
@asynccontextmanager
async def lifespan(app):
    async with httpx.AsyncClient(timeout=5) as client:
        app.state.client = client; yield
app = FastAPI(lifespan=lifespan)
```

</details>

### Simple exercise 2

Count resource startup and shutdown events during one application's lifespan.

<details>
<summary>Reveal reference solution</summary>

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.testclient import TestClient
events = []
@asynccontextmanager
async def lifespan(app):
    events.append("start")
    try: yield
    finally: events.append("stop")
app = FastAPI(lifespan=lifespan)
with TestClient(app): print(events)  # Expected: ["start"]
print(events)  # Expected: ["start", "stop"]
```

</details>

### Practical exercise

Reuse a connection pool across analyzer requests.

<details>
<summary>Reveal reference solution</summary>

```python
# Requires asyncpg and DATABASE_URL for a PostgreSQL database.
import os, asyncpg
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
@asynccontextmanager
async def lifespan(app):
    async with asyncpg.create_pool(os.environ["DATABASE_URL"], min_size=1, max_size=5) as pool:
        app.state.pool = pool; yield
app = FastAPI(lifespan=lifespan)
@app.get("/health")
async def health(request: Request):
    async with request.app.state.pool.acquire() as connection:
        return {"value": await connection.fetchval("SELECT 1")}
```

</details>

### Debugging exercise

A per-request block closes the shared client and later requests fail. Align lifetime with ownership.

<details>
<summary>Reveal reference solution</summary>

```python
# Lifespan owns the pool/client; request handlers only borrow it.
from fastapi import Request
async def query(request: Request):
    async with request.app.state.pool.acquire() as connection:
        return await connection.fetchval("SELECT 1")
# Release this borrowed connection. Never close the shared pool here.
# Test two sequential requests inside one TestClient lifespan.
```

</details>

**Interview question:** Which resources should be application-scoped versus request-scoped?

**Explain in your own words:** Explain fastapi lifespan and resource ownership in your own words. Use a concrete example to show why this is true: Application lifespan manages resources shared across requests; request-scoped resources need separate ownership.

<a id="fastapi-background"></a>

## Background tasks and durable job boundaries

In-process background work runs outside the immediate response but is not inherently crash durable.

**Why it matters:** A successful HTTP response must not imply guaranteed job completion.

**Prerequisites:** [FastAPI lifespan and resource ownership](week-4.md#fastapi-resources), [Async queues and backpressure](week-4.md#queues)

**Difficulty:** Intermediate · **Code concepts:** BackgroundTasks, queue, job ID

[Background-task caveat](https://fastapi.tiangolo.com/tutorial/background-tasks/#caveat) · [Additional reading](https://fastapi.tiangolo.com/advanced/events/#lifespan)

**Read for:** Read when heavier or distributed work needs a job system beyond in-process background tasks.

### Learn with an example

FastAPI schedules this small task after preparing the response; TestClient waits for it to finish. The work still belongs to the same application process, so a process crash can lose it.

**Worked example** - Run in local Python - Requires fastapi, httpx

```python
from fastapi import BackgroundTasks, FastAPI
from fastapi.testclient import TestClient
app = FastAPI()
events = []
@app.post("/notify")
def notify(tasks: BackgroundTasks):
    tasks.add_task(events.append, "sent")
    return {"accepted": True}
with TestClient(app) as client:
    print(client.post("/notify").json())
print(events)
```

**Expected output**

```text
{'accepted': True}
['sent']
```

**Watch out for:** BackgroundTasks does not provide durable delivery or crash recovery.

**Change one thing:** Describe what state a durable queue would need before returning accepted.

### Simple exercise 1

Run a small notification task after returning a response.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI, BackgroundTasks
app = FastAPI(); events = []
def notify(message): events.append(message)
@app.post("/notify")
def enqueue(background: BackgroundTasks):
    background.add_task(notify, "sent"); return {"accepted": True}
# Suitable for best-effort, noncritical work only.
```

</details>

### Simple exercise 2

Verify which work happens before the response and which is scheduled afterward.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI, BackgroundTasks
from fastapi.testclient import TestClient
app = FastAPI(); trace = []
@app.get("/")
def read(background: BackgroundTasks):
    trace.append("handler"); background.add_task(trace.append, "background")
    return {"ok": True}
TestClient(app).get("/")  # TestClient waits for background completion.
print(trace)  # Expected: ["handler", "background"]
```

</details>

### Practical exercise

Return a job identifier for a report generation request.

<details>
<summary>Reveal reference solution</summary>

```python
# Contract sketch: durable_jobs.enqueue commits a unique request ID to storage
# before returning. A separate worker consumes it and records status.
from fastapi import FastAPI, Depends
app = FastAPI()
def jobs(): raise RuntimeError("provide durable job repository")
@app.post("/reports", status_code=202)
def create_report(request_id: str, queue=Depends(jobs)):
    job_id = queue.enqueue(request_id=request_id, kind="report")
    return {"job_id": job_id, "status": "queued"}
```

</details>

### Debugging exercise

A process crashes after responding and the background task is lost. Move critical work to durable execution.

<details>
<summary>Reveal reference solution</summary>

```python
# Recovery design:
# 1. Insert a pending job with a unique logical request ID in durable storage.
# 2. Commit before HTTP 202.
# 3. Worker claims it with a lease; expires abandoned leases after crashes.
# 4. Make external writes idempotent and record completion.
# FastAPI BackgroundTasks alone has no durable recovery guarantee.
job = {"id": "request-1", "status": "pending", "attempts": 0}
print(job['status'])  # Expected: "pending"
```

</details>

**Interview question:** When is an in-process background task insufficient?

**Explain in your own words:** Explain background tasks and durable job boundaries in your own words. Use a concrete example to show why this is true: In-process background work runs outside the immediate response but is not inherently crash durable.

