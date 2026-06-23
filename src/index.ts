import app from "./hono/app";

app.get('/img/:id{.+}', async (c) => {
  const param = c.req.param('id');
  const dotIdx = param.lastIndexOf('.');
  let id: string;
  if (dotIdx > 0) {
    id = param.substring(0, dotIdx);
  } else {
    id = param;
  }

  const file = await c.env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(id).first<any>();

  if (!file) {
    const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f8fafc"/>
      <rect x="275" y="180" width="250" height="250" rx="20" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="400" cy="280" r="40" fill="#94a3b8"/>
      <path d="M300 400 Q400 340 500 400" stroke="#94a3b8" stroke-width="4" fill="none" stroke-linecap="round"/>
      <text x="400" y="490" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#64748b">Image Not Found</text>
      <text x="400" y="525" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#94a3b8">The requested image does not exist or has been removed.</text>
    </svg>`;

    return new Response(placeholder, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' }
    });
  }

  const targetUrl = file.original_url;
  if (!targetUrl) {
    return c.json({ error: "File has no URL" }, 404);
  }

  try {
    const response = await fetch(targetUrl);
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      }
    });
  } catch (e) {
    return c.json({ error: "Failed to fetch image" }, 502);
  }
});

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
