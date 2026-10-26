/**
 * Unit-only tests for AI service six-section structure — no MongoDB required.
 * Run with: node test/unit.summary.test.js
 */
const dotenv = require('dotenv');
dotenv.config();

const aiService = require('../src/services/aiService');
const exportService = require('../src/services/exportService');

let failed = false;
const sixSectionFields = ['objective', 'background', 'methods', 'results', 'conclusions', 'limitations'];

// ─── Test 1: Chunking ─────────────────────────────────────────────────────────
console.log('\n[Unit Test 1] Text chunking...');
const shortText = 'Paragraph one.\n\nParagraph two.';
const singleChunk = aiService.chunkText(shortText, 500);
if (singleChunk.length === 1 && singleChunk[0] === shortText) {
  console.log('✔ Test 1a: Short text preserved as 1 chunk.');
} else {
  console.error('❌ Test 1a Failed:', singleChunk); failed = true;
}

const multiPara = 'A'.repeat(300) + '\n\n' + 'B'.repeat(300);
const twoChunks = aiService.chunkText(multiPara, 400);
if (twoChunks.length === 2) {
  console.log('✔ Test 1b: Long text correctly split into 2 chunks.');
} else {
  console.error('❌ Test 1b Failed: expected 2 chunks, got', twoChunks.length); failed = true;
}

// ─── Test 2: Six-section validation ───────────────────────────────────────────
console.log('\n[Unit Test 2] Six-section structure validation...');
const validJson = {
  objective: 'To analyze transformer latency and optimize memory consumption in large language models.',
  background: 'Transformers have demonstrated SOTA performance. However, memory bottlenecks limit deployment on edge devices.',
  methods: 'Dynamic INT8 quantization applied to attention weights. Benchmarked on BERT-Large using GLUE and SQuAD.',
  results: 'Achieved 34% memory reduction. 210ms faster time-to-first-token. 99.2% accuracy maintained on benchmarks.',
  conclusions: 'Quantization is viable for production deployment without significant quality loss.',
  limitations: 'Only tested on encoder-only architectures. Encoder-decoder models not evaluated.',
  suggestedQuestions: ['How does this scale to 70B models?', 'What is the accuracy trade-off on non-English benchmarks?'],
};

const validated = aiService.validateSummaryStructure(validJson);
const allPresent = sixSectionFields.every(f => validated[f] && validated[f].length > 0);

if (allPresent && Array.isArray(validated.suggestedQuestions) && validated.keyFindings && validated.keyFindings.length > 0) {
  console.log('✔ Test 2: All 6 sections validated correctly.');
  console.log('  Fields:', sixSectionFields.join(', '));
} else {
  console.error('❌ Test 2 Failed — missing fields:', sixSectionFields.filter(f => !validated[f]));
  failed = true;
}

// ─── Test 3: Validation rejects missing sections ────────────────────────────
console.log('\n[Unit Test 3] Validation rejects incomplete structures...');
const incompleteJson = { objective: 'Short valid objective text for testing.' };
try {
  aiService.validateSummaryStructure(incompleteJson);
  console.error('❌ Test 3 Failed: should have thrown for missing sections');
  failed = true;
} catch (err) {
  console.log('✔ Test 3: Correctly rejected incomplete structure —', err.message);
}

// ─── Test 4: Fallback generates six sections ───────────────────────────────
console.log('\n[Unit Test 4] Offline fallback produces six sections...');
const sampleText = 'Title: Deep Learning for Image Classification.\n\nAbstract: We propose a novel convolutional neural network architecture that improves accuracy on CIFAR-10. The model uses residual connections and batch normalization. We achieve 94.5% accuracy, outperforming previous methods by 2.3 percentage points on the standard test set.\n\nExperiments: Training was performed on 8 NVIDIA V100 GPUs for 100 epochs using SGD with momentum 0.9.\n\nResults: The model achieves state-of-the-art results on CIFAR-10 and CIFAR-100. On ImageNet, our method outperforms ResNet-50 by 1.7% top-1 accuracy with 40% fewer parameters.\n\nLimitations: The model requires significant compute for training. We have only evaluated on standard computer vision benchmarks.';
const fallbackResult = aiService.generateFallbackSummary(sampleText, 'Deep Learning Classification');
const fallbackHasSix = sixSectionFields.every(f => typeof fallbackResult[f] === 'string' && fallbackResult[f].length > 0);
if (fallbackHasSix && Array.isArray(fallbackResult.keyFindings) && fallbackResult.suggestedQuestions.length > 0) {
  console.log('✔ Test 4: Fallback engine produces all six sections.');
  sixSectionFields.forEach(f => console.log(`  ${f}: "${fallbackResult[f].slice(0, 50)}..."`));
} else {
  console.error('❌ Test 4 Failed — missing:', sixSectionFields.filter(f => !fallbackResult[f] || fallbackResult[f].length === 0));
  failed = true;
}

