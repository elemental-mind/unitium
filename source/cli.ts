#!/usr/bin/env node

if ("Deno" in globalThis)
    await import("./deno/index.ts");
else if ("Bun" in globalThis)
    await import("./bun/index.ts");
else
    await import("./node/index.ts");
