import { Awaitable } from "deferium";
import http from "http"
import { testCoordinator } from "../testEnvironmentOrchestrator.js";

export type RPCRequest<T> = { type: "rpcRequest", callID: number, fct: keyof T, args: any[]; };
export type RPCResponse = {type: "rpcResponse", callID: number, response: any };

export abstract class RPCSender
{
    initialized = new Awaitable();
    webSocket!: WebSocket;
    environmentID = testCoordinator.getEnvironmentID();
    private pendingRPCs = new Map<number, Awaitable>();
    private rpcCount = 0;

    protected constructor()
    {
        testCoordinator.wsServer.on('connection', this.onServerConnectionListener);
    };

    private onServerConnectionListener = (ws: WebSocket, req: http.IncomingMessage) =>
    {
        if (req.url?.includes(`testEnvironmentID=${this.environmentID}`))
        {
            testCoordinator.wsServer.off("connection", this.onServerConnectionListener);
            this.webSocket = ws;
            const handler = this;
            this.webSocket.onmessage = messageEvent => handler.onMessage(messageEvent.data);
            this.initialized.resolve();
        }
    }

    private async callRemote<T>(fct: keyof T, args: any[])
    {
        this.rpcCount++;
        const message: RPCRequest<T> = {
            type: "rpcRequest",
            callID: this.rpcCount,
            fct,
            args
        }
        const response = new Awaitable();
        this.pendingRPCs.set(this.rpcCount, response);
        this.webSocket.send(JSON.stringify(message));
        return await response;
    }

    private handleCall()
    {

    }

    private onMessage(rawMessage: string)
    {
        const message = JSON.parse(rawMessage) as RPCResponse;

        if (message.type === "rpcResponse")
            this.pendingRPCs.get(Number(message.callID))?.resolve(message.response);
    }

    onTeardown()
    {
        testCoordinator.wsServer.off('connection', this.onServerConnectionListener);
    }
}

export abstract class RPCReceiver
{
    constructor(
        protected webSocket: WebSocket
    ) 
    { 
        const handler = this;
        this.webSocket.onmessage = messageEvent => handler.onMessage(messageEvent.data);
    }

    async onMessage(rawMessage: string)
    {
        const message = JSON.parse(rawMessage) as RPCRequest<this>;

        if (message.type === "rpcRequest" && this[message.fct])
        {
            const result = await (this[message.fct] as Function)(...message.args);
            this.reply(Number(message.callID), result);
        }
    }

    protected abstract reply(callID: number, result: any): void;
}