import { useRef, useEffect } from 'react'
import type { AgentStatus, AgentActivity, ExecutionResult } from '../types/pageAgent'

interface ResultsPanelProps {
  status: AgentStatus
  activities: AgentActivity[]
  result: ExecutionResult | null
  startTime: number | null
}

const statusLabels: Record<AgentStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  completed: 'Completed',
  error: 'Error',
}

function ActivityIcon({ activity }: { activity: AgentActivity }) {
  switch (activity.type) {
    case 'thinking':
      return <span className="activity-icon thinking">💭</span>
    case 'executing':
      return <span className="activity-icon executing">⚡</span>
    case 'executed':
      return <span className="activity-icon executed">✓</span>
    case 'retrying':
      return <span className="activity-icon retrying">🔄</span>
    case 'error':
      return <span className="activity-icon error">✕</span>
    default:
      return <span className="activity-icon">•</span>
  }
}

function ActivityContent({ activity }: { activity: AgentActivity }) {
  switch (activity.type) {
    case 'thinking':
      return <span>Thinking...</span>
    case 'executing':
      return (
        <span>
          Executing: <code>{activity.tool}</code>
        </span>
      )
    case 'executed':
      return (
        <div className="activity-executed-content">
          <div>
            Executed: <code>{activity.tool}</code>
            <span className="duration">({activity.duration}ms)</span>
          </div>
          {activity.output && (
            <pre className="activity-output">{activity.output}</pre>
          )}
        </div>
      )
    case 'retrying':
      return (
        <span>
          Retrying (attempt {activity.attempt}/{activity.maxAttempts})
        </span>
      )
    case 'error':
      return <span className="error-text">{activity.message}</span>
    default:
      return null
  }
}

export function ResultsPanel({ status, activities, result, startTime }: ResultsPanelProps) {
  const activityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activityRef.current) {
      activityRef.current.scrollTop = activityRef.current.scrollHeight
    }
  }, [activities])

  const elapsed = startTime ? Date.now() - startTime : 0
  const elapsedSeconds = Math.floor(elapsed / 1000)
  const elapsedStr = elapsedSeconds > 0 ? `${elapsedSeconds}s` : ''

  return (
    <div className="results-panel">
      <div className="status-card">
        <h2 className="section-title">
          <span className="section-icon">📊</span>
          Status
        </h2>
        <div className={`status-badge status-${status}`}>
          <span className={`status-dot ${status === 'running' ? 'pulse' : ''}`} />
          {statusLabels[status]}
          {status === 'running' && elapsedStr && (
            <span className="elapsed-time">{elapsedStr}</span>
          )}
        </div>
      </div>

      <div className="activity-section">
        <h2 className="section-title">
          <span className="section-icon">📋</span>
          Activity Log
        </h2>
        <div className="activity-log" ref={activityRef}>
          {activities.length === 0 ? (
            <div className="empty-state">
              No activity yet. Execute a task to see logs.
            </div>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className={`activity-item activity-${activity.type}`}>
                <ActivityIcon activity={activity} />
                <ActivityContent activity={activity} />
              </div>
            ))
          )}
        </div>
      </div>

      {result && (
        <div className="result-section">
          <h2 className="section-title">
            <span className="section-icon">📄</span>
            Result
          </h2>
          <div className={`result-card ${result.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <span className={`result-status ${result.success ? 'success' : 'error'}`}>
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>
            {result.data && (
              <pre className="result-data">{result.data}</pre>
            )}
            {result.history && result.history.length > 0 && (
              <div className="history-section">
                <h3>History ({result.history.length} events)</h3>
                <div className="history-list">
                  {result.history.map((event, index) => (
                    <div key={index} className={`history-item history-${event.type}`}>
                      <span className="history-type">{event.type}</span>
                      {'content' in event && (
                        <span className="history-content">{String((event as { content?: string }).content || '').slice(0, 100)}</span>
                      )}
                      {'message' in event && (
                        <span className="history-content">{String((event as { message?: string }).message || '').slice(0, 100)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
