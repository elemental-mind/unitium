import { ITestSuiteMetaDataMembers } from '../../unitium.js';
import { BaseContext, ContextState } from '../state-management/contextState.js';

export function LibraryTest(contextState: typeof ContextState = BaseContext)
{
    const returnClass = class InBrowserTest
    {    
        declare __meta: ITestSuiteMetaDataMembers;
    }

    returnClass.prototype.__meta = {
        browserTest: {
            strategy: "inBrowser"
        }
    };

    return returnClass;
}