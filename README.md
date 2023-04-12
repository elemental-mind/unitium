# Make your tests more readable - code them in classes

Unitium is a super simple test runner that will allow you to create test suites with classes:

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
Leads to the following output:

```
>> npx unitium-tsx

BasicExampleTestSuite
  Passed: 1/2
    ✔️    test that passes
  Failed: 1/2
    ❌    test that fails --> AssertionError: 1 == 2 --> ".../unitium/example/example.test.ts:17:16"

```

Public member functions will be interpreted as tests and function names are destructured into space seperated test descriptors.

You are free to use any assertion library - as long as it throws exceptions on assertion errors.

# Installation

Install from npm:
```
npm install --save-dev unitium
```
# Usage

## Create test files
### File naming
Unitium supports `js` and `ts` (see Typescript-support section) files for testing. You may place your files anywhere in your code repository.  Unitium looks for files ending on either `.test.ts`/`.spec.ts` or `.test.js`/`.spec.js` respectively.

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

### Test classes
Tests are organized in classes, which are referred to as `test suites`. Each public method of a class will be interpreted as a separate test. Tests may be synchronous and asynchronous.

A test file may have multiple `test suites`, but also other non-test-suite classes. Only  classes marked with `export` will be interpreted as `test suites`.

Private members will not be interpreted as tests and can be used as utility functions or as data variables.

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