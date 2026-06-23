# Organize your unit tests in classes
## Get started straight away
[Test authoring and rules](#test-authoring-and-rules) | [CLI](#use-cli-runtimes) | [Browser](#use-browser) | [Runner API](#runner-api)
## Introduction
Unitium is a super simple test runner for Node, Bun, Deno, and the browser that will allow you to create test suites with classes:

```typescript
// example.test.ts

import assert from "assert";

export class ExampleTestSuite
{
    testThatPasses()
    {
        assert.equal(1,1);
    }

    testThatFails()
    {
        assert.equal(1,2);
    }

    #thisIsNotATest()
    {
        return 1;
    }
}
```
Leads to the following output on the console:

```
>> npx unitium-tsx

Basic Example Test Suite
  Passed: 1/2
    ✔️    Test that passes
  Failed: 1/2
    ❌    Test that fails --> AssertionError: 1 == 2 --> ".../unitium/example/example.test.ts:17:16"

```

## In a glance

- Every exported class of a test file is a test suite
- Public member functions of test suites/exported classes will be interpreted as tests
    - If you want a member not to be interpreted as a test make it private through a prepended `#` e.g. `#noTest() {...}`.
- The class and function names serve as descriptors and will be de-camelized in the console output: 
    - `class IAmATestSuite` will become `I Am A Test Suite`
    - `shouldPassThisTest()` becomes `Should pass this test`
- Every test run will be served a "fresh" class instance - its constructor will be run before every member function call.
    - If you do not desire this behaviour, decorate your class with the `@Sequential` decorator. The class will then preserve its state between function calls. Test/functions will be called in order of appearance in the class.

# Test authoring and rules

## Create test files
### Name your files
Unitium supports `js` and `ts` files for testing in Node, Bun, and Deno. You may place your files anywhere in your code repository. Unitium looks for files ending on either `.test.ts`/`.spec.ts` or `.test.js`/`.spec.js` respectively.

There is no special folder to place your tests in - Unitium was created with repositories in mind where test files are placed right along the source files of the to be tested code. For example:
```
...
    /src
        /modules
            ...
            - module.ts
            - module.test.ts
            ...
...
```

### Code your test classes
Tests are organized in classes, which are referred to as `test suites`. Each public method of a class will be interpreted as a separate test. Tests may be synchronous and asynchronous.

A test file may have multiple `test suites`, but also other non-test-suite classes. Only classes marked with `export` will be interpreted as `test suites`.

Private members (#-prepended) will not be interpreted as tests and can be used as utility functions or as data variables.

```typescript
import assert from "assert";   // <-- feel free to use any assertion library

export class TestSuite         // <-- "export" test suites
{
    #sampleData = [1,2,3];     // <-- keep any non-test-members private through #

    constructor()
    {
        //if necessary, initialize your test suite here
    }

    testDefinition()           // <--- give your tests descriptive function names
    {
        assert.equal(1,1);
    }

    #utilityFunction()        // <-- keep any non-tests private through the #  
    {

    }
}
```
It's important to note that tests within a `test suite` are run *paralelly* by default, but each method is run *independent* of the others with a *fresh instance of the class* - which also implies that the constructor is run for each test method. You can thus use the constructor for shared work/setup between indivudal tests.

Multiple `test suites`, however, are run *asynchronously/in parallel*. That means that if there are multiple `test suites` in a file with `async` tests, these tests may execute along each other, but still with only one test running per `test suite`.

#### Decide between sequential or parallel testing

As mentioned, by default test suite test are run in parallel by default. But by using the `@Sequential` decorator you can tell Unitium to treat your test suite as sequential tests.
If a class is decorated with `@Sequential` only one single instance of a test suite will be created and passed through the test functions in order of appearance.

```typescript
import { Sequential } from "unitium";

@Sequential
class SequentialTestSuite
{
    counter = 0;

    incrementCounterAndTest()
    {
        this.counter++;
        assert(this.counter === 1);
    }

    incerementAgainAndAssert()
    {
        this.counter++;
        assert(this.counter === 2); //If this suite was not sequential, this would fail as "this" would be a fresh instance of "SequentialtestSuite" and hence this.counter would be 0.
    }
}
```

#### Implement Test Suite Lifecycle hooks

A test suite goes through a certain lifecycle:

x -> pending --> `<static> onSetup()` --> set up ==>> `onBeforeEach(test)` >> testing >> `onAfterEach(test)` ==>> testing finished --> `<static> onTeardown()` --> completed -> o

Note that the `onSetup`and `onTeardown` hooks should be static members of the class if the test suite is non-sequential. All other hooks are member functions by default.
If any member function hooks are detected, the test suite is automatically treated as a sequential test suite.

All hooks can be synchrounous or asynchronous.

An example that might be a valid use case:

```typescript
@Sequential
class DBTest
{
    static DBConnection;

    static async onSetup()
    {
        this.DBConnection = await DB.connect(...)
    }

    static async onTeardown()
    {
        await this.DBConnection.dispose();
    }

    async onBeforeEach(test: Test)
    {
        console.log("throttling before " + test.name);
        await throttleTestQueries();
    }

    async testQuery1()
    {
        const result = await DBTest.DBConnection.query(...)
        ...
    }

    async testQuery2()
    {
        ...
    }

    ...
}
```

## Decorators

Unitium exports standard TC39 decorators from its main test-suite API.

Note: When using decorators you need to either execute the tests using `unitium-ts-node`, `unitium tsx` or by using `bunx unitium` or `deno` as node does support type stripping naturally but discontinued TypeScript type transformations in V26 - thus not supporting decorators.

```typescript
import { Debug, Sequential } from "unitium";
```

Use `@Sequential` on a test suite class when all tests in that suite should share one instance and execute in declaration order. Use `@Debug` on a test method when you want Unitium to run only that test, or that test and the tests before it when the suite is sequential.

Unitium decorators use the current standard decorator form supported by TypeScript 5 and Deno. They do not require `experimentalDecorators` or `emitDecoratorMetadata` in your TypeScript config.

Runtime support depends on how your tests are loaded:

| Runtime | Decorator support |
| --- | --- |
| `unitium-tsx` | Supported through TypeScript transformation. |
| `unitium-ts-node` | Supported when your TypeScript toolchain is configured for standard decorators. |
| `deno x --allow-read jsr:@elemental/unitium/cli` | Supported in Deno 1.40 and newer for TypeScript, JSX, and TSX files. |
| `unitium` with JavaScript files | Supported only after your code has been compiled to JavaScript. |
| Native Node TypeScript execution | Not supported yet because Node's type stripping does not transform decorators. |

### Debugging tests

In order to debug tests or underlying programs during development Unitium checks whether there is any test decorated with the `@Debug` decorator on a test suite's member method. If this is the case all other test will be discarded for this test runner run and only this test will be executed.

```typescript
class TestSuite
{
    testThatWillNotBeRun()
    {
        //this test will not be run as it is not decorated with @Debug
    }

    @Debug
    testThatWillBeDebugged()
    {
        //this test will be run
    }
}
```

If the test is in a sequential test suite, though, all tests leading up to the debugged test will be executed as they are assumed to alter the state of the test suite:

```typescript
@Sequential
class TestSuite
{
    testThatWillBeRun() {}
    testThatWillBeRunAsWell() {}

    @Debug
    testThatWillBeDebugged() {}

    testThatWillNotBeRun(){}
}
```

#### VS Code launch configuration

To debug tests in VS Code, create a `.vscode/launch.json` file in your project root with a configuration that targets one of the unitium executables. Here is an example config using `unitium-tsx`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Run unitium-tsx",
            "runtimeExecutable": "unitium-tsx",
            "args": [],
            "cwd": "${workspaceFolder}",
            "console": "internalConsole"
        }
    ]
}
```

This configuration launches the Node.js debugger with `unitium-tsx` as the runtime executable. Place breakpoints in your test files and start debugging from the Run and Debug panel (Ctrl+Shift+D) or by hitting `F5`. If you want to debug only a specific test file, add it to the `args` array, for example `"args": ["./src/module.test.ts"]`.

Note: If you have installed `unitium` globally the `@Debug` decorator resolution does not work properly. Make sure you do NOT have `unitium` saved globally but rather install it through `npm install --save-dev unitium`.

<a id="use-cli-runtimes"></a>

# Test invocation/running/control via CLI

## Installation

Install from npm:
```
npm install --save-dev unitium
```

For Deno, no CLI install step is required. Run Unitium directly from JSR:
```
deno x --allow-read jsr:@elemental/unitium/cli
```

If your Deno tests import Unitium APIs such as decorators, add the JSR package to your project:
```
deno add jsr:@elemental/unitium
```

## Run test runner

Once you have installed Unitium, or chosen the Deno JSR command, and written your tests it's time to test:
```
    npx unitium-tsx
