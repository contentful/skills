import http, { type IncomingMessage, type RequestOptions } from 'node:http';
import https from 'node:https';
import { mock } from 'node:test';

// Preloaded only by CLI integration tests: keep the real HTTP adapter, but send dummy requests
// to the local fixture instead of making outbound TLS connections.
const port = Number(process.env.ENV_ANALYSIS_TEST_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Missing test server port');
const request = http.request.bind(http);
mock.method(https, 'request', (options: RequestOptions, callback?: (response: IncomingMessage) => void) => {
  const authorization = Object.entries(options.headers ?? {}).find(([name]) => name.toLowerCase() === 'authorization');
  if (authorization?.[1] !== 'Bearer stub-token') throw new Error('Only synthetic credentials are allowed');
  return request({ ...options, protocol: 'http:', hostname: '127.0.0.1', port, agent: false }, callback);
});
mock.method(http, 'request', (options: RequestOptions, callback?: (response: IncomingMessage) => void) => {
  if (options.hostname !== '127.0.0.1' || Number(options.port) !== port) throw new Error('Outbound HTTP blocked');
  return request(options, callback);
});
