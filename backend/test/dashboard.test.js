const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const ResearchPaper = require('../src/models/ResearchPaper');
const Summary = require('../src/models/Summary');
const ChatSession = require('../src/models/ChatSession');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Dashboard Test Runner] Test server listening on port ${port}`);

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
      name: 'Dr. Gauss',
      email: `gauss_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenA = userA.generateAuthToken();

    const userB = await User.create({
      name: 'Dr. Euler',
      email: `euler_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenB = userB.generateAuthToken();

    // Create a physical dummy file on disk for User A's paper
    const uploadDir = path.resolve(__dirname, '../uploads');
    const dummyFilePath = path.join(uploadDir, `test-paper-${Date.now()}.pdf`);
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 dummy pdf for delete testing');

    // Create 3 papers for User A with slight delay to ensure chronological ordering
    const paperA1 = await ResearchPaper.create({
      userId: userA._id,
      title: 'Disquisitiones Arithmeticae Part 1',
      originalFileName: 'paper1.pdf',
      storedFileName: 'stored1.pdf',
      filePath: dummyFilePath,
      fileSize: 1048576,
      mimeType: 'application/pdf',
      status: 'completed',
      extractedText: 'Secret extracted text 1',
      pageCount: 10,
      wordCount: 1500,
      extractedAt: new Date(),
    });

    const paperA2 = await ResearchPaper.create({
      userId: userA._id,
      title: 'Disquisitiones Arithmeticae Part 2',
      originalFileName: 'paper2.pdf',
      storedFileName: 'stored2.pdf',
      filePath: 'dummy2.pdf',
      fileSize: 2097152,
      mimeType: 'application/pdf',
      status: 'uploaded',
      extractedText: 'Secret extracted text 2',
    });

    const paperA3 = await ResearchPaper.create({
      userId: userA._id,
      title: 'Disquisitiones Arithmeticae Part 3',
      originalFileName: 'paper3.pdf',
      storedFileName: 'stored3.pdf',
      filePath: 'dummy3.pdf',
      fileSize: 3145728,
      mimeType: 'application/pdf',
      status: 'completed',
      extractedText: 'Secret extracted text 3',
      extractedAt: new Date(),
    });

    // Create paper for User B (isolation verification)
    const paperB1 = await ResearchPaper.create({
      userId: userB._id,
      title: 'Elements of Algebra',
      originalFileName: 'euler_algebra.pdf',
      storedFileName: 'stored_b.pdf',
      filePath: 'dummy_b.pdf',
      fileSize: 4194304,
      mimeType: 'application/pdf',
      status: 'completed',
    });

    // Attach Summary and ChatSession to paperA1 to test cascading deletion
    await Summary.create({
      paperId: paperA1._id,
      userId: userA._id,
      objective: 'Objective for Part 1',
      keyFindings: ['Finding 1'],
      conclusion: 'Conclusion 1',
      fullSummary: 'Full summary 1',
      suggestedQuestions: ['Question 1?'],
    });

    await ChatSession.create({
      userId: userA._id,
      paperId: paperA1._id,
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ],
    });

    // 1. GET /api/papers - Unauthenticated
    console.log('\n[Test 1] Testing unauthenticated call to GET /api/papers...');
    const unauthGet = await apiRequest('/api/papers', 'GET', null);
    if (unauthGet.status === 401 && unauthGet.data.success === false) {
      console.log('✔ Test 1 Passed: Unauthenticated request rejected (401).');
    } else {
      console.error('❌ Test 1 Failed:', unauthGet);
      failed = true;
    }

    // 2. GET /api/papers - User A retrieving dashboard list
    console.log('\n[Test 2] Testing dashboard paper list retrieval for User A...');
    const listRes = await apiRequest('/api/papers', 'GET', tokenA);
    if (
      listRes.status === 200 &&
      listRes.data.success === true &&
      Array.isArray(listRes.data.data.papers) &&
      listRes.data.data.papers.length === 3
    ) {
      console.log('✔ Test 2 Passed: User A successfully listed their 3 papers.');
      const firstPaper = listRes.data.data.papers[0];

      // Verify required fields: id, title, fileName, status, uploadedAt, processedAt
      const hasId = firstPaper.id !== undefined;
      const hasTitle = firstPaper.title !== undefined;
      const hasFileName = firstPaper.fileName !== undefined;
      const hasStatus = firstPaper.status !== undefined;
      const hasUploadedAt = firstPaper.uploadedAt !== undefined;
      const hasProcessedAt = firstPaper.processedAt !== undefined;
      const noExtractedText = firstPaper.extractedText === undefined;

      if (hasId && hasTitle && hasFileName && hasStatus && hasUploadedAt && hasProcessedAt && noExtractedText) {
        console.log('✔ Verified dashboard response structure conforms exactly to contract:');
        console.log('  Sample item:', {
          id: firstPaper.id,
          title: firstPaper.title,
          fileName: firstPaper.fileName,
          status: firstPaper.status,
          uploadedAt: firstPaper.uploadedAt,
          processedAt: firstPaper.processedAt,
        });
        console.log('  Extracted text omitted: YES (protected)');
      } else {
        console.error('❌ Missing expected dashboard fields or extracted text leaked:', firstPaper);
        failed = true;
      }
    } else {
      console.error('❌ Test 2 Failed:', listRes.data);
      failed = true;
    }

    // 3. User B Tenant Isolation
    console.log('\n[Test 3] Testing tenant isolation for User B...');
    const userBList = await apiRequest('/api/papers', 'GET', tokenB);
    if (
      userBList.status === 200 &&
      userBList.data.data.papers.length === 1 &&
      userBList.data.data.papers[0].title === 'Elements of Algebra'
    ) {
      console.log('✔ Test 3 Passed: User B only sees their 1 paper (strict isolation).');
    } else {
      console.error('❌ Test 3 Failed:', userBList.data);
      failed = true;
    }

    // 4. Pagination Support (?page=1&limit=2)
    console.log('\n[Test 4] Testing pagination support (limit=2)...');
    const pagedRes = await apiRequest('/api/papers?page=1&limit=2', 'GET', tokenA);
    if (
      pagedRes.status === 200 &&
      pagedRes.data.data.papers.length === 2 &&
      pagedRes.data.data.pagination &&
      pagedRes.data.data.pagination.total === 3 &&
      pagedRes.data.data.pagination.totalPages === 2
    ) {
      console.log('✔ Test 4 Passed: Pagination returned 2 papers and correct pagination metadata.');
    } else {
      console.error('❌ Test 4 Failed:', pagedRes.data);
      failed = true;
    }

    // 5. DELETE /api/papers/:id - Unauthenticated
    console.log('\n[Test 5] Testing unauthenticated DELETE /api/papers/:id...');
    const unauthDel = await apiRequest(`/api/papers/${paperA1._id}`, 'DELETE', null);
    if (unauthDel.status === 401 && unauthDel.data.success === false) {
      console.log('✔ Test 5 Passed: Unauthenticated delete rejected (401).');
    } else {
      console.error('❌ Test 5 Failed:', unauthDel);
      failed = true;
    }

    // 6. DELETE /api/papers/:id - Unauthorized Cross-User deletion attempt
    console.log('\n[Test 6] Testing cross-user delete attempt by User B...');
    const crossDel = await apiRequest(`/api/papers/${paperA1._id}`, 'DELETE', tokenB);
    if (crossDel.status === 403 && crossDel.data.success === false) {
      console.log('✔ Test 6 Passed: Cross-user delete attempt blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 6 Failed:', crossDel);
      failed = true;
    }

    // 7. DELETE /api/papers/:id - Owner deletion and cascading cleanup
    console.log('\n[Test 7] Testing owner deleting paperA1 with cascading cleanup...');
    const delRes = await apiRequest(`/api/papers/${paperA1._id}`, 'DELETE', tokenA);
    if (delRes.status === 200 && delRes.data.success === true) {
      console.log('✔ Test 7 Passed: Delete endpoint returned 200 OK.');

      // Check DB paper record deleted
      const paperInDb = await ResearchPaper.findById(paperA1._id);
      if (!paperInDb) {
        console.log('✔ Verified ResearchPaper record removed from database.');
      } else {
        console.error('❌ Paper record still exists in DB.');
        failed = true;
      }

      // Check physical file unlinked
      const fileStillOnDisk = fs.existsSync(dummyFilePath);
      if (!fileStillOnDisk) {
        console.log('✔ Verified physical PDF file removed from server disk.');
      } else {
        console.error('❌ Physical file was not unlinked from disk.');
        failed = true;
      }

      // Check Summary cascade
      const summaryInDb = await Summary.findOne({ paperId: paperA1._id });
      if (!summaryInDb) {
        console.log('✔ Verified associated Summary record cascade deleted.');
      } else {
        console.error('❌ Summary record was not deleted.');
        failed = true;
      }

      // Check ChatSession cascade
      const chatInDb = await ChatSession.findOne({ paperId: paperA1._id });
      if (!chatInDb) {
        console.log('✔ Verified associated ChatSession record cascade deleted.');
      } else {
        console.error('❌ ChatSession record was not deleted.');
        failed = true;
      }
    } else {
      console.error('❌ Test 7 Failed:', delRes);
      failed = true;
    }

    // Cleanup
    await Summary.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await ChatSession.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await ResearchPaper.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    if (fs.existsSync(dummyFilePath)) {
      try {
        fs.unlinkSync(dummyFilePath);
      } catch (e) {}
    }

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 7 DASHBOARD & DELETION TESTS PASSED SUCCESSFULLY!');
    }
  } catch (err) {
    console.error('Dashboard test error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
