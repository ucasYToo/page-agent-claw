import { Request, Response } from 'express';

// Proxy middleware - forward requests to target domains
export function createProxyMiddleware() {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { target } = req.params;
      const decodedTarget = decodeURIComponent(target);
      let targetUrl = `https://${decodedTarget}`;

      console.log(`Proxying request to: ${targetUrl}`);

      // Read body
      const bodyStr = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);

      // Forward the request to target
      const headers: Record<string, string> = {};
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key !== 'host' && key !== 'content-length' && value) {
          headers[key] = Array.isArray(value) ? value[0] : value;
        }
      });

      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: bodyStr,
        // @ts-ignore - Node 22+ supports this
        duplex: 'half',
      });

      // Set response headers
      response.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key)) {
          res.setHeader(key, value);
        }
      });

      // Send response
      const data = await response.text();
      console.log('Response status:', response.status);
      res.status(response.status).send(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: String(error) });
    }
  };
}
