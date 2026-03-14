// Message from client
export interface ClientMessage {
  type: string;
  taskId?: string;
  task?: string;
  success?: boolean;
  data?: string;
  history?: unknown[];
  status?: 'connected' | 'disconnected';
}
