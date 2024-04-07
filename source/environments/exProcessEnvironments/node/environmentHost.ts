import { ExternalEnvironmentHost } from "../externalEnvironmentHost.js";

var serverScript: string;

function getEnvironmentHost()
{
    const frameworkServerURL = getCLIArgument("frameworkServerURL");
    const environmentID = Number(getCLIArgument("environmentID"));

    return new ExternalEnvironmentHost(frameworkServerURL, environmentID);
}

function prepareScriptLaunchEnvironmentandReturnScriptURL()
{
    const base64LaunchArgs = getCLIArgument("scriptLaunchArgs")

    const scriptLaunchArgs = atob(base64LaunchArgs).split(" ");
    const scriptURL = scriptLaunchArgs[0];
    
    process.argv = ["node", ...scriptLaunchArgs];
}

function getCLIArgument(flag: string)
{
    return process.argv[process.argv.findIndex(flag => flag === `--${flag}`) + 1];
}

const host = getEnvironmentHost();


import(serverScript!);