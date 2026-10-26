const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const ResearchPaper = require('../src/models/ResearchPaper');
const ChatSession = require('../src/models/ChatSession');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Chat Test Runner] Test server listening on port ${port}`);

  let failed = false;

  const apiRequest = (reqPath, method = 'POST', token = null, data = null) => {
    return new Promise((resolve, reject) => {
      const payload = data ? JSON.stringify(data) : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: reqPath,
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
      if (payload) req.write(payload);
      req.end();
    });
  };

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_paper_summarizer';
    await mongoose.connect(mongoUri);

    // Setup Users
    const userA = await User.create({
      name: 'Dr. Feynman',
      email: `feynman_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenA = userA.generateAuthToken();

    const userB = await User.create({
      name: 'Dr. Dirac',
      email: `dirac_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenB = userB.generateAuthToken();

    // Processed Paper A with extracted text
    const sampleText =
      'Research Paper Title: Quantum Electrodynamics and Path Integral Formulations.\n\n' +
      'Methodology: We formulated a spacetime approach to quantum electrodynamics using path integrals. ' +
      'The transition amplitude is expressed as a sum over histories weighted by the classical action.\n\n' +
      'Key Results: Electron-positron scattering amplitudes were computed in second-order perturbation theory with 99.8% precision. ' +
      'Renormalization eliminated ultraviolet divergences systematically across one-loop diagrams.\n\n' +
      'Conclusion: The path integral formulation provides intuitive computational and geometric advantages in quantum field theory.';

    const paperA = await ResearchPaper.create({
      userId: userA._id,
      title: 'Quantum Electrodynamics Formulations',
      originalFileName: 'qed_path_integrals.pdf',
      storedFileName: 'stored_qed.pdf',
      filePath: 'dummy_qed.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      status: 'completed',
      extractedText: sampleText,
      wordCount: 85,
      pageCount: 4,
    });

    // Unprocessed Paper (status: 'uploaded')
    const unprocessedPaper = await ResearchPaper.create({
      userId: userA._id,
      title: 'Unprocessed Raw Paper',
      originalFileName: 'raw.pdf',
      storedFileName: 'stored_raw.pdf',
      filePath: 'dummy_raw.pdf',
      fileSize: 524288,
      mimeType: 'application/pdf',
      status: 'uploaded',
    });

    // 1. Empty Question Validation
    console.log('\n[Test 1] Testing empty question rejection...');
    const emptyRes = await apiRequest(`/api/papers/${paperA._id}/chat`, 'POST', tokenA, {
      message: '   ',
    });
    if (emptyRes.status === 400 && emptyRes.data.success === false) {
      console.log('✔ Test 1 Passed: Empty question rejected with 400 Bad Request.');
    } else {
      console.error('❌ Test 1 Failed:', emptyRes);
      failed = true;
    }

    // 2. Very Long Question Validation (>2000 chars)
    console.log('\n[Test 2] Testing oversized question rejection (>2000 chars)...');
    const longQuestion = 'Explain ' + 'x'.repeat(2100);
    const longRes = await apiRequest(`/api/papers/${paperA._id}/chat`, 'POST', tokenA, {
      message: longQuestion,
    });
    if (longRes.status === 400 && longRes.data.success === false && longRes.data.message.includes('2000')) {
      console.log('✔ Test 2 Passed: Question exceeding 2000 characters rejected with 400.');
    } else {
      console.error('❌ Test 2 Failed:', longRes);
      failed = true;
    }

    // 3. Unauthorized User Access (User B asking question on User A's paper)
    console.log('\n[Test 3] Testing cross-user chat attempt by User B...');
    const unauthRes = await apiRequest(`/api/papers/${paperA._id}/chat`, 'POST', tokenB, {
      message: 'What is the methodology?',
    });
    if (unauthRes.status === 403 && unauthRes.data.success === false) {
      console.log('✔ Test 3 Passed: Cross-user chat attempt blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 3 Failed:', unauthRes);
      failed = true;
    }

    // 4. Unprocessed Paper Validation
    console.log('\n[Test 4] Testing chat on unprocessed paper...');
    const unprocRes = await apiRequest(`/api/papers/${unprocessedPaper._id}/chat`, 'POST', tokenA, {
      message: 'What are the results?',
    });
    if (unprocRes.status === 400 && unprocRes.data.success === false && unprocRes.data.message.includes('not been completed')) {
      console.log('✔ Test 4 Passed: Chat on unprocessed paper rejected with 400.');
    } else {
      console.error('❌ Test 4 Failed:', unprocRes);
      failed = true;
    }

    // 5. Valid Grounded Question (Turn 1)
    console.log('\n[Test 5] Testing valid grounded question on processed paper...');
    const q1Res = await apiRequest(`/api/papers/${paperA._id}/chat`, 'POST', tokenA, {
      message: 'What methodology was used in this research?',
    });
    if (
      q1Res.status === 200 &&
      q1Res.data.success === true &&
      q1Res.data.data.answer &&
      q1Res.data.data.paperId === paperA._id.toString() &&
      q1Res.data.data.timestamp
    ) {
      console.log('✔ Test 5 Passed: Received grounded AI answer:');
      console.log('  Answer snippet:', q1Res.data.data.answer.slice(0, 100) + '...');
    } else {
      console.error('❌ Test 5 Failed:', q1Res);
      failed = true;
    }

    // 6. Grounding check on unrelated question (Should clearly state not enough information)
    console.log('\n[Test 6] Testing grounding rule on out-of-scope question...');
    const unrelatedRes = await apiRequest(`/api/papers/${paperA._id}/chat`, 'POST', tokenA, {
      message: 'What is the best recipe for baking chocolate chip cookies?',
    });
    if (
      unrelatedRes.status === 200 &&
      unrelatedRes.data.data.answer.includes('does not provide enough information')
    ) {
      console.log('✔ Test 6 Passed: Out-of-scope question received strict refusal statement:');
      console.log('  Response:', unrelatedRes.data.data.answer);
    } else {
      console.error('❌ Test 6 Failed:', unrelatedRes);
      failed = true;
    }

    // 7. Multiple Chat Messages (Turn 2)
    console.log('\n[Test 7] Testing follow-up chat message (Turn 2)...');
    const q2Res = await apiRequest(`/api/papers/${paperA._id}/chat`, 'POST', tokenA, {
      message: 'What were the precision results for electron-positron scattering?',
    });
    if (q2Res.status === 200 && q2Res.data.data.answer) {
      console.log('✔ Test 7 Passed: Second turn completed successfully.');
    } else {
      console.error('❌ Test 7 Failed:', q2Res);
      failed = true;
    }

    // 8. Retrieve Chat History (GET /api/papers/:id/chat)
    console.log('\n[Test 8] Testing GET /api/papers/:id/chat for chat history...');
    const historyRes = await apiRequest(`/api/papers/${paperA._id}/chat`, 'GET', tokenA);
    if (
      historyRes.status === 200 &&
      historyRes.data.success === true &&
      Array.isArray(historyRes.data.data.messages) &&
      historyRes.data.data.totalMessages === 6 // 3 user questions + 3 assistant responses
    ) {
      console.log('✔ Test 8 Passed: Successfully retrieved 6 conversation turns.');
      const roles = historyRes.data.data.messages.map((m) => m.role);
      console.log('  Roles sequence:', roles);
    } else {
      console.error('❌ Test 8 Failed:', historyRes.data);
      failed = true;
    }

    // 9. Clear Chat History (DELETE /api/papers/:id/chat)
    console.log('\n[Test 9] Testing DELETE /api/papers/:id/chat to clear session...');
    const deleteRes = await apiRequest(`/api/papers/${paperA._id}/chat`, 'DELETE', tokenA);
    if (deleteRes.status === 200 && deleteRes.data.success === true) {
      console.log('✔ Test 9 Passed: Chat session cleared successfully.');
    } else {
      console.error('❌ Test 9 Failed:', deleteRes);
      failed = true;
    }

    // Verify history is empty after deletion
    const clearedHistoryRes = await apiRequest(`/api/papers/${paperA._id}/chat`, 'GET', tokenA);
    if (
      clearedHistoryRes.status === 200 &&
      clearedHistoryRes.data.data.messages.length === 0 &&
      clearedHistoryRes.data.data.totalMessages === 0
    ) {
      console.log('✔ Verified chat history is now empty (0 messages).');
    } else {
      console.error('❌ Cleared history verification failed:', clearedHistoryRes.data);
      failed = true;
    }

    // Cleanup
    await ChatSession.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await ResearchPaper.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 9 CHAT / ASK AI TESTS PASSED SUCCESSFULLY!');
    }
  } catch (err) {
    console.error('Chat test error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
