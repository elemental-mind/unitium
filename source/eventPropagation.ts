import { Awaitable } from "deferium";
import { Transportable } from "./distributedTesting.js";

export abstract class Observable extends Transportable
{
    runStarted = new Awaitable();
    runCompleted = new Awaitable();
}