```
Unitium will then scan the directory for test files, load them and then start their respective test suites.

You may want to add the following line to your `package.json`:

```json
...
    "scripts": {
        "test": "unitium-tsx"
    }
...
```

### Running tests in specific files/directories

By default Unitium will scan your entire working directory for testing files. It is recommended to specify the folder that contains your tests, especially in larger repositories.

You can specify certain files or folders to search for tests in:
```
    npx unitium-tsx ./src/module.test.ts ./testingFolder ./anotherTestingFolder/
```
If you specify files or folders only these specified entities will be searched for tests.

Unitium reads `.gitignore` from the working directory and skips ignored files and folders while scanning.

## Runtime commands

Use the command that matches the runtime that will execute your tests:

| Runtime | Command |
| --- | --- |
| Node with TypeScript | `npx unitium-tsx` |
| Node with JavaScript | `npx unitium` |
| Bun | `bun x unitium` |
| Deno | `deno x --allow-read jsr:@elemental/unitium/cli` |

The plain `unitium` command runs JavaScript directly. Node supports native TypeScript execution in newer versions, but native type stripping does not transform TypeScript syntax. If your test suites use TypeScript features that require transforms, such as decorators, prefer `unitium-tsx` or `unitium-ts-node`.

Deno should use Unitium's JSR package entry point instead of the npm package runner. Running the npm package through `deno x unitium` puts Deno in npm compatibility mode, which can fail when the package uses `jsr:` imports.

All CLI runtime commands accept the same flags and file or folder arguments:

```
npx unitium-tsx --json ./src ./tests/example.test.ts
bun x unitium --silent ./src
deno x --allow-read jsr:@elemental/unitium/cli ./src
```

`deno x --allow-read jsr:@elemental/unitium/cli` fetches and runs Unitium's CLI entry point from JSR on demand, so no separate `deno install` step is needed. The `--allow-read` permission is required so Unitium can discover test files from the current working directory or provided paths. Bun's package runner is invoked as `bun x unitium`.

## CLI runner reference

There are three Node executables distributed with unitium:
- `unitium`: The standard JS runner.
- `unitium-tsx`: A TS runner that invokes `tsx`.
- `unitium-ts-node`: A TS runner that invokes `ts-node`.

Bun and Deno can execute the same CLI through their package runners:
- `bun x unitium`
- `deno x --allow-read jsr:@elemental/unitium/cli`

Deno runs Unitium from the JSR CLI entry point with `deno x --allow-read jsr:@elemental/unitium/cli`. Avoid `deno x unitium`, because that runs the npm package in npm compatibility mode and can fail to resolve `jsr:` imports. Bun uses `bun x` for its npm package-runner workflow.

Node supports native TypeScript execution in recent versions, but native type stripping does not transform TypeScript syntax. Use `unitium-tsx` or `unitium-ts-node` when your test suites use decorators or other TypeScript features that require transforms.

By default these runners scan your current working directory for files ending on either `spec.ts`, `test.ts`, `spec.js` and `test.js` and run all the found tests in them. Files and folders ignored by the working directory's `.gitignore` are skipped. All executables follow the same CLI schema:

`unitium [flags] [files/folders]`

### Available flags
- `--json`: Instead of outputting human readable test results the output will be JSON summarizing the tests.
- `--silent`: No output will be printed to stdout. Success or failure of tests can be determined by the process' exit code.
- `--help`: Prints CLI usage and exits without running tests.

### Exit codes
- `0`: All discovered tests passed, or `--help` was shown.
- `1`: The runtime failed before Unitium could complete the test run. E.g. a syntax error or a wrong file path.
- `100`: Unitium completed the run and at least one test failed.

### Specifying files/folders

You can combine individual test files and folders in one command. When you provide paths, Unitium only uses those files and the test files found inside those folders:

`unitium-tsx --json ./path/to/specific.test.ts ./path/to/testFolder`

When no files or folders are provided, Unitium scans the current working directory.
<a id="use-browser"></a>

# Test running in the browser

## Installation

#### NPM

You can install Unitium from npm if you use a build tool:
```
npm install --save-dev unitium
```
If your build tool supports package specifiers in HTML, you can reference Unitium through its package exports:
```html
...
<head>
    ...
    <link rel="stylesheet" href="unitium/browser/style.css">
    ...
