#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');
const PORT = process.env.PORT || 4222;
async function checkServer() {
    return new Promise((resolve) => {
        const req = createServer((req, res) => {
            res.writeHead(200);
            res.end('ok');
        });
        req.on('error', () => {
            // Port is in use, server is running
            resolve(true);
        });
        req.listen(PORT, () => {
            // Port is free, no server running
            req.close(() => resolve(false));
        });
    });
}
function startServer() {
    console.log('Starting server...');
    const server = spawn('node', ['dist/server/index.js'], {
        cwd: projectRoot,
        shell: true,
        stdio: 'inherit',
        env: { ...process.env, PORT: String(PORT) }
    });
    server.on('error', (err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
    return server;
}
function openBrowser() {
    const url = `http://localhost:${PORT}`;
    console.log(`Opening browser at ${url}...`);
    const browser = spawn('open', [url], {
        detached: true,
        shell: true
    });
    browser.on('error', (err) => {
        console.warn('Failed to open browser automatically:', err.message);
        console.log(`Please open ${url} in your browser`);
    });
    browser.unref();
}
async function main() {
    try {
        // Check for version flag
        const args = process.argv.slice(2);
        if (args.includes('-v') || args.includes('--version')) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const packageJson = require('../package.json');
            console.log(`page-agent-claw v${packageJson.version}`);
            return;
        }
        // Check if port is already in use
        const isRunning = await checkServer();
        if (isRunning) {
            console.log(`Server is already running on port ${PORT}`);
            console.log(`Open http://localhost:${PORT} in your browser`);
            return;
        }
        // Start server directly (dist is already built in published package)
        startServer();
        // Wait a bit for server to start
        setTimeout(() => {
            openBrowser();
        }, 1000);
        console.log(`\nServer is running at http://localhost:${PORT}`);
        console.log('Press Ctrl+C to stop the server');
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map