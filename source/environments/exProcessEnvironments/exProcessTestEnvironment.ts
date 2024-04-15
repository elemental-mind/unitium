import type { TestSuite } from "../../models/testSuite.js";
import { EnvironmentType, TestEnvironment } from "../testEnvironment.js";
import { Awaitable } from "deferium";
import { frameworkServer } from "../../orchestration/frameworkServer.js";
import { ProxifyRemote, Remote, SpecialRemoteObjectIDs } from "../rpc/remoteObject.js";
import type { ExternalEnvironmentHost } from "./externalEnvironmentHost.js";
import type { EnvironmentDecorator } from "../../setups/testSetup.js";

export abstract class ExProcessTestEnvironment extends TestEnvironment
{
    public environmentType = EnvironmentType.RemoteControlled;
    public socket!: WebSocket;
    public environmentHost!: Remote<ExternalEnvironmentHost>;
    public initialized = new Awaitable();
    
    constructor(domain: EnvironmentDecorator)
    {
        super(domain);
        this.initializeEnvironment();
    };

    async initializeEnvironment()
    {
        this.socket = await frameworkServer.getEnvironmentSocket(this.id);
        this.environmentHost = ProxifyRemote(this, SpecialRemoteObjectIDs.Host);
        this.initialized.resolve();
    }

    async instantiateSuite(suite: TestSuite) : Promise<Remote<any>>
    {
        const instanceID = await this.environmentHost.loadSuite((await suite.testModule.createEnvironmentModuleFile(this.domain)).serverURL, suite.className);
        return ProxifyRemote(this, instanceID);
    }

    async runStatic(suite: TestSuite, fct: string): Promise<void>
    {
        await this.environmentHost.runStatic((await suite.testModule.createEnvironmentModuleFile(this.domain)).serverURL, suite.className, fct);
    }
}