</head>
<body>
    <script src="unitium/browser/index.js" type="module"></script>
    <script test src="example.test.ts" type="module"></script>
    <main>
        <div id="unitium-output"></div>
    </main>
</body>
...
```
Otherwise reference the files from node_modules directly:
```html
...
<head>
    ...
    <link rel="stylesheet" href="./node_modules/unitium/distribution/environments/browser/style.css">
    ...
</head>
<body>
    <script src="./node_modules/unitium/distribution/environments/browser/index.js" type="module"></script>
    <script test src="example.test.ts" type="module"></script>
    <main>
        <div id="unitium-output"></div>
    </main>
</body>
...
```

#### CDN
Alternatively you can download Unitium from an npm-based CDN:
```html
...
<head>
    ...
    <link rel="stylesheet" href="https://unpkg.com/unitium/distribution/environments/browser/style.css">
    ...
</head>
<body>
    <script src="https://unpkg.com/unitium/distribution/environments/browser/index.js" type="module"></script>
    <script test src="example.test.ts" type="module"></script>
    <main>
        <div id="unitium-output"></div>
    </main>
</body>
...
```

## Providing output for in-browser-test-output
Unitium provides the option to display test results directly in the browser for easy inspection. Unitium will look for an element with the id `unitium-output` to mount its output there - so if you provide it like in the two examples above it will fill these elements with its output.

## Linking your test files
Unitium needs to know which files to test in the browser. Unitium will identify tests through `script` tags with a `test`-attribute applied to them. It will then load these modules and run the test suites in them:

```html
<script src="no-test.ts"></script>
<script src="also-no-test.ts" type="module"></script>
<script test src="test-file-1.ts" type="module"></script>
<script test src="test-file-2.ts" type="module"></script>
```
In the above example only the last 2 elements are considered test modules as they have a `src`-attribute and a `test`-attribute.

You can not provide non-modules as test files. Also inline-modules are currently not supported. 

## Browser assertions
Browser tests use the same exported class and public method rules described in [Test authoring and rules](#test-authoring-and-rules).

As browser environments do not include a native `assert` module you need to bring your own assertions. This can be a tiny helper in your project or any assertion library that throws upon false assertions.
Output-support may vary, but feel free to raise an issue if you like to have better support for a common library.

```typescript
import * as assert from "./assert.ts";   // <-- any throwing assertion helper works

