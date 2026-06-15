import app from "./hono/app";

// Catch-all for assets/frontend SPA fallback
app.get('*', async (c) => {
  let response = await c.env.ASSETS.fetch(c.req.raw);
  if (response.status === 404) {
    const url = new URL(c.req.url);
    url.pathname = '/';
    return c.env.ASSETS.fetch(new Request(url, c.req.raw));
  }
  return response;
});

export default app;
