import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface SSEServerOptions {
  port?: number;
  /** Path to a text file containing SSE events line by line */
  responsePath?: string;
  /** Raw SSE data to stream */
  responseData?: string;
  /** Delay between SSE events in ms */
  eventDelay?: number;
  /** Whether to send the [DONE] signal at the end */
  sendDone?: boolean;
}

const DEFAULT_SSE_DATA = [
  'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":" from"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":" mock"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":" server"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
  'data: [DONE]\n\n',
];

export class SSEMockServer {
  private server: Server | null = null;
  private port: number;
  private eventDelay: number;
  private events: string[];

  constructor(options: SSEServerOptions = {}) {
    this.port = options.port ?? 0; // 0 = random available port
    this.eventDelay = options.eventDelay ?? 50;

    if (options.responseData) {
      this.events = options.responseData.split('\n\n').filter(Boolean).map((e) => e + '\n\n');
    } else if (options.responsePath) {
      const content = readFileSync(resolve(__dirname, options.responsePath), 'utf-8');
      this.events = content.split('\n\n').filter(Boolean).map((e) => e + '\n\n');
    } else {
      this.events = options.sendDone === false
        ? DEFAULT_SSE_DATA.slice(0, -1) // Omit [DONE]
        : [...DEFAULT_SSE_DATA];
    }
  }

  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        let index = 0;
        const interval = setInterval(() => {
          if (index < this.events.length) {
            res.write(this.events[index]);
            index++;
          } else {
            clearInterval(interval);
            res.end();
          }
        }, this.eventDelay);

        req.on('close', () => clearInterval(interval));
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
