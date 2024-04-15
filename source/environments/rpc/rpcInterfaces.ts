export interface RPCRequest
{
    type: "rpcRequest";
    callID: number;
    objectID?: number;
    fct: string;
    args: any[];
}

export interface RPCResponse<T>
{
    type: "rpcResponse";
    callID: number; 
    response?: T;
    error?: any;
};
