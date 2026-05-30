import { Awaitable } from "deferium";

export abstract class Observable
{
    runStarted = new Awaitable();
    runCompleted = new Awaitable();
}