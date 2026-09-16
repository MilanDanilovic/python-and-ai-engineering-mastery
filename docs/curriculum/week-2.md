# Week 2

[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)

<a id="shallow-copy"></a>

## Shallow copy

A shallow copy creates a new outer container while sharing nested objects.

**Why it matters:** Copying a container may not isolate request-specific changes.

**Prerequisites:** [Mutability](week-1.md#mutability), [Equality versus identity](week-1.md#identity)

**Difficulty:** Intermediate · **Code concepts:** copy.copy, list.copy, dict.copy

[Shallow copy](https://docs.python.org/3/library/copy.html#copy.copy) · [Additional reading](https://docs.python.org/3/reference/datamodel.html#objects-values-and-types)

**Read for:** Read the shallow/deep distinction above the API and trace nested references.

### Learn with an example

copy creates a new outer list, so appending a new row does not lengthen original. Both outer lists still point to the same first inner list, whose mutation is visible through either route.

**Worked example** - Browser-compatible Python

```python
original = [["open"]]
copy = original.copy()
copy.append(["new"] )
copy[0].append("closed")
print(original)
print(len(copy))
```

**Expected output**

```text
[['open', 'closed']]
2
```

**Watch out for:** A shallow copy separates only the outer container.

**Change one thing:** Print original[0] is copy[0], then copy is original.

### Simple exercise 1

Mutate a nested list through a shallow copy and inspect both containers.

<details>
<summary>Reveal reference solution</summary>

```python
a = [[1]]; b = a.copy(); b[0].append(2)
print(a == b == [[1, 2]] and a is not b)  # Expected: True
```

</details>

### Simple exercise 2

Replace an item in a shallow outer copy, then contrast that with mutating a nested item.

<details>
<summary>Reveal reference solution</summary>

```python
a = [[1]]; b = a.copy(); b[0] = [2]
print(a)  # Expected: [[1]]
b = a.copy(); b[0].append(3)
print(a)  # Expected: [[1, 3]]
```

</details>

### Practical exercise

Document which parts of a copied configuration remain shared.

<details>
<summary>Reveal reference solution</summary>

```python
config = {"retries": 3, "labels": ["api"]}
copy = config.copy()
print(copy is not config and copy['labels'] is config['labels'])  # Expected: True
copy["retries"] = 1
print(config['retries'])  # Expected: 3
# Only outer entries are isolated; nested mutable values remain shared.
```

</details>

### Debugging exercise

An outer copy unexpectedly changes nested defaults. Draw the reference graph and choose an isolation strategy.

<details>
<summary>Reveal reference solution</summary>

```python
from copy import deepcopy
defaults = {"nested": {"timeout": 30}}
request = deepcopy(defaults)
request["nested"]["timeout"] = 0
print(defaults['nested']['timeout'])  # Expected: 30
# Before: two dicts -> one nested dict. After: distinct nested dicts.
```

</details>

**Interview question:** What exactly does a shallow copy duplicate?

**Explain in your own words:** Explain shallow copy in your own words. Use a concrete example to show why this is true: A shallow copy creates a new outer container while sharing nested objects.

<a id="deep-copy"></a>

## Deep copy

Deep copying recursively copies supported objects and tracks visited objects to handle repeated references.

**Why it matters:** Full isolation has costs and may copy objects that should remain shared.

**Prerequisites:** [Shallow copy](week-2.md#shallow-copy)

**Difficulty:** Intermediate · **Code concepts:** copy.deepcopy, memo

[Deep copy](https://docs.python.org/3/library/copy.html#copy.deepcopy) · [Additional reading](https://docs.python.org/3/library/copy.html#copy.copy)

**Read for:** Read about recursive copying and the memo dictionary before copying arbitrary objects.

### Learn with an example

deepcopy recursively creates an independent nested list here. The change reaches only the new graph. Real resources such as sockets need explicit ownership rather than blind recursive copying.

**Worked example** - Browser-compatible Python

```python
from copy import deepcopy
original = {"flags": ["safe"]}
copy = deepcopy(original)
copy["flags"].append("fast")
print(original["flags"])
print(copy["flags"])
```

**Expected output**

```text
['safe']
['safe', 'fast']
```

**Watch out for:** Deep copying an entire application object graph is not a resource-management strategy.

**Change one thing:** Repeat with dict.copy and explain the changed result.

### Simple exercise 1

Deep-copy nested records and compare nested identities.

<details>
<summary>Reveal reference solution</summary>

```python
from copy import deepcopy
a = [{"tags": []}]; b = deepcopy(a)
print(b == a and b[0] is not a[0] and (b[0]['tags'] is not a[0]['tags']))  # Expected: True
```

</details>

### Simple exercise 2

Deep-copy a structure containing the same nested list twice and inspect alias preservation within the copy.

<details>
<summary>Reveal reference solution</summary>

```python
from copy import deepcopy
shared = []; a = [shared, shared]; b = deepcopy(a)
print(b[0] is b[1] and b[0] is not shared)  # Expected: True
```

</details>

### Practical exercise

Isolate a test fixture while preserving an intentionally shared service object.

<details>
<summary>Reveal reference solution</summary>

```python
from copy import deepcopy
service = object()
fixture = {"records": [{"id": 1}], "service": service}
isolated = {"records": deepcopy(fixture["records"]), "service": service}
print(isolated['service'] is service)  # Expected: True
print(isolated['records'][0] is not fixture['records'][0])  # Expected: True
```

</details>

### Debugging exercise

A copy attempts to duplicate an open resource. Redesign the object boundary instead of copying the handle.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass
@dataclass(frozen=True)
class ReadSpec:
    path: str
def read(spec):
    with open(spec.path, encoding="utf-8") as handle: return handle.read()
# Copy the immutable specification, never the live handle.
# Each read owns its resource and closes it independently.
```

</details>

**Interview question:** Why is deepcopy not always the right ownership solution?

**Explain in your own words:** Explain deep copy in your own words. Use a concrete example to show why this is true: Deep copying recursively copies supported objects and tracks visited objects to handle repeated references.

<a id="classes"></a>

## Constructing classes and instances

Calling a class creates an instance; initialization sets up its state.

**Why it matters:** Domain objects give data and behavior a clear home.

**Prerequisites:** [Defining functions](week-1.md#define), [Names, bindings, and references](week-1.md#bindings)

**Difficulty:** Intermediate · **Code concepts:** class, self, __init__

[Class objects](https://docs.python.org/3/tutorial/classes.html#class-objects) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

**Read for:** Follow instantiation and __init__; distinguish creating an instance from initializing it.

### Learn with an example

Calling Counter creates an instance and initializes its value. Accessing increment through that instance binds self, so the method changes that particular object's state.

**Worked example** - Browser-compatible Python

```python
class Counter:
    def __init__(self, start):
        self.value = start
    def increment(self):
        self.value += 1
counter = Counter(4)
counter.increment()
print(counter.value)
```

**Expected output**

```text
5
```

**Watch out for:** self is supplied by a bound method call, not a magic global variable.

**Change one thing:** Create a second counter and show that incrementing the first leaves it unchanged.

### Simple exercise 1

Create two event objects with different messages.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    def __init__(self, message): self.message = message
a, b = Event("a"), Event("b")
print(a.message != b.message)  # Expected: True
```

</details>

### Simple exercise 2

Call an instance method on two independently initialized objects and compare their state.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    def __init__(self, message): self.message = message
    def upper(self): self.message = self.message.upper()
a, b = Event("a"), Event("b"); a.upper()
print(a.message, b.message)  # Expected values: 'A'; 'b'
```

</details>

### Practical exercise

Model an event with explicit severity and source fields.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    def __init__(self, severity, source, message):
        self.severity, self.source, self.message = severity, source, message
event = Event("INFO", "api", "ready")
print(event.source)  # Expected: "api"
```

</details>

### Debugging exercise

An initializer returns a value and raises TypeError. Fix initialization semantics.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    def __init__(self, message):
        self.message = message
        # No return value: __init__ initializes an already-created object.
print(Event('ok').message)  # Expected: "ok"
# Returning 1 from __init__ would raise TypeError.
```

</details>

**Interview question:** What is the role of self in an instance method?

**Explain in your own words:** Explain constructing classes and instances in your own words. Use a concrete example to show why this is true: Calling a class creates an instance; initialization sets up its state.

<a id="attributes"></a>

## Instance attributes versus class attributes

Instance state belongs to one object; class attributes are shared unless shadowed.

**Why it matters:** Shared class-level containers can leak data across instances.

**Prerequisites:** [Constructing classes and instances](week-2.md#classes), [Mutability](week-1.md#mutability)

**Difficulty:** Intermediate · **Code concepts:** self.attr, Class.attr, attribute lookup

[Class and instance variables](https://docs.python.org/3/tutorial/classes.html#class-and-instance-variables) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#class-objects)

**Read for:** Trace the shared mutable class-variable example and its instance-owned repair.

### Learn with an example

category is shared on the class. __init__ allocates a pages list for each instance, so mutable state is separate. Attribute lookup can find a class value when the instance has no override.

**Worked example** - Browser-compatible Python

```python
class Notebook:
    category = "notes"
    def __init__(self):
        self.pages = []
a, b = Notebook(), Notebook()
a.pages.append("idea")
print(a.category, b.category)
print(a.pages, b.pages)
```

**Expected output**

```text
notes notes
['idea'] []
```

**Watch out for:** A mutable class attribute is shared by every instance using it.

**Change one thing:** Move pages to the class body and predict the new output.

### Simple exercise 1

Contrast a class counter with per-instance message lists.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    count = 0
    def __init__(self):
        Event.count += 1
        self.messages = []
a, b = Event(), Event(); a.messages.append("a")
print(Event.count, b.messages)  # Expected values: 2; []
```

</details>

### Simple exercise 2

Shadow a class attribute on one instance and compare lookup on another instance.

<details>
<summary>Reveal reference solution</summary>

```python
class Settings: timeout = 30
a, b = Settings(), Settings(); a.timeout = 0
print(a.timeout == 0 and b.timeout == Settings.timeout == 30)  # Expected: True
```

</details>

### Practical exercise

Give every customer an independent support-note collection.

<details>
<summary>Reveal reference solution</summary>

```python
class Customer:
    def __init__(self, customer_id):
        self.customer_id = customer_id
        self.notes = []
a, b = Customer("a"), Customer("b"); a.notes.append("hello")
print(b.notes)  # Expected: []
```

</details>

### Debugging exercise

A class-level notes = [] accumulates notes from all customers. Repair the state placement.

<details>
<summary>Reveal reference solution</summary>

```python
class Bad: notes = []
a, b = Bad(), Bad(); a.notes.append("leaked")
print(b.notes)  # Expected: ["leaked"]
class Good:
    def __init__(self): self.notes = []
a, b = Good(), Good(); a.notes.append("private")
print(b.notes)  # Expected: []
```

</details>

**Interview question:** How does instance attribute lookup interact with class attributes?

**Explain in your own words:** Explain instance attributes versus class attributes in your own words. Use a concrete example to show why this is true: Instance state belongs to one object; class attributes are shared unless shadowed.

<a id="composition"></a>

## Composition and inheritance

Composition delegates to collaborators; inheritance specializes an existing type's behavior.

**Why it matters:** Explicit collaborators reduce fragile coupling.

**Prerequisites:** [Constructing classes and instances](week-2.md#classes), [Instance attributes versus class attributes](week-2.md#attributes)

**Difficulty:** Intermediate · **Code concepts:** inheritance, delegation, super

[Inheritance](https://docs.python.org/3/tutorial/classes.html#inheritance) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#class-objects)

**Read for:** Find method lookup in base classes, then compare delegation to a contained collaborator.

### Learn with an example

Reporter owns a reference to a collaborator and delegates sending. It does not inherit Console's identity or implementation. Replacing the collaborator changes delivery without changing report orchestration.

**Worked example** - Browser-compatible Python

```python
class Console:
    def send(self, text):
        print(text)
class Reporter:
    def __init__(self, output):
        self.output = output
    def report(self):
        self.output.send("ready")
Reporter(Console()).report()
```

**Expected output**

```text
ready
```

**Watch out for:** Inheritance is not required merely to reuse another object's behavior.

**Change one thing:** Inject an object that records messages in a list instead of printing.

### Simple exercise 1

Implement a writer that delegates to a supplied sink.

<details>
<summary>Reveal reference solution</summary>

```python
class Writer:
    def __init__(self, sink): self.sink = sink
    def write(self, text): self.sink.write(text)
from io import StringIO
sink = StringIO(); Writer(sink).write("hello")
print(sink.getvalue())  # Expected: "hello"
```

</details>

### Simple exercise 2

Replace a composed sink with an in-memory implementation without changing the writer.

<details>
<summary>Reveal reference solution</summary>

```python
class MemorySink:
    def __init__(self): self.parts = []
    def write(self, text): self.parts.append(text)
class Writer:
    def __init__(self, sink): self.sink = sink
    def write(self, text): self.sink.write(text)
sink = MemorySink(); Writer(sink).write("test")
print(sink.parts)  # Expected: ["test"]
```

</details>

### Practical exercise

Compose a log analyzer from parser, filter, and report components.

<details>
<summary>Reveal reference solution</summary>

```python
def analyze(lines, parser, predicate, report):
    return report(record for record in map(parser, lines) if predicate(record))
print(analyze(['1', '2'], int, lambda n: n > 1, sum))  # Expected: 2
```

</details>

### Debugging exercise

A subclass skips base initialization and lacks required state. Fix the contract or use composition.

<details>
<summary>Reveal reference solution</summary>

```python
class Base:
    def __init__(self, sink): self.sink = sink
class Writer(Base):
    def __init__(self, sink): super().__init__(sink)
print(Writer('memory').sink)  # Expected: "memory"
# Or inject the sink directly into a composed Writer without inheritance.
```

</details>

**Interview question:** When would composition be preferable to inheritance?

**Explain in your own words:** Explain composition and inheritance in your own words. Use a concrete example to show why this is true: Composition delegates to collaborators; inheritance specializes an existing type's behavior.

<a id="dataclasses"></a>

## Dataclass-generated methods

Dataclasses generate common methods from declared fields while leaving domain behavior explicit.

**Why it matters:** Less boilerplate keeps value models readable.

**Prerequisites:** [Function annotations](week-1.md#annotations), [Instance attributes versus class attributes](week-2.md#attributes)

**Difficulty:** Intermediate · **Code concepts:** dataclass, field, default_factory

[The dataclass decorator](https://docs.python.org/3/library/dataclasses.html#dataclasses.dataclass) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)

**Read for:** Check generated methods and defaults; then inspect field(default_factory=...).

### Learn with an example

dataclass generates initialization and representation from declared fields. default_factory calls list separately for each instance, avoiding a shared collection. Annotations still do not validate element types at runtime.

**Worked example** - Browser-compatible Python

```python
from dataclasses import dataclass, field
@dataclass
class Batch:
    name: str
    items: list = field(default_factory=list)
a, b = Batch("a"), Batch("b")
a.items.append(1)
print(a)
print(b.items)
```

**Expected output**

```text
Batch(name='a', items=[1])
[]
```

**Watch out for:** A dataclass is not a Pydantic validation boundary.

**Change one thing:** Construct a Batch with an unexpected name type and compare runtime behavior with a static checker.

### Simple exercise 1

Define an event dataclass and inspect its generated repr and equality.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass
@dataclass
class Event: message: str
print(Event('ok'))  # Expected: Event("ok")
print(repr(Event('ok')))  # Expected: "Event(message='ok')"
```

</details>

### Simple exercise 2

Compare equality of two dataclass instances before and after changing one field.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass
@dataclass
class Event: message: str
a, b = Event("ok"), Event("ok")
print(a)  # Expected: b
b.message = "changed"; print(a != b)  # Expected: True
```

</details>

### Practical exercise

Create a support-ticket domain model with an independent labels list.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass, field
@dataclass
class Ticket:
    id: str
    labels: list[str] = field(default_factory=list)
a, b = Ticket("a"), Ticket("b"); a.labels.append("urgent")
print(b.labels)  # Expected: []
```

</details>

### Debugging exercise

A mutable field default is rejected or shared in a custom model. Use a factory and test two instances.

<details>
<summary>Reveal reference solution</summary>

```python
from dataclasses import dataclass, field
@dataclass
class Record:
    tags: list[str] = field(default_factory=list)
print(Record().tags is not Record().tags)  # Expected: True
# default_factory is invoked per instance; a default list is not.
```

</details>

**Interview question:** What does frozen change, and does it freeze nested objects?

**Explain in your own words:** Explain dataclass-generated methods in your own words. Use a concrete example to show why this is true: Dataclasses generate common methods from declared fields while leaving domain behavior explicit.

<a id="properties"></a>

## Properties and descriptors

A property mediates attribute access through descriptor methods rather than a direct field read.

**Why it matters:** Validation and derived state can retain an attribute-like interface.

**Prerequisites:** [Instance attributes versus class attributes](week-2.md#attributes)

**Difficulty:** Intermediate · **Code concepts:** property, getter, setter, __get__

[property](https://docs.python.org/3/library/functions.html#property) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#class-and-instance-variables)

**Read for:** Read the getter/setter example and separate attribute syntax from stored data.

### Learn with an example

Accessing fahrenheit invokes its getter through attribute syntax. The value is computed from current state instead of stored separately, avoiding stale duplicated data.

**Worked example** - Browser-compatible Python

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius
    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32
t = Temperature(20)
print(t.fahrenheit)
t.celsius = 0
print(t.fahrenheit)
```

**Expected output**

```text
68.0
32.0
```

**Watch out for:** A property without a setter cannot be assigned like a normal stored field.

**Change one thing:** Try assigning fahrenheit and explain why Python rejects it.

### Simple exercise 1

Expose a derived full_name property from two stored fields.

<details>
<summary>Reveal reference solution</summary>

```python
class Person:
    def __init__(self, first, last): self.first, self.last = first, last
    @property
    def full_name(self): return f"{self.first} {self.last}"
print(Person('Ada', 'Lovelace').full_name)  # Expected: "Ada Lovelace"
```

</details>

### Simple exercise 2

Create a read-only property and capture the error raised by attempted assignment.

<details>
<summary>Reveal reference solution</summary>

```python
class Ticket:
    @property
    def status(self): return "open"
try: Ticket().status = "closed"
except AttributeError: print("No setter: read only")
```

</details>

### Practical exercise

Validate a ticket's priority when it is updated.

<details>
<summary>Reveal reference solution</summary>

```python
class Ticket:
    def __init__(self, priority): self.priority = priority
    @property
    def priority(self): return self._priority
    @priority.setter
    def priority(self, value):
        if value not in range(1, 6): raise ValueError("priority 1..5")
        self._priority = value
t = Ticket(2); t.priority = 4; print(t.priority)  # Expected: 4
```

</details>

### Debugging exercise

A property's getter refers to itself and recurses. Introduce a separate backing attribute.

<details>
<summary>Reveal reference solution</summary>

```python
class Value:
    def __init__(self, value): self._value = value
    @property
    def value(self): return self._value
print(Value(2).value)  # Expected: 2
# Returning self.value would call this getter recursively.
```

</details>

**Interview question:** Why is property considered a descriptor?

**Explain in your own words:** Explain properties and descriptors in your own words. Use a concrete example to show why this is true: A property mediates attribute access through descriptor methods rather than a direct field read.

<a id="method-kinds"></a>

## Instance, class, and static methods

Instance methods receive the instance; class methods receive the class; static methods receive neither automatically.

**Why it matters:** Factories and utilities need the correct binding behavior.

**Prerequisites:** [Constructing classes and instances](week-2.md#classes), [Dictionary lookup and aggregation](week-1.md#dicts)

**Difficulty:** Intermediate · **Code concepts:** classmethod, staticmethod, cls

[classmethod](https://docs.python.org/3/library/functions.html#classmethod) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#class-objects)

**Read for:** Compare the implicit class argument with an instance method and staticmethod.

### Learn with an example

The class method receives the class as cls and can respect subclass configuration. The static method receives neither an instance nor a class; it is a namespaced helper.

**Worked example** - Browser-compatible Python

```python
class Label:
    prefix = "item"
    @classmethod
    def named(cls, value):
        return f"{cls.prefix}:{value}"
    @staticmethod
    def clean(value):
        return value.strip()
print(Label.named("7"))
print(Label.clean(" x "))
```

**Expected output**

```text
item:7
x
```

**Watch out for:** classmethod is not just an instance method that you happen to call on the class.

**Change one thing:** Subclass Label with a new prefix and call named on the subclass.

### Simple exercise 1

Implement a classmethod factory and a static parsing helper.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    def __init__(self, level): self.level = level
    @staticmethod
    def parse_level(text): return text.upper()
    @classmethod
    def from_text(cls, text): return cls(cls.parse_level(text))
print(Event.from_text('info').level)  # Expected: "INFO"
```

</details>

### Simple exercise 2

Call an inherited classmethod factory on a subclass and inspect the returned type.

<details>
<summary>Reveal reference solution</summary>

```python
class Base:
    @classmethod
    def create(cls): return cls()
class Child(Base): pass
print(type(Child.create()) is Child)  # Expected: True
```

</details>

### Practical exercise

Add an alternate constructor for events decoded from dictionaries.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    def __init__(self, severity, message): self.severity, self.message = severity, message
    @classmethod
    def from_dict(cls, record): return cls(record["severity"], record["message"])
print(Event.from_dict({'severity': 'INFO', 'message': 'ok'}).message)  # Expected: "ok"
```

</details>

### Debugging exercise

A staticmethod expects self but receives no implicit argument. Choose the correct method kind.

<details>
<summary>Reveal reference solution</summary>

```python
class Event:
    def __init__(self, message): self.message = message
    def render(self): return self.message  # Instance method receives self.
    @staticmethod
    def normalize(text): return text.upper()  # No implicit receiver.
print(Event('ok').render(), Event.normalize('ok'))  # Expected values: 'ok'; 'OK'
```

</details>

**Interview question:** Why can a classmethod factory support subclassing better than a hard-coded class name?

**Explain in your own words:** Explain instance, class, and static methods in your own words. Use a concrete example to show why this is true: Instance methods receive the instance; class methods receive the class; static methods receive neither automatically.

<a id="dunders"></a>

## Dunder methods and Python protocols

Special methods connect user-defined objects to built-in syntax and functions.

**Why it matters:** Framework behavior becomes clearer when protocols are explicit.

**Prerequisites:** [Constructing classes and instances](week-2.md#classes), [Equality versus identity](week-1.md#identity)

**Difficulty:** Intermediate · **Code concepts:** __repr__, __len__, __eq__

[Special method names](https://docs.python.org/3/reference/datamodel.html#special-method-names) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#class-objects)

**Read for:** Choose one syntax operation and find the method Python calls for it.

### Learn with an example

len delegates to the type's length protocol. Implementing __len__ makes the object participate in ordinary syntax without exposing its internal list to callers.

**Worked example** - Browser-compatible Python

```python
class Playlist:
    def __init__(self, songs):
        self.songs = songs
    def __len__(self):
        return len(self.songs)
print(len(Playlist(["intro", "outro"])))
```

**Expected output**

```text
2
```

**Watch out for:** Special methods must honor the protocol's expected result and error behavior.

**Change one thing:** Return a negative length and observe Python's validation of the protocol.

### Simple exercise 1

Implement len() and repr() for an event collection.

<details>
<summary>Reveal reference solution</summary>

```python
class Events:
    def __init__(self, items): self.items = list(items)
    def __len__(self): return len(self.items)
    def __repr__(self): return f"Events({self.items!r})"
print(len(Events([1])), repr(Events([1])))  # Expected values: 1; 'Events([1])'
```

</details>

### Simple exercise 2

Implement equality for two value objects and return NotImplemented for unsupported types.

<details>
<summary>Reveal reference solution</summary>

```python
class Value:
    def __init__(self, value): self.value = value
    def __eq__(self, other):
        if not isinstance(other, Value): return NotImplemented
        return self.value == other.value
print(Value(1))  # Expected: Value(1)
print(Value(1).__eq__(1) is NotImplemented)  # Expected: True
```

</details>

### Practical exercise

Make a report container readable in logs and measurable with len.

<details>
<summary>Reveal reference solution</summary>

```python
class Report:
    def __init__(self, rows): self.rows = list(rows)
    def __len__(self): return len(self.rows)
    def __repr__(self): return f"Report(rows={len(self)})"
print(repr(Report([1, 2])))  # Expected: "Report(rows=2)"
```

</details>

### Debugging exercise

__len__ returns a negative number. Reproduce the failure and honor the protocol.

<details>
<summary>Reveal reference solution</summary>

```python
class Bad:
    def __len__(self): return -1
try: len(Bad())
except ValueError: pass
class Good:
    def __len__(self): return 0
print(len(Good()))  # Expected: 0
```

</details>

**Interview question:** Why call len(obj) rather than invoking arbitrary custom size methods?

**Explain in your own words:** Explain dunder methods and python protocols in your own words. Use a concrete example to show why this is true: Special methods connect user-defined objects to built-in syntax and functions.

<a id="iterables"></a>

## Iterables and the iteration protocol

An iterable can supply an iterator, often a fresh one for each traversal.

**Why it matters:** Repeatable collections differ from one-shot streams.

**Prerequisites:** [Loops, range, and conditions](week-1.md#loops), [Dunder methods and Python protocols](week-2.md#dunders)

**Difficulty:** Intermediate · **Code concepts:** iter, __iter__, for

[Iterator types](https://docs.python.org/3/library/stdtypes.html#typeiter) · [Additional reading](https://docs.python.org/3/tutorial/controlflow.html#the-range-function)

**Read for:** Distinguish obtaining an iterator with iter from advancing it with next.

### Learn with an example

A list can produce independent iterators. Each iterator owns its position, so advancing first does not advance second. An iterable is the source of iteration, not necessarily the cursor itself.

**Worked example** - Browser-compatible Python

```python
values = [3, 4]
first = iter(values)
second = iter(values)
print(next(first), next(first))
print(next(second))
```

**Expected output**

```text
3 4
3
```

**Watch out for:** An iterable and an iterator are different roles even when one object implements both.

**Change one thing:** Compare iter(first) is first with iter(values) is values.

### Simple exercise 1

Call iter twice on a list and advance the iterators independently.

<details>
<summary>Reveal reference solution</summary>

```python
xs = [1, 2]; a, b = iter(xs), iter(xs)
print(next(a), next(a), next(b))  # Expected values: 1; 2; 1
```

</details>

### Simple exercise 2

Compare iter(collection) is collection for a list and for an iterator.

<details>
<summary>Reveal reference solution</summary>

```python
xs = [1]; iterator = iter(xs)
print(iter(xs) is not xs and iter(iterator) is iterator)  # Expected: True
```

</details>

### Practical exercise

Expose a reusable collection of parsed events.

<details>
<summary>Reveal reference solution</summary>

```python
class Events:
    def __init__(self, records): self.records = tuple(records)
    def __iter__(self): return iter(self.records)
events = Events([{"id": 1}])
print(list(events) == list(events) == [{'id': 1}])  # Expected: True
```

</details>

### Debugging exercise

A custom container returns a non-iterator from __iter__. Fix the protocol boundary.

<details>
<summary>Reveal reference solution</summary>

```python
class Collection:
    def __iter__(self): return iter([1, 2])
print(list(Collection()))  # Expected: [1, 2]
# Returning [1, 2] directly fails: __iter__ must return an iterator.
```

</details>

**Interview question:** Is every iterable an iterator?

**Explain in your own words:** Explain iterables and the iteration protocol in your own words. Use a concrete example to show why this is true: An iterable can supply an iterator, often a fresh one for each traversal.

<a id="iterators"></a>

## Iterators and StopIteration

An iterator returns itself from iter and supplies values through next until exhaustion.

**Why it matters:** Streaming APIs rely on precise exhaustion behavior.

**Prerequisites:** [Iterables and the iteration protocol](week-2.md#iterables)

**Difficulty:** Intermediate · **Code concepts:** __iter__, __next__, StopIteration

[iterator.__next__](https://docs.python.org/3/library/stdtypes.html#iterator.__next__) · [Additional reading](https://docs.python.org/3/library/stdtypes.html#typeiter)

**Read for:** Check StopIteration and the requirement that exhausted iterators remain exhausted.

### Learn with an example

The iterator yields its single element and then stays exhausted. The two-argument next supplies a fallback instead of exposing StopIteration. No rewind occurs automatically.

**Worked example** - Browser-compatible Python

```python
cursor = iter([9])
print(next(cursor))
print(next(cursor, "done"))
print(next(cursor, "done"))
```

**Expected output**

```text
9
done
done
```

**Watch out for:** Calling iter on an exhausted iterator does not reset it.

**Change one thing:** Remove the fallback and catch StopIteration explicitly.

### Simple exercise 1

Implement a bounded counter iterator.

<details>
<summary>Reveal reference solution</summary>

```python
class Counter:
    def __init__(self, stop): self.current, self.stop = 0, stop
    def __iter__(self): return self
    def __next__(self):
        if self.current >= self.stop: raise StopIteration
        value = self.current; self.current += 1; return value
print(list(Counter(3)))  # Expected: [0, 1, 2]
```

</details>

### Simple exercise 2

Exhaust a custom iterator and verify that later next calls continue raising StopIteration.

<details>
<summary>Reveal reference solution</summary>

```python
class Once:
    def __init__(self): self.done = False
    def __iter__(self): return self
    def __next__(self):
        if self.done: raise StopIteration
        self.done = True; return 1
iterator = Once(); print(next(iterator))  # Expected: 1
for _ in range(2):
    try: next(iterator)
    except StopIteration: pass
    else: raise AssertionError("exhaustion must remain stable")
```

</details>

### Practical exercise

Consume a paginated sequence through a uniform iterator interface.

<details>
<summary>Reveal reference solution</summary>

```python
class Pages:
    def __init__(self, pages): self.items = iter(x for page in pages for x in page)
    def __iter__(self): return self
    def __next__(self): return next(self.items)
print(list(Pages([[1, 2], [], [3]])))  # Expected: [1, 2, 3]
```

</details>

### Debugging exercise

An exhausted iterator resets itself and a for loop never ends. Make exhaustion stable.

<details>
<summary>Reveal reference solution</summary>

```python
class Counter:
    def __init__(self, stop): self.n, self.stop = 0, stop
    def __iter__(self): return self
    def __next__(self):
        if self.n >= self.stop: raise StopIteration  # Never reset here.
        self.n += 1; return self.n
iterator = Counter(2)
print(list(iterator), list(iterator))  # Expected values: [1, 2]; []
```

</details>

**Interview question:** Why must an iterator's __iter__ return itself?

**Explain in your own words:** Explain iterators and stopiteration in your own words. Use a concrete example to show why this is true: An iterator returns itself from iter and supplies values through next until exhaustion.

<a id="generators"></a>

## Generator functions and yield

A generator function returns an iterator that suspends execution at each yield.

**Why it matters:** Lazy processing can avoid materializing a full dataset.

**Prerequisites:** [Iterators and StopIteration](week-2.md#iterators), [Return values](week-1.md#returns)

**Difficulty:** Intermediate · **Code concepts:** yield, generator function, next

[Generators](https://docs.python.org/3/tutorial/classes.html#generators) · [Additional reading](https://docs.python.org/3/library/stdtypes.html#iterator.__next__)

**Read for:** Trace suspension at yield and resumption at the next request.

### Learn with an example

Creating the generator does not execute its body. Each next advances to a yield and returns that yielded value; locals and the instruction position survive between calls.

**Worked example** - Browser-compatible Python

```python
def sequence():
    print("start")
    yield 8
    print("resume")
    yield 9
stream = sequence()
print("created")
print(next(stream))
print(next(stream))
```

**Expected output**

```text
created
start
8
resume
9
```

**Watch out for:** yield pauses a function; return finishes it.

**Change one thing:** Request one more value and explain the resulting StopIteration.

### Simple exercise 1

Yield three event IDs while tracing when each line runs.

<details>
<summary>Reveal reference solution</summary>

```python
def ids():
    for value in ("e1", "e2", "e3"):
        print("yielding", value); yield value
stream = ids()  # Nothing printed yet.
print(next(stream))  # Expected: "e1"
print(list(stream))  # Expected: ["e2", "e3"]
```

</details>

### Simple exercise 2

Insert a message after the final yield and observe when it runs during exhaustion.

<details>
<summary>Reveal reference solution</summary>

```python
trace = []
def values():
    yield 1
    trace.append("after final yield")
stream = values(); next(stream); print(trace)  # Expected: []
print(list(stream), trace)  # Expected values: []; ['after final yield']
```

</details>

### Practical exercise

Stream matching errors from a large input file.

<details>
<summary>Reveal reference solution</summary>

```python
def errors(handle):
    for line in handle:
        if line.startswith("ERROR "): yield line.rstrip()
# Caller owns the file's with block; no entire-file materialization.
print(list(errors(['INFO ok\n', 'ERROR fail\n'])))  # Expected: ["ERROR fail"]
```

</details>

### Debugging exercise

A generator is converted to a list for logging and later appears empty. Preserve or recreate the stream intentionally.

<details>
<summary>Reveal reference solution</summary>

```python
def source(): yield from [1, 2]
stream = source(); print(list(stream))  # Expected: [1, 2]
print(list(stream))  # Expected: []
buffer = list(source())  # Intentional bounded materialization for reuse.
print(list(buffer) == list(buffer) == [1, 2])  # Expected: True
```

</details>

**Interview question:** How does yield differ from return?

**Explain in your own words:** Explain generator functions and yield in your own words. Use a concrete example to show why this is true: A generator function returns an iterator that suspends execution at each yield.

<a id="generator-pipelines"></a>

## Lazy generator pipelines

Generator stages can transform and filter data one item at a time.

**Why it matters:** Streaming reduces peak memory and separates concerns.

**Prerequisites:** [Generator functions and yield](week-2.md#generators), [JSON parsing and boundaries](week-1.md#json)

**Difficulty:** Intermediate · **Code concepts:** generator expression, yield from

[Generator expressions](https://docs.python.org/3/tutorial/classes.html#generator-expressions) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#generators)

**Read for:** Compare lazy consumption with building a list and note single-pass behavior.

### Learn with an example

Requesting an output pulls only enough input through the pipeline to produce it. Consuming the rest drains the shared source, including values rejected by the filter.

**Worked example** - Browser-compatible Python

```python
source = (n for n in range(6))
filtered = (n for n in source if n % 2 == 0)
squared = (n * n for n in filtered)
print(next(squared))
print(list(squared))
print(list(source))
```

**Expected output**

```text
0
[4, 16]
[]
```

**Watch out for:** Laziness avoids eager storage but does not make a stream reusable.

**Change one thing:** Replace the source generator with a list and create two independent pipelines.

### Simple exercise 1

Chain a filter and a transformation without building intermediate lists.

<details>
<summary>Reveal reference solution</summary>

```python
filtered = (n for n in range(5) if n % 2 == 0)
transformed = (n*n for n in filtered)
print(list(transformed))  # Expected: [0, 4, 16]
```

</details>

### Simple exercise 2

Use yield from to delegate to two small iterables and predict the emitted sequence.

<details>
<summary>Reveal reference solution</summary>

```python
def combined():
    yield from [1, 2]
    yield from [3]
print(list(combined()))  # Expected: [1, 2, 3]
```

</details>

### Practical exercise

Connect file lines, JSON parsing, and severity filtering into a pipeline.

<details>
<summary>Reveal reference solution</summary>

```python
import json
def errors(lines):
    records = (json.loads(line) for line in lines if line.strip())
    return (r for r in records if r["severity"] == "ERROR")
print(list(errors(['{"severity":"ERROR"}', '{"severity":"INFO"}'])))  # Expected: [{"severity": "ERROR"}]
```

</details>

### Debugging exercise

A stage calls list on its entire input and memory spikes. Locate eager materialization.

<details>
<summary>Reveal reference solution</summary>

```python
def transform(source):
    for value in source: yield value * 2
# list(source) inside the stage would eagerly consume unbounded input.
from itertools import count, islice
print(list(islice(transform(count()), 3)))  # Expected: [0, 2, 4]
```

</details>

**Interview question:** What happens when a lazy pipeline encounters an exception midway?

**Explain in your own words:** Explain lazy generator pipelines in your own words. Use a concrete example to show why this is true: Generator stages can transform and filter data one item at a time.

<a id="generator-cleanup"></a>

## Generator cleanup and early termination

A suspended generator may hold resources; explicit ownership and cleanup are needed when consumption stops early.

**Why it matters:** Partial consumption should not leave files or sessions open.

**Prerequisites:** [Generator functions and yield](week-2.md#generators), [File handling with pathlib](week-1.md#files)

**Difficulty:** Intermediate · **Code concepts:** close, try/finally, GeneratorExit

[generator.close](https://docs.python.org/3/reference/expressions.html#generator.close) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#generators)

**Read for:** Read GeneratorExit and cleanup semantics; do not depend on garbage collection timing.

### Learn with an example

The first next enters the try block and suspends at yield. Explicit close causes the generator to unwind through finally. Cleanup ownership should be deliberate when consumers may stop early.

**Worked example** - Browser-compatible Python

```python
def stream():
    try:
        yield "row"
        yield "later"
    finally:
        print("closed")
cursor = stream()
print(next(cursor))
cursor.close()
```

**Expected output**

```text
row
closed
```

**Watch out for:** Do not assume a loop break immediately closes every referenced generator.

**Change one thing:** Keep a reference after breaking from a loop, then close it explicitly.

### Simple exercise 1

Close a generator and observe its finally block.

<details>
<summary>Reveal reference solution</summary>

```python
trace = []
def values():
    try: yield 1
    finally: trace.append("closed")
stream = values(); next(stream); stream.close()
print(trace)  # Expected: ["closed"]
```

</details>

### Simple exercise 2

Compare normal exhaustion with explicit close using an observable finally block.

<details>
<summary>Reveal reference solution</summary>

```python
trace = []
def values():
    try: yield 1
    finally: trace.append("closed")
print(list(values()))  # Expected: [1]
stream = values(); next(stream); stream.close()
print(trace)  # Expected: ["closed", "closed"]
```

</details>

### Practical exercise

Design a log stream whose file owner remains explicit.

<details>
<summary>Reveal reference solution</summary>

```python
def stream_errors(handle):
    for line in handle:
        if line.startswith("ERROR"): yield line
def first_error(path):
    with open(path, encoding="utf-8") as handle:
        return next(stream_errors(handle), None)
# The file owner closes the resource even on an early return.
```

</details>

### Debugging exercise

A consumer breaks early and assumes every resource has been released. Add deterministic cleanup.

<details>
<summary>Reveal reference solution</summary>

```python
from contextlib import closing
trace = []
def values():
    try: yield from range(3)
    finally: trace.append("closed")
with closing(values()) as stream:
    for value in stream: break
print(trace)  # Expected: ["closed"]
```

</details>

**Interview question:** Who should own resources used by a lazy iterator?

**Explain in your own words:** Explain generator cleanup and early termination in your own words. Use a concrete example to show why this is true: A suspended generator may hold resources; explicit ownership and cleanup are needed when consumption stops early.

<a id="decorators"></a>

## Applying a decorator

A decorator receives the defined callable and its return value becomes the decorated name.

**Why it matters:** Decorators are ordinary function composition, not hidden framework magic.

**Prerequisites:** [Functions as objects](week-1.md#function-objects), [Higher order functions](week-1.md#higher-order), [Closures and captured bindings](week-1.md#closures)

**Difficulty:** Intermediate · **Code concepts:** @decorator, wrapper, callable

[Function definitions and decorators](https://docs.python.org/3/reference/compound_stmts.html#function-definitions) · [Additional reading](https://docs.python.org/3/reference/datamodel.html#user-defined-functions)

**Read for:** Find the transformation from decorator syntax to nested function calls.

### Learn with an example

Python creates greeting, passes it to loud and binds the returned wrapper to greeting. The later call enters the wrapper, which calls the original function and transforms its result.

**Worked example** - Browser-compatible Python

```python
def loud(function):
    def wrapper():
        return function().upper()
    return wrapper
@loud
def greeting():
    return "hello"
print(greeting())
```

**Expected output**

```text
HELLO
```

**Watch out for:** Decoration happens when the definition executes, not on every invocation.

**Change one thing:** Replace @loud with greeting = loud(greeting) after a plain definition.

### Simple exercise 1

Apply a decorator manually and with @ syntax and compare behavior.

<details>
<summary>Reveal reference solution</summary>

```python
def doubled(function):
    def wrapper(): return function() * 2
    return wrapper
def one(): return 1
manual = doubled(one)
@doubled
def decorated(): return 1
print(manual() == decorated() == 2)  # Expected: True
```

</details>

### Simple exercise 2

Make a decorator return a different callable and inspect the decorated name.

<details>
<summary>Reveal reference solution</summary>

```python
def replace(function):
    return lambda: "replacement"
@replace
def original(): return "original"
print(original(), original.__name__)  # Expected values: 'replacement'; '<lambda>'
```

</details>

### Practical exercise

Wrap a parsing function with duration measurement.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import wraps
from time import perf_counter
def timed(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        start = perf_counter()
        try: return function(*args, **kwargs)
        finally: print(function.__name__, perf_counter() - start)
    return wrapper
print(timed(int)('2'))  # Expected: 2
```

</details>

### Debugging exercise

A decorator returns wrapper() instead of wrapper. Explain the early execution and repair it.

<details>
<summary>Reveal reference solution</summary>

```python
def decorate(function):
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper  # wrapper() would execute now and replace the callable with its result.
@decorate
def value(): return 3
print(callable(value) and value() == 3)  # Expected: True
```

</details>

**Interview question:** How would you rewrite @decorate def f without @ syntax?

**Explain in your own words:** Explain applying a decorator in your own words. Use a concrete example to show why this is true: A decorator receives the defined callable and its return value becomes the decorated name.

<a id="decorator-forwarding"></a>

## Decorator argument forwarding and wraps

A transparent wrapper forwards arguments and preserves useful metadata with functools.wraps.

**Why it matters:** Introspection and debugging depend on accurate function metadata.

**Prerequisites:** [Applying a decorator](week-2.md#decorators), [Argument unpacking at call sites](week-1.md#argument-unpack)

**Difficulty:** Intermediate · **Code concepts:** *args, **kwargs, functools.wraps

[functools.wraps](https://docs.python.org/3/library/functools.html#functools.wraps) · [Additional reading](https://docs.python.org/3/reference/compound_stmts.html#function-definitions)

**Read for:** Read which metadata is copied and why forwarding arguments is a separate responsibility.

### Learn with an example

The wrapper collects both argument kinds and expands them back into the original call. wraps preserves descriptive metadata; it does not do the forwarding for you.

**Worked example** - Browser-compatible Python

```python
from functools import wraps
def traced(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        return function(*args, **kwargs)
    return wrapper
@traced
def total(a, *, b):
    return a + b
print(total(2, b=6))
print(total.__name__)
```

**Expected output**

```text
8
total
```

**Watch out for:** A wrapper accepting only positional arguments breaks keyword-only calls.

**Change one thing:** Remove wraps and compare __name__; then remove **kwargs and observe the failed call.

### Simple exercise 1

Wrap a two-argument function and preserve its name and docstring.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import wraps
def trace(function):
    @wraps(function)
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper
@trace
def add(a, b):
    """Add two values."""
    return a + b
print(add(1, b=2), add.__name__, add.__doc__)  # Expected values: 3; 'add'; 'Add two values.'
```

</details>

### Simple exercise 2

Inspect __wrapped__ and __doc__ with and without functools.wraps.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import wraps
def original():
    """Original docs."""
def bare(): pass
@wraps(original)
def wrapped(): pass
print(not hasattr(bare, '__wrapped__'))  # Expected: True
print(wrapped.__wrapped__ is original and wrapped.__doc__ == original.__doc__)  # Expected: True
```

</details>

### Practical exercise

Add tracing around parsing helpers without losing signatures during inspection.

<details>
<summary>Reveal reference solution</summary>

```python
import inspect
from functools import wraps
def trace(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print("calling", function.__name__)
        return function(*args, **kwargs)
    return wrapper
def parse(text, *, strict=True): return int(text)
print(inspect.signature(trace(parse)))  # Expected: inspect.signature(parse)
```

</details>

### Debugging exercise

A wrapper drops keyword-only options and exposes its own name. Repair forwarding and metadata.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import wraps
def decorate(function):
    @wraps(function)
    def wrapper(*args, **kwargs): return function(*args, **kwargs)
    return wrapper
@decorate
def parse(text, *, strict): return int(text) if strict else text
print(parse('2', strict=True), parse.__name__)  # Expected values: 2; 'parse'
```

</details>

**Interview question:** What does wraps preserve and what does it not validate?

**Explain in your own words:** Explain decorator argument forwarding and wraps in your own words. Use a concrete example to show why this is true: A transparent wrapper forwards arguments and preserves useful metadata with functools.wraps.

<a id="decorator-factories"></a>

## Parameterized decorator factories

A configurable decorator adds an outer function that returns the actual decorator.

**Why it matters:** Layered closures separate configuration time from call time.

**Prerequisites:** [Applying a decorator](week-2.md#decorators), [Closures and captured bindings](week-1.md#closures)

**Difficulty:** Intermediate · **Code concepts:** closure, decorator factory

[Decorator expressions](https://docs.python.org/3/reference/compound_stmts.html#function-definitions) · [Additional reading](https://docs.python.org/3/reference/executionmodel.html#interaction-with-dynamic-features)

**Read for:** Separate evaluating the decorator factory, wrapping the function and calling the wrapper.

### Learn with an example

suffix first saves configuration and returns a decorator. The decorator receives the function and returns a wrapper. Only the wrapper executes when greeting is called.

**Worked example** - Browser-compatible Python

```python
def suffix(mark):
    def decorate(function):
        def wrapper():
            return function() + mark
        return wrapper
    return decorate
@suffix("!")
def greeting():
    return "hello"
print(greeting())
```

**Expected output**

```text
hello!
```

**Watch out for:** There are three different calls: configure, decorate and invoke.

**Change one thing:** Create another decorated function with a question-mark suffix.

### Simple exercise 1

Implement a decorator factory accepting a log prefix.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import wraps
def logged(prefix):
    def decorate(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            print(prefix, function.__name__)
            return function(*args, **kwargs)
        return wrapper
    return decorate
print(logged('API')(int)('2'))  # Expected: 2
```

</details>

### Simple exercise 2

Create two decorated functions with different thresholds and verify independent configuration.

<details>
<summary>Reveal reference solution</summary>

```python
def above(threshold):
    def decorate(function):
        def wrapper(value): return function(value) > threshold
        return wrapper
    return decorate
@above(2)
def low(value): return value
@above(5)
def high(value): return value
print(low(3) and (not high(3)))  # Expected: True
```

</details>

### Practical exercise

Configure slow-call warnings with a per-function threshold.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import wraps
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
# @warn_slow(0.1) -> factory -> decorator(function) -> wrapper(args).
```

</details>

### Debugging exercise

A threshold option is interpreted as the decorated function. Trace all three call layers.

<details>
<summary>Reveal reference solution</summary>

```python
def configured(threshold):
    def decorate(function):
        def wrapper(value): return function(value) >= threshold
        return wrapper
    return decorate
@configured(10)  # Call the factory with configuration first.
def measure(value): return value
print(measure(12) and (not measure(9)))  # Expected: True
```

</details>

**Interview question:** How many functions are typically involved in a parameterized decorator?

**Explain in your own words:** Explain parameterized decorator factories in your own words. Use a concrete example to show why this is true: A configurable decorator adds an outer function that returns the actual decorator.

<a id="decorator-order"></a>

## Stacking decorators

Stacked decorators are applied from the innermost one outward, affecting call behavior.

**Why it matters:** Ordering can change authorization, caching, and retries.

**Prerequisites:** [Decorator argument forwarding and wraps](week-2.md#decorator-forwarding)

**Difficulty:** Intermediate · **Code concepts:** decorator composition, wrapper ordering

[Nested decorators](https://docs.python.org/3/reference/compound_stmts.html#function-definitions) · [Additional reading](https://docs.python.org/3/library/functools.html#functools.wraps)

**Read for:** Expand two decorators into outer(inner(function)) and trace call order.

### Learn with an example

The inner decorator is applied first, giving wrap(A)(wrap(B)(value)). At invocation, the outer wrapper surrounds the inner result. Changing order can change authentication, caching and logging behavior too.

**Worked example** - Browser-compatible Python

```python
def wrap(mark):
    def decorate(function):
        return lambda: mark + function() + mark
    return decorate
@wrap("A")
@wrap("B")
def value():
    return "x"
print(value())
```

**Expected output**

```text
ABxBA
```

**Watch out for:** The top decorator is the outermost wrapper, not the first one applied.

**Change one thing:** Swap A and B and predict the complete result.

### Simple exercise 1

Stack two tracing decorators and record entry and exit order.

<details>
<summary>Reveal reference solution</summary>

```python
trace = []
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
run(); print(trace)  # Expected: ["enter A", "enter B", "exit B", "exit A"]
```

</details>

### Simple exercise 2

Expand two stacked decorators into ordinary function calls and compare output order.

<details>
<summary>Reveal reference solution</summary>

```python
trace = []
def tag(name):
    def decorate(function):
        def wrapper():
            trace.append(name); return function()
        return wrapper
    return decorate
def original(): return 1
wrapped = tag("A")(tag("B")(original))
print(wrapped(), trace)  # Expected values: 1; ['A', 'B']
```

</details>

### Practical exercise

Choose and justify authorization and caching order for a protected operation.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import lru_cache
@lru_cache
def tenant_data(tenant, key): return (tenant, key)
def protected(auth, key):
    if "read" not in auth["scopes"]: raise PermissionError("denied")
    return tenant_data(auth["tenant"], key)
# Authorization runs every time, before the tenant-scoped cache lookup.
print(protected({'tenant': 'a', 'scopes': {'read'}}, 'x'))  # Expected: ("a", "x")
```

</details>

### Debugging exercise

A cache outside an authorization wrapper returns a protected value without checking access. Fix the ordering and cache boundary.

<details>
<summary>Reveal reference solution</summary>

```python
from functools import lru_cache
@lru_cache
def cached(tenant, key): return f"{tenant}:{key}"
def read(auth, key):
    if not auth["allowed"]: raise PermissionError("denied")
    return cached(auth["tenant"], key)
read({"tenant": "a", "allowed": True}, "x")
try: read({"tenant": "a", "allowed": False}, "x")
except PermissionError: print("Cache hit cannot bypass authorization")
```

</details>

**Interview question:** Why can swapping two decorators change correctness?

**Explain in your own words:** Explain stacking decorators in your own words. Use a concrete example to show why this is true: Stacked decorators are applied from the innermost one outward, affecting call behavior.

<a id="context-managers"></a>

## Context managers and exception-aware cleanup

A context manager enters and exits a resource scope and can explicitly choose whether to suppress an exception.

**Why it matters:** Cleanup should remain reliable across failures.

**Prerequisites:** [Constructing classes and instances](week-2.md#classes), [Raising and handling exceptions](week-1.md#exceptions)

**Difficulty:** Intermediate · **Code concepts:** __enter__, __exit__, with

[The with statement](https://docs.python.org/3/reference/compound_stmts.html#the-with-statement) · [Additional reading](https://docs.python.org/3/tutorial/classes.html#class-objects)

**Read for:** Follow __enter__, the body and __exit__; inspect the meaning of a truthy exit result.

### Learn with an example

with calls __enter__ and binds its return value to value. After the body, __exit__ runs. False means any body exception should propagate rather than be suppressed.

**Worked example** - Browser-compatible Python

```python
class Notice:
    def __enter__(self):
        print("enter")
        return "resource"
    def __exit__(self, kind, error, traceback):
        print("exit")
        return False
with Notice() as value:
    print(value)
```

**Expected output**

```text
enter
resource
exit
```

**Watch out for:** The value after as is the result of __enter__, not necessarily the manager object.

**Change one thing:** Raise ValueError in the body and catch it outside the with statement.

### Simple exercise 1

Implement a context manager that logs entry and exit.

<details>
<summary>Reveal reference solution</summary>

```python
trace = []
class Scope:
    def __enter__(self): trace.append("enter"); return self
    def __exit__(self, kind, value, traceback): trace.append("exit"); return False
with Scope(): pass
print(trace)  # Expected: ["enter", "exit"]
```

</details>

### Simple exercise 2

Raise inside a with block and record the exception details received by __exit__.

<details>
<summary>Reveal reference solution</summary>

```python
seen = []
class Scope:
    def __enter__(self): return self
    def __exit__(self, kind, value, traceback):
        seen.append((kind, str(value), traceback is not None)); return False
try:
    with Scope(): raise ValueError("bad")
except ValueError: pass
print(seen)  # Expected: [(ValueError, "bad", True)]
```

</details>

### Practical exercise

Manage a temporary output file for a report export.

<details>
<summary>Reveal reference solution</summary>

```python
from tempfile import TemporaryDirectory
from pathlib import Path
with TemporaryDirectory() as directory:
    output = Path(directory) / "report.txt"
    output.write_text("Report\n", encoding="utf-8")
    print(output.exists())  # Expected: True
print(not output.exists())  # Expected: True
```

</details>

### Debugging exercise

__exit__ returns True unintentionally and hides a failure. Repair exception propagation.

<details>
<summary>Reveal reference solution</summary>

```python
class Scope:
    def __enter__(self): return self
    def __exit__(self, *exc): return False  # Never suppress accidentally.
try:
    with Scope(): raise ValueError("visible")
except ValueError as error: print(str(error))  # Expected: "visible"
else: raise AssertionError("exception was suppressed")
```

</details>

**Interview question:** What does a truthy __exit__ return value mean?

**Explain in your own words:** Explain context managers and exception-aware cleanup in your own words. Use a concrete example to show why this is true: A context manager enters and exits a resource scope and can explicitly choose whether to suppress an exception.

<a id="contextlib"></a>

## Generator-based context managers

contextlib.contextmanager splits setup and cleanup around a single yield.

**Why it matters:** Small resource scopes can be implemented with less boilerplate.

**Prerequisites:** [Context managers and exception-aware cleanup](week-2.md#context-managers), [Generator functions and yield](week-2.md#generators)

**Difficulty:** Intermediate · **Code concepts:** contextmanager, yield, finally

[contextmanager](https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager) · [Additional reading](https://docs.python.org/3/reference/compound_stmts.html#the-with-statement)

**Read for:** Locate the single yield and the try/finally pattern around it.

### Learn with an example

The decorator adapts a one-yield generator to the context-manager protocol. Code before yield acquires; the yielded value enters the body; finally releases on normal and exceptional exit.

**Worked example** - Browser-compatible Python

```python
from contextlib import contextmanager
@contextmanager
def notice():
    print("acquire")
    try:
        yield "resource"
    finally:
        print("release")
with notice() as value:
    print(value)
```

**Expected output**

```text
acquire
resource
release
```

**Watch out for:** A contextmanager generator must yield exactly once for each entered context.

**Change one thing:** Raise an exception inside the with block and check that release still prints.

### Simple exercise 1

Implement a timing scope using a generator context manager.

<details>
<summary>Reveal reference solution</summary>

```python
from contextlib import contextmanager
from time import perf_counter
@contextmanager
def timing():
    start = perf_counter()
    try: yield
    finally: print("seconds", perf_counter() - start)
with timing(): sum(range(10))
```

</details>

### Simple exercise 2

Raise during a generator context manager's body and verify state restoration.

<details>
<summary>Reveal reference solution</summary>

```python
from contextlib import contextmanager
state = {"active": False}
@contextmanager
def active():
    old = state["active"]; state["active"] = True
    try: yield
    finally: state["active"] = old
try:
    with active(): raise ValueError("test")
except ValueError: pass
print(state['active'] is False)  # Expected: True
```

</details>

### Practical exercise

Temporarily override configuration and restore it on failure.

<details>
<summary>Reveal reference solution</summary>

```python
from contextlib import contextmanager
@contextmanager
def override(config, key, value):
    missing = object(); old = config.get(key, missing); config[key] = value
    try: yield config
    finally:
        if old is missing: config.pop(key, None)
        else: config[key] = old
config = {"timeout": 30}
with override(config, "timeout", 0): print(config['timeout'])  # Expected: 0
print(config['timeout'])  # Expected: 30
```

</details>

### Debugging exercise

Cleanup follows yield without finally and is skipped after an exception. Protect restoration.

<details>
<summary>Reveal reference solution</summary>

```python
from contextlib import contextmanager
trace = []
@contextmanager
def scope():
    try: yield
    finally: trace.append("restored")
try:
    with scope(): raise RuntimeError("failed")
except RuntimeError: pass
print(trace)  # Expected: ["restored"]
# An unprotected statement after yield is skipped when the body raises.
```

</details>

**Interview question:** Why must a generator context manager yield exactly once?

**Explain in your own words:** Explain generator-based context managers in your own words. Use a concrete example to show why this is true: contextlib.contextmanager splits setup and cleanup around a single yield.

