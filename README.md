# page-agent-claw

Page Agent Dashboard CLI - 将浏览器控制页面和 Node 服务整合为一个全局 CLI 命令。

## 功能

- 启动一个集成的 Web 服务器，同时提供前端页面和后端 API
- 前端页面：React 构建的 Dashboard 界面
- 后端服务：Express + WebSocket，支持任务分发和结果收集
- 自动打开浏览器访问页面

## 安装

### 本地调试

```bash
cd page-agent-claw
npm install
npm link
```

### 发布到 npm

```bash
npm publish
npm install -g page-agent-claw
```

## 使用

```bash
page-agent-claw
```

服务启动后会自动打开浏览器访问 http://localhost:4222

## 命令行选项

- `PORT` 环境变量：指定服务器端口（默认 4222）

```bash
PORT=8080 page-agent-claw
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/task` | POST | 提交任务 |
| `/api/clients` | GET | 查看连接的客户端数 |
| `/api/status` | GET | 状态监测 |
| `/proxy/:target` | ALL | 代理请求（解决跨域） |
| WebSocket | WS | 实时通信（端口 4222） |

### POST /api/task

提交任务到已连接的客户端执行。

**请求体：**

```json
{
  "task": "在当前页面执行某个操作",
  "metadata": { }
}
```

**响应：**

```json
{
  "success": true,
  "taskId": "task_1234567890_abc",
  "result": {
    "success": true,
    "data": "执行结果",
    "history": []
  }
}
```

### /api/status 状态码

| 状态码 | 含义 |
|--------|------|
| 100 | 仅 node 服务启动，无 WebSocket 连接（页面未打开） |
| 105 | 有 WebSocket 连接，但 page-agent（扩展）未连接 |
| 200 | 正常（WebSocket + page-agent 已连接） |

**响应示例：**

```json
// 100 无连接
{"code":100,"message":"请打开 localhost:4222 页面","connectedNumber":0}

// 105 有连接但无 page-agent
{"code":105,"message":"page-agent 未连接","connectedNumber":1}

// 200 正常
{"code":200,"message":"正常","connectedNumber":1,"pageAgentCount":1}
```

## 项目结构

```
page-agent-claw/
├── src/
│   ├── server/
│   │   ├── index.ts           # 服务器入口
│   │   ├── types.ts           # 共享类型定义
│   │   ├── middleware/
│   │   │   └── proxy.ts       # 代理中间件
│   │   ├── routes/
│   │   │   └── task.ts        # API 路由
│   │   └── websocket/
│   │       ├── index.ts       # WebSocket 服务
│   │       └── types.ts       # WebSocket 类型
│   └── cli/index.ts           # CLI 入口
├── client/                    # 前端页面源码（React）
├── dist/                      # 构建输出
└── package.json
```

## 开发

```bash
# 安装依赖
npm install
cd client && npm install

# 开发模式
npm run dev

# 构建
npm run build
```
