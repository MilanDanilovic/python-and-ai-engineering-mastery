# Week 7

[Curriculum index](README.md) · [Example setup](../EXAMPLES.md)

<a id="ingestion"></a>

## Document ingestion and parsing

Ingestion extracts usable content while preserving source identity and version information.

**Why it matters:** Lost provenance cannot be repaired reliably during generation.

**Prerequisites:** [File handling with pathlib](week-1.md#files), [JSON parsing and boundaries](week-1.md#json), [Ontology-driven tool and retrieval design](week-6.md#ontology-contracts)

**Difficulty:** Advanced · **Code concepts:** parser, source ID, content hash

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Parse two documents and retain their source identifiers.

<details>
<summary>Reveal reference solution</summary>

```python
sources = [("d1", "First policy"), ("d2", "Second policy")]
documents = [{"source_id": key, "text": text.strip()} for key, text in sources]
print([d['source_id'] for d in documents])  # Expected: ["d1", "d2"]
```

</details>

### Simple exercise 2

Modify one document version and distinguish an update from an unchanged reingestion.

<details>
<summary>Reveal reference solution</summary>

```python
from hashlib import sha256
versions = {}
def ingest(key, text):
    digest = sha256(text.encode()).hexdigest()
    changed = versions.get(key) != digest; versions[key] = digest; return changed
print(ingest('d1', 'v1') and (not ingest('d1', 'v1')) and ingest('d1', 'v2'))  # Expected: True
```

</details>

### Practical exercise

Ingest support policies with version and ingestion timestamps.

<details>
<summary>Reveal reference solution</summary>

```python
from hashlib import sha256
from datetime import datetime, timezone
documents = {}
def ingest(source_id, text):
    version = sha256(text.encode()).hexdigest()
    old = documents.get(source_id)
    if old and old["version"] == version: return old
    record = {"source_id": source_id, "version": version, "text": text,
              "ingested_at": datetime.now(timezone.utc).isoformat()}
    documents[source_id] = record; return record
print(ingest('d1', 'policy'))  # Expected: ingest("d1", "policy")
```

</details>

### Debugging exercise

Reingestion appends duplicates because documents have no stable identity. Add version-aware upsert behavior.

<details>
<summary>Reveal reference solution</summary>

```python
documents = {}
def upsert(source_id, version, text):
    documents[source_id] = {"version": version, "text": text}
upsert("d1", 1, "old"); upsert("d1", 2, "new"); upsert("d1", 2, "new")
print(len(documents), documents['d1']['text'])  # Expected values: 1; 'new'
# In storage, transact the version update and obsolete-chunk replacement.
```

</details>

**Interview question:** What metadata should survive parsing?

**Explain in your own words:** Explain document ingestion and parsing in your own words. Use a concrete example to show why this is true: Ingestion extracts usable content while preserving source identity and version information.

<a id="chunking"></a>

## Chunk boundaries and overlap

Chunking partitions content for retrieval; overlap trades duplication for boundary context.

**Why it matters:** Bad boundaries can separate answers from the evidence needed to interpret them.

**Prerequisites:** [Document ingestion and parsing](week-7.md#ingestion)

**Difficulty:** Advanced · **Code concepts:** chunk size, overlap, token budget

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-chunking-phase) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Split a policy into chunks with two different overlap values.

<details>
<summary>Reveal reference solution</summary>

```python
def chunks(text, size, overlap):
    if not 0 <= overlap < size: raise ValueError("invalid overlap")
    return [text[start:start+size] for start in range(0, len(text), size-overlap)]
print(chunks('abcdef', 3, 0))  # Expected: ["abc", "def"]
print(chunks('abcdef', 3, 1))  # Expected: ["abc", "cde", "ef"]
```

</details>

### Simple exercise 2

Compare a heading-aware split with a fixed-size split on a short structured policy.

<details>
<summary>Reveal reference solution</summary>

```python
text = "# Refunds\nReceipt required.\n# Shipping\nTrack parcel."
fixed = [text[n:n+20] for n in range(0, len(text), 20)]
headings = ["# " + part for part in text.split("# ") if part]
print(len(headings) == 2 and 'Receipt' in headings[0])  # Expected: True
print(fixed, headings)  # Fixed slices may split a section's meaning.
```

</details>

### Practical exercise

Keep headings and source offsets on every policy chunk.

<details>
<summary>Reveal reference solution</summary>

```python
def split_sections(text):
    chunks = []; heading = ""; offset = 0
    for line in text.splitlines(keepends=True):
        if line.startswith("# "): heading = line.strip()[2:]
        elif line.strip(): chunks.append({"heading": heading, "start": offset, "end": offset+len(line), "text": line})
        offset += len(line)
    return chunks
text = "# Policy\nReceipt required.\n"
chunk = split_sections(text)[0]
print(text[chunk['start']:chunk['end']])  # Expected: chunk["text"]
```

</details>

### Debugging exercise

Overlap is greater than chunk size and the loop never advances. Enforce a positive stride.

<details>
<summary>Reveal reference solution</summary>

```python
def chunks(text, size, overlap):
    if size <= 0 or not 0 <= overlap < size: raise ValueError("positive stride required")
    for start in range(0, len(text), size-overlap): yield text[start:start+size]
try: list(chunks("abc", 3, 3))
except ValueError: print("non-advancing loop prevented")
```

</details>

**Interview question:** Why can larger chunks improve context but reduce retrieval precision?

**Explain in your own words:** Explain chunk boundaries and overlap in your own words. Use a concrete example to show why this is true: Chunking partitions content for retrieval; overlap trades duplication for boundary context.

<a id="metadata"></a>

## Retrieval metadata and tenant filtering

Metadata carries source, version, and access context alongside content.

**Why it matters:** Relevant results must also be authorized and current.

**Prerequisites:** [Document ingestion and parsing](week-7.md#ingestion), [Tool permissions and authorization](week-6.md#tool-permissions)

**Difficulty:** Advanced · **Code concepts:** tenant filter, source version, metadata

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-enrichment-phase) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Attach customer and document version fields to chunks.

<details>
<summary>Reveal reference solution</summary>

```python
chunk = {"id": "d1:1:0", "text": "policy", "customer_id": "c1", "document_id": "d1", "version": 1}
print(chunk['customer_id'], chunk['version'])  # Expected values: 'c1'; 1
```

</details>

### Simple exercise 2

Filter two versions of one document so only the intended active version is returned.

<details>
<summary>Reveal reference solution</summary>

```python
chunks = [{"doc": "d1", "version": 1}, {"doc": "d1", "version": 2}]
active = {"d1": 2}
print([c for c in chunks if c['version'] == active[c['doc']]])  # Expected: [{"doc": "d1", "version": 2}]
```

</details>

### Practical exercise

Filter candidate documents by authenticated tenant before constructing context.

<details>
<summary>Reveal reference solution</summary>

```python
def retrieve(auth, documents):
    # Apply this predicate in the database query before ranking/top-k.
    return [d for d in documents if d["tenant_id"] == auth["tenant_id"]]
docs = [{"tenant_id": "a", "id": "d1"}, {"tenant_id": "b", "id": "d2"}]
print([d['id'] for d in retrieve({'tenant_id': 'a'}, docs)])  # Expected: ["d1"]
```

</details>

### Debugging exercise

A cross-tenant document is retrieved because filtering occurs only in the UI. Enforce it in retrieval.

<details>
<summary>Reveal reference solution</summary>

```python
def context(auth, candidates):
    authorized = [d for d in candidates if d["tenant"] == auth["tenant"]]
    return "\n".join(d["text"] for d in authorized)
print(context({'tenant': 'a'}, [{'tenant': 'b', 'text': 'private'}]))  # Expected: ""
# Enforce this in retrieval too; hiding results in the UI is too late.
```

</details>

**Interview question:** Why is metadata filtering a correctness boundary?

**Explain in your own words:** Explain retrieval metadata and tenant filtering in your own words. Use a concrete example to show why this is true: Metadata carries source, version, and access context alongside content.

<a id="embeddings"></a>

## Embeddings and semantic representation

An embedding maps content to a numeric representation whose geometry supports similarity comparisons.

**Why it matters:** Representation choice determines what semantic relationships retrieval can express.

**Prerequisites:** [Chunk boundaries and overlap](week-7.md#chunking)

**Difficulty:** Advanced · **Code concepts:** embedding vector, dimensions, model version

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-enrichment-phase) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Inspect vector dimensions and compare embeddings of related phrases.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
# Handcrafted vectors demonstrate geometry, not a trained embedding model.
vectors = {"refund": [1., 0.], "return money": [.9, .1], "shipping": [0., 1.]}
print(len(vectors['refund']))  # Expected: 2
print(cosine(vectors['refund'], vectors['return money']) > cosine(vectors['refund'], vectors['shipping']))  # Expected: True
```

</details>

### Simple exercise 2

Store model identity with a vector and reject a query vector from a different representation.

<details>
<summary>Reveal reference solution</summary>

```python
def compatible(a, b):
    if a["model"] != b["model"] or len(a["vector"]) != len(b["vector"]):
        raise ValueError("incompatible representation")
try: compatible({"model": "v1", "vector": [1, 0]}, {"model": "v2", "vector": [1, 0]})
except ValueError: print("same dimensions do not imply compatibility")
```

</details>

### Practical exercise

Store embeddings with their model version and source text.

<details>
<summary>Reveal reference solution</summary>

```python
def record(source_id, text, embed, model_version):
    vector = embed(text)
    return {"source_id": source_id, "text": text, "vector": vector, "model_version": model_version, "dimensions": len(vector)}
sample = record("d1", "refund policy", lambda text: [1., 0.], "fixture-v1")
print(sample['dimensions'], sample['model_version'])  # Expected values: 2; 'fixture-v1'
# Use one embedding provider/model/configuration for corpus and queries.
```

</details>

### Debugging exercise

Vectors from incompatible models are compared because their lengths match. Enforce representation compatibility.

<details>
<summary>Reveal reference solution</summary>

```python
def compare(query, document):
    identity = ("model", "revision", "dimensions")
    if any(query[k] != document[k] for k in identity): raise ValueError("re-embed using one representation")
    return True
q = {"model": "a", "revision": "1", "dimensions": 2}
try: compare(q, {**q, "model": "b"})
except ValueError: print("incompatible models rejected")
```

</details>

**Interview question:** Do equal vector dimensions imply compatible embedding spaces?

**Explain in your own words:** Explain embeddings and semantic representation in your own words. Use a concrete example to show why this is true: An embedding maps content to a numeric representation whose geometry supports similarity comparisons.

<a id="cosine"></a>

## Cosine similarity and vector normalization

Cosine compares direction rather than raw magnitude and requires nonzero norms.

**Why it matters:** The distance metric must match the index and representation.

**Prerequisites:** [Embeddings and semantic representation](week-7.md#embeddings), [Numeric conversion and precision](week-1.md#numbers)

**Difficulty:** Advanced · **Code concepts:** dot product, norm, cosine distance

[Official documentation](https://github.com/pgvector/pgvector) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Calculate cosine similarity for two small vectors by hand and code.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
print(abs(cosine([1, 0], [1, 1]) - 1 / sqrt(2)) < 1e-12)  # Expected: True
```

</details>

### Simple exercise 2

Compare parallel, perpendicular, and opposite vectors using cosine similarity.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
print(cosine([1, 0], [2, 0]))  # Expected: 1
print(cosine([1, 0], [0, 1]))  # Expected: 0
print(cosine([1, 0], [-1, 0]))  # Expected: -1
```

</details>

### Practical exercise

Verify a retrieval metric on a tiny inspectable dataset.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
docs = {"refund": [1, 0], "shipping": [0, 1]}
ranked = sorted(docs, key=lambda key: cosine([1, 0], docs[key]), reverse=True)
print(ranked)  # Expected: ["refund", "shipping"]
```

</details>

### Debugging exercise

A zero vector causes division by zero. Define and test the handling policy.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
try: cosine([0, 0], [1, 0])
except ValueError as error: print('zero vector' in str(error))  # Expected: True
# Explicit rejection keeps undefined values out of ranking.
```

</details>

**Interview question:** When are dot product and cosine rankings equivalent?

**Explain in your own words:** Explain cosine similarity and vector normalization in your own words. Use a concrete example to show why this is true: Cosine compares direction rather than raw magnitude and requires nonzero norms.

<a id="vector-search"></a>

## Vector search with pgvector

Vector search ranks stored embeddings by a chosen distance; exact and approximate methods have different tradeoffs.

**Why it matters:** Retrieval speed must be balanced with candidate recall.

**Prerequisites:** [Embeddings and semantic representation](week-7.md#embeddings), [Cosine similarity and vector normalization](week-7.md#cosine), [Retrieval metadata and tenant filtering](week-7.md#metadata)

**Difficulty:** Advanced · **Code concepts:** pgvector, distance operator, ORDER BY, LIMIT

[Official documentation](https://github.com/pgvector/pgvector) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Store a few vectors and retrieve nearest neighbors.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
docs = {"a": [1, 0], "b": [0, 1], "c": [.9, .1]}
ranked = sorted(docs, key=lambda key: cosine([1, 0], docs[key]), reverse=True)
print(ranked[:2])  # Expected: ["a", "c"]
```

</details>

### Simple exercise 2

Query the same tiny dataset with two explicit K values and inspect result ordering.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
docs = {"a": [1, 0], "b": [0, 1], "c": [.9, .1]}
def search(query, k): return sorted(docs, key=lambda key: cosine(query, docs[key]), reverse=True)[:k]
print(search([1, 0], 1), search([1, 0], 2))  # Expected values: ['a']; ['a', 'c']
```

</details>

### Practical exercise

Add semantic policy lookup to the assistant.

<details>
<summary>Reveal reference solution</summary>

```python
from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
def retrieve(query_vector, documents, tenant, k=3):
    allowed = [d for d in documents if d["tenant"] == tenant]
    return sorted(allowed, key=lambda d: cosine(query_vector, d["vector"]), reverse=True)[:k]
docs = [{"id": "policy", "tenant": "a", "vector": [1, 0]}]
print(retrieve([1, 0], docs, 'a')[0]['id'])  # Expected: "policy"
# Validate embedding model identity before search.
```

</details>

### Debugging exercise

A query sorts distance descending and returns the least similar documents. Verify ordering on known vectors.

<details>
<summary>Reveal reference solution</summary>

```python
distances = {"near": .1, "far": .9}
print(sorted(distances, key=distances.get)[0])  # Expected: "near"
# Distance: lower is better. Similarity: higher is better.
# pgvector cosine distance example: ORDER BY embedding <=> query ASC LIMIT k.
```

</details>

**Interview question:** What is lost when using approximate nearest-neighbor search?

**Explain in your own words:** Explain vector search with pgvector in your own words. Use a concrete example to show why this is true: Vector search ranks stored embeddings by a chosen distance; exact and approximate methods have different tradeoffs.

<a id="vector-indexes"></a>

## Approximate indexes and recall

Approximate indexes reduce search work at the possible cost of missed neighbors.

**Why it matters:** An index that is fast but misses evidence can degrade answers.

**Prerequisites:** [Vector search with pgvector](week-7.md#vector-search)

**Difficulty:** Advanced · **Code concepts:** HNSW, IVFFlat, recall, query plan

[Official documentation](https://github.com/pgvector/pgvector) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Compare exact and indexed search on a labeled sample.

<details>
<summary>Reveal reference solution</summary>

```python
exact = ["a", "b", "c"]; approximate = ["a", "d", "c"]
recall_at_3 = len(set(exact) & set(approximate)) / 3
print(recall_at_3)  # Expected: 2/3
# Capture actual indexed results from the same corpus/query before comparison.
```

</details>

### Simple exercise 2

Use exact search as a baseline and count indexed-search misses for several queries.

<details>
<summary>Reveal reference solution</summary>

```python
cases = [(["a", "b"], ["a", "c"]), (["c", "d"], ["c", "d"])]
misses = [len(set(exact) - set(indexed)) for exact, indexed in cases]
print(misses)  # Expected: [1, 0]
```

</details>

### Practical exercise

Measure latency and recall as index/search parameters change.

<details>
<summary>Reveal reference solution</summary>

```python
from time import perf_counter
def benchmark(search, queries, exact_results, k):
    elapsed, recalls = [], []
    for query, exact in zip(queries, exact_results):
        start = perf_counter(); result = search(query, k); elapsed.append(perf_counter()-start)
        recalls.append(len(set(result) & set(exact[:k])) / min(k, len(exact)) if exact else 1.)
    return {"mean_seconds": sum(elapsed)/len(elapsed), "mean_recall": sum(recalls)/len(recalls)}
# Run against real exact/ANN adapters while varying search parameters on fixed data.
```

</details>

### Debugging exercise

A selective metadata filter leaves too few ANN results. Compare with exact search and adjust retrieval strategy.

<details>
<summary>Reveal reference solution</summary>

```python
def retrieve(query, k, allowed, ann, exact):
    candidates = [key for key in ann(query, k*5) if key in allowed]
    if len(candidates) < k: return exact(query, allowed, k)
    return candidates[:k]
# Prefer database-side filtering with iterative scans when supported.
# This fallback demonstrates why post-filtered ANN may underfill top-k.
```

</details>

**Interview question:** How would you detect that an index is hurting recall?

**Explain in your own words:** Explain approximate indexes and recall in your own words. Use a concrete example to show why this is true: Approximate indexes reduce search work at the possible cost of missed neighbors.

<a id="full-text"></a>

## PostgreSQL full-text search

Full-text search matches normalized lexical terms using a configured text-search pipeline.

**Why it matters:** Exact identifiers and rare terms may need lexical evidence retrieval.

**Prerequisites:** [Document ingestion and parsing](week-7.md#ingestion), [Dictionary lookup and aggregation](week-1.md#dicts)

**Difficulty:** Advanced · **Code concepts:** tsvector, tsquery, text configuration, rank

[Official documentation](https://www.postgresql.org/docs/current/textsearch-intro.html) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Search a policy for a precise product or error identifier.

<details>
<summary>Reveal reference solution</summary>

```python
documents = {"d1": "Resolve E104 by renewing credentials", "d2": "Shipping policy"}
print([key for key, text in documents.items() if 'E104' in text.split()])  # Expected: ["d1"]
# Exact identifier fixture; production lexical search may require keyword fields.
```

</details>

### Simple exercise 2

Compare a phrase containing stopwords under two explicit text-search configurations.

<details>
<summary>Reveal reference solution</summary>

```python
# PostgreSQL SQL, run in psql against a local test database:
# SELECT to_tsvector('english', 'the return of a package'),
#        to_tsvector('simple', 'the return of a package');
# SELECT plainto_tsquery('english', 'the package'),
#        plainto_tsquery('simple', 'the package');
# English removes stopwords/stems; simple preserves more literal terms.
```

</details>

### Practical exercise

Add lexical retrieval over support documents.

<details>
<summary>Reveal reference solution</summary>

```python
# PostgreSQL adapter; db is a psycopg connection. Always parameterize values.
def lexical(db, tenant_id, query, limit=10):
    return db.execute("""SELECT id, text FROM documents
        WHERE tenant_id = %s AND to_tsvector('english', text) @@ plainto_tsquery('english', %s)
        ORDER BY ts_rank(to_tsvector('english', text), plainto_tsquery('english', %s)) DESC
        LIMIT %s""", (tenant_id, query, query, limit)).fetchall()
```

</details>

### Debugging exercise

The query and document use different text configurations and expected matches vanish. Align normalization.

<details>
<summary>Reveal reference solution</summary>

```python
# Use the same text-search configuration on both sides and in the index:
# CREATE INDEX documents_fts ON documents USING gin(to_tsvector('english', text));
# SELECT id FROM documents
# WHERE to_tsvector('english', text) @@ plainto_tsquery('english', 'running');
# Test known inflections and exact IDs; a mismatched 'simple' query may miss stems.
```

</details>

**Interview question:** What kinds of queries can lexical search handle better than embeddings?

**Explain in your own words:** Explain postgresql full-text search in your own words. Use a concrete example to show why this is true: Full-text search matches normalized lexical terms using a configured text-search pipeline.

<a id="hybrid"></a>

## Hybrid retrieval and rank fusion

Hybrid retrieval combines lexical and vector candidates, often using ranks rather than incomparable raw scores.

**Why it matters:** Combining signals can recover both semantic and exact-term matches.

**Prerequisites:** [Vector search with pgvector](week-7.md#vector-search), [PostgreSQL full-text search](week-7.md#full-text)

**Difficulty:** Advanced · **Code concepts:** candidate union, reciprocal rank fusion, deduplication

[Official documentation](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Fuse two ranked lists and deduplicate by document ID.

<details>
<summary>Reveal reference solution</summary>

```python
def fuse(rankings, constant=60):
    if constant < 0: raise ValueError("nonnegative constant required")
    scores = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(dict.fromkeys(ranking), 1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (constant + rank)
    return sorted(scores, key=lambda key: (-scores[key], key))
print(fuse([['a', 'b'], ['b', 'c']])[0])  # Expected: "b"
print(len(fuse([['a', 'a'], ['a']])))  # Expected: 1
```

</details>

### Simple exercise 2

Change the RRF rank constant on two toy result lists and inspect the merged ordering.

<details>
<summary>Reveal reference solution</summary>

```python
def fuse(rankings, constant=60):
    if constant < 0: raise ValueError("nonnegative constant required")
    scores = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(dict.fromkeys(ranking), 1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (constant + rank)
    return sorted(scores, key=lambda key: (-scores[key], key))
rankings = [["a", "b", "c"], ["c", "b", "d"]]
for constant in (0, 10, 60): print(constant, fuse(rankings, constant))
```

</details>

### Practical exercise

Implement hybrid policy retrieval and compare it with each baseline.

<details>
<summary>Reveal reference solution</summary>

```python
def fuse(rankings, constant=60):
    if constant < 0: raise ValueError("nonnegative constant required")
    scores = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(dict.fromkeys(ranking), 1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (constant + rank)
    return sorted(scores, key=lambda key: (-scores[key], key))
def hybrid(query, lexical, vector, k=3):
    return fuse([lexical(query), vector(query)])[:k]
lexical = lambda q: ["a", "b"]
vector = lambda q: ["b", "c"]
print(hybrid('policy', lexical, vector)[0])  # Expected: "b"
# Compare each baseline and fusion against the same relevance labels.
```

</details>

### Debugging exercise

Raw lexical and vector scores are summed despite different scales. Normalize or use rank fusion.

<details>
<summary>Reveal reference solution</summary>

```python
def fuse(rankings, constant=60):
    if constant < 0: raise ValueError("nonnegative constant required")
    scores = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(dict.fromkeys(ranking), 1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (constant + rank)
    return sorted(scores, key=lambda key: (-scores[key], key))
lexical = {"a": 100, "b": 5}; vector = {"a": .1, "b": .9}
rankings = [sorted(scores, key=scores.get, reverse=True) for scores in (lexical, vector)]
result = fuse(rankings)
print(set(result))  # Expected: {"a", "b"}
# Rank fusion avoids adding incomparable raw score scales.
```

</details>

**Interview question:** Why might rank fusion be safer than summing raw scores?

**Explain in your own words:** Explain hybrid retrieval and rank fusion in your own words. Use a concrete example to show why this is true: Hybrid retrieval combines lexical and vector candidates, often using ranks rather than incomparable raw scores.

<a id="basic-rag"></a>

## Basic RAG context construction

A basic RAG system retrieves evidence, assembles bounded context, and requests an answer grounded in it.

**Why it matters:** Separating retrieval and generation makes failures diagnosable.

**Prerequisites:** [Vector search with pgvector](week-7.md#vector-search), [Manual agent model-tool loop](week-5.md#agent-loop), [Retrieval metadata and tenant filtering](week-7.md#metadata)

**Difficulty:** Advanced · **Code concepts:** retrieval, context budget, source attribution

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Assemble a prompt from two retrieved passages and their IDs.

<details>
<summary>Reveal reference solution</summary>

```python
passages = [{"id": "d1", "text": "Receipt required."}, {"id": "d2", "text": "Return within 30 days."}]
context = "\n".join(f"[{p['id']}] {p['text']}" for p in passages)
prompt = f"Question: What is the return policy?\nEvidence (untrusted):\n{context}\nCite support or abstain."
print('[d1]' in prompt and '[d2]' in prompt)  # Expected: True
```

</details>

### Simple exercise 2

Remove the only supporting passage and verify that the answering behavior changes.

<details>
<summary>Reveal reference solution</summary>

```python
def answer(passages):
    evidence = next((p for p in passages if p["text"] == "Returns allowed within 30 days."), None)
    return {"answer": evidence["text"], "citation": evidence["id"]} if evidence else {"answer": "Insufficient evidence"}
print(answer([])['answer'])  # Expected: "Insufficient evidence"
print(answer([{'id': 'd1', 'text': 'Returns allowed within 30 days.'}])['citation'])  # Expected: "d1"
```

</details>

### Practical exercise

Answer policy questions using a manual retrieval-generation pipeline.

<details>
<summary>Reveal reference solution</summary>

```python
def rag(question, retrieve, generate):
    passages = retrieve(question)
    if not passages: return {"answer": None, "reason": "no_evidence"}
    result = generate(question, passages)
    allowed = {p["id"] for p in passages}
    if not set(result["citations"]) <= allowed: raise ValueError("unknown citation")
    return result
# Inject offline retrieval/generation fakes first. Citation membership alone
# does not prove factual support: add claim-level evaluation separately.
```

</details>

### Debugging exercise

Context truncation removes the relevant passage but keeps redundant text. Change selection and budgeting.

<details>
<summary>Reveal reference solution</summary>

```python
def select(passages, budget):
    selected = []; seen = set()
    for passage in sorted(passages, key=lambda p: p["relevance"], reverse=True):
        if passage["text"] in seen or len(passage["text"]) > budget: continue
        selected.append(passage); seen.add(passage["text"]); budget -= len(passage["text"])
    return selected
print(select([{'text': 'irrelevant long', 'relevance': 0}, {'text': 'key', 'relevance': 1}], 3)[0]['text'])  # Expected: "key"
# Use model token counts for production context budgeting.
```

</details>

**Interview question:** How would you separate a retrieval failure from a generation failure?

**Explain in your own words:** Explain basic rag context construction in your own words. Use a concrete example to show why this is true: A basic RAG system retrieves evidence, assembles bounded context, and requests an answer grounded in it.

<a id="reranking"></a>

## Reranking retrieved candidates

A reranker reorders an existing candidate set using a more focused relevance signal.

**Why it matters:** Better ordering helps allocate limited context to useful evidence.

**Prerequisites:** [Basic RAG context construction](week-7.md#basic-rag), [Hybrid retrieval and rank fusion](week-7.md#hybrid)

**Difficulty:** Advanced · **Code concepts:** candidate set, reranker, top K

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-information-retrieval) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Manually label relevance for five candidates and compare rank order.

<details>
<summary>Reveal reference solution</summary>

```python
candidates = ["a", "b", "c", "d", "e"]
labels = {"a": 0, "b": 2, "c": 1, "d": 0, "e": 3}
print(sorted(candidates, key=labels.get, reverse=True))  # Expected: ["e", "b", "c", "a", "d"]
```

</details>

### Simple exercise 2

Hold candidates fixed and compare the context selected before and after reranking.

<details>
<summary>Reveal reference solution</summary>

```python
candidates = ["a", "b", "c"]; scores = {"a": .1, "b": .9, "c": .5}
before = candidates[:2]; after = sorted(candidates, key=scores.get, reverse=True)[:2]
print(before, after)  # Expected values: ['a', 'b']; ['b', 'c']
```

</details>

### Practical exercise

Add an optional reranking stage to the RAG pipeline.

<details>
<summary>Reveal reference solution</summary>

```python
def retrieve(query, retriever, rerank=None, candidate_k=20, final_k=5):
    candidates = retriever(query, candidate_k)
    if rerank is not None: candidates = sorted(candidates, key=lambda d: rerank(query, d), reverse=True)
    return candidates[:final_k]
print(retrieve('q', lambda q, k: [1, 2], lambda q, d: d, final_k=1))  # Expected: [2]
# A real reranker scores query/document pairs; measure quality and latency.
```

</details>

### Debugging exercise

A relevant document never enters the candidate set and reranking cannot recover it. Increase candidate recall first.

<details>
<summary>Reveal reference solution</summary>

```python
candidates = {"a", "b"}; relevant = {"c"}
print(not candidates & relevant)  # Expected: True
expanded = candidates | {"c"}
print(expanded & relevant)  # Expected: True
# Reranking only reorders candidates. Improve first-stage recall or filters
# before tuning reranker scores when relevant documents never enter the pool.
```

</details>

**Interview question:** Why can reranking not fix missing candidate documents?

**Explain in your own words:** Explain reranking retrieved candidates in your own words. Use a concrete example to show why this is true: A reranker reorders an existing candidate set using a more focused relevance signal.

<a id="query-rewriting"></a>

## Query rewriting and retrieval intent

A rewritten query can resolve context or add useful terms, but must preserve the user's intent.

**Why it matters:** A fluent rewrite can silently change what evidence is sought.

**Prerequisites:** [Basic RAG context construction](week-7.md#basic-rag), [Agent streaming and message history](week-5.md#streaming-history)

**Difficulty:** Advanced · **Code concepts:** query rewrite, original query, retrieval comparison

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-information-retrieval) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Rewrite an ambiguous follow-up using explicit conversation context.

<details>
<summary>Reveal reference solution</summary>

```python
context = {"product": "Widget", "topic": "returns"}
original = "How long do I have?"
rewritten = f"What is the {context['product']} {context['topic']} time limit?"
print(rewritten)  # Expected: "What is the Widget returns time limit?"
```

</details>

### Simple exercise 2

Keep both the original and rewritten query in a trace and identify unsupported added details.

<details>
<summary>Reveal reference solution</summary>

```python
trace = {"original": "How long?", "rewrite": "Widget Pro return time limit", "known_products": {"Widget"}}
print('Pro' in trace['rewrite'])  # Expected: True  # Unsupported qualifier: reject this rewrite.
trace["rewrite"] = "Widget return time limit"
```

</details>

### Practical exercise

Compare original and rewritten query retrieval on policy questions.

<details>
<summary>Reveal reference solution</summary>

```python
def compare(original, rewritten, retrieve, relevant):
    results = {"original": retrieve(original), "rewritten": retrieve(rewritten)}
    return {kind: len(set(ids) & relevant)/len(relevant) for kind, ids in results.items()}
scores = compare("How long?", "Widget returns", lambda q: ["d1"] if "Widget" in q else [], {"d1"})
print(scores)  # Expected: {"original": 0, "rewritten": 1}
```

</details>

### Debugging exercise

A rewrite adds an unsupported product name and retrieves irrelevant policies. Constrain and evaluate rewrites.

<details>
<summary>Reveal reference solution</summary>

```python
def rewrite(original, known_product, proposed_product):
    if proposed_product != known_product: return original
    return f"{known_product}: {original}"
print(rewrite('return deadline?', 'Widget', 'Other'))  # Expected: "return deadline?"
# Preserve original query and provenance. Evaluate rewrites against fixed relevance judgments.
```

</details>

**Interview question:** How would you detect query drift?

**Explain in your own words:** Explain query rewriting and retrieval intent in your own words. Use a concrete example to show why this is true: A rewritten query can resolve context or add useful terms, but must preserve the user's intent.

<a id="citations"></a>

## Grounding, citations, and abstention

Claims should map to retrieved evidence; absence of support should allow an explicit non-answer.

**Why it matters:** A plausible answer with irrelevant citations is still unreliable.

**Prerequisites:** [Basic RAG context construction](week-7.md#basic-rag)

**Difficulty:** Advanced · **Code concepts:** source ID, evidence span, abstention

[Official documentation](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-prompt-engineering) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Attach each factual sentence to a supporting passage.

<details>
<summary>Reveal reference solution</summary>

```python
claims = [{"text": "A receipt is required.", "source_id": "d1"},
          {"text": "The window is 30 days.", "source_id": "d2"}]
support = {"d1": "Receipt required.", "d2": "Return within 30 days."}
print(all((c['source_id'] in support for c in claims)))  # Expected: True
# Human check: each linked passage entails its exact claim.
```

</details>

### Simple exercise 2

Write one supported claim and one unsupported claim against the same retrieved passage.

<details>
<summary>Reveal reference solution</summary>

```python
passage = "Returns require a receipt."
claims = {"A receipt is required.": True, "Shipping is always free.": False}
print(claims['Shipping is always free.'] is False)  # Expected: True
# Source presence does not imply support for every statement.
```

</details>

### Practical exercise

Return cited policy answers and abstain on unsupported questions.

<details>
<summary>Reveal reference solution</summary>

```python
def answer(question, supported_claims):
    claims = supported_claims.get(question, [])
    if not claims: return {"status": "abstained", "claims": []}
    return {"status": "answered", "claims": claims}
print(answer('unknown', {})['status'])  # Expected: "abstained"
print(answer('receipt?', {'receipt?': [{'text': 'Required', 'source_id': 'd1'}]})['claims'][0]['source_id'])  # Expected: "d1"
```

</details>

### Debugging exercise

A citation names a retrieved document that does not support the claim. Validate claim-level support.

<details>
<summary>Reveal reference solution</summary>

```python
def validate(claims, sources, supports):
    return all(c["source_id"] in sources and supports(c["text"], sources[c["source_id"]]) for c in claims)
# Deterministic fixture stands in for human/entailment judgments.
print(not validate([{'text': 'Free shipping', 'source_id': 'd1'}], {'d1': 'Receipt required'}, lambda claim, source: claim in source))  # Expected: True
```

</details>

**Interview question:** What is the difference between having citations and being grounded?

**Explain in your own words:** Explain grounding, citations, and abstention in your own words. Use a concrete example to show why this is true: Claims should map to retrieved evidence; absence of support should allow an explicit non-answer.

<a id="retrieval-eval"></a>

## Retrieval precision, recall, and top K

A labeled query set measures whether retrieval returns relevant evidence at a chosen cutoff.

**Why it matters:** Comparisons require fixed questions and relevance judgments.

**Prerequisites:** [Reranking retrieved candidates](week-7.md#reranking), [Grounding, citations, and abstention](week-7.md#citations)

**Difficulty:** Advanced · **Code concepts:** precision@K, recall@K, relevance labels

[Official documentation](https://ai.pydantic.dev/evals/) · [Additional reading](https://www.postgresql.org/docs/current/textsearch-intro.html)

### Simple exercise 1

Calculate precision and recall for a small labeled result list.

<details>
<summary>Reveal reference solution</summary>

```python
relevant = {"a", "b", "c"}; retrieved = ["a", "d"]
hits = len(set(retrieved) & relevant)
assert hits/len(retrieved) == .5 and hits/len(relevant) == 1/3
```

</details>

### Simple exercise 2

Increase K on a fixed result list and calculate the new precision and recall.

<details>
<summary>Reveal reference solution</summary>

```python
ranked = ["a", "d", "b"]; relevant = {"a", "b"}
for k in (1, 2, 3):
    result = ranked[:k]; hits = len(set(result) & relevant)
    print(k, "precision", hits/len(result), "recall", hits/len(relevant))
```

</details>

### Practical exercise

Compare chunk sizes, hybrid search, and reranking on one test set.

<details>
<summary>Reveal reference solution</summary>

```python
def evaluate(search, cases, k=3):
    values = []
    for query, relevant in cases:
        ids = search(query)[:k]; hits = len(set(ids) & relevant)
        values.append({"precision": hits/len(ids) if ids else 0, "recall": hits/len(relevant) if relevant else 1})
    return values
cases = [("returns", {"d1"})]
assert evaluate(lambda q: ["d1", "d2"], cases)[0]["precision"] == .5
# Freeze cases for all chunking, hybrid and reranking variants.
```

</details>

### Debugging exercise

An evaluation labels only retrieved documents, hiding missed relevant items. Improve relevance judgments.

<details>
<summary>Reveal reference solution</summary>

```python
corpus_relevant = {"a", "b", "c"}; retrieved = {"a"}
assert len(retrieved & corpus_relevant) / len(corpus_relevant) == 1/3
# Labeling only retrieved 'a' would falsely yield recall=1.
# Pool candidates from multiple systems and independently judge missed corpus items.
```

</details>

**Interview question:** How can increasing K affect precision, recall, and context cost?

**Explain in your own words:** Explain retrieval precision, recall, and top k in your own words. Use a concrete example to show why this is true: A labeled query set measures whether retrieval returns relevant evidence at a chosen cutoff.

