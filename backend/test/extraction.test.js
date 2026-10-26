const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const ResearchPaper = require('../src/models/ResearchPaper');
const pdfService = require('../src/services/pdfService');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Extraction Test Runner] Test server listening on port ${port}`);

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

  const sampleValidPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>\nendobj\n3 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 612 792]\n  /Contents 4 0 R\n  /Resources <<\n    /Font <<\n      /F1 5 0 R\n    >>\n  >>\n>>\nendobj\n4 0 obj\n<<\n  /Length 62\n>>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Quantum Computing in 2026 Advances and Perspectives Research Paper) Tj\nET\nendstream\nendobj\n5 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica\n>>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000068 00000 n \n0000000125 00000 n \n0000000281 00000 n \n0000000395 00000 n \ntrailer\n<<\n  /Size 6\n  /Root 1 0 R\n>>\nstartxref\n474\n%%EOF'
  );

  const sampleScannedPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
  );

  const testFilePaths = [];

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_paper_summarizer';
    await mongoose.connect(mongoUri);

    // Unit test 1: Service extract text
    console.log('\n[Unit Test 1] Testing pdfService directly with text PDF...');
    const extracted = await pdfService.extractTextFromBuffer(sampleValidPdf);
    if (extracted.text.includes('Quantum Computing') && extracted.wordCount === 9) {
      console.log('✔ Unit Test 1 Passed: Text and word count correctly extracted.');
    } else {
      console.error('❌ Unit Test 1 Failed:', extracted);
      failed = true;
    }

    // Unit test 2: Service scanned PDF detection
    console.log('\n[Unit Test 2] Testing pdfService detection of scanned / empty text PDF...');
    try {
      await pdfService.extractTextFromBuffer(sampleScannedPdf);
      console.error('❌ Unit Test 2 Failed: Did not throw error on scanned PDF.');
      failed = true;
    } catch (scannedErr) {
      if (scannedErr.message.includes('scanned or contains only images')) {
        console.log('✔ Unit Test 2 Passed: Scanned PDF correctly flagged with descriptive error.');
      } else {
        console.error('❌ Unit Test 2 Failed with unexpected error:', scannedErr);
        failed = true;
      }
    }

    // Unit test 3: Corrupted PDF detection
    console.log('\n[Unit Test 3] Testing pdfService with corrupted PDF buffer...');
    try {
      await pdfService.extractTextFromBuffer(Buffer.from('not a real pdf header'));
      console.error('❌ Unit Test 3 Failed: Corrupted buffer did not throw.');
      failed = true;
    } catch (corruptErr) {
      if (corruptErr.message.includes('corrupted') || corruptErr.message.includes('invalid')) {
        console.log('✔ Unit Test 3 Passed: Corrupted PDF correctly rejected.');
      } else {
        console.error('❌ Unit Test 3 Failed:', corruptErr);
        failed = true;
      }
    }

    // API Integration Tests
    // Create Users A and B
    const userA = await User.create({
      name: 'Dr. Quantum',
      email: `quantum_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenA = userA.generateAuthToken();

    const userB = await User.create({
      name: 'Dr. Intruder',
      email: `intruder_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenB = userB.generateAuthToken();

    // Write physical test files to uploads/
    const uploadDir = path.resolve(__dirname, '../uploads');
    const validFilePath = path.join(uploadDir, `test-valid-${Date.now()}.pdf`);
    fs.writeFileSync(validFilePath, sampleValidPdf);
    testFilePaths.push(validFilePath);

    const scannedFilePath = path.join(uploadDir, `test-scanned-${Date.now()}.pdf`);
    fs.writeFileSync(scannedFilePath, sampleScannedPdf);
    testFilePaths.push(scannedFilePath);

    // Create DB Paper record for User A
    const paperA = await ResearchPaper.create({
      userId: userA._id,
      title: 'Quantum Computing 2026',
      originalFileName: 'quantum2026.pdf',
      storedFileName: path.basename(validFilePath),
      filePath: validFilePath,
      fileSize: sampleValidPdf.length,
      mimeType: 'application/pdf',
      status: 'uploaded',
    });

    // Test 4: Unauthenticated Request to process
    console.log('\n[Test 4] Testing unauthenticated call to POST /api/papers/:id/process...');
    const unauthProcess = await apiRequest(`/api/papers/${paperA._id}/process`, 'POST', null);
    if (unauthProcess.status === 401 && unauthProcess.data.success === false) {
      console.log('✔ Test 4 Passed: Unauthenticated request rejected (401).');
    } else {
      console.error('❌ Test 4 Failed:', unauthProcess);
      failed = true;
    }

    // Test 5: Unauthorized Cross-User processing attempt (User B calls process on User A's paper)
    console.log('\n[Test 5] Testing cross-user processing attempt by User B...');
    const crossProcess = await apiRequest(`/api/papers/${paperA._id}/process`, 'POST', tokenB);
    if (crossProcess.status === 403 && crossProcess.data.success === false) {
      console.log('✔ Test 5 Passed: Cross-user process blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 5 Failed:', crossProcess);
      failed = true;
    }

    // Test 6: Successful text extraction on valid paper
    console.log('\n[Test 6] Testing successful text extraction on valid paper...');
    const validProcess = await apiRequest(`/api/papers/${paperA._id}/process`, 'POST', tokenA);
    if (
      validProcess.status === 200 &&
      validProcess.data.success === true &&
      validProcess.data.data.status === 'completed' &&
      validProcess.data.data.wordCount === 9
    ) {
      console.log('✔ Test 6 Passed: Valid paper processed to status "completed" with 9 words.');
    } else {
      console.error('❌ Test 6 Failed:', validProcess);
      failed = true;
    }

    // Verify paper record in DB has extracted text saved
    const updatedPaperA = await ResearchPaper.findById(paperA._id).select('+extractedText');
    if (
      updatedPaperA.status === 'completed' &&
      updatedPaperA.extractedText.includes('Quantum Computing') &&
      updatedPaperA.pageCount === 1
    ) {
      console.log('✔ Verified DB record contains complete extractedText and status completed.');
    } else {
      console.error('❌ DB record validation failed:', updatedPaperA);
      failed = true;
    }

    // Test 7: Scanned PDF process handles failure state
    console.log('\n[Test 7] Testing process on scanned/image-only PDF...');
    const scannedPaper = await ResearchPaper.create({
      userId: userA._id,
      title: 'Scanned Document',
      originalFileName: 'scanned.pdf',
      storedFileName: path.basename(scannedFilePath),
      filePath: scannedFilePath,
      fileSize: sampleScannedPdf.length,
      mimeType: 'application/pdf',
      status: 'uploaded',
    });

    const scannedProcess = await apiRequest(`/api/papers/${scannedPaper._id}/process`, 'POST', tokenA);
    if (
      scannedProcess.status === 400 &&
      scannedProcess.data.success === false &&
      scannedProcess.data.message.includes('scanned or contains only images')
    ) {
      console.log('✔ Test 7 Passed: Scanned PDF rejected with 400 and clear error message.');
    } else {
      console.error('❌ Test 7 Failed:', scannedProcess);
      failed = true;
    }

    // Verify scanned paper in DB marked as 'failed' with errorMessage
    const failedPaperInDb = await ResearchPaper.findById(scannedPaper._id);
    if (
      failedPaperInDb.status === 'failed' &&
      failedPaperInDb.errorMessage.includes('scanned')
    ) {
      console.log('✔ Verified DB state updated to "failed" with recorded error message.');
    } else {
      console.error('❌ DB failed state not recorded properly:', failedPaperInDb);
      failed = true;
    }

    // Cleanup
    await ResearchPaper.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    testFilePaths.forEach((f) => {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch (e) {}
      }
    });

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 7 PDF EXTRACTION AND PROCESSING TESTS PASSED!');
    }
  } catch (err) {
    console.error('Extraction test error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
