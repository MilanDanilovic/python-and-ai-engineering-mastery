# Learning a topic, not navigating a manual

Every one of the 152 milestones has a guided reading section and an independent teaching example. These examples are separate from the 608 exercise solutions.

1. Read the short concept explanation and why it matters.
2. Open **Read this section**. The link targets the relevant heading or API entry. The instruction below it tells you what to look for, rather than asking you to read the entire manual.
3. Study **Learn with an example**. Read the walkthrough, predict the output, then compare it with the expected output. Use the editor's Copy button to experiment in Playground or local Python.
4. Read the common trap and try **Change one thing**. Explain why the changed program behaves differently.
5. Use **Jump to questions** for the independent exercises. Teaching examples do not complete exercises or record solution assistance.

The same guides appear in Daily Session concept review. New Documentation Practice tasks ask a topic-specific question and require an example supported by the exact linked section. Existing session answers and progress are preserved.

## What the examples establish

**Worked example** means the displayed Python demonstrates the behavior directly. **Concept model** means the example deliberately isolates a mechanism, such as rank fusion, capability checking or workflow history, without pretending to implement an entire server, agent framework or durable system. Its walkthrough states the missing production guarantees; the reading and practical exercises take the idea further.

The runtime label distinguishes browser-compatible examples from local ones. Select Pydantic in Playground before running a Pydantic example. FastAPI, native threads, process pools and the real Pydantic AI Agent example run locally. The Agent example uses FunctionModel and makes no model API calls. Save process-pool examples to a file with their main guard intact.

Async browser examples use top-level `await`. In a local script, put that code inside `async def main():` and call `asyncio.run(main())`. Do not call `asyncio.run` inside the browser's existing event loop.

## Sources and maintenance

The curriculum points to primary documentation: Python, PyPA, pytest, FastAPI, Pydantic, Pydantic AI, MCP, W3C, Sentence Transformers, pgvector, PostgreSQL, Elastic, Microsoft architecture guidance, DBOS and OpenTelemetry. Teaching prose and small examples are authored for this curriculum. Related reading targets a relevant foundational section rather than an unrelated manual homepage.

- `src/learning-guides/reading.js`: section URLs, human-readable titles and reading objectives.
- `src/learning-guides/week1.js` through `week8.js`: independent examples, outputs, walkthroughs, pitfalls and experiments.
- `src/learning-guides/index.js`: runtime/package requirements and concept-model labels.
- [Latest link audit](documentation-link-audit.json): timestamp, requested URL, resolved URL and validation result for all 152 sections. A successful HTTP response alone is insufficient: the target fragment must exist too.

Run the checks with Python 3.12 and Node 22+:

```sh
python -m pip install -r docs/requirements-learning.txt
npm test
npm run test:guides
npm run check:docs
node scripts/check-documentation.mjs --record
npm run docs:curriculum
```

The example check executes all 152 snippets in isolated processes and compares stdout with the displayed expected output, including async examples. CI runs that check and verifies generated tutorial pages. Network link checks are explicit maintainer commands, because external documentation can be temporarily unavailable. Run them when changing links and periodically afterward; an audit describes the date checked, not a guarantee that external sites never change.
