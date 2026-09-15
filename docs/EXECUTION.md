# Browser Python execution

`PythonCodeRunner` is the shared interface for lessons, daily tasks, the Coding Lab, and Playground. It receives an exercise definition, saved state, change/result callbacks, and an optional execution-provider factory. Exercises do not import Pyodide internals.

`ExecutionProvider` defines `execute(code, options)`, `reset()`, and `dispose()`. `PyodideExecutionProvider` uses a module Web Worker. Remote and Docker providers are future extensions, not implemented endpoints. There is no server-side arbitrary code execution.

## Runtime lifecycle

Monaco and its Python language support load when an editor is opened. Pyodide 314.0.7 is fetched from the pinned official jsDelivr distribution only when code runs. Optional NumPy, Pandas, or Pydantic packages load only when requested by exercise configuration. Initial download requires internet access and may take longer than execution.

The provider allows 90 seconds for preparation, then starts the exercise's execution timer (5 seconds by default, configurable up to 60). The main thread terminates the worker on timeout or Stop. Each subsequent attempt creates a new worker and fresh environment; browser HTTP caching avoids repeated downloads where available. Leaving the runner disposes its worker. No Python code runs on the React UI thread.

Output is capped at 32,000 characters per stream. Python tracebacks are returned as text; hidden test code, output, and traceback details are not displayed. A worker provides execution isolation from the UI, **not a security boundary against hostile code within its browser origin**. This is a personal practice environment. Do not treat browser test results as trusted certification or execute pasted code containing secrets.

## Exercise contracts

The data in `src/execution/exercises.js` declares stable IDs, titles, descriptions, topic IDs, difficulty, type, starter code, visible tests, hidden tests, hints, reference solution, explanation, common mistakes, package requirements, timeout, and learning objectives. Add exercises as data instead of adding exercise-specific page logic.

The initial library contains 24 executable exercises, including nine prediction experiments. All 608 roadmap exercises have authored reference answers and a code runner for browser-compatible experiments; open-ended/server-based roadmap tasks do not automatically acquire a graded test suite. Their Run Tests button explicitly indicates that no suite is available. FastAPI servers, PostgreSQL/pgvector, MCP servers, DBOS, native processes, and real multi-service systems still require the documented local environment.

Run Tests executes student code, then each visible and hidden case separately, with a fresh namespace and a fresh execution of the student's program per case. Hidden cases return only names, pass/fail status, and authored feedback. They ship to the client and can be inspected in developer tools: “hidden” means withheld from the learning interface, not secret from the browser owner. The runner uses Pyodide's Python execution API; it does not use JavaScript eval or a server-side exec endpoint.

Async examples use top-level `await` in the already-running browser event loop. Runtime typing experiments do not replace a static checker. An input prompt is unsupported; provide inputs directly in code. Individual tests must raise on failure, usually with `assert`; false expressions alone are not test failures.

## Progress

Running a program never completes a graded exercise. Completion requires all required tests to pass, or a committed prediction to match actual output. Attempts, latest/best test counts, duration, failures, hint use, revealed solutions, AI assistance, confidence, and repeatability are saved by exercise ID. Resetting code retains this history.

Revealing an answer records assistance immediately; it does not fabricate a passing result. A successful unassisted attempt plus confidence and repeatability can raise mastery to “Can Use Independently”; assisted completion records practice. Full mastery remains an explicit assessment. Reflection feeds the existing revision scheduler. Repeated failed tests offer a prefilled mistake draft, but the learner must write their own expectation, failed assumption, and corrected mental model.

New daily sessions select executable memory/debugging contracts for supported concepts. Their results update the task's outcome and evidence directly. Editing tested code invalidates that daily outcome until tests are rerun. Other daily exercises retain explicit self-verification and can still execute browser-compatible code.

## Verification

`npm run test:runner` checks the real browser UI, timeout recovery, output, tests, predictions, assistance, persistence, and responsive layout. `npm run test:contracts` executes every curated reference against real Pyodide, including the real Pydantic package. These tests require the dev server and internet access to the Pyodide distribution. Unit tests use an injectable fake worker to check cancellation and time limits deterministically.
