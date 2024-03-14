import { Browser, User, Server } from "./fullStackTest.decorators.js";

export class FullStackTest
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