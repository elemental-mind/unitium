import { Subscribable } from "deferium";
import { TestModuleData, TestSuiteData, TestData } from "../interfaces.js";

export class TestEventProvider {
    onRunStart = new Subscribable<void>();
    onModuleLoaded = new Subscribable<TestModuleData>();
    onModuleStart = new Subscribable<TestModuleData>();
    onModuleEnd = new Subscribable<TestModuleData>();
    onSuiteLoaded = new Subscribable<TestSuiteData>();
    onSuiteStart = new Subscribable<TestSuiteData>();
    onSuiteEnd = new Subscribable<TestSuiteData>();
    onTestLoaded = new Subscribable<TestData>();
    onTestStart = new Subscribable<TestData>();
    onTestEnd = new Subscribable<TestData>();
}