// Task result storage
export interface TaskResult {
  taskId: string;
  task: string;
  success: boolean;
  data: string;
  history: unknown[];
  completedAt?: number;
}

// Pending requests waiting for task results
export interface PendingRequest {
  taskId: string;
  resolve: (result: TaskResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// Message from client
export interface ClientMessage {
  type: string;
  taskId?: string;
  task?: string;
  success?: boolean;
  data?: string;
  history?: unknown[];
}
