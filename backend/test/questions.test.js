const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const ResearchPaper = require('../src/models/ResearchPaper');
const Summary = require('../src/models/Summary');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Questions Test Runner] Test server listening on port ${port}`);

  let failed = false;

  const apiRequest = (reqPath, method = 'GET', token = null) => {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

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
      req.end();
    });
  };

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_paper_summarizer';
    await mongoose.connect(mongoUri);

    // Setup Users
    const userA = await User.create({
      name: 'Dr. Shannon',
      email: `shannon_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenA = userA.generateAuthToken();

    const userB = await User.create({
      name: 'Dr. Hamming',
      email: `hamming_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenB = userB.generateAuthToken();

    // Paper 1: Already has Summary with custom questions
    const paperWithSummary = await ResearchPaper.create({
      userId: userA._id,
      title: 'Information Theory and Channel Capacity',
      originalFileName: 'information_theory.pdf',
      storedFileName: 'stored_info.pdf',
      filePath: 'dummy_info.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      status: 'completed',
      extractedText: 'Mathematical foundations of communication and entropy bounds in noisy channels.',
    });

    const preExistingQuestions = [
      'How is channel capacity formally defined in this paper?',
      'What entropy bounds are established for Gaussian noise channels?',
      'What are the limitations of the proposed source coding theorem?',
    ];

    await Summary.create({
      paperId: paperWithSummary._id,
      userId: userA._id,
      objective: 'Establish fundamental limits on signal processing and data compression.',
      keyFindings: ['Proved noisy-channel coding theorem.'],
      conclusion: 'Reliable communication is mathematically possible below channel capacity.',
      fullSummary: 'Foundational paper on mathematical theory of communication.',
      suggestedQuestions: preExistingQuestions,
      modelUsed: 'gemini-1.5-flash',
    });

    // Paper 2: Processed paper with extracted text but NO pre-existing summary
    const paperWithoutSummary = await ResearchPaper.create({
      userId: userA._id,
      title: 'Neural Architecture Search for Edge Devices',
      originalFileName: 'nas_edge_2026.pdf',
      storedFileName: 'stored_nas.pdf',
      filePath: 'dummy_nas.pdf',
      fileSize: 2097152,
      mimeType: 'application/pdf',
      status: 'completed',
      extractedText:
        'Title: Hardware-Aware Neural Architecture Search for Edge Devices.\n\n' +
        'Problem: Deep neural networks impose unsustainable latency and energy footprints on edge microcontrollers.\n\n' +
        'Methodology: We propose an evolutionary multi-objective neural architecture search optimizing both MAC operations and SRAM peak usage.\n\n' +
        'Major Findings: Discovered CNN topologies achieving 78.4% top-1 ImageNet accuracy within 256KB SRAM memory budget.\n\n' +
        'Limitations: Search space was constrained to inverted residual blocks.\n\n' +
        'Future Work: Extending search to attention-based vision models on edge NPUs.',
      wordCount: 75,
      pageCount: 5,
    });

    // 1. Unauthenticated Request
    console.log('\n[Test 1] Testing unauthenticated call to GET /api/papers/:id/questions...');
    const unauthRes = await apiRequest(`/api/papers/${paperWithSummary._id}/questions`, 'GET', null);
    if (unauthRes.status === 401 && unauthRes.data.success === false) {
      console.log('✔ Test 1 Passed: Unauthenticated request rejected (401).');
    } else {
      console.error('❌ Test 1 Failed:', unauthRes);
      failed = true;
    }

    // 2. Cross-User Unauthorized Request (User B calling User A's questions)
    console.log('\n[Test 2] Testing cross-user questions attempt by User B...');
    const crossRes = await apiRequest(`/api/papers/${paperWithSummary._id}/questions`, 'GET', tokenB);
    if (crossRes.status === 403 && crossRes.data.success === false) {
      console.log('✔ Test 2 Passed: Cross-user request blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 2 Failed:', crossRes);
      failed = true;
    }

    // 3. Return Pre-existing Questions from Summary
    console.log('\n[Test 3] Testing retrieval of existing suggested questions from Summary...');
    const existingRes = await apiRequest(`/api/papers/${paperWithSummary._id}/questions`, 'GET', tokenA);
    if (
      existingRes.status === 200 &&
      existingRes.data.success === true &&
      Array.isArray(existingRes.data.data.questions) &&
      existingRes.data.data.questions.length === preExistingQuestions.length &&
      existingRes.data.data.questions[0] === preExistingQuestions[0]
    ) {
      console.log('✔ Test 3 Passed: Successfully retrieved pre-existing questions directly from Summary record.');
    } else {
      console.error('❌ Test 3 Failed:', existingRes.data);
      failed = true;
    }

    // 4. Generate New Suggested Questions on Demand when Summary record doesn't exist
    console.log('\n[Test 4] Testing on-demand generation and storage of suggested questions...');
    const generatedRes = await apiRequest(`/api/papers/${paperWithoutSummary._id}/questions`, 'GET', tokenA);
    if (
      generatedRes.status === 200 &&
      generatedRes.data.success === true &&
      Array.isArray(generatedRes.data.data.questions) &&
      generatedRes.data.data.questions.length >= 4
    ) {
      console.log('✔ Test 4 Passed: Generated tailored suggested questions:');
      generatedRes.data.data.questions.forEach((q, i) => {
        console.log(`  ${i + 1}. ${q}`);
      });
    } else {
      console.error('❌ Test 4 Failed:', generatedRes.data);
      failed = true;
    }

    // 5. Verify Questions Persisted to Summary in DB
    const savedSummary = await Summary.findOne({ paperId: paperWithoutSummary._id });
    if (
      savedSummary &&
      Array.isArray(savedSummary.suggestedQuestions) &&
      savedSummary.suggestedQuestions.length >= 4
    ) {
      console.log('✔ Test 5 Passed: Generated questions persisted in Summary collection for instant subsequent retrieval.');
    } else {
      console.error('❌ Test 5 Failed: Questions not persisted in DB.');
      failed = true;
    }

    // 6. Test Subsequent Retrieval Uses Cached Questions
    console.log('\n[Test 6] Testing subsequent retrieval returns cached questions...');
    const secondCall = await apiRequest(`/api/papers/${paperWithoutSummary._id}/questions`, 'GET', tokenA);
    if (
      secondCall.status === 200 &&
      secondCall.data.data.questions.length === savedSummary.suggestedQuestions.length &&
      secondCall.data.data.questions[0] === savedSummary.suggestedQuestions[0]
    ) {
      console.log('✔ Test 6 Passed: Subsequent call retrieved cached questions immediately.');
    } else {
      console.error('❌ Test 6 Failed:', secondCall);
      failed = true;
    }

    // Cleanup
    await Summary.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await ResearchPaper.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 6 SUGGESTED QUESTIONS TESTS PASSED SUCCESSFULLY!');
    }
  } catch (err) {
    console.error('Questions test error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
