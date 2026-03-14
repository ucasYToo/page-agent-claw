import { useState, useEffect, useCallback, useRef } from "react";
import { ConfigurationPanel, ResultsPanel } from "./components";
import type {
  AgentStatus,
  AgentActivity,
  ExecutionResult,
} from "./types/pageAgent";
import "./App.css";

const WS_URL = "ws://localhost:4222";
const PROXY_PREFIX = "http://localhost:4222/proxy/";

// Convert baseURL to proxy URL
function toProxyUrl(baseURL: string): string {
  // Remove protocol from baseURL
  const urlWithoutProtocol = baseURL.replace(/^https?:\/\//, '');
  // URL encode and prepend proxy prefix
  return `${PROXY_PREFIX}${encodeURIComponent(urlWithoutProtocol)}`;
}

// Module-level flag to prevent multiple WebSocket connections
let wsInitialized = false;

// Report page agent status to server
function reportPageStatus(ws: WebSocket, hasExtension: boolean) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'pageStatus',
      status: hasExtension ? 'connected' : 'disconnected'
    }));
  }
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("PageAgentExtUserAuthToken") || "");
  const [baseURL, setBaseURL] = useState(localStorage.getItem("pageAgent_baseURL") || "");
  const [apiKey, setApiKey] = useState("NA");
  const [model, setModel] = useState(localStorage.getItem("pageAgent_model") || 'gpt-5.2');
  const [task, setTask] = useState("");
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);
  const handleExecuteRef = useRef<() => void>(() => {});

  // Save non-sensitive settings
  useEffect(() => {
    if (baseURL) {
      localStorage.setItem("pageAgent_baseURL", baseURL);
    }
  }, [baseURL]);

  useEffect(() => {
    if (model) {
      localStorage.setItem("pageAgent_model", model);
    }
  }, [model]);

  // Check for extension and report status to server
  useEffect(() => {
    let previousHasExtension = false;

    const checkExtension = () => {
      setIsChecking(true);
      console.log("window.PAGE_AGENT_EXT", window.PAGE_AGENT_EXT);
      const hasExtension = !!window.PAGE_AGENT_EXT;
      setIsConnected(hasExtension);

      // Report status to server when extension status changes
      if (hasExtension !== previousHasExtension) {
        const ws = wsRef.current;
        if (ws) {
          reportPageStatus(ws, hasExtension);
        }
        previousHasExtension = hasExtension;
      }

      setIsChecking(false);
      return hasExtension;
    };

    checkExtension();
    const interval = setInterval(() => {
      const res = checkExtension()
      if (res) clearInterval(interval)
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket connection for receiving tasks from server
  useEffect(() => {
    // Prevent multiple connections in React StrictMode
    if (wsInitialized) {
      return;
    }
    wsInitialized = true;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isConnected = false;

    const connectWebSocket = () => {
      if (isConnected) return;
      console.log('connectWebSocket----')
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to server');
        isConnected = true;
        setWsConnected(true);
        // Report current extension status to server
        if (ws) {
          reportPageStatus(ws, !!window.PAGE_AGENT_EXT);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);

          if (data.type === 'task' && data.task) {
            setTask(data.task);
            currentTaskIdRef.current = data.taskId || null;
            // Auto-execute when task received and config is ready
            if (window.PAGE_AGENT_EXT && token && baseURL && apiKey && model) {
              setTimeout(() => handleExecuteRef.current(), 100);
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        wsRef.current = null;
        // Auto reconnect after 3 seconds
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    };

    connectWebSocket();

    return () => {
      isConnected = false;
      // Don't reset wsInitialized here to prevent StrictMode double-mount issue
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle execute function
  const handleExecute = useCallback(async () => {
    if (
      !window.PAGE_AGENT_EXT ||
      !token ||
      !baseURL ||
      !apiKey ||
      !model ||
      !task
    ) {
      return;
    }

    setStatus("running");
    setActivities([]);
    setResult(null);
    setStartTime(Date.now());

    try {
      const execResult = await window.PAGE_AGENT_EXT.execute(task, {
        baseURL: toProxyUrl(baseURL),
        apiKey,
        model,
        includeInitialTab: true,
        onStatusChange: (newStatus) => {
          setStatus(newStatus);
          if (newStatus === "idle") {
            setStartTime(null);
          }
        },
        onActivity: (activity) => {
          setActivities((prev) => [...prev, activity]);
        },
      });

      setResult(execResult);
      setStatus(execResult.success ? "completed" : "error");
      setStartTime(null);

      // Send result back to server via WebSocket
      if (currentTaskIdRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'taskResult',
          taskId: currentTaskIdRef.current,
          task: task,
          success: execResult.success,
          data: execResult.data,
          history: execResult.history
        }));
        currentTaskIdRef.current = null;
      }
    } catch (err) {
      setStatus("error");
      setResult({
        success: false,
        data: String(err),
        history: [],
      });
      setStartTime(null);

      // Send error result back to server via WebSocket
      if (currentTaskIdRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'taskResult',
          taskId: currentTaskIdRef.current,
          task: task,
          success: false,
          data: String(err),
          history: []
        }));
        currentTaskIdRef.current = null;
      }
    }
  }, [token, baseURL, apiKey, model, task]);

  // Update ref when handleExecute changes
  useEffect(() => {
    handleExecuteRef.current = () => {
      handleExecute();
    };
  }, [handleExecute]);

  const handleStop = useCallback(() => {
    if (window.PAGE_AGENT_EXT) {
      window.PAGE_AGENT_EXT.stop();
      setStatus("idle");
      setStartTime(null);
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🤖</span>
            Page Agent Dashboard
          </h1>
          <div
            className={`extension-status ${isChecking ? "checking" : isConnected ? "connected" : "disconnected"}`}
          >
            <span className={`status-indicator ${isChecking ? "pulse" : ""}`} />
            {isChecking
              ? "Checking..."
              : isConnected
                ? "Extension Connected"
                : "Extension Not Found"}
          </div>
          <div
            className={`extension-status ${wsConnected ? "connected" : "disconnected"}`}
            style={{ marginLeft: '12px' }}
          >
            <span className="status-indicator" />
            {wsConnected ? "Server Connected" : "Server Disconnected"}
          </div>
        </div>
      </header>

      <div className="intro-banner">
        <div className="intro-content">
          <h2>关于本服务</h2>
          <p>
            本服务将在本地启动 Node 服务，用于连接 Page Agent Chrome 扩展插件。
            Page Agent Chrome 插件说明请参考
            <a href="https://alibaba.github.io/page-agent/docs/features/chrome-extension" target="_blank" rel="noopener noreferrer">
              官方文档
            </a>
          </p>
          <p className="intro-en">
            This service starts a local Node server to connect to the Page Agent Chrome extension.
            Please refer to the <a href="https://alibaba.github.io/page-agent/docs/features/chrome-extension" target="_blank" rel="noopener noreferrer">official documentation</a> for more details.
          </p>
        </div>
      </div>

      <main className="main">
        {!isConnected && !isChecking && (
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <div className="warning-content">
              <strong>Extension not detected</strong>
              <p>
                Please install the Page Agent extension and set your auth token.
              </p>
            </div>
          </div>
        )}

        <div className="content-grid">
          <ConfigurationPanel
            token={token}
            setToken={setToken}
            baseURL={baseURL}
            setBaseURL={setBaseURL}
            apiKey={apiKey}
            setApiKey={setApiKey}
            model={model}
            setModel={setModel}
            task={task}
            setTask={setTask}
            isConnected={isConnected}
            status={status}
            onExecute={handleExecute}
            onStop={handleStop}
          />

          <ResultsPanel
            status={status}
            activities={activities}
            result={result}
            startTime={startTime}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
