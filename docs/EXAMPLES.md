# Running the worked examples

Use Python 3.11 or newer (3.12 is used in CI). Save a snippet as `example.py` and run `python example.py`. The browser editor highlights and saves code, and Pyodide executes compatible examples in a worker. Browser async code should use top-level await instead of asyncio.run. Use local Python for servers, database clients, native processes, and multi-file projects.

Each milestone has four independent references matching its original prompts. Some tasks ask for designs, shell commands, SQL, traces, or investigation procedures. Their answers are annotated reference approaches, not claims of a complete production implementation. Intentional failures are identified in comments. Process-pool examples must run from a file, not a REPL or `python -c`.

## Dependencies

Create a separate Python environment for exercises:

```sh
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
python -m pip install pytest pydantic fastapi httpx
```

Pydantic examples target v2. Agent examples additionally require `pydantic-ai` and use `TestModel` for offline demonstrations. A test model exercises contracts; it does not evaluate real model reasoning. MCP examples use the SDK v2 `MCPServer` API: check the milestone's official documentation against the version installed in your environment.

DBOS snippets belong inside a configured DBOS application: initialize its system database, register workflow/step functions, and launch the runtime before invoking them. Follow the linked official DBOS setup guide. PostgreSQL, asyncpg, and pgvector exercises need their corresponding database/extension and schemas. Adapter sketches explicitly identify injected dependencies. Handcrafted vectors illustrate geometry; they are not trained semantic embeddings.

Reference solutions may differ from your implementation. Compare contracts, edge cases, ownership, authorization, failure behavior, and tests—not just spelling. Confidence and daily exercise outcomes remain self-verified.

## Maintainer checks

```sh
npm test
npm run test:examples
```

The first command checks solution coverage and parses all 608 roadmap snippets. The second runs the stdlib-only examples in separate temporary files with time limits. Examples requiring third-party libraries, services, interactive debugging, or multi-file setup are not integration-tested by that command. Use `PYTHON` to select a Python 3.11+ executable; Windows otherwise uses `py -3.12`.

Tutorial Markdown is generated from the curriculum and solution files with `npm run docs:curriculum`. Edit the source files, then regenerate the tutorial.
