import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import { SocksClient } from 'socks';
import net from 'net';
import { URL } from 'url';
import { performance } from 'perf_hooks'; // <-- for latency timing

type ProxyResult = {
  proxy: string;
  type: string;
  working: boolean;
  latency?: number;
};

type ProxyParsed = {
  type: 'HTTP' | 'SOCKS4' | 'SOCKS5' | 'UNKNOWN';
  host: string;
  port: number;
};

const app = express();
app.use(cors());
app.use(express.json());

function parseProxyString(proxy: string): ProxyParsed {
  if (!proxy.includes('://')) {
    const [host, portStr] = proxy.split(":");
    const port = parseInt(portStr);
    return { type: 'UNKNOWN', host, port };
  }

  let url: URL;
  try {
    url = new URL(proxy);
  } catch (err) {
    throw new Error(`Invalid proxy format: ${proxy}`);
  }

  const host = url.hostname;
  const port = url.port ? parseInt(url.port) : 80;

  switch (url.protocol) {
    case 'http:':
    case 'https:':
      return { type: 'HTTP', host, port };
    case 'socks4:':
      return { type: 'SOCKS4', host, port };
    case 'socks5:':
      return { type: 'SOCKS5', host, port };
    default:
      throw new Error(`Unsupported proxy protocol: ${url.protocol}`);
  }
}

async function testProxy(rawProxy: string): Promise<ProxyResult> {
  let parsed: ProxyParsed;

  try {
    parsed = parseProxyString(rawProxy);
  } catch (err) {
    console.error(err);
    return { proxy: rawProxy, type: "Invalid", working: false };
  }

  const { host, port, type } = parsed;
  console.log(`Testing proxy: ${rawProxy} -> parsed as ${type}://${host}:${port}`);

  const protocolsToTest = type === 'UNKNOWN'
    ? ['SOCKS5', 'SOCKS4', 'HTTP']
    : [type];

  const startTime = performance.now();

  for (const protocol of protocolsToTest) {
    if (protocol === 'SOCKS5') {
      try {
        console.log(`Trying SOCKS5 for ${rawProxy}`);
        const { socket } = await SocksClient.createConnection({
          proxy: { host, port, type: 5 },
          command: 'connect',
          destination: { host: 'api.ipify.org', port: 80 },
          timeout: 5000
        });

        socket.write("GET / HTTP/1.1\r\nHost: api.ipify.org\r\nConnection: close\r\n\r\n");
        const response = await readResponse(socket);
        if (response.includes("HTTP/1.1 200 OK")) {
          const endTime = performance.now();
          console.log(`SOCKS5 test succeeded for ${rawProxy}`);
          return { proxy: rawProxy, type: "SOCKS5", working: true, latency: Math.round(endTime - startTime) };
        }
      } catch (err) {
        console.warn(`SOCKS5 failed for ${rawProxy}:`, err);
      }
    }

    if (protocol === 'SOCKS4') {
      try {
        console.log(`Trying SOCKS4 for ${rawProxy}`);
        const { socket } = await SocksClient.createConnection({
          proxy: { host, port, type: 4 },
          command: 'connect',
          destination: { host: 'api.ipify.org', port: 80 },
          timeout: 5000
        });

        socket.write("GET / HTTP/1.1\r\nHost: api.ipify.org\r\nConnection: close\r\n\r\n");
        const response = await readResponse(socket);
        if (response.includes("HTTP/1.1 200 OK")) {
          const endTime = performance.now();
          console.log(`SOCKS4 test succeeded for ${rawProxy}`);
          return { proxy: rawProxy, type: "SOCKS4", working: true, latency: Math.round(endTime - startTime) };
        }
      } catch (err) {
        console.warn(`SOCKS4 failed for ${rawProxy}:`, err);
      }
    }

    if (protocol === 'HTTP') {
      try {
        console.log(`Trying HTTP proxy for ${rawProxy}`);
        await axios.get("http://api.ipify.org", {
          proxy: { host, port, protocol: "http" },
          timeout: 5000
        });
        const endTime = performance.now();
        console.log(`HTTP proxy succeeded for ${rawProxy}`);
        return { proxy: rawProxy, type: "HTTP", working: true, latency: Math.round(endTime - startTime) };
      } catch (err) {
        console.warn(`HTTP proxy failed for ${rawProxy}:`, err);
      }
    }
  }

  const endTime = performance.now();
  console.log(`All tests failed for ${rawProxy}`);
  return { proxy: rawProxy, type: "Unknown", working: false, latency: Math.round(endTime - startTime) };
}

function readResponse(socket: net.Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    socket.on('data', chunk => data += chunk.toString());
    socket.on('end', () => {
      socket.destroy();
      resolve(data);
    });
    socket.on('error', err => {
      socket.destroy();
      reject(err);
    });
  });
}

app.post("/test", async (req: Request, res: Response) => {
  const proxy: string = req.body.proxy;

  console.log(`-----------------------------------`);
  console.log(`Starting full test for proxy: ${proxy}`);
  try {
    const result = await testProxy(proxy);
    res.json(result);
  } catch (err) {
    console.error(`Unexpected error testing ${proxy}:`, err);
    res.status(500).json({ proxy, type: "Error", working: false });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Proxy checker running on port ${PORT}`);
});
