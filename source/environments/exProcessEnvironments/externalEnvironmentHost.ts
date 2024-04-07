import { firstFreeID, SpecialRemoteObjectIDs } from "../coordination/remoteObject.js";
import { RPCRequest } from "../coordination/rpcInterfaces.js";

export class ExternalEnvironmentHost
{
    private instances = new Map<number, any>();
    private connection: WebSocket;
    private instanceIDProvider = firstFreeID;

    constructor(
        public frameworkServerURL: string, 
        public environmentID: number
    )
    {
        this.connection = new WebSocket(`${frameworkServerURL}/?environmentID=${environmentID}`);
        this.connection.onmessage = this.handleRPCCall;
        this.instances.set(SpecialRemoteObjectIDs.Host, this);
    }

    async loadSuite(moduleURL: string, className: string)
    {
        const module = await import(moduleURL);
        const instance = new module[className]();
        const suiteID = this.instanceIDProvider++;
        this.instances.set(suiteID, instance);
        return suiteID;
    }

    async runStatic(moduleURL: string, className: string, fct: string)
    {
        const module = await import(moduleURL);
        await module[className][fct]();
    }

    private async handleRPCCall(event: MessageEvent)
    {
        const message = JSON.parse(event.data) as RPCRequest;

        if (message.type === "rpcRequest")
        {
            const instance = message.objectID ? this.instances.get(message.objectID)! : this;
            this.execute(message.callID, instance, message.fct, message.args);
        }
    }

    private async execute(callID: number, instance: any, fct: string, ...args: any[])
    {
        try
        {
            const result = await instance[fct](args);
            this.respond(callID, result);
        }
        catch (e)
        {
            this.respond(callID, {
                type: "error",
                error: e
            });
        }
    }

    private async respond(callID: number, data?: any)
    {
        this.connection.send(JSON.stringify({
            requestID: callID,
            data
        }));
    }
}