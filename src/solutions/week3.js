export default {
packages: [
`# parser.py
def parse(text): return int(text)
# caller.py (separate file)
# from parser import parse
# print(parse("2"))`,
`print(__name__)
if __name__ == "__main__": print("entry point")
# Save as example.py. 'python example.py' prints __main__.
# 'python -c "import example"' prints example without entry-point work.`,
`# Layout: pyproject.toml, src/analyzer/__init__.py,
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
# Install: python -m pip install -e . ; Run: python -m analyzer`,
`# Package file: analyzer/__main__.py
# from .parser import parse
# Correct command from the package's parent: python -m analyzer
# Directly running analyzer/__main__.py lacks a known parent package.
# Avoid sys.path hacks; install the package and use module execution.`],
environment: [
`# Shell: python -m venv .venv
# Windows: .venv\\Scripts\\python -c "import sys; print(sys.executable)"
# POSIX: .venv/bin/python -c "import sys; print(sys.executable)"
import sys
print(sys.executable, sys.prefix, sys.base_prefix)`,
`# python -m venv .venv-check
# Windows: .venv-check\\Scripts\\python -m pip install .
# Windows: .venv-check\\Scripts\\python -c "import analyzer; print(analyzer.__file__)"
# POSIX: replace .venv-check\\Scripts\\python with .venv-check/bin/python.
# Run the import check outside the source directory as well.`,
`# Build/install from the project containing pyproject.toml:
# python -m venv .venv-clean
# .venv-clean\\Scripts\\python -m pip install .
# .venv-clean\\Scripts\\python -m analyzer
# A non-editable install verifies packaging includes the needed modules.`,
`import sys, subprocess
print("running:", sys.executable)
subprocess.run([sys.executable, "-m", "pip", "--version"], check=True)
# Use this same interpreter for '-m pip install ...' and execution.
# A bare pip command can belong to another environment.`],
configuration: [
`import os
def load_timeout():
    value = int(os.getenv("TIMEOUT", "30"))
    if value < 0: raise ValueError("TIMEOUT must be nonnegative")
    return value
assert load_timeout() >= 0`,
`import json
for event in ("started", "completed"):
    print(json.dumps({"request_id": "r1", "event": event}))`,
`import json, logging
logging.basicConfig(level=logging.INFO, format="%(message)s")
logging.getLogger("analyzer").info(json.dumps({
    "event": "report_completed", "request_id": "r1", "record_count": 12
}))`,
`# library.py: create a logger, but do not add output handlers.
import logging
logger = logging.getLogger(__name__)
def run(): logger.info("ready")
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)  # Configure once in entry point.
    run()
# Duplicate module handlers plus root propagation caused duplicate lines.`],
unions: [
`def normalize(status: str | None) -> str:
    if status is None: return "unknown"
    return status.upper()
assert normalize(None) == "unknown"`,
`from typing import Literal, assert_never
Status = Literal["open", "closed"]
def label(status: Status) -> str:
    if status == "open": return "Active"
    if status == "closed": return "Finished"
    assert_never(status)
# A static checker rejects: status: Status = "pending"`,
`from dataclasses import dataclass
from typing import Literal
@dataclass
class ParseResult:
    mode: Literal["strict", "lenient"]
    count: int
assert ParseResult("strict", 2).mode == "strict"`,
`def length(value: str | None) -> int:
    if value is None: return 0
    return len(value)
assert length(None) == 0 and length("abc") == 3`],
'callable-types': [
`from collections.abc import Callable
def apply(text: str, transform: Callable[[str], str]) -> str:
    return transform(text)
assert apply("info", str.upper) == "INFO"`,
`from collections.abc import Callable
def good(text: str) -> str: return text.upper()
def bad(text: str, extra: int) -> str: return text * extra
callback: Callable[[str], str] = good
# Static error: callback = bad (requires a second argument).`,
`from collections.abc import Callable
registry: dict[str, Callable[[str], str]] = {"upper": str.upper}
def wrong(text: str) -> int: return len(text)
# Static error: registry["length"] = wrong
assert registry["upper"]("ok") == "OK"`,
`from collections.abc import Callable
def consume(callback: Callable[[str], str]) -> str: return callback("x")
def wrong(text: str) -> None: print(text)
# Run mypy/pyright on consume(wrong): incompatible return type.
def fixed(text: str) -> str: return text
assert consume(fixed) == "x"`],
generics: [
`from typing import TypeVar
from collections.abc import Sequence
T = TypeVar("T")
def first(values: Sequence[T]) -> T: return values[0]
assert first([1, 2]) == 1`,
`from typing import TypeVar, assert_type
from collections.abc import Sequence
T = TypeVar("T")
def first(values: Sequence[T]) -> T: return values[0]
assert_type(first([1, 2]), int)
assert_type(first(["a"]), str)`,
`from typing import Protocol, TypeVar
T_co = TypeVar("T_co", covariant=True)
class Repository(Protocol[T_co]):
    def get(self, key: str) -> T_co | None: ...
# Repository[Customer].get preserves Customer | None at call sites.`,
`from typing import TypeVar
from collections.abc import Sequence
T = TypeVar("T")
def first(values: Sequence[T]) -> T: return values[0]
value = first([1])
# A checker rejects value.upper(); an Any result would conceal the bug.
assert value + 1 == 2`],
protocol: [
`from typing import Protocol
class Writer(Protocol):
    def write(self, text: str) -> None: ...
class Memory:
    def __init__(self): self.parts: list[str] = []
    def write(self, text: str) -> None: self.parts.append(text)
class Console:
    def write(self, text: str) -> None: print(text)
writers: list[Writer] = [Memory(), Console()]`,
`from typing import Protocol
class Writer(Protocol):
    def write(self, text: str) -> None: ...
class Compatible:
    def write(self, text: str) -> None: print(text)
writer: Writer = Compatible()  # Structural typing; no inheritance required.`,
`from typing import Protocol
class Sink(Protocol):
    def write(self, text: str) -> None: ...
def report(count: int, sink: Sink) -> None:
    sink.write(f"Records: {count}\\n")
# Test with Memory; production can provide a file adapter.`,
`from typing import Protocol
class Writer(Protocol):
    def write(self, text: str) -> None: ...
class Wrong:
    def write(self, text: bytes) -> None: pass
# Static error: writer: Writer = Wrong()
class Fixed:
    def write(self, text: str) -> None: pass
writer: Writer = Fixed()`],
typeddict: [
`from typing import TypedDict, NotRequired
class Event(TypedDict):
    id: str
    label: NotRequired[str]
event: Event = {"id": "e1"}
assert "label" not in event`,
`from typing import TypedDict, NotRequired
class Event(TypedDict):
    label: NotRequired[str | None]
missing: Event = {}; present: Event = {"label": None}
assert "label" not in missing and "label" in present`,
`from typing import TypedDict
class Event(TypedDict):
    id: str
    severity: str
def adapt(value: object) -> Event:
    if not isinstance(value, dict): raise ValueError("object required")
    if not isinstance(value.get("id"), str) or not isinstance(value.get("severity"), str):
        raise ValueError("string id/severity required")
    return {"id": value["id"], "severity": value["severity"]}`, 
`from typing import TypedDict
class Event(TypedDict): id: str
bad = Event(id=123)  # Static error, but ordinary dict at runtime.
assert isinstance(bad, dict)
def validate(value):
    if not isinstance(value, dict) or not isinstance(value.get("id"), str):
        raise ValueError("string id required")
    return value`],
'type-narrowing': [
`def normalize(value: str | int) -> str:
    if isinstance(value, str): return value.strip()
    return str(value)
assert normalize(" x ") == "x" and normalize(3) == "3"`,
`from typing import assert_type
def inspect(value: str | int):
    if isinstance(value, str): assert_type(value, str)
    else: assert_type(value, int)`,
`import json
def double(value: int) -> int: return value * 2
def parse(text: str) -> int:
    data = json.loads(text)
    if not isinstance(data, dict) or type(data.get("count")) is not int:
        raise ValueError("integer count required")
    return double(data["count"])
assert parse('{"count":2}') == 4`,
`def validate(count):
    if type(count) is not int or count < 0:
        raise ValueError("nonnegative integer required")
    return count
# Explicit checks remain active under python -O; assert statements do not.
assert validate(0) == 0`],
pytest: [
`# Save as test_normalize.py; run python -m pytest.
def normalize(text): return text.strip().upper()
def test_normalize(): assert normalize(" info ") == "INFO"
def test_demonstrate_failure(): assert normalize("info") == "info"  # Intentionally fails.`,
`# python -m pytest test_normalize.py::test_normalize -v
def normalize(text): return text.strip().upper()
def test_normalize(): assert normalize("info") == "INFO"
# Change expected value to 'info', rerun, and inspect actual vs expected.`,
`from collections import Counter
def aggregate(events): return dict(Counter(e["severity"] for e in events))
def test_empty(): assert aggregate([]) == {}
def test_repeated():
    assert aggregate([{"severity": "ERROR"}, {"severity": "ERROR"}]) == {"ERROR": 2}`, 
`# Default collection: test_*.py or *_test.py, functions named test_*.
# Rename check_parser.py -> test_parser.py; check_empty -> test_empty.
# Verify with: python -m pytest --collect-only -q
def test_empty(): assert len([]) == 0`],
fixtures: [
`import pytest
@pytest.fixture
def events(): return []
def test_mutation(events): events.append("a"); assert events == ["a"]
def test_fresh(events): assert events == []`,
`import pytest
@pytest.fixture
def resource(tmp_path):
    marker = tmp_path / "active"; marker.touch()
    yield marker
    marker.unlink()
    assert not marker.exists()  # Teardown runs even if the test fails.
def test_failure(resource): assert False  # Intentional; run with --setup-show.`,
`import pytest
@pytest.fixture
def logs(tmp_path):
    path = tmp_path / "events.log"
    path.write_text("INFO ready\\n", encoding="utf-8")
    return path
def test_log(logs): assert logs.read_text(encoding="utf-8") == "INFO ready\\n"`,
`import pytest
@pytest.fixture(scope="function")
def events(): return []
def test_first(events): events.append(1)
def test_second(events): assert events == []
# Function scope replaces a shared session-scoped mutable list.`],
parametrize: [
`import pytest
def parse(text): return int(text)
@pytest.mark.parametrize("text, expected", [("2", 2), ("", None), ("bad", None)])
def test_parse(text, expected):
    if expected is None:
        with pytest.raises(ValueError): parse(text)
    else: assert parse(text) == expected`,
`import pytest
@pytest.mark.parametrize("text, expected", [("info", "INFO"), ("", "")], ids=["lowercase", "empty"])
def test_normalize(text, expected): assert text.upper() == expected
# python -m pytest 'test_levels.py::test_normalize[empty]'`,
`import pytest
@pytest.mark.parametrize("raw, expected", [("info", "INFO"), (" ERROR ", "ERROR"), ("", "")])
def test_normalize(raw, expected): assert raw.strip().upper() == expected`,
`import pytest
@pytest.mark.parametrize("seed", [(1,), (2,)])
def test_append(seed):
    values = list(seed)  # Allocate local mutable state from immutable cases.
    values.append(3)
    assert values[-1] == 3 and len(seed) == 1`],
'exception-tests': [
`import pytest
def validate(count):
    if count < 0: raise ValueError("count must be nonnegative")
    return count
def test_invalid():
    with pytest.raises(ValueError, match="nonnegative"): validate(-1)`,
`import pytest
def validate(count):
    if count < 0: raise ValueError("negative count")
    return count
def test_zero(): assert validate(0) == 0
def test_negative():
    with pytest.raises(ValueError, match="negative"): validate(-1)`,
`import pytest
def parse(line, number):
    try: return int(line)
    except ValueError as error: raise ValueError(f"line {number}: invalid integer") from error
def test_context():
    with pytest.raises(ValueError, match="line 4: invalid integer"): parse("bad", 4)`,
`import pytest
def parse(text): return int(text)
def test_invalid_text():
    with pytest.raises(ValueError): parse("bad")
# pytest.raises(Exception) would also swallow TypeError from parse(None),
# concealing the wrong test setup or a programming error.`],
mocking: [
`# clocked.py: from time import time
# def timestamp(): return time()
# test_clocked.py:
# from unittest.mock import patch
# import clocked
# with patch("clocked.time", return_value=123):
#     assert clocked.timestamp() == 123`,
`from unittest.mock import Mock
dependency = Mock(return_value={"ok": True})
def fetch(client, customer_id): return client.get(customer_id=customer_id)
client = Mock(); client.get = dependency
assert fetch(client, "c1") == {"ok": True}
dependency.assert_called_once_with(customer_id="c1")`,
`from unittest.mock import Mock
def fetch(client, url):
    response = client.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
client = Mock(); client.get.return_value.json.return_value = {"id": "c1"}
assert fetch(client, "https://example.invalid/customer") == {"id": "c1"}`, 
`# app.py imports: from time import time
# Patch app.time, NOT time.time, because app retains its own binding.
# with unittest.mock.patch("app.time", return_value=0):
#     assert app.timestamp() == 0
# Alternatively import time as a module, then call time.time().`],
monkeypatch: [
`import os
def test_environment(monkeypatch):
    monkeypatch.setenv("APP_MODE", "test")
    assert os.environ["APP_MODE"] == "test"`,
`import os
def load_mode(): return os.getenv("APP_MODE", "local")
def test_missing(monkeypatch):
    monkeypatch.delenv("APP_MODE", raising=False)
    assert load_mode() == "local"`,
`import os, pytest
def load():
    value = int(os.getenv("TIMEOUT", "30"))
    if value < 0: raise ValueError("negative timeout")
    return value
def test_config(monkeypatch):
    monkeypatch.delenv("TIMEOUT", raising=False); assert load() == 30
    monkeypatch.setenv("TIMEOUT", "bad")
    with pytest.raises(ValueError): load()`,
`import os
def test_isolated(monkeypatch):
    before = os.getenv("APP_MODE")
    with monkeypatch.context() as patch:
        patch.setenv("APP_MODE", "test")
        assert os.environ["APP_MODE"] == "test"
    assert os.getenv("APP_MODE") == before`],
fakes: [
`class MemoryWriter:
    def __init__(self): self.parts = []
    def write(self, text): self.parts.append(text)
writer = MemoryWriter(); writer.write("a"); writer.write("b")
assert "".join(writer.parts) == "ab"`,
`from io import StringIO
def contract(writer, read):
    writer.write("a"); writer.write("b")
    assert read() == "ab"
memory = StringIO(); contract(memory, memory.getvalue)
def test_file(tmp_path):
    path = tmp_path / "out.txt"
    with path.open("w+", encoding="utf-8") as handle:
        def read(): handle.flush(); handle.seek(0); return handle.read()
        contract(handle, read)`,
`class FakeRepository:
    def all(self): return [{"amount": 2}, {"amount": 3}]
def report(repository): return sum(row["amount"] for row in repository.all())
assert report(FakeRepository()) == 5`,
`class MemoryWriter:
    def __init__(self): self.parts = []
    def write(self, text): self.parts.append(text)  # Preserve insertion order.
    def read(self): return "".join(self.parts)
def contract(writer):
    writer.write("b"); writer.write("a")
    assert writer.read() == "ba"  # A fake that sorts output fails.
contract(MemoryWriter())`],
debugging: [
`import traceback
def parse(text): return int(text)
def handle(): return parse("bad")
try: handle()
except ValueError: traceback.print_exc()
# Read caller -> handle -> parse -> int; 'bad' originates in handle.`,
`def parse(value):
    breakpoint()  # In pdb: p value ; p type(value) ; where ; next
    return int(value)
# Call parse(None) interactively; inspect NoneType before the failing int call.`,
`def parse(text):
    if not isinstance(text, str): raise TypeError("text must be str")
    return int(text)
# Reproduce with parse(None); inspect the traceback and int documentation.
# Repair the caller to pass text, rather than swallowing TypeError.
assert parse("12") == 12`,
`import json
payload = {"count": 2}
# json.loads(payload) fails in the library because loads expects serialized data.
encoded = json.dumps(payload)
assert json.loads(encoded) == payload
# Trace payload back to its producer; avoid decoding an already-decoded object.`],
'test-boundaries': [
`# Pure normalization -> unit test: fast, no IO.
# UTF-8 file reading -> integration test with a temporary real file.
# Installed CLI invocation -> subprocess end-to-end smoke test.
def test_normalization(): assert " info ".strip().upper() == "INFO"`,
`import pytest
def test_bad_encoding(tmp_path):
    path = tmp_path / "events.log"; path.write_bytes(b"\\xff")
    with pytest.raises(UnicodeDecodeError): path.read_text(encoding="utf-8")
# A string-list fake cannot exercise the real decoding boundary.`,
`def normalize(text): return text.strip().upper()
def test_pure(): assert normalize(" info ") == "INFO"
def test_file(tmp_path):
    path = tmp_path / "events.log"; path.write_text("info\\n", encoding="utf-8")
    assert [normalize(x) for x in path.read_text(encoding="utf-8").splitlines()] == ["INFO"]`,
`from io import StringIO
import pytest
def writer_contract(writer):
    with pytest.raises(TypeError): writer.write(123)
def test_memory(): writer_contract(StringIO())
def test_file(tmp_path):
    with (tmp_path / "out").open("w", encoding="utf-8") as writer:
        writer_contract(writer)
# A fake silently accepting integers violates the real text-writer contract.`]
};
