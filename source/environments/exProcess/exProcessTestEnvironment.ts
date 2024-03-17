import { TestSuite } from "../../models/testSuite.js";
import { EnvironmentType, TestEnvironment } from "../testEnvironment.js";

export class ExProcessTestEnvironment extends TestEnvironment
{
    environmentType = EnvironmentType.RemoteControlled;
    socket: WebSocket;

    constructor(public id: number, coordinatorUrl: string)
    {
        super();
        this.socket = new WebSocket(coordinatorUrl);
    };

    loadSuite(moduleURL: string, suite: TestSuite): Promise<any>
    {
        throw new Error("Method not implemented.");
    }
}