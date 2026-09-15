const run = code => `import asyncio\n${code}\n\nif __name__ == "__main__":\n    asyncio.run(main())`;
export default {
coroutines: [
`import inspect
async def count(): return 3
result = count()
assert inspect.iscoroutine(result)
result.close()  # Inspection only; release the unawaited coroutine.`,
`import inspect
async def count(): return 3
result = count()
assert inspect.iscoroutinefunction(count) and inspect.iscoroutine(result)
assert not inspect.iscoroutine(count)
result.close()`,
run(`async def upload(client, records):
    # Local transformation is synchronous; network IO is awaited.
    payload = [str(record) for record in records]
    return await client.send(payload)
class FakeClient:
    async def send(self, payload): return len(payload)
async def main(): assert await upload(FakeClient(), [1, 2]) == 2`),
run(`async def count(): return 3
async def main():
    result = await count()  # count() alone returns a coroutine, not 3.
    assert result == 3`)],
'coroutine-call': [
run(`async def work(trace):
    trace.append("started")
    await asyncio.sleep(0)
async def main():
    trace = []; pending = work(trace); assert trace == []
    await pending; assert trace == ["started"]`),
run(`async def value(n): return n
async def main():
    a, b = value(1), value(2)
    assert await a == 1 and await b == 2`),
run(`async def upload(record): return record["id"]
async def main():
    # Every created coroutine has an owner that awaits it.
    results = await asyncio.gather(*(upload({"id": n}) for n in range(3)))
    assert results == [0, 1, 2]`),
run(`async def work(): return "done"
async def main():
    assert await work() == "done"
    task = asyncio.create_task(work())  # Deliberately scheduled and retained.
    assert await task == "done"`)],
await: [
run(`async def main():
    trace = ["before"]
    await asyncio.sleep(0)
    trace.append("after")
    assert trace == ["before", "after"]`),
run(`async def immediate(): return 1
async def other(trace): trace.append("other")
async def main():
    trace = []; task = asyncio.create_task(other(trace))
    await immediate(); assert trace == []
    await asyncio.sleep(0); await task
    assert trace == ["other"]`),
run(`async def request(state, lock):
    await asyncio.sleep(0)  # IO boundary: other tasks may run.
    async with lock:
        state["count"] += 1  # No suspension inside read-modify-write.
async def main():
    state = {"count": 0}; lock = asyncio.Lock()
    await asyncio.gather(request(state, lock), request(state, lock))
    assert state["count"] == 2`),
run(`async def immediate(): return None
async def main():
    trace = []
    async def other(): trace.append("other")
    task = asyncio.create_task(other())
    for _ in range(10): await immediate()
    assert trace == []  # Await did not necessarily suspend.
    await task; assert trace == ["other"]`)],
'event-loop': [
run(`async def work(name, trace):
    trace.append(name + " start"); await asyncio.sleep(0); trace.append(name + " end")
async def main():
    trace = []; await asyncio.gather(work("a", trace), work("b", trace))
    print(trace)
    assert trace.index("b start") < trace.index("a end")`),
run(`async def loop(): return asyncio.get_running_loop()
async def main():
    a, b = await asyncio.gather(loop(), loop())
    assert a is b is asyncio.get_running_loop()`),
run(`async def request():
    # request -> await socket IO -> loop runs other ready tasks
    # IO ready -> request resumes -> response
    await asyncio.sleep(0.01)  # Fake IO readiness.
    return "response"
async def main(): assert await request() == "response"`),
run(`async def child(): return 1
async def main():
    # Already inside the loop: await child(), never asyncio.run(child()).
    assert await child() == 1`)],
tasks: [
run(`async def value(n): return n
async def main():
    a = asyncio.create_task(value(1)); b = asyncio.create_task(value(2))
    assert await a == 1 and await b == 2`),
run(`async def main():
    task = asyncio.create_task(asyncio.sleep(0.01, result=3), name="lookup")
    assert task.get_name() == "lookup" and not task.done()
    assert await task == 3 and task.done()`),
run(`async def lookup(key): await asyncio.sleep(0); return key.upper()
async def main():
    async with asyncio.TaskGroup() as group:
        tasks = {key: group.create_task(lookup(key)) for key in ("name", "region")}
    assert {key: task.result() for key, task in tasks.items()} == {"name": "NAME", "region": "REGION"}`),
run(`async def fail(): raise ValueError("lookup failed")
async def main():
    task = asyncio.create_task(fail())
    try: await task
    except ValueError as error: assert str(error) == "lookup failed"
    # The request owns and observes completion; no orphan task.`)],
gather: [
run(`from time import perf_counter
async def main():
    start = perf_counter()
    await asyncio.sleep(.02); await asyncio.sleep(.02)
    sequential = perf_counter() - start; start = perf_counter()
    await asyncio.gather(asyncio.sleep(.02), asyncio.sleep(.02))
    print("sequential", sequential, "concurrent", perf_counter() - start)`),
run(`async def main():
    results = await asyncio.gather(asyncio.sleep(.02, result="first"), asyncio.sleep(0, result="second"))
    assert results == ["first", "second"]  # Input order, not completion order.`),
run(`async def summary(customer): await asyncio.sleep(0); return {"id": customer}
async def main():
    results = await asyncio.gather(*(summary(c) for c in ("c1", "c2")))
    assert results == [{"id": "c1"}, {"id": "c2"}]`),
run(`async def fail(): raise ValueError("bad")
async def main():
    sibling = asyncio.create_task(asyncio.sleep(.01, result="finished"))
    try: await asyncio.gather(fail(), sibling)
    except ValueError: pass
    assert await sibling == "finished"
    # Choose TaskGroup instead if sibling cancellation on failure is required.`)],
cancellation: [
run(`async def work(started, trace):
    try: started.set(); await asyncio.sleep(100)
    finally: trace.append("cleanup")
async def main():
    started = asyncio.Event(); trace = []
    task = asyncio.create_task(work(started, trace)); await started.wait(); task.cancel()
    try: await task
    except asyncio.CancelledError: pass
    assert trace == ["cleanup"]`),
run(`async def main():
    task = asyncio.create_task(asyncio.sleep(0, result=1)); await task
    assert task.cancel() is False and task.result() == 1`),
run(`async def upload():
    try: await asyncio.sleep(100)
    finally: print("release uploader resources")
async def main():
    task = asyncio.create_task(upload()); await asyncio.sleep(0); task.cancel()
    try: await task
    except asyncio.CancelledError: print("request abandoned")`),
run(`async def work():
    try: await asyncio.sleep(100)
    except asyncio.CancelledError:
        print("cleanup, then propagate")
        raise
async def main():
    task = asyncio.create_task(work()); await asyncio.sleep(0); task.cancel()
    try: await task
    except asyncio.CancelledError: pass
    assert task.cancelled()`)],
timeouts: [
run(`async def main():
    try:
        async with asyncio.timeout(.01): await asyncio.sleep(1)
    except TimeoutError: print("bounded operation")`),
run(`async def main():
    for delay in (0, .1):
        try:
            async with asyncio.timeout(.01): await asyncio.sleep(delay)
        except TimeoutError: assert delay == .1
        else: assert delay == 0`),
run(`async def main():
    deadline = asyncio.get_running_loop().time() + .1
    async with asyncio.timeout_at(deadline):
        await asyncio.sleep(.01)  # First API call.
        await asyncio.sleep(.01)  # Second shares the same deadline.`),
run(`async def main():
    deadline = asyncio.get_running_loop().time() + .03
    try:
        async with asyncio.timeout_at(deadline):
            for _ in range(3):
                await asyncio.sleep(.02)  # Budget is not renewed per attempt.
    except TimeoutError: print("end-to-end deadline enforced")`)],
'async-errors': [
run(`async def child(): raise ValueError("child failed")
async def main():
    try: await asyncio.create_task(child())
    except ValueError as error: assert str(error) == "child failed"`),
run(`async def fail(message): raise ValueError(message)
async def main():
    try:
        async with asyncio.TaskGroup() as group:
            group.create_task(fail("a")); group.create_task(fail("b"))
    except* ValueError as group_error:
        assert len(group_error.exceptions) == 2`),
run(`async def upload(n):
    if n == 2: raise ValueError("invalid record")
    return n
async def main():
    results = await asyncio.gather(*(upload(n) for n in (1, 2)), return_exceptions=True)
    assert results[0] == 1 and isinstance(results[1], ValueError)
    # Explicit partial-results policy; report failures alongside successes.`),
run(`async def fail(): raise RuntimeError("failed upload")
async def main():
    try:
        async with asyncio.TaskGroup() as group: group.create_task(fail())
    except* RuntimeError: print("batch failed; do not report success")`)],
queues: [
run(`async def main():
    queue = asyncio.Queue(maxsize=1)
    async def producer(): await queue.put(1)
    async def consumer():
        value = await queue.get()
        try: assert value == 1
        finally: queue.task_done()
    await asyncio.gather(producer(), consumer()); await queue.join()`),
run(`async def main():
    queue = asyncio.Queue(maxsize=1); await queue.put(1)
    pending = asyncio.create_task(queue.put(2)); await asyncio.sleep(0)
    assert not pending.done()
    assert await queue.get() == 1; queue.task_done()
    await pending; assert await queue.get() == 2; queue.task_done(); await queue.join()`),
run(`async def worker(queue, results):
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
    assert results == [2, 4]`),
run(`async def main():
    queue = asyncio.Queue(); await queue.put("bad")
    item = await queue.get()
    try: int(item)
    except ValueError: print("record rejected")
    finally: queue.task_done()  # Exactly once for every successful get.
    async with asyncio.timeout(.1): await queue.join()`)],
locks: [
run(`async def main():
    state = {"n": 0}; lock = asyncio.Lock()
    async def increment(protect):
        if protect:
            async with lock:
                old = state["n"]; await asyncio.sleep(0); state["n"] = old + 1
        else:
            old = state["n"]; await asyncio.sleep(0); state["n"] = old + 1
    await asyncio.gather(increment(False), increment(False)); assert state["n"] == 1
    state["n"] = 0
    await asyncio.gather(increment(True), increment(True)); assert state["n"] == 2`),
run(`async def main():
    lock = asyncio.Lock()
    try:
        async with lock: raise ValueError("fail")
    except ValueError: pass
    async with asyncio.timeout(.1):
        async with lock: assert lock.locked()`),
run(`async def main():
    remaining = 1; lock = asyncio.Lock()
    async def reserve():
        nonlocal remaining
        async with lock:
            if remaining == 0: return False
            remaining -= 1; return True
    assert sorted(await asyncio.gather(reserve(), reserve())) == [False, True]`),
run(`async def main():
    lock = asyncio.Lock(); state = []
    def update_locked(): state.append(1)  # Does not reacquire the lock.
    async with lock: update_locked()
    assert state == [1]
    # One layer owns locking. asyncio.Lock is not reentrant.`)],
semaphores: [
run(`async def main():
    semaphore = asyncio.Semaphore(3); active = peak = 0
    async def worker():
        nonlocal active, peak
        async with semaphore:
            active += 1; peak = max(peak, active)
            try: await asyncio.sleep(.001)
            finally: active -= 1
    await asyncio.gather(*(worker() for _ in range(10)))
    assert peak == 3 and active == 0`),
run(`async def main():
    semaphore = asyncio.Semaphore(1)
    try:
        async with semaphore: raise ValueError("fail")
    except ValueError: pass
    async with asyncio.timeout(.1):
        async with semaphore: pass  # Permit was returned.`),
run(`async def fetch(customer, semaphore):
    async with semaphore:
        async with asyncio.timeout(5):
            await asyncio.sleep(0); return {"id": customer}
async def main():
    semaphore = asyncio.Semaphore(3)
    assert len(await asyncio.gather(*(fetch(str(n), semaphore) for n in range(8)))) == 8`),
run(`async def worker(semaphore):
    async with semaphore: await asyncio.sleep(.001)
async def main():
    semaphore = asyncio.Semaphore(3)  # One instance for the entire group.
    await asyncio.gather(*(worker(semaphore) for _ in range(10)))
    # Creating Semaphore(3) inside worker would create ten independent limits.`)],
'async-context': [
run(`class Client:
    async def __aenter__(self): self.closed = False; return self
    async def __aexit__(self, *exc): await asyncio.sleep(0); self.closed = True
async def main():
    async with Client() as client: assert not client.closed
    assert client.closed`),
run(`class Scope:
    async def __aenter__(self): return self
    async def __aexit__(self, kind, value, traceback):
        assert kind is ValueError and str(value) == "bad"; return False
async def main():
    try:
        async with Scope(): raise ValueError("bad")
    except ValueError: pass`),
`# Requires httpx; async client belongs to the whole batch.
import httpx
async def fetch_all(urls):
    async with httpx.AsyncClient(timeout=5) as client:
        results = []
        for url in urls:
            response = await client.get(url); response.raise_for_status(); results.append(response.json())
        return results`,
run(`from contextlib import asynccontextmanager
@asynccontextmanager
async def resource():
    try: yield "ready"
    finally: await asyncio.sleep(0)
async def main():
    async with resource() as value: assert value == "ready"
    # 'with resource()' selects the wrong, synchronous protocol.`)],
'async-iterators': [
run(`async def events():
    for n in range(3): await asyncio.sleep(0); yield n
async def main(): assert [n async for n in events()] == [0, 1, 2]`),
run(`async def events(): yield 1
async def main():
    iterator = events(); assert await anext(iterator) == 1
    try: await anext(iterator)
    except StopAsyncIteration: pass
    assert [x async for x in iterator] == []`),
run(`async def pages(fetch):
    cursor = None
    while True:
        page = await fetch(cursor)
        for item in page["items"]: yield item
        cursor = page["next"]
        if cursor is None: break
async def main():
    async def fake(cursor): return {"items": [1], "next": None}
    assert [x async for x in pages(fake)] == [1]`),
run(`class Values:
    def __init__(self): self.done = False
    def __aiter__(self): return self  # Regular def, returning async iterator.
    async def __anext__(self):
        if self.done: raise StopAsyncIteration
        self.done = True; return 1
async def main(): assert [x async for x in Values()] == [1]`)],
blocking: [
run(`import time
async def main():
    async def heartbeat():
        start = time.perf_counter(); await asyncio.sleep(.01); return time.perf_counter() - start
    beat = asyncio.create_task(heartbeat()); await asyncio.sleep(0)
    time.sleep(.05); print("blocked delay", await beat)
    beat = asyncio.create_task(heartbeat()); await asyncio.sleep(.05)
    print("cooperative delay", await beat)`),
run(`import time
async def main():
    async def beat():
        start = time.perf_counter(); await asyncio.sleep(.01); return time.perf_counter() - start
    task = asyncio.create_task(beat()); await asyncio.sleep(0)
    end = time.perf_counter() + .05
    while time.perf_counter() < end: pass
    print("heartbeat latency", await task)`),
run(`import time
def blocking_read(): time.sleep(.05); return "data"
async def main():
    start = time.perf_counter()
    task = asyncio.create_task(asyncio.to_thread(blocking_read))
    await asyncio.sleep(.01)
    print("loop resumed after", time.perf_counter() - start)
    assert await task == "data"`),
`import httpx
async def endpoint(url):
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
# Replace synchronous requests.get in the loop, or await asyncio.to_thread
# with bounded concurrency and an underlying blocking-client timeout.`],
'async-threads': [
run(`import time
def read(): time.sleep(.03); return "data"
async def main():
    task = asyncio.create_task(asyncio.to_thread(read))
    await asyncio.sleep(.001); print("heartbeat")
    assert await task == "data"`),
run(`def add(a, b, *, offset=0): return a + b + offset
async def main(): assert await asyncio.to_thread(add, 1, 2, offset=3) == 6`),
run(`async def legacy_adapter(function, inputs, limit=3):
    semaphore = asyncio.Semaphore(limit)
    async def call(value):
        async with semaphore: return await asyncio.to_thread(function, value)
    return await asyncio.gather(*(call(value) for value in inputs))
async def main(): assert await legacy_adapter(str, [1, 2]) == ["1", "2"]`),
`# Cancelling to_thread's await does not terminate the OS thread.
# Give the SDK its own timeout and make writes idempotent by request key.
# Keep the worker lifetime/capacity owned by a dedicated bounded executor.
import threading
def cooperative_work(stop: threading.Event):
    while not stop.wait(.01):
        pass  # Bounded unit of work; real calls also need their own timeout.
stop = threading.Event(); thread = threading.Thread(target=cooperative_work, args=(stop,))
thread.start(); stop.set(); thread.join()`],
'cpu-work': [
`import time
start = time.perf_counter(); sum(n*n for n in range(100000))
print("calculation", time.perf_counter() - start)
start = time.perf_counter(); time.sleep(.01)
print("IO-like wait", time.perf_counter() - start)`,
`import time
for work in (lambda: time.sleep(.02), lambda: sum(n*n for n in range(200000))):
    wall, cpu = time.perf_counter(), time.process_time()
    work(); print("wall", time.perf_counter() - wall, "CPU", time.process_time() - cpu)`,
`import cProfile
def preprocess(texts): return [text.lower().split() for text in texts]
cProfile.run("preprocess(['An example document'] * 10000)", sort="cumtime")
# Measure realistic batch sizes before choosing processes or a native library.
# Network embedding calls are a separate IO boundary.`,
`from concurrent.futures import ThreadPoolExecutor
from time import perf_counter
def calculate(n): return sum(i*i for i in range(n))
start = perf_counter(); expected = [calculate(100000) for _ in range(4)]
print("serial", perf_counter() - start); start = perf_counter()
with ThreadPoolExecutor(4) as pool: assert list(pool.map(calculate, [100000]*4)) == expected
print("threads", perf_counter() - start)
# On a GIL-enabled build, pure Python threads add overhead without parallel bytecode execution.`],
processes: [
`from concurrent.futures import ProcessPoolExecutor
def square(n): return n*n
if __name__ == "__main__":
    with ProcessPoolExecutor(2) as pool: assert list(pool.map(square, [2, 3])) == [4, 9]
# Save as a .py file; top-level worker is importable by spawned processes.`,
`from concurrent.futures import ProcessPoolExecutor
from time import perf_counter
def size(value): return len(value) if isinstance(value, bytes) else value
if __name__ == "__main__":
    with ProcessPoolExecutor(1) as pool:
        pool.submit(size, 1).result()  # Warm the worker.
        for payload in (1, bytes(1000000)):
            start = perf_counter(); result = pool.submit(size, payload).result()
            print(result, perf_counter() - start)`,
`from concurrent.futures import ProcessPoolExecutor
def normalize(text): return " ".join(text.lower().split())
if __name__ == "__main__":
    with ProcessPoolExecutor(2) as pool:
        result = list(pool.map(normalize, [" A B ", "C"], chunksize=32))
    assert result == ["a b", "c"]
# Tiny inputs are slower in a pool; measure on representative CPU-heavy batches.`,
`from concurrent.futures import ProcessPoolExecutor
def worker(n): return n + 1  # Module-level, serializable function.
def main():
    with ProcessPoolExecutor(1) as pool: assert pool.submit(worker, 1).result() == 2
if __name__ == "__main__": main()  # Prevent recursive startup under spawn.`],
'fastapi-routing': [
`from fastapi import FastAPI
app = FastAPI()
@app.get("/reports")
def reports(): return []
assert "get" in app.openapi()["paths"]["/reports"]`,
`from fastapi import FastAPI
app = FastAPI()
@app.get("/reports/{report_id}")
def report(report_id: int): return {"id": report_id}
assert app.openapi()["paths"]["/reports/{report_id}"]["get"]["parameters"][0]["in"] == "path"`,
`from fastapi import FastAPI
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/reports/latest")
def latest(): return {"id": "r1", "count": 12}
assert TestClient(app).get("/reports/latest").json()["count"] == 12`,
`from fastapi import FastAPI
app = FastAPI()
@app.get("/reports/latest")  # Static route before dynamic catch-all.
def latest(): return {"id": "latest"}
@app.get("/reports/{report_id}")
def report(report_id: str): return {"id": report_id}
# Or use separate namespaces such as /reports/by-id/{report_id}.`],
'fastapi-deps': [
`from fastapi import FastAPI, Depends
app = FastAPI()
def config(): return {"limit": 10}
@app.get("/config")
def settings(value: dict = Depends(config)): return value`,
`from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
app = FastAPI()
def config(): return {"limit": 10}
@app.get("/")
def read(value: dict = Depends(config)): return value
app.dependency_overrides[config] = lambda: {"limit": 1}
try: assert TestClient(app).get("/").json() == {"limit": 1}
finally: app.dependency_overrides.clear()`,
`from fastapi import FastAPI, Depends
app = FastAPI()
class Repository:
    def latest(self): return {"id": "r1"}
def repository(): return Repository()
@app.get("/latest")
def latest(repo: Repository = Depends(repository)): return repo.latest()`,
`from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
app = FastAPI()
def repository(): return ["production"]
@app.get("/")
def read(repo: list = Depends(repository)): return repo
app.dependency_overrides[repository] = lambda: ["fake"]
try: assert TestClient(app).get("/").json() == ["fake"]
finally: app.dependency_overrides.clear()`],
'fastapi-validation': [
`from typing import Annotated
from fastapi import FastAPI, Query
app = FastAPI()
@app.get("/reports")
def reports(limit: Annotated[int, Query(gt=0)]): return {"limit": limit}`, 
`from typing import Annotated
from fastapi import FastAPI, Query
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/")
def read(limit: Annotated[int, Query(gt=0)]): return limit
client = TestClient(app)
for path in ("/", "/?limit=bad"):
    response = client.get(path); assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["query", "limit"]`,
`from typing import Annotated
from fastapi import FastAPI, Query
app = FastAPI()
@app.get("/reports")
def reports(limit: Annotated[int, Query(gt=0, le=100)] = 10):
    return {"records": [], "limit": limit}
# Validation happens before database calls in the handler.`,
`from typing import Annotated
from fastapi import FastAPI, Query
from fastapi.testclient import TestClient
app = FastAPI()
@app.get("/")
def read(limit: Annotated[int, Query(gt=0)]): return {"limit": limit}
assert TestClient(app).get("/?limit=-1").status_code == 422
# Use typed parameters instead of reading and trusting request.query_params manually.`],
'fastapi-middleware': [
`from uuid import uuid4
from fastapi import FastAPI
app = FastAPI()
@app.middleware("http")
async def request_id(request, call_next):
    request.state.request_id = str(uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response`,
`from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
app = FastAPI()
class MissingReport(Exception): pass
@app.exception_handler(MissingReport)
async def missing(request, error): return JSONResponse(status_code=404, content={"error": "report_not_found"})
@app.get("/")
def report(): raise MissingReport()
response = TestClient(app).get("/")
assert response.status_code == 404 and response.json() == {"error": "report_not_found"}`, 
`from fastapi import FastAPI, HTTPException
app = FastAPI(); reports = {}
@app.get("/reports/{report_id}")
def report(report_id: str):
    if report_id not in reports: raise HTTPException(404, detail={"code": "report_not_found"})
    return reports[report_id]`,
`import logging
from fastapi import FastAPI
app = FastAPI(); logger = logging.getLogger(__name__)
@app.middleware("http")
async def observe(request, call_next):
    try: return await call_next(request)
    except Exception:
        logger.exception("request failed")  # Keep diagnostics server-side.
        raise  # Preserve a failure response; do not return HTTP 200.`],
'fastapi-resources': [
`from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
@asynccontextmanager
async def lifespan(app):
    async with httpx.AsyncClient(timeout=5) as client:
        app.state.client = client; yield
app = FastAPI(lifespan=lifespan)`,
`from contextlib import asynccontextmanager
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
assert events == ["start", "stop"]`,
`# Requires asyncpg and DATABASE_URL for a PostgreSQL database.
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
        return {"value": await connection.fetchval("SELECT 1")}`, 
`# Lifespan owns the pool/client; request handlers only borrow it.
from fastapi import Request
async def query(request: Request):
    async with request.app.state.pool.acquire() as connection:
        return await connection.fetchval("SELECT 1")
# Release this borrowed connection. Never close the shared pool here.
# Test two sequential requests inside one TestClient lifespan.`],
'fastapi-background': [
`from fastapi import FastAPI, BackgroundTasks
app = FastAPI(); events = []
def notify(message): events.append(message)
@app.post("/notify")
def enqueue(background: BackgroundTasks):
    background.add_task(notify, "sent"); return {"accepted": True}
# Suitable for best-effort, noncritical work only.`,
`from fastapi import FastAPI, BackgroundTasks
from fastapi.testclient import TestClient
app = FastAPI(); trace = []
@app.get("/")
def read(background: BackgroundTasks):
    trace.append("handler"); background.add_task(trace.append, "background")
    return {"ok": True}
TestClient(app).get("/")  # TestClient waits for background completion.
assert trace == ["handler", "background"]`,
`# Contract sketch: durable_jobs.enqueue commits a unique request ID to storage
# before returning. A separate worker consumes it and records status.
from fastapi import FastAPI, Depends
app = FastAPI()
def jobs(): raise RuntimeError("provide durable job repository")
@app.post("/reports", status_code=202)
def create_report(request_id: str, queue=Depends(jobs)):
    job_id = queue.enqueue(request_id=request_id, kind="report")
    return {"job_id": job_id, "status": "queued"}`, 
`# Recovery design:
# 1. Insert a pending job with a unique logical request ID in durable storage.
# 2. Commit before HTTP 202.
# 3. Worker claims it with a lease; expires abandoned leases after crashes.
# 4. Make external writes idempotent and record completion.
# FastAPI BackgroundTasks alone has no durable recovery guarantee.
job = {"id": "request-1", "status": "pending", "attempts": 0}
assert job["status"] == "pending"`]
};
