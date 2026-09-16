# Week 3

[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)

<a id="packages"></a>

## Modules, packages, and imports

Imports load modules and bind names; package structure establishes import paths.

**Why it matters:** Predictable imports keep local execution and installation consistent.

**Prerequisites:** [Defining functions](week-1.md#define)

**Difficulty:** Intermediate · **Code concepts:** module, package, __init__.py, absolute import

[Packages](https://docs.python.org/3/tutorial/modules.html#packages) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

**Read for:** Read package-qualified imports and distinguish importing a module from running it as a script.

### Learn with an example

Both imports expose the same function here, but they bind different names in the importing module. Later patching must target the name your code actually looks up.

**Worked example** - Browser-compatible Python

```python
import json
from json import loads
print(json.loads("42"))
print(loads("42"))
print(loads is json.loads)
```

**Expected output**

```text
42
42
True
```

**Watch out for:** Importing a function does not create a live alias that tracks later reassignment in its source module.

**Change one thing:** Reassign json.loads to a small replacement and compare calling loads with json.loads.

### Simple exercise 1

Split a parser and its caller into two modules.

<details>
<summary>Reveal reference solution</summary>

```python
# parser.py
def parse(text): return int(text)
# caller.py (separate file)
# from parser import parse
# print(parse("2"))
```

</details>

### Simple exercise 2

Compare a module's __name__ when imported and when run as the entry point.

<details>
<summary>Reveal reference solution</summary>

```python
print(__name__)
if __name__ == "__main__": print("entry point")
# Save as example.py. 'python example.py' prints __main__.
# 'python -c "import example"' prints example without entry-point work.
```

</details>

### Practical exercise

Create a src-layout package for the log analyzer.

<details>
<summary>Reveal reference solution</summary>

```python
# Layout: pyproject.toml, src/analyzer/__init__.py,
# src/analyzer/parser.py, src/analyzer/__main__.py
# pyproject.toml:
# [build-system]
# requires = ["setuptools>=68"]
# build-backend = "setuptools.build_meta"
# [project]
# name = "learning-analyzer"
# version = "0.1.0"
# [tool.setuptools.packages.find]
# where = ["src"]
# __main__.py: from .parser import parse; print(parse("2"))
# Install: python -m pip install -e . ; Run: python -m analyzer
```

</details>

### Debugging exercise

Running a file directly breaks its relative import. Run it as a module and explain package context.

<details>
<summary>Reveal reference solution</summary>

```python
# Package file: analyzer/__main__.py
# from .parser import parse
# Correct command from the package's parent: python -m analyzer
# Directly running analyzer/__main__.py lacks a known parent package.
# Avoid sys.path hacks; install the package and use module execution.
```

</details>

**Interview question:** Why can an import behave differently under python file.py and python -m?

**Explain in your own words:** Explain modules, packages, and imports in your own words. Use a concrete example to show why this is true: Imports load modules and bind names; package structure establishes import paths.

<a id="environment"></a>

## Virtual environments and pyproject.toml

An isolated environment separates dependencies; pyproject.toml records project and tooling metadata.

**Why it matters:** Reproducibility requires more than the packages on one machine.

**Prerequisites:** [Modules, packages, and imports](week-3.md#packages)

**Difficulty:** Intermediate · **Code concepts:** venv, pip, pyproject.toml

[Configuring project metadata](https://packaging.python.org/en/latest/tutorials/packaging-projects/#configuring-metadata) · [Additional reading](https://docs.python.org/3/tutorial/modules.html#packages)

**Read for:** Find requires-python and dependencies; distinguish project metadata from the active interpreter.

### Learn with an example

sys.executable identifies the interpreter running this code. A pyproject file describes the project but does not switch that interpreter. Install dependencies through the interpreter you intend to use.

**Worked example** - Browser-compatible Python

```python
import sys
from pathlib import Path
print(bool(sys.executable))
print(Path("pyproject.toml").suffix)
print(sys.version_info >= (3, 11))
```

**Expected output**

```text
True
.toml
True
```

**Watch out for:** Having a virtual-environment folder does not prove your command uses it.

**Change one thing:** Print sys.executable in your terminal and editor, then compare their paths.

### Simple exercise 1

Create an environment and inspect its interpreter path.

<details>
<summary>Reveal reference solution</summary>

```python
# Shell: python -m venv .venv
# Windows: .venv\Scripts\python -c "import sys; print(sys.executable)"
# POSIX: .venv/bin/python -c "import sys; print(sys.executable)"
import sys
print(sys.executable, sys.prefix, sys.base_prefix)
```

</details>

### Simple exercise 2

Install your package into a second empty environment and verify its public import path.

<details>
<summary>Reveal reference solution</summary>

```python
# python -m venv .venv-check
# Windows: .venv-check\Scripts\python -m pip install .
# Windows: .venv-check\Scripts\python -c "import analyzer; print(analyzer.__file__)"
# POSIX: replace .venv-check\Scripts\python with .venv-check/bin/python.
# Run the import check outside the source directory as well.
```

</details>

### Practical exercise

Install the analyzer package in a clean environment.

<details>
<summary>Reveal reference solution</summary>

```python
# Build/install from the project containing pyproject.toml:
# python -m venv .venv-clean
# .venv-clean\Scripts\python -m pip install .
# .venv-clean\Scripts\python -m analyzer
# A non-editable install verifies packaging includes the needed modules.
```

</details>

### Debugging exercise

A command uses a different interpreter from the one that installed dependencies. Trace both executables.

<details>
<summary>Reveal reference solution</summary>

```python
import sys, subprocess
print("running:", sys.executable)
subprocess.run([sys.executable, "-m", "pip", "--version"], check=True)
# Use this same interpreter for '-m pip install ...' and execution.
# A bare pip command can belong to another environment.
```

</details>

**Interview question:** What does an environment isolate and what does it not isolate?

**Explain in your own words:** Explain virtual environments and pyproject.toml in your own words. Use a concrete example to show why this is true: An isolated environment separates dependencies; pyproject.toml records project and tooling metadata.

<a id="configuration"></a>

## Configuration and structured logging

Configuration should enter at a boundary; logs should include fields that support diagnosis.

**Why it matters:** Explicit settings and event fields make failures reproducible.

**Prerequisites:** [Virtual environments and pyproject.toml](week-3.md#environment), [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Intermediate · **Code concepts:** os.environ, logging, logger, extra

[LoggerAdapter](https://docs.python.org/3/library/logging.html#logging.LoggerAdapter) · [Additional reading](https://packaging.python.org/en/latest/tutorials/packaging-projects/#configuring-metadata)

**Read for:** Follow adding request context through extra instead of concatenating ad hoc log messages.

### Learn with an example

The adapter supplies request context while the formatter controls output. Application code emits a semantic event rather than constructing a custom prefix each time. In production, a JSON formatter can retain fields as structured data.

**Worked example** - Browser-compatible Python

```python
import logging
import sys
logging.basicConfig(stream=sys.stdout, level=logging.INFO, format="%(levelname)s %(request_id)s %(message)s", force=True)
log = logging.LoggerAdapter(logging.getLogger("service"), {"request_id": "r7"})
log.info("started")
```

**Expected output**

```text
INFO r7 started
```

**Watch out for:** Credentials and full payloads should not be copied into routine log context.

**Change one thing:** Create a second adapter with a different request ID and compare its output.

### Simple exercise 1

Read a configuration value with a validated default.

<details>
<summary>Reveal reference solution</summary>

```python
import os
def load_timeout():
    value = int(os.getenv("TIMEOUT", "30"))
    if value < 0: raise ValueError("TIMEOUT must be nonnegative")
    return value
print(load_timeout() >= 0)  # Expected: True
```

</details>

### Simple exercise 2

Emit two structured log events with the same request ID and different event names.

<details>
<summary>Reveal reference solution</summary>

```python
import json
for event in ("started", "completed"):
    print(json.dumps({"request_id": "r1", "event": event}))
```

</details>

### Practical exercise

Log a report run with a request ID and record count.

<details>
<summary>Reveal reference solution</summary>

```python
import json, logging
logging.basicConfig(level=logging.INFO, format="%(message)s")
logging.getLogger("analyzer").info(json.dumps({
    "event": "report_completed", "request_id": "r1", "record_count": 12
}))
```

</details>

### Debugging exercise

Every imported module adds a handler and logs duplicate lines. Centralize configuration.

<details>
<summary>Reveal reference solution</summary>

```python
# library.py: create a logger, but do not add output handlers.
import logging
logger = logging.getLogger(__name__)
def run(): logger.info("ready")
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)  # Configure once in entry point.
    run()
# Duplicate module handlers plus root propagation caused duplicate lines.
```

</details>

**Interview question:** Why avoid configuring root logging in every library module?

**Explain in your own words:** Explain configuration and structured logging in your own words. Use a concrete example to show why this is true: Configuration should enter at a boundary; logs should include fields that support diagnosis.

<a id="unions"></a>

## Optional, Union, and Literal types

Union types model alternatives; Optional includes None, while Literal restricts known values.

**Why it matters:** Precise alternatives clarify API states.

**Prerequisites:** [Function annotations](week-1.md#annotations), [None and truth-value testing](week-1.md#truth)

**Difficulty:** Intermediate · **Code concepts:** Optional, Union, Literal, narrowing

[Optional](https://docs.python.org/3/library/typing.html#typing.Optional) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)

**Read for:** Read why Optional[T] means T or None, not that an argument can be omitted.

### Learn with an example

Optional[int] permits an integer or None. The default = None separately allows omitting the argument. Testing for None preserves a valid integer zero.

**Worked example** - Browser-compatible Python

```python
from typing import Optional
def display(value: Optional[int] = None):
    return "missing" if value is None else str(value)
print(display())
print(display(0))
```

**Expected output**

```text
missing
0
```

**Watch out for:** Optional type and optional argument are separate ideas.

**Change one thing:** Remove the default but keep the annotation and call display with no arguments.

### Simple exercise 1

Annotate a status that may be absent and narrow it before use.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize(status: str | None) -> str:
    if status is None: return "unknown"
    return status.upper()
print(normalize(None))  # Expected: "unknown"
```

</details>

### Simple exercise 2

Narrow a Literal-based status with explicit branches and check an invalid assignment statically.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Literal, assert_never
Status = Literal["open", "closed"]
def label(status: Status) -> str:
    if status == "open": return "Active"
    if status == "closed": return "Finished"
    assert_never(status)
# A static checker rejects: status: Status = "pending"
```

</details>

### Practical exercise

Model a parser result whose mode is a fixed string literal.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass
from typing import Literal
@dataclass
class ParseResult:
    mode: Literal["strict", "lenient"]
    count: int
print(ParseResult('strict', 2).mode)  # Expected: "strict"
```

</details>

### Debugging exercise

A value typed as possibly None is dereferenced without a check. Add explicit narrowing.

<details>
<summary>Reveal reference solution</summary>

```python
def length(value: str | None) -> int:
    if value is None: return 0
    return len(value)
print(length(None), length('abc'))  # Expected values: 0; 3
```

</details>

**Interview question:** Is Optional the same as an optional function argument?

**Explain in your own words:** Explain optional, union, and literal types in your own words. Use a concrete example to show why this is true: Union types model alternatives; Optional includes None, while Literal restricts known values.

<a id="callable-types"></a>

## Callable annotations

Callable contracts describe argument and return types of injected behavior.

**Why it matters:** Typed callbacks make higher order APIs safer to evolve.

**Prerequisites:** [Function annotations](week-1.md#annotations), [Higher order functions](week-1.md#higher-order)

**Difficulty:** Intermediate · **Code concepts:** Callable, ParamSpec, return type

[Annotating callable objects](https://docs.python.org/3/library/typing.html#annotating-callable-objects) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)

**Read for:** Match argument types and return type; distinguish the callable itself from its result.

### Learn with an example

The annotation describes a callable accepting an integer and returning text. transform passes the value to that behavior without knowing how the result is produced.

**Worked example** - Browser-compatible Python

```python
from typing import Callable
def transform(value: int, operation: Callable[[int], str]) -> str:
    return operation(value)
print(transform(7, lambda n: f"item-{n}"))
```

**Expected output**

```text
item-7
```

**Watch out for:** Callable describes the function's call contract, not the type of a previously computed value.

**Change one thing:** Pass str as the operation, then try passing str(7) and explain the difference.

### Simple exercise 1

Annotate a transformation accepting and returning a string.

<details>
<summary>Reveal reference solution</summary>

```python
from collections.abc import Callable
def apply(text: str, transform: Callable[[str], str]) -> str:
    return transform(text)
print(apply('info', str.upper))  # Expected: "INFO"
```

</details>

### Simple exercise 2

Compare a correctly typed callback with one that accepts the wrong number of arguments.

<details>
<summary>Reveal reference solution</summary>

```python
from collections.abc import Callable
def good(text: str) -> str: return text.upper()
def bad(text: str, extra: int) -> str: return text * extra
callback: Callable[[str], str] = good
# Static error: callback = bad (requires a second argument).
```

</details>

### Practical exercise

Type a formatter registry and check an incompatible callback.

<details>
<summary>Reveal reference solution</summary>

```python
from collections.abc import Callable
registry: dict[str, Callable[[str], str]] = {"upper": str.upper}
def wrong(text: str) -> int: return len(text)
# Static error: registry["length"] = wrong
print(registry['upper']('ok'))  # Expected: "OK"
```

</details>

### Debugging exercise

A callback returns None but the consumer expects str. Expose the mismatch statically.

<details>
<summary>Reveal reference solution</summary>

```python
from collections.abc import Callable
def consume(callback: Callable[[str], str]) -> str: return callback("x")
def wrong(text: str) -> None: print(text)
# Run mypy/pyright on consume(wrong): incompatible return type.
def fixed(text: str) -> str: return text
print(consume(fixed))  # Expected: "x"
```

</details>

**Interview question:** What information is lost by Callable[..., Any]?

**Explain in your own words:** Explain callable annotations in your own words. Use a concrete example to show why this is true: Callable contracts describe argument and return types of injected behavior.

<a id="generics"></a>

## Generics and TypeVar relationships

Generics express relationships between types rather than replacing them with Any.

**Why it matters:** Reusable containers and helpers can preserve caller information.

**Prerequisites:** [Optional, Union, and Literal types](week-3.md#unions)

**Difficulty:** Intermediate · **Code concepts:** TypeVar, Generic, list[T]

[Generics](https://docs.python.org/3/library/typing.html#generics) · [Additional reading](https://docs.python.org/3/library/typing.html#typing.Optional)

**Read for:** Trace the same type variable from an input container to the returned element.

### Learn with an example

The same type variable connects input element type to output type. A checker can infer int for the first call and str for the second. That relationship is lost with an unrestricted Any return.

**Worked example** - Browser-compatible Python

```python
from typing import TypeVar
T = TypeVar("T")
def first(values: list[T]) -> T:
    return values[0]
print(first([5, 6]))
print(first(["a", "b"]))
```

**Expected output**

```text
5
a
```

**Watch out for:** A type relationship does not guarantee that the input list is nonempty.

**Change one thing:** Call first on an empty list and decide how the API should express that case.

### Simple exercise 1

Annotate a first-item helper that preserves element type.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import TypeVar
from collections.abc import Sequence
T = TypeVar("T")
def first(values: Sequence[T]) -> T: return values[0]
print(first([1, 2]))  # Expected: 1
```

</details>

### Simple exercise 2

Use the same generic helper with strings and integers and inspect inferred result types.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import TypeVar, assert_type
from collections.abc import Sequence
T = TypeVar("T")
def first(values: Sequence[T]) -> T: return values[0]
assert_type(first([1, 2]), int)
assert_type(first(["a"]), str)
```

</details>

### Practical exercise

Create a typed repository interface returning its entity type.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Protocol, TypeVar
T_co = TypeVar("T_co", covariant=True)
class Repository(Protocol[T_co]):
    def get(self, key: str) -> T_co | None: ...
# Repository[Customer].get preserves Customer | None at call sites.
```

</details>

### Debugging exercise

An unconstrained Any return hides an invalid operation at the call site. Preserve the type variable.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import TypeVar
from collections.abc import Sequence
T = TypeVar("T")
def first(values: Sequence[T]) -> T: return values[0]
value = first([1])
# A checker rejects value.upper(); an Any result would conceal the bug.
print(value + 1)  # Expected: 2
```

</details>

**Interview question:** When does a type variable convey more than a union?

**Explain in your own words:** Explain generics and typevar relationships in your own words. Use a concrete example to show why this is true: Generics express relationships between types rather than replacing them with Any.

<a id="protocol"></a>

## Protocol and structural subtyping

A Protocol describes supported operations without requiring explicit inheritance.

**Why it matters:** Dependency boundaries can be tested with small compatible objects.

**Prerequisites:** [Function annotations](week-1.md#annotations), [Composition and inheritance](week-2.md#composition)

**Difficulty:** Intermediate · **Code concepts:** Protocol, structural typing

[Protocol](https://docs.python.org/3/library/typing.html#typing.Protocol) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)

**Read for:** Read structural subtyping: satisfying the required interface does not require inheritance.

### Learn with an example

Console satisfies the required send interface without inheriting Sender. The annotation expresses what announce needs, while a static checker verifies compatibility. Runtime execution is ordinary method dispatch.

**Worked example** - Browser-compatible Python

```python
from typing import Protocol
class Sender(Protocol):
    def send(self, text: str) -> None: ...
class Console:
    def send(self, text: str) -> None:
        print(text)
def announce(sender: Sender):
    sender.send("ready")
announce(Console())
```

**Expected output**

```text
ready
```

**Watch out for:** Protocol annotations do not automatically perform runtime interface checks.

**Change one thing:** Change Console.send to require another argument and inspect the static error.

### Simple exercise 1

Define a Writer protocol and implement two unrelated writers.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Protocol
class Writer(Protocol):
    def write(self, text: str) -> None: ...
class Memory:
    def __init__(self): self.parts: list[str] = []
    def write(self, text: str) -> None: self.parts.append(text)
class Console:
    def write(self, text: str) -> None: print(text)
writers: list[Writer] = [Memory(), Console()]
```

</details>

### Simple exercise 2

Provide a compatible class without inheriting from the Protocol and run a static check.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Protocol
class Writer(Protocol):
    def write(self, text: str) -> None: ...
class Compatible:
    def write(self, text: str) -> None: print(text)
writer: Writer = Compatible()  # Structural typing; no inheritance required.
```

</details>

### Practical exercise

Make the report service depend on a sink protocol.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Protocol
class Sink(Protocol):
    def write(self, text: str) -> None: ...
def report(count: int, sink: Sink) -> None:
    sink.write(f"Records: {count}\n")
# Test with Memory; production can provide a file adapter.
```

</details>

### Debugging exercise

A fake writer has a mismatched method signature. Use a type checker to reveal the incompatibility.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Protocol
class Writer(Protocol):
    def write(self, text: str) -> None: ...
class Wrong:
    def write(self, text: bytes) -> None: pass
# Static error: writer: Writer = Wrong()
class Fixed:
    def write(self, text: str) -> None: pass
writer: Writer = Fixed()
```

</details>

**Interview question:** How does structural subtyping differ from nominal inheritance?

**Explain in your own words:** Explain protocol and structural subtyping in your own words. Use a concrete example to show why this is true: A Protocol describes supported operations without requiring explicit inheritance.

<a id="typeddict"></a>

## TypedDict for dictionary-shaped contracts

TypedDict gives static field information for dictionaries while retaining ordinary dict runtime behavior.

**Why it matters:** External dictionary shapes can be documented without implying runtime validation.

**Prerequisites:** [Function annotations](week-1.md#annotations), [Dictionary lookup and aggregation](week-1.md#dicts)

**Difficulty:** Intermediate · **Code concepts:** TypedDict, NotRequired, Required

[TypedDict](https://docs.python.org/3/library/typing.html#typing.TypedDict) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)

**Read for:** Check required and optional keys and the fact that values remain ordinary dictionaries at runtime.

### Learn with an example

TypedDict gives a checker information about named keys, but the runtime object is still a dictionary. External payloads need runtime validation before you trust this shape.

**Worked example** - Browser-compatible Python

```python
from typing import TypedDict
class Event(TypedDict):
    name: str
    count: int
event: Event = {"name": "login", "count": 2}
print(type(event).__name__)
print(event["count"] + 1)
```

**Expected output**

```text
dict
3
```

**Watch out for:** Annotating an untrusted dictionary does not validate its contents.

**Change one thing:** Change count to text and compare checker feedback with the runtime addition error.

### Simple exercise 1

Define an event dictionary with a required ID and optional label.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import TypedDict, NotRequired
class Event(TypedDict):
    id: str
    label: NotRequired[str]
event: Event = {"id": "e1"}
print('label' not in event)  # Expected: True
```

</details>

### Simple exercise 2

Mark one field NotRequired and compare a missing field with a field whose value is None.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import TypedDict, NotRequired
class Event(TypedDict):
    label: NotRequired[str | None]
missing: Event = {}; present: Event = {"label": None}
print('label' not in missing and 'label' in present)  # Expected: True
```

</details>

### Practical exercise

Type a JSON adapter's internal output.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import TypedDict
class Event(TypedDict):
    id: str
    severity: str
def adapt(value: object) -> Event:
    if not isinstance(value, dict): raise ValueError("object required")
    if not isinstance(value.get("id"), str) or not isinstance(value.get("severity"), str):
        raise ValueError("string id/severity required")
    return {"id": value["id"], "severity": value["severity"]}
```

</details>

### Debugging exercise

A TypedDict instance accepts invalid runtime data. Identify where actual validation must happen.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import TypedDict
class Event(TypedDict): id: str
bad = Event(id=123)  # Static error, but ordinary dict at runtime.
print(isinstance(bad, dict))  # Expected: True
def validate(value):
    if not isinstance(value, dict) or not isinstance(value.get("id"), str):
        raise ValueError("string id required")
    return value
```

</details>

**Interview question:** How does TypedDict differ from a dataclass at runtime?

**Explain in your own words:** Explain typeddict for dictionary-shaped contracts in your own words. Use a concrete example to show why this is true: TypedDict gives static field information for dictionaries while retaining ordinary dict runtime behavior.

<a id="type-narrowing"></a>

## Type narrowing and runtime checks

Control-flow checks refine the possible types of a value for subsequent operations.

**Why it matters:** Narrowing avoids unsafe assumptions at boundaries.

**Prerequisites:** [Optional, Union, and Literal types](week-3.md#unions), [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Intermediate · **Code concepts:** isinstance, assert, TypeGuard

[TypeGuard](https://docs.python.org/3/library/typing.html#typing.TypeGuard) · [Additional reading](https://docs.python.org/3/library/typing.html#typing.Optional)

**Read for:** Read how a predicate changes a checker's knowledge; verify the predicate actually checks the claim.

### Learn with an example

The isinstance branch proves a runtime fact and narrows the static type within that branch. len is appropriate there; the fallback handles other objects without pretending they are strings.

**Worked example** - Browser-compatible Python

```python
def length(value: object) -> int:
    if isinstance(value, str):
        return len(value)
    return 0
print(length("hello"))
print(length(42))
```

**Expected output**

```text
5
0
```

**Watch out for:** A cast changes checker assumptions but performs no runtime validation.

**Change one thing:** Extend the function to support lists with a second checked branch.

### Simple exercise 1

Narrow a string-or-integer value before normalization.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize(value: str | int) -> str:
    if isinstance(value, str): return value.strip()
    return str(value)
print(normalize(' x '), normalize(3))  # Expected values: 'x'; '3'
```

</details>

### Simple exercise 2

Use isinstance to separate two union branches and annotate the type expected in each.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import assert_type
def inspect(value: str | int):
    if isinstance(value, str): assert_type(value, str)
    else: assert_type(value, int)
```

</details>

### Practical exercise

Validate decoded JSON before passing it to a typed helper.

<details>
<summary>Reveal reference solution</summary>

```python
import json
def double(value: int) -> int: return value * 2
def parse(text: str) -> int:
    data = json.loads(text)
    if not isinstance(data, dict) or type(data.get("count")) is not int:
        raise ValueError("integer count required")
    return double(data["count"])
print(parse('{"count":2}'))  # Expected: 4
```

</details>

### Debugging exercise

An assert is used as input validation and vanishes in optimized execution. Replace it with an explicit error.

<details>
<summary>Reveal reference solution</summary>

```python
def validate(count):
    if type(count) is not int or count < 0:
        raise ValueError("nonnegative integer required")
    return count
# Explicit checks remain active under python -O; assert statements do not.
print(validate(0))  # Expected: 0
```

</details>

**Interview question:** When should validation use an exception rather than assert?

**Explain in your own words:** Explain type narrowing and runtime checks in your own words. Use a concrete example to show why this is true: Control-flow checks refine the possible types of a value for subsequent operations.

<a id="pytest"></a>

## pytest assertions and test discovery

pytest discovers test functions and reports failed behavioral assertions.

**Why it matters:** Tests make a function's expected behavior executable.

**Prerequisites:** [Defining functions](week-1.md#define), [Virtual environments and pyproject.toml](week-3.md#environment)

**Difficulty:** Intermediate · **Code concepts:** test_ prefix, assert, pytest

[Assertions in tests](https://docs.pytest.org/en/stable/how-to/assert.html#asserting-with-the-assert-statement) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

**Read for:** Read failure introspection; assertions belong here because the topic is testing behavior.

### Learn with an example

This is intentionally a test: an assertion checks an observable contract. The direct call makes the tiny example runnable; pytest would discover the test_ function when saved in a test_ file.

**Worked example** - Browser-compatible Python

```python
def normalize(text):
    return text.strip().upper()
def test_normalize():
    assert normalize(" ok ") == "OK"
test_normalize()
print("example test passed")
```

**Expected output**

```text
example test passed
```

**Watch out for:** Testing only an implementation detail can miss incorrect externally visible behavior.

**Change one thing:** Change upper to lower and inspect the failing assertion with pytest.

### Simple exercise 1

Write passing and failing tests for a pure normalization helper.

<details>
<summary>Reveal reference solution</summary>

```python
# Save as test_normalize.py; run python -m pytest.
def normalize(text): return text.strip().upper()
def test_normalize(): assert normalize(" info ") == "INFO"
def test_demonstrate_failure(): assert normalize("info") == "info"  # Intentionally fails.
```

</details>

### Simple exercise 2

Run one selected test by node ID and inspect the failure output after changing its assertion.

<details>
<summary>Reveal reference solution</summary>

```python
# python -m pytest test_normalize.py::test_normalize -v
def normalize(text): return text.strip().upper()
def test_normalize(): assert normalize("info") == "INFO"
# Change expected value to 'info', rerun, and inspect actual vs expected.
```

</details>

### Practical exercise

Create a test suite for a log aggregation boundary.

<details>
<summary>Reveal reference solution</summary>

```python
from collections import Counter
def aggregate(events): return dict(Counter(e["severity"] for e in events))
def test_empty(): assert aggregate([]) == {}
def test_repeated():
    assert aggregate([{"severity": "ERROR"}, {"severity": "ERROR"}]) == {"ERROR": 2}
```

</details>

### Debugging exercise

A test file or function has the wrong name and never runs. Verify collection output.

<details>
<summary>Reveal reference solution</summary>

```python
# Default collection: test_*.py or *_test.py, functions named test_*.
# Rename check_parser.py -> test_parser.py; check_empty -> test_empty.
# Verify with: python -m pytest --collect-only -q
def test_empty(): assert len([]) == 0
```

</details>

**Interview question:** What makes a unit test focused on behavior rather than implementation?

**Explain in your own words:** Explain pytest assertions and test discovery in your own words. Use a concrete example to show why this is true: pytest discovers test functions and reports failed behavioral assertions.

<a id="fixtures"></a>

## pytest fixtures and lifetime

Fixtures supply dependencies and manage setup and teardown with explicit scopes.

**Why it matters:** Appropriate lifetimes avoid both slow suites and leaking state.

**Prerequisites:** [pytest assertions and test discovery](week-3.md#pytest), [Context managers and exception-aware cleanup](week-2.md#context-managers)

**Difficulty:** Intermediate · **Code concepts:** pytest.fixture, yield, scope

[Fixture scopes](https://docs.pytest.org/en/stable/how-to/fixtures.html#fixture-scopes) · [Additional reading](https://docs.pytest.org/en/stable/how-to/assert.html#asserting-with-the-assert-statement)

**Read for:** Compare per-test and shared fixture lifetimes, especially when values are mutable.

### Learn with an example

This plain-Python model shows why fixture lifetime matters. A fresh allocation per case isolates mutation; a shared allocation couples cases. In pytest, a fixture's scope controls when its setup result is reused.

**Concept model** - Browser-compatible Python

This example isolates the concept; it is not a production framework implementation.

```python
def new_buffer():
    return []
first_case = new_buffer()
second_case = new_buffer()
first_case.append("event")
print(first_case, second_case)
```

**Expected output**

```text
['event'] []
```

**Watch out for:** A session-scoped mutable fixture can leak state between tests.

**Change one thing:** Return one module-level list from new_buffer and observe the leak; then map that to fixture scope.

### Simple exercise 1

Create a fresh event list fixture for each test.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
@pytest.fixture
def events(): return []
def test_mutation(events): events.append("a"); assert events == ["a"]
def test_fresh(events): assert events == []
```

</details>

### Simple exercise 2

Use a yield fixture and prove that teardown happens after a failing test.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
@pytest.fixture
def resource(tmp_path):
    marker = tmp_path / "active"; marker.touch()
    yield marker
    marker.unlink()
    assert not marker.exists()  # Teardown runs even if the test fails.
def test_failure(resource): assert False  # Intentional; run with --setup-show.
```

</details>

### Practical exercise

Provide an isolated temporary log directory to tests.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
@pytest.fixture
def logs(tmp_path):
    path = tmp_path / "events.log"
    path.write_text("INFO ready\n", encoding="utf-8")
    return path
def test_log(logs): assert logs.read_text(encoding="utf-8") == "INFO ready\n"
```

</details>

### Debugging exercise

A session-scoped mutable fixture leaks changes between tests. Reduce scope or reset ownership.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
@pytest.fixture(scope="function")
def events(): return []
def test_first(events): events.append(1)
def test_second(events): assert events == []
# Function scope replaces a shared session-scoped mutable list.
```

</details>

**Interview question:** How does fixture scope affect isolation?

**Explain in your own words:** Explain pytest fixtures and lifetime in your own words. Use a concrete example to show why this is true: Fixtures supply dependencies and manage setup and teardown with explicit scopes.

<a id="parametrize"></a>

## Parametrized tests and edge cases

Parametrization runs one behavior against multiple explicit input-output cases.

**Why it matters:** A compact matrix exposes boundaries without duplicated tests.

**Prerequisites:** [pytest assertions and test discovery](week-3.md#pytest)

**Difficulty:** Intermediate · **Code concepts:** pytest.mark.parametrize, test IDs

[Parametrizing test functions](https://docs.pytest.org/en/stable/how-to/parametrize.html#pytest-mark-parametrize-parametrizing-test-functions) · [Additional reading](https://docs.pytest.org/en/stable/how-to/assert.html#asserting-with-the-assert-statement)

**Read for:** Follow how each input/expected pair becomes an independently reported case.

### Learn with an example

Each row expresses one input/output example, including a boundary and a negative value. pytest.mark.parametrize turns this table idea into separately named test cases with independent failure reports.

**Concept model** - Browser-compatible Python

This example isolates the concept; it is not a production framework implementation.

```python
def square(number):
    return number * number
for value, expected in [(0, 0), (-3, 9), (4, 16)]:
    print(value, square(value) == expected)
```

**Expected output**

```text
0 True
-3 True
4 True
```

**Watch out for:** A large table without meaningful edge cases can still miss the important behavior.

**Change one thing:** Add a float case and decide whether the function promises to accept it.

### Simple exercise 1

Parameterize valid, empty, and malformed log inputs.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
def parse(text): return int(text)
@pytest.mark.parametrize("text, expected", [("2", 2), ("", None), ("bad", None)])
def test_parse(text, expected):
    if expected is None:
        with pytest.raises(ValueError): parse(text)
    else: assert parse(text) == expected
```

</details>

### Simple exercise 2

Give each parameter case a descriptive ID and run a single failing case.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
@pytest.mark.parametrize("text, expected", [("info", "INFO"), ("", "")], ids=["lowercase", "empty"])
def test_normalize(text, expected): assert text.upper() == expected
# python -m pytest 'test_levels.py::test_normalize[empty]'
```

</details>

### Practical exercise

Create a regression matrix for severity normalization.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
@pytest.mark.parametrize("raw, expected", [("info", "INFO"), (" ERROR ", "ERROR"), ("", "")])
def test_normalize(raw, expected): assert raw.strip().upper() == expected
```

</details>

### Debugging exercise

Shared mutable parameter values make later cases order-dependent. Allocate fresh state per case.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
@pytest.mark.parametrize("seed", [(1,), (2,)])
def test_append(seed):
    values = list(seed)  # Allocate local mutable state from immutable cases.
    values.append(3)
    assert values[-1] == 3 and len(seed) == 1
```

</details>

**Interview question:** When would separate tests be clearer than parametrization?

**Explain in your own words:** Explain parametrized tests and edge cases in your own words. Use a concrete example to show why this is true: Parametrization runs one behavior against multiple explicit input-output cases.

<a id="exception-tests"></a>

## Testing exceptions and failure contracts

Exception tests assert the type and useful details of a failure.

**Why it matters:** Failure behavior deserves the same precision as success behavior.

**Prerequisites:** [pytest assertions and test discovery](week-3.md#pytest), [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Intermediate · **Code concepts:** pytest.raises, match

[Expected exceptions](https://docs.pytest.org/en/stable/how-to/assert.html#assertions-about-expected-exceptions) · [Additional reading](https://docs.pytest.org/en/stable/how-to/assert.html#asserting-with-the-assert-statement)

**Read for:** Read pytest.raises and matching messages; place only the failing operation inside the block.

### Learn with an example

The failure type and message are observable parts of this small contract. A pytest version places positive(0) inside pytest.raises(ValueError, match=...). It must also fail if no exception is raised.

**Worked example** - Browser-compatible Python

```python
def positive(value):
    if value <= 0:
        raise ValueError("must be positive")
    return value
try:
    positive(0)
except ValueError as error:
    print(type(error).__name__, str(error))
```

**Expected output**

```text
ValueError must be positive
```

**Watch out for:** Catching an exception without checking the no-exception path is an incomplete test.

**Change one thing:** Write the pytest.raises version and deliberately remove the raise to see the test fail.

### Simple exercise 1

Assert that invalid counts raise ValueError with a helpful message.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
def validate(count):
    if count < 0: raise ValueError("count must be nonnegative")
    return count
def test_invalid():
    with pytest.raises(ValueError, match="nonnegative"): validate(-1)
```

</details>

### Simple exercise 2

Verify that a function does not raise on a valid boundary input alongside the failure test.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
def validate(count):
    if count < 0: raise ValueError("negative count")
    return count
def test_zero(): assert validate(0) == 0
def test_negative():
    with pytest.raises(ValueError, match="negative"): validate(-1)
```

</details>

### Practical exercise

Verify malformed records include source-line context.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
def parse(line, number):
    try: return int(line)
    except ValueError as error: raise ValueError(f"line {number}: invalid integer") from error
def test_context():
    with pytest.raises(ValueError, match="line 4: invalid integer"): parse("bad", 4)
```

</details>

### Debugging exercise

pytest.raises(Exception) accepts an unrelated bug. Tighten the expected failure.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
def parse(text): return int(text)
def test_invalid_text():
    with pytest.raises(ValueError): parse("bad")
# pytest.raises(Exception) would also swallow TypeError from parse(None),
# concealing the wrong test setup or a programming error.
```

</details>

**Interview question:** Why can a broad exception assertion produce false confidence?

**Explain in your own words:** Explain testing exceptions and failure contracts in your own words. Use a concrete example to show why this is true: Exception tests assert the type and useful details of a failure.

<a id="mocking"></a>

## Mocks and patching lookup locations

A patch must replace the reference used by the code under test, which may differ from the original definition.

**Why it matters:** Correct patch boundaries keep tests deterministic.

**Prerequisites:** [pytest assertions and test discovery](week-3.md#pytest), [Modules, packages, and imports](week-3.md#packages)

**Difficulty:** Intermediate · **Code concepts:** unittest.mock.patch, mock, return_value

[Where to patch](https://docs.python.org/3/library/unittest.mock.html#where-to-patch) · [Additional reading](https://docs.pytest.org/en/stable/how-to/assert.html#asserting-with-the-assert-statement)

**Read for:** Patch the name looked up by the system under test, not automatically its defining module.

### Learn with an example

The mock supplies a controlled result and records the call. When substituting it into a real module, patch the binding used by that module. The mock itself does not prove that a real remote API behaves this way.

**Worked example** - Browser-compatible Python

```python
from unittest.mock import Mock
lookup = Mock(return_value={"name": "Ada"})
print(lookup("u1")["name"])
print(lookup.call_args.args)
```

**Expected output**

```text
Ada
('u1',)
```

**Watch out for:** A passing mocked test is not an integration test of the real service.

**Change one thing:** Configure side_effect=TimeoutError and inspect how your calling code responds.

### Simple exercise 1

Patch a clock where a module looks it up.

<details>
<summary>Reveal reference solution</summary>

```python
# clocked.py: from time import time
# def timestamp(): return time()
# test_clocked.py:
# from unittest.mock import patch
# import clocked
# with patch("clocked.time", return_value=123):
#     assert clocked.timestamp() == 123
```

</details>

### Simple exercise 2

Assert the arguments supplied to a patched dependency without asserting internal call order.

<details>
<summary>Reveal reference solution</summary>

```python
from unittest.mock import Mock
dependency = Mock(return_value={"ok": True})
def fetch(client, customer_id): return client.get(customer_id=customer_id)
client = Mock(); client.get = dependency
assert fetch(client, "c1") == {"ok": True}
dependency.assert_called_once_with(customer_id="c1")
```

</details>

### Practical exercise

Test an HTTP adapter without making real network calls.

<details>
<summary>Reveal reference solution</summary>

```python
from unittest.mock import Mock
def fetch(client, url):
    response = client.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
client = Mock(); client.get.return_value.json.return_value = {"id": "c1"}
assert fetch(client, "https://example.invalid/customer") == {"id": "c1"}
```

</details>

### Debugging exercise

Patching the original module does not affect a from-imported reference. Patch the lookup location.

<details>
<summary>Reveal reference solution</summary>

```python
# app.py imports: from time import time
# Patch app.time, NOT time.time, because app retains its own binding.
# with unittest.mock.patch("app.time", return_value=0):
#     assert app.timestamp() == 0
# Alternatively import time as a module, then call time.time().
```

</details>

**Interview question:** Why patch where a name is looked up rather than where it was defined?

**Explain in your own words:** Explain mocks and patching lookup locations in your own words. Use a concrete example to show why this is true: A patch must replace the reference used by the code under test, which may differ from the original definition.

<a id="monkeypatch"></a>

## Monkeypatching environment and state

monkeypatch temporarily alters attributes, environment variables, and paths, then restores them.

**Why it matters:** Tests should not leave global state modified.

**Prerequisites:** [pytest fixtures and lifetime](week-3.md#fixtures), [Configuration and structured logging](week-3.md#configuration)

**Difficulty:** Intermediate · **Code concepts:** monkeypatch.setenv, setattr, delenv

[Environment variables](https://docs.pytest.org/en/stable/how-to/monkeypatch.html#monkeypatching-environment-variables) · [Additional reading](https://docs.pytest.org/en/stable/how-to/fixtures.html#fixture-scopes)

**Read for:** Trace setenv and automatic restoration after the test.

### Learn with an example

This standard-library demonstration temporarily changes an environment mapping and restores it on exit. pytest's monkeypatch.setenv gives the same scoped intent with automatic restoration at fixture teardown.

**Concept model** - Browser-compatible Python

This example isolates the concept; it is not a production framework implementation.

```python
import os
from unittest.mock import patch
with patch.dict(os.environ, {"DEMO_REGION": "test"}):
    print(os.environ["DEMO_REGION"])
print("context restored")
```

**Expected output**

```text
test
context restored
```

**Watch out for:** Changing os.environ without restoring it makes tests depend on execution order.

**Change one thing:** Use monkeypatch.setenv in a pytest test and verify that a later test sees its original environment.

### Simple exercise 1

Change an environment variable for one test.

<details>
<summary>Reveal reference solution</summary>

```python
import os
def test_environment(monkeypatch):
    monkeypatch.setenv("APP_MODE", "test")
    assert os.environ["APP_MODE"] == "test"
```

</details>

### Simple exercise 2

Temporarily remove an environment variable and verify the loader's missing-value behavior.

<details>
<summary>Reveal reference solution</summary>

```python
import os
def load_mode(): return os.getenv("APP_MODE", "local")
def test_missing(monkeypatch):
    monkeypatch.delenv("APP_MODE", raising=False)
    assert load_mode() == "local"
```

</details>

### Practical exercise

Test a configuration loader with missing and invalid settings.

<details>
<summary>Reveal reference solution</summary>

```python
import os, pytest
def load():
    value = int(os.getenv("TIMEOUT", "30"))
    if value < 0: raise ValueError("negative timeout")
    return value
def test_config(monkeypatch):
    monkeypatch.delenv("TIMEOUT", raising=False); assert load() == 30
    monkeypatch.setenv("TIMEOUT", "bad")
    with pytest.raises(ValueError): load()
```

</details>

### Debugging exercise

A test edits os.environ directly and breaks a later test. Make restoration automatic.

<details>
<summary>Reveal reference solution</summary>

```python
import os
def test_isolated(monkeypatch):
    before = os.getenv("APP_MODE")
    with monkeypatch.context() as patch:
        patch.setenv("APP_MODE", "test")
        assert os.environ["APP_MODE"] == "test"
    assert os.getenv("APP_MODE") == before
```

</details>

**Interview question:** How is monkeypatch useful beyond replacing functions?

**Explain in your own words:** Explain monkeypatching environment and state in your own words. Use a concrete example to show why this is true: monkeypatch temporarily alters attributes, environment variables, and paths, then restores them.

<a id="fakes"></a>

## Fakes and dependency boundaries

A fake implements a dependency contract with simplified deterministic behavior.

**Why it matters:** Explicit contracts reduce over-mocking of internal details.

**Prerequisites:** [Protocol and structural subtyping](week-3.md#protocol), [pytest fixtures and lifetime](week-3.md#fixtures)

**Difficulty:** Intermediate · **Code concepts:** Protocol, constructor injection, in-memory fake

[Mock side_effect](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.Mock.side_effect) · [Additional reading](https://docs.python.org/3/library/typing.html#typing.Protocol)

**Read for:** Compare configured mock outcomes with a small stateful fake implementing a real interface.

### Learn with an example

A fake implements a small working behavior instead of returning one canned response. It is useful for testing flows across multiple operations. A contract test should verify that the real adapter obeys the same promises.

**Worked example** - Browser-compatible Python

```python
class MemoryStore:
    def __init__(self):
        self.data = {}
    def save(self, key, value):
        self.data[key] = value
    def load(self, key):
        return self.data[key]
store = MemoryStore()
store.save("a", "draft")
print(store.load("a"))
```

**Expected output**

```text
draft
```

**Watch out for:** An in-memory fake does not reproduce database transactions, concurrency or persistence after a crash.

**Change one thing:** Define the missing-key behavior and test both the fake and real store against it.

### Simple exercise 1

Implement an in-memory Writer fake.

<details>
<summary>Reveal reference solution</summary>

```python
class MemoryWriter:
    def __init__(self): self.parts = []
    def write(self, text): self.parts.append(text)
writer = MemoryWriter(); writer.write("a"); writer.write("b")
assert "".join(writer.parts) == "ab"
```

</details>

### Simple exercise 2

Use the same writer contract assertions against an in-memory fake and a file implementation.

<details>
<summary>Reveal reference solution</summary>

```python
from io import StringIO
def contract(writer, read):
    writer.write("a"); writer.write("b")
    assert read() == "ab"
memory = StringIO(); contract(memory, memory.getvalue)
def test_file(tmp_path):
    path = tmp_path / "out.txt"
    with path.open("w+", encoding="utf-8") as handle:
        def read(): handle.flush(); handle.seek(0); return handle.read()
        contract(handle, read)
```

</details>

### Practical exercise

Test report orchestration against a fake repository.

<details>
<summary>Reveal reference solution</summary>

```python
class FakeRepository:
    def all(self): return [{"amount": 2}, {"amount": 3}]
def report(repository): return sum(row["amount"] for row in repository.all())
assert report(FakeRepository()) == 5
```

</details>

### Debugging exercise

A mock-based test passes while the fake violates real ordering semantics. Add contract checks.

<details>
<summary>Reveal reference solution</summary>

```python
class MemoryWriter:
    def __init__(self): self.parts = []
    def write(self, text): self.parts.append(text)  # Preserve insertion order.
    def read(self): return "".join(self.parts)
def contract(writer):
    writer.write("b"); writer.write("a")
    assert writer.read() == "ba"  # A fake that sorts output fails.
contract(MemoryWriter())
```

</details>

**Interview question:** When is a fake more useful than a mock?

**Explain in your own words:** Explain fakes and dependency boundaries in your own words. Use a concrete example to show why this is true: A fake implements a dependency contract with simplified deterministic behavior.

<a id="debugging"></a>

## Debugging from tracebacks

A traceback describes the call path and failure location, not automatically the original cause.

**Why it matters:** Following evidence builds independence from coding agents.

**Prerequisites:** [Raising and handling exceptions](week-1.md#exceptions), [pytest assertions and test discovery](week-3.md#pytest)

**Difficulty:** Intermediate · **Code concepts:** traceback, breakpoint, pdb

[Debugger commands](https://docs.python.org/3/library/pdb.html#debugger-commands) · [Additional reading](https://docs.python.org/3/tutorial/errors.html#handling-exceptions)

**Read for:** Find where, p and next; inspect a failing value before changing the implementation.

### Learn with an example

The failure comes from a string at the boundary, not from arithmetic itself. Inspecting the value and its type gives a hypothesis you can reproduce. Conversion repairs this valid numeric input but still needs an invalid-input policy.

**Worked example** - Browser-compatible Python

```python
record = {"count": "3"}
print(type(record["count"]).__name__)
try:
    result = record["count"] + 1
except TypeError:
    print("inspect the input type before adding")
print(int(record["count"]) + 1)
```

**Expected output**

```text
str
inspect the input type before adding
4
```

**Watch out for:** Changing operators without inspecting inputs can hide the actual contract mismatch.

**Change one thing:** Replace 3 with many and decide where conversion errors should be handled.

### Simple exercise 1

Trigger a nested exception and identify each stack frame.

<details>
<summary>Reveal reference solution</summary>

```python
import traceback
def parse(text): return int(text)
def handle(): return parse("bad")
try: handle()
except ValueError: traceback.print_exc()
# Read caller -> handle -> parse -> int; 'bad' originates in handle.
```

</details>

### Simple exercise 2

Set a breakpoint before a failing call and inspect the actual argument types.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(value):
    breakpoint()  # In pdb: p value ; p type(value) ; where ; next
    return int(value)
# Call parse(None) interactively; inspect NoneType before the failing int call.
```

</details>

### Practical exercise

Debug a failing parser test using the traceback and documentation.

<details>
<summary>Reveal reference solution</summary>

```python
def parse(text):
    if not isinstance(text, str): raise TypeError("text must be str")
    return int(text)
# Reproduce with parse(None); inspect the traceback and int documentation.
# Repair the caller to pass text, rather than swallowing TypeError.
print(parse('12'))  # Expected: 12
```

</details>

### Debugging exercise

The last frame appears in a library but the invalid argument originated in your caller. Trace the value backward.

<details>
<summary>Reveal reference solution</summary>

```python
import json
payload = {"count": 2}
# json.loads(payload) fails in the library because loads expects serialized data.
encoded = json.dumps(payload)
print(json.loads(encoded))  # Expected: payload
# Trace payload back to its producer; avoid decoding an already-decoded object.
```

</details>

**Interview question:** How do you distinguish the failure site from the root cause?

**Explain in your own words:** Explain debugging from tracebacks in your own words. Use a concrete example to show why this is true: A traceback describes the call path and failure location, not automatically the original cause.

<a id="test-boundaries"></a>

## Unit, integration, and contract tests

Different test layers verify local logic, real integrations, and shared interface promises.

**Why it matters:** Passing isolated tests cannot establish end-to-end correctness.

**Prerequisites:** [Fakes and dependency boundaries](week-3.md#fakes), [Testing exceptions and failure contracts](week-3.md#exception-tests)

**Difficulty:** Intermediate · **Code concepts:** unit test, integration fixture, contract

[Safe fixture structure](https://docs.pytest.org/en/stable/how-to/fixtures.html#safe-fixture-structure) · [Additional reading](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.Mock.side_effect)

**Read for:** Trace setup and teardown boundaries; decide which external dependency each test actually exercises.

### Learn with an example

Injecting price_lookup isolates the multiplication in a unit test. A separate adapter test must check real lookup behavior, and an integration test checks the wiring between them. One test cannot establish all three guarantees cheaply.

**Concept model** - Browser-compatible Python

This example isolates the concept; it is not a production framework implementation.

```python
def total_price(quantity, price_lookup):
    return quantity * price_lookup("item")
print(total_price(3, lambda key: 4))
```

**Expected output**

```text
12
```

**Watch out for:** Replacing every dependency with a stub leaves real integration untested.

**Change one thing:** List one unit failure, one adapter failure and one end-to-end failure for this tiny function.

### Simple exercise 1

Classify three analyzer behaviors by the cheapest meaningful test.

<details>
<summary>Reveal reference solution</summary>

```python
# Pure normalization -> unit test: fast, no IO.
# UTF-8 file reading -> integration test with a temporary real file.
# Installed CLI invocation -> subprocess end-to-end smoke test.
def test_normalization(): assert " info ".strip().upper() == "INFO"
```

</details>

### Simple exercise 2

Introduce an adapter-specific failure that only an integration test can detect.

<details>
<summary>Reveal reference solution</summary>

```python
import pytest
def test_bad_encoding(tmp_path):
    path = tmp_path / "events.log"; path.write_bytes(b"\xff")
    with pytest.raises(UnicodeDecodeError): path.read_text(encoding="utf-8")
# A string-list fake cannot exercise the real decoding boundary.
```

</details>

### Practical exercise

Test a real file adapter alongside pure transformation tests.

<details>
<summary>Reveal reference solution</summary>

```python
def normalize(text): return text.strip().upper()
def test_pure(): assert normalize(" info ") == "INFO"
def test_file(tmp_path):
    path = tmp_path / "events.log"; path.write_text("info\n", encoding="utf-8")
    assert [normalize(x) for x in path.read_text(encoding="utf-8").splitlines()] == ["INFO"]
```

</details>

### Debugging exercise

An in-memory fake accepts data the real adapter rejects. Add a contract test using both implementations.

<details>
<summary>Reveal reference solution</summary>

```python
from io import StringIO
import pytest
def writer_contract(writer):
    with pytest.raises(TypeError): writer.write(123)
def test_memory(): writer_contract(StringIO())
def test_file(tmp_path):
    with (tmp_path / "out").open("w", encoding="utf-8") as writer:
        writer_contract(writer)
# A fake silently accepting integers violates the real text-writer contract.
```

</details>

**Interview question:** What should an integration test prove that a unit test cannot?

**Explain in your own words:** Explain unit, integration, and contract tests in your own words. Use a concrete example to show why this is true: Different test layers verify local logic, real integrations, and shared interface promises.

