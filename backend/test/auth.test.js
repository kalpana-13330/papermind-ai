const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Auth Test Runner] Test server listening on port ${port}`);

  let failed = false;

  const request = (path, method = 'GET', data = null, token = null) => {
    return new Promise((resolve, reject) => {
      const payload = data ? JSON.stringify(data) : null;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (payload) {
        headers['Content-Length'] = Buffer.byteLength(payload);
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers,
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
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  };

  try {
    // 0. Connect to DB and clean test user collection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_paper_summarizer';
    await mongoose.connect(mongoUri);
    console.log('[Auth Test Runner] Connected to MongoDB for testing.');

    const testEmail = `testuser_${Date.now()}@example.com`;
    await User.deleteMany({ email: { $regex: /@example\.com$/i } });

    // 1. Validation Failures on Register
    console.log('\n[Test 1] Testing Register validation errors...');
    const invalidReg = await request('/api/auth/register', 'POST', {
      name: 'A',
      email: 'invalid-email',
      password: '123',
    });
    if (invalidReg.status === 400 && invalidReg.data.success === false) {
      console.log('✔ Test 1 Passed: Validation correctly rejected invalid register fields.');
    } else {
      console.error('❌ Test 1 Failed:', invalidReg);
      failed = true;
    }

    // 2. Successful Registration
    console.log('\n[Test 2] Testing successful Registration...');
    const regRes = await request('/api/auth/register', 'POST', {
      name: 'Dr. Jane Doe',
      email: testEmail,
      password: 'securePassword123',
    });
    let authToken = null;
    if (
      regRes.status === 201 &&
      regRes.data.success === true &&
      regRes.data.data.token &&
      regRes.data.data.user.email === testEmail &&
      regRes.data.data.user.password === undefined
    ) {
      authToken = regRes.data.data.token;
      console.log('✔ Test 2 Passed: User registered, token generated, password excluded.');
    } else {
      console.error('❌ Test 2 Failed:', regRes);
      failed = true;
    }

    // 3. Duplicate Email Prevention
    console.log('\n[Test 3] Testing duplicate email registration...');
    const dupRes = await request('/api/auth/register', 'POST', {
      name: 'Duplicate User',
      email: testEmail,
      password: 'anotherPassword123',
    });
    if (dupRes.status === 400 && dupRes.data.success === false) {
      console.log('✔ Test 3 Passed: Duplicate email blocked with 400 Bad Request.');
    } else {
      console.error('❌ Test 3 Failed:', dupRes);
      failed = true;
    }

    // 4. Login Invalid Credentials
    console.log('\n[Test 4] Testing Login with incorrect password...');
    const badLogin = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'wrongPassword',
    });
    if (badLogin.status === 401 && badLogin.data.success === false) {
      console.log('✔ Test 4 Passed: Unauthorized response on bad credentials.');
    } else {
      console.error('❌ Test 4 Failed:', badLogin);
      failed = true;
    }

    // 5. Login Success
    console.log('\n[Test 5] Testing successful Login...');
    const goodLogin = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'securePassword123',
    });
    if (
      goodLogin.status === 200 &&
      goodLogin.data.success === true &&
      goodLogin.data.data.token &&
      goodLogin.data.data.user.email === testEmail
    ) {
      authToken = goodLogin.data.data.token;
      console.log('✔ Test 5 Passed: Login successful, received valid JWT token.');
    } else {
      console.error('❌ Test 5 Failed:', goodLogin);
      failed = true;
    }

    // 6. Protected Route GET /api/auth/me without Token
    console.log('\n[Test 6] Testing GET /api/auth/me without token...');
    const unauthMe = await request('/api/auth/me', 'GET');
    if (unauthMe.status === 401 && unauthMe.data.success === false) {
      console.log('✔ Test 6 Passed: Unauthenticated request rejected.');
    } else {
      console.error('❌ Test 6 Failed:', unauthMe);
      failed = true;
    }

    // 7. Protected Route GET /api/auth/me with Token
    console.log('\n[Test 7] Testing GET /api/auth/me with valid Bearer token...');
    const authMe = await request('/api/auth/me', 'GET', null, authToken);
    if (
      authMe.status === 200 &&
      authMe.data.success === true &&
      authMe.data.data.user.email === testEmail
    ) {
      console.log('✔ Test 7 Passed: Successfully retrieved current authenticated user.');
    } else {
      console.error('❌ Test 7 Failed:', authMe);
      failed = true;
    }

    // 8. Forgot Password Non-existent Email
    console.log('\n[Test 8] Testing Forgot Password with unknown email (enumeration protection)...');
    const unknownForgot = await request('/api/auth/forgot-password', 'POST', {
      email: 'nonexistent_account@example.com',
    });
    if (
      unknownForgot.status === 200 &&
      unknownForgot.data.success === true &&
      unknownForgot.data.message.includes('If an account exists')
    ) {
      console.log('✔ Test 8 Passed: Enumeration protection preserved on unknown email.');
    } else {
      console.error('❌ Test 8 Failed:', unknownForgot);
      failed = true;
    }

    // 9. Forgot Password Existing Email
    console.log('\n[Test 9] Testing Forgot Password for valid user...');
    const validForgot = await request('/api/auth/forgot-password', 'POST', {
      email: testEmail,
    });
    if (validForgot.status === 200 && validForgot.data.success === true) {
      console.log('✔ Test 9 Passed: Password reset requested successfully.');
    } else {
      console.error('❌ Test 9 Failed:', validForgot);
      failed = true;
    }

    // Verify token was stored in DB
    const userInDb = await User.findOne({ email: testEmail }).select('+resetPasswordToken +resetPasswordExpires');
    if (!userInDb.resetPasswordToken || !userInDb.resetPasswordExpires) {
      console.error('❌ Test 9 Failed: Reset token was not stored on user in DB.');
      failed = true;
    }

    // 10. Reset Password with Invalid Token
    console.log('\n[Test 10] Testing Reset Password with invalid token...');
    const invalidReset = await request('/api/auth/reset-password', 'POST', {
      token: 'invalid_raw_token_xyz',
      password: 'brandNewPassword123',
    });
    if (invalidReset.status === 400 && invalidReset.data.success === false) {
      console.log('✔ Test 10 Passed: Invalid reset token rejected.');
    } else {
      console.error('❌ Test 10 Failed:', invalidReset);
      failed = true;
    }

    // 11. Reset Password with Valid Token
    console.log('\n[Test 11] Testing Reset Password with genuine token...');
    // Generate a fresh raw token on user for precision testing
    const rawResetToken = userInDb.generateResetToken();
    await userInDb.save({ validateBeforeSave: false });

    const goodReset = await request('/api/auth/reset-password', 'POST', {
      token: rawResetToken,
      password: 'brandNewPassword123',
    });

    if (goodReset.status === 200 && goodReset.data.success === true && goodReset.data.data.token) {
      console.log('✔ Test 11 Passed: Password successfully updated via valid token.');
    } else {
      console.error('❌ Test 11 Failed:', goodReset);
      failed = true;
    }

    // 12. Verify Old Password Fails and New Password Works
    console.log('\n[Test 12] Verifying login with updated password...');
    const oldLoginAttempt = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'securePassword123',
    });
    const newLoginAttempt = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'brandNewPassword123',
    });

    if (oldLoginAttempt.status === 401 && newLoginAttempt.status === 200) {
      console.log('✔ Test 12 Passed: Old password rejected, new password authenticated.');
    } else {
      console.error('❌ Test 12 Failed: Password transition verification failed.');
      failed = true;
    }

    // Cleanup test user
    await User.deleteOne({ email: testEmail });

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 12 AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
