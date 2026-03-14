import { clients, broadcastTask, generateTaskId, pendingRequests } from '../websocket/index.js';
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export function setupRoutes(app) {
    // POST endpoint to receive task descriptions
    app.post('/api/task', (req, res) => {
        const { task, metadata } = req.body;
        if (!task || typeof task !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Task is required and must be a string'
            });
        }
        const taskId = generateTaskId();
        const connectedClients = broadcastTask(task, taskId, metadata);
        if (connectedClients === 0) {
            // No clients connected, return immediately
            return res.status(200).json({
                success: true,
                message: 'Task queued, but no clients are currently connected',
                connectedClients: 0
            });
        }
        console.log(`Task sent to ${connectedClients} client(s): ${task.substring(0, 50)}... (taskId: ${taskId})`);
        // Wait for result with timeout
        const timeout = setTimeout(() => {
            pendingRequests.delete(taskId);
            console.log(`Task ${taskId} timed out`);
            res.json({
                success: false,
                taskId,
                error: 'Task execution timed out'
            });
        }, TIMEOUT_MS);
        pendingRequests.set(taskId, {
            taskId,
            resolve: (result) => {
                console.log(`Task ${taskId} completed with result:`, result.success ? 'success' : 'error');
                res.json({
                    success: true,
                    taskId,
                    result: {
                        success: result.success,
                        data: result.data,
                        history: result.history
                    }
                });
            },
            reject: (error) => {
                console.error(`Task ${taskId} failed:`, error);
                res.status(500).json({
                    success: false,
                    taskId,
                    error: error.message
                });
            },
            timeout
        });
    });
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            connectedClients: clients.size
        });
    });
    // Get connected clients info
    app.get('/api/clients', (req, res) => {
        res.json({
            count: clients.size
        });
    });
}
//# sourceMappingURL=task.js.map