export default {
'base-model': [
`from pydantic import BaseModel, Field, ValidationError
class Note(BaseModel):
    customer_id: int = Field(gt=0)
    note: str = Field(min_length=1)
assert Note.model_validate({"customer_id": 1, "note": "hello"}).customer_id == 1
try: Note(customer_id=0, note="")
except ValidationError as error: assert len(error.errors()) == 2`,
`from pydantic import BaseModel, Field, ValidationError
class Note(BaseModel):
    customer_id: int = Field(gt=0)
    note: str = Field(min_length=1)
try: Note(customer_id=-1, note="")
except ValidationError as error:
    assert {tuple(e["loc"]) for e in error.errors()} == {("customer_id",), ("note",)}`, 
`from pydantic import BaseModel, Field, ConfigDict
class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: str = Field(min_length=1)
    limit: int = Field(default=100, gt=0, le=10000)
assert AnalyzeRequest(source="events.log").limit == 100`,
`from pydantic import BaseModel, Field, ValidationError
class Request(BaseModel): count: int = Field(gt=0)
assert Request.model_construct(count=-1).count == -1  # Bypasses validation.
try: Request.model_validate({"count": -1})
except ValidationError: print("untrusted input rejected")`],
'pydantic-fields': [
`from pydantic import BaseModel, Field
class Note(BaseModel):
    customer_id: int = Field(gt=0)
    note: str = Field(min_length=1, max_length=500)
assert Note(customer_id=1, note="hello").note == "hello"`,
`from pydantic import BaseModel, Field
class Record(BaseModel): tags: list[str] = Field(default_factory=list)
a, b = Record(), Record(); a.tags.append("a")
assert b.tags == [] and a.tags is not b.tags`,
`from pydantic import BaseModel, Field, ConfigDict, ValidationError
class Note(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=500)
try: Note(text="   ")
except ValidationError: print("blank note rejected before tool execution")`,
`from pydantic import BaseModel, Field, ValidationError
class Customer(BaseModel): id: int = Field(gt=0)
for invalid in (0, -1):
    try: Customer(id=invalid)
    except ValidationError: pass
    else: raise AssertionError("positive constraint missing")
assert Customer(id=1).id == 1`],
'field-validators': [
`from pydantic import BaseModel, field_validator
class Event(BaseModel):
    severity: str
    @field_validator("severity")
    @classmethod
    def normalize(cls, value):
        value = value.strip().upper()
        if value not in {"INFO", "ERROR"}: raise ValueError("unsupported severity")
        return value
assert Event(severity=" info ").severity == "INFO"`,
`from pydantic import BaseModel, field_validator
seen = []
class Count(BaseModel):
    value: int
    @field_validator("value", mode="before")
    @classmethod
    def before(cls, value): seen.append(type(value)); return value
    @field_validator("value")
    @classmethod
    def after(cls, value): seen.append(type(value)); return value
Count(value="2"); assert seen == [str, int]`,
`import re
from pydantic import BaseModel, field_validator
class CustomerRef(BaseModel):
    id: str
    @field_validator("id")
    @classmethod
    def normalize(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"c[1-9][0-9]*", value): raise ValueError("expected c followed by positive digits")
        return value
assert CustomerRef(id=" C12 ").id == "c12"`,
`from pydantic import BaseModel, field_validator
class Count(BaseModel):
    value: int
    @field_validator("value", mode="after")
    @classmethod
    def positive(cls, value):
        if value <= 0: raise ValueError("positive count required")
        return value
assert Count(value="2").value == 2
# Before validators receive raw text; arithmetic belongs after integer parsing.`],
'model-validators': [
`from datetime import datetime
from pydantic import BaseModel, model_validator
class Window(BaseModel):
    start: datetime
    end: datetime
    @model_validator(mode="after")
    def ordered(self):
        if self.end <= self.start: raise ValueError("end must follow start")
        return self
assert Window(start="2025-01-01", end="2025-01-02").end > Window(start="2025-01-01", end="2025-01-02").start`,
`from pydantic import BaseModel, model_validator, ValidationError
class Window(BaseModel):
    start: int
    end: int
    @model_validator(mode="after")
    def ordered(self):
        if self.end <= self.start: raise ValueError("end must follow start")
        return self
for start, end in ((1, 1), (1, 2), (2, 1)):
    try: Window(start=start, end=end)
    except ValidationError: assert end <= start
    else: assert end > start`,
`from datetime import date
from pydantic import BaseModel, model_validator
class ReportRange(BaseModel):
    start: date
    end: date
    @model_validator(mode="after")
    def ordered(self):
        if self.end <= self.start: raise ValueError("end must follow start")
        return self
def query(payload, repository):
    window = ReportRange.model_validate(payload)
    return repository.between(window.start, window.end)`,
`from pydantic import BaseModel, model_validator, ValidationError
class Range(BaseModel):
    start: int
    end: int
    @model_validator(mode="after")
    def check_range(self):
        if self.end <= self.start: raise ValueError("reversed or empty range")
        return self
try: Range(start=10, end=2)
except ValidationError: print("cross-field invariant enforced")`],
'nested-models': [
`from pydantic import BaseModel, Field
class Order(BaseModel): id: int = Field(gt=0)
class Customer(BaseModel): orders: list[Order]
assert Customer(orders=[{"id": 1}]).orders[0].id == 1`,
`from pydantic import BaseModel, Field, ValidationError
class Order(BaseModel): id: int = Field(gt=0)
class Customer(BaseModel): orders: list[Order]
try: Customer(orders=[{"id": 1}, {"id": 0}])
except ValidationError as error: assert error.errors()[0]["loc"] == ("orders", 1, "id")`,
`from pydantic import BaseModel, Field
class Requester(BaseModel): customer_id: str = Field(min_length=1)
class Source(BaseModel):
    document_id: str
    version: int = Field(gt=0)
class Ticket(BaseModel):
    requester: Requester
    sources: list[Source]
assert Ticket(requester={"customer_id": "c1"}, sources=[{"document_id": "d1", "version": 1}]).sources[0].version == 1`,
`from pydantic import BaseModel, Field, ValidationError
class Order(BaseModel): amount: int = Field(ge=0)
class Payload(BaseModel): order: Order  # Not an unconstrained dict.
try: Payload(order={"amount": -1})
except ValidationError as error: assert error.errors()[0]["loc"] == ("order", "amount")`],
discriminators: [
`from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter
class Success(BaseModel):
    kind: Literal["success"]
    value: str
class Error(BaseModel):
    kind: Literal["error"]
    code: str
result = TypeAdapter(Annotated[Success | Error, Field(discriminator="kind")])
assert isinstance(result.validate_python({"kind": "success", "value": "ok"}), Success)`,
`from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter, ValidationError
class Read(BaseModel): kind: Literal["read"]
class Write(BaseModel): kind: Literal["write"]
adapter = TypeAdapter(Annotated[Read | Write, Field(discriminator="kind")])
for kind in ("read", "write"): assert adapter.validate_python({"kind": kind}).kind == kind
try: adapter.validate_python({"kind": "unknown"})
except ValidationError: print("unknown tag rejected")`,
`from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter
class Lookup(BaseModel):
    kind: Literal["lookup"]
    customer_id: str
class CreateNote(BaseModel):
    kind: Literal["create_note"]
    customer_id: str
    note: str = Field(min_length=1)
request = TypeAdapter(Annotated[Lookup | CreateNote, Field(discriminator="kind")])
assert request.validate_python({"kind": "lookup", "customer_id": "c1"}).kind == "lookup"`,
`from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter
class Ok(BaseModel): kind: Literal["ok"]
class Error(BaseModel): kind: Literal["error"]
adapter = TypeAdapter(Annotated[Ok | Error, Field(discriminator="kind")])
payload = {"kind": "ok"}  # Producer and consumer share exact tag spelling.
assert adapter.validate_python(payload).kind == "ok"
# Add a producer/consumer contract test; do not guess missing variant tags.`],
serialization: [
`from pydantic import BaseModel, Field
class Customer(BaseModel): customer_id: str = Field(alias="customerId")
assert Customer(customerId="c1").model_dump(by_alias=True) == {"customerId": "c1"}`, 
`from datetime import datetime, timezone
from pydantic import BaseModel
class Event(BaseModel): at: datetime
event = Event(at=datetime(2025, 1, 1, tzinfo=timezone.utc))
assert isinstance(event.model_dump()["at"], datetime)
assert isinstance(event.model_dump(mode="json")["at"], str)`,
`from pydantic import BaseModel, Field
class Result(BaseModel):
    report_id: str
    internal_token: str = Field(exclude=True)
assert Result(report_id="r1", internal_token="example-only").model_dump() == {"report_id": "r1"}`, 
`from pydantic import BaseModel, Field
class Result(BaseModel): report_id: str = Field(alias="reportId")
result = Result(reportId="r1")
assert result.model_dump(by_alias=True) == {"reportId": "r1"}
assert "report_id" not in result.model_dump(by_alias=True)`],
'json-schema': [
`from pydantic import BaseModel
class Input(BaseModel):
    query: str
    limit: int = 10
schema = Input.model_json_schema()
assert schema["required"] == ["query"] and schema["properties"]["limit"]["default"] == 10`,
`from pydantic import BaseModel
class Input(BaseModel):
    required_nullable: str | None
    optional_with_default: str | None = None
assert Input.model_json_schema()["required"] == ["required_nullable"]`,
`from pydantic import BaseModel, Field
class SearchCustomer(BaseModel): query: str = Field(min_length=1, description="Customer name or stable ID")
tool = {"name": "search_customer", "description": "Read-only customer lookup", "inputSchema": SearchCustomer.model_json_schema()}
assert tool["inputSchema"]["required"] == ["query"]`,
`from pydantic import BaseModel
class Lookup(BaseModel): customer_id: str
def execute(payload, auth, repository):
    args = Lookup.model_validate(payload)
    customer = repository.get(args.customer_id)
    if customer["tenant"] != auth["tenant"]: raise PermissionError("denied")
    return customer
# JSON Schema describes input shape, not the caller's current database permissions.`],
'agent-loop': [
`responses = iter([{"tool": "lookup", "id": "c1"}, {"answer": "Ada"}])
history = []
for _ in range(3):
    response = next(responses); history.append(response)
    if "answer" in response: break
    history.append({"tool_result": {"name": "Ada"}})
assert history[-1] == {"answer": "Ada"} and "tool_result" in history[1]`,
`def run(model):
    response = model([])
    if "answer" in response: return response["answer"]
    raise ValueError("unexpected tool request")
assert run(lambda history: {"answer": "hello"}) == "hello"`,
`def assistant(model, repository, history, max_steps=3):
    for _ in range(max_steps):
        response = model(history); history.append(response)
        if "answer" in response: return response["answer"]
        if response.get("tool") != "lookup": raise ValueError("unknown tool")
        history.append({"tool_result": repository.get(response["id"])})
    raise RuntimeError("step budget exhausted")
responses = iter([{"tool": "lookup", "id": "c1"}, {"answer": "Ada"}])
assert assistant(lambda h: next(responses), {"c1": {"name": "Ada"}}, []) == "Ada"`,
`history = [{"role": "user", "content": "Find c1"}]
call = {"role": "assistant", "tool_call_id": "call-1", "name": "lookup", "arguments": {"id": "c1"}}
history.append(call)
history.append({"role": "tool", "tool_call_id": "call-1", "content": {"name": "Ada"}})
assert history[-1]["tool_call_id"] == call["tool_call_id"]
# Pass this updated history into the next model request; adapt to provider message types.`],
'pydantic-agent': [
`from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(custom_output_text="hello"))
assert agent.run_sync("Say hello").output == "hello"`,
`from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(custom_output_text="first"), deps_type=dict, output_type=str)
assert agent.run_sync("hello", deps={}).output == "first"
with agent.override(model=TestModel(custom_output_text="second")):
    assert agent.run_sync("hello", deps={}).output == "second"`,
`from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def lookup(ctx: RunContext[dict], customer_id: str) -> dict:
    return ctx.deps.get(customer_id, {"error": "not_found"})
result = agent.run_sync("Look up a customer", deps={"c1": {"name": "Ada"}})
assert result.output is not None
# TestModel exercises tooling; it does not assess real model reasoning.`,
`from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
class Answer(BaseModel): customer_id: str
agent = Agent(TestModel(custom_output_args={"customer_id": "c1"}), output_type=Answer)
answer = agent.run_sync("Find the customer").output
assert answer.customer_id == "c1"
# Domain code consumes Answer, not provider-specific response JSON.`],
'run-context': [
`from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def count_customers(ctx: RunContext[dict]) -> int: return len(ctx.deps)
result = agent.run_sync("Count customers", deps={"c1": "Ada"})
assert result.output is not None`,
`from dataclasses import dataclass
@dataclass
class Dependencies: customers: dict
def lookup(deps, customer_id): return deps.customers.get(customer_id)
a, b = Dependencies({"c1": "Ada"}), Dependencies({"c1": "Grace"})
assert lookup(a, "c1") == "Ada" and lookup(b, "c1") == "Grace"
# Pass each Dependencies instance as deps= for its corresponding agent run.`,
`from dataclasses import dataclass
@dataclass(frozen=True)
class Dependencies:
    caller_id: str
    tenant_id: str
    repository: object
def lookup(deps, customer_id):
    return deps.repository.get_for_tenant(deps.tenant_id, customer_id)
# Construct from authenticated server context; pass via Agent.run(..., deps=deps).`,
`from dataclasses import dataclass
@dataclass(frozen=True)
class RunDependencies: customer_id: str
async def handle(deps): return deps.customer_id
# No mutable global current_customer. Each concurrent run receives its own deps.
import asyncio
async def main():
    assert await asyncio.gather(handle(RunDependencies("a")), handle(RunDependencies("b"))) == ["a", "b"]
if __name__ == "__main__": asyncio.run(main())`],
'agent-tools': [
`from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def lookup_customer(ctx: RunContext[dict], customer_id: str) -> dict:
    """Read customer details without changing records."""
    return ctx.deps.get(customer_id, {"error": "not_found"})`,
`def lookup(customer_id, repository):
    if not isinstance(customer_id, str) or not customer_id.startswith("c"):
        return {"ok": False, "code": "invalid_id"}
    value = repository.get(customer_id)
    return {"ok": True, "customer": value} if value else {"ok": False, "code": "not_found"}
assert lookup("", {}) == {"ok": False, "code": "invalid_id"}`, 
`from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def get_order(ctx: RunContext[dict], order_id: str) -> dict:
    """Read one order available to the authenticated tenant."""
    order = ctx.deps["orders"].get(order_id)
    if order is None or order["tenant"] != ctx.deps["tenant"]: return {"error": "not_found"}
    return {"id": order_id, "total": order["total"]}`, 
`def lookup(authenticated_context, customer_id, repository):
    tenant = authenticated_context["tenant"]  # Not a model argument.
    customer = repository.get(customer_id)
    if customer is None or customer["tenant"] != tenant: raise PermissionError("denied")
    return customer
assert lookup({"tenant": "a"}, "c1", {"c1": {"tenant": "a"}})["tenant"] == "a"`],
'structured-output': [
`from typing import Literal
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
class Triage(BaseModel): category: Literal["billing", "technical"]
agent = Agent(TestModel(custom_output_args={"category": "billing"}), output_type=Triage)
assert agent.run_sync("Classify").output.category == "billing"`,
`from pydantic import BaseModel, ValidationError
from typing import Literal
class Triage(BaseModel): category: Literal["billing", "technical"]
responses = iter([{"category": "invalid"}, {"category": "billing"}])
for attempt in range(2):
    try: result = Triage.model_validate(next(responses)); break
    except ValidationError:
        if attempt == 1: raise
assert result.category == "billing"`,
`from typing import Literal
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
class Triage(BaseModel):
    category: Literal["billing", "technical"]
    evidence_ids: list[str] = Field(min_length=1)
agent = Agent(TestModel(custom_output_args={"category": "billing", "evidence_ids": ["d1"]}), output_type=Triage)
assert agent.run_sync("Classify with evidence").output.evidence_ids == ["d1"]
# Also verify each evidence ID exists and supports the classification.`,
`from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
from pydantic_ai.usage import UsageLimits
agent = Agent(TestModel(), retries=1)
result = agent.run_sync("Answer", usage_limits=UsageLimits(request_limit=3))
assert result.output is not None
# retries bounds validation correction; request_limit bounds total model requests.
# Surface UnexpectedModelBehavior/UsageLimitExceeded to the caller as failure.`],
'streaming-history': [
`events = [{"kind": "delta", "text": "Hel"}, {"kind": "delta", "text": "lo"}, {"kind": "done"}]
text = ""; complete = False
for event in events:
    if event["kind"] == "delta": text += event["text"]
    else: complete = True
    print(text, "complete" if complete else "partial")
assert text == "Hello" and complete`,
`from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(custom_output_text="ok"))
first = agent.run_sync("hello"); history = first.all_messages()
second = agent.run_sync("follow up", message_history=history)
assert len(second.all_messages()) > len(history)
assert len(second.new_messages()) < len(second.all_messages())`,
`# Keep complete user/assistant/tool exchanges together; never truncate a tool pair.
def bounded_history(exchanges, max_chars=2000):
    kept = []; used = 0
    for exchange in reversed(exchanges):
        size = len(str(exchange))
        if used + size > max_chars: break
        kept.insert(0, exchange); used += size
    return [message for exchange in kept for message in exchange]
assert bounded_history([[{"role": "user", "text": "hello"}]], 100) != []
# Load/store per authenticated conversation and adapt to Pydantic AI message types.`,
`from pydantic import BaseModel
class Action(BaseModel):
    customer_id: str
    note: str
partial = {"customer_id": "c1"}
assert "note" not in partial  # Display only; never execute.
final = Action.model_validate({**partial, "note": "reviewed"})
# After final validation, authorize and obtain exact-payload approval separately.
assert final.note == "reviewed"`],
'usage-limits': [
`def run(fake_model, limit):
    for _ in range(limit):
        result = fake_model()
        if result == "done": return result
    raise RuntimeError("request budget exhausted")
try: run(lambda: "continue", 3)
except RuntimeError: print("stopped at three requests")`,
`budget = {"remaining": 1}
def request():
    if budget["remaining"] <= 0: raise RuntimeError("limit reached")
    budget["remaining"] -= 1
request()
try: request()
except RuntimeError: assert budget["remaining"] == 0`,
`from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
from pydantic_ai.usage import UsageLimits
agent = Agent(TestModel())
agent.run_sync("Answer", usage_limits=UsageLimits(request_limit=5, tool_calls_limit=3))
# This is one run's budget; persist shared accounting for a multi-run session.`,
`class Budget:
    def __init__(self, remaining): self.remaining = remaining
    def consume(self):
        if self.remaining == 0: raise RuntimeError("budget exhausted")
        self.remaining -= 1
def helper(budget): budget.consume()
budget = Budget(2); helper(budget); helper(budget)
try: helper(budget)
except RuntimeError: assert budget.remaining == 0
# Pass the same budget to nested helpers; do not create a new one.`],
'agent-tests': [
`def lookup(repository, key):
    value = repository.get(key)
    return {"ok": True, "customer": value} if value else {"ok": False, "code": "not_found"}
def test_lookup(): assert lookup({"c1": {"name": "Ada"}}, "c1") == {"ok": True, "customer": {"name": "Ada"}}`,
`class Unavailable:
    def get(self, key): raise TimeoutError("offline fixture")
def lookup(repository, key):
    try: return {"ok": True, "value": repository.get(key)}
    except TimeoutError: return {"ok": False, "code": "unavailable"}
assert lookup(Unavailable(), "c1") == {"ok": False, "code": "unavailable"}`, 
`def lookup(tenant, key, repository):
    row = repository.get(key)
    if row is None or row["tenant"] != tenant: return {"code": "not_found"}
    return {"code": "ok", "id": key}
assert lookup("a", "missing", {}) == {"code": "not_found"}
assert lookup("a", "c1", {"c1": {"tenant": "b"}}) == {"code": "not_found"}`, 
`result = {"category": "billing", "evidence_ids": ["d1"], "text": "Please review the invoice."}
assert result["category"] == "billing"
assert result["evidence_ids"] == ["d1"]
# Assert tool names, validated arguments, permissions and supported claims.
# Exact prose matching is only appropriate when exact wording is the contract.`]
};
