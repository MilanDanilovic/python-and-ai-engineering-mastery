export default {
'shallow-copy': [
`a = [[1]]; b = a.copy(); b[0].append(2)
print(a == b == [[1, 2]] and a is not b)  # Expected: True`,
`a = [[1]]; b = a.copy(); b[0] = [2]
print(a)  # Expected: [[1]]
b = a.copy(); b[0].append(3)
print(a)  # Expected: [[1, 3]]`,
`config = {"retries": 3, "labels": ["api"]}
copy = config.copy()
print(copy is not config and copy['labels'] is config['labels'])  # Expected: True
copy["retries"] = 1
print(config['retries'])  # Expected: 3
# Only outer entries are isolated; nested mutable values remain shared.`,
`from copy import deepcopy
defaults = {"nested": {"timeout": 30}}
request = deepcopy(defaults)
request["nested"]["timeout"] = 0
print(defaults['nested']['timeout'])  # Expected: 30
# Before: two dicts -> one nested dict. After: distinct nested dicts.`],
'deep-copy': [
`from copy import deepcopy
a = [{"tags": []}]; b = deepcopy(a)
print(b == a and b[0] is not a[0] and (b[0]['tags'] is not a[0]['tags']))  # Expected: True`,
`from copy import deepcopy
shared = []; a = [shared, shared]; b = deepcopy(a)
print(b[0] is b[1] and b[0] is not shared)  # Expected: True`,
`from copy import deepcopy
service = object()
fixture = {"records": [{"id": 1}], "service": service}
isolated = {"records": deepcopy(fixture["records"]), "service": service}
print(isolated['service'] is service)  # Expected: True
print(isolated['records'][0] is not fixture['records'][0])  # Expected: True`,
`from dataclasses import dataclass
@dataclass(frozen=True)
class ReadSpec:
    path: str
def read(spec):
    with open(spec.path, encoding="utf-8") as handle: return handle.read()
# Copy the immutable specification, never the live handle.
# Each read owns its resource and closes it independently.`],
classes: [
`class Event:
    def __init__(self, message): self.message = message
a, b = Event("a"), Event("b")
print(a.message != b.message)  # Expected: True`,
`class Event:
    def __init__(self, message): self.message = message
    def upper(self): self.message = self.message.upper()
a, b = Event("a"), Event("b"); a.upper()
print(a.message, b.message)  # Expected values: 'A'; 'b'`,
`class Event:
    def __init__(self, severity, source, message):
        self.severity, self.source, self.message = severity, source, message
event = Event("INFO", "api", "ready")
print(event.source)  # Expected: "api"`,
`class Event:
    def __init__(self, message):
        self.message = message
        # No return value: __init__ initializes an already-created object.
print(Event('ok').message)  # Expected: "ok"
# Returning 1 from __init__ would raise TypeError.`],
attributes: [
`class Event:
    count = 0
    def __init__(self):
        Event.count += 1
        self.messages = []
a, b = Event(), Event(); a.messages.append("a")
print(Event.count, b.messages)  # Expected values: 2; []`,
`class Settings: timeout = 30
a, b = Settings(), Settings(); a.timeout = 0
print(a.timeout == 0 and b.timeout == Settings.timeout == 30)  # Expected: True`,
`class Customer:
    def __init__(self, customer_id):
        self.customer_id = customer_id
        self.notes = []
a, b = Customer("a"), Customer("b"); a.notes.append("hello")
print(b.notes)  # Expected: []`,
`class Bad: notes = []
a, b = Bad(), Bad(); a.notes.append("leaked")
print(b.notes)  # Expected: ["leaked"]
class Good:
    def __init__(self): self.notes = []
a, b = Good(), Good(); a.notes.append("private")
print(b.notes)  # Expected: []`],
composition: [
`class Writer:
    def __init__(self, sink): self.sink = sink
    def write(self, text): self.sink.write(text)
from io import StringIO
sink = StringIO(); Writer(sink).write("hello")
print(sink.getvalue())  # Expected: "hello"`,
`class MemorySink:
    def __init__(self): self.parts = []
    def write(self, text): self.parts.append(text)
class Writer:
    def __init__(self, sink): self.sink = sink
    def write(self, text): self.sink.write(text)
sink = MemorySink(); Writer(sink).write("test")
print(sink.parts)  # Expected: ["test"]`,
`def analyze(lines, parser, predicate, report):
    return report(record for record in map(parser, lines) if predicate(record))
print(analyze(['1', '2'], int, lambda n: n > 1, sum))  # Expected: 2`,
`class Base:
    def __init__(self, sink): self.sink = sink
class Writer(Base):
    def __init__(self, sink): super().__init__(sink)
print(Writer('memory').sink)  # Expected: "memory"
# Or inject the sink directly into a composed Writer without inheritance.`],
dataclasses: [
`from dataclasses import dataclass
@dataclass
class Event: message: str
print(Event('ok'))  # Expected: Event("ok")
print(repr(Event('ok')))  # Expected: "Event(message='ok')"`,
`from dataclasses import dataclass
@dataclass
class Event: message: str
a, b = Event("ok"), Event("ok")
print(a)  # Expected: b
b.message = "changed"; print(a != b)  # Expected: True`,
`from dataclasses import dataclass, field
@dataclass
class Ticket:
    id: str
    labels: list[str] = field(default_factory=list)
a, b = Ticket("a"), Ticket("b"); a.labels.append("urgent")
print(b.labels)  # Expected: []`,
`from dataclasses import dataclass, field
@dataclass
class Record:
    tags: list[str] = field(default_factory=list)
print(Record().tags is not Record().tags)  # Expected: True
# default_factory is invoked per instance; a default list is not.`],
properties: [
`class Person:
    def __init__(self, first, last): self.first, self.last = first, last
    @property
    def full_name(self): return f"{self.first} {self.last}"
print(Person('Ada', 'Lovelace').full_name)  # Expected: "Ada Lovelace"`,
`class Ticket:
    @property
    def status(self): return "open"
try: Ticket().status = "closed"
except AttributeError: print("No setter: read only")`,
`class Ticket:
    def __init__(self, priority): self.priority = priority
    @property
    def priority(self): return self._priority
    @priority.setter
    def priority(self, value):
        if value not in range(1, 6): raise ValueError("priority 1..5")
        self._priority = value
t = Ticket(2); t.priority = 4; print(t.priority)  # Expected: 4`,
`class Value:
    def __init__(self, value): self._value = value
    @property
    def value(self): return self._value
print(Value(2).value)  # Expected: 2
# Returning self.value would call this getter recursively.`],
'method-kinds': [
`class Event:
    def __init__(self, level): self.level = level
    @staticmethod
    def parse_level(text): return text.upper()
    @classmethod
    def from_text(cls, text): return cls(cls.parse_level(text))
print(Event.from_text('info').level)  # Expected: "INFO"`,
`class Base:
    @classmethod
    def create(cls): return cls()
class Child(Base): pass
print(type(Child.create()) is Child)  # Expected: True`,
`class Event:
    def __init__(self, severity, message): self.severity, self.message = severity, message
    @classmethod
    def from_dict(cls, record): return cls(record["severity"], record["message"])
print(Event.from_dict({'severity': 'INFO', 'message': 'ok'}).message)  # Expected: "ok"`,
`class Event:
    def __init__(self, message): self.message = message
    def render(self): return self.message  # Instance method receives self.
    @staticmethod
    def normalize(text): return text.upper()  # No implicit receiver.
print(Event('ok').render(), Event.normalize('ok'))  # Expected values: 'ok'; 'OK'`],
dunders: [
`class Events:
    def __init__(self, items): self.items = list(items)
    def __len__(self): return len(self.items)
    def __repr__(self): return f"Events({self.items!r})"
print(len(Events([1])), repr(Events([1])))  # Expected values: 1; 'Events([1])'`,
`class Value:
    def __init__(self, value): self.value = value
    def __eq__(self, other):
        if not isinstance(other, Value): return NotImplemented
        return self.value == other.value
print(Value(1))  # Expected: Value(1)
print(Value(1).__eq__(1) is NotImplemented)  # Expected: True`,
`class Report:
    def __init__(self, rows): self.rows = list(rows)
    def __len__(self): return len(self.rows)
    def __repr__(self): return f"Report(rows={len(self)})"
print(repr(Report([1, 2])))  # Expected: "Report(rows=2)"`,
`class Bad:
    def __len__(self): return -1
try: len(Bad())
except ValueError: pass
class Good:
    def __len__(self): return 0
print(len(Good()))  # Expected: 0`],
iterables: [
`xs = [1, 2]; a, b = iter(xs), iter(xs)
print(next(a), next(a), next(b))  # Expected values: 1; 2; 1`,
`xs = [1]; iterator = iter(xs)
print(iter(xs) is not xs and iter(iterator) is iterator)  # Expected: True`,
`class Events:
    def __init__(self, records): self.records = tuple(records)
    def __iter__(self): return iter(self.records)
events = Events([{"id": 1}])
print(list(events) == list(events) == [{'id': 1}])  # Expected: True`,
`class Collection:
    def __iter__(self): return iter([1, 2])
print(list(Collection()))  # Expected: [1, 2]
# Returning [1, 2] directly fails: __iter__ must return an iterator.`],
iterators: [
`class Counter:
    def __init__(self, stop): self.current, self.stop = 0, stop
    def __iter__(self): return self
    def __next__(self):
        if self.current >= self.stop: raise StopIteration
        value = self.current; self.current += 1; return value
print(list(Counter(3)))  # Expected: [0, 1, 2]`,
`class Once:
    def __init__(self): self.done = False
    def __iter__(self): return self
    def __next__(self):
        if self.done: raise StopIteration
        self.done = True; return 1
iterator = Once(); print(next(iterator))  # Expected: 1
for _ in range(2):
    try: next(iterator)
    except StopIteration: pass
    else: raise AssertionError("exhaustion must remain stable")`,
`class Pages:
    def __init__(self, pages): self.items = iter(x for page in pages for x in page)
    def __iter__(self): return self
    def __next__(self): return next(self.items)
print(list(Pages([[1, 2], [], [3]])))  # Expected: [1, 2, 3]`,
`class Counter:
    def __init__(self, stop): self.n, self.stop = 0, stop
    def __iter__(self): return self
    def __next__(self):
        if self.n >= self.stop: raise StopIteration  # Never reset here.
        self.n += 1; return self.n
iterator = Counter(2)
print(list(iterator), list(iterator))  # Expected values: [1, 2]; []`],
generators: [
`def ids():
    for value in ("e1", "e2", "e3"):
        print("yielding", value); yield value
stream = ids()  # Nothing printed yet.
print(next(stream))  # Expected: "e1"
print(list(stream))  # Expected: ["e2", "e3"]`,
`trace = []
def values():
    yield 1
    trace.append("after final yield")
stream = values(); next(stream); print(trace)  # Expected: []
print(list(stream), trace)  # Expected values: []; ['after final yield']`,
`def errors(handle):
    for line in handle:
        if line.startswith("ERROR "): yield line.rstrip()
# Caller owns the file's with block; no entire-file materialization.
print(list(errors(['INFO ok\\n', 'ERROR fail\\n'])))  # Expected: ["ERROR fail"]`,
`def source(): yield from [1, 2]
stream = source(); print(list(stream))  # Expected: [1, 2]
print(list(stream))  # Expected: []
buffer = list(source())  # Intentional bounded materialization for reuse.
print(list(buffer) == list(buffer) == [1, 2])  # Expected: True`],
'generator-pipelines': [
`filtered = (n for n in range(5) if n % 2 == 0)
transformed = (n*n for n in filtered)
print(list(transformed))  # Expected: [0, 4, 16]`,
`def combined():
    yield from [1, 2]
    yield from [3]
print(list(combined()))  # Expected: [1, 2, 3]`,
`import json
def errors(lines):
    records = (json.loads(line) for line in lines if line.strip())
    return (r for r in records if r["severity"] == "ERROR")
print(list(errors(['{"severity":"ERROR"}', '{"severity":"INFO"}'])))  # Expected: [{"severity": "ERROR"}]`,
`def transform(source):
    for value in source: yield value * 2
# list(source) inside the stage would eagerly consume unbounded input.
from itertools import count, islice
print(list(islice(transform(count()), 3)))  # Expected: [0, 2, 4]`],
'generator-cleanup': [
`trace = []
def values():
    try: yield 1
    finally: trace.append("closed")
stream = values(); next(stream); stream.close()
print(trace)  # Expected: ["closed"]`,
`trace = []
def values():
    try: yield 1
    finally: trace.append("closed")
print(list(values()))  # Expected: [1]
stream = values(); next(stream); stream.close()
print(trace)  # Expected: ["closed", "closed"]`,
`def stream_errors(handle):
    for line in handle:
        if line.startswith("ERROR"): yield line
def first_error(path):
    with open(path, encoding="utf-8") as handle:
        return next(stream_errors(handle), None)
# The file owner closes the resource even on an early return.`,
`from contextlib import closing
trace = []
def values():
    try: yield from range(3)
    finally: trace.append("closed")
with closing(values()) as stream:
    for value in stream: break
print(trace)  # Expected: ["closed"]`],
decorators: [
`def doubled(function):
    def wrapper(): return function() * 2
    return wrapper
def one(): return 1
manual = doubled(one)
@doubled
def decorated(): return 1
print(manual() == decorated() == 2)  # Expected: True`,
`def replace(function):
    return lambda: "replacement"
@replace
def original(): return "original"
print(original(), original.__name__)  # Expected values: 'replacement'; '<lambda>'`,
`from functools import wraps
from time import perf_counter
def timed(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        start = perf_counter()
        try: return function(*args, **kwargs)
        finally: print(function.__name__, perf_counter() - start)
    return wrapper
print(timed(int)('2'))  # Expected: 2`,
`def decorate(function):
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper  # wrapper() would execute now and replace the callable with its result.
@decorate
def value(): return 3
print(callable(value) and value() == 3)  # Expected: True`],
'decorator-forwarding': [
`from functools import wraps
def trace(function):
    @wraps(function)
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper
@trace
def add(a, b):
    """Add two values."""
    return a + b
print(add(1, b=2), add.__name__, add.__doc__)  # Expected values: 3; 'add'; 'Add two values.'`,
`from functools import wraps
def original():
    """Original docs."""
def bare(): pass
@wraps(original)
def wrapped(): pass
print(not hasattr(bare, '__wrapped__'))  # Expected: True
print(wrapped.__wrapped__ is original and wrapped.__doc__ == original.__doc__)  # Expected: True`,
`import inspect
from functools import wraps
def trace(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print("calling", function.__name__)
        return function(*args, **kwargs)
    return wrapper
def parse(text, *, strict=True): return int(text)
print(inspect.signature(trace(parse)))  # Expected: inspect.signature(parse)`,
`from functools import wraps
def decorate(function):
    @wraps(function)
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper
@decorate
def parse(text, *, strict): return int(text) if strict else text
print(parse('2', strict=True), parse.__name__)  # Expected values: 2; 'parse'`],
'decorator-factories': [
`from functools import wraps
def logged(prefix):
    def decorate(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            print(prefix, function.__name__)
            return function(*args, **kwargs)
        return wrapper
    return decorate
print(logged('API')(int)('2'))  # Expected: 2`,
`def above(threshold):
    def decorate(function):
        def wrapper(value): return function(value) > threshold
        return wrapper
    return decorate
@above(2)
def low(value): return value
@above(5)
def high(value): return value
print(low(3) and (not high(3)))  # Expected: True`,
`from functools import wraps
from time import perf_counter
def warn_slow(threshold):
    def decorate(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            start = perf_counter()
            try: return function(*args, **kwargs)
            finally:
                if perf_counter() - start > threshold: print("slow", function.__name__)
        return wrapper
    return decorate
# @warn_slow(0.1) -> factory -> decorator(function) -> wrapper(args).`,
`def configured(threshold):
    def decorate(function):
        def wrapper(value): return function(value) >= threshold
        return wrapper
    return decorate
@configured(10)  # Call the factory with configuration first.
def measure(value): return value
print(measure(12) and (not measure(9)))  # Expected: True`],
'decorator-order': [
`trace = []
def tag(name):
    def decorate(function):
        def wrapper():
            trace.append("enter " + name)
            result = function()
            trace.append("exit " + name)
            return result
        return wrapper
    return decorate
@tag("A")
@tag("B")
def run(): pass
run(); print(trace)  # Expected: ["enter A", "enter B", "exit B", "exit A"]`,
`trace = []
def tag(name):
    def decorate(function):
        def wrapper():
            trace.append(name); return function()
        return wrapper
    return decorate
def original(): return 1
wrapped = tag("A")(tag("B")(original))
print(wrapped(), trace)  # Expected values: 1; ['A', 'B']`,
`from functools import lru_cache
@lru_cache
def tenant_data(tenant, key): return (tenant, key)
def protected(auth, key):
    if "read" not in auth["scopes"]: raise PermissionError("denied")
    return tenant_data(auth["tenant"], key)
# Authorization runs every time, before the tenant-scoped cache lookup.
print(protected({'tenant': 'a', 'scopes': {'read'}}, 'x'))  # Expected: ("a", "x")`,
`from functools import lru_cache
@lru_cache
def cached(tenant, key): return f"{tenant}:{key}"
def read(auth, key):
    if not auth["allowed"]: raise PermissionError("denied")
    return cached(auth["tenant"], key)
read({"tenant": "a", "allowed": True}, "x")
try: read({"tenant": "a", "allowed": False}, "x")
except PermissionError: print("Cache hit cannot bypass authorization")`],
'context-managers': [
`trace = []
class Scope:
    def __enter__(self): trace.append("enter"); return self
    def __exit__(self, kind, value, traceback): trace.append("exit"); return False
with Scope(): pass
print(trace)  # Expected: ["enter", "exit"]`,
`seen = []
class Scope:
    def __enter__(self): return self
    def __exit__(self, kind, value, traceback):
        seen.append((kind, str(value), traceback is not None)); return False
try:
    with Scope(): raise ValueError("bad")
except ValueError: pass
print(seen)  # Expected: [(ValueError, "bad", True)]`,
`from tempfile import TemporaryDirectory
from pathlib import Path
with TemporaryDirectory() as directory:
    output = Path(directory) / "report.txt"
    output.write_text("Report\\n", encoding="utf-8")
    print(output.exists())  # Expected: True
print(not output.exists())  # Expected: True`,
`class Scope:
    def __enter__(self): return self
    def __exit__(self, *exc): return False  # Never suppress accidentally.
try:
    with Scope(): raise ValueError("visible")
except ValueError as error: print(str(error))  # Expected: "visible"
else: raise AssertionError("exception was suppressed")`],
contextlib: [
`from contextlib import contextmanager
from time import perf_counter
@contextmanager
def timing():
    start = perf_counter()
    try: yield
    finally: print("seconds", perf_counter() - start)
with timing(): sum(range(10))`,
`from contextlib import contextmanager
state = {"active": False}
@contextmanager
def active():
    old = state["active"]; state["active"] = True
    try: yield
    finally: state["active"] = old
try:
    with active(): raise ValueError("test")
except ValueError: pass
print(state['active'] is False)  # Expected: True`,
`from contextlib import contextmanager
@contextmanager
def override(config, key, value):
    missing = object(); old = config.get(key, missing); config[key] = value
    try: yield config
    finally:
        if old is missing: config.pop(key, None)
        else: config[key] = old
config = {"timeout": 30}
with override(config, "timeout", 0): print(config['timeout'])  # Expected: 0
print(config['timeout'])  # Expected: 30`,
`from contextlib import contextmanager
trace = []
@contextmanager
def scope():
    try: yield
    finally: trace.append("restored")
try:
    with scope(): raise RuntimeError("failed")
except RuntimeError: pass
print(trace)  # Expected: ["restored"]
# An unprotected statement after yield is skipped when the body raises.`]
};
