const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const User = require('../src/models/User');
const ResearchPaper = require('../src/models/ResearchPaper');
const Summary = require('../src/models/Summary');
const aiService = require('../src/services/aiService');
const exportService = require('../src/services/exportService');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Summary Test Runner] Test server listening on port ${port}`);

  let failed = false;

  const apiRequest = (reqPath, method = 'POST', token = null) => {
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

    // ─────────────────────────────────────────────────────────────────────────
    // UNIT TESTS
    // ─────────────────────────────────────────────────────────────────────────

    // Test 1: Chunking logic
    console.log('\n[Unit Test 1] Testing aiService text chunking...');
    const shortText = 'Paragraph one.\n\nParagraph two.';
    const singleChunk = aiService.chunkText(shortText, 500);
    if (singleChunk.length === 1 && singleChunk[0] === shortText) {
      console.log('✔ Unit Test 1a Passed: Text within threshold preserved as 1 chunk.');
    } else {
      console.error('❌ Unit Test 1a Failed:', singleChunk);
      failed = true;
    }

    const multiPara = 'A'.repeat(300) + '\n\n' + 'B'.repeat(300);
    const twoChunks = aiService.chunkText(multiPara, 400);
    if (twoChunks.length === 2) {
      console.log('✔ Unit Test 1b Passed: Text exceeding threshold correctly chunked.');
    } else {
      console.error('❌ Unit Test 1b Failed:', twoChunks.length);
      failed = true;
    }

    // Test 2: Six-section structured output validation
    console.log('\n[Unit Test 2] Testing aiService six-section structured output validation...');
    const sampleAiJson = {
      objective: 'To analyze transformer latency and optimize memory consumption in large language models.',
      background: 'Transformer architectures have demonstrated state-of-the-art performance across NLP benchmarks. However, memory and latency bottlenecks limit deployment on resource-constrained hardware.',
      methods: 'The authors apply dynamic quantization to attention weight matrices, reducing precision from FP32 to INT8. Experiments were conducted on BERT-Large and GPT-2 using GLUE and SQuAD benchmarks.',
      results: 'The quantized models achieved 34% reduction in inference memory and 210ms faster time-to-first-token. Accuracy was maintained at 99.2% on NLP benchmark tasks with less than 0.8% degradation.',
      conclusions: 'The proposed architecture delivers state-of-the-art throughput without degrading semantic accuracy. Quantization is a practical near-term solution for deploying large transformers in production environments.',
      limitations: 'The study is limited to encoder-only and decoder-only architectures. Encoder-decoder models such as T5 were not evaluated. Results may not generalize to non-English language benchmarks.',
      suggestedQuestions: [
        'What specific quantization techniques were applied to attention weights?',
        'How does the method scale to 70B parameter models?',
        'Were any accuracy degradation trade-offs observed on specific task types?',
      ],
    };

    const validated = aiService.validateSummaryStructure(sampleAiJson);
    const sixSectionFields = ['objective', 'background', 'methods', 'results', 'conclusions', 'limitations'];
    const allSixPresent = sixSectionFields.every(f => validated[f] && validated[f].length > 0);

    if (
      allSixPresent &&
      Array.isArray(validated.suggestedQuestions) &&
      validated.suggestedQuestions.length === 3 &&
      Array.isArray(validated.keyFindings) &&
      validated.keyFindings.length > 0
    ) {
      console.log('✔ Unit Test 2 Passed: Six-section summary structure valid with all required fields.');
      console.log('  Fields validated:', sixSectionFields.join(', '));
    } else {
      console.error('❌ Unit Test 2 Failed:', validated);
      failed = true;
    }

    // Test 3: Fallback summary produces six sections
    console.log('\n[Unit Test 3] Testing offline fallback generates six sections...');
    const fallbackSample = 'Title: Deep Learning for Image Classification.\n\nAbstract: We propose a novel convolutional neural network architecture that improves accuracy on CIFAR-10. The model uses residual connections and batch normalization. We achieve 94.5% accuracy, outperforming previous methods by 2.3%.';
    const fallbackResult = aiService.generateFallbackSummary(fallbackSample, 'Deep Learning Classification');
    const fallbackHasSix = sixSectionFields.every(f => typeof fallbackResult[f] === 'string' && fallbackResult[f].length > 0);
    if (fallbackHasSix && Array.isArray(fallbackResult.keyFindings) && fallbackResult.suggestedQuestions.length > 0) {
      console.log('✔ Unit Test 3 Passed: Fallback engine produces all six sections.');
    } else {
      console.error('❌ Unit Test 3 Failed:', Object.keys(fallbackResult));
      failed = true;
    }

    // Test 4: Legacy document backward compatibility via toClientJSON()
    console.log('\n[Unit Test 4] Testing legacy document backward compatibility...');
    // Simulate a legacy summary doc missing the new fields
    const legacySummaryDoc = {
      _id: new mongoose.Types.ObjectId(),
      paperId: new mongoose.Types.ObjectId(),
      objective: 'Legacy objective text',
      background: '',    // missing in legacy docs
      methods: '',       // missing in legacy docs
      results: '',       // missing in legacy docs
      conclusions: '',   // missing in legacy docs
      limitations: '',   // missing in legacy docs
      keyFindings: ['Finding one', 'Finding two'],
      conclusion: 'Legacy conclusion text',
      fullSummary: 'Legacy full summary text.',
      suggestedQuestions: ['Question one?'],
      modelUsed: 'gemini-1.5-flash',
      processingTimeMs: 1200,
      createdAt: new Date(),
      updatedAt: new Date(),
      toClientJSON: Summary.prototype.toClientJSON,
    };
    const legacyJson = legacySummaryDoc.toClientJSON.call(legacySummaryDoc);
    if (
      legacyJson.objective === 'Legacy objective text' &&
      legacyJson.background === '' &&
      legacyJson.conclusions === 'Legacy conclusion text' &&
      legacyJson.keyFindings.length === 2
    ) {
      console.log('✔ Unit Test 4 Passed: Legacy documents handled safely without crashing.');
    } else {
      console.error('❌ Unit Test 4 Failed:', legacyJson);
      failed = true;
    }

    // Test 5: Text export includes six section headers
    console.log('\n[Unit Test 5] Testing TXT export includes all six section headers...');
    const mockPaper = { title: 'Test Paper', originalFileName: 'test.pdf' };
    const mockSummary = {
      objective: 'The objective.',
      background: 'The background.',
      methods: 'The methods used.',
      results: 'The results achieved.',
      conclusions: 'The conclusions drawn.',
      limitations: 'The limitations noted.',
      keyFindings: ['Finding A'],
      conclusion: 'The conclusions drawn.',
      fullSummary: 'A full summary.',
      suggestedQuestions: ['Question?'],
    };
    const textExport = exportService.generateTextSummary(mockPaper, mockSummary);
    const requiredHeaders = [
      'OBJECTIVE / PURPOSE',
      'BACKGROUND / CONTEXT',
      'METHODS',
      'RESULTS / FINDINGS',
      'CONCLUSIONS / IMPLICATIONS',
      'LIMITATIONS',
      'SUGGESTED QUESTIONS',
    ];
    const missingHeaders = requiredHeaders.filter(h => !textExport.includes(h));
    if (missingHeaders.length === 0) {
      console.log('✔ Unit Test 5 Passed: TXT export contains all six section headers.');
    } else {
      console.error('❌ Unit Test 5 Failed: Missing headers:', missingHeaders);
      failed = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API INTEGRATION TESTS
    // ─────────────────────────────────────────────────────────────────────────

    // Setup Users & Papers
    const userA = await User.create({
      name: 'Dr. Turing',
      email: `turing_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenA = userA.generateAuthToken();

    const userB = await User.create({
      name: 'Dr. Lovelace',
      email: `lovelace_${Date.now()}@example.com`,
      password: 'password123',
    });
    const tokenB = userB.generateAuthToken();

    const sampleExtractedText =
      'Title: Scalable Quantum Machine Learning Algorithms in High-Dimensional Feature Spaces.\n\n' +
      'Abstract: We investigate the integration of parameterized quantum circuits with classical deep neural networks. ' +
      'Our primary objective is to evaluate whether quantum kernels demonstrate verifiable quantum advantage on noisy intermediate-scale quantum devices.\n\n' +
      'Background: Prior work on quantum machine learning has explored variational quantum eigensolvers and quantum support vector machines. ' +
      'However, most approaches lack systematic benchmarking against classical counterparts in realistic noise conditions.\n\n' +
      'Methods: We construct hybrid quantum-classical architectures using PennyLane and TensorFlow. ' +
      'Experiments were run on IBM Quantum backends with up to 127 qubits and on classical simulators.\n\n' +
      'Results and Key Findings: First, our hybrid architecture achieved a 42% acceleration in convergence speed over classical gradient descent. ' +
      'Second, empirical evaluation on MNIST and CIFAR subsets demonstrated noise resilience up to 5% depolarizing error rates. ' +
      'Third, the parameter count was reduced by 60% compared to dense classical layers.\n\n' +
      'Conclusion: We demonstrate that hybrid quantum-classical algorithms offer realistic near-term utility for high-dimensional feature classification. ' +
      'Future work should examine error mitigation techniques on physical superconducting qubits.\n\n' +
      'Limitations: This study is limited to quantum circuits with a maximum of 10 qubits due to simulator constraints. ' +
      'Results on real quantum hardware may differ due to decoherence and gate errors not fully captured by simulation.';

    const paperA = await ResearchPaper.create({
      userId: userA._id,
      title: 'Scalable Quantum Machine Learning',
      originalFileName: 'quantum_ml_2026.pdf',
      storedFileName: `paper-quantum-${Date.now()}.pdf`,
      filePath: 'dummy-path.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      status: 'completed',
      extractedText: sampleExtractedText,
      wordCount: 155,
      pageCount: 6,
    });

    // Test 6: Unauthenticated Request
    console.log('\n[Test 6] Testing unauthenticated call to POST /api/papers/:id/summarize...');
    const unauthRes = await apiRequest(`/api/papers/${paperA._id}/summarize`, 'POST', null);
    if (unauthRes.status === 401 && unauthRes.data.success === false) {
      console.log('✔ Test 6 Passed: Unauthenticated request rejected (401).');
    } else {
      console.error('❌ Test 6 Failed:', unauthRes);
      failed = true;
    }

    // Test 7: Cross-User Authorization
    console.log('\n[Test 7] Testing cross-user summarization attempt by User B...');
    const crossRes = await apiRequest(`/api/papers/${paperA._id}/summarize`, 'POST', tokenB);
    if (crossRes.status === 403 && crossRes.data.success === false) {
      console.log('✔ Test 7 Passed: Cross-user summarization blocked with 403 Forbidden.');
    } else {
      console.error('❌ Test 7 Failed:', crossRes);
      failed = true;
    }

    // Test 8: Successful Six-Section Summarization
    console.log('\n[Test 8] Testing successful six-section AI summarization by paper owner...');
    const summarizeRes = await apiRequest(`/api/papers/${paperA._id}/summarize`, 'POST', tokenA);
    const sd = summarizeRes.data && summarizeRes.data.data;
    const hasSixSections = sd && sixSectionFields.every(f => typeof sd[f] === 'string' && sd[f].length > 0);
    if (
      summarizeRes.status === 200 &&
      summarizeRes.data.success === true &&
      hasSixSections &&
      Array.isArray(sd.suggestedQuestions) &&
      sd.suggestedQuestions.length > 0 &&
      Array.isArray(sd.keyFindings) &&
      sd.keyFindings.length > 0
    ) {
      console.log('✔ Test 8 Passed: Received complete six-section structured summary:');
      sixSectionFields.forEach(f => {
        console.log(`  - ${f}: ${sd[f].slice(0, 60)}...`);
      });
      console.log('  - keyFindings count:', sd.keyFindings.length);
      console.log('  - suggestedQuestions count:', sd.suggestedQuestions.length);
    } else {
      console.error('❌ Test 8 Failed:', summarizeRes.data);
      if (sd) {
        const missingSections = sixSectionFields.filter(f => !sd[f] || sd[f].length === 0);
        console.error('  Missing sections:', missingSections);
      }
      failed = true;
    }

    // Test 9: Verify All Six Sections Persisted in Database
    console.log('\n[Test 9] Verifying all six sections persisted in MongoDB...');
    const summaryInDb = await Summary.findOne({ paperId: paperA._id });
    const dbHasSix = summaryInDb && sixSectionFields.every(f => typeof summaryInDb[f] === 'string' && summaryInDb[f].length > 0);
    if (dbHasSix && summaryInDb.keyFindings.length > 0) {
      console.log('✔ Test 9 Passed: All six sections correctly saved in MongoDB.');
    } else {
      console.error('❌ Test 9 Failed: Summary not found or missing sections in DB.');
      if (summaryInDb) {
        const missingInDb = sixSectionFields.filter(f => !summaryInDb[f] || summaryInDb[f].length === 0);
        console.error('  Missing in DB:', missingInDb);
      }
      failed = true;
    }

    // Test 10: Cache Retrieval (no duplicate generation)
    console.log('\n[Test 10] Testing retrieval of existing summary without regeneration...');
    const cachedRes = await apiRequest(`/api/papers/${paperA._id}/summarize`, 'POST', tokenA);
    if (
      cachedRes.status === 200 &&
      cachedRes.data.success === true &&
      cachedRes.data.message.includes('Existing AI summary retrieved')
    ) {
      console.log('✔ Test 10 Passed: Existing summary returned immediately from cache.');
    } else {
      console.error('❌ Test 10 Failed:', cachedRes);
      failed = true;
    }

    // Test 11: GET /api/papers/:id/summary
    console.log('\n[Test 11] Testing GET /api/papers/:id/summary...');
    const getRes = await apiRequest(`/api/papers/${paperA._id}/summary`, 'GET', tokenA);
    const gr = getRes.data && getRes.data.data;
    const getHasSix = gr && sixSectionFields.every(f => typeof gr[f] === 'string');
    if (getRes.status === 200 && getRes.data.success === true && getHasSix) {
      console.log('✔ Test 11 Passed: GET summary returns all six sections.');
    } else {
      console.error('❌ Test 11 Failed:', getRes);
      failed = true;
    }

    // Test 12: Unauthorized GET /api/papers/:id/summary (cross-user)
    console.log('\n[Test 12] Testing unauthorized GET /api/papers/:id/summary...');
    const unauthGet = await apiRequest(`/api/papers/${paperA._id}/summary`, 'GET', tokenB);
    if (unauthGet.status === 403 && unauthGet.data.success === false) {
      console.log('✔ Test 12 Passed: Unauthorized summary access blocked (403).');
    } else {
      console.error('❌ Test 12 Failed:', unauthGet);
      failed = true;
    }

    // Cleanup
    await Summary.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await ResearchPaper.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

    if (failed) {
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL 12 SIX-SECTION AI SUMMARIZATION TESTS PASSED SUCCESSFULLY!');
    }
  } catch (err) {
    console.error('Summary test error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
