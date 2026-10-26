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
  console.log(`[Download Test Runner] Test server listening on port ${port}`);

  let failed = false;

  const apiRequest = (reqPath, method = 'GET', token = null) => {
    return new Promise((resolve, reject) => {
      const headers = {};
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
          let chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const bodyBuffer = Buffer.concat(chunks);
            const contentType = res.headers['content-type'] || '';
            let json = null;
            if (contentType.includes('application/json')) {
              try {
                json = JSON.parse(bodyBuffer.toString('utf-8'));
              } catch (e) {}
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              buffer: bodyBuffer,
              text: bodyBuffer.toString('utf-8'),
              data: json,
            });
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

    // Setup User A (owner) and User B (unauthorized)
    const userA = await User.create({
      name: 'Dr. Alice Researcher',
      email: `alice_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenA = userA.generateAuthToken();

    const userB = await User.create({
      name: 'Dr. Bob Intruder',
      email: `bob_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenB = userB.generateAuthToken();

    // Paper with summary
    const paperA = await ResearchPaper.create({
      userId: userA._id,
      title: 'Attention Mechanisms in Deep Vision Models',
      originalFileName: 'attention_vision_2026.pdf',
      storedFileName: 'stored_attention.pdf',
      filePath: 'dummy_path.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      status: 'completed',
    });

    // Paper without summary
    const paperWithoutSummary = await ResearchPaper.create({
      userId: userA._id,
      title: 'Unprocessed Raw Paper',
      originalFileName: 'unprocessed.pdf',
      storedFileName: 'stored_unprocessed.pdf',
      filePath: 'dummy_path_2.pdf',
      fileSize: 524288,
      mimeType: 'application/pdf',
      status: 'uploaded',
    });

    const summaryRecord = await Summary.create({
      paperId: paperA._id,
      userId: userA._id,
      objective: 'To analyze self-attention computational complexity and propose linear-time alternatives for high-resolution computer vision.',
      background: 'High-resolution vision transformers suffer from quadratic complexity bottlenecks that limit real-time frame rates.',
      methods: 'Kernelized linear attention map formulation with low-rank projection matrix.',
      results: 'Formulated linear-time self-attention that decreases quadratic latency to linear O(N) while preserving 84.7% top-1 ImageNet accuracy.',
      conclusions: 'Linear-time attention enables real-time vision transformers without sacrificing perceptual field resolution.',
      limitations: 'Evaluated primarily on computer vision classification benchmarks.',
      keyFindings: [
        'Formulated linear-time self-attention that decreases quadratic latency to linear O(N).',
        'Demonstrated 4.2x FPS improvement on 4K resolution benchmark video streams.',
        'Preserved 84.7% top-1 ImageNet accuracy with 30% fewer parameters.',
      ],
      conclusion: 'Linear-time attention enables real-time vision transformers without sacrificing perceptual field resolution.',
      fullSummary: 'In this paper, authors investigate attention mechanisms in computer vision and demonstrate a linear alternative using kernel feature maps.',
      suggestedQuestions: [
        'How does this method compare to standard Swin Transformers?',
        'Can linear attention generalize to multimodal vision-language tasks?',
      ],
      modelUsed: 'gemini-1.5-flash',
      processingTimeMs: 1250,
    });

    // 1. GET /api/papers/:id/summary - Unauthenticated
    console.log('\n[Test 1] Testing unauthenticated GET /api/papers/:id/summary...');
    const unauthGet = await apiRequest(`/api/papers/${paperA._id}/summary`, 'GET', null);
    if (unauthGet.status === 401) {
      console.log('✔ Test 1 Passed: Unauthenticated summary fetch rejected with 401.');
    } else {
      console.error('❌ Test 1 Failed:', unauthGet.status);
      failed = true;
    }

    // 2. GET /api/papers/:id/summary - Unauthorized access by User B
    console.log('\n[Test 2] Testing cross-user summary access attempt by User B...');
    const crossGet = await apiRequest(`/api/papers/${paperA._id}/summary`, 'GET', tokenB);
    if (crossGet.status === 403) {
      console.log('✔ Test 2 Passed: Cross-user summary access blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 2 Failed:', crossGet.status);
      failed = true;
    }

    // 3. GET /api/papers/:id/summary - Missing paper
    console.log('\n[Test 3] Testing summary retrieval for non-existent paper ID...');
    const nonExistentId = new mongoose.Types.ObjectId();
    const missingPaperGet = await apiRequest(`/api/papers/${nonExistentId}/summary`, 'GET', tokenA);
    if (missingPaperGet.status === 404) {
      console.log('✔ Test 3 Passed: Non-existent paper returned 404.');
    } else {
      console.error('❌ Test 3 Failed:', missingPaperGet.status);
      failed = true;
    }

    // 4. GET /api/papers/:id/summary - Summary not generated yet
    console.log('\n[Test 4] Testing retrieval when summary is not yet generated...');
    const notReadyGet = await apiRequest(`/api/papers/${paperWithoutSummary._id}/summary`, 'GET', tokenA);
    if (notReadyGet.status === 404 && notReadyGet.data.message.includes('not been generated')) {
      console.log('✔ Test 4 Passed: Un-summarized paper returned 404 with helpful message.');
    } else {
      console.error('❌ Test 4 Failed:', notReadyGet);
      failed = true;
    }

    // 5. GET /api/papers/:id/summary - Successful retrieval by owner
    console.log('\n[Test 5] Testing owner retrieving structured summary...');
    const successGet = await apiRequest(`/api/papers/${paperA._id}/summary`, 'GET', tokenA);
    if (
      successGet.status === 200 &&
      successGet.data.success === true &&
      successGet.data.data.objective &&
      Array.isArray(successGet.data.data.keyFindings) &&
      successGet.data.data.keyFindings.length === 3 &&
      successGet.data.data.conclusion &&
      successGet.data.data.fullSummary &&
      Array.isArray(successGet.data.data.suggestedQuestions)
    ) {
      console.log('✔ Test 5 Passed: Owner successfully retrieved complete structured summary.');
    } else {
      console.error('❌ Test 5 Failed:', successGet.data);
      failed = true;
    }

    // 6. GET /api/papers/:id/summary/download - Unauthenticated
    console.log('\n[Test 6] Testing unauthenticated download...');
    const unauthDownload = await apiRequest(`/api/papers/${paperA._id}/summary/download`, 'GET', null);
    if (unauthDownload.status === 401) {
      console.log('✔ Test 6 Passed: Unauthenticated download rejected with 401.');
    } else {
      console.error('❌ Test 6 Failed:', unauthDownload.status);
      failed = true;
    }

    // 7. GET /api/papers/:id/summary/download - Unauthorized User B
    console.log('\n[Test 7] Testing cross-user download attempt by User B...');
    const crossDownload = await apiRequest(`/api/papers/${paperA._id}/summary/download`, 'GET', tokenB);
    if (crossDownload.status === 403) {
      console.log('✔ Test 7 Passed: Cross-user download blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 7 Failed:', crossDownload.status);
      failed = true;
    }

    // 8. GET /api/papers/:id/summary/download - Default PDF generation & stream
    console.log('\n[Test 8] Testing default PDF summary download...');
    const pdfDownload = await apiRequest(`/api/papers/${paperA._id}/summary/download`, 'GET', tokenA);
    const pdfHeader = pdfDownload.headers['content-type'] || '';
    const pdfDisp = pdfDownload.headers['content-disposition'] || '';
    const isPdfBinary = pdfDownload.buffer.slice(0, 4).toString() === '%PDF';

    if (
      pdfDownload.status === 200 &&
      pdfHeader.includes('application/pdf') &&
      pdfDisp.includes('attachment') &&
      pdfDisp.includes('.pdf') &&
      isPdfBinary
    ) {
      console.log('✔ Test 8 Passed: Successfully streamed clean downloadable PDF document.');
      console.log('  Content-Disposition:', pdfDisp);
      console.log('  File size (bytes):', pdfDownload.buffer.length);
    } else {
      console.error('❌ Test 8 Failed:', {
        status: pdfDownload.status,
        pdfHeader,
        pdfDisp,
        isPdfBinary,
      });
      failed = true;
    }

    // 9. GET /api/papers/:id/summary/download?format=txt - Plain Text / Markdown formatted document
    console.log('\n[Test 9] Testing plain text / markdown summary download (?format=txt)...');
    const txtDownload = await apiRequest(`/api/papers/${paperA._id}/summary/download?format=txt`, 'GET', tokenA);
    const txtContent = txtDownload.text;

    const hasTitle = txtContent.includes('Title:');
    const hasObjective = txtContent.includes('1. OBJECTIVE OR PURPOSE');
    const hasBackground = txtContent.includes('2. BACKGROUND OR CONTEXT');
    const hasMethods = txtContent.includes('3. METHODS');
    const hasResults = txtContent.includes('4. RESULTS OR FINDINGS');
    const hasConclusions = txtContent.includes('5. CONCLUSIONS OR IMPLICATIONS');
    const hasLimitations = txtContent.includes('6. LIMITATIONS');
    const noSuggestedQuestions = !txtContent.includes('SUGGESTED QUESTIONS');

    if (
      txtDownload.status === 200 &&
      hasTitle &&
      hasObjective &&
      hasBackground &&
      hasMethods &&
      hasResults &&
      hasConclusions &&
      hasLimitations &&
      noSuggestedQuestions
    ) {
      console.log('✔ Test 9 Passed: Text summary download contains all six academic sections:');
      console.log('  - Research Paper Summary Header: OK');
      console.log('  - 1. Objective or Purpose: OK');
      console.log('  - 2. Background or Context: OK');
      console.log('  - 3. Methods: OK');
      console.log('  - 4. Results or Findings: OK');
      console.log('  - 5. Conclusions or Implications: OK');
      console.log('  - 6. Limitations: OK');
      console.log('  - Strictly Excludes Suggested Questions: OK');
    } else {
      console.error('❌ Test 9 Failed:', txtContent);
      failed = true;
    }

    // Cleanup
    await Summary.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await ResearchPaper.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 9 SUMMARY RETRIEVAL & DOWNLOAD TESTS PASSED!');
    }
  } catch (err) {
    console.error('Download test error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
