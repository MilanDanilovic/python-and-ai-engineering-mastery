"""Validate Python references; optionally run stdlib-only examples in child processes."""
import ast
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
solutions = json.loads(sys.stdin.buffer.read().decode('utf-8'))
safe_modules = {'decimal', 'copy', 'json', 'collections', 'dataclasses', 'typing',
    'functools', 'inspect', 'pathlib', 'tempfile', 'contextlib', 'asyncio', 'math',
    'hashlib', 'datetime', 'time', 'random', 'sqlite3', 'threading', 'concurrent',
    'io', 'contextvars', 'logging', 'uuid', 're', 'builtins', 'traceback'}
failures = []
parsed = executed = 0
for milestone, examples in solutions.items():
    for index, code in enumerate(examples):
        name = f'{milestone}/{index + 1}'
        try:
            tree = ast.parse(code, filename=name)
            parsed += 1
        except SyntaxError as error:
            failures.append(f'{name}: {error}')
            continue
        if '--execute' not in sys.argv:
            continue
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split('.')[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                imports.add((node.module or '').split('.')[0])
        if imports - safe_modules or not tree.body:
            continue
        try:
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'example.py'
                path.write_text(code, encoding='utf-8')
                result = subprocess.run([sys.executable, str(path)], capture_output=True,
                    text=True, encoding='utf-8', errors='replace', timeout=5)
            executed += 1
            if result.returncode:
                failures.append(f'{name}: {result.stderr[-1000:]}')
        except subprocess.TimeoutExpired:
            failures.append(f'{name}: exceeded 5-second example budget')
print(f'{parsed} Python references parsed; {executed} stdlib-only examples executed.')
if failures:
    print('\n'.join(failures))
    sys.exit(1)
