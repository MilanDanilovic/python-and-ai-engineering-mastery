export default {
'shallow-copy': [
`a = [[1]]; b = a.copy(); b[0].append(2)
assert a == b == [[1, 2]] and a is not b`,
`a = [[1]]; b = a.copy(); b[0] = [2]
assert a == [[1]]
b = a.copy(); b[0].append(3)
assert a == [[1, 3]]`,
`config = {"retries": 3, "labels": ["api"]}
copy = config.copy()
assert copy is not config and copy["labels"] is config["labels"]
copy["retries"] = 1
assert config["retries"] == 3
# Only outer entries are isolated; nested mutable values remain shared.`,
`from copy import deepcopy
defaults = {"nested": {"timeout": 30}}
request = deepcopy(defaults)
request["nested"]["timeout"] = 0
assert defaults["nested"]["timeout"] == 30
# Before: two dicts -> one nested dict. After: distinct nested dicts.`],
'deep-copy': [
`from copy import deepcopy
a = [{"tags": []}]; b = deepcopy(a)
assert b == a and b[0] is not a[0] and b[0]["tags"] is not a[0]["tags"]`,
`from copy import deepcopy
shared = []; a = [shared, shared]; b = deepcopy(a)
assert b[0] is b[1] and b[0] is not shared`,
`from copy import deepcopy
service = object()
fixture = {"records": [{"id": 1}], "service": service}
isolated = {"records": deepcopy(fixture["records"]), "service": service}
assert isolated["service"] is service
assert isolated["records"][0] is not fixture["records"][0]`,
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
assert a.message != b.message`,
`class Event:
    def __init__(self, message): self.message = message
    def upper(self): self.message = self.message.upper()
a, b = Event("a"), Event("b"); a.upper()
assert a.message == "A" and b.message == "b"`,
`class Event:
    def __init__(self, severity, source, message):
        self.severity, self.source, self.message = severity, source, message
event = Event("INFO", "api", "ready")
assert event.source == "api"`,
`class Event:
    def __init__(self, message):
        self.message = message
        # No return value: __init__ initializes an already-created object.
assert Event("ok").message == "ok"
# Returning 1 from __init__ would raise TypeError.`],
attributes: [
`class Event:
    count = 0
    def __init__(self):
        Event.count += 1
        self.messages = []
a, b = Event(), Event(); a.messages.append("a")
assert Event.count == 2 and b.messages == []`,
`class Settings: timeout = 30
a, b = Settings(), Settings(); a.timeout = 0
assert a.timeout == 0 and b.timeout == Settings.timeout == 30`,
`class Customer:
    def __init__(self, customer_id):
        self.customer_id = customer_id
        self.notes = []
a, b = Customer("a"), Customer("b"); a.notes.append("hello")
assert b.notes == []`,
`class Bad: notes = []
a, b = Bad(), Bad(); a.notes.append("leaked")
assert b.notes == ["leaked"]
class Good:
    def __init__(self): self.notes = []
a, b = Good(), Good(); a.notes.append("private")
assert b.notes == []`],
composition: [
`class Writer:
    def __init__(self, sink): self.sink = sink
    def write(self, text): self.sink.write(text)
from io import StringIO
sink = StringIO(); Writer(sink).write("hello")
assert sink.getvalue() == "hello"`,
`class MemorySink:
    def __init__(self): self.parts = []
    def write(self, text): self.parts.append(text)
class Writer:
    def __init__(self, sink): self.sink = sink
    def write(self, text): self.sink.write(text)
sink = MemorySink(); Writer(sink).write("test")
assert sink.parts == ["test"]`,
`def analyze(lines, parser, predicate, report):
    return report(record for record in map(parser, lines) if predicate(record))
assert analyze(["1", "2"], int, lambda n: n > 1, sum) == 2`,
`class Base:
    def __init__(self, sink): self.sink = sink
class Writer(Base):
    def __init__(self, sink): super().__init__(sink)
assert Writer("memory").sink == "memory"
# Or inject the sink directly into a composed Writer without inheritance.`],
dataclasses: [
`from dataclasses import dataclass
@dataclass
class Event: message: str
assert Event("ok") == Event("ok")
assert repr(Event("ok")) == "Event(message='ok')"`,
`from dataclasses import dataclass
@dataclass
class Event: message: str
a, b = Event("ok"), Event("ok")
assert a == b
b.message = "changed"; assert a != b`,
`from dataclasses import dataclass, field
@dataclass
class Ticket:
    id: str
    labels: list[str] = field(default_factory=list)
a, b = Ticket("a"), Ticket("b"); a.labels.append("urgent")
assert b.labels == []`,
`from dataclasses import dataclass, field
@dataclass
class Record:
    tags: list[str] = field(default_factory=list)
assert Record().tags is not Record().tags
# default_factory is invoked per instance; a default list is not.`],
properties: [
`class Person:
    def __init__(self, first, last): self.first, self.last = first, last
    @property
    def full_name(self): return f"{self.first} {self.last}"
assert Person("Ada", "Lovelace").full_name == "Ada Lovelace"`,
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
t = Ticket(2); t.priority = 4; assert t.priority == 4`,
`class Value:
    def __init__(self, value): self._value = value
    @property
    def value(self): return self._value
assert Value(2).value == 2
# Returning self.value would call this getter recursively.`],
'method-kinds': [
`class Event:
    def __init__(self, level): self.level = level
    @staticmethod
    def parse_level(text): return text.upper()
    @classmethod
    def from_text(cls, text): return cls(cls.parse_level(text))
assert Event.from_text("info").level == "INFO"`,
`class Base:
    @classmethod
    def create(cls): return cls()
class Child(Base): pass
assert type(Child.create()) is Child`,
`class Event:
    def __init__(self, severity, message): self.severity, self.message = severity, message
    @classmethod
    def from_dict(cls, record): return cls(record["severity"], record["message"])
assert Event.from_dict({"severity": "INFO", "message": "ok"}).message == "ok"`,
`class Event:
    def __init__(self, message): self.message = message
    def render(self): return self.message  # Instance method receives self.
    @staticmethod
    def normalize(text): return text.upper()  # No implicit receiver.
assert Event("ok").render() == "ok" and Event.normalize("ok") == "OK"`],
dunders: [
`class Events:
    def __init__(self, items): self.items = list(items)
    def __len__(self): return len(self.items)
    def __repr__(self): return f"Events({self.items!r})"
assert len(Events([1])) == 1 and repr(Events([1])) == "Events([1])"`,
`class Value:
    def __init__(self, value): self.value = value
    def __eq__(self, other):
        if not isinstance(other, Value): return NotImplemented
        return self.value == other.value
assert Value(1) == Value(1)
assert Value(1).__eq__(1) is NotImplemented`,
`class Report:
    def __init__(self, rows): self.rows = list(rows)
    def __len__(self): return len(self.rows)
    def __repr__(self): return f"Report(rows={len(self)})"
assert repr(Report([1, 2])) == "Report(rows=2)"`,
`class Bad:
    def __len__(self): return -1
try: len(Bad())
except ValueError: pass
class Good:
    def __len__(self): return 0
assert len(Good()) == 0`],
iterables: [
`xs = [1, 2]; a, b = iter(xs), iter(xs)
assert next(a) == 1 and next(a) == 2 and next(b) == 1`,
`xs = [1]; iterator = iter(xs)
assert iter(xs) is not xs and iter(iterator) is iterator`,
`class Events:
    def __init__(self, records): self.records = tuple(records)
    def __iter__(self): return iter(self.records)
events = Events([{"id": 1}])
assert list(events) == list(events) == [{"id": 1}]`,
`class Collection:
    def __iter__(self): return iter([1, 2])
assert list(Collection()) == [1, 2]
# Returning [1, 2] directly fails: __iter__ must return an iterator.`],
iterators: [
`class Counter:
    def __init__(self, stop): self.current, self.stop = 0, stop
    def __iter__(self): return self
    def __next__(self):
        if self.current >= self.stop: raise StopIteration
        value = self.current; self.current += 1; return value
assert list(Counter(3)) == [0, 1, 2]`,
`class Once:
    def __init__(self): self.done = False
    def __iter__(self): return self
    def __next__(self):
        if self.done: raise StopIteration
        self.done = True; return 1
iterator = Once(); assert next(iterator) == 1
for _ in range(2):
    try: next(iterator)
    except StopIteration: pass
    else: raise AssertionError("exhaustion must remain stable")`,
`class Pages:
    def __init__(self, pages): self.items = iter(x for page in pages for x in page)
    def __iter__(self): return self
    def __next__(self): return next(self.items)
assert list(Pages([[1, 2], [], [3]])) == [1, 2, 3]`,
`class Counter:
    def __init__(self, stop): self.n, self.stop = 0, stop
    def __iter__(self): return self
    def __next__(self):
        if self.n >= self.stop: raise StopIteration  # Never reset here.
        self.n += 1; return self.n
iterator = Counter(2)
assert list(iterator) == [1, 2] and list(iterator) == []`],
generators: [
`def ids():
    for value in ("e1", "e2", "e3"):
        print("yielding", value); yield value
stream = ids()  # Nothing printed yet.
assert next(stream) == "e1"
assert list(stream) == ["e2", "e3"]`,
`trace = []
def values():
    yield 1
    trace.append("after final yield")
stream = values(); next(stream); assert trace == []
assert list(stream) == [] and trace == ["after final yield"]`,
`def errors(handle):
    for line in handle:
        if line.startswith("ERROR "): yield line.rstrip()
# Caller owns the file's with block; no entire-file materialization.
assert list(errors(["INFO ok\\n", "ERROR fail\\n"])) == ["ERROR fail"]`,
`def source(): yield from [1, 2]
stream = source(); assert list(stream) == [1, 2]
assert list(stream) == []
buffer = list(source())  # Intentional bounded materialization for reuse.
assert list(buffer) == list(buffer) == [1, 2]`],
'generator-pipelines': [
`filtered = (n for n in range(5) if n % 2 == 0)
transformed = (n*n for n in filtered)
assert list(transformed) == [0, 4, 16]`,
`def combined():
    yield from [1, 2]
    yield from [3]
assert list(combined()) == [1, 2, 3]`,
`import json
def errors(lines):
    records = (json.loads(line) for line in lines if line.strip())
    return (r for r in records if r["severity"] == "ERROR")
assert list(errors(['{"severity":"ERROR"}', '{"severity":"INFO"}'])) == [{"severity": "ERROR"}]`,
`def transform(source):
    for value in source: yield value * 2
# list(source) inside the stage would eagerly consume unbounded input.
from itertools import count, islice
assert list(islice(transform(count()), 3)) == [0, 2, 4]`],
'generator-cleanup': [
`trace = []
def values():
    try: yield 1
    finally: trace.append("closed")
stream = values(); next(stream); stream.close()
assert trace == ["closed"]`,
`trace = []
def values():
    try: yield 1
    finally: trace.append("closed")
assert list(values()) == [1]
stream = values(); next(stream); stream.close()
assert trace == ["closed", "closed"]`,
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
assert trace == ["closed"]`],
decorators: [
`def doubled(function):
    def wrapper(): return function() * 2
    return wrapper
def one(): return 1
manual = doubled(one)
@doubled
def decorated(): return 1
assert manual() == decorated() == 2`,
`def replace(function):
    return lambda: "replacement"
@replace
def original(): return "original"
assert original() == "replacement" and original.__name__ == "<lambda>"`,
`from functools import wraps
from time import perf_counter
def timed(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        start = perf_counter()
        try: return function(*args, **kwargs)
        finally: print(function.__name__, perf_counter() - start)
    return wrapper
assert timed(int)("2") == 2`,
`def decorate(function):
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper  # wrapper() would execute now and replace the callable with its result.
@decorate
def value(): return 3
assert callable(value) and value() == 3`],
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
assert add(1, b=2) == 3 and add.__name__ == "add" and add.__doc__ == "Add two values."`,
`from functools import wraps
def original():
    """Original docs."""
def bare(): pass
@wraps(original)
def wrapped(): pass
assert not hasattr(bare, "__wrapped__")
assert wrapped.__wrapped__ is original and wrapped.__doc__ == original.__doc__`,
`import inspect
from functools import wraps
def trace(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print("calling", function.__name__)
        return function(*args, **kwargs)
    return wrapper
def parse(text, *, strict=True): return int(text)
assert inspect.signature(trace(parse)) == inspect.signature(parse)`,
`from functools import wraps
def decorate(function):
    @wraps(function)
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper
@decorate
def parse(text, *, strict): return int(text) if strict else text
assert parse("2", strict=True) == 2 and parse.__name__ == "parse"`],
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
assert logged("API")(int)("2") == 2`,
`def above(threshold):
    def decorate(function):
        def wrapper(value): return function(value) > threshold
        return wrapper
    return decorate
@above(2)
def low(value): return value
@above(5)
def high(value): return value
assert low(3) and not high(3)`,
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
assert measure(12) and not measure(9)`],
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
run(); assert trace == ["enter A", "enter B", "exit B", "exit A"]`,
`trace = []
def tag(name):
    def decorate(function):
        def wrapper():
            trace.append(name); return function()
        return wrapper
    return decorate
def original(): return 1
wrapped = tag("A")(tag("B")(original))
assert wrapped() == 1 and trace == ["A", "B"]`,
`from functools import lru_cache
@lru_cache
def tenant_data(tenant, key): return (tenant, key)
def protected(auth, key):
    if "read" not in auth["scopes"]: raise PermissionError("denied")
    return tenant_data(auth["tenant"], key)
# Authorization runs every time, before the tenant-scoped cache lookup.
assert protected({"tenant": "a", "scopes": {"read"}}, "x") == ("a", "x")`,
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
assert trace == ["enter", "exit"]`,
`seen = []
class Scope:
    def __enter__(self): return self
    def __exit__(self, kind, value, traceback):
        seen.append((kind, str(value), traceback is not None)); return False
try:
    with Scope(): raise ValueError("bad")
except ValueError: pass
assert seen == [(ValueError, "bad", True)]`,
`from tempfile import TemporaryDirectory
from pathlib import Path
with TemporaryDirectory() as directory:
    output = Path(directory) / "report.txt"
    output.write_text("Report\\n", encoding="utf-8")
    assert output.exists()
assert not output.exists()`,
`class Scope:
    def __enter__(self): return self
    def __exit__(self, *exc): return False  # Never suppress accidentally.
try:
    with Scope(): raise ValueError("visible")
except ValueError as error: assert str(error) == "visible"
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
assert state["active"] is False`,
`from contextlib import contextmanager
@contextmanager
def override(config, key, value):
    missing = object(); old = config.get(key, missing); config[key] = value
    try: yield config
    finally:
        if old is missing: config.pop(key, None)
        else: config[key] = old
config = {"timeout": 30}
with override(config, "timeout", 0): assert config["timeout"] == 0
assert config["timeout"] == 30`,
`from contextlib import contextmanager
trace = []
@contextmanager
def scope():
    try: yield
    finally: trace.append("restored")
try:
    with scope(): raise RuntimeError("failed")
except RuntimeError: pass
assert trace == ["restored"]
# An unprotected statement after yield is skipped when the body raises.`]
};
