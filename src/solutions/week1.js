export default {
bindings: [
`a = [1]
b = a
assert a is b
# a ─┐
# b ─┴─> [1]`,
`a = [1]
b = a
b = [2]
assert a == [1] and b == [2]
assert a is not b`,
`config = {"timeout": 30}
def handle(request, settings):
    assert settings is config
    local = {**settings, **request}
    return local["timeout"]
assert handle({"timeout": 0}, config) == 0
assert config == {"timeout": 30}
# The handler's binding ends on return; the module still owns config.`,
`a = [1]
b = a
b = []  # Rebinds b, leaving a's object unchanged.
assert a == [1]
b = a
b.clear()  # Mutates the shared object instead.
assert a == []`],
mutability: [
`items = []; before = id(items)
items.append(1)
assert id(items) == before
n = 1000; old = n
n += 1
assert n is not old`,
`outer = ([1],)
before = id(outer)
outer[0].append(2)
assert outer == ([1, 2],) and id(outer) == before
# The inner list changes; tuple references stay fixed.`,
`def normalize(events):
    """Return new records; never mutate caller records."""
    return [{**e, "level": e["level"].upper()} for e in events]
source = [{"level": "info"}]
assert normalize(source) == [{"level": "INFO"}]
assert source == [{"level": "info"}]`,
`def broken(events):
    events[0]["level"] = "INFO"
source = [{"level": "info"}]
broken(source)
assert source[0]["level"] == "INFO"  # Aliased input was modified.
def fixed(events):
    return [{**e, "level": e["level"].upper()} for e in events]
source = [{"level": "info"}]; fixed(source)
assert source[0]["level"] == "info"`],
identity: [
`a = [1]; b = [1]
assert a == b
assert a is not b`,
`a = {"x": 1}; b = {"x": 1}
assert a == b and a is not b`,
`def value_or_default(value):
    return "missing" if value is None else value
assert value_or_default(None) == "missing"
assert value_or_default("") == ""`,
`expected = "error level"
received = " ".join(["error", "level"])
assert received == expected
print(received is expected)  # Object reuse is not a value contract.
def is_error(text):
    return text == "error level"
assert is_error(received)`],
truth: [
`assert [bool(x) for x in (None, 0, [])] == [False, False, False]`,
`for x in (None, "", 0, False):
    print(repr(x), type(x).__name__, x is None, bool(x))
# All are false in conditions; only None represents absence here.`,
`def timeout(supplied=None):
    return 30 if supplied is None else supplied
assert timeout(0) == 0 and timeout() == 30`,
`supplied = 0
assert (supplied or 30) == 30  # Bug: drops a valid zero.
timeout = 30 if supplied is None else supplied
assert timeout == 0`],
numbers: [
`from decimal import Decimal
assert 0.1 + 0.2 != 0.3
assert Decimal("0.1") + Decimal("0.2") == Decimal("0.3")`,
`from decimal import Decimal, ROUND_HALF_UP
assert [Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        for x in ("1.005", "2.005")] == [Decimal("1.01"), Decimal("2.01")]`,
`from decimal import Decimal, ROUND_HALF_UP
def invoice(lines):
    # Policy: round the invoice total once, half up, to cents.
    total = sum((Decimal(price) * quantity for price, quantity in lines), Decimal(0))
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
assert invoice([("1.005", 2)]) == Decimal("2.01")`,
`from decimal import Decimal
assert Decimal(0.1) != Decimal("0.1")
# The float already lost the exact decimal representation.
amount = Decimal("0.1")
assert amount * 3 == Decimal("0.3")`],
strings: [
`text = "café"
assert text[-1:] == "é"
assert len(text) == 4 and len(text.encode("utf-8")) == 5`,
`text = "Python"
assert text[::-1] == "nohtyP"
assert text[:] == text and text[99:] == ""`,
`def parse(raw):
    original = raw.decode("utf-8")
    level, message = original.rstrip("\\n").split(" ", 1)
    return {"level": level, "message": message, "original": original}
assert parse("INFO café".encode())["message"] == "café"`,
`raw = "éx".encode("utf-8")
try:
    raw[:1].decode("utf-8")
except UnicodeDecodeError:
    pass
assert raw.decode("utf-8")[:1] == "é"  # Decode before slicing characters.`],
lists: [
`a = [1]; b = [1]
a.append([2, 3]); b.extend([2, 3])
assert a == [1, [2, 3]] and b == [1, 2, 3]`,
`xs = [10, 20, 30]
assert xs[-1] == xs[2]
try:
    xs[3]
except IndexError:
    print("Valid positive indexes are 0 through 2")`,
`def normalize(events):
    return [{**e, "level": e["level"].upper()} for e in events]
assert [e["id"] for e in normalize([
    {"id": 2, "level": "info"}, {"id": 1, "level": "error"}
])] == [2, 1]`,
`xs = [0, 0, 1]
for x in xs:
    if x == 0: xs.remove(x)
assert xs == [0, 1]  # Index shifts skip the second zero.
xs = [x for x in [0, 0, 1] if x != 0]
assert xs == [1]`],
dicts: [
`counts = {}
for level in ["INFO", "ERROR", "INFO"]:
    counts[level] = counts.get(level, 0) + 1
assert counts == {"INFO": 2, "ERROR": 1}`, 
`d = {"present": None}
assert d["present"] is None and d.get("missing") is None
assert "present" in d and "missing" not in d
try: d["missing"]
except KeyError: print("Direct lookup distinguishes missing keys")`,
`def totals(events):
    result = {}
    for event in events:
        key = event["customer_id"]
        result[key] = result.get(key, 0) + event["amount"]
    return result
assert totals([{"customer_id": "c1", "amount": 2}, {"customer_id": "c1", "amount": 3}]) == {"c1": 5}`, 
`shared = []; bad = {}
for key in ("a", "b"): bad.setdefault(key, shared).append(key)
assert bad["a"] is bad["b"]
good = {}
for key in ("a", "b"): good.setdefault(key, []).append(key)
assert good == {"a": ["a"], "b": ["b"]}`],
sets: [
`assert {"c1", "c2"} & {"c2", "c3"} == {"c2"}`, 
`seen = {(1, 2)}
try: seen.add((1, []))
except TypeError: print("All tuple members must also be hashable")`,
`events = [{"id": "e1", "amount": 3}, {"id": "e1", "amount": 3}]
unique = {}
for event in events: unique.setdefault(event["id"], event)
assert sum(e["amount"] for e in unique.values()) == 3
# Policy: first occurrence wins; reject conflicts if payloads can differ.`,
`try: set([[1, 2]])
except TypeError: pass
assert set([tuple([1, 2]), tuple([1, 2])]) == {(1, 2)}
# Tuple preserves order; frozenset would discard order and duplicates.`],
unpack: [
`status, message, *rest = [200, "OK", "trace-1", 42]
assert (status, message, rest) == (200, "OK", ["trace-1", 42])`,
`for row in ([1, 2], [1, 2, 3, 4]):
    first, *middle, last = row
    assert first == 1
    print(first, middle, last)`,
`def normalize(row):
    if len(row) < 2: raise ValueError("ID and name required")
    customer_id, name, *tags = row
    return {"customer_id": customer_id, "name": name, "tags": tags}
assert normalize(["c1", "Ada"])["tags"] == []`,
`row = (200, "OK", "trace-1")
try: status, message = row
except ValueError: pass
status, message, *metadata = row
assert metadata == ["trace-1"]`],
loops: [
`indexes = list(range(5))
assert indexes == [0, 1, 2, 3, 4]`,
`def contains_zero(xs):
    for x in xs:
        if x == 0: break
    else: return False
    return True
assert contains_zero([1, 0]) and not contains_zero([1, 2])`,
`def records(lines):
    result = []
    for line in lines:
        if line == "END": break
        if not line.strip(): continue
        result.append(line)
    return result
assert records(["", "INFO ok", "END", "ignored"]) == ["INFO ok"]`,
`count = 3
assert list(range(1, count)) == [1, 2]
assert list(range(1, count + 1)) == [1, 2, 3]  # Inclusive numbering.
assert list(range(count)) == [0, 1, 2]  # Zero-based indexes.`],
comprehensions: [
`assert [x*x for x in [-2, 0, 3] if x > 0] == [9]`,
`assert {w: len(w) for w in ["", "cat", "hello"] if w} == {"cat": 3, "hello": 5}`, 
`from collections import Counter
records = [{"level": "ERROR", "code": "E1"}, {"level": "INFO", "code": "I1"}]
counts = dict(Counter(r["code"] for r in records if r["level"] == "ERROR"))
assert counts == {"E1": 1}`, 
`calls = []
def parse(text):
    calls.append(text)
    return int(text)
parsed = (parse(x) for x in ["0", "2"])
result = [x for x in parsed if x > 0]
assert result == [2] and calls == ["0", "2"]`],
exceptions: [
`def validate(level):
    if level not in {"INFO", "ERROR"}: raise ValueError("invalid level")
try: validate("UNKNOWN")
except ValueError as error: print(error)`,
`for text in ("1", "bad"):
    try:
        print("try"); int(text)
    except ValueError: print("except")
    else: print("else")
    finally: print("finally")`,
`def parse(lines):
    records, errors = [], []
    for number, line in enumerate(lines, 1):
        try: records.append(int(line))
        except ValueError as error: errors.append((number, line, str(error)))
    return records, errors
records, errors = parse(["1", "bad"])
assert records == [1] and errors[0][0] == 2`,
`def parse(text):
    try: return int(text)
    except ValueError: return None
assert parse("bad") is None
try: parse(None)
except TypeError: print("Programming contract errors remain visible")`],
files: [
`from pathlib import Path
from tempfile import TemporaryDirectory
with TemporaryDirectory() as directory:
    path = Path(directory) / "fixture.txt"
    path.write_text("café", encoding="utf-8")
    assert path.read_text(encoding="utf-8") == "café"`,
`from pathlib import Path
relative = Path("fixtures") / "events.log"
assert not relative.is_absolute()
assert relative.resolve().is_absolute()`,
`from pathlib import Path
def parse_file(path):
    with Path(path).open(encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            try: yield int(line)
            except ValueError as error:
                raise ValueError(f"{path}:{number}: invalid integer") from error
# list(parse_file("events.log")) consumes the stream.`,
`from pathlib import Path
def read_count(path):
    with Path(path).open(encoding="utf-8") as handle:
        return int(handle.read())
# On invalid input, ValueError propagates after __exit__ closes the file.
# Test with a temporary file containing 'bad', then delete it.`],
json: [
`import json
value = {"event": {"ids": [1, 2], "active": True}}
decoded = json.loads(json.dumps(value))
assert decoded == value and isinstance(decoded["event"]["ids"], list)`,
`import json
assert [type(json.loads(x)).__name__ for x in ["null", "true", "3", "[]"]] == ["NoneType", "bool", "int", "list"]`,
`import json
def parse(text):
    record = json.loads(text)
    if not isinstance(record, dict) or "severity" not in record:
        raise ValueError("object with severity required")
    return record
assert parse('{"severity":"INFO"}')["severity"] == "INFO"`,
`import json
def parse(text):
    result = json.loads(text)
    if not isinstance(result, dict): raise ValueError("expected JSON object")
    return result
try: parse("[]")
except ValueError: print("Valid syntax, invalid application shape")`],
define: [
`def normalize_level(level):
    return level.upper()
assert normalize_level("info") == "INFO"`,
`def helper():
    """Normalize one record."""
    raise RuntimeError("not called during inspection")
assert helper.__doc__ == "Normalize one record."`,
`def normalize(line):
    level, message = line.strip().split(" ", 1)
    return {"level": level.upper(), "message": message}
def read_records(handle):
    return [normalize(line) for line in handle if line.strip()]
assert read_records(["info hello"])[0]["level"] == "INFO"`,
`def helper(): return "ready"
wrong = helper
assert callable(wrong)
correct = helper()
assert correct.upper() == "READY"`],
returns: [
`def summarize(xs): return len(xs), sum(xs)
assert summarize([2, 3]) == (2, 5)`,
`def explicit(): return None
def bare(): return
def falling(): pass
assert explicit() is bare() is falling() is None`,
`def parse(line):
    """Return a level/message dict or raise ValueError."""
    level, message = line.split(" ", 1)
    if level not in {"INFO", "ERROR"}: raise ValueError("unsupported level")
    return {"level": level, "message": message}
assert parse("INFO ready")["message"] == "ready"`,
`def broken(x):
    if x > 0: print(x)
    else: return 0
assert broken(1) is None
def fixed(x): return x if x > 0 else 0
assert fixed(1) == 1`],
positional: [
`def divide(a, b): return a / b
assert divide(6, 2) == 3 and divide(2, 6) == 1/3`,
`def identity(value, /): return value
assert identity(1) == 1
try: identity(value=1)
except TypeError: print("value is positional-only")`,
`def ratio(numerator, denominator):
    if denominator == 0: raise ValueError("denominator must be nonzero")
    return numerator / denominator
assert ratio(numerator=6, denominator=2) == 3`,
`def transfer(*, source, destination): return (source, destination)
# Keyword-only names make the direction reviewable at each call site.
assert transfer(source="inbox", destination="archive") == ("inbox", "archive")`],
keywords: [
`def parse(text, *, strict): return int(text) if strict else text
assert parse("2", strict=True) == 2`,
`def load(path, *, encoding): return path, encoding
try: load("a.txt")
except TypeError: print("encoding is required")`,
`def parse(raw, *, encoding="utf-8", strict=True):
    return raw.decode(encoding, errors="strict" if strict else "replace")
assert parse(b"hello", encoding="utf-8", strict=True) == "hello"`,
`def inner(value): return value
try: inner(1, value=2)
except TypeError: pass
def wrapper(value): return inner(value=value)
assert wrapper(2) == 2`],
defaults: [
`def make_default():
    print("created at definition")
    return 3
def run(attempts=make_default()): return attempts
assert run() == run() == 3`,
`def run(attempts=3): return attempts
assert run() == 3 and run(1) == 1`,
`def retry_count(attempts=3):
    """Total attempts, including the first; callers may override."""
    if attempts < 1: raise ValueError("at least one attempt")
    return attempts
assert retry_count() == 3 and retry_count(attempts=1) == 1`,
`from datetime import datetime, timezone
def stamp(timestamp=None):
    return datetime.now(timezone.utc) if timestamp is None else timestamp
fixed = datetime(2025, 1, 1, tzinfo=timezone.utc)
assert stamp(fixed) is fixed
# Calling now inside the body acquires time per invocation.`],
'mutable-defaults': [
`def collect(x, items=[]):
    items.append(x); return items
assert collect(1) == [1]
assert collect(2) == [1, 2]
assert collect.__defaults__[0] == [1, 2]`,
`def collect(x, items=None):
    if items is None: items = []
    items.append(x); return items
assert collect(1) == [1] and collect(2) == [2]
given = []; assert collect(3, given) is given`,
`def collect(record, buffer=None):
    """Allocate a buffer unless the caller explicitly supplies one."""
    if buffer is None: buffer = []
    buffer.append(record)
    return buffer
a, b = collect("a"), collect("b")
assert a == ["a"] and b == ["b"] and a is not b`,
`def record(x, items=None):
    if items is None: items = []
    items.append(x)
    return items
assert record(1) == [1] and record(2) == [2]
# A definition-time list was shared. The sentinel allocates per call.`],
args: [
`def total(*values): return sum(values)
assert total(1, 2, 3) == 6 and total() == 0`,
`def inspect(*args): return args
assert inspect() == () and inspect(1) == (1,) and inspect(1, 2, 3) == (1, 2, 3)`,
`def aggregate(*samples):
    return {"count": len(samples), "total": sum(samples),
            "mean": sum(samples)/len(samples) if samples else None}
assert aggregate(2, 4)["mean"] == 3 and aggregate()["mean"] is None`,
`def total(*args):
    # args is already the tuple; args[0] is the first scalar.
    return sum(value for value in args)
assert total(1, 2) == 3 and total() == 0`],
kwargs: [
`def labels(**kwargs): return kwargs
assert labels(region="eu", service="api") == {"region": "eu", "service": "api"}`, 
`def metric(name, **options): return name, options
assert metric("latency", unit="ms", region="eu") == ("latency", {"unit": "ms", "region": "eu"})`,
`def log(message, **fields):
    allowed = {"customer_id", "trace_id"}
    if fields.keys() - allowed: raise ValueError("unsupported/reserved field")
    return {"message": message, **fields}
assert log("ready", trace_id="t1")["trace_id"] == "t1"`,
`def configure(**options):
    unknown = options.keys() - {"timeout"}
    if unknown: raise TypeError(f"unknown options: {sorted(unknown)}")
    return options.get("timeout", 30)
try: configure(timout=1)
except TypeError: print("Typo rejected at boundary")`],
'argument-unpack': [
`def add(a, b): return a + b
assert add(*(1, 2)) == add(**{"a": 1, "b": 2}) == 3`,
`def values(*, strict): return strict
assert values(*(), **{"strict": True}) is True`,
`def parse(text, *, strict): return int(text) if strict else text
config = {"strict": True}
if set(config) != {"strict"} or not isinstance(config["strict"], bool):
    raise ValueError("invalid config")
assert parse("4", **config) == 4`,
`def run(*, timeout): return timeout
base = {"timeout": 30}; override = {"timeout": 0}
try: run(**base, **override)
except TypeError: pass
merged = {**base, **override}  # Explicit last-write-wins policy.
assert run(**merged) == 0`],
annotations: [
`def parse(text: str) -> int: return int(text)
assert parse("2") == 2
assert parse(2) == 2  # A static checker flags this call, Python does not.`,
`from typing import get_type_hints
def length(text: str) -> int: return len(text)
assert get_type_hints(length) == {"text": str, "return": int}`,
`def normalize_level(level: str) -> str: return level.strip().upper()
def normalize_record(record: dict[str, str]) -> dict[str, str]:
    return {**record, "level": normalize_level(record["level"])}
assert normalize_record({"level": " info "}) == {"level": "INFO"}`, 
`def double(x: int) -> int: return x * 2
assert double("2") == "22"  # Run a type checker to flag this misuse.
def validated_double(x: object) -> int:
    if type(x) is not int: raise TypeError("integer required")
    return double(x)
assert validated_double(2) == 4`],
'function-objects': [
`formatters = {"upper": str.upper, "lower": str.lower}
assert formatters["upper"]("Info") == "INFO"`,
`def greet(): return "hello"
alias = greet
assert alias is greet and alias() == "hello"
assert callable(greet) and not callable(greet()) and not callable(3)`,
`formatters = {"ERROR": lambda text: f"ALERT: {text}", "INFO": str}
def format_record(record):
    return formatters[record["level"]](record["message"])
assert format_record({"level": "ERROR", "message": "disk"}) == "ALERT: disk"`,
`calls = []
def formatter(): calls.append(1); return "ready"
registry = {"format": formatter}  # Store callable, not formatter().
assert calls == []
assert registry["format"]() == "ready" and calls == [1]`],
'higher-order': [
`records = [{"age": 3}, {"age": 1}]
assert sorted(records, key=lambda r: r["age"])[0]["age"] == 1`,
`def formatter(uppercase): return str.upper if uppercase else str.lower
assert formatter(True)("Info") == "INFO" and formatter(False)("Info") == "info"`,
`def stage(records, normalize): return [normalize(record) for record in records]
assert stage([" info ", "error"], lambda x: x.strip().upper()) == ["INFO", "ERROR"]`,
`def apply(records, callback):
    return [callback(record) for record in records]
# callback consumes one record, not the whole list.
assert apply([{"n": 1}, {"n": 2}], lambda r: r["n"] * 2) == [2, 4]`],
scope: [
`value = 5
def read(): return value
def local():
    value = 9
    return value
assert read() == 5 and local() == 9 and value == 5`,
`items = []
def mutate(): items.append(1)
def rebind_locally():
    items = [2]
    return items
mutate(); assert items == [1] and rebind_locally() == [2]
assert items == [1]`,
`def next_count(current): return current + 1
count = 0
count = next_count(count)
assert count == 1
# Explicit input/output removes hidden global coupling.`,
`count = 0
def broken():
    count += 1
try: broken()
except UnboundLocalError: pass
def fixed(count): return count + 1
assert fixed(count) == 1`],
legb: [
`name = "global"
def outer():
    name = "enclosing"
    def inner(): return name
    return inner()
assert outer() == "enclosing"`,
`name = "global"
def outer():
    name = "enclosing"
    def inner(): return name
    return inner()
assert outer() == "enclosing" and name == "global"`,
`import builtins
namespace = {"list": [], "len": 3, "event_count": 4}
shadowed = sorted(name for name in namespace if name in vars(builtins))
assert shadowed == ["len", "list"]
# Rename these to events and length; audit function locals and parameters too.`,
`def broken():
    list = []
    return list((1, 2))
try: broken()
except TypeError: pass
def fixed():
    items = []
    return list((1, 2))
assert fixed() == [1, 2]`],
closures: [
`def multiplier(factor):
    def multiply(value): return factor * value
    return multiply
twice, triple = multiplier(2), multiplier(3)
assert twice(4) == 8 and triple(4) == 12`,
`def counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment
a, b = counter(), counter()
assert (a(), a(), b()) == (1, 2, 1)`,
`def threshold_filter(minimum):
    return lambda record: record["severity"] >= minimum
warning = threshold_filter(30)
assert warning({"severity": 40}) and not warning({"severity": 10})`,
`wrong = [lambda: i for i in range(3)]
assert [f() for f in wrong] == [2, 2, 2]
fixed = [lambda i=i: i for i in range(3)]
assert [f() for f in fixed] == [0, 1, 2]
# Defaults bind each iteration's value instead of sharing the loop cell.`]
};
