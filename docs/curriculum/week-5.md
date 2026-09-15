# Week 5

[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)

<a id="base-model"></a>

## Pydantic BaseModel and validation

A BaseModel declares a runtime-validated data boundary with structured errors.

**Why it matters:** External data needs stronger guarantees than annotations alone.

**Prerequisites:** [Function annotations](week-1.md#annotations), [Constructing classes and instances](week-2.md#classes), [JSON parsing and boundaries](week-1.md#json)

**Difficulty:** Advanced · **Code concepts:** BaseModel, model_validate

[Official documentation](https://docs.pydantic.dev/latest/concepts/models/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Validate a support-note payload and inspect an invalid case.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ValidationError
class Note(BaseModel):
    customer_id: int = Field(gt=0)
    note: str = Field(min_length=1)
print(Note.model_validate({'customer_id': 1, 'note': 'hello'}).customer_id)  # Expected: 1
try: Note(customer_id=0, note="")
except ValidationError as error: print(len(error.errors()))  # Expected: 2
```

</details>

### Simple exercise 2

Inspect the structured validation errors for a payload with two invalid fields.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ValidationError
class Note(BaseModel):
    customer_id: int = Field(gt=0)
    note: str = Field(min_length=1)
try: Note(customer_id=-1, note="")
except ValidationError as error:
    print({tuple(e['loc']) for e in error.errors()})  # Expected: {("customer_id",), ("note",)}
```

</details>

### Practical exercise

Define the analyzer API's input model.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ConfigDict
class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: str = Field(min_length=1)
    limit: int = Field(default=100, gt=0, le=10000)
print(AnalyzeRequest(source='events.log').limit)  # Expected: 100
```

</details>

### Debugging exercise

model_construct bypasses validation on untrusted input. Replace it at the boundary.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ValidationError
class Request(BaseModel): count: int = Field(gt=0)
print(Request.model_construct(count=-1).count)  # Expected: -1  # Bypasses validation.
try: Request.model_validate({"count": -1})
except ValidationError: print("untrusted input rejected")
```

</details>

**Interview question:** How does BaseModel differ from a plain annotated class?

**Explain in your own words:** Explain pydantic basemodel and validation in your own words. Use a concrete example to show why this is true: A BaseModel declares a runtime-validated data boundary with structured errors.

<a id="pydantic-fields"></a>

## Pydantic fields and constraints

Fields describe constraints and defaults that become part of the input contract.

**Why it matters:** Constraints catch invalid values close to their source.

**Prerequisites:** [Pydantic BaseModel and validation](week-5.md#base-model)

**Difficulty:** Advanced · **Code concepts:** Field, gt, min_length, default_factory

[Official documentation](https://docs.pydantic.dev/latest/concepts/fields/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Constrain customer_id and note length.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class Note(BaseModel):
    customer_id: int = Field(gt=0)
    note: str = Field(min_length=1, max_length=500)
print(Note(customer_id=1, note='hello').note)  # Expected: "hello"
```

</details>

### Simple exercise 2

Use default_factory for a list and prove that two model instances do not share it.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class Record(BaseModel): tags: list[str] = Field(default_factory=list)
a, b = Record(), Record(); a.tags.append("a")
print(b.tags == [] and a.tags is not b.tags)  # Expected: True
```

</details>

### Practical exercise

Reject empty support notes before tool execution.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ConfigDict, ValidationError
class Note(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=500)
try: Note(text="   ")
except ValidationError: print("blank note rejected before tool execution")
```

</details>

### Debugging exercise

A field allows zero despite a positive-ID requirement. Add and test the precise constraint.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ValidationError
class Customer(BaseModel): id: int = Field(gt=0)
for invalid in (0, -1):
    try: Customer(id=invalid)
    except ValidationError: pass
    else: raise AssertionError("positive constraint missing")
print(Customer(id=1).id)  # Expected: 1
```

</details>

**Interview question:** Where should a field constraint stop and a business rule begin?

**Explain in your own words:** Explain pydantic fields and constraints in your own words. Use a concrete example to show why this is true: Fields describe constraints and defaults that become part of the input contract.

<a id="field-validators"></a>

## Pydantic field validators

Field validators add targeted normalization or validation at a chosen stage.

**Why it matters:** Domain-specific input rules should be explicit and testable.

**Prerequisites:** [Pydantic fields and constraints](week-5.md#pydantic-fields)

**Difficulty:** Advanced · **Code concepts:** field_validator, before, after

[Official documentation](https://docs.pydantic.dev/latest/concepts/validators/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Normalize and validate a severity string.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, field_validator
class Event(BaseModel):
    severity: str
    @field_validator("severity")
    @classmethod
    def normalize(cls, value):
        value = value.strip().upper()
        if value not in {"INFO", "ERROR"}: raise ValueError("unsupported severity")
        return value
print(Event(severity=' info ').severity)  # Expected: "INFO"
```

</details>

### Simple exercise 2

Compare raw and parsed input observed by before and after validators.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, field_validator
seen = []
class Count(BaseModel):
    value: int
    @field_validator("value", mode="before")
    @classmethod
    def before(cls, value): seen.append(type(value)); return value
    @field_validator("value")
    @classmethod
    def after(cls, value): seen.append(type(value)); return value
Count(value="2"); print(seen)  # Expected: [str, int]
```

</details>

### Practical exercise

Accept normalized customer references while rejecting unsupported forms.

<details>
<summary>Reveal reference solution</summary>

```python
import re
from pydantic import BaseModel, field_validator
class CustomerRef(BaseModel):
    id: str
    @field_validator("id")
    @classmethod
    def normalize(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"c[1-9][0-9]*", value): raise ValueError("expected c followed by positive digits")
        return value
print(CustomerRef(id=' C12 ').id)  # Expected: "c12"
```

</details>

### Debugging exercise

A before validator assumes an already parsed integer but receives raw text. Use the correct stage or handle raw types.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, field_validator
class Count(BaseModel):
    value: int
    @field_validator("value", mode="after")
    @classmethod
    def positive(cls, value):
        if value <= 0: raise ValueError("positive count required")
        return value
print(Count(value='2').value)  # Expected: 2
# Before validators receive raw text; arithmetic belongs after integer parsing.
```

</details>

**Interview question:** How do before and after validators differ?

**Explain in your own words:** Explain pydantic field validators in your own words. Use a concrete example to show why this is true: Field validators add targeted normalization or validation at a chosen stage.

<a id="model-validators"></a>

## Cross-field model validators

Model validators enforce relationships that cannot be expressed on one field alone.

**Why it matters:** Individually valid values can still form an invalid object.

**Prerequisites:** [Pydantic field validators](week-5.md#field-validators)

**Difficulty:** Advanced · **Code concepts:** model_validator, cross-field invariant

[Official documentation](https://docs.pydantic.dev/latest/concepts/validators/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Require an end timestamp after a start timestamp.

<details>
<summary>Reveal reference solution</summary>

```python
from datetime import datetime
from pydantic import BaseModel, model_validator
class Window(BaseModel):
    start: datetime
    end: datetime
    @model_validator(mode="after")
    def ordered(self):
        if self.end <= self.start: raise ValueError("end must follow start")
        return self
print(Window(start='2025-01-01', end='2025-01-02').end > Window(start='2025-01-01', end='2025-01-02').start)  # Expected: True
```

</details>

### Simple exercise 2

Test equal, increasing, and decreasing timestamp pairs against the same invariant.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, model_validator, ValidationError
class Window(BaseModel):
    start: int
    end: int
    @model_validator(mode="after")
    def ordered(self):
        if self.end <= self.start: raise ValueError("end must follow start")
        return self
for start, end in ((1, 1), (1, 2), (2, 1)):
    try: Window(start=start, end=end)
    except ValidationError: print(end <= start)  # Expected: True
    else: print(end > start)  # Expected: True
```

</details>

### Practical exercise

Validate a report date range before querying.

<details>
<summary>Reveal reference solution</summary>

```python
from datetime import date
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
    return repository.between(window.start, window.end)
```

</details>

### Debugging exercise

Both timestamps validate individually but a reversed range is accepted. Add a model-level invariant.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, model_validator, ValidationError
class Range(BaseModel):
    start: int
    end: int
    @model_validator(mode="after")
    def check_range(self):
        if self.end <= self.start: raise ValueError("reversed or empty range")
        return self
try: Range(start=10, end=2)
except ValidationError: print("cross-field invariant enforced")
```

</details>

**Interview question:** When is a model validator preferable to a field validator?

**Explain in your own words:** Explain cross-field model validators in your own words. Use a concrete example to show why this is true: Model validators enforce relationships that cannot be expressed on one field alone.

<a id="nested-models"></a>

## Nested Pydantic domain models

Nested models validate structured subdocuments and locate errors within their paths.

**Why it matters:** Precise nested errors make APIs easier to debug.

**Prerequisites:** [Pydantic BaseModel and validation](week-5.md#base-model), [Generics and TypeVar relationships](week-3.md#generics)

**Difficulty:** Advanced · **Code concepts:** nested BaseModel, list[Model], errors

[Official documentation](https://docs.pydantic.dev/latest/concepts/models/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Validate a customer with a list of orders.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class Order(BaseModel): id: int = Field(gt=0)
class Customer(BaseModel): orders: list[Order]
print(Customer(orders=[{'id': 1}]).orders[0].id)  # Expected: 1
```

</details>

### Simple exercise 2

Introduce an error in the second nested order and inspect its indexed error path.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ValidationError
class Order(BaseModel): id: int = Field(gt=0)
class Customer(BaseModel): orders: list[Order]
try: Customer(orders=[{"id": 1}, {"id": 0}])
except ValidationError as error: print(error.errors()[0]['loc'])  # Expected: ("orders", 1, "id")
```

</details>

### Practical exercise

Model a support ticket with requester and source-document metadata.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class Requester(BaseModel): customer_id: str = Field(min_length=1)
class Source(BaseModel):
    document_id: str
    version: int = Field(gt=0)
class Ticket(BaseModel):
    requester: Requester
    sources: list[Source]
print(Ticket(requester={'customer_id': 'c1'}, sources=[{'document_id': 'd1', 'version': 1}]).sources[0].version)  # Expected: 1
```

</details>

### Debugging exercise

A nested field is typed as dict and its domain constraints are never checked. Introduce a nested model.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field, ValidationError
class Order(BaseModel): amount: int = Field(ge=0)
class Payload(BaseModel): order: Order  # Not an unconstrained dict.
try: Payload(order={"amount": -1})
except ValidationError as error: print(error.errors()[0]['loc'])  # Expected: ("order", "amount")
```

</details>

**Interview question:** How are nested validation failures located?

**Explain in your own words:** Explain nested pydantic domain models in your own words. Use a concrete example to show why this is true: Nested models validate structured subdocuments and locate errors within their paths.

<a id="discriminators"></a>

## Discriminated unions

A discriminator selects a specific model variant using a declared tag.

**Why it matters:** Explicit variants avoid ambiguous validation and branching.

**Prerequisites:** [Nested Pydantic domain models](week-5.md#nested-models), [Optional, Union, and Literal types](week-3.md#unions)

**Difficulty:** Advanced · **Code concepts:** Annotated, Union, Literal, discriminator

[Official documentation](https://docs.pydantic.dev/latest/concepts/unions/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Define success and error result variants with distinct kind values.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter
class Success(BaseModel):
    kind: Literal["success"]
    value: str
class Error(BaseModel):
    kind: Literal["error"]
    code: str
result = TypeAdapter(Annotated[Success | Error, Field(discriminator="kind")])
print(isinstance(result.validate_python({'kind': 'success', 'value': 'ok'}), Success))  # Expected: True
```

</details>

### Simple exercise 2

Validate one instance of every tagged variant, then try an unknown tag.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter, ValidationError
class Read(BaseModel): kind: Literal["read"]
class Write(BaseModel): kind: Literal["write"]
adapter = TypeAdapter(Annotated[Read | Write, Field(discriminator="kind")])
for kind in ("read", "write"): print(adapter.validate_python({'kind': kind}).kind)  # Expected: kind
try: adapter.validate_python({"kind": "unknown"})
except ValidationError: print("unknown tag rejected")
```

</details>

### Practical exercise

Model read-tool and write-tool requests as tagged variants.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter
class Lookup(BaseModel):
    kind: Literal["lookup"]
    customer_id: str
class CreateNote(BaseModel):
    kind: Literal["create_note"]
    customer_id: str
    note: str = Field(min_length=1)
request = TypeAdapter(Annotated[Lookup | CreateNote, Field(discriminator="kind")])
print(request.validate_python({'kind': 'lookup', 'customer_id': 'c1'}).kind)  # Expected: "lookup"
```

</details>

### Debugging exercise

A producer omits or misspells the discriminator and parsing fails. Repair the shared contract.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter
class Ok(BaseModel): kind: Literal["ok"]
class Error(BaseModel): kind: Literal["error"]
adapter = TypeAdapter(Annotated[Ok | Error, Field(discriminator="kind")])
payload = {"kind": "ok"}  # Producer and consumer share exact tag spelling.
print(adapter.validate_python(payload).kind)  # Expected: "ok"
# Add a producer/consumer contract test; do not guess missing variant tags.
```

</details>

**Interview question:** Why is a tagged union clearer than several optional fields?

**Explain in your own words:** Explain discriminated unions in your own words. Use a concrete example to show why this is true: A discriminator selects a specific model variant using a declared tag.

<a id="serialization"></a>

## Pydantic serialization and aliases

Serialization converts validated objects into output forms with deliberate field and alias choices.

**Why it matters:** Input names, internal names, and public output names may differ.

**Prerequisites:** [Nested Pydantic domain models](week-5.md#nested-models)

**Difficulty:** Advanced · **Code concepts:** model_dump, model_dump_json, alias

[Official documentation](https://docs.pydantic.dev/latest/concepts/serialization/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Serialize a model with an external field alias.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class Customer(BaseModel): customer_id: str = Field(alias="customerId")
print(Customer(customerId='c1').model_dump(by_alias=True))  # Expected: {"customerId": "c1"}
```

</details>

### Simple exercise 2

Compare Python-mode and JSON-mode dumps of a model containing a datetime.

<details>
<summary>Reveal reference solution</summary>

```python
from datetime import datetime, timezone
from pydantic import BaseModel
class Event(BaseModel): at: datetime
event = Event(at=datetime(2025, 1, 1, tzinfo=timezone.utc))
print(isinstance(event.model_dump()['at'], datetime))  # Expected: True
print(isinstance(event.model_dump(mode='json')['at'], str))  # Expected: True
```

</details>

### Practical exercise

Publish API results without exposing internal-only fields.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class Result(BaseModel):
    report_id: str
    internal_token: str = Field(exclude=True)
print(Result(report_id='r1', internal_token='example-only').model_dump())  # Expected: {"report_id": "r1"}
```

</details>

### Debugging exercise

An internal field name leaks because by_alias was not selected. Assert the external payload shape.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class Result(BaseModel): report_id: str = Field(alias="reportId")
result = Result(reportId="r1")
print(result.model_dump(by_alias=True))  # Expected: {"reportId": "r1"}
print('report_id' not in result.model_dump(by_alias=True))  # Expected: True
```

</details>

**Interview question:** Does model_dump always produce JSON-serializable values in its default mode?

**Explain in your own words:** Explain pydantic serialization and aliases in your own words. Use a concrete example to show why this is true: Serialization converts validated objects into output forms with deliberate field and alias choices.

<a id="json-schema"></a>

## Generating JSON Schema contracts

JSON Schema describes structural constraints for validation and interface discovery.

**Why it matters:** Model/tool interoperability depends on a shared machine-readable contract.

**Prerequisites:** [Pydantic fields and constraints](week-5.md#pydantic-fields), [Discriminated unions](week-5.md#discriminators)

**Difficulty:** Advanced · **Code concepts:** model_json_schema, properties, required

[Official documentation](https://docs.pydantic.dev/latest/concepts/json_schema/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Inspect required and optional fields in a generated schema.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel
class Input(BaseModel):
    query: str
    limit: int = 10
schema = Input.model_json_schema()
print(schema['required'], schema['properties']['limit']['default'])  # Expected values: ['query']; 10
```

</details>

### Simple exercise 2

Compare generated required fields for a required value and one with a default.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel
class Input(BaseModel):
    required_nullable: str | None
    optional_with_default: str | None = None
print(Input.model_json_schema()['required'])  # Expected: ["required_nullable"]
```

</details>

### Practical exercise

Generate a tool input contract from a validated model.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, Field
class SearchCustomer(BaseModel): query: str = Field(min_length=1, description="Customer name or stable ID")
tool = {"name": "search_customer", "description": "Read-only customer lookup", "inputSchema": SearchCustomer.model_json_schema()}
print(tool['inputSchema']['required'])  # Expected: ["query"]
```

</details>

### Debugging exercise

A schema is assumed to express a database authorization rule. Keep runtime policy checks explicit.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel
class Lookup(BaseModel): customer_id: str
def execute(payload, auth, repository):
    args = Lookup.model_validate(payload)
    customer = repository.get(args.customer_id)
    if customer["tenant"] != auth["tenant"]: raise PermissionError("denied")
    return customer
# JSON Schema describes input shape, not the caller's current database permissions.
```

</details>

**Interview question:** What can a JSON Schema not prove about an operation?

**Explain in your own words:** Explain generating json schema contracts in your own words. Use a concrete example to show why this is true: JSON Schema describes structural constraints for validation and interface discovery.

<a id="agent-loop"></a>

## Manual agent model-tool loop

An agent loop exchanges messages with a model, executes authorized tool requests, and stops under an explicit policy.

**Why it matters:** Implementing the loop reveals what orchestration libraries automate.

**Prerequisites:** [Generating JSON Schema contracts](week-5.md#json-schema), [Higher order functions](week-1.md#higher-order)

**Difficulty:** Advanced · **Code concepts:** message history, tool call, loop, stop condition

[Official documentation](https://ai.pydantic.dev/agents/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Simulate a model asking for one tool and then returning a result.

<details>
<summary>Reveal reference solution</summary>

```python
responses = iter([{"tool": "lookup", "id": "c1"}, {"answer": "Ada"}])
history = []
for _ in range(3):
    response = next(responses); history.append(response)
    if "answer" in response: break
    history.append({"tool_result": {"name": "Ada"}})
print(history[-1] == {'answer': 'Ada'} and 'tool_result' in history[1])  # Expected: True
```

</details>

### Simple exercise 2

Simulate a model response with no tool request and verify that the loop terminates.

<details>
<summary>Reveal reference solution</summary>

```python
def run(model):
    response = model([])
    if "answer" in response: return response["answer"]
    raise ValueError("unexpected tool request")
print(run(lambda history: {'answer': 'hello'}))  # Expected: "hello"
```

</details>

### Practical exercise

Build a manual customer lookup assistant with a fake model.

<details>
<summary>Reveal reference solution</summary>

```python
def assistant(model, repository, history, max_steps=3):
    for _ in range(max_steps):
        response = model(history); history.append(response)
        if "answer" in response: return response["answer"]
        if response.get("tool") != "lookup": raise ValueError("unknown tool")
        history.append({"tool_result": repository.get(response["id"])})
    raise RuntimeError("step budget exhausted")
responses = iter([{"tool": "lookup", "id": "c1"}, {"answer": "Ada"}])
print(assistant(lambda h: next(responses), {'c1': {'name': 'Ada'}}, []))  # Expected: "Ada"
```

</details>

### Debugging exercise

The tool result is never added to history, so the model repeats its request. Repair the message sequence.

<details>
<summary>Reveal reference solution</summary>

```python
history = [{"role": "user", "content": "Find c1"}]
call = {"role": "assistant", "tool_call_id": "call-1", "name": "lookup", "arguments": {"id": "c1"}}
history.append(call)
history.append({"role": "tool", "tool_call_id": "call-1", "content": {"name": "Ada"}})
print(history[-1]['tool_call_id'])  # Expected: call["tool_call_id"]
# Pass this updated history into the next model request; adapt to provider message types.
```

</details>

**Interview question:** What distinguishes an agent loop from a single model request?

**Explain in your own words:** Explain manual agent model-tool loop in your own words. Use a concrete example to show why this is true: An agent loop exchanges messages with a model, executes authorized tool requests, and stops under an explicit policy.

<a id="pydantic-agent"></a>

## Pydantic AI Agent and model abstraction

An Agent coordinates typed dependencies, tools, and output around a model backend.

**Why it matters:** Separating orchestration from the model makes behavior easier to compare and test.

**Prerequisites:** [Manual agent model-tool loop](week-5.md#agent-loop), [Pydantic BaseModel and validation](week-5.md#base-model)

**Difficulty:** Advanced · **Code concepts:** Agent, model, run

[Official documentation](https://ai.pydantic.dev/agents/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Run a minimal agent against a test model.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(custom_output_text="hello"))
print(agent.run_sync('Say hello').output)  # Expected: "hello"
```

</details>

### Simple exercise 2

Replace the test model without changing the assistant's dependency or output contract.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(custom_output_text="first"), deps_type=dict, output_type=str)
print(agent.run_sync('hello', deps={}).output)  # Expected: "first"
with agent.override(model=TestModel(custom_output_text="second")):
    print(agent.run_sync('hello', deps={}).output)  # Expected: "second"
```

</details>

### Practical exercise

Rebuild the manual customer assistant using Pydantic AI.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def lookup(ctx: RunContext[dict], customer_id: str) -> dict:
    return ctx.deps.get(customer_id, {"error": "not_found"})
result = agent.run_sync("Look up a customer", deps={"c1": {"name": "Ada"}})
print(result.output is not None)  # Expected: True
# TestModel exercises tooling; it does not assess real model reasoning.
```

</details>

### Debugging exercise

Provider-specific assumptions leak into domain code. Move them behind the model boundary.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
class Answer(BaseModel): customer_id: str
agent = Agent(TestModel(custom_output_args={"customer_id": "c1"}), output_type=Answer)
answer = agent.run_sync("Find the customer").output
print(answer.customer_id)  # Expected: "c1"
# Domain code consumes Answer, not provider-specific response JSON.
```

</details>

**Interview question:** What responsibilities remain yours when using an agent framework?

**Explain in your own words:** Explain pydantic ai agent and model abstraction in your own words. Use a concrete example to show why this is true: An Agent coordinates typed dependencies, tools, and output around a model backend.

<a id="run-context"></a>

## RunContext and injected dependencies

RunContext exposes run-specific dependencies to tools without global state.

**Why it matters:** Per-run identity and service access must not leak across requests.

**Prerequisites:** [Pydantic AI Agent and model abstraction](week-5.md#pydantic-agent), [FastAPI dependency injection](week-4.md#fastapi-deps)

**Difficulty:** Advanced · **Code concepts:** RunContext, deps_type, deps

[Official documentation](https://ai.pydantic.dev/dependencies/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Inject a fake customer repository into one agent run.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def count_customers(ctx: RunContext[dict]) -> int: return len(ctx.deps)
result = agent.run_sync("Count customers", deps={"c1": "Ada"})
print(result.output is not None)  # Expected: True
```

</details>

### Simple exercise 2

Run the same agent with two fake repositories and verify that their data stays separate.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass
@dataclass
class Dependencies: customers: dict
def lookup(deps, customer_id): return deps.customers.get(customer_id)
a, b = Dependencies({"c1": "Ada"}), Dependencies({"c1": "Grace"})
print(lookup(a, 'c1'), lookup(b, 'c1'))  # Expected values: 'Ada'; 'Grace'
# Pass each Dependencies instance as deps= for its corresponding agent run.
```

</details>

### Practical exercise

Pass the caller identity and repository to support tools.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass
@dataclass(frozen=True)
class Dependencies:
    caller_id: str
    tenant_id: str
    repository: object
def lookup(deps, customer_id):
    return deps.repository.get_for_tenant(deps.tenant_id, customer_id)
# Construct from authenticated server context; pass via Agent.run(..., deps=deps).
```

</details>

### Debugging exercise

A global current_customer variable crosses concurrent runs. Replace it with run-scoped dependencies.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass
@dataclass(frozen=True)
class RunDependencies: customer_id: str
async def handle(deps): return deps.customer_id
# No mutable global current_customer. Each concurrent run receives its own deps.
import asyncio
async def main():
    print(await asyncio.gather(handle(RunDependencies('a')), handle(RunDependencies('b'))))  # Expected: ["a", "b"]
if __name__ == "__main__": asyncio.run(main())
```

</details>

**Interview question:** Why inject dependencies rather than read global services?

**Explain in your own words:** Explain runcontext and injected dependencies in your own words. Use a concrete example to show why this is true: RunContext exposes run-specific dependencies to tools without global state.

<a id="agent-tools"></a>

## Pydantic AI tool execution

Tools give an agent callable operations with explicit inputs and observable outcomes.

**Why it matters:** Tool calls are the boundary where model decisions become actions.

**Prerequisites:** [RunContext and injected dependencies](week-5.md#run-context), [Generating JSON Schema contracts](week-5.md#json-schema)

**Difficulty:** Advanced · **Code concepts:** tool, tool_plain, RunContext

[Official documentation](https://ai.pydantic.dev/tools/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Register a read-only customer lookup tool.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def lookup_customer(ctx: RunContext[dict], customer_id: str) -> dict:
    """Read customer details without changing records."""
    return ctx.deps.get(customer_id, {"error": "not_found"})
```

</details>

### Simple exercise 2

Invoke a tool with an invalid ID and inspect how the failure reaches the caller.

<details>
<summary>Reveal reference solution</summary>

```python
def lookup(customer_id, repository):
    if not isinstance(customer_id, str) or not customer_id.startswith("c"):
        return {"ok": False, "code": "invalid_id"}
    value = repository.get(customer_id)
    return {"ok": True, "customer": value} if value else {"ok": False, "code": "not_found"}
print(lookup('', {}))  # Expected: {"ok": False, "code": "invalid_id"}
```

</details>

### Practical exercise

Let the assistant retrieve an order through an injected repository.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(), deps_type=dict)
@agent.tool
def get_order(ctx: RunContext[dict], order_id: str) -> dict:
    """Read one order available to the authenticated tenant."""
    order = ctx.deps["orders"].get(order_id)
    if order is None or order["tenant"] != ctx.deps["tenant"]: return {"error": "not_found"}
    return {"id": order_id, "total": order["total"]}
```

</details>

### Debugging exercise

A tool trusts a model-provided user identity. Derive identity from authenticated run context.

<details>
<summary>Reveal reference solution</summary>

```python
def lookup(authenticated_context, customer_id, repository):
    tenant = authenticated_context["tenant"]  # Not a model argument.
    customer = repository.get(customer_id)
    if customer is None or customer["tenant"] != tenant: raise PermissionError("denied")
    return customer
print(lookup({'tenant': 'a'}, 'c1', {'c1': {'tenant': 'a'}})['tenant'])  # Expected: "a"
```

</details>

**Interview question:** Why should tool authorization live outside model instructions?

**Explain in your own words:** Explain pydantic ai tool execution in your own words. Use a concrete example to show why this is true: Tools give an agent callable operations with explicit inputs and observable outcomes.

<a id="structured-output"></a>

## Structured agent output and retries

Typed output makes result shape checkable; retries can ask for a corrected result within a budget.

**Why it matters:** Syntactic validity alone does not establish useful or truthful output.

**Prerequisites:** [Pydantic AI Agent and model abstraction](week-5.md#pydantic-agent), [Discriminated unions](week-5.md#discriminators)

**Difficulty:** Advanced · **Code concepts:** output_type, validation, retry budget

[Official documentation](https://ai.pydantic.dev/output/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Validate a structured triage result from a fake model.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Literal
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
class Triage(BaseModel): category: Literal["billing", "technical"]
agent = Agent(TestModel(custom_output_args={"category": "billing"}), output_type=Triage)
print(agent.run_sync('Classify').output.category)  # Expected: "billing"
```

</details>

### Simple exercise 2

Supply an invalid result variant through a fake model and observe bounded correction behavior.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel, ValidationError
from typing import Literal
class Triage(BaseModel): category: Literal["billing", "technical"]
responses = iter([{"category": "invalid"}, {"category": "billing"}])
for attempt in range(2):
    try: result = Triage.model_validate(next(responses)); break
    except ValidationError:
        if attempt == 1: raise
print(result.category)  # Expected: "billing"
```

</details>

### Practical exercise

Return a ticket category and evidence identifiers from the assistant.

<details>
<summary>Reveal reference solution</summary>

```python
from typing import Literal
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
class Triage(BaseModel):
    category: Literal["billing", "technical"]
    evidence_ids: list[str] = Field(min_length=1)
agent = Agent(TestModel(custom_output_args={"category": "billing", "evidence_ids": ["d1"]}), output_type=Triage)
print(agent.run_sync('Classify with evidence').output.evidence_ids)  # Expected: ["d1"]
# Also verify each evidence ID exists and supports the classification.
```

</details>

### Debugging exercise

Repeated invalid outputs trigger unlimited retries. Bound attempts and surface failure.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
from pydantic_ai.usage import UsageLimits
agent = Agent(TestModel(), retries=1)
result = agent.run_sync("Answer", usage_limits=UsageLimits(request_limit=3))
print(result.output is not None)  # Expected: True
# retries bounds validation correction; request_limit bounds total model requests.
# Surface UnexpectedModelBehavior/UsageLimitExceeded to the caller as failure.
```

</details>

**Interview question:** Does structured output guarantee factual correctness?

**Explain in your own words:** Explain structured agent output and retries in your own words. Use a concrete example to show why this is true: Typed output makes result shape checkable; retries can ask for a corrected result within a budget.

<a id="streaming-history"></a>

## Agent streaming and message history

Streaming exposes incremental results while history carries prior conversation state.

**Why it matters:** Consumers must distinguish partial content from a validated final result.

**Prerequisites:** [Structured agent output and retries](week-5.md#structured-output), [Async iterators](week-4.md#async-iterators)

**Difficulty:** Advanced · **Code concepts:** stream, message history, final result

[Official documentation](https://ai.pydantic.dev/agents/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Display partial text and a separate final completion state.

<details>
<summary>Reveal reference solution</summary>

```python
events = [{"kind": "delta", "text": "Hel"}, {"kind": "delta", "text": "lo"}, {"kind": "done"}]
text = ""; complete = False
for event in events:
    if event["kind"] == "delta": text += event["text"]
    else: complete = True
    print(text, "complete" if complete else "partial")
print(text == 'Hello' and complete)  # Expected: True
```

</details>

### Simple exercise 2

Compare the stored history after a new run with the history used for a follow-up.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
agent = Agent(TestModel(custom_output_text="ok"))
first = agent.run_sync("hello"); history = first.all_messages()
second = agent.run_sync("follow up", message_history=history)
print(len(second.all_messages()) > len(history))  # Expected: True
print(len(second.new_messages()) < len(second.all_messages()))  # Expected: True
```

</details>

### Practical exercise

Resume a customer conversation using bounded stored history.

<details>
<summary>Reveal reference solution</summary>

```python
# Keep complete user/assistant/tool exchanges together; never truncate a tool pair.
def bounded_history(exchanges, max_chars=2000):
    kept = []; used = 0
    for exchange in reversed(exchanges):
        size = len(str(exchange))
        if used + size > max_chars: break
        kept.insert(0, exchange); used += size
    return [message for exchange in kept for message in exchange]
print(bounded_history([[{'role': 'user', 'text': 'hello'}]], 100) != [])  # Expected: True
# Load/store per authenticated conversation and adapt to Pydantic AI message types.
```

</details>

### Debugging exercise

A partial streamed field is treated as a final approved action. Delay decisions until validation completes.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic import BaseModel
class Action(BaseModel):
    customer_id: str
    note: str
partial = {"customer_id": "c1"}
print('note' not in partial)  # Expected: True  # Display only; never execute.
final = Action.model_validate({**partial, "note": "reviewed"})
# After final validation, authorize and obtain exact-payload approval separately.
print(final.note)  # Expected: "reviewed"
```

</details>

**Interview question:** What should be persisted when resuming an agent conversation?

**Explain in your own words:** Explain agent streaming and message history in your own words. Use a concrete example to show why this is true: Streaming exposes incremental results while history carries prior conversation state.

<a id="usage-limits"></a>

## Agent usage and termination limits

Request and token budgets bound a run's resource use and prevent uncontrolled loops.

**Why it matters:** Autonomous execution needs a predictable cost and time envelope.

**Prerequisites:** [Manual agent model-tool loop](week-5.md#agent-loop), [Timeouts and deadlines](week-4.md#timeouts)

**Difficulty:** Advanced · **Code concepts:** UsageLimits, request budget, token budget

[Official documentation](https://ai.pydantic.dev/agents/#usage-limits) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Stop a fake agent after a fixed request count.

<details>
<summary>Reveal reference solution</summary>

```python
def run(fake_model, limit):
    for _ in range(limit):
        result = fake_model()
        if result == "done": return result
    raise RuntimeError("request budget exhausted")
try: run(lambda: "continue", 3)
except RuntimeError: print("stopped at three requests")
```

</details>

### Simple exercise 2

Simulate a run that requests another step at its budget boundary and verify termination.

<details>
<summary>Reveal reference solution</summary>

```python
budget = {"remaining": 1}
def request():
    if budget["remaining"] <= 0: raise RuntimeError("limit reached")
    budget["remaining"] -= 1
request()
try: request()
except RuntimeError: print(budget['remaining'])  # Expected: 0
```

</details>

### Practical exercise

Set per-session tool and model call budgets.

<details>
<summary>Reveal reference solution</summary>

```python
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel
from pydantic_ai.usage import UsageLimits
agent = Agent(TestModel())
agent.run_sync("Answer", usage_limits=UsageLimits(request_limit=5, tool_calls_limit=3))
# This is one run's budget; persist shared accounting for a multi-run session.
```

</details>

### Debugging exercise

A budget resets on every nested helper and the total run exceeds its limit. Track a shared run budget.

<details>
<summary>Reveal reference solution</summary>

```python
class Budget:
    def __init__(self, remaining): self.remaining = remaining
    def consume(self):
        if self.remaining == 0: raise RuntimeError("budget exhausted")
        self.remaining -= 1
def helper(budget): budget.consume()
budget = Budget(2); helper(budget); helper(budget)
try: helper(budget)
except RuntimeError: print(budget.remaining)  # Expected: 0
# Pass the same budget to nested helpers; do not create a new one.
```

</details>

**Interview question:** Which limits belong to a step and which to the entire run?

**Explain in your own words:** Explain agent usage and termination limits in your own words. Use a concrete example to show why this is true: Request and token budgets bound a run's resource use and prevent uncontrolled loops.

<a id="agent-tests"></a>

## Deterministic agent tests

Test models and fake dependencies verify orchestration without relying on live model behavior.

**Why it matters:** Repeatable tests isolate application logic from stochastic providers.

**Prerequisites:** [Pydantic AI tool execution](week-5.md#agent-tools), [Structured agent output and retries](week-5.md#structured-output), [Fakes and dependency boundaries](week-3.md#fakes)

**Difficulty:** Advanced · **Code concepts:** TestModel, FunctionModel, fake tools

[Official documentation](https://ai.pydantic.dev/testing/) · [Additional reading](https://ai.pydantic.dev/agents/)

### Simple exercise 1

Test that one tool call produces the intended structured result.

<details>
<summary>Reveal reference solution</summary>

```python
def lookup(repository, key):
    value = repository.get(key)
    return {"ok": True, "customer": value} if value else {"ok": False, "code": "not_found"}
def test_lookup(): assert lookup({"c1": {"name": "Ada"}}, "c1") == {"ok": True, "customer": {"name": "Ada"}}
```

</details>

### Simple exercise 2

Make a fake tool fail deterministically and assert the application's chosen error behavior.

<details>
<summary>Reveal reference solution</summary>

```python
class Unavailable:
    def get(self, key): raise TimeoutError("offline fixture")
def lookup(repository, key):
    try: return {"ok": True, "value": repository.get(key)}
    except TimeoutError: return {"ok": False, "code": "unavailable"}
assert lookup(Unavailable(), "c1") == {"ok": False, "code": "unavailable"}
```

</details>

### Practical exercise

Test the assistant's no-customer and unauthorized paths offline.

<details>
<summary>Reveal reference solution</summary>

```python
def lookup(tenant, key, repository):
    row = repository.get(key)
    if row is None or row["tenant"] != tenant: return {"code": "not_found"}
    return {"code": "ok", "id": key}
assert lookup("a", "missing", {}) == {"code": "not_found"}
assert lookup("a", "c1", {"c1": {"tenant": "b"}}) == {"code": "not_found"}
```

</details>

### Debugging exercise

A test asserts exact natural-language wording and flakes. Assert stable structured behavior instead.

<details>
<summary>Reveal reference solution</summary>

```python
result = {"category": "billing", "evidence_ids": ["d1"], "text": "Please review the invoice."}
assert result["category"] == "billing"
assert result["evidence_ids"] == ["d1"]
# Assert tool names, validated arguments, permissions and supported claims.
# Exact prose matching is only appropriate when exact wording is the contract.
```

</details>

**Interview question:** What can deterministic agent tests not tell you about a real model?

**Explain in your own words:** Explain deterministic agent tests in your own words. Use a concrete example to show why this is true: Test models and fake dependencies verify orchestration without relying on live model behavior.

