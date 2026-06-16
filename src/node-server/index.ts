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
console.log(`Node server is running on http://localhost:${port}`);

serve({
  fetch: serverApp.fetch,
  port
});
