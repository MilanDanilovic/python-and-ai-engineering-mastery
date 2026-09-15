# Week 1

[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)

<a id="bindings"></a>

## Names, bindings, and references

Assignment binds a name to an object; rebinding a name does not modify other names.

**Why it matters:** Predicting aliases prevents accidental shared-state bugs.

**Prerequisites:** None

**Difficulty:** Foundational · **Code concepts:** assignment, id, type

[Official documentation](https://docs.python.org/3/reference/datamodel.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Bind two names to one list and draw the reference graph.

<details>
<summary>Reveal reference solution</summary>

```python
a = [1]
b = a
assert a is b
# a ─┐
# b ─┴─> [1]
```

</details>

### Simple exercise 2

Rebind one alias to a new list and verify that the other alias still refers to the original.

<details>
<summary>Reveal reference solution</summary>

```python
a = [1]
b = a
b = [2]
assert a == [1] and b == [2]
assert a is not b
```

</details>

### Practical exercise

Trace the lifetime of a configuration object through a request handler.

<details>
<summary>Reveal reference solution</summary>

```python
config = {"timeout": 30}
def handle(request, settings):
    assert settings is config
    local = {**settings, **request}
    return local["timeout"]
assert handle({"timeout": 0}, config) == 0
assert config == {"timeout": 30}
# The handler's binding ends on return; the module still owns config.
```

</details>

### Debugging exercise

A developer rebinds an alias to [] and expects the original list to empty. Reproduce and correct the assumption.

<details>
<summary>Reveal reference solution</summary>

```python
a = [1]
b = a
b = []  # Rebinds b, leaving a's object unchanged.
assert a == [1]
b = a
b.clear()  # Mutates the shared object instead.
assert a == []
```

</details>

**Interview question:** How does name binding differ from copying an object?

**Explain in your own words:** Explain names, bindings, and references in your own words. Use a concrete example to show why this is true: Assignment binds a name to an object; rebinding a name does not modify other names.

<a id="mutability"></a>

## Mutability

A mutable object can change in place while retaining its identity; immutable objects require a new value.

**Why it matters:** Function side effects depend on the objects passed in.

**Prerequisites:** [Names, bindings, and references](week-1.md#bindings)

**Difficulty:** Foundational · **Code concepts:** list.append, tuple, id

[Official documentation](https://docs.python.org/3/reference/datamodel.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Compare list.append with integer addition while recording identity.

<details>
<summary>Reveal reference solution</summary>

```python
items = []; before = id(items)
items.append(1)
assert id(items) == before
n = 1000; old = n
n += 1
assert n is not old
```

</details>

### Simple exercise 2

Put a list inside a tuple, mutate the list, and explain which object changed.

<details>
<summary>Reveal reference solution</summary>

```python
outer = ([1],)
before = id(outer)
outer[0].append(2)
assert outer == ([1, 2],) and id(outer) == before
# The inner list changes; tuple references stay fixed.
```

</details>

### Practical exercise

Design a log-normalization function with an explicit mutation contract.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize(events):
    """Return new records; never mutate caller records."""
    return [{**e, "level": e["level"].upper()} for e in events]
source = [{"level": "info"}]
assert normalize(source) == [{"level": "INFO"}]
assert source == [{"level": "info"}]
```

</details>

### Debugging exercise

A normalization helper changes its caller's event list. Identify the alias and make the ownership contract explicit.

<details>
<summary>Reveal reference solution</summary>

```python
def broken(events):
    events[0]["level"] = "INFO"
source = [{"level": "info"}]
broken(source)
assert source[0]["level"] == "INFO"  # Aliased input was modified.
def fixed(events):
    return [{**e, "level": e["level"].upper()} for e in events]
source = [{"level": "info"}]; fixed(source)
assert source[0]["level"] == "info"
```

</details>

**Interview question:** Can an immutable tuple contain mutable state?

**Explain in your own words:** Explain mutability in your own words. Use a concrete example to show why this is true: A mutable object can change in place while retaining its identity; immutable objects require a new value.

<a id="identity"></a>

## Equality versus identity

Equality compares values according to a type's protocol; identity tests whether two references name the same object.

**Why it matters:** Value comparisons must not depend on incidental object reuse.

**Prerequisites:** [Names, bindings, and references](week-1.md#bindings)

**Difficulty:** Foundational · **Code concepts:** ==, is, None

[Official documentation](https://docs.python.org/3/reference/datamodel.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Compare two equal but separately created lists with == and is.

<details>
<summary>Reveal reference solution</summary>

```python
a = [1]; b = [1]
assert a == b
assert a is not b
```

</details>

### Simple exercise 2

Create two distinct dictionaries with equal contents and test both identity and equality.

<details>
<summary>Reveal reference solution</summary>

```python
a = {"x": 1}; b = {"x": 1}
assert a == b and a is not b
```

</details>

### Practical exercise

Write a missing-value check that distinguishes None from a valid empty value.

<details>
<summary>Reveal reference solution</summary>

```python
def value_or_default(value):
    return "missing" if value is None else value
assert value_or_default(None) == "missing"
assert value_or_default("") == ""
```

</details>

### Debugging exercise

A parser uses is to compare dynamically built strings. Produce a failing case and repair it.

<details>
<summary>Reveal reference solution</summary>

```python
expected = "error level"
received = " ".join(["error", "level"])
assert received == expected
print(received is expected)  # Object reuse is not a value contract.
def is_error(text):
    return text == "error level"
assert is_error(received)
```

</details>

**Interview question:** When is an identity comparison appropriate?

**Explain in your own words:** Explain equality versus identity in your own words. Use a concrete example to show why this is true: Equality compares values according to a type's protocol; identity tests whether two references name the same object.

<a id="truth"></a>

## None and truth-value testing

None represents absence; empty containers and numeric zero are also false in boolean contexts.

**Why it matters:** Defaulting with or can silently discard valid values.

**Prerequisites:** [Equality versus identity](week-1.md#identity)

**Difficulty:** Foundational · **Code concepts:** None, bool, if, or

[Official documentation](https://docs.python.org/3/library/stdtypes.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Compare bool(None), bool(0), and bool([]).

<details>
<summary>Reveal reference solution</summary>

```python
assert [bool(x) for x in (None, 0, [])] == [False, False, False]
```

</details>

### Simple exercise 2

Write a decision table distinguishing None, an empty string, zero, and False.

<details>
<summary>Reveal reference solution</summary>

```python
for x in (None, "", 0, False):
    print(repr(x), type(x).__name__, x is None, bool(x))
# All are false in conditions; only None represents absence here.
```

</details>

### Practical exercise

Accept an explicit zero timeout while defaulting only a missing timeout.

<details>
<summary>Reveal reference solution</summary>

```python
def timeout(supplied=None):
    return 30 if supplied is None else supplied
assert timeout(0) == 0 and timeout() == 30
```

</details>

### Debugging exercise

A timeout = supplied or 30 expression rejects zero. Fix it without conflating absence and falsiness.

<details>
<summary>Reveal reference solution</summary>

```python
supplied = 0
assert (supplied or 30) == 30  # Bug: drops a valid zero.
timeout = 30 if supplied is None else supplied
assert timeout == 0
```

</details>

**Interview question:** How would you distinguish missing, empty, and zero?

**Explain in your own words:** Explain none and truth-value testing in your own words. Use a concrete example to show why this is true: None represents absence; empty containers and numeric zero are also false in boolean contexts.

<a id="numbers"></a>

## Numeric conversion and precision

Integers are arbitrary precision; binary floating point approximates many decimal fractions.

**Why it matters:** Money and measurement code need deliberate numeric representations.

**Prerequisites:** [Names, bindings, and references](week-1.md#bindings)

**Difficulty:** Foundational · **Code concepts:** int, float, Decimal

[Official documentation](https://docs.python.org/3/library/decimal.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Compare 0.1 + 0.2 with 0.3 and repeat using Decimal strings.

<details>
<summary>Reveal reference solution</summary>

```python
from decimal import Decimal
assert 0.1 + 0.2 != 0.3
assert Decimal("0.1") + Decimal("0.2") == Decimal("0.3")
```

</details>

### Simple exercise 2

Round two Decimal values at a half-cent boundary using an explicit rounding mode.

<details>
<summary>Reveal reference solution</summary>

```python
from decimal import Decimal, ROUND_HALF_UP
assert [Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        for x in ("1.005", "2.005")] == [Decimal("1.01"), Decimal("2.01")]
```

</details>

### Practical exercise

Calculate invoice totals with an explicit rounding policy.

<details>
<summary>Reveal reference solution</summary>

```python
from decimal import Decimal, ROUND_HALF_UP
def invoice(lines):
    # Policy: round the invoice total once, half up, to cents.
    total = sum((Decimal(price) * quantity for price, quantity in lines), Decimal(0))
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
assert invoice([("1.005", 2)]) == Decimal("2.01")
```

</details>

### Debugging exercise

Decimal(0.1) preserves a binary approximation. Explain and fix the constructor input.

<details>
<summary>Reveal reference solution</summary>

```python
from decimal import Decimal
assert Decimal(0.1) != Decimal("0.1")
# The float already lost the exact decimal representation.
amount = Decimal("0.1")
assert amount * 3 == Decimal("0.3")
```

</details>

**Interview question:** Why is floating-point equality unreliable for some calculations?

**Explain in your own words:** Explain numeric conversion and precision in your own words. Use a concrete example to show why this is true: Integers are arbitrary precision; binary floating point approximates many decimal fractions.

<a id="strings"></a>

## Strings, Unicode, and slicing

Strings are immutable Unicode sequences; slicing selects a subsequence with an exclusive stop.

**Why it matters:** Text processing must distinguish characters from encoded bytes.

**Prerequisites:** [Names, bindings, and references](week-1.md#bindings)

**Difficulty:** Foundational · **Code concepts:** str, encode, decode, slicing

[Official documentation](https://docs.python.org/3/library/stdtypes.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Slice and encode a string containing a non-ASCII character.

<details>
<summary>Reveal reference solution</summary>

```python
text = "café"
assert text[-1:] == "é"
assert len(text) == 4 and len(text.encode("utf-8")) == 5
```

</details>

### Simple exercise 2

Reverse a string with slicing and compare a full slice with an out-of-range slice.

<details>
<summary>Reveal reference solution</summary>

```python
text = "Python"
assert text[::-1] == "nohtyP"
assert text[:] == text and text[99:] == ""
```

</details>

### Practical exercise

Parse a UTF-8 log line while preserving the original text.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(raw):
    original = raw.decode("utf-8")
    level, message = original.rstrip("\n").split(" ", 1)
    return {"level": level, "message": message, "original": original}
assert parse("INFO café".encode())["message"] == "café"
```

</details>

### Debugging exercise

A parser slices encoded bytes mid-character and fails decoding. Repair the processing order.

<details>
<summary>Reveal reference solution</summary>

```python
raw = "éx".encode("utf-8")
try:
    raw[:1].decode("utf-8")
except UnicodeDecodeError:
    pass
assert raw.decode("utf-8")[:1] == "é"  # Decode before slicing characters.
```

</details>

**Interview question:** How do byte length and string length differ?

**Explain in your own words:** Explain strings, unicode, and slicing in your own words. Use a concrete example to show why this is true: Strings are immutable Unicode sequences; slicing selects a subsequence with an exclusive stop.

<a id="lists"></a>

## Lists and sequence operations

Lists preserve order and support in-place updates; slicing creates a new outer list.

**Why it matters:** Stable ordering and explicit mutation simplify transformations.

**Prerequisites:** [Mutability](week-1.md#mutability)

**Difficulty:** Foundational · **Code concepts:** list, append, extend, enumerate

[Official documentation](https://docs.python.org/3/tutorial/datastructures.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Contrast append([2, 3]) with extend([2, 3]).

<details>
<summary>Reveal reference solution</summary>

```python
a = [1]; b = [1]
a.append([2, 3]); b.extend([2, 3])
assert a == [1, [2, 3]] and b == [1, 2, 3]
```

</details>

### Simple exercise 2

Compare a negative index with its positive equivalent and demonstrate an invalid index.

<details>
<summary>Reveal reference solution</summary>

```python
xs = [10, 20, 30]
assert xs[-1] == xs[2]
try:
    xs[3]
except IndexError:
    print("Valid positive indexes are 0 through 2")
```

</details>

### Practical exercise

Maintain an ordered list of normalized log events.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize(events):
    return [{**e, "level": e["level"].upper()} for e in events]
assert [e["id"] for e in normalize([
    {"id": 2, "level": "info"}, {"id": 1, "level": "error"}
])] == [2, 1]
```

</details>

### Debugging exercise

Removing matching items while iterating skips adjacent entries. Reproduce and replace with filtering.

<details>
<summary>Reveal reference solution</summary>

```python
xs = [0, 0, 1]
for x in xs:
    if x == 0: xs.remove(x)
assert xs == [0, 1]  # Index shifts skip the second zero.
xs = [x for x in [0, 0, 1] if x != 0]
assert xs == [1]
```

</details>

**Interview question:** When would you use a list comprehension instead of mutation?

**Explain in your own words:** Explain lists and sequence operations in your own words. Use a concrete example to show why this is true: Lists preserve order and support in-place updates; slicing creates a new outer list.

<a id="dicts"></a>

## Dictionary lookup and aggregation

Dictionaries associate hashable keys with values and preserve insertion order.

**Why it matters:** Most application data transformation starts with keyed lookup.

**Prerequisites:** [Lists and sequence operations](week-1.md#lists)

**Difficulty:** Foundational · **Code concepts:** dict, get, items, setdefault

[Official documentation](https://docs.python.org/3/tutorial/datastructures.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Count three repeated event levels with a dictionary.

<details>
<summary>Reveal reference solution</summary>

```python
counts = {}
for level in ["INFO", "ERROR", "INFO"]:
    counts[level] = counts.get(level, 0) + 1
assert counts == {"INFO": 2, "ERROR": 1}
```

</details>

### Simple exercise 2

Compare direct lookup, get, and membership for a missing key and a key mapped to None.

<details>
<summary>Reveal reference solution</summary>

```python
d = {"present": None}
assert d["present"] is None and d.get("missing") is None
assert "present" in d and "missing" not in d
try: d["missing"]
except KeyError: print("Direct lookup distinguishes missing keys")
```

</details>

### Practical exercise

Group customer events by customer ID and compute totals.

<details>
<summary>Reveal reference solution</summary>

```python
def totals(events):
    result = {}
    for event in events:
        key = event["customer_id"]
        result[key] = result.get(key, 0) + event["amount"]
    return result
assert totals([{"customer_id": "c1", "amount": 2}, {"customer_id": "c1", "amount": 3}]) == {"c1": 5}
```

</details>

### Debugging exercise

A shared list passed as a default groups unrelated keys together. Locate the alias.

<details>
<summary>Reveal reference solution</summary>

```python
shared = []; bad = {}
for key in ("a", "b"): bad.setdefault(key, shared).append(key)
assert bad["a"] is bad["b"]
good = {}
for key in ("a", "b"): good.setdefault(key, []).append(key)
assert good == {"a": ["a"], "b": ["b"]}
```

</details>

**Interview question:** What is the distinction between a missing key and a key mapped to None?

**Explain in your own words:** Explain dictionary lookup and aggregation in your own words. Use a concrete example to show why this is true: Dictionaries associate hashable keys with values and preserve insertion order.

<a id="sets"></a>

## Sets and hashability

Sets eliminate duplicate hashable values; equality and hashing must remain consistent.

**Why it matters:** Deduplication and membership checks need stable keys.

**Prerequisites:** [Equality versus identity](week-1.md#identity)

**Difficulty:** Foundational · **Code concepts:** set, frozenset, hash

[Official documentation](https://docs.python.org/3/tutorial/datastructures.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Compute the intersection of two customer-ID sets.

<details>
<summary>Reveal reference solution</summary>

```python
assert {"c1", "c2"} & {"c2", "c3"} == {"c2"}
```

</details>

### Simple exercise 2

Add a tuple to a set, then try a tuple containing a list and explain the different results.

<details>
<summary>Reveal reference solution</summary>

```python
seen = {(1, 2)}
try: seen.add((1, []))
except TypeError: print("All tuple members must also be hashable")
```

</details>

### Practical exercise

Deduplicate repeated event identifiers before aggregation.

<details>
<summary>Reveal reference solution</summary>

```python
events = [{"id": "e1", "amount": 3}, {"id": "e1", "amount": 3}]
unique = {}
for event in events: unique.setdefault(event["id"], event)
assert sum(e["amount"] for e in unique.values()) == 3
# Policy: first occurrence wins; reject conflicts if payloads can differ.
```

</details>

### Debugging exercise

Putting a list into a set raises TypeError. Choose a stable representation and explain the tradeoff.

<details>
<summary>Reveal reference solution</summary>

```python
try: set([[1, 2]])
except TypeError: pass
assert set([tuple([1, 2]), tuple([1, 2])]) == {(1, 2)}
# Tuple preserves order; frozenset would discard order and duplicates.
```

</details>

**Interview question:** Why are mutable lists not valid set members?

**Explain in your own words:** Explain sets and hashability in your own words. Use a concrete example to show why this is true: Sets eliminate duplicate hashable values; equality and hashing must remain consistent.

<a id="unpack"></a>

## Tuple and sequence unpacking

Unpacking assigns sequence elements to names, with an optional starred remainder.

**Why it matters:** Explicit structure makes transformations easier to read.

**Prerequisites:** [Lists and sequence operations](week-1.md#lists)

**Difficulty:** Foundational · **Code concepts:** tuple, starred assignment

[Official documentation](https://docs.python.org/3/tutorial/datastructures.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Unpack a status code, message, and remaining fields.

<details>
<summary>Reveal reference solution</summary>

```python
status, message, *rest = [200, "OK", "trace-1", 42]
assert (status, message, rest) == (200, "OK", ["trace-1", 42])
```

</details>

### Simple exercise 2

Capture the first and last items with a starred middle, including a two-item input.

<details>
<summary>Reveal reference solution</summary>

```python
for row in ([1, 2], [1, 2, 3, 4]):
    first, *middle, last = row
    assert first == 1
    print(first, middle, last)
```

</details>

### Practical exercise

Normalize variable-length CSV rows into named local values.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize(row):
    if len(row) < 2: raise ValueError("ID and name required")
    customer_id, name, *tags = row
    return {"customer_id": customer_id, "name": name, "tags": tags}
assert normalize(["c1", "Ada"])["tags"] == []
```

</details>

### Debugging exercise

A two-name assignment receives three values. Handle the extra fields deliberately.

<details>
<summary>Reveal reference solution</summary>

```python
row = (200, "OK", "trace-1")
try: status, message = row
except ValueError: pass
status, message, *metadata = row
assert metadata == ["trace-1"]
```

</details>

**Interview question:** How does starred unpacking affect the required sequence length?

**Explain in your own words:** Explain tuple and sequence unpacking in your own words. Use a concrete example to show why this is true: Unpacking assigns sequence elements to names, with an optional starred remainder.

<a id="loops"></a>

## Loops, range, and conditions

A for loop consumes an iterable; range uses an exclusive endpoint and conditional branches select behavior.

**Why it matters:** Boundary reasoning prevents omitted or duplicated work.

**Prerequisites:** [None and truth-value testing](week-1.md#truth), [Lists and sequence operations](week-1.md#lists)

**Difficulty:** Foundational · **Code concepts:** for, while, range, break, continue

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Generate indexes for five records and verify the final index.

<details>
<summary>Reveal reference solution</summary>

```python
indexes = list(range(5))
assert indexes == [0, 1, 2, 3, 4]
```

</details>

### Simple exercise 2

Write a loop with break and else; demonstrate both branches with different inputs.

<details>
<summary>Reveal reference solution</summary>

```python
def contains_zero(xs):
    for x in xs:
        if x == 0: break
    else: return False
    return True
assert contains_zero([1, 0]) and not contains_zero([1, 2])
```

</details>

### Practical exercise

Scan log entries until a termination marker while skipping blank rows.

<details>
<summary>Reveal reference solution</summary>

```python
def records(lines):
    result = []
    for line in lines:
        if line == "END": break
        if not line.strip(): continue
        result.append(line)
    return result
assert records(["", "INFO ok", "END", "ignored"]) == ["INFO ok"]
```

</details>

### Debugging exercise

range(1, count) omits the last numbered record. Specify the intended interval and fix it.

<details>
<summary>Reveal reference solution</summary>

```python
count = 3
assert list(range(1, count)) == [1, 2]
assert list(range(1, count + 1)) == [1, 2, 3]  # Inclusive numbering.
assert list(range(count)) == [0, 1, 2]  # Zero-based indexes.
```

</details>

**Interview question:** How does loop else differ from an if else?

**Explain in your own words:** Explain loops, range, and conditions in your own words. Use a concrete example to show why this is true: A for loop consumes an iterable; range uses an exclusive endpoint and conditional branches select behavior.

<a id="comprehensions"></a>

## Comprehensions and filtering

A comprehension expresses a transformation and optional predicate while creating a collection.

**Why it matters:** Readable transformations reduce stateful loops.

**Prerequisites:** [Loops, range, and conditions](week-1.md#loops), [Dictionary lookup and aggregation](week-1.md#dicts)

**Difficulty:** Foundational · **Code concepts:** list comprehension, dict comprehension

[Official documentation](https://docs.python.org/3/tutorial/datastructures.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Filter positive numbers and square the survivors.

<details>
<summary>Reveal reference solution</summary>

```python
assert [x*x for x in [-2, 0, 3] if x > 0] == [9]
```

</details>

### Simple exercise 2

Create a dictionary comprehension that maps each nonempty word to its length.

<details>
<summary>Reveal reference solution</summary>

```python
assert {w: len(w) for w in ["", "cat", "hello"] if w} == {"cat": 3, "hello": 5}
```

</details>

### Practical exercise

Build a dictionary of error counts from parsed records.

<details>
<summary>Reveal reference solution</summary>

```python
from collections import Counter
records = [{"level": "ERROR", "code": "E1"}, {"level": "INFO", "code": "I1"}]
counts = dict(Counter(r["code"] for r in records if r["level"] == "ERROR"))
assert counts == {"E1": 1}
```

</details>

### Debugging exercise

A comprehension calls an expensive parser twice per item. Refactor to evaluate once.

<details>
<summary>Reveal reference solution</summary>

```python
calls = []
def parse(text):
    calls.append(text)
    return int(text)
parsed = (parse(x) for x in ["0", "2"])
result = [x for x in parsed if x > 0]
assert result == [2] and calls == ["0", "2"]
```

</details>

**Interview question:** When does a comprehension become less readable than a loop?

**Explain in your own words:** Explain comprehensions and filtering in your own words. Use a concrete example to show why this is true: A comprehension expresses a transformation and optional predicate while creating a collection.

<a id="exceptions"></a>

## Raising and handling exceptions

Exceptions transfer control to a matching handler; finally supports cleanup across success and failure.

**Why it matters:** Precise failures protect callers from silent corruption.

**Prerequisites:** [None and truth-value testing](week-1.md#truth), [Loops, range, and conditions](week-1.md#loops)

**Difficulty:** Foundational · **Code concepts:** raise, try, except, finally

[Official documentation](https://docs.python.org/3/tutorial/errors.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Raise ValueError for an invalid log level and catch it specifically.

<details>
<summary>Reveal reference solution</summary>

```python
def validate(level):
    if level not in {"INFO", "ERROR"}: raise ValueError("invalid level")
try: validate("UNKNOWN")
except ValueError as error: print(error)
```

</details>

### Simple exercise 2

Trace the order of try, except, else, and finally for successful and failing operations.

<details>
<summary>Reveal reference solution</summary>

```python
for text in ("1", "bad"):
    try:
        print("try"); int(text)
    except ValueError: print("except")
    else: print("else")
    finally: print("finally")
```

</details>

### Practical exercise

Skip malformed records while recording a reason and source line.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(lines):
    records, errors = [], []
    for number, line in enumerate(lines, 1):
        try: records.append(int(line))
        except ValueError as error: errors.append((number, line, str(error)))
    return records, errors
records, errors = parse(["1", "bad"])
assert records == [1] and errors[0][0] == 2
```

</details>

### Debugging exercise

A broad except hides a programming error as an empty result. Narrow the boundary.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(text):
    try: return int(text)
    except ValueError: return None
assert parse("bad") is None
try: parse(None)
except TypeError: print("Programming contract errors remain visible")
```

</details>

**Interview question:** What is lost when every exception becomes None?

**Explain in your own words:** Explain raising and handling exceptions in your own words. Use a concrete example to show why this is true: Exceptions transfer control to a matching handler; finally supports cleanup across success and failure.

<a id="files"></a>

## File handling with pathlib

Path objects describe paths; context managers close opened files when a block exits.

**Why it matters:** Deterministic cleanup makes batch jobs dependable.

**Prerequisites:** [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Foundational · **Code concepts:** Path, open, with, encoding

[Official documentation](https://docs.python.org/3/library/pathlib.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Read a UTF-8 fixture with an explicit encoding.

<details>
<summary>Reveal reference solution</summary>

```python
from pathlib import Path
from tempfile import TemporaryDirectory
with TemporaryDirectory() as directory:
    path = Path(directory) / "fixture.txt"
    path.write_text("café", encoding="utf-8")
    assert path.read_text(encoding="utf-8") == "café"
```

</details>

### Simple exercise 2

Join paths with pathlib and compare relative and resolved absolute paths.

<details>
<summary>Reveal reference solution</summary>

```python
from pathlib import Path
relative = Path("fixtures") / "events.log"
assert not relative.is_absolute()
assert relative.resolve().is_absolute()
```

</details>

### Practical exercise

Stream a log file and include line numbers in parse errors.

<details>
<summary>Reveal reference solution</summary>

```python
from pathlib import Path
def parse_file(path):
    with Path(path).open(encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            try: yield int(line)
            except ValueError as error:
                raise ValueError(f"{path}:{number}: invalid integer") from error
# list(parse_file("events.log")) consumes the stream.
```

</details>

### Debugging exercise

An unclosed file handle survives a parse exception. Add cleanup without losing the exception.

<details>
<summary>Reveal reference solution</summary>

```python
from pathlib import Path
def read_count(path):
    with Path(path).open(encoding="utf-8") as handle:
        return int(handle.read())
# On invalid input, ValueError propagates after __exit__ closes the file.
# Test with a temporary file containing 'bad', then delete it.
```

</details>

**Interview question:** Why should file encoding be explicit?

**Explain in your own words:** Explain file handling with pathlib in your own words. Use a concrete example to show why this is true: Path objects describe paths; context managers close opened files when a block exits.

<a id="json"></a>

## JSON parsing and boundaries

JSON decoding produces basic Python values; it does not validate application-specific structure.

**Why it matters:** External data requires both parsing and domain validation.

**Prerequisites:** [Dictionary lookup and aggregation](week-1.md#dicts), [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Foundational · **Code concepts:** json.loads, json.dumps, JSONDecodeError

[Official documentation](https://docs.python.org/3/library/json.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Round-trip a nested event and inspect its decoded types.

<details>
<summary>Reveal reference solution</summary>

```python
import json
value = {"event": {"ids": [1, 2], "active": True}}
decoded = json.loads(json.dumps(value))
assert decoded == value and isinstance(decoded["event"]["ids"], list)
```

</details>

### Simple exercise 2

Decode a JSON null, boolean, number, and array and identify each Python type.

<details>
<summary>Reveal reference solution</summary>

```python
import json
assert [type(json.loads(x)).__name__ for x in ["null", "true", "3", "[]"]] == ["NoneType", "bool", "int", "list"]
```

</details>

### Practical exercise

Reject parsed log records that lack a required severity field.

<details>
<summary>Reveal reference solution</summary>

```python
import json
def parse(text):
    record = json.loads(text)
    if not isinstance(record, dict) or "severity" not in record:
        raise ValueError("object with severity required")
    return record
assert parse('{"severity":"INFO"}')["severity"] == "INFO"
```

</details>

### Debugging exercise

Valid JSON containing a list reaches code expecting a dict. Add shape validation.

<details>
<summary>Reveal reference solution</summary>

```python
import json
def parse(text):
    result = json.loads(text)
    if not isinstance(result, dict): raise ValueError("expected JSON object")
    return result
try: parse("[]")
except ValueError: print("Valid syntax, invalid application shape")
```

</details>

**Interview question:** How do JSON syntax validation and schema validation differ?

**Explain in your own words:** Explain json parsing and boundaries in your own words. Use a concrete example to show why this is true: JSON decoding produces basic Python values; it does not validate application-specific structure.

<a id="define"></a>

## Defining functions

def creates a callable and binds it to a name; its body runs on invocation.

**Why it matters:** Small named units make contracts testable.

**Prerequisites:** [Names, bindings, and references](week-1.md#bindings)

**Difficulty:** Foundational · **Code concepts:** def, call, docstring

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Define a function that converts a log level to uppercase.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize_level(level):
    return level.upper()
assert normalize_level("info") == "INFO"
```

</details>

### Simple exercise 2

Add a docstring to a helper and inspect it without calling the helper.

<details>
<summary>Reveal reference solution</summary>

```python
def helper():
    """Normalize one record."""
    raise RuntimeError("not called during inspection")
assert helper.__doc__ == "Normalize one record."
```

</details>

### Practical exercise

Extract record normalization from a file-reading loop.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize(line):
    level, message = line.strip().split(" ", 1)
    return {"level": level.upper(), "message": message}
def read_records(handle):
    return [normalize(line) for line in handle if line.strip()]
assert read_records(["info hello"])[0]["level"] == "INFO"
```

</details>

### Debugging exercise

A helper is referenced without parentheses and its result is treated as text. Trace the actual value.

<details>
<summary>Reveal reference solution</summary>

```python
def helper(): return "ready"
wrong = helper
assert callable(wrong)
correct = helper()
assert correct.upper() == "READY"
```

</details>

**Interview question:** When is a function body evaluated?

**Explain in your own words:** Explain defining functions in your own words. Use a concrete example to show why this is true: def creates a callable and binds it to a name; its body runs on invocation.

<a id="returns"></a>

## Return values

return ends a function invocation and provides a value; falling through returns None.

**Why it matters:** Callers need predictable result contracts.

**Prerequisites:** [Defining functions](week-1.md#define), [None and truth-value testing](week-1.md#truth)

**Difficulty:** Foundational · **Code concepts:** return, None, tuple

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Return both a count and a total from a helper.

<details>
<summary>Reveal reference solution</summary>

```python
def summarize(xs): return len(xs), sum(xs)
assert summarize([2, 3]) == (2, 5)
```

</details>

### Simple exercise 2

Compare explicit return None, bare return, and falling off the end of a function.

<details>
<summary>Reveal reference solution</summary>

```python
def explicit(): return None
def bare(): return
def falling(): pass
assert explicit() is bare() is falling() is None
```

</details>

### Practical exercise

Design a parser that returns a record or raises a documented error.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(line):
    """Return a level/message dict or raise ValueError."""
    level, message = line.split(" ", 1)
    if level not in {"INFO", "ERROR"}: raise ValueError("unsupported level")
    return {"level": level, "message": message}
assert parse("INFO ready")["message"] == "ready"
```

</details>

### Debugging exercise

A branch prints a value instead of returning it. Write a reproducer for the unexpected None.

<details>
<summary>Reveal reference solution</summary>

```python
def broken(x):
    if x > 0: print(x)
    else: return 0
assert broken(1) is None
def fixed(x): return x if x > 0 else 0
assert fixed(1) == 1
```

</details>

**Interview question:** What happens when only some branches return a value?

**Explain in your own words:** Explain return values in your own words. Use a concrete example to show why this is true: return ends a function invocation and provides a value; falling through returns None.

<a id="positional"></a>

## Positional arguments

Positional arguments bind to parameters in order; positional-only parameters can make that contract explicit.

**Why it matters:** Argument ordering is part of an API's interface.

**Prerequisites:** [Defining functions](week-1.md#define)

**Difficulty:** Foundational · **Code concepts:** parameters, positional arguments, /

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Call a two-parameter function in both orders and compare results.

<details>
<summary>Reveal reference solution</summary>

```python
def divide(a, b): return a / b
assert divide(6, 2) == 3 and divide(2, 6) == 1/3
```

</details>

### Simple exercise 2

Define a positional-only parameter and demonstrate the failure of a keyword call.

<details>
<summary>Reveal reference solution</summary>

```python
def identity(value, /): return value
assert identity(1) == 1
try: identity(value=1)
except TypeError: print("value is positional-only")
```

</details>

### Practical exercise

Define a ratio helper whose numerator and denominator are unambiguous.

<details>
<summary>Reveal reference solution</summary>

```python
def ratio(numerator, denominator):
    if denominator == 0: raise ValueError("denominator must be nonzero")
    return numerator / denominator
assert ratio(numerator=6, denominator=2) == 3
```

</details>

### Debugging exercise

A caller reverses source and destination parameters. Improve naming and call-site clarity.

<details>
<summary>Reveal reference solution</summary>

```python
def transfer(*, source, destination): return (source, destination)
# Keyword-only names make the direction reviewable at each call site.
assert transfer(source="inbox", destination="archive") == ("inbox", "archive")
```

</details>

**Interview question:** When would a positional-only parameter be useful?

**Explain in your own words:** Explain positional arguments in your own words. Use a concrete example to show why this is true: Positional arguments bind to parameters in order; positional-only parameters can make that contract explicit.

<a id="keywords"></a>

## Keyword arguments

Keyword arguments bind by parameter name; keyword-only parameters require explicit names.

**Why it matters:** Named options reduce ambiguous calls.

**Prerequisites:** [Positional arguments](week-1.md#positional)

**Difficulty:** Foundational · **Code concepts:** keyword arguments, * separator

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Define a keyword-only strict option and call it correctly.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(text, *, strict): return int(text) if strict else text
assert parse("2", strict=True) == 2
```

</details>

### Simple exercise 2

Add a required keyword-only option and demonstrate the error when it is omitted.

<details>
<summary>Reveal reference solution</summary>

```python
def load(path, *, encoding): return path, encoding
try: load("a.txt")
except TypeError: print("encoding is required")
```

</details>

### Practical exercise

Add explicit encoding and strict options to a log parser.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(raw, *, encoding="utf-8", strict=True):
    return raw.decode(encoding, errors="strict" if strict else "replace")
assert parse(b"hello", encoding="utf-8", strict=True) == "hello"
```

</details>

### Debugging exercise

A wrapper passes one parameter both positionally and by name. Reproduce the TypeError and fix it.

<details>
<summary>Reveal reference solution</summary>

```python
def inner(value): return value
try: inner(1, value=2)
except TypeError: pass
def wrapper(value): return inner(value=value)
assert wrapper(2) == 2
```

</details>

**Interview question:** What tradeoff follows from making a parameter keyword-only?

**Explain in your own words:** Explain keyword arguments in your own words. Use a concrete example to show why this is true: Keyword arguments bind by parameter name; keyword-only parameters require explicit names.

<a id="defaults"></a>

## Default parameters

Default expressions are evaluated when the function definition executes, not on every call.

**Why it matters:** Definition-time evaluation affects time, configuration, and state.

**Prerequisites:** [Keyword arguments](week-1.md#keywords)

**Difficulty:** Foundational · **Code concepts:** default expression, def

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Use a printed expression to observe when a default is created.

<details>
<summary>Reveal reference solution</summary>

```python
def make_default():
    print("created at definition")
    return 3
def run(attempts=make_default()): return attempts
assert run() == run() == 3
```

</details>

### Simple exercise 2

Override a default explicitly and compare the result with a call that omits it.

<details>
<summary>Reveal reference solution</summary>

```python
def run(attempts=3): return attempts
assert run() == 3 and run(1) == 1
```

</details>

### Practical exercise

Choose a default retry count and document how overrides work.

<details>
<summary>Reveal reference solution</summary>

```python
def retry_count(attempts=3):
    """Total attempts, including the first; callers may override."""
    if attempts < 1: raise ValueError("at least one attempt")
    return attempts
assert retry_count() == 3 and retry_count(attempts=1) == 1
```

</details>

### Debugging exercise

A timestamp default is identical across calls. Move time acquisition to the correct point.

<details>
<summary>Reveal reference solution</summary>

```python
from datetime import datetime, timezone
def stamp(timestamp=None):
    return datetime.now(timezone.utc) if timestamp is None else timestamp
fixed = datetime(2025, 1, 1, tzinfo=timezone.utc)
assert stamp(fixed) is fixed
# Calling now inside the body acquires time per invocation.
```

</details>

**Interview question:** When is a default expression evaluated?

**Explain in your own words:** Explain default parameters in your own words. Use a concrete example to show why this is true: Default expressions are evaluated when the function definition executes, not on every call.

<a id="mutable-defaults"></a>

## Mutable default parameters

A mutable default can be shared by successive calls; an explicit sentinel allows per-call allocation.

**Why it matters:** Shared defaults can leak data between requests.

**Prerequisites:** [Default parameters](week-1.md#defaults), [Mutability](week-1.md#mutability)

**Difficulty:** Foundational · **Code concepts:** None sentinel, list default

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Call an accumulator twice and inspect its default list.

<details>
<summary>Reveal reference solution</summary>

```python
def collect(x, items=[]):
    items.append(x); return items
assert collect(1) == [1]
assert collect(2) == [1, 2]
assert collect.__defaults__[0] == [1, 2]
```

</details>

### Simple exercise 2

Test a None-sentinel implementation with two omitted arguments and an explicitly supplied list.

<details>
<summary>Reveal reference solution</summary>

```python
def collect(x, items=None):
    if items is None: items = []
    items.append(x); return items
assert collect(1) == [1] and collect(2) == [2]
given = []; assert collect(3, given) is given
```

</details>

### Practical exercise

Implement a record collector that allocates independent buffers.

<details>
<summary>Reveal reference solution</summary>

```python
def collect(record, buffer=None):
    """Allocate a buffer unless the caller explicitly supplies one."""
    if buffer is None: buffer = []
    buffer.append(record)
    return buffer
a, b = collect("a"), collect("b")
assert a == ["a"] and b == ["b"] and a is not b
```

</details>

### Debugging exercise

def record(x, items=[]): items.append(x) retains earlier events. Repair it and verify separate calls.

<details>
<summary>Reveal reference solution</summary>

```python
def record(x, items=None):
    if items is None: items = []
    items.append(x)
    return items
assert record(1) == [1] and record(2) == [2]
# A definition-time list was shared. The sentinel allocates per call.
```

</details>

**Interview question:** Why does using None as a default avoid shared mutable state?

**Explain in your own words:** Explain mutable default parameters in your own words. Use a concrete example to show why this is true: A mutable default can be shared by successive calls; an explicit sentinel allows per-call allocation.

<a id="args"></a>

## Collecting positional arguments with args

A starred parameter collects additional positional arguments into a tuple.

**Why it matters:** Flexible forwarding still needs a clear contract.

**Prerequisites:** [Positional arguments](week-1.md#positional), [Tuple and sequence unpacking](week-1.md#unpack)

**Difficulty:** Foundational · **Code concepts:** *args, tuple

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Write a helper that totals an arbitrary number of values.

<details>
<summary>Reveal reference solution</summary>

```python
def total(*values): return sum(values)
assert total(1, 2, 3) == 6 and total() == 0
```

</details>

### Simple exercise 2

Call the same variadic helper with zero, one, and three arguments and inspect the tuple.

<details>
<summary>Reveal reference solution</summary>

```python
def inspect(*args): return args
assert inspect() == () and inspect(1) == (1,) and inspect(1, 2, 3) == (1, 2, 3)
```

</details>

### Practical exercise

Create a metric aggregator accepting several sample values.

<details>
<summary>Reveal reference solution</summary>

```python
def aggregate(*samples):
    return {"count": len(samples), "total": sum(samples),
            "mean": sum(samples)/len(samples) if samples else None}
assert aggregate(2, 4)["mean"] == 3 and aggregate()["mean"] is None
```

</details>

### Debugging exercise

A function loops over args[0] assuming it is the tuple of all arguments. Correct the nesting assumption.

<details>
<summary>Reveal reference solution</summary>

```python
def total(*args):
    # args is already the tuple; args[0] is the first scalar.
    return sum(value for value in args)
assert total(1, 2) == 3 and total() == 0
```

</details>

**Interview question:** What value does args contain when no arguments are supplied?

**Explain in your own words:** Explain collecting positional arguments with args in your own words. Use a concrete example to show why this is true: A starred parameter collects additional positional arguments into a tuple.

<a id="kwargs"></a>

## Collecting keyword arguments with kwargs

A double-starred parameter collects otherwise unbound named arguments into a dictionary.

**Why it matters:** Wrappers must decide which options they accept or forward.

**Prerequisites:** [Keyword arguments](week-1.md#keywords), [Dictionary lookup and aggregation](week-1.md#dicts)

**Difficulty:** Foundational · **Code concepts:** **kwargs, dict

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Collect named metric labels and inspect the resulting dictionary.

<details>
<summary>Reveal reference solution</summary>

```python
def labels(**kwargs): return kwargs
assert labels(region="eu", service="api") == {"region": "eu", "service": "api"}
```

</details>

### Simple exercise 2

Separate one named parameter from two extra keyword options and inspect the collected dictionary.

<details>
<summary>Reveal reference solution</summary>

```python
def metric(name, **options): return name, options
assert metric("latency", unit="ms", region="eu") == ("latency", {"unit": "ms", "region": "eu"})
```

</details>

### Practical exercise

Forward optional logging fields while rejecting unknown reserved keys.

<details>
<summary>Reveal reference solution</summary>

```python
def log(message, **fields):
    allowed = {"customer_id", "trace_id"}
    if fields.keys() - allowed: raise ValueError("unsupported/reserved field")
    return {"message": message, **fields}
assert log("ready", trace_id="t1")["trace_id"] == "t1"
```

</details>

### Debugging exercise

A misspelled option is silently swallowed by kwargs. Add validation at the wrapper boundary.

<details>
<summary>Reveal reference solution</summary>

```python
def configure(**options):
    unknown = options.keys() - {"timeout"}
    if unknown: raise TypeError(f"unknown options: {sorted(unknown)}")
    return options.get("timeout", 30)
try: configure(timout=1)
except TypeError: print("Typo rejected at boundary")
```

</details>

**Interview question:** What are the downsides of unrestricted kwargs?

**Explain in your own words:** Explain collecting keyword arguments with kwargs in your own words. Use a concrete example to show why this is true: A double-starred parameter collects otherwise unbound named arguments into a dictionary.

<a id="argument-unpack"></a>

## Argument unpacking at call sites

Star and double-star expressions expand values into positional and named arguments.

**Why it matters:** Data-driven invocation must respect the callable's signature.

**Prerequisites:** [Collecting positional arguments with args](week-1.md#args), [Collecting keyword arguments with kwargs](week-1.md#kwargs)

**Difficulty:** Foundational · **Code concepts:** f(*values), f(**options)

[Official documentation](https://docs.python.org/3/tutorial/controlflow.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Invoke one function from a tuple and a dictionary.

<details>
<summary>Reveal reference solution</summary>

```python
def add(a, b): return a + b
assert add(*(1, 2)) == add(**{"a": 1, "b": 2}) == 3
```

</details>

### Simple exercise 2

Expand an empty tuple and a nonempty option dictionary into one function call.

<details>
<summary>Reveal reference solution</summary>

```python
def values(*, strict): return strict
assert values(*(), **{"strict": True}) is True
```

</details>

### Practical exercise

Adapt a validated configuration record into a parser invocation.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(text, *, strict): return int(text) if strict else text
config = {"strict": True}
if set(config) != {"strict"} or not isinstance(config["strict"], bool):
    raise ValueError("invalid config")
assert parse("4", **config) == 4
```

</details>

### Debugging exercise

Two expanded dictionaries contain the same keyword. Reproduce the error and choose precedence before calling.

<details>
<summary>Reveal reference solution</summary>

```python
def run(*, timeout): return timeout
base = {"timeout": 30}; override = {"timeout": 0}
try: run(**base, **override)
except TypeError: pass
merged = {**base, **override}  # Explicit last-write-wins policy.
assert run(**merged) == 0
```

</details>

**Interview question:** How does collecting arguments differ from expanding them?

**Explain in your own words:** Explain argument unpacking at call sites in your own words. Use a concrete example to show why this is true: Star and double-star expressions expand values into positional and named arguments.

<a id="annotations"></a>

## Function annotations

Annotations describe intended input and output types; ordinary calls do not automatically enforce them.

**Why it matters:** Static contracts complement runtime boundary checks.

**Prerequisites:** [Return values](week-1.md#returns)

**Difficulty:** Foundational · **Code concepts:** parameter annotations, return annotation

[Official documentation](https://docs.python.org/3/library/typing.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Annotate a parser returning an integer and call it with a wrong type.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(text: str) -> int: return int(text)
assert parse("2") == 2
assert parse(2) == 2  # A static checker flags this call, Python does not.
```

</details>

### Simple exercise 2

Inspect a function's annotations and compare them with what a static checker reports.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import get_type_hints
def length(text: str) -> int: return len(text)
assert get_type_hints(length) == {"text": str, "return": int}
```

</details>

### Practical exercise

Document the types of each log-normalization helper.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize_level(level: str) -> str: return level.strip().upper()
def normalize_record(record: dict[str, str]) -> dict[str, str]:
    return {**record, "level": normalize_level(record["level"])}
assert normalize_record({"level": " info "}) == {"level": "INFO"}
```

</details>

### Debugging exercise

An annotated function accepts a string at runtime. Add a static check and identify where runtime validation belongs.

<details>
<summary>Reveal reference solution</summary>

```python
def double(x: int) -> int: return x * 2
assert double("2") == "22"  # Run a type checker to flag this misuse.
def validated_double(x: object) -> int:
    if type(x) is not int: raise TypeError("integer required")
    return double(x)
assert validated_double(2) == 4
```

</details>

**Interview question:** Do Python annotations validate arguments at runtime?

**Explain in your own words:** Explain function annotations in your own words. Use a concrete example to show why this is true: Annotations describe intended input and output types; ordinary calls do not automatically enforce them.

<a id="function-objects"></a>

## Functions as objects

Functions can be stored, passed, and returned like other objects.

**Why it matters:** Callback-based APIs and decorators depend on callable values.

**Prerequisites:** [Defining functions](week-1.md#define), [Dictionary lookup and aggregation](week-1.md#dicts)

**Difficulty:** Foundational · **Code concepts:** callable, function reference, dispatch table

[Official documentation](https://docs.python.org/3/reference/datamodel.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Store two functions in a dictionary and invoke one by key.

<details>
<summary>Reveal reference solution</summary>

```python
formatters = {"upper": str.upper, "lower": str.lower}
assert formatters["upper"]("Info") == "INFO"
```

</details>

### Simple exercise 2

Compare callable() for a function, its returned value, and an ordinary integer.

<details>
<summary>Reveal reference solution</summary>

```python
def greet(): return "hello"
alias = greet
assert alias is greet and alias() == "hello"
assert callable(greet) and not callable(greet()) and not callable(3)
```

</details>

### Practical exercise

Build a severity-based formatter dispatch table.

<details>
<summary>Reveal reference solution</summary>

```python
formatters = {"ERROR": lambda text: f"ALERT: {text}", "INFO": str}
def format_record(record):
    return formatters[record["level"]](record["message"])
assert format_record({"level": "ERROR", "message": "disk"}) == "ALERT: disk"
```

</details>

### Debugging exercise

A registry stores formatter() instead of formatter. Explain why work runs during registration.

<details>
<summary>Reveal reference solution</summary>

```python
calls = []
def formatter(): calls.append(1); return "ready"
registry = {"format": formatter}  # Store callable, not formatter().
assert calls == []
assert registry["format"]() == "ready" and calls == [1]
```

</details>

**Interview question:** What is the difference between passing f and f()?

**Explain in your own words:** Explain functions as objects in your own words. Use a concrete example to show why this is true: Functions can be stored, passed, and returned like other objects.

<a id="higher-order"></a>

## Higher order functions

A higher order function accepts or returns a callable, separating policy from mechanism.

**Why it matters:** Injecting behavior avoids hard-coded branching.

**Prerequisites:** [Functions as objects](week-1.md#function-objects), [Return values](week-1.md#returns)

**Difficulty:** Foundational · **Code concepts:** Callable, callback, sorted key

[Official documentation](https://docs.python.org/3/library/functions.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Sort records using an injected key function.

<details>
<summary>Reveal reference solution</summary>

```python
records = [{"age": 3}, {"age": 1}]
assert sorted(records, key=lambda r: r["age"])[0]["age"] == 1
```

</details>

### Simple exercise 2

Write a factory that returns either an uppercase or lowercase formatter.

<details>
<summary>Reveal reference solution</summary>

```python
def formatter(uppercase): return str.upper if uppercase else str.lower
assert formatter(True)("Info") == "INFO" and formatter(False)("Info") == "info"
```

</details>

### Practical exercise

Write a pipeline stage accepting a normalization callback.

<details>
<summary>Reveal reference solution</summary>

```python
def stage(records, normalize): return [normalize(record) for record in records]
assert stage([" info ", "error"], lambda x: x.strip().upper()) == ["INFO", "ERROR"]
```

</details>

### Debugging exercise

A callback receives the whole list instead of one record. Align the callback contract and call site.

<details>
<summary>Reveal reference solution</summary>

```python
def apply(records, callback):
    return [callback(record) for record in records]
# callback consumes one record, not the whole list.
assert apply([{"n": 1}, {"n": 2}], lambda r: r["n"] * 2) == [2, 4]
```

</details>

**Interview question:** When is a callback clearer than a subclass?

**Explain in your own words:** Explain higher order functions in your own words. Use a concrete example to show why this is true: A higher order function accepts or returns a callable, separating policy from mechanism.

<a id="scope"></a>

## Local and global scope

Assignment in a function normally makes a name local unless declared otherwise.

**Why it matters:** Scope rules explain surprising reads and hidden coupling.

**Prerequisites:** [Defining functions](week-1.md#define), [Names, bindings, and references](week-1.md#bindings)

**Difficulty:** Foundational · **Code concepts:** local binding, global, UnboundLocalError

[Official documentation](https://docs.python.org/3/reference/executionmodel.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Contrast reading a global name with assigning it locally.

<details>
<summary>Reveal reference solution</summary>

```python
value = 5
def read(): return value
def local():
    value = 9
    return value
assert read() == 5 and local() == 9 and value == 5
```

</details>

### Simple exercise 2

Demonstrate that mutating a referenced global list differs from rebinding the global name.

<details>
<summary>Reveal reference solution</summary>

```python
items = []
def mutate(): items.append(1)
def rebind_locally():
    items = [2]
    return items
mutate(); assert items == [1] and rebind_locally() == [2]
assert items == [1]
```

</details>

### Practical exercise

Remove an implicit global counter from a processing helper.

<details>
<summary>Reveal reference solution</summary>

```python
def next_count(current): return current + 1
count = 0
count = next_count(count)
assert count == 1
# Explicit input/output removes hidden global coupling.
```

</details>

### Debugging exercise

A function reads x before its local assignment. Explain the UnboundLocalError and repair ownership.

<details>
<summary>Reveal reference solution</summary>

```python
count = 0
def broken():
    count += 1
try: broken()
except UnboundLocalError: pass
def fixed(count): return count + 1
assert fixed(count) == 1
```

</details>

**Interview question:** Why can an assignment change how an earlier read is resolved?

**Explain in your own words:** Explain local and global scope in your own words. Use a concrete example to show why this is true: Assignment in a function normally makes a name local unless declared otherwise.

<a id="legb"></a>

## The LEGB name-resolution rule

Names are resolved through local, enclosing, global, and built-in scopes.

**Why it matters:** Resolving the correct binding is essential for nested functions.

**Prerequisites:** [Local and global scope](week-1.md#scope)

**Difficulty:** Foundational · **Code concepts:** locals, enclosing scope, builtins

[Official documentation](https://docs.python.org/3/reference/executionmodel.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Shadow a global name in nested scopes and predict each lookup.

<details>
<summary>Reveal reference solution</summary>

```python
name = "global"
def outer():
    name = "enclosing"
    def inner(): return name
    return inner()
assert outer() == "enclosing"
```

</details>

### Simple exercise 2

Use a nested function to show an enclosing binding taking precedence over a global binding.

<details>
<summary>Reveal reference solution</summary>

```python
name = "global"
def outer():
    name = "enclosing"
    def inner(): return name
    return inner()
assert outer() == "enclosing" and name == "global"
```

</details>

### Practical exercise

Audit a module for names that shadow useful built-ins.

<details>
<summary>Reveal reference solution</summary>

```python
import builtins
namespace = {"list": [], "len": 3, "event_count": 4}
shadowed = sorted(name for name in namespace if name in vars(builtins))
assert shadowed == ["len", "list"]
# Rename these to events and length; audit function locals and parameters too.
```

</details>

### Debugging exercise

A local variable named list makes list(...) fail. Identify which scope supplies the name.

<details>
<summary>Reveal reference solution</summary>

```python
def broken():
    list = []
    return list((1, 2))
try: broken()
except TypeError: pass
def fixed():
    items = []
    return list((1, 2))
assert fixed() == [1, 2]
```

</details>

**Interview question:** What is searched after the local scope?

**Explain in your own words:** Explain the legb name-resolution rule in your own words. Use a concrete example to show why this is true: Names are resolved through local, enclosing, global, and built-in scopes.

<a id="closures"></a>

## Closures and captured bindings

A closure retains access to enclosing bindings; captured names are resolved when used.

**Why it matters:** Factories and decorators can retain configuration without globals.

**Prerequisites:** [Higher order functions](week-1.md#higher-order), [The LEGB name-resolution rule](week-1.md#legb)

**Difficulty:** Foundational · **Code concepts:** nested function, nonlocal, closure

[Official documentation](https://docs.python.org/3/reference/executionmodel.html) · [Additional reading](https://docs.python.org/3/reference/datamodel.html)

### Simple exercise 1

Create a multiplier factory and instantiate two multipliers.

<details>
<summary>Reveal reference solution</summary>

```python
def multiplier(factor):
    def multiply(value): return factor * value
    return multiply
twice, triple = multiplier(2), multiplier(3)
assert twice(4) == 8 and triple(4) == 12
```

</details>

### Simple exercise 2

Use nonlocal to maintain a counter and show that two factory calls keep separate state.

<details>
<summary>Reveal reference solution</summary>

```python
def counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment
a, b = counter(), counter()
assert (a(), a(), b()) == (1, 2, 1)
```

</details>

### Practical exercise

Build a threshold predicate factory for log filtering.

<details>
<summary>Reveal reference solution</summary>

```python
def threshold_filter(minimum):
    return lambda record: record["severity"] >= minimum
warning = threshold_filter(30)
assert warning({"severity": 40}) and not warning({"severity": 10})
```

</details>

### Debugging exercise

Functions created in a loop all use the final loop value. Reproduce late binding and capture intentionally.

<details>
<summary>Reveal reference solution</summary>

```python
wrong = [lambda: i for i in range(3)]
assert [f() for f in wrong] == [2, 2, 2]
fixed = [lambda i=i: i for i in range(3)]
assert [f() for f in fixed] == [0, 1, 2]
# Defaults bind each iteration's value instead of sharing the loop cell.
```

</details>

**Interview question:** Does a closure capture a frozen value or access to a binding?

**Explain in your own words:** Explain closures and captured bindings in your own words. Use a concrete example to show why this is true: A closure retains access to enclosing bindings; captured names are resolved when used.

