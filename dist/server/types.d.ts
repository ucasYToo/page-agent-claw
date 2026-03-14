export interface TaskResult {
    taskId: string;
    task: string;
    success: boolean;
    data: string;
    history: unknown[];
    completedAt?: number;
}
export interface PendingRequest {
    taskId: string;
    resolve: (result: TaskResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
}
export interface ClientMessage {
    type: string;
    taskId?: string;
    task?: string;
    success?: boolean;
    data?: string;
    history?: unknown[];
}
//# sourceMappingURL=types.d.ts.map