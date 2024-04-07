import { FullStackSetup } from "../source/environments/setups/preDefined/fullStackSetup.js";
import { Browser, User, Server } from "./fullStackTest.decorators.js";


@FullStackSetup.Config("localhost:5000", "server.ts")
export class FullstackTestSuite extends 
{
    onServerSetup()
    {

    }

    onBrowserSetup()
    {

    }

    onPageSetup()
    {


    }

    @User
    prepareLogin()
    {

    }

    @Browser
    checkLoginState()
    {

    }

    @User
    login()
    {

    }

    @Server
    checkLoginReceived()
    {

    }

    @Browser
    checkAccessTokenSaved()
    {

    }

    @User
    navigateToProfile()
    {

    }

    @User 
    changePassword()
    {

    }

    @Server
    checkPasswordChanged()
    {

    }

    @Browser
    checkAccessTokenRevoked()
    {

    }

    @User
    shouldBeRedirectedToLogin()
    {
        
    }
}