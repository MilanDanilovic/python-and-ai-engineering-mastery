const cosine = `from math import sqrt
def cosine(a, b):
    if len(a) != len(b): raise ValueError("dimension mismatch")
    norm = sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    if norm == 0: raise ValueError("zero vector has undefined cosine")
    return sum(x*y for x, y in zip(a, b)) / norm
`;
const rrf = `def fuse(rankings, constant=60):
    if constant < 0: raise ValueError("nonnegative constant required")
    scores = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(dict.fromkeys(ranking), 1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (constant + rank)
    return sorted(scores, key=lambda key: (-scores[key], key))
`;
export default {
ingestion: [
`sources = [("d1", "First policy"), ("d2", "Second policy")]
documents = [{"source_id": key, "text": text.strip()} for key, text in sources]
assert [d["source_id"] for d in documents] == ["d1", "d2"]`,
`from hashlib import sha256
versions = {}
def ingest(key, text):
    digest = sha256(text.encode()).hexdigest()
    changed = versions.get(key) != digest; versions[key] = digest; return changed
assert ingest("d1", "v1") and not ingest("d1", "v1") and ingest("d1", "v2")`,
`from hashlib import sha256
from datetime import datetime, timezone
documents = {}
def ingest(source_id, text):
    version = sha256(text.encode()).hexdigest()
    old = documents.get(source_id)
    if old and old["version"] == version: return old
    record = {"source_id": source_id, "version": version, "text": text,
              "ingested_at": datetime.now(timezone.utc).isoformat()}
    documents[source_id] = record; return record
assert ingest("d1", "policy") == ingest("d1", "policy")`,
`documents = {}
def upsert(source_id, version, text):
    documents[source_id] = {"version": version, "text": text}
upsert("d1", 1, "old"); upsert("d1", 2, "new"); upsert("d1", 2, "new")
assert len(documents) == 1 and documents["d1"]["text"] == "new"
# In storage, transact the version update and obsolete-chunk replacement.`],
chunking: [
`def chunks(text, size, overlap):
    if not 0 <= overlap < size: raise ValueError("invalid overlap")
    return [text[start:start+size] for start in range(0, len(text), size-overlap)]
assert chunks("abcdef", 3, 0) == ["abc", "def"]
assert chunks("abcdef", 3, 1) == ["abc", "cde", "ef"]`,
`text = "# Refunds\\nReceipt required.\\n# Shipping\\nTrack parcel."
fixed = [text[n:n+20] for n in range(0, len(text), 20)]
headings = ["# " + part for part in text.split("# ") if part]
assert len(headings) == 2 and "Receipt" in headings[0]
print(fixed, headings)  # Fixed slices may split a section's meaning.`,
`def split_sections(text):
    chunks = []; heading = ""; offset = 0
    for line in text.splitlines(keepends=True):
        if line.startswith("# "): heading = line.strip()[2:]
        elif line.strip(): chunks.append({"heading": heading, "start": offset, "end": offset+len(line), "text": line})
        offset += len(line)
    return chunks
text = "# Policy\\nReceipt required.\\n"
chunk = split_sections(text)[0]
assert text[chunk["start"]:chunk["end"]] == chunk["text"]`,
`def chunks(text, size, overlap):
    if size <= 0 or not 0 <= overlap < size: raise ValueError("positive stride required")
    for start in range(0, len(text), size-overlap): yield text[start:start+size]
try: list(chunks("abc", 3, 3))
except ValueError: print("non-advancing loop prevented")`],
metadata: [
`chunk = {"id": "d1:1:0", "text": "policy", "customer_id": "c1", "document_id": "d1", "version": 1}
assert chunk["customer_id"] == "c1" and chunk["version"] == 1`,
`chunks = [{"doc": "d1", "version": 1}, {"doc": "d1", "version": 2}]
active = {"d1": 2}
assert [c for c in chunks if c["version"] == active[c["doc"]]] == [{"doc": "d1", "version": 2}]`,
`def retrieve(auth, documents):
    # Apply this predicate in the database query before ranking/top-k.
    return [d for d in documents if d["tenant_id"] == auth["tenant_id"]]
docs = [{"tenant_id": "a", "id": "d1"}, {"tenant_id": "b", "id": "d2"}]
assert [d["id"] for d in retrieve({"tenant_id": "a"}, docs)] == ["d1"]`,
`def context(auth, candidates):
    authorized = [d for d in candidates if d["tenant"] == auth["tenant"]]
    return "\\n".join(d["text"] for d in authorized)
assert context({"tenant": "a"}, [{"tenant": "b", "text": "private"}]) == ""
# Enforce this in retrieval too; hiding results in the UI is too late.`],
embeddings: [
cosine+`# Handcrafted vectors demonstrate geometry, not a trained embedding model.
vectors = {"refund": [1., 0.], "return money": [.9, .1], "shipping": [0., 1.]}
assert len(vectors["refund"]) == 2
assert cosine(vectors["refund"], vectors["return money"]) > cosine(vectors["refund"], vectors["shipping"])`,
`def compatible(a, b):
    if a["model"] != b["model"] or len(a["vector"]) != len(b["vector"]):
        raise ValueError("incompatible representation")
try: compatible({"model": "v1", "vector": [1, 0]}, {"model": "v2", "vector": [1, 0]})
except ValueError: print("same dimensions do not imply compatibility")`,
`def record(source_id, text, embed, model_version):
    vector = embed(text)
    return {"source_id": source_id, "text": text, "vector": vector, "model_version": model_version, "dimensions": len(vector)}
sample = record("d1", "refund policy", lambda text: [1., 0.], "fixture-v1")
assert sample["dimensions"] == 2 and sample["model_version"] == "fixture-v1"
# Use one embedding provider/model/configuration for corpus and queries.`,
`def compare(query, document):
    identity = ("model", "revision", "dimensions")
    if any(query[k] != document[k] for k in identity): raise ValueError("re-embed using one representation")
    return True
q = {"model": "a", "revision": "1", "dimensions": 2}
try: compare(q, {**q, "model": "b"})
except ValueError: print("incompatible models rejected")`],
cosine: [
cosine+`assert abs(cosine([1, 0], [1, 1]) - 1 / sqrt(2)) < 1e-12`,
cosine+`assert cosine([1, 0], [2, 0]) == 1
assert cosine([1, 0], [0, 1]) == 0
assert cosine([1, 0], [-1, 0]) == -1`,
cosine+`docs = {"refund": [1, 0], "shipping": [0, 1]}
ranked = sorted(docs, key=lambda key: cosine([1, 0], docs[key]), reverse=True)
assert ranked == ["refund", "shipping"]`,
cosine+`try: cosine([0, 0], [1, 0])
except ValueError as error: assert "zero vector" in str(error)
# Explicit rejection keeps undefined values out of ranking.`],
'vector-search': [
cosine+`docs = {"a": [1, 0], "b": [0, 1], "c": [.9, .1]}
ranked = sorted(docs, key=lambda key: cosine([1, 0], docs[key]), reverse=True)
assert ranked[:2] == ["a", "c"]`,
cosine+`docs = {"a": [1, 0], "b": [0, 1], "c": [.9, .1]}
def search(query, k): return sorted(docs, key=lambda key: cosine(query, docs[key]), reverse=True)[:k]
assert search([1, 0], 1) == ["a"] and search([1, 0], 2) == ["a", "c"]`,
cosine+`def retrieve(query_vector, documents, tenant, k=3):
    allowed = [d for d in documents if d["tenant"] == tenant]
    return sorted(allowed, key=lambda d: cosine(query_vector, d["vector"]), reverse=True)[:k]
docs = [{"id": "policy", "tenant": "a", "vector": [1, 0]}]
assert retrieve([1, 0], docs, "a")[0]["id"] == "policy"
# Validate embedding model identity before search.`,
`distances = {"near": .1, "far": .9}
assert sorted(distances, key=distances.get)[0] == "near"
# Distance: lower is better. Similarity: higher is better.
# pgvector cosine distance example: ORDER BY embedding <=> query ASC LIMIT k.`],
'vector-indexes': [
`exact = ["a", "b", "c"]; approximate = ["a", "d", "c"]
recall_at_3 = len(set(exact) & set(approximate)) / 3
assert recall_at_3 == 2/3
# Capture actual indexed results from the same corpus/query before comparison.`,
`cases = [(["a", "b"], ["a", "c"]), (["c", "d"], ["c", "d"])]
misses = [len(set(exact) - set(indexed)) for exact, indexed in cases]
assert misses == [1, 0]`,
`from time import perf_counter
def benchmark(search, queries, exact_results, k):
    elapsed, recalls = [], []
    for query, exact in zip(queries, exact_results):
        start = perf_counter(); result = search(query, k); elapsed.append(perf_counter()-start)
        recalls.append(len(set(result) & set(exact[:k])) / min(k, len(exact)) if exact else 1.)
    return {"mean_seconds": sum(elapsed)/len(elapsed), "mean_recall": sum(recalls)/len(recalls)}
# Run against real exact/ANN adapters while varying search parameters on fixed data.`,
`def retrieve(query, k, allowed, ann, exact):
    candidates = [key for key in ann(query, k*5) if key in allowed]
    if len(candidates) < k: return exact(query, allowed, k)
    return candidates[:k]
# Prefer database-side filtering with iterative scans when supported.
# This fallback demonstrates why post-filtered ANN may underfill top-k.`],
'full-text': [
`documents = {"d1": "Resolve E104 by renewing credentials", "d2": "Shipping policy"}
assert [key for key, text in documents.items() if "E104" in text.split()] == ["d1"]
# Exact identifier fixture; production lexical search may require keyword fields.`,
`# PostgreSQL SQL, run in psql against a local test database:
# SELECT to_tsvector('english', 'the return of a package'),
#        to_tsvector('simple', 'the return of a package');
# SELECT plainto_tsquery('english', 'the package'),
#        plainto_tsquery('simple', 'the package');
# English removes stopwords/stems; simple preserves more literal terms.`,
`# PostgreSQL adapter; db is a psycopg connection. Always parameterize values.
def lexical(db, tenant_id, query, limit=10):
    return db.execute("""SELECT id, text FROM documents
        WHERE tenant_id = %s AND to_tsvector('english', text) @@ plainto_tsquery('english', %s)
        ORDER BY ts_rank(to_tsvector('english', text), plainto_tsquery('english', %s)) DESC
        LIMIT %s""", (tenant_id, query, query, limit)).fetchall()`,
`# Use the same text-search configuration on both sides and in the index:
# CREATE INDEX documents_fts ON documents USING gin(to_tsvector('english', text));
# SELECT id FROM documents
# WHERE to_tsvector('english', text) @@ plainto_tsquery('english', 'running');
# Test known inflections and exact IDs; a mismatched 'simple' query may miss stems.`],
hybrid: [
rrf+`assert fuse([["a", "b"], ["b", "c"]])[0] == "b"
assert len(fuse([["a", "a"], ["a"]])) == 1`,
rrf+`rankings = [["a", "b", "c"], ["c", "b", "d"]]
for constant in (0, 10, 60): print(constant, fuse(rankings, constant))`,
rrf+`def hybrid(query, lexical, vector, k=3):
    return fuse([lexical(query), vector(query)])[:k]
lexical = lambda q: ["a", "b"]
vector = lambda q: ["b", "c"]
assert hybrid("policy", lexical, vector)[0] == "b"
# Compare each baseline and fusion against the same relevance labels.`,
rrf+`lexical = {"a": 100, "b": 5}; vector = {"a": .1, "b": .9}
rankings = [sorted(scores, key=scores.get, reverse=True) for scores in (lexical, vector)]
result = fuse(rankings)
assert set(result) == {"a", "b"}
# Rank fusion avoids adding incomparable raw score scales.`],
'basic-rag': [
`passages = [{"id": "d1", "text": "Receipt required."}, {"id": "d2", "text": "Return within 30 days."}]
context = "\\n".join(f"[{p['id']}] {p['text']}" for p in passages)
prompt = f"Question: What is the return policy?\\nEvidence (untrusted):\\n{context}\\nCite support or abstain."
assert "[d1]" in prompt and "[d2]" in prompt`,
`def answer(passages):
    evidence = next((p for p in passages if p["text"] == "Returns allowed within 30 days."), None)
    return {"answer": evidence["text"], "citation": evidence["id"]} if evidence else {"answer": "Insufficient evidence"}
assert answer([])["answer"] == "Insufficient evidence"
assert answer([{"id": "d1", "text": "Returns allowed within 30 days."}])["citation"] == "d1"`,
`def rag(question, retrieve, generate):
    passages = retrieve(question)
    if not passages: return {"answer": None, "reason": "no_evidence"}
    result = generate(question, passages)
    allowed = {p["id"] for p in passages}
    if not set(result["citations"]) <= allowed: raise ValueError("unknown citation")
    return result
# Inject offline retrieval/generation fakes first. Citation membership alone
# does not prove factual support: add claim-level evaluation separately.`,
`def select(passages, budget):
    selected = []; seen = set()
    for passage in sorted(passages, key=lambda p: p["relevance"], reverse=True):
        if passage["text"] in seen or len(passage["text"]) > budget: continue
        selected.append(passage); seen.add(passage["text"]); budget -= len(passage["text"])
    return selected
assert select([{"text": "irrelevant long", "relevance": 0}, {"text": "key", "relevance": 1}], 3)[0]["text"] == "key"
# Use model token counts for production context budgeting.`],
reranking: [
`candidates = ["a", "b", "c", "d", "e"]
labels = {"a": 0, "b": 2, "c": 1, "d": 0, "e": 3}
assert sorted(candidates, key=labels.get, reverse=True) == ["e", "b", "c", "a", "d"]`,
`candidates = ["a", "b", "c"]; scores = {"a": .1, "b": .9, "c": .5}
before = candidates[:2]; after = sorted(candidates, key=scores.get, reverse=True)[:2]
assert before == ["a", "b"] and after == ["b", "c"]`,
`def retrieve(query, retriever, rerank=None, candidate_k=20, final_k=5):
    candidates = retriever(query, candidate_k)
    if rerank is not None: candidates = sorted(candidates, key=lambda d: rerank(query, d), reverse=True)
    return candidates[:final_k]
assert retrieve("q", lambda q, k: [1, 2], lambda q, d: d, final_k=1) == [2]
# A real reranker scores query/document pairs; measure quality and latency.`,
`candidates = {"a", "b"}; relevant = {"c"}
assert not candidates & relevant
expanded = candidates | {"c"}
assert expanded & relevant
# Reranking only reorders candidates. Improve first-stage recall or filters
# before tuning reranker scores when relevant documents never enter the pool.`],
'query-rewriting': [
`context = {"product": "Widget", "topic": "returns"}
original = "How long do I have?"
rewritten = f"What is the {context['product']} {context['topic']} time limit?"
assert rewritten == "What is the Widget returns time limit?"`,
`trace = {"original": "How long?", "rewrite": "Widget Pro return time limit", "known_products": {"Widget"}}
assert "Pro" in trace["rewrite"]  # Unsupported qualifier: reject this rewrite.
trace["rewrite"] = "Widget return time limit"`,
`def compare(original, rewritten, retrieve, relevant):
    results = {"original": retrieve(original), "rewritten": retrieve(rewritten)}
    return {kind: len(set(ids) & relevant)/len(relevant) for kind, ids in results.items()}
scores = compare("How long?", "Widget returns", lambda q: ["d1"] if "Widget" in q else [], {"d1"})
assert scores == {"original": 0, "rewritten": 1}`, 
`def rewrite(original, known_product, proposed_product):
    if proposed_product != known_product: return original
    return f"{known_product}: {original}"
assert rewrite("return deadline?", "Widget", "Other") == "return deadline?"
# Preserve original query and provenance. Evaluate rewrites against fixed relevance judgments.`],
citations: [
`claims = [{"text": "A receipt is required.", "source_id": "d1"},
          {"text": "The window is 30 days.", "source_id": "d2"}]
support = {"d1": "Receipt required.", "d2": "Return within 30 days."}
assert all(c["source_id"] in support for c in claims)
# Human check: each linked passage entails its exact claim.`,
`passage = "Returns require a receipt."
claims = {"A receipt is required.": True, "Shipping is always free.": False}
assert claims["Shipping is always free."] is False
# Source presence does not imply support for every statement.`,
`def answer(question, supported_claims):
    claims = supported_claims.get(question, [])
    if not claims: return {"status": "abstained", "claims": []}
    return {"status": "answered", "claims": claims}
assert answer("unknown", {})["status"] == "abstained"
assert answer("receipt?", {"receipt?": [{"text": "Required", "source_id": "d1"} ]})["claims"][0]["source_id"] == "d1"`,
`def validate(claims, sources, supports):
    return all(c["source_id"] in sources and supports(c["text"], sources[c["source_id"]]) for c in claims)
# Deterministic fixture stands in for human/entailment judgments.
assert not validate([{"text": "Free shipping", "source_id": "d1"}], {"d1": "Receipt required"}, lambda claim, source: claim in source)`],
'retrieval-eval': [
`relevant = {"a", "b", "c"}; retrieved = ["a", "d"]
hits = len(set(retrieved) & relevant)
assert hits/len(retrieved) == .5 and hits/len(relevant) == 1/3`,
`ranked = ["a", "d", "b"]; relevant = {"a", "b"}
for k in (1, 2, 3):
    result = ranked[:k]; hits = len(set(result) & relevant)
    print(k, "precision", hits/len(result), "recall", hits/len(relevant))`,
`def evaluate(search, cases, k=3):
    values = []
    for query, relevant in cases:
        ids = search(query)[:k]; hits = len(set(ids) & relevant)
        values.append({"precision": hits/len(ids) if ids else 0, "recall": hits/len(relevant) if relevant else 1})
    return values
cases = [("returns", {"d1"})]
assert evaluate(lambda q: ["d1", "d2"], cases)[0]["precision"] == .5
# Freeze cases for all chunking, hybrid and reranking variants.`,
`corpus_relevant = {"a", "b", "c"}; retrieved = {"a"}
assert len(retrieved & corpus_relevant) / len(corpus_relevant) == 1/3
# Labeling only retrieved 'a' would falsely yield recall=1.
# Pool candidates from multiple systems and independently judge missed corpus items.`]
};
