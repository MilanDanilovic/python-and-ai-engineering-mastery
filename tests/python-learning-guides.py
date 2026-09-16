"""Execute every independent teaching example and verify its advertised output."""
import ast
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.stdout.reconfigure(encoding="utf-8")
guides = json.loads(sys.stdin.buffer.read().decode("utf-8"))
failures = []
with tempfile.TemporaryDirectory() as folder:
    for concept, guide in guides.items():
        code = guide["code"]
        compiled = compile(code, concept, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        # Use an actual file so multiprocessing can import the main module.
        if compiled.co_flags & 0x80:
            code = "import asyncio\nasync def example():\n" + "\n".join("    " + line for line in code.splitlines()) + "\nasyncio.run(example())\n"
        path = Path(folder) / f"guide_{concept.replace('-', '_')}.py"
        path.write_text(code, encoding="utf-8")
        result = subprocess.run([sys.executable, str(path)], capture_output=True, encoding="utf-8", timeout=20, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
        if result.returncode or result.stdout.strip() != guide["output"].strip():
            failures.append({"id": concept, "expected": guide["output"], "actual": result.stdout.strip(), "error": result.stderr})
if failures:
    print(json.dumps(failures, indent=2, ensure_ascii=False))
    sys.exit(1)
print(f"All {len(guides)} teaching examples match their expected output.")
