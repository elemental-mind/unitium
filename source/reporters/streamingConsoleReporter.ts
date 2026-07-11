import { BaseReporter } from "./base.ts";
import { Test } from "../core/unitium.ts";

type TerminalGlobal = typeof globalThis & {
    process?: { stdout?: { columns?: number; isTTY?: boolean; write(text: string): void; }; };
    Deno?: {
        consoleSize?(): { columns: number; rows: number; };
        stdout: { isTerminal(): boolean; writeSync(data: Uint8Array): number; };
    };
};

type TestStatus = Test["status"];
type SortedTests = Record<TestStatus, Test[]>;
type TestReport = { tests: SortedTests, total: number; };

/**
 * Stateful terminal reporter that continuously redraws the test list while a
 * run is in progress.
 */
export class StreamingConsoleReporter extends BaseReporter
{
    private static readonly statusStyles: Record<TestStatus, { symbol: string; barColour: string; }> = {
        pending: { symbol: "⚫", barColour: "\x1b[90m" },
        running: { symbol: "🟡", barColour: "\x1b[33m" },
        passed: { symbol: "🟢", barColour: "\x1b[32m" },
        failed: { symbol: "🔴", barColour: "\x1b[31m" },
    };

    private readonly refreshInterval: number;

    private write!: (text: string) => void;
    private isInteractiveTerminal!: boolean;
    private terminalWidth!: number;

    private renderLoop?: ReturnType<typeof setInterval>;
    private renderedLineCount = 0;

    constructor(specification: ConstructorParameters<typeof BaseReporter>[0], refreshIntervalMs = 100)
    {
        super(specification);
        this.refreshInterval = refreshIntervalMs;

        this.setupTerminal();
    }

    onTestRunnerStart(): void
    {
        if (!this.isInteractiveTerminal)
            return;

        this.render();
        this.renderLoop = setInterval(() => this.render(), this.refreshInterval);
    }

    onTestRunnerEnd(): void
    {
        if (this.renderLoop)
            clearInterval(this.renderLoop);

        this.render();
        this.printErrors();
    }

    private setupTerminal()
    {
        const terminalGlobal = globalThis as TerminalGlobal;

        this.isInteractiveTerminal = terminalGlobal.process?.stdout?.isTTY === true || terminalGlobal.Deno?.stdout.isTerminal() === true;

        if (terminalGlobal.process?.stdout)
        {
            const stdout = terminalGlobal.process.stdout;
            this.write = text => stdout.write(text);
            this.terminalWidth = stdout.columns ?? 80;
        }
        else if (terminalGlobal.Deno)
        {
            const stdout = terminalGlobal.Deno.stdout;
            const encoder = new TextEncoder();
            this.write = text => stdout.writeSync(encoder.encode(text));

            let width = 80;
            try
            {
                width = terminalGlobal.Deno.consoleSize?.().columns ?? width;
            }
            catch { }
            this.terminalWidth = width;
        }
        else
        {
            this.write = console.log;
            this.terminalWidth = 80;
        }
    }

    private render(): void
    {
        const tests: SortedTests = { passed: [], failed: [], running: [], pending: [] };
        const report = { tests, total: 0 };

        const lines = [];
        for (const module of this.specification.testModules)
        {
            lines.push(this.moduleHeading(module.path));

            for (const suite of module.testSuites)
            {
                lines.push(this.suiteHeading(suite.name, module.path));

                for (const test of suite.tests)
                {
                    tests[test.status].push(test);
                    report.total++;
                    lines.push(`    ${StreamingConsoleReporter.statusStyles[test.status].symbol} ${test.name}${this.elapsedLabel(test)}`);
                }
            }
        }

        lines.push("");
        lines.push(`Passed: ${tests.passed.length}  Failed: ${tests.failed.length}  Running: ${tests.running.length}  Pending: ${tests.pending.length}`);

        if (tests.running.length === 0 && tests.pending.length === 0)
            lines.push(this.resultMessage(report));
        else
            lines.push(this.progressBar(report));

        const moveToFirstLine = this.renderedLineCount > 1 ? `\x1b[${this.renderedLineCount - 1}A` : "";
        const clearPreviousFrame = this.renderedLineCount > 0 ? `\r${moveToFirstLine}\x1b[0J` : "";

        this.write(clearPreviousFrame + lines.join("\n"));
        this.renderedLineCount = lines.length;
    }

    private progressBar(report: TestReport): string
    {
        const { tests, total } = report;

        const barWidth = Math.max(10, Math.min(40, this.terminalWidth - 10));

        //We calculate the bar width rounded down for each bar segment
        let remainingBarWidth = barWidth;
        let largestWidth = -1;
        let largestWidthIndex = -1;
        const barWidthPerStatus = Object.values(tests).map((testSet, index) =>
        {
            let segmentWidth = Math.floor(testSet.length * barWidth / total);
            if (segmentWidth > largestWidth)
            {
                largestWidth = segmentWidth;
                largestWidthIndex = index;
            }
            remainingBarWidth -= segmentWidth;
            return segmentWidth;
        });

        //Because of rounding errors we need to add the remaining bar width to a segment. We add it to the largest segment.
        barWidthPerStatus[largestWidthIndex] += remainingBarWidth;

        const bar = Object.entries(tests)
            .map(([status, width], index) => `${StreamingConsoleReporter.statusStyles[status as TestStatus].barColour}${"█".repeat(barWidthPerStatus[index])}\x1b[0m`)
            .join("");

        const completedPercentage = Math.round((tests.passed.length + tests.failed.length) / total * 100);

        return `[${bar}] ${completedPercentage}%`;
    }

    private resultMessage(report: TestReport): string
    {
        return report.tests.failed.length ? `🔴 ${report.tests.failed.length} of ${report.total} tests failed.` : "🟢 All tests passed.";
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
        const padding = Math.max(3, this.terminalWidth - title.length - pathLabel.length);

        return title + " ".repeat(padding) + pathLabel;
    }

    private elapsedLabel(test: Test): string
    {
        if (test.startTime === undefined) return " (pending)";

        const endTime = test.endTime ?? Date.now();
        return ` (${((endTime - test.startTime) / 1000).toFixed(1)}s)`;
    }

    private printErrors(): void
    {
        this.write("\n");

        for (const failingTest of this.specification.tests.filter(test => test.error))
        {
            const error = failingTest.error!;
            const location = error.sourceFile ? ` --> "${error.sourceFile}:${error.fileLocation.line}:${error.fileLocation.column}"` : "";

            this.write(`\n[x] ${failingTest.name}\n  ${error.name}: ${error.message || "unknown"}${location}\n`);
        }
    }
}
