import { ITestSuiteMetaDataMembers } from "../../unitium.js";
import { BaseContext, ContextState } from "../state-management/contextState.js";

export function InteractionTest(url: string, contextState: typeof ContextState = BaseContext)
{
    const returnClass = class InBrowserTest
    {    
        declare __meta: ITestSuiteMetaDataMembers;
    }

    returnClass.prototype.__meta = {
        browserTest: {
            strategy: "inBrowser",
            url: url
        }
    };

    return returnClass;
}