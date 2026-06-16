import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import app from '../index';
import { localBindingsMiddleware } from './bindings';

const serverApp = new Hono();

// Inject local bindings middleware
serverApp.use('*', localBindingsMiddleware);

// Mount main app
serverApp.route('/', app);

const port = 3000;
const hostname = '0.0.0.0';

function getLANIP(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

console.log(`Backend: http://localhost:${port}`);
console.log(`Backend LAN: http://${getLANIP()}:${port}`);

serve({
  fetch: serverApp.fetch,
  port,
  hostname
});
