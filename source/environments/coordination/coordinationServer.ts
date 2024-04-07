import { WebSocketServer } from 'ws';
import { createServer, Server } from 'http';
import { readFile } from 'fs/promises';
import { transform } from '@swc/core';
import { Awaitable } from 'deferium';
import { RPCRequest, RPCResponse } from './rpcInterfaces.js';
import type { ExProcessTestEnvironment } from '../exProcessEnvironments/exProcessTestEnvironment.js';

export interface ExternalEnvironmentOptions
{
    frameworkServerURL: string;
}

class FrameworkServer
{
    public fileServer: Server;
    public wsServer: WebSocketServer;
    public baseURL!: string;

    public rpcCallCount = 0;
    public pendingRPCs = new Map<number, Awaitable<any>>();

    constructor(public servePath: string)
    {
        this.fileServer = this.initializeFileServer();
        this.wsServer = this.initializeWebSocketServer();
        this.findPortAndStartServer();
    }

    get httpURL()
    {
        return "http://" + this.baseURL;
    }

    get wsURL()
    {
        return "ws://" + this.baseURL;
    }

    findPortAndStartServer()
    {
        let port;
        for (port = 8000; port < 8100; port++)
        {
            try 
            {
                this.fileServer.listen(port);
                this.baseURL = "localhost:" + port;
                return;
            }
            catch (e)
            {
                continue;
            }
        }

        throw new Error("Could not initialize test coordination server. All ports in use.");
    }

    private initializeFileServer()
    {
        return createServer(async (req, res) =>
        {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const filePath = this.servePath + url.pathname;

            try
            {
                let content = await readFile(filePath, 'utf8');
                let contentType = 'text/plain';

                if (filePath.endsWith('.ts'))
                {
                    content = (await transform(content, {
                        filename: filePath,
                        jsc: {
                            parser: {
                                syntax: "typescript",
                            },
                            target: "es2022",
                        },
                    })).code;
                    contentType = 'application/javascript';
                } else if (filePath.endsWith('.js'))
                {
                    contentType = 'application/javascript';
                } else if (filePath.endsWith('.html'))
                {
                    contentType = 'text/html';
                }

                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                });
                res.end(content, 'utf-8');
            } catch (err)
            {
                res.writeHead(404);
                res.end(JSON.stringify(err));
            }
        });
    }

    private initializeWebSocketServer()
    {
        return new WebSocketServer({server: this.fileServer });
    }

    async getEnvironmentSocket(environmentID: number): Promise<WebSocket>
    {
        let connectionListener!: (socket: WebSocket) => void;

        const socketPromise = new Promise<WebSocket>((resolve) =>
        {
            connectionListener = (socket: WebSocket) =>
            {
                const url = new URL(socket.url);
                const envId = parseInt(url.searchParams.get('environmentId')!, 10);
                if (envId === environmentID) resolve(socket);
            };
        });

        this.wsServer.on('connection', connectionListener);
        const socket = await socketPromise;
        this.wsServer.off("connection", connectionListener);

        socket.addEventListener("message", this.handleRPCResponse);

        return socket;
    }

    async sendRPC<T>(environment: ExProcessTestEnvironment, objectID: number | undefined, fct: string, ...args: any[]) : Promise<T>
    {
        const callID = this.rpcCallCount++;
        const response = new Awaitable<RPCResponse<T>>();

        this.pendingRPCs.set(callID, response);

        const call: RPCRequest = {
            type: "rpcRequest",
            callID,
            objectID,
            fct,
            args           
        }

        environment.socket.send(JSON.stringify(call));
        const result = await response;

        if(result.error)
            throw result.error;
        else
            return result.response as T;
    }

    handleRPCResponse(event: MessageEvent)
    {
        const eventData = JSON.parse(event.data) as RPCResponse<any>;
        
        const pendingResponse = this.pendingRPCs.get(eventData.callID);
        pendingResponse?.resolve(event.data);
    }
}

export const frameworkServer = new FrameworkServer("source");