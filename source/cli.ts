if ("Deno" in globalThis)
    await import("./runtimes/deno/index.ts");
else if ("Bun" in globalThis)
    await import("./runtimes/bun/index.ts");
else
    await import("./runtimes/node/index.ts");
