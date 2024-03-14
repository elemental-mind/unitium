import { WebSocketServer } from 'ws';

class TestEnvironmentOrchestrator
{
    wsServer!: WebSocketServer;
    private environmentCount = 0;

    constructor(portRange = [8000, 8100]) {
        let port;
        for (port = portRange[0]; port < portRange[1]; port++) {
            try 
            {
            this.wsServer = new WebSocketServer({ port });
            break;
            }
            catch(e)
            {
                continue;
            }
        }

        console.log(`WebSocket server started on port ${port}`);
    }

    getEnvironmentID()
    {
        this.environmentCount++;
        return this.environmentCount.toString();
    }
}

export const testCoordinator = new TestEnvironmentOrchestrator();