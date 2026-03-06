// 这一行极其关键：强制开启 Edge 边缘计算模式，完美支持大模型流式输出
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    let targetPath = url.pathname;
    
    // 清理路径
    if (targetPath.startsWith('/api/index')) {
      targetPath = targetPath.replace('/api/index', '');
    } else if (targetPath.startsWith('/api')) {
      targetPath = targetPath.replace('/api', '');
    }
    
    if (!targetPath || targetPath === '/') {
      targetPath = '/models';
    }

    // 拼接 OpenRouter 地址
    const targetUrl = `https://openrouter.ai/api/v1${targetPath}`;

    // 复制请求头，并清理可能暴露代理身份的头部
    const newHeaders = new Headers(req.headers);
    newHeaders.set('Host', 'openrouter.ai');
    newHeaders.delete('x-forwarded-for');
    newHeaders.delete('x-real-ip');

    // 组装新请求
    const options = {
      method: req.method,
      headers: newHeaders,
      redirect: 'manual'
    };

    // Edge 环境下，req.body 是一个原生的数据流，直接透传，无需序列化！
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req.body;
    }

    // 发起请求
    const response = await fetch(targetUrl, options);
    
    // 原封不动地将 OpenRouter 的响应（包括流式 Stream）返回给客户端
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
