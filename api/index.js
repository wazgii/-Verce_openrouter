export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    let targetPath = url.pathname;
    
    if (targetPath.startsWith('/api/index')) {
      targetPath = targetPath.replace('/api/index', '');
    } else if (targetPath.startsWith('/api')) {
      targetPath = targetPath.replace('/api', '');
    }
    
    if (!targetPath || targetPath === '/') {
      targetPath = '/models';
    }

    const targetUrl = `https://openrouter.ai/api/v1${targetPath}`;

    const newHeaders = new Headers(req.headers);
    newHeaders.set('Host', 'openrouter.ai');
    newHeaders.delete('x-forwarded-for');
    newHeaders.delete('x-real-ip');

    const options = {
      method: req.method,
      headers: newHeaders,
      redirect: 'manual'
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req.body;
    }

    const response = await fetch(targetUrl, options);
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
