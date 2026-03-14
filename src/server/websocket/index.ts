import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { TaskResult, PendingRequest } from '../types.js';
import { ClientMessage } from './types.js';

// Store connected WebSocket clients
export const clients: Set<WebSocket> = new Set();

// Store page-agent clients (clients that have reported their extension status)
export const pageAgentClients: Set<WebSocket> = new Set();

// Task result storage
export const taskResults: Map<string, TaskResult> = new Map();

// Pending requests waiting for task results
export const pendingRequests: Map<string, PendingRequest> = new Map();

// Generate unique task ID
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Broadcast task to all connected clients
export function broadcastTask(task: string, taskId: string, metadata?: Record<string, unknown>): number {
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

// Create and configure WebSocket server
export function createWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

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
        const message = JSON.parse(data.toString()) as ClientMessage;
        console.log('Received from client:', message);

        // Handle task result from client
        if (message.type === 'taskResult' && message.taskId) {
          const result: TaskResult = {
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

        // Handle page status from client
        if (message.type === 'pageStatus') {
          if (message.status === 'connected') {
            pageAgentClients.add(ws);
            console.log('Page agent connected, total:', pageAgentClients.size);
          } else {
            pageAgentClients.delete(ws);
            console.log('Page agent disconnected, total:', pageAgentClients.size);
          }
          return;
        }

        // Echo back for confirmation (optional)
        ws.send(JSON.stringify({
          type: 'acknowledged',
          originalMessage: message
        }));
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
      pageAgentClients.delete(ws);
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      clients.delete(ws);
    });
  });

  return wss;
}
