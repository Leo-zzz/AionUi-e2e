import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import * as net from 'net';

export interface ProxyServerOptions {
  port?: number;
  /** Reject all CONNECT requests (simulate proxy refusing connections) */
  rejectConnections?: boolean;
  /** Return custom status codes for specific hosts */
  customResponses?: Record<string, number>;
}

export class ProxyMockServer {
  private server: Server | null = null;
  private port: number;
  private rejectConnections: boolean;
  private customResponses: Record<string, number>;

  constructor(options: ProxyServerOptions = {}) {
    this.port = options.port ?? 0;
    this.rejectConnections = options.rejectConnections ?? false;
    this.customResponses = options.customResponses ?? {};
  }

  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        // Handle regular HTTP proxy requests
        const host = req.headers.host ?? '';
        if (this.customResponses[host]) {
          res.writeHead(this.customResponses[host]);
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Proxy OK');
      });

      // Handle CONNECT method for HTTPS tunneling
      this.server.on('connect', (req: IncomingMessage, clientSocket: net.Socket, head: Buffer) => {
        if (this.rejectConnections) {
          clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
          clientSocket.destroy();
          return;
        }

        const [host, port] = (req.url ?? '').split(':');
        const serverSocket = net.connect(parseInt(port) || 443, host, () => {
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          serverSocket.write(head);
          serverSocket.pipe(clientSocket);
          clientSocket.pipe(serverSocket);
        });

        serverSocket.on('error', () => {
          clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
          clientSocket.destroy();
        });
      });

      this.server.listen(this.port, () => {
        const addr = this.server!.address();
        this.port = typeof addr === 'object' ? addr!.port : this.port;
        resolve(this.port);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }
}
