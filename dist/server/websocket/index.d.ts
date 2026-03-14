import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { TaskResult, PendingRequest } from '../types.js';
export declare const clients: Set<WebSocket>;
export declare const taskResults: Map<string, TaskResult>;
export declare const pendingRequests: Map<string, PendingRequest>;
export declare function generateTaskId(): string;
export declare function broadcastTask(task: string, taskId: string, metadata?: Record<string, unknown>): number;
export declare function createWebSocketServer(server: Server): WebSocketServer;
//# sourceMappingURL=index.d.ts.map