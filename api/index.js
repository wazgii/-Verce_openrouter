export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    let targetPath = url.pathname.replace(/^\/api(\/index)?/, '');
    
    if (!targetPath || targetPath === '/') {
      targetPath = '/models';
    }

    const targetUrl = `https://openrouter.ai/api/v1${targetPath}`;

    const headersToForward = [
      'authorization',
      'content-type',
      'x-api-key',
      'openrouter-referrer',
      'x-title',
    ];

    const newHeaders = new Headers();
    headersToForward.forEach(h => {
      const val = req.headers.get(h);
      if (val) newHeaders.set(h, val);
    });

    const options = {
      method: req.method,
      headers: newHeaders,
      redirect: 'follow'
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req.body;
    }

    const response = await fetch(targetUrl, options);

    const responseHeaders = new Headers(response.headers);

    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.set('Cache-Control', 'no-cache, no-transform');
    responseHeaders.set('Connection', 'keep-alive');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
