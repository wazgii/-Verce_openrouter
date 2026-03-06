export default async function handler(req, res) {
  try {
    // 1. 提取并清理请求路径
    let targetPath = req.url;
    if (targetPath.startsWith('/api/index')) {
      targetPath = targetPath.replace('/api/index', '');
    } else if (targetPath.startsWith('/api')) {
      targetPath = targetPath.replace('/api', '');
    }
    
    // 如果路径为空，默认给一个基础路径避免报错
    if (!targetPath || targetPath === '/') {
      targetPath = '/models'; // OpenRouter 的基础测试路径
    }

    // 确保路径以 / 开头
    if (!targetPath.startsWith('/')) {
      targetPath = '/' + targetPath;
    }

    // 2. 拼接 OpenRouter 的官方目标地址
    // 注意：这里已经包含了 /api/v1，所以 n8n 发来 /chat/completions 时，会完美拼接成完整地址
    const targetUrl = `https://openrouter.ai/api/v1${targetPath}`;

    // 3. 组装请求头
    const options = {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      }
    };

    // 提取并透传 Authorization (Bearer Token) - 这是 OpenRouter 验证 Key 的标准方式
    if (req.headers['authorization']) {
      options.headers['authorization'] = req.headers['authorization'];
    }

    // 透传 OpenRouter 推荐的两个可选请求头（如果 n8n 发送了的话）
    if (req.headers['http-referer']) options.headers['http-referer'] = req.headers['http-referer'];
    if (req.headers['x-title']) options.headers['x-title'] = req.headers['x-title'];

    // 4. 处理 POST 请求体
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // 5. 向 OpenRouter 发起请求
    const response = await fetch(targetUrl, options);
    const data = await response.text();

    // 6. 返回结果给 n8n
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(data);

  } catch (error) {
    res.status(500).json({ 
      error: "OpenRouter 代理内部错误", 
      message: error.message
    });
  }
}
