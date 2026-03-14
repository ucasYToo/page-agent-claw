import { useState, useEffect } from 'react'
import type { AgentStatus } from '../types/pageAgent'

interface ConfigurationPanelProps {
  token: string
  setToken: (token: string) => void
  baseURL: string
  setBaseURL: (url: string) => void
  apiKey: string
  setApiKey: (key: string) => void
  model: string
  setModel: (model: string) => void
  task: string
  setTask: (task: string) => void
  isConnected: boolean
  status: AgentStatus
  onExecute: () => void
  onStop: () => void
}

export function ConfigurationPanel({
  token,
  setToken,
  baseURL,
  setBaseURL,
  apiKey,
  setApiKey,
  model,
  setModel,
  task,
  setTask,
  isConnected,
  status,
  onExecute,
  onStop,
}: ConfigurationPanelProps) {
  const [showToken, setShowToken] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const isRunning = status === 'running'
  const canExecute = isConnected && token && baseURL && apiKey && model && task && !isRunning

  useEffect(() => {
    localStorage.setItem('PageAgentExtUserAuthToken', token)
  }, [token])

  return (
    <div className="config-panel">
      <div className="panel-section">
        <h2 className="section-title">
          <span className="section-icon">⚙</span>
          Authorization
        </h2>
        <div className="input-group">
          <label htmlFor="token">Auth Token</label>
          <div className="password-input">
            <input
              id="token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your auth token"
              disabled={isRunning}
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
          <span className="input-hint">
            Get token from extension side panel
          </span>
        </div>
      </div>

      <div className="panel-section">
        <h2 className="section-title">
          <span className="section-icon">🔗</span>
          LLM Settings
        </h2>
        <div className="input-group">
          <label htmlFor="baseURL">Base URL</label>
          <input
            id="baseURL"
            type="text"
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            placeholder="https://api.openai.com/v1"
            disabled={isRunning}
          />
        </div>
        <div className="input-group">
          <label htmlFor="apiKey">API Key</label>
          <div className="password-input">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              disabled={isRunning}
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="model">Model</label>
          <input
            id="model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-5.2"
            disabled={isRunning}
          />
        </div>
      </div>

      <div className="panel-section">
        <h2 className="section-title">
          <span className="section-icon">📝</span>
          Task
        </h2>
        <div className="input-group">
          <label htmlFor="task">Task Description</label>
          <textarea
            id="task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe what you want the agent to do..."
            rows={4}
            disabled={isRunning}
          />
        </div>
      </div>

      <div className="action-buttons">
        {!isRunning ? (
          <button
            className="btn btn-primary"
            onClick={onExecute}
            disabled={!canExecute}
          >
            <span className="btn-icon">▶</span>
            Execute Task
          </button>
        ) : (
          <button
            className="btn btn-danger"
            onClick={onStop}
          >
            <span className="btn-icon">■</span>
            Stop
          </button>
        )}
      </div>
    </div>
  )
}
