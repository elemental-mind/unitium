import { TestSuite } from "../../models/testSuite.js";
import { EnvironmentType, TestEnvironment, TestEnvironmentConstructor } from "../testEnvironment.js";
import { Awaitable } from "deferium";
import { frameworkServer } from "../coordination/coordinationServer.js";
import { ProxifyRemote, Remote, SpecialRemoteObjectIDs } from "../coordination/remoteObject.js";
import type { ExternalEnvironmentHost } from "./externalEnvironmentHost.js";

export abstract class ExProcessTestEnvironment extends TestEnvironment
{
    public environmentType = EnvironmentType.RemoteControlled;
    public socket!: WebSocket;
    public environmentHost!: Remote<ExternalEnvironmentHost>;
    public initialized = new Awaitable();

    public pendingRPCs = new Map<number, Awaitable<any, any, any>>();

    constructor()
    {
        super();
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
        const instanceID = await this.environmentHost.loadSuite(await suite.testModule.createEnvironmentModuleAndReturnPath(this.constructor as TestEnvironmentConstructor), suite.className);
        return ProxifyRemote(this, instanceID);
    }

    async runStatic(suite: TestSuite, fct: string): Promise<void>
    {
        await this.environmentHost.runStatic(suite.testModule.filePath, suite.className, fct);
    }
}