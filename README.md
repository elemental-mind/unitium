# Organize your unit tests in classes
## Get started straight away
[Node Quickstart](#use-node) | [Browser Quickstart](#use-browser)
## Introduction
Unitium is a super simple test runner for node & the browser that will allow you to create test suites with classes:

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

<a id="use-node"></a>

# Usage for node

## Installation

Install from npm:
```
npm install --save-dev unitium
```

## Create test files
### Name your files
Unitium for node supports `js` and `ts` (see Typescript-support section) files for testing. You may place your files anywhere in your code repository. Unitium looks for files ending on either `.test.ts`/`.spec.ts` or `.test.js`/`.spec.js` respectively.

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
It's important to note that tests within a `test suite` are run *sequentially* even if they are `async` tests. That is to say that within a test suite no 2 tests are run in parallel to avoid async issues when variables that are shared between tests are used.

Multiple `test suites`, however, are run *asynchronously/in parallel*. That means that if there are multiple `test suites` in a file with `async` tests, these tests may execute along each other, but still with only one test running per `test suite`.

## Run test runner

Once you have installed Unitium and written your tests it's time to test:
```
    npx unitium
```
Unitium will then scan the directory for test files, load them and then start their respective test suites.

You may want to add the following line to your `package.json`:

```json
...
    "scripts": {
        "test": "unitium"
    }
...
```

### Running tests in specific files/directories

By default Unitium will scan your entire working directory for testing files.

You can specify certain files or folders to search for tests in:
```
    npx unitium ./src/module.test.ts ./testingFolder ./anotherTestingFolder/
```
If you specify files or folders only these specified entities will be searched for tests.

## Typescript support

Using the standard `unitium` command on typescript projects will lead to module resolution errors as Unitium does not do any transpilation etc. To resolve this, there are two additional commands supplied: `unitium-tsx` and `unitium-ts-node`.

Unitium itself is kept lean and as config-free as possible. It should work out of the box. As you are probably already set up with a global install of either `ts-node` or `tsx`, Unitium offers these two variants as alternative commands that assume you have the respective tool installed globally.

For invoking `ts-node` adapt the following commands:
```
    npx unitium-ts-node
```
```json
...
    "scripts": {
        "test": "unitium-ts-node"
    }
...
```

For invoking `tsx` adapt the following commands:
```
    npx unitium-tsx
```
```json
...
    "scripts": {
        "test": "unitium-ts-node"
    }
...
```
<a id="use-browser"></a>

# Usage for the browser

## Installation

#### NPM

You can install Unitium from npm if you use a build tool:
```
npm install --save-dev unitium
```
If you are lucky and your build tool supports it you can include the package specifiers straight in your html:
```html
...
<head>
    ...
    <link rel="stylesheet" href="unitium/assets/unitium.css">
    ...
</head>
<body>
    <script src="unitium" type="module"></script>
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
    <link rel="stylesheet" href="./node_modules/unitium/distribution/assets/unitium.css">
    ...
</head>
<body>
    <script src="./node-modules/unitium/distribution/unitium-browser.ts" type="module"></script>
    <script test src="example.test.ts" type="module"></script>
    <main>
        <div id="unitium-output"></div>
    </main>
</body>
...
```

#### CDN
Alternatively you can download unitium from an npm-based CDN:
```html
...
<head>
    ...
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/unitium/distribution/assets/unitium.css">
    ...
</head>
<body>
    <script src="https://cdn.jsdelivr.net/npm/unitium" type="module"></script>
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

## Coding your test classes
Tests are organized in classes, which are referred to as `test suites`. Each public method of a class will be interpreted as a separate test. Tests may be synchronous and asynchronous.

A test file may have multiple `test suites`, but also other non-test-suite classes. Only classes marked with `export` will be interpreted as `test suites`.

Private members (#-prepended) will not be interpreted as tests and can be used as utility functions or as data variables.

### Choosing an assertion library
As browser environments do not include a native `assert` module you need to bring your own assert library. [uvu/assert](https://github.com/lukeed/uvu) is pretty lightweight and easy to use, but you can use any other assertion library like Chai etc. that throws upon false assertions.
Output-support may vary, but feel free to raise an issue if you like to have better support for a common library.

```typescript
import assert from "uvu/assert";   // <-- feel free to use any assertion library

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
It's important to note that tests within a `test suite` are run *sequentially* even if they are `async` tests. That is to say that within a test suite no 2 tests are run in parallel to avoid async issues when variables that are shared between tests are used.

Multiple `test suites`, however, are run *asynchronously/in parallel*. That means that if there are multiple `test suites` in a file with `async` tests, these tests may execute along each other, but still with only one test running per `test suite`.

## Running your tests
Upon loading the page Unitium will run the tests and output its results to the output-HTML-element you provided - and upon finishing all tests - also on the console.