import { TestSuite } from "../models/testSuite.js";

export enum EnvironmentType
{
    RemoteControlled,
    InProcess
}

export abstract class TestEnvironment
{
    static IDProvider = 0;
    abstract environmentType: EnvironmentType;
    public id: number;

    loadedModules = new Map<string, any>();

    constructor()
    {
        this.id = ++TestEnvironment.IDProvider;
    }

    abstract runStatic(suite: TestSuite, fct: string) : Promise<void>;

    abstract instantiateSuite(instantiateSuite: TestSuite): Promise<any>;

    abstract release(): void;
}

export type TestEnvironmentConstructor = Function & {
    acquire(...args: any[]): Promise<TestEnvironment>;
}