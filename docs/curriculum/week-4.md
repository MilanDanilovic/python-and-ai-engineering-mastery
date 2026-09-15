# Week 4

[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)

<a id="coroutines"></a>

## What is a coroutine?

An async def function defines a coroutine function whose execution can suspend and resume.

**Why it matters:** Async APIs operate on deferred computations rather than immediate results.

**Prerequisites:** [Defining functions](week-1.md#define), [Generator functions and yield](week-2.md#generators)

**Difficulty:** Intermediate · **Code concepts:** async def, coroutine

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Define an async helper and inspect the type of its call result.

<details>
<summary>Reveal reference solution</summary>

```python
import inspect
async def count(): return 3
result = count()
assert inspect.iscoroutine(result)
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
assert inspect.iscoroutinefunction(count) and inspect.iscoroutine(result)
assert not inspect.iscoroutine(count)
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
async def main(): assert await upload(FakeClient(), [1, 2]) == 2

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
    assert result == 3

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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    trace = []; pending = work(trace); assert trace == []
    await pending; assert trace == ["started"]

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
    assert await a == 1 and await b == 2

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
    assert results == [0, 1, 2]

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
    assert await work() == "done"
    task = asyncio.create_task(work())  # Deliberately scheduled and retained.
    assert await task == "done"

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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert trace == ["before", "after"]

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
    await immediate(); assert trace == []
    await asyncio.sleep(0); await task
    assert trace == ["other"]

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
    assert state["count"] == 2

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
    assert trace == []  # Await did not necessarily suspend.
    await task; assert trace == ["other"]

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

[Official documentation](https://docs.python.org/3/library/asyncio-eventloop.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert trace.index("b start") < trace.index("a end")

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
    assert a is b is asyncio.get_running_loop()

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
async def main(): assert await request() == "response"

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
    assert await child() == 1

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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Schedule two tasks and await both results.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def value(n): return n
async def main():
    a = asyncio.create_task(value(1)); b = asyncio.create_task(value(2))
    assert await a == 1 and await b == 2

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
    assert task.get_name() == "lookup" and not task.done()
    assert await task == 3 and task.done()

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
    assert {key: task.result() for key, task in tasks.items()} == {"name": "NAME", "region": "REGION"}

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
    except ValueError as error: assert str(error) == "lookup failed"
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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert results == ["first", "second"]  # Input order, not completion order.

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
    assert results == [{"id": "c1"}, {"id": "c2"}]

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
    assert await sibling == "finished"
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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert trace == ["cleanup"]

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
    assert task.cancel() is False and task.result() == 1

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
    assert task.cancelled()

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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
        except TimeoutError: assert delay == .1
        else: assert delay == 0

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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Raise in a child task and observe the awaiting caller.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def child(): raise ValueError("child failed")
async def main():
    try: await asyncio.create_task(child())
    except ValueError as error: assert str(error) == "child failed"

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
        assert len(group_error.exceptions) == 2

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
    assert results[0] == 1 and isinstance(results[1], ValueError)
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

[Official documentation](https://docs.python.org/3/library/asyncio-queue.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert not pending.done()
    assert await queue.get() == 1; queue.task_done()
    await pending; assert await queue.get() == 2; queue.task_done(); await queue.join()

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
    assert results == [2, 4]

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

[Official documentation](https://docs.python.org/3/library/asyncio-sync.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    await asyncio.gather(increment(False), increment(False)); assert state["n"] == 1
    state["n"] = 0
    await asyncio.gather(increment(True), increment(True)); assert state["n"] == 2

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
        async with lock: assert lock.locked()

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
    assert sorted(await asyncio.gather(reserve(), reserve())) == [False, True]

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
    assert state == [1]
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

[Official documentation](https://docs.python.org/3/library/asyncio-sync.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert peak == 3 and active == 0

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
    assert len(await asyncio.gather(*(fetch(str(n), semaphore) for n in range(8)))) == 8

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

[Official documentation](https://docs.python.org/3/reference/datamodel.html#asynchronous-context-managers) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    async with Client() as client: assert not client.closed
    assert client.closed

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
    async with resource() as value: assert value == "ready"
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

[Official documentation](https://docs.python.org/3/reference/datamodel.html#asynchronous-iterators) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Consume an async generator yielding delayed events.

<details>
<summary>Reveal reference solution</summary>

```python
import asyncio
async def events():
    for n in range(3): await asyncio.sleep(0); yield n
async def main(): assert [n async for n in events()] == [0, 1, 2]

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
    iterator = events(); assert await anext(iterator) == 1
    try: await anext(iterator)
    except StopAsyncIteration: pass
    assert [x async for x in iterator] == []

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
    assert [x async for x in pages(fake)] == [1]

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
async def main(): assert [x async for x in Values()] == [1]

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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert await task == "data"

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

[Official documentation](https://docs.python.org/3/library/asyncio-task.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    assert await task == "data"

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
async def main(): assert await asyncio.to_thread(add, 1, 2, offset=3) == 6

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
async def main(): assert await legacy_adapter(str, [1, 2]) == ["1", "2"]

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

[Official documentation](https://docs.python.org/3/library/threading.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
with ThreadPoolExecutor(4) as pool: assert list(pool.map(calculate, [100000]*4)) == expected
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

[Official documentation](https://docs.python.org/3/library/concurrent.futures.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Submit a top-level pure function to a process pool.

<details>
<summary>Reveal reference solution</summary>

```python
from concurrent.futures import ProcessPoolExecutor
def square(n): return n*n
if __name__ == "__main__":
    with ProcessPoolExecutor(2) as pool: assert list(pool.map(square, [2, 3])) == [4, 9]
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
    assert result == ["a b", "c"]
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
    with ProcessPoolExecutor(1) as pool: assert pool.submit(worker, 1).result() == 2
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

[Official documentation](https://fastapi.tiangolo.com/tutorial/first-steps/) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Create a GET route and inspect its generated OpenAPI entry.

<details>
<summary>Reveal reference solution</summary>

```python
from fastapi import FastAPI
app = FastAPI()
@app.get("/reports")
def reports(): return []
assert "get" in app.openapi()["paths"]["/reports"]
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
assert app.openapi()["paths"]["/reports/{report_id}"]["get"]["parameters"][0]["in"] == "path"
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
assert TestClient(app).get("/reports/latest").json()["count"] == 12
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

[Official documentation](https://fastapi.tiangolo.com/tutorial/dependencies/) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
try: assert TestClient(app).get("/").json() == {"limit": 1}
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
try: assert TestClient(app).get("/").json() == ["fake"]
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

[Official documentation](https://fastapi.tiangolo.com/tutorial/query-params-str-validations/) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
    response = client.get(path); assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["query", "limit"]
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
assert TestClient(app).get("/?limit=-1").status_code == 422
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

[Official documentation](https://fastapi.tiangolo.com/tutorial/handling-errors/) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
assert response.status_code == 404 and response.json() == {"error": "report_not_found"}
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

[Official documentation](https://fastapi.tiangolo.com/advanced/events/) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
with TestClient(app): assert events == ["start"]
assert events == ["start", "stop"]
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

[Official documentation](https://fastapi.tiangolo.com/tutorial/background-tasks/) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

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
assert trace == ["handler", "background"]
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
assert job["status"] == "pending"
```

</details>

**Interview question:** When is an in-process background task insufficient?

**Explain in your own words:** Explain background tasks and durable job boundaries in your own words. Use a concrete example to show why this is true: In-process background work runs outside the immediate response but is not inherently crash durable.

