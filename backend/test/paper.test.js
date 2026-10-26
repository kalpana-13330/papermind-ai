const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const ResearchPaper = require('../src/models/ResearchPaper');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Paper Test Runner] Test server listening on port ${port}`);

  let failed = false;

  // Helper to make multipart/form-data upload request
  const uploadRequest = ({ token, filename, mimeType, fileBuffer, fieldName = 'file' }) => {
    return new Promise((resolve, reject) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

      let header = '';
      if (fileBuffer !== null) {
        header =
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
          `Content-Type: ${mimeType}\r\n\r\n`;
      }
      const footer = `\r\n--${boundary}--\r\n`;

      const headerBuf = Buffer.from(header, 'utf-8');
      const footerBuf = Buffer.from(footer, 'utf-8');
      const bodyLength = fileBuffer ? headerBuf.length + fileBuffer.length + footerBuf.length : footerBuf.length;

      const headers = {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyLength,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/papers/upload',
          method: 'POST',
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

      if (fileBuffer) {
        req.write(headerBuf);
        req.write(fileBuffer);
        req.write(footerBuf);
      } else {
        req.write(footerBuf);
      }
      req.end();
    });
  };

  // Helper for regular JSON/GET requests
  const apiRequest = (path, method = 'GET', token = null) => {
    return new Promise((resolve, reject) => {
      const headers = {};
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
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: JSON.parse(body),
              });
            } catch (e) {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                raw: body,
              });
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  };

  const createdFilePaths = [];

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_paper_summarizer';
    await mongoose.connect(mongoUri);

    // Setup 2 test users: User A and User B
    const userA = await User.create({
      name: 'Researcher A',
      email: `researcher_a_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenA = userA.generateAuthToken();

    const userB = await User.create({
      name: 'Researcher B',
      email: `researcher_b_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenB = userB.generateAuthToken();

    // 1. Unauthenticated Request
    console.log('\n[Test 1] Testing unauthenticated upload request...');
    const unauthUpload = await uploadRequest({
      token: null,
      filename: 'sample.pdf',
      mimeType: 'application/pdf',
      fileBuffer: Buffer.from('%PDF-1.4 minimal test pdf'),
    });
    if (unauthUpload.status === 401 && unauthUpload.data.success === false) {
      console.log('✔ Test 1 Passed: Unauthenticated upload rejected with 401.');
    } else {
      console.error('❌ Test 1 Failed:', unauthUpload);
      failed = true;
    }

    // 2. Missing File
    console.log('\n[Test 2] Testing upload with missing file field...');
    const missingFileUpload = await uploadRequest({
      token: tokenA,
      filename: 'dummy',
      mimeType: 'text/plain',
      fileBuffer: null,
    });
    if (missingFileUpload.status === 400 && missingFileUpload.data.success === false) {
      console.log('✔ Test 2 Passed: Missing file rejected with 400.');
    } else {
      console.error('❌ Test 2 Failed:', missingFileUpload);
      failed = true;
    }

    // 3. Non-PDF File Validation (reject .txt or image)
    console.log('\n[Test 3] Testing non-PDF file upload...');
    const nonPdfUpload = await uploadRequest({
      token: tokenA,
      filename: 'notes.txt',
      mimeType: 'text/plain',
      fileBuffer: Buffer.from('Just some text notes, not a PDF.'),
    });
    if (nonPdfUpload.status === 400 && nonPdfUpload.data.success === false) {
      console.log('✔ Test 3 Passed: Non-PDF rejected with 400 Bad Request.');
    } else {
      console.error('❌ Test 3 Failed:', nonPdfUpload);
      failed = true;
    }

    // 4. PDF File Over 20 MB Limit
    console.log('\n[Test 4] Testing PDF over 20 MB limit...');
    // Create dummy buffer of 20.5 MB (20.5 * 1024 * 1024 = 21,495,808 bytes)
    const largeBuffer = Buffer.alloc(20.5 * 1024 * 1024);
    const oversizedUpload = await uploadRequest({
      token: tokenA,
      filename: 'huge_paper.pdf',
      mimeType: 'application/pdf',
      fileBuffer: largeBuffer,
    });
    if (
      oversizedUpload.status === 400 &&
      oversizedUpload.data.success === false &&
      oversizedUpload.data.message.includes('20 MB')
    ) {
      console.log('✔ Test 4 Passed: Oversized PDF (>20MB) rejected with 400.');
    } else {
      console.error('❌ Test 4 Failed:', oversizedUpload);
      failed = true;
    }

    // 5. Valid PDF Upload under 20 MB
    console.log('\n[Test 5] Testing valid PDF upload under 20 MB...');
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Title (Quantum Computing in 2026)\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
    const validUpload = await uploadRequest({
      token: tokenA,
      filename: 'Quantum_Computing_Overview.pdf',
      mimeType: 'application/pdf',
      fileBuffer: validPdfBuffer,
    });

    let paperIdA = null;
    if (
      validUpload.status === 201 &&
      validUpload.data.success === true &&
      validUpload.data.data.paperId &&
      validUpload.data.data.fileName === 'Quantum_Computing_Overview.pdf' &&
      validUpload.data.data.status === 'uploaded'
    ) {
      paperIdA = validUpload.data.data.paperId;
      console.log('✔ Test 5 Passed: Valid PDF uploaded successfully. Received paperId:', paperIdA);
    } else {
      console.error('❌ Test 5 Failed:', validUpload);
      failed = true;
    }

    // Verify paper exists in DB and file exists on disk
    const savedPaper = await ResearchPaper.findById(paperIdA);
    if (savedPaper && fs.existsSync(savedPaper.filePath)) {
      createdFilePaths.push(savedPaper.filePath);
      console.log('✔ Verified file written to disk:', savedPaper.filePath);
    } else {
      console.error('❌ Saved paper or file not found on disk.');
      failed = true;
    }

    // 6. Get User A's Papers (GET /api/papers)
    console.log('\n[Test 6] Testing GET /api/papers for User A...');
    const listA = await apiRequest('/api/papers', 'GET', tokenA);
    if (
      listA.status === 200 &&
      listA.data.success === true &&
      listA.data.data.papers.length >= 1 &&
      listA.data.data.papers.some((p) => p.paperId === paperIdA)
    ) {
      console.log('✔ Test 6 Passed: User A successfully listed their uploaded papers.');
    } else {
      console.error('❌ Test 6 Failed:', listA);
      failed = true;
    }

    // 7. Get User B's Papers (Isolation check)
    console.log('\n[Test 7] Testing GET /api/papers for User B (Isolation)...');
    const listB = await apiRequest('/api/papers', 'GET', tokenB);
    if (
      listB.status === 200 &&
      listB.data.success === true &&
      listB.data.data.papers.length === 0
    ) {
      console.log('✔ Test 7 Passed: User B has 0 papers (strict tenant isolation).');
    } else {
      console.error('❌ Test 7 Failed:', listB);
      failed = true;
    }

    // 8. User A Accessing Own Paper Metadata (GET /api/papers/:paperId)
    console.log('\n[Test 8] Testing GET /api/papers/:paperId by owner...');
    const metaA = await apiRequest(`/api/papers/${paperIdA}`, 'GET', tokenA);
    if (
      metaA.status === 200 &&
      metaA.data.success === true &&
      metaA.data.data.paper.paperId === paperIdA
    ) {
      console.log('✔ Test 8 Passed: Owner retrieved paper metadata.');
    } else {
      console.error('❌ Test 8 Failed:', metaA);
      failed = true;
    }

    // 9. Unauthorized Cross-User Access Attempt (User B accessing User A's paper)
    console.log('\n[Test 9] Testing unauthorized access to another user paper metadata...');
    const crossAccess = await apiRequest(`/api/papers/${paperIdA}`, 'GET', tokenB);
    if (crossAccess.status === 403 && crossAccess.data.success === false) {
      console.log('✔ Test 9 Passed: Cross-user paper access blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 9 Failed:', crossAccess);
      failed = true;
    }

    // 10. Owner Viewing / Downloading PDF Stream (GET /api/papers/:paperId/pdf)
    console.log('\n[Test 10] Testing owner streaming PDF file...');
    const streamRes = await apiRequest(`/api/papers/${paperIdA}/pdf`, 'GET', tokenA);
    if (
      streamRes.status === 200 &&
      streamRes.headers['content-type'] === 'application/pdf' &&
      parseInt(streamRes.headers['content-length'], 10) === validPdfBuffer.length
    ) {
      console.log('✔ Test 10 Passed: Owner successfully streamed PDF with correct headers.');
    } else {
      console.error('❌ Test 10 Failed:', streamRes.status, streamRes.headers);
      failed = true;
    }

    // 11. Unauthorized Cross-User Streaming Attempt
    console.log('\n[Test 11] Testing unauthorized user streaming PDF file...');
    const unauthStream = await apiRequest(`/api/papers/${paperIdA}/pdf`, 'GET', tokenB);
    if (unauthStream.status === 403 && unauthStream.data.success === false) {
      console.log('✔ Test 11 Passed: Cross-user PDF streaming blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 11 Failed:', unauthStream);
      failed = true;
    }

    // Cleanup: DB and files
    await ResearchPaper.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    createdFilePaths.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }
    });

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 11 RESEARCH PAPER UPLOAD & SECURITY TESTS PASSED!');
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
