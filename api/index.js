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

    const newHeaders = new Headers();
    const headersToForward = ['authorization', 'content-type', 'x-title', 'openrouter-referrer'];
    headersToForward.forEach(h => {
      const val = req.headers.get(h);
      if (val) newHeaders.set(h, val);
    });

    const options = {
      method: req.method,
      headers: newHeaders,
      redirect: 'follow',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req.body;
    }

    const response = await fetch(targetUrl, options);

    const { readable, writable } = new TransformStream();
    
    response.body.pipeTo(writable);

    return new Response(readable, {
      status: response.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
