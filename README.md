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
| `/api/clients` | GET | 查看连接的客户端 |
| WebSocket | WS | 实时通信（端口 4222） |

## 项目结构

```
page-agent-claw/
├── src/
│   ├── server/index.ts    # 服务器（Express + WebSocket）
│   └── cli/index.ts       # CLI 入口
├── client/                # 前端页面源码
├── dist/                  # 构建输出
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
