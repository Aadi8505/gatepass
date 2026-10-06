const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, filePath) {
  let resolvedPath = path.join(PUBLIC_DIR, filePath === '/' ? 'index.html' : filePath);

  // Security check to avoid directory traversal
  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(resolvedPath).pipe(res);
  });
}

function handleGatepassProxy(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      const {
        ci_session = '',
        applyFor = '1',
        dateCheckOut = '',
        checkoutTime = '',
        dateCheckIn = '',
        checkinTime = '',
        reason = '',
        gid = ''
      } = data;

      if (!ci_session.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Session token (ci_session) is required'
        }));
        return;
      }

      // Build form-urlencoded payload
      const formParams = new URLSearchParams();
      formParams.append('applyFor', applyFor);
      formParams.append('dateCheckOut', dateCheckOut);
      formParams.append('checkoutTime', checkoutTime);
      formParams.append('dateCheckIn', dateCheckIn);
      formParams.append('checkinTime', checkinTime);
      formParams.append('reason', reason);
      formParams.append('gid', gid);

      const postData = formParams.toString();
      const startTime = Date.now();

      const options = {
        hostname: 'uhostel.chitkarauniversity.edu.in',
        port: 443,
        path: '/gatepass/initSendData',
        method: 'POST',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.7',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'cookie': `ci_session=${ci_session.trim()}`,
          'origin': 'https://uhostel.chitkarauniversity.edu.in',
          'priority': 'u=0, i',
          'referer': 'https://uhostel.chitkarauniversity.edu.in/Gatepass',
          'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
          'content-length': Buffer.byteLength(postData)
        },
        timeout: 15000
      };

      const upstreamReq = https.request(options, (upstreamRes) => {
        let responseBody = '';
        upstreamRes.on('data', chunk => {
          responseBody += chunk;
        });

        upstreamRes.on('end', () => {
          const duration = Date.now() - startTime;
          let parsedBody = responseBody;
          try {
            parsedBody = JSON.parse(responseBody);
          } catch {
            // Keep as string if not JSON
          }

          const isRedirectToLogin = (upstreamRes.statusCode === 302 || upstreamRes.statusCode === 303) && 
            (upstreamRes.headers.location || '').includes('login');

          const isSuccess = (upstreamRes.statusCode >= 200 && upstreamRes.statusCode < 300) && !isRedirectToLogin;

          let friendlyMessage = null;
          if (isRedirectToLogin) {
            friendlyMessage = 'Session expired or invalid ci_session. Please log in to Chitkara UHostel portal and copy a fresh ci_session cookie.';
          }

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            success: isSuccess,
            status: upstreamRes.statusCode,
            statusText: upstreamRes.statusMessage,
            headers: upstreamRes.headers,
            data: parsedBody,
            rawText: responseBody,
            durationMs: duration,
            requestPayload: postData,
            sessionExpired: isRedirectToLogin,
            error: friendlyMessage
          }));
        });
      });

      upstreamReq.on('timeout', () => {
        upstreamReq.destroy();
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Chitkara UHostel server timed out after 15 seconds'
        }));
      });

      upstreamReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Network error connecting to uhostel: ${err.message}`
        }));
      });

      upstreamReq.write(postData);
      upstreamReq.end();
    } catch (parseError) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: `Invalid request payload: ${parseError.message}`
      }));
    }
  });
}

function handleStudentGatepassList(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1e6) req.connection.destroy();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      const { ci_session = '', applyFor = '1' } = data;

      if (!ci_session.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Session token (ci_session) is required'
        }));
        return;
      }

      const formParams = new URLSearchParams();
      formParams.append('applyFor', applyFor);
      formParams.append('dateCheckOut', '');
      formParams.append('checkoutTime', '');
      formParams.append('dateCheckIn', '');
      formParams.append('checkinTime', '');
      formParams.append('reason', '');

      const postData = formParams.toString();
      const startTime = Date.now();

      const options = {
        hostname: 'uhostel.chitkarauniversity.edu.in',
        port: 443,
        path: '/gatepass/studentListGatePass',
        method: 'POST',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.7',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'cookie': `ci_session=${ci_session.trim()}`,
          'origin': 'https://uhostel.chitkarauniversity.edu.in',
          'priority': 'u=0, i',
          'referer': 'https://uhostel.chitkarauniversity.edu.in/Gatepass',
          'sec-ch-ua': '"Chromium";v="154", "Brave";v="154", "Not A(Brand";v="99"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'user-agent': 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
          'content-length': Buffer.byteLength(postData)
        },
        timeout: 15000
      };

      const upstreamReq = https.request(options, (upstreamRes) => {
        let responseBody = '';
        upstreamRes.on('data', chunk => {
          responseBody += chunk;
        });

        upstreamRes.on('end', () => {
          const duration = Date.now() - startTime;
          let parsedData = null;
          try {
            parsedData = JSON.parse(responseBody);
          } catch {
            // Not JSON
          }

          const isRedirectToLogin = (upstreamRes.statusCode === 302 || upstreamRes.statusCode === 303) ||
            (upstreamRes.headers.location || '').includes('login');

          if (isRedirectToLogin) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({
              success: false,
              sessionExpired: true,
              error: 'Session expired or invalid ci_session. Please update your cookie.'
            }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({
            success: upstreamRes.statusCode >= 200 && upstreamRes.statusCode < 300,
            status: upstreamRes.statusCode,
            data: parsedData,
            rawText: responseBody,
            durationMs: duration
          }));
        });
      });

      upstreamReq.on('timeout', () => {
        upstreamReq.destroy();
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Chitkara UHostel timed out' }));
      });

      upstreamReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: `Network error: ${err.message}` }));
      });

      upstreamReq.write(postData);
      upstreamReq.end();
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  });
}


const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/send-gatepass' && req.method === 'POST') {
    handleGatepassProxy(req, res);
    return;
  }

  if (url.pathname === '/api/student-gatepasses' && req.method === 'POST') {
    handleStudentGatepassList(req, res);
    return;
  }


  if (url.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Fallback to static files
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Gatepass Dispatcher running at http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from ${PUBLIC_DIR}`);
  console.log(`⚡ Proxy API active at /api/send-gatepass`);
  console.log(`=======================================================`);
});
