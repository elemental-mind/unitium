import { ChildProcess, spawn } from "child_process";

type NodeOptions =
    {
        args: string;
        debugPort?: number;
    };

export class NodeBroker
{
    static nodeProcesses = new Map<string, ChildProcess>();

    private static async getNodeInstance(options: NodeOptions)
    {
        let nodeProcess = spawn("node");
        this.nodeProcesses.set(JSON.stringify(options), nodeProcess);

        return nodeProcess;
    }
}