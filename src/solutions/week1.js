export default {
bindings: [
`a = [1]
b = a
print(a is b)  # Expected: True
# a ─┐
# b ─┴─> [1]`,
`a = [1]
b = a
b = [2]
print(a, b)  # Expected values: [1]; [2]
print(a is not b)  # Expected: True`,
`config = {"timeout": 30}
def handle(request, settings):
    # settings refers to the same configuration passed by the caller.
    local = {**settings, **request}
    return local["timeout"]
print(handle({'timeout': 0}, config))  # Expected: 0
print(config)  # Expected: {"timeout": 30}
# The handler's binding ends on return; the module still owns config.`,
`a = [1]
b = a
b = []  # Rebinds b, leaving a's object unchanged.
print(a)  # Expected: [1]
b = a
b.clear()  # Mutates the shared object instead.
print(a)  # Expected: []`],
mutability: [
`items = []; before = id(items)
items.append(1)
print(id(items) == before)  # True: mutation keeps the same object.
n = 1000; old = n
n += 1
print(n is not old)  # Expected: True`,
`outer = ([1],)
before = id(outer)
outer[0].append(2)
print(outer, id(outer))  # Expected values: ([1, 2],); before
# The inner list changes; tuple references stay fixed.`,
`def normalize(events):
    """Return new records; never mutate caller records."""
    return [{**e, "level": e["level"].upper()} for e in events]
source = [{"level": "info"}]
print(normalize(source))  # Expected: [{"level": "INFO"}]
print(source)  # Expected: [{"level": "info"}]`,
`def broken(events):
    events[0]["level"] = "INFO"
source = [{"level": "info"}]
broken(source)
print(source[0]['level'])  # Expected: "INFO"  # Aliased input was modified.
def fixed(events):
    return [{**e, "level": e["level"].upper()} for e in events]
source = [{"level": "info"}]; fixed(source)
print(source[0]['level'])  # Expected: "info"`],
identity: [
`a = [1]; b = [1]
print(a)  # Expected: b
print(a is not b)  # Expected: True`,
`a = {"x": 1}; b = {"x": 1}
print(a == b and a is not b)  # Expected: True`,
`def value_or_default(value):
    return "missing" if value is None else value
print(value_or_default(None))  # Expected: "missing"
print(value_or_default(''))  # Expected: ""`,
`expected = "error level"
received = " ".join(["error", "level"])
print(received)  # Expected: expected
print(received is expected)  # Object reuse is not a value contract.
def is_error(text):
    return text == "error level"
print(is_error(received))  # Expected: True`],
truth: [
`print([bool(x) for x in (None, 0, [])])  # Expected: [False, False, False]`,
`for x in (None, "", 0, False):
    print(repr(x), type(x).__name__, x is None, bool(x))
# All are false in conditions; only None represents absence here.`,
`def timeout(supplied=None):
    return 30 if supplied is None else supplied
print(timeout(0), timeout())  # Expected values: 0; 30`,
`supplied = 0
print(supplied or 30)  # Expected: 30  # Bug: drops a valid zero.
timeout = 30 if supplied is None else supplied
print(timeout)  # Expected: 0`],
numbers: [
`from decimal import Decimal
print(0.1 + 0.2 != 0.3)  # Expected: True
print(Decimal('0.1') + Decimal('0.2'))  # Expected: Decimal("0.3")`,
`from decimal import Decimal, ROUND_HALF_UP
print([Decimal(x).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) for x in ('1.005', '2.005')])  # Expected: [Decimal("1.01"), Decimal("2.01")]`,
`from decimal import Decimal, ROUND_HALF_UP
def invoice(lines):
    # Policy: round the invoice total once, half up, to cents.
    total = sum((Decimal(price) * quantity for price, quantity in lines), Decimal(0))
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
print(invoice([('1.005', 2)]))  # Expected: Decimal("2.01")`,
`from decimal import Decimal
print(Decimal(0.1) != Decimal('0.1'))  # Expected: True
# The float already lost the exact decimal representation.
amount = Decimal("0.1")
print(amount * 3)  # Expected: Decimal("0.3")`],
strings: [
`text = "café"
print(text[-1:])  # Expected: "é"
print(len(text), len(text.encode('utf-8')))  # Expected values: 4; 5`,
`text = "Python"
print(text[::-1])  # Expected: "nohtyP"
print(text[:], text[99:])  # Expected values: text; ''`,
`def parse(raw):
    original = raw.decode("utf-8")
    level, message = original.rstrip("\\n").split(" ", 1)
    return {"level": level, "message": message, "original": original}
print(parse('INFO café'.encode())['message'])  # Expected: "café"`,
`raw = "éx".encode("utf-8")
try:
    raw[:1].decode("utf-8")
except UnicodeDecodeError:
    pass
print(raw.decode('utf-8')[:1])  # Expected: "é"  # Decode before slicing characters.`],
lists: [
`a = [1]; b = [1]
a.append([2, 3]); b.extend([2, 3])
print(a, b)  # Expected values: [1, [2, 3]]; [1, 2, 3]`,
`xs = [10, 20, 30]
print(xs[-1])  # Expected: xs[2]
try:
    xs[3]
except IndexError:
    print("Valid positive indexes are 0 through 2")`,
`def normalize(events):
    return [{**e, "level": e["level"].upper()} for e in events]
print([e['id'] for e in normalize([{'id': 2, 'level': 'info'}, {'id': 1, 'level': 'error'}])])  # Expected: [2, 1]`,
`xs = [0, 0, 1]
for x in xs:
    if x == 0: xs.remove(x)
print(xs)  # Expected: [0, 1]  # Index shifts skip the second zero.
xs = [x for x in [0, 0, 1] if x != 0]
print(xs)  # Expected: [1]`],
dicts: [
`counts = {}
for level in ["INFO", "ERROR", "INFO"]:
    counts[level] = counts.get(level, 0) + 1
print(counts)  # Expected: {"INFO": 2, "ERROR": 1}`,
`d = {"present": None}
print(d['present'] is None and d.get('missing') is None)  # Expected: True
print('present' in d and 'missing' not in d)  # Expected: True
try: d["missing"]
except KeyError: print("Direct lookup distinguishes missing keys")`,
`def totals(events):
    result = {}
    for event in events:
        key = event["customer_id"]
        result[key] = result.get(key, 0) + event["amount"]
    return result
print(totals([{'customer_id': 'c1', 'amount': 2}, {'customer_id': 'c1', 'amount': 3}]))  # Expected: {"c1": 5}`,
`shared = []; bad = {}
for key in ("a", "b"): bad.setdefault(key, shared).append(key)
print(bad['a'] is bad['b'])  # Expected: True
good = {}
for key in ("a", "b"): good.setdefault(key, []).append(key)
print(good)  # Expected: {"a": ["a"], "b": ["b"]}`],
sets: [
`print({'c1', 'c2'} & {'c2', 'c3'})  # Expected: {"c2"}`,
`seen = {(1, 2)}
try: seen.add((1, []))
except TypeError: print("All tuple members must also be hashable")`,
`events = [{"id": "e1", "amount": 3}, {"id": "e1", "amount": 3}]
unique = {}
for event in events: unique.setdefault(event["id"], event)
print(sum((e['amount'] for e in unique.values())))  # Expected: 3
# Policy: first occurrence wins; reject conflicts if payloads can differ.`,
`try: set([[1, 2]])
except TypeError: pass
print(set([tuple([1, 2]), tuple([1, 2])]))  # Expected: {(1, 2)}
# Tuple preserves order; frozenset would discard order and duplicates.`],
unpack: [
`status, message, *rest = [200, "OK", "trace-1", 42]
print((status, message, rest))  # Expected: (200, "OK", ["trace-1", 42])`,
`for row in ([1, 2], [1, 2, 3, 4]):
    first, *middle, last = row
    print(first)  # Expected: 1
    print(first, middle, last)`,
`def normalize(row):
    if len(row) < 2: raise ValueError("ID and name required")
    customer_id, name, *tags = row
    return {"customer_id": customer_id, "name": name, "tags": tags}
print(normalize(['c1', 'Ada'])['tags'])  # Expected: []`,
`row = (200, "OK", "trace-1")
try: status, message = row
except ValueError: pass
status, message, *metadata = row
print(metadata)  # Expected: ["trace-1"]`],
loops: [
`indexes = list(range(5))
print(indexes)  # Expected: [0, 1, 2, 3, 4]`,
`def contains_zero(xs):
    for x in xs:
        if x == 0: break
    else: return False
    return True
print(contains_zero([1, 0]) and (not contains_zero([1, 2])))  # Expected: True`,
`def records(lines):
    result = []
    for line in lines:
        if line == "END": break
        if not line.strip(): continue
        result.append(line)
    return result
print(records(['', 'INFO ok', 'END', 'ignored']))  # Expected: ["INFO ok"]`,
`count = 3
print(list(range(1, count)))  # Expected: [1, 2]
print(list(range(1, count + 1)))  # Expected: [1, 2, 3]  # Inclusive numbering.
print(list(range(count)))  # Expected: [0, 1, 2]  # Zero-based indexes.`],
comprehensions: [
`print([x * x for x in [-2, 0, 3] if x > 0])  # Expected: [9]`,
`print({w: len(w) for w in ['', 'cat', 'hello'] if w})  # Expected: {"cat": 3, "hello": 5}`,
`from collections import Counter
records = [{"level": "ERROR", "code": "E1"}, {"level": "INFO", "code": "I1"}]
counts = dict(Counter(r["code"] for r in records if r["level"] == "ERROR"))
print(counts)  # Expected: {"E1": 1}`,
`calls = []
def parse(text):
    calls.append(text)
    return int(text)
parsed = (parse(x) for x in ["0", "2"])
result = [x for x in parsed if x > 0]
print(result, calls)  # Expected values: [2]; ['0', '2']`],
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
print(records, errors[0][0])  # Expected values: [1]; 2`,
`def parse(text):
    try: return int(text)
    except ValueError: return None
print(parse('bad') is None)  # Expected: True
try: parse(None)
except TypeError: print("Programming contract errors remain visible")`],
files: [
`from pathlib import Path
from tempfile import TemporaryDirectory
with TemporaryDirectory() as directory:
    path = Path(directory) / "fixture.txt"
    path.write_text("café", encoding="utf-8")
    print(path.read_text(encoding='utf-8'))  # Expected: "café"`,
`from pathlib import Path
relative = Path("fixtures") / "events.log"
print(not relative.is_absolute())  # Expected: True
print(relative.resolve().is_absolute())  # Expected: True`,
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
print(decoded == value and isinstance(decoded['event']['ids'], list))  # Expected: True`,
`import json
print([type(json.loads(x)).__name__ for x in ['null', 'true', '3', '[]']])  # Expected: ["NoneType", "bool", "int", "list"]`,
`import json
def parse(text):
    record = json.loads(text)
    if not isinstance(record, dict) or "severity" not in record:
        raise ValueError("object with severity required")
    return record
print(parse('{"severity":"INFO"}')['severity'])  # Expected: "INFO"`,
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
print(normalize_level('info'))  # Expected: "INFO"`,
`def helper():
    """Normalize one record."""
    raise RuntimeError("not called during inspection")
print(helper.__doc__)  # Expected: "Normalize one record."`,
`def normalize(line):
    level, message = line.strip().split(" ", 1)
    return {"level": level.upper(), "message": message}
def read_records(handle):
    return [normalize(line) for line in handle if line.strip()]
print(read_records(['info hello'])[0]['level'])  # Expected: "INFO"`,
`def helper(): return "ready"
wrong = helper
print(callable(wrong))  # Expected: True
correct = helper()
print(correct.upper())  # Expected: "READY"`],
returns: [
`def summarize(xs): return len(xs), sum(xs)
print(summarize([2, 3]))  # Expected: (2, 5)`,
`def explicit(): return None
def bare(): return
def falling(): pass
print(explicit() is bare() is falling() is None)  # Expected: True`,
`def parse(line):
    """Return a level/message dict or raise ValueError."""
    level, message = line.split(" ", 1)
    if level not in {"INFO", "ERROR"}: raise ValueError("unsupported level")
    return {"level": level, "message": message}
print(parse('INFO ready')['message'])  # Expected: "ready"`,
`def broken(x):
    if x > 0: print(x)
    else: return 0
print(broken(1) is None)  # Expected: True
def fixed(x): return x if x > 0 else 0
print(fixed(1))  # Expected: 1`],
positional: [
`def divide(a, b): return a / b
print(divide(6, 2), divide(2, 6))  # Expected values: 3; 1 / 3`,
`def identity(value, /): return value
print(identity(1))  # Expected: 1
try: identity(value=1)
except TypeError: print("value is positional-only")`,
`def ratio(numerator, denominator):
    if denominator == 0: raise ValueError("denominator must be nonzero")
    return numerator / denominator
print(ratio(numerator=6, denominator=2))  # Expected: 3`,
`def transfer(*, source, destination): return (source, destination)
# Keyword-only names make the direction reviewable at each call site.
print(transfer(source='inbox', destination='archive'))  # Expected: ("inbox", "archive")`],
keywords: [
`def parse(text, *, strict): return int(text) if strict else text
print(parse('2', strict=True))  # Expected: 2`,
`def load(path, *, encoding): return path, encoding
try: load("a.txt")
except TypeError: print("encoding is required")`,
`def parse(raw, *, encoding="utf-8", strict=True):
    return raw.decode(encoding, errors="strict" if strict else "replace")
print(parse(b'hello', encoding='utf-8', strict=True))  # Expected: "hello"`,
`def inner(value): return value
try: inner(1, value=2)
except TypeError: pass
def wrapper(value): return inner(value=value)
print(wrapper(2))  # Expected: 2`],
defaults: [
`def make_default():
    print("created at definition")
    return 3
def run(attempts=make_default()): return attempts
print(run() == run() == 3)  # Expected: True`,
`def run(attempts=3): return attempts
print(run(), run(1))  # Expected values: 3; 1`,
`def retry_count(attempts=3):
    """Total attempts, including the first; callers may override."""
    if attempts < 1: raise ValueError("at least one attempt")
    return attempts
print(retry_count(), retry_count(attempts=1))  # Expected values: 3; 1`,
`from datetime import datetime, timezone
def stamp(timestamp=None):
    return datetime.now(timezone.utc) if timestamp is None else timestamp
fixed = datetime(2025, 1, 1, tzinfo=timezone.utc)
print(stamp(fixed) is fixed)  # Expected: True
# Calling now inside the body acquires time per invocation.`],
'mutable-defaults': [
`def collect(x, items=[]):
    items.append(x); return items
print(collect(1))  # Expected: [1]
print(collect(2))  # Expected: [1, 2]
print(collect.__defaults__[0])  # Expected: [1, 2]`,
`def collect(x, items=None):
    if items is None: items = []
    items.append(x); return items
print(collect(1), collect(2))  # Expected values: [1]; [2]
given = []; print(collect(3, given) is given)  # Expected: True`,
`def collect(record, buffer=None):
    """Allocate a buffer unless the caller explicitly supplies one."""
    if buffer is None: buffer = []
    buffer.append(record)
    return buffer
a, b = collect("a"), collect("b")
print(a == ['a'] and b == ['b'] and (a is not b))  # Expected: True`,
`def record(x, items=None):
    if items is None: items = []
    items.append(x)
    return items
print(record(1), record(2))  # Expected values: [1]; [2]
# A definition-time list was shared. The sentinel allocates per call.`],
args: [
`def total(*values): return sum(values)
print(total(1, 2, 3), total())  # Expected values: 6; 0`,
`def inspect(*args): return args
print(inspect(), inspect(1), inspect(1, 2, 3))  # Expected values: (); (1,); (1, 2, 3)`,
`def aggregate(*samples):
    return {"count": len(samples), "total": sum(samples),
            "mean": sum(samples)/len(samples) if samples else None}
print(aggregate(2, 4)['mean'] == 3 and aggregate()['mean'] is None)  # Expected: True`,
`def total(*args):
    # args is already the tuple; args[0] is the first scalar.
    return sum(value for value in args)
print(total(1, 2), total())  # Expected values: 3; 0`],
kwargs: [
`def labels(**kwargs): return kwargs
print(labels(region='eu', service='api'))  # Expected: {"region": "eu", "service": "api"}`,
`def metric(name, **options): return name, options
print(metric('latency', unit='ms', region='eu'))  # Expected: ("latency", {"unit": "ms", "region": "eu"})`,
`def log(message, **fields):
    allowed = {"customer_id", "trace_id"}
    if fields.keys() - allowed: raise ValueError("unsupported/reserved field")
    return {"message": message, **fields}
print(log('ready', trace_id='t1')['trace_id'])  # Expected: "t1"`,
`def configure(**options):
    unknown = options.keys() - {"timeout"}
    if unknown: raise TypeError(f"unknown options: {sorted(unknown)}")
    return options.get("timeout", 30)
try: configure(timout=1)
except TypeError: print("Typo rejected at boundary")`],
'argument-unpack': [
`def add(a, b): return a + b
print(add(*(1, 2)) == add(**{'a': 1, 'b': 2}) == 3)  # Expected: True`,
`def values(*, strict): return strict
print(values(*(), **{'strict': True}) is True)  # Expected: True`,
`def parse(text, *, strict): return int(text) if strict else text
config = {"strict": True}
if set(config) != {"strict"} or not isinstance(config["strict"], bool):
    raise ValueError("invalid config")
print(parse('4', **config))  # Expected: 4`,
`def run(*, timeout): return timeout
base = {"timeout": 30}; override = {"timeout": 0}
try: run(**base, **override)
except TypeError: pass
merged = {**base, **override}  # Explicit last-write-wins policy.
print(run(**merged))  # Expected: 0`],
annotations: [
`def parse(text: str) -> int: return int(text)
print(parse('2'))  # Expected: 2
print(parse(2))  # Expected: 2  # A static checker flags this call, Python does not.`,
`from typing import get_type_hints
def length(text: str) -> int: return len(text)
print(get_type_hints(length))  # Expected: {"text": str, "return": int}`,
`def normalize_level(level: str) -> str: return level.strip().upper()
def normalize_record(record: dict[str, str]) -> dict[str, str]:
    return {**record, "level": normalize_level(record["level"])}
print(normalize_record({'level': ' info '}))  # Expected: {"level": "INFO"}`,
`def double(x: int) -> int: return x * 2
print(double('2'))  # Expected: "22"  # Run a type checker to flag this misuse.
def validated_double(x: object) -> int:
    if type(x) is not int: raise TypeError("integer required")
    return double(x)
print(validated_double(2))  # Expected: 4`],
'function-objects': [
`formatters = {"upper": str.upper, "lower": str.lower}
print(formatters['upper']('Info'))  # Expected: "INFO"`,
`def greet(): return "hello"
alias = greet
print(alias is greet and alias() == 'hello')  # Expected: True
print(callable(greet) and (not callable(greet())) and (not callable(3)))  # Expected: True`,
`formatters = {"ERROR": lambda text: f"ALERT: {text}", "INFO": str}
def format_record(record):
    return formatters[record["level"]](record["message"])
print(format_record({'level': 'ERROR', 'message': 'disk'}))  # Expected: "ALERT: disk"`,
`calls = []
def formatter(): calls.append(1); return "ready"
registry = {"format": formatter}  # Store callable, not formatter().
print(calls)  # Expected: []
print(registry['format'](), calls)  # Expected values: 'ready'; [1]`],
'higher-order': [
`records = [{"age": 3}, {"age": 1}]
print(sorted(records, key=lambda r: r['age'])[0]['age'])  # Expected: 1`,
`def formatter(uppercase): return str.upper if uppercase else str.lower
print(formatter(True)('Info'), formatter(False)('Info'))  # Expected values: 'INFO'; 'info'`,
`def stage(records, normalize): return [normalize(record) for record in records]
print(stage([' info ', 'error'], lambda x: x.strip().upper()))  # Expected: ["INFO", "ERROR"]`,
`def apply(records, callback):
    return [callback(record) for record in records]
# callback consumes one record, not the whole list.
print(apply([{'n': 1}, {'n': 2}], lambda r: r['n'] * 2))  # Expected: [2, 4]`],
scope: [
`value = 5
def read(): return value
def local():
    value = 9
    return value
print(read(), local(), value)  # Expected values: 5; 9; 5`,
`items = []
def mutate(): items.append(1)
def rebind_locally():
    items = [2]
    return items
mutate(); print(items == [1] and rebind_locally() == [2])  # Expected: True
print(items)  # Expected: [1]`,
`def next_count(current): return current + 1
count = 0
count = next_count(count)
print(count)  # Expected: 1
# Explicit input/output removes hidden global coupling.`,
`count = 0
def broken():
    count += 1
try: broken()
except UnboundLocalError: pass
def fixed(count): return count + 1
print(fixed(count))  # Expected: 1`],
legb: [
`name = "global"
def outer():
    name = "enclosing"
    def inner(): return name
    return inner()
print(outer())  # Expected: "enclosing"`,
`name = "global"
def outer():
    name = "enclosing"
    def inner(): return name
    return inner()
print(outer(), name)  # Expected values: 'enclosing'; 'global'`,
`import builtins
namespace = {"list": [], "len": 3, "event_count": 4}
shadowed = sorted(name for name in namespace if name in vars(builtins))
print(shadowed)  # Expected: ["len", "list"]
# Rename these to events and length; audit function locals and parameters too.`,
`def broken():
    list = []
    return list((1, 2))
try: broken()
except TypeError: pass
def fixed():
    items = []
    return list((1, 2))
print(fixed())  # Expected: [1, 2]`],
closures: [
`def multiplier(factor):
    def multiply(value): return factor * value
    return multiply
twice, triple = multiplier(2), multiplier(3)
print(twice(4), triple(4))  # Expected values: 8; 12`,
`def counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment
a, b = counter(), counter()
print((a(), a(), b()))  # Expected: (1, 2, 1)`,
`def threshold_filter(minimum):
    return lambda record: record["severity"] >= minimum
warning = threshold_filter(30)
print(warning({'severity': 40}) and (not warning({'severity': 10})))  # Expected: True`,
`wrong = [lambda: i for i in range(3)]
print([f() for f in wrong])  # Expected: [2, 2, 2]
fixed = [lambda i=i: i for i in range(3)]
print([f() for f in fixed])  # Expected: [0, 1, 2]
# Defaults bind each iteration's value instead of sharing the loop cell.`]
};
