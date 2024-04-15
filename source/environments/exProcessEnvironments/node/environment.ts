import type { ChildProcess } from "child_process";
import { NodeBroker, NodeOptions } from "../../brokers/nodeBroker.js";
import { ExProcessTestEnvironment } from "../exProcessTestEnvironment.js";
import type { EnvironmentDecorator } from "../../../setups/testSetup.js";

export class NodeExternalProcessEnvironment extends ExProcessTestEnvironment
{
    public process!: ChildProcess;

    static async acquire(domain: EnvironmentDecorator, options: NodeOptions)
    {
        const environment = new NodeExternalProcessEnvironment(domain, options);
        await environment.initialized;
        return environment;
    }

    private constructor(
        domain: EnvironmentDecorator,
        public options: NodeOptions
    )
    {
        super(domain);
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