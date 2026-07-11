import { BaseReporter } from "./base.ts";
import { Test, TestError } from "../core/unitium.ts";

type TestStatus = "pending" | "running" | "passed" | "failed";
type TerminalGlobal = typeof globalThis & {
    process?: { stdout?: { isTTY?: boolean; write(text: string): void; }; };
    Deno?: { stdout: { isTerminal(): boolean; writeSync(data: Uint8Array): number; }; };
};

/**
 * Stateful terminal reporter that continuously redraws the test list while a
 * run is in progress.
 */
export class StreamingConsoleReporter extends BaseReporter
{
    private readonly refreshInterval: number;
    private readonly testStartTimes = new Map<Test, number>();
    private renderLoop?: ReturnType<typeof setInterval>;
    private renderedLineCount = 0;

    constructor(specification: ConstructorParameters<typeof BaseReporter>[0], refreshIntervalMs = 200)
    {
        super(specification);
        this.refreshInterval = refreshIntervalMs;
    }

    onTestRunnerStart(): void
    {
        if (!this.isInteractiveTerminal())
            return;

        this.renderLoop = setInterval(() => this.render(), this.refreshInterval);
        this.render();
    }

    onTestRunnerEnd(): void
    {
        if (this.renderLoop)
            clearInterval(this.renderLoop);

        this.captureStartTimes();

        if (this.isInteractiveTerminal())
        {
            this.render();
            this.write("\n");
        }
        else
            this.write(this.createLines().join("\n") + "\n");

        this.printErrors();
    }

    private render(): void
    {
        this.captureStartTimes();

        const lines = this.createLines();
        const moveToFirstLine = this.renderedLineCount > 1 ? `\x1b[${this.renderedLineCount - 1}A` : "";
        const clearPreviousFrame = this.renderedLineCount > 0 ? `\r${moveToFirstLine}\x1b[0J` : "";

        this.write(clearPreviousFrame + lines.join("\n"));
        this.renderedLineCount = lines.length;
    }

    private captureStartTimes(): void
    {
        for (const test of this.specification.tests)
            if (test.runStarted.isResolved && !this.testStartTimes.has(test))
                this.testStartTimes.set(test, Date.now());
    }

    private createLines(): string[]
    {
        const lines = ["Testing..."];

        for (const module of this.specification.testModules)
        {
            lines.push(module.path);

            for (const suite of module.testSuites)
            {
                lines.push(`  ${suite.name}`);

                for (const test of suite.tests)
                    lines.push(`    ${this.statusLabel(test)} ${test.name}${this.elapsedLabel(test)}`);
            }
        }

        const passed = this.specification.tests.filter(test => this.status(test) === "passed").length;
        const failed = this.specification.tests.filter(test => this.status(test) === "failed").length;
        const running = this.specification.tests.filter(test => this.status(test) === "running").length;
        const pending = this.specification.tests.length - passed - failed - running;

        lines.push("");
        lines.push(`Passed: ${passed}  Failed: ${failed}  Running: ${running}  Pending: ${pending}`);
        return lines;
    }

    private status(test: Test): TestStatus
    {
        if (test.runCompleted.isResolved)
            return test.error ? "failed" : "passed";
        if (test.runStarted.isResolved)
            return "running";
        return "pending";
    }

    private statusLabel(test: Test): string
    {
        switch (this.status(test))
        {
            case "pending": return "[ ] pending";
            case "running": return "[>] running";
            case "passed": return "[+] passed ";
            case "failed": return "[x] failed ";
        }
    }

    private elapsedLabel(test: Test): string
    {
        const startedAt = this.testStartTimes.get(test);
        if (startedAt === undefined || this.status(test) === "pending")
            return "";

        return ` (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`;
    }

    private printErrors(): void
    {
        for (const test of this.specification.tests)
        {
            if (!test.error)
                continue;

            this.write(`\n[x] ${test.name}\n  ${this.formatError(test.error)}\n`);
        }
    }

    private formatError(error: TestError): string
    {
        const location = error.sourceFile
            ? ` --> "${error.sourceFile}:${error.fileLocation.line}:${error.fileLocation.column}"`
            : "";

        return `${error.name}: ${error.message || "unknown"}${location}`;
    }

    private isInteractiveTerminal(): boolean
    {
        const terminalGlobal = globalThis as TerminalGlobal;
        return terminalGlobal.process?.stdout?.isTTY === true
            || terminalGlobal.Deno?.stdout.isTerminal() === true;
    }

    private write(text: string): void
    {
        const terminalGlobal = globalThis as TerminalGlobal;

        if (terminalGlobal.process?.stdout)
            terminalGlobal.process.stdout.write(text);
        else if (terminalGlobal.Deno)
            terminalGlobal.Deno.stdout.writeSync(new TextEncoder().encode(text));
        else
            console.log(text);
    }
}
