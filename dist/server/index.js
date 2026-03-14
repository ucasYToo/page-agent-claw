import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4222;
// Client build output is in dist/client relative to project root
const CLIENT_PATH = path.resolve(__dirname, '../../dist/client');
// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from client build
app.use(express.static(CLIENT_PATH));
// Store connected WebSocket clients
const clients = new Set();
const taskResults = new Map();
const pendingRequests = new Map();
// Create HTTP server
const server = createServer(app);
// Create WebSocket server
const wss = new WebSocketServer({ server });
// Generate unique task ID
function generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');
    clients.add(ws);
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Page Agent Server'
    }));
    // Handle messages from client
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('Received from client:', message);
            // Handle task result from client
            if (message.type === 'taskResult' && message.taskId) {
                const result = {
                    taskId: message.taskId,
                    task: message.task || '',
                    success: message.success ?? false,
                    data: message.data || '',
                    history: message.history || [],
                    completedAt: Date.now()
                };
                // Store the result
                taskResults.set(message.taskId, result);
                // Check if there's a pending request waiting for this result
                const pending = pendingRequests.get(message.taskId);
                if (pending) {
                    clearTimeout(pending.timeout);
                    pending.resolve(result);
                    pendingRequests.delete(message.taskId);
                }
                // Acknowledge receipt
                ws.send(JSON.stringify({
                    type: 'resultAcknowledged',
                    taskId: message.taskId
                }));
                return;
            }
            // Echo back for confirmation (optional)
            ws.send(JSON.stringify({
                type: 'acknowledged',
                originalMessage: message
            }));
        }
        catch (err) {
            console.error('Failed to parse message:', err);
        }
    });
    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
    // Handle errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        clients.delete(ws);
    });
});
// Broadcast task to all connected clients
function broadcastTask(task, taskId, metadata) {
    const message = JSON.stringify({
        type: 'task',
        taskId,
        task,
        metadata,
        timestamp: Date.now()
    });
    let connectedCount = 0;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            connectedCount++;
        }
    });
    return connectedCount;
}
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
    // Wait for result with timeout (5 minutes)
    const TIMEOUT_MS = 5 * 60 * 1000;
    // Set response as pending - don't send response yet
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
// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(CLIENT_PATH, 'index.html'));
    }
});
// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}`);
    console.log(`Serving static files from: ${CLIENT_PATH}`);
});
export default server;
//# sourceMappingURL=index.js.map