// ─── Test 5: TXT export contains all six section headers ─────────────────────
console.log('\n[Unit Test 5] TXT export includes all six section headers...');
const mockPaper = { title: 'Test Paper', originalFileName: 'test.pdf' };
const mockSummary = {
  objective: 'The research objective.',
  background: 'The background context.',
  methods: 'The methods employed.',
  results: 'The quantitative results.',
  conclusions: 'The conclusions and implications.',
  limitations: 'The acknowledged limitations.',
  keyFindings: ['Finding A', 'Finding B'],
  conclusion: 'The conclusions.',
  fullSummary: 'A full summary paragraph.',
  suggestedQuestions: ['What are the key contributions?'],
};
const textExport = exportService.generateTextSummary(mockPaper, mockSummary);
const requiredHeaders = [
  'OBJECTIVE OR PURPOSE',
  'BACKGROUND OR CONTEXT',
  'METHODS',
  'RESULTS OR FINDINGS',
  'CONCLUSIONS OR IMPLICATIONS',
  'LIMITATIONS',
];
const missingHeaders = requiredHeaders.filter(h => !textExport.includes(h));
if (missingHeaders.length === 0 && !textExport.includes('SUGGESTED QUESTIONS')) {
  console.log('✔ Test 5: TXT export contains all six section headers and strictly excludes Suggested Questions.');
} else {
  console.error('❌ Test 5 Failed — missing headers or contains suggested questions:', missingHeaders);
  failed = true;
}

// ─── Test 6: Legacy backward compat in toClientJSON ─────────────────────────
console.log('\n[Unit Test 6] Legacy document backward compatibility...');
const Summary = require('../src/models/Summary');
const legacyDoc = {
  _id: 'legacy-id',
  paperId: 'paper-id',
  objective: 'Legacy objective only.',
  background: '',
  methods: '',
  results: '',
  conclusions: '',
  limitations: '',
  keyFindings: ['Legacy finding one', 'Legacy finding two'],
  conclusion: 'Legacy conclusion text.',
  fullSummary: 'Legacy full summary text.',
  suggestedQuestions: ['Legacy question?'],
  modelUsed: 'gemini-1.5-flash',
  processingTimeMs: 800,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const legacyJson = Summary.prototype.toClientJSON.call(legacyDoc);
if (
  legacyJson.objective === 'Legacy objective only.' &&
  legacyJson.background === '' &&
  legacyJson.conclusions === 'Legacy conclusion text.' &&
  legacyJson.keyFindings.length === 2 &&
  legacyJson.fullSummary === 'Legacy full summary text.'
) {
  console.log('✔ Test 6: Legacy documents handled safely — empty new sections returned as empty strings.');
} else {
  console.error('❌ Test 6 Failed:', legacyJson);
  failed = true;
}

// ─── Test 7: keyFindings auto-derived from results when array not provided ───
console.log('\n[Unit Test 7] keyFindings derived from results string...');
const noArrayJson = {
  objective: 'Valid objective text here for test seven.',
  background: 'Valid background context text for this test.',
  methods: 'Valid methods description for test seven here.',
  results: 'First result sentence.\nSecond result sentence.\nThird result sentence.',
  conclusions: 'Valid conclusions and implications for test seven.',
  limitations: 'The authors do not explicitly report limitations in this paper.',
  suggestedQuestions: ['A question?'],
};
const derivedValidated = aiService.validateSummaryStructure(noArrayJson);
if (Array.isArray(derivedValidated.keyFindings) && derivedValidated.keyFindings.length > 0) {
  console.log('✔ Test 7: keyFindings auto-derived from results string —', derivedValidated.keyFindings.length, 'items.');
} else {
  console.error('❌ Test 7 Failed:', derivedValidated.keyFindings);
  failed = true;
}

// ─── Final ────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
if (failed) {
  console.error('❌ SOME UNIT TESTS FAILED');
  process.exit(1);
} else {
  console.log('🎉 ALL 7 UNIT TESTS PASSED (no DB required)');
  process.exit(0);
}