export class TestSuite         // <-- "export" test suites
{
    #sampleData = [1,2,3];     // <-- keep any non-test-members private through #

    constructor()
    {
        //if necessary, initialize your test suite here
    }

    testDefinition()           // <--- give your tests descriptive function names
    {
        assert.equal(1,1);
    }

    #utilityFunction()        // <-- keep any non-tests private through the #  
    {

    }
}
```

## Running your tests
Upon loading the page Unitium will run the tests and output its results to the output-HTML-element you provided - and upon finishing all tests - also on the console.

# Runner API

You can also invoke the runner programmatically through its JS API.

`RuntimeEnvironment.resolveRuntimeModules()` selects the file-system adapter for the runtime that is executing the current process. Use it when you want the same programmatic runner code to work in Node, Bun, and Deno.

```typescript
import { RuntimeEnvironment, TestRunner, ConsoleReporter } from "unitium/runner-api";

...
    async runTests()
    {
        const { AppSpecification } = await RuntimeEnvironment.resolveRuntimeModules();
        const spec = new AppSpecification();
        await spec.load([]);
        await new TestRunner(spec, [new ConsoleReporter(spec)]).run();

        //after the tests are run you can inspect the results
        if(spec.tests.includes(test => test.error !== undefined))
            console.log("One or more tests failed");
    }
...
```

This behaves the same as invoking the CLI. If you would like to customize which files or folders are loaded, pass them to `spec.load`:

```typescript 
        import { RuntimeEnvironment, TestRunner, ConsoleReporter } from "unitium/runner-api";
        //...
        const { AppSpecification } = await RuntimeEnvironment.resolveRuntimeModules();
        const spec = new AppSpecification();
        await spec.load(["./src/module.test.ts", "./tests"]);
        //...
```
You can control `stdout` output by passing an array of one or more reporters to the `TestRunner` constructor. The currently available reporters are:
- `ConsoleReporter`: Outputs human readable output to stdout.
- `JSONReporter`: Outputs to stdout in JSON format.

If you have further requirements or need clarification, feel free to raise an issue.
