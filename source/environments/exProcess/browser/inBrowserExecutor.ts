import { RPCResponse } from "../rpc.js";
import { TestExecutor } from "../testEnvironmentExecutor.js";
import { TestRunner } from "../../../unitium.js";

export class InBrowserExecutor extends TestExecutor
{
    loadedTestModules = new Set<any>();
    availableTestSuites = new Map<string, any>();
    initializedTestSuites = new Set<any>();
    static async initialize(environmentID: string)
    {
        const executor = new InBrowserExecutor(new WebSocket(`ws://localhost:8080?testEnvironmentID=${environmentID}`));
    }

    protected reply(callID: number, result: any)
    {
        const reply: RPCResponse = {
            type: "rpcResponse",
            callID: callID,
            response: result
        };
        this.webSocket.send(JSON.stringify(reply));
    }

    async loadTestModule(moduleURL: string)
    {
        const module = await import(moduleURL);
        this.loadedTestModules.add(module);
        for (const key in module) 
            this.availableTestSuites.set(key, module[key]);
    }

    async executeTestSuite(suiteConstructorName: string)
    {
        const testRunner = new TestRunner();


    }

    async initializeTestSuite(suiteConstructorName: string)
    {

    }

    async executeTest(suiteConstructorName: string, testFunctionName: string)
    {

    }

    async disposeTestSuite(suiteConstructorName: string)
    {

    }

    async teardown()
    {

    }
}