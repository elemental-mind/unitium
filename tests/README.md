# Test Setup

The specs in `source` test runtime-agnostic Unitium behavior. They should not
import Node, Deno, Bun, or browser APIs directly.

Runtime-specific test dependencies are resolved through `package.json` import
maps:

- `#unitium/assert` provides the assertion API for the current runtime.
- `#unitium/test-runtime` provides helpers for loading fixture specs through the
  current runtime's `AppSpecification`.

The implementations live in `tests/adaptors`:

- `assert.node.ts` and `runtime.node.ts` are used by Node and Bun.
- `assert.deno.ts` and `runtime.deno.ts` are used by Deno.

Reusable fixture modules live in `tests/fixtures`. These files are loaded by the
shared specs to verify parsing, execution order, hooks, decorators, and assertion
handling. Some fixtures intentionally fail or enable debug mode, so the test
commands should run the specs in `source`, not the whole `tests` folder.
