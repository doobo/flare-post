import { LocalKV } from './kv';
import { LocalD1 } from './db';
import { MiddlewareHandler } from 'hono';

export const localBindings = {
  DB: new LocalD1('./local-node.db') as unknown as any,
  KV: new LocalKV() as unknown as any,
  ASSETS: {
    fetch: async (req: Request) => {
      return new Response('Not Found', { status: 404 });
    }
  }
};

export const localBindingsMiddleware: MiddlewareHandler = async (c, next) => {
  c.env = { ...(c.env as any), ...localBindings };
  
  Object.defineProperty(c, 'executionCtx', {
    value: {
      waitUntil: (p: Promise<any>) => { p.catch(console.error) },
      passThroughOnException: () => {}
    },
    writable: true,
    configurable: true
  });

  await next();
};
