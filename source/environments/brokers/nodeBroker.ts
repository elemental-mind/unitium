import { ChildProcess, spawn } from "child_process";
import path from "path";
import { TestRunner } from "../../api/js/node/api.js";
import { ExternalEnvironmentOptions, frameworkServer } from "../coordination/coordinationServer.js";

export type NodeOptions =
    ExternalEnvironmentOptions &
    {
        args: string;
        debugPort?: number;
    };

class NodeProcessManager
{
    private nodeProcesses = new Map<string, ChildProcess>();

    getNodeInstance(options: NodeOptions, environmentID: number)
    {
        const argString = btoa(options.args);
        const nodeProcess = spawn(`node ${path.join(import.meta.url, "../exProcessEnvironments/node/environmentHost.js")} --frameworkServerURL ${frameworkServer.httpURL} --environmentID ${environmentID} --scriptLaunchArgs ${argString}`);
        this.nodeProcesses.set(JSON.stringify(options), nodeProcess);

        return nodeProcess;
    }
}

export const NodeBroker = new NodeProcessManager();