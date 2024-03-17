import { TestSuite } from "../models/testSuite.js";

export enum EnvironmentType
{
    RemoteControlled,
    InProcess
}

export abstract class TestEnvironment
{
    abstract environmentType: EnvironmentType;
    abstract id: number;

    loadedModules = new Map<string, any>();

    async loadModuleFromURL(url: string)
    {
        this.loadedModules.set(url, await import(url));
    }

    async loadModuleFromString(moduleURL: string, moduleCode: string)
    {
        const encodedJs = window.btoa(moduleCode);
        const blob = new Blob([encodedJs], { type: "application/javascript" });
        this.loadedModules.set(moduleURL, await import(URL.createObjectURL(blob)));
    }

    abstract loadSuite(moduleURL: string, suite: TestSuite): Promise<any>;
}

export type TestEnvironmentConstructor = {
    getInstance(): Promise<TestEnvironment>;
}