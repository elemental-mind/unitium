import type { ExProcessTestEnvironment } from "../exProcessEnvironments/exProcessTestEnvironment.js";
import { frameworkServer } from "./coordinationServer.js";

export enum SpecialRemoteObjectIDs
{
    Host
};

export const firstFreeID = Math.max(...Object.values(SpecialRemoteObjectIDs).filter((entry: any):entry is number => Number.isInteger(entry))) + 1;

export function ProxifyRemote<T extends object>(environment: ExProcessTestEnvironment, objectID: number): Remote<T>
{
    return new Proxy({} as T, {
        get: (target, property, receiver) =>
        {
            if (!(property in target) && typeof property === "string" && property !== "constructor")
            {
                return async (...args: any[]) =>
                {
                    return await frameworkServer.sendRPC(environment, objectID, property, ...args);
                };
            }
        }
    }) as Remote<T>;
}

export type Remote<T> = {
    [K in keyof T]: T[K] extends (...args: infer U) => infer V
    ? V extends Promise<any> 
        ? T[K]
        : (...args: U) => Promise<V>
    : Promise<T[K]>
};