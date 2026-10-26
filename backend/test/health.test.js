const http = require('http');
const app = require('../src/app');

// Run tests using native http server on ephemeral port
const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Test Runner] Test server listening on port ${port}`);

  let failed = false;

  const request = (path, method = 'GET') => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: body });
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  };

  try {
    // Test 1: GET /api/health
    console.log('[Test 1] Testing GET /api/health...');
    const healthRes = await request('/api/health');
    console.log('Response:', healthRes);

    if (
      healthRes.status === 200 &&
      healthRes.data.success === true &&
      healthRes.data.message === 'Backend is running'
    ) {
      console.log('✔ Test 1 Passed: Health check endpoint responded correctly.');
    } else {
      console.error('❌ Test 1 Failed: Unexpected response from /api/health');
      failed = true;
    }

    // Test 2: GET /api/not-found (404 handling)
    console.log('\n[Test 2] Testing 404 Handler on unknown route...');
    const notFoundRes = await request('/api/unknown-endpoint');
    console.log('Response:', notFoundRes);

    if (notFoundRes.status === 404 && notFoundRes.data.success === false) {
      console.log('✔ Test 2 Passed: 404 error handler returned formatted JSON.');
    } else {
      console.error('❌ Test 2 Failed: Unexpected response for 404');
      failed = true;
    }

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 All backend foundation tests passed successfully!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
