import assert from "node:assert";
import { arraysContainSameElements, evaluateSpecIn } from "../../tests/utils.ts";
import { TestError } from "./unitium.ts";

export class ModuleParsingTests
{
    async shouldHandleEmptyTestModulesGracefully()
    {
        const results = await evaluateSpecIn("tests/fixtures/general/parsing/emptyModule.test.ts");
        
        assert(results.testModules.length === 1);
        assert.deepStrictEqual(results.testSuites, []);
    }

    async onlyExportedMembersShouldBeTests()
    {
        const resultsNoExport = await evaluateSpecIn("tests/fixtures/general/parsing/noExports.test.ts");
        const resultsSingleExport = await evaluateSpecIn("tests/fixtures/general/parsing/singleExport.test.ts");
        const resultsMultipleExports = await evaluateSpecIn("tests/fixtures/general/parsing/multiExport.test.ts");

        assert(arraysContainSameElements(resultsNoExport.testSuites.map(suite => suite.className), []));
        assert(arraysContainSameElements(resultsSingleExport.testSuites.map(suite => suite.className), ["FirstTest"]));
        assert(arraysContainSameElements(resultsMultipleExports.testSuites.map(suite => suite.className), ["FirstTest", "SecondTest"]));
    }
}

export class ExecutionModelTests
{
    async testsShouldExecuteInParallel()
    {
        const results = await evaluateSpecIn("tests/fixtures/general/execution/asyncParallel.test.ts");

        //@ts-ignore
        assert.deepStrictEqual(results.testSuites[0].testClassConstructor.executionOrder, [3,2,1]);
    }
}

export class AssertionDetectionTests
{
    async shouldRegisterErrorOnFailingTest()
    {
        const results = await evaluateSpecIn("tests/fixtures/general/assertion/failing.test.ts");

        assert(results.tests[0].error !== undefined);        
    }
    
    async shouldNotRegisterErrorOnPassingTest()
    {
        const results = await evaluateSpecIn("tests/fixtures/general/assertion/passing.test.ts");

        assert(results.tests[0].error === undefined);
    }
}

export class ErrorStackParsingTests
{
    parsesNodeUnixParenthesizedStack()
    {
        this.#assertParsedStackFrame(
            "at testFunction (/Code/unitium/source/core/unitium.spec.ts:12:34)",
            "/Code/unitium/source/core/unitium.spec.ts"
        );
    }

    parsesNodeUnixBareStack()
    {
        this.#assertParsedStackFrame(
            "at /Code/unitium/source/core/unitium.spec.ts:12:34",
            "/Code/unitium/source/core/unitium.spec.ts"
        );
    }

    parsesNodeWindowsParenthesizedStack()
    {
        this.#assertParsedStackFrame(
            "at testFunction (C:\\Code\\unitium\\source\\core\\unitium.spec.ts:12:34)",
            "C:\\Code\\unitium\\source\\core\\unitium.spec.ts"
        );
    }

    parsesNodeWindowsBareStack()
    {
        this.#assertParsedStackFrame(
            "at C:\\Code\\unitium\\source\\core\\unitium.spec.ts:12:34",
            "C:\\Code\\unitium\\source\\core\\unitium.spec.ts"
        );
    }

    parsesBunUnixParenthesizedStack()
    {
        this.#assertParsedStackFrame(
            "at testFunction (/Code/unitium/source/core/unitium.spec.ts:12:34)",
            "/Code/unitium/source/core/unitium.spec.ts"
        );
    }

    parsesBunUnixBareStack()
    {
        this.#assertParsedStackFrame(
            "at /Code/unitium/source/core/unitium.spec.ts:12:34",
            "/Code/unitium/source/core/unitium.spec.ts"
        );
    }

    parsesBunWindowsParenthesizedStack()
    {
        this.#assertParsedStackFrame(
            "at testFunction (C:\\Code\\unitium\\source\\core\\unitium.spec.ts:12:34)",
            "C:\\Code\\unitium\\source\\core\\unitium.spec.ts"
        );
    }

    parsesBunWindowsBareStack()
    {
        this.#assertParsedStackFrame(
            "at C:\\Code\\unitium\\source\\core\\unitium.spec.ts:12:34",
            "C:\\Code\\unitium\\source\\core\\unitium.spec.ts"
        );
    }

    parsesDenoUnixParenthesizedStack()
    {
        this.#assertParsedStackFrame(
            "at testFunction (file:///Code/unitium/source/core/unitium.spec.ts:12:34)",
            "file:///Code/unitium/source/core/unitium.spec.ts"
        );
    }

    parsesDenoUnixBareStack()
    {
        this.#assertParsedStackFrame(
            "at file:///Code/unitium/source/core/unitium.spec.ts:12:34",
            "file:///Code/unitium/source/core/unitium.spec.ts"
        );
    }

    parsesDenoWindowsParenthesizedStack()
    {
        this.#assertParsedStackFrame(
            "at testFunction (file:///C:/Code/unitium/source/core/unitium.spec.ts:12:34)",
            "file:///C:/Code/unitium/source/core/unitium.spec.ts"
        );
    }

    parsesDenoWindowsBareStack()
    {
        this.#assertParsedStackFrame(
            "at file:///C:/Code/unitium/source/core/unitium.spec.ts:12:34",
            "file:///C:/Code/unitium/source/core/unitium.spec.ts"
        );
    }

    shouldSkipFramesWithoutFileLocations()
    {
        const error = this.#createErrorWithStack(`Error: x
    at moduleEvaluation (native)
    at unknown location
    at module code (file.js:17:1)`);
        const testError = new TestError(error);

        assert.strictEqual(testError.sourceFile, "file.js");
        assert.deepStrictEqual(testError.fileLocation, { line: 17, column: 1 });
    }

    #assertParsedStackFrame(frame: string, sourceFile: string)
    {
        const error = this.#createErrorWithStack(`Error: x
    ${frame}
    at module code (native)`);
        const testError = new TestError(error);

        assert.strictEqual(testError.sourceFile, sourceFile);
        assert.deepStrictEqual(testError.fileLocation, { line: 12, column: 34 });
    }

    #createErrorWithStack(stack: string)
    {
        const error = new Error("x");
        error.stack = stack;
        return error;
    }
}
