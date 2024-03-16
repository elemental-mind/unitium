import { TestEnvironment } from "../environments/testEnvironment.js";

export class TestSetup
{
    public inProcessEnvironments: Map<string, TestEnvironment> = new Map();
    public exProcessEnvironments: Map<string, TestEnvironment> = new Map();
}