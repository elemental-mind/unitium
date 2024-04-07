import type { ChildProcess } from "child_process";
import { NodeBroker, NodeOptions } from "../../brokers/nodeBroker.js";
import { ExProcessTestEnvironment } from "../exProcessTestEnvironment.js";
import type { TestSuite } from "../../../models/testSuite.js";

export class NodeExternalProcessEnvironment extends ExProcessTestEnvironment
{
    public process!: ChildProcess;

    static async acquire(options: NodeOptions)
    {
        const environment = new NodeExternalProcessEnvironment(options);
        await environment.initialized;
        return environment;
    }

    private constructor(
        public options: NodeOptions
    )
    {
        super();
        this.initializeEnvironment();
    }

    async initializeEnvironment(): Promise<void>
    {
        this.process = NodeBroker.getNodeInstance(this.options, this.id);
        await super.initializeEnvironment();
    }

    release(): void
    {
        
    }
}