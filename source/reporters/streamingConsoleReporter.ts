import { BaseReporter } from "./base.ts";
import { Test, TestError } from "../core/unitium.ts";

type TestStatus = "pending" | "running" | "passed" | "failed";
type TerminalGlobal = typeof globalThis & {
    process?: { stdout?: { columns?: number; isTTY?: boolean; write(text: string): void; }; };
    Deno?: {
        consoleSize?(): { columns: number; rows: number; };
        stdout: { isTerminal(): boolean; writeSync(data: Uint8Array): number; };
    };
};

/**
 * Stateful terminal reporter that continuously redraws the test list while a
 * run is in progress.
 */
export class StreamingConsoleReporter extends BaseReporter
{
    private readonly refreshInterval: number;
    private readonly testStartTimes = new Map<Test, number>();
    private readonly testEndTimes = new Map<Test, number>();
    private renderLoop?: ReturnType<typeof setInterval>;
    private renderedLineCount = 0;

    constructor(specification: ConstructorParameters<typeof BaseReporter>[0], refreshIntervalMs = 100)
    {
        super(specification);
        this.refreshInterval = refreshIntervalMs;
    }

    onTestRunnerStart(): void
    {
        this.trackTestTimes();

        if (!this.isInteractiveTerminal())
            return;

        this.renderLoop = setInterval(() => this.render(), this.refreshInterval);
        this.render();
    }

    onTestRunnerEnd(): void
    {
        if (this.renderLoop)
            clearInterval(this.renderLoop);

        if (this.isInteractiveTerminal())
        {
            this.render();
            this.write("\n");
        }
        else
            this.write(this.renderLines().join("\n") + "\n");

        this.printErrors();
    }

    private render(): void
    {
        const lines = this.renderLines();
        const moveToFirstLine = this.renderedLineCount > 1 ? `\x1b[${this.renderedLineCount - 1}A` : "";
        const clearPreviousFrame = this.renderedLineCount > 0 ? `\r${moveToFirstLine}\x1b[0J` : "";

        this.write(clearPreviousFrame + lines.join("\n"));
        this.renderedLineCount = lines.length;
    }

    private trackTestTimes(): void
    {
        for (const test of this.specification.tests)
        {
            void test.runStarted.then(() =>
            {
                this.testStartTimes.set(test, Date.now());
                return test.runCompleted.then(() => this.testEndTimes.set(test, Date.now()));
            });
        }
    }

    private renderLines(): string[]
    {
        const lines = [];

        for (const module of this.specification.testModules)
        {
            lines.push(this.moduleHeading(module.path));

            for (const suite of module.testSuites)
            {
                lines.push(this.suiteHeading(suite.name, module.path));

                for (const test of suite.tests)
                    lines.push(`    ${this.statusLabel(test)} ${test.name}${this.elapsedLabel(test)}`);
            }
        }

        const passed = this.specification.tests.filter(test => this.status(test) === "passed").length;
        const failed = this.specification.tests.filter(test => this.status(test) === "failed").length;
        const running = this.specification.tests.filter(test => this.status(test) === "running").length;
        const pending = this.specification.tests.length - passed - failed - running;
        const completed = passed + failed;

        lines.push("");
        lines.push(`Passed: ${passed}  Failed: ${failed}  Running: ${running}  Pending: ${pending}`);
        lines.push(completed === this.specification.tests.length
            ? this.resultMessage(failed, this.specification.tests.length)
            : this.progressBar(passed, failed, running, pending));
        return lines;
    }

    private progressBar(passed: number, failed: number, running: number, pending: number): string
    {
        const width = Math.max(10, Math.min(40, this.terminalWidth() - 10));
        const total = passed + failed + running + pending;
        const segments = [
            { count: passed, colour: "\x1b[32m" },
            { count: failed, colour: "\x1b[31m" },
            { count: running, colour: "\x1b[33m" },
            { count: pending, colour: "\x1b[90m" },
        ];
        let allocatedWidth = 0;
        let cumulativeCount = 0;
        let bar = "";

        for (const segment of segments)
        {
            cumulativeCount += segment.count;
            const segmentEnd = Math.round(width * cumulativeCount / total);
            const segmentWidth = segmentEnd - allocatedWidth;
            if (segmentWidth > 0)
                bar += `${segment.colour}${"█".repeat(segmentWidth)}\x1b[0m`;
            allocatedWidth = segmentEnd;
        }

        const percentage = Math.round((passed + failed) / total * 100);

        return `[${bar}] ${percentage}%`;
    }

    private resultMessage(failed: number, total: number): string
    {
        return failed === 0
            ? "🟢 All tests passed."
            : `🔴 ${failed} of ${total} tests failed.`;
    }

    private moduleHeading(modulePath: string): string
    {
        const path = modulePath.replace(/^file:\/\/\//, "");
        const fileName = path.split(/[\\/]/).at(-1) ?? path;
        const moduleName = fileName
            .replace(/\.(?:test|spec)\.[^.]+$/, "")
            .replace(/\.[^.]+$/, "")
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, character => character.toUpperCase());

        return `${moduleName} Module`;
    }

    private suiteHeading(suiteName: string, modulePath: string): string
    {
        const path = modulePath.replace(/^file:\/\/\//, "");
        const title = `  ${suiteName}`;
        const pathLabel = `[${path}]`;
        const padding = Math.max(3, this.terminalWidth() - title.length - pathLabel.length);

        return title + " ".repeat(padding) + pathLabel;
    }

    private terminalWidth(): number
    {
        const terminalGlobal = globalThis as TerminalGlobal;
        if (terminalGlobal.process?.stdout?.columns)
            return terminalGlobal.process.stdout.columns;

        try
        {
            return terminalGlobal.Deno?.consoleSize?.().columns ?? 80;
        }
        catch
        {
            return 80;
        }
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
            case "pending": return "⚫";
            case "running": return "🟡";
            case "passed": return "🟢";
            case "failed": return "🔴";
        }
    }

    private elapsedLabel(test: Test): string
    {
        const startedAt = this.testStartTimes.get(test);
        if (startedAt === undefined || this.status(test) === "pending")
            return "";

        const endedAt = this.testEndTimes.get(test) ?? Date.now();
        return ` (${((endedAt - startedAt) / 1000).toFixed(1)}s)`;
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
