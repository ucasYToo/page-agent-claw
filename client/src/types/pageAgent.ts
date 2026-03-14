export type AgentStatus = 'idle' | 'running' | 'completed' | 'error'

export type AgentActivity =
  | { type: 'thinking' }
  | { type: 'executing'; tool: string; input: unknown }
  | { type: 'executed'; tool: string; input: unknown; output: string; duration: number }
  | { type: 'retrying'; attempt: number; maxAttempts: number }
  | { type: 'error'; message: string }

export type HistoricalEvent =
  | { type: 'step'; stepIndex: number; reflection: unknown; action: unknown }
  | { type: 'observation'; content: string }
  | { type: 'user_takeover' }
  | { type: 'retry'; message: string; attempt: number; maxAttempts: number }
  | { type: 'error'; message: string; rawResponse?: unknown }

export interface ExecutionResult {
  success: boolean
  data: string
  history: HistoricalEvent[]
}

export interface ExecuteConfig {
  baseURL: string
  apiKey: string
  model: string
  includeInitialTab?: boolean
  onStatusChange?: (status: AgentStatus) => void
  onActivity?: (activity: AgentActivity) => void
  onHistoryUpdate?: (history: HistoricalEvent[]) => void
}

export type Execute = (task: string, config: ExecuteConfig) => Promise<ExecutionResult>

export interface PageAgentExt {
  version: string
  execute: Execute
  stop: () => void
}

declare global {
  interface Window {
    PAGE_AGENT_EXT_VERSION?: string
    PAGE_AGENT_EXT?: PageAgentExt
  }
}
