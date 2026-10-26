const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runFullE2ETest() {
  console.log('====================================================');
  console.log('   FULL END-TO-END INTEGRATION TEST SUITE           ');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const testUser = {
    name: `Dr. Researcher ${timestamp}`,
    email: `researcher_${timestamp}@example.edu`,
    password: 'Password123!',
  };

  let token = null;
  let paperId = null;

  // 1. Duplicate Registration Failure Case
  console.log('[Step 1] Testing User Registration...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  if (regRes.status !== 201 || !regData.data.token) {
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }
  console.log('✔ Registration successful. User ID:', regData.data.user.id);

  // Duplicate registration rejection
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  if (dupRes.status === 400) {
    console.log('✔ Duplicate registration correctly blocked (400).');
  } else {
    throw new Error('Duplicate registration was not blocked!');
  }

  // 2. Invalid Login Failure Case
  console.log('\n[Step 2] Testing Invalid Credentials Rejection...');
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: 'WrongPassword999' }),
  });
  if (badLoginRes.status === 401) {
    console.log('✔ Bad password rejected with 401 Unauthorized.');
  } else {
    throw new Error('Invalid login was not rejected!');
  }

  // 3. Successful Login
  console.log('\n[Step 3] Testing Legitimate Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.data.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  token = loginData.data.token;
  console.log('✔ Login successful. Received valid JWT token.');

  // 4. Verify Authentication / Profile (GET /api/auth/me)
  console.log('\n[Step 4] Verifying Authentication Profile...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  if (meRes.status !== 200 || meData.data.user.email !== testUser.email) {
    throw new Error('GET /api/auth/me failed: ' + JSON.stringify(meData));
  }
  console.log('✔ Authentication verified for:', meData.data.user.name);

  // Unauthorized request test (Missing / Invalid Token)
  const unauthRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: 'Bearer bad_token_xyz' },
  });
  if (unauthRes.status === 401) {
    console.log('✔ Invalid token correctly rejected with 401.');
  } else {
    throw new Error('Invalid token was not rejected!');
  }

  // 4b. Profile Update Test (PUT /api/auth/profile)
  console.log('\n[Step 4b] Testing Profile Name Update (PUT /api/auth/profile)...');
  const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'Professor Alan Turing' }),
  });
  const updateData = await updateRes.json();
  if (updateRes.status === 200 && updateData.data.user.name === 'Professor Alan Turing') {
    console.log('✔ Profile name updated successfully to:', updateData.data.user.name);
  } else {
    throw new Error('Profile update failed: ' + JSON.stringify(updateData));
  }

  // 4c. Password Change Test (PUT /api/auth/change-password)
  console.log('\n[Step 4c] Testing Password Change (PUT /api/auth/change-password)...');
  const chgPassRes = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword: testUser.password,
      newPassword: 'NewSecurePassword456!',
    }),
  });
  const chgPassData = await chgPassRes.json();
  if (chgPassRes.status === 200 && chgPassData.data.token) {
    console.log('✔ Password changed successfully. New token issued.');
    token = chgPassData.data.token;
  } else {
    throw new Error('Password change failed: ' + JSON.stringify(chgPassData));
  }

  // Verify login with new password
  const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: 'NewSecurePassword456!',
    }),
  });
  if (newLoginRes.status === 200) {
    console.log('✔ Verified login with new password works.');
  } else {
    throw new Error('Login with new password failed!');
  }

  // 5. Test Non-PDF and Oversized Upload Failure Cases
  console.log('\n[Step 5] Testing Upload Validation (Failure cases)...');
  const dummyTxt = new Blob(['Not a PDF file content'], { type: 'text/plain' });
  const badForm = new FormData();
  badForm.append('file', dummyTxt, 'notes.txt');

  const badUploadRes = await fetch(`${BASE_URL}/papers/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: badForm,
  });
  if (badUploadRes.status === 400) {
    console.log('✔ Non-PDF file upload rejected (400 Bad Request).');
  } else {
    throw new Error('Non-PDF upload was not rejected!');
  }

  // 6. Test Valid PDF Upload
  console.log('\n[Step 6] Testing Valid PDF Upload...');
  // Create a genuine minimal PDF buffer
  const samplePdfContent =
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 160>>stream\nBT\n/F1 12 Tf\n50 700 Td\n(Attention Is All You Need. We propose the Transformer architecture. Self-attention mechanisms replace recurrence. State of the art translation accuracy with 28.4 BLEU. Conclusion demonstrates superior parallelization and scalability.) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000227 00000 n \n0000000298 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n510\n%%EOF';

  const pdfBlob = new Blob([samplePdfContent], { type: 'application/pdf' });
  const validForm = new FormData();
  validForm.append('file', pdfBlob, 'Attention_Mechanisms_Study.pdf');

  const uploadRes = await fetch(`${BASE_URL}/papers/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: validForm,
  });
  const uploadData = await uploadRes.json();
  if (uploadRes.status !== 201 || !uploadData.data.paperId) {
    throw new Error('Valid PDF upload failed: ' + JSON.stringify(uploadData));
  }
  paperId = uploadData.data.paperId;
  console.log('✔ PDF successfully uploaded. Assigned Paper ID:', paperId);

  // 7. Test PDF Text Extraction / Processing (POST /api/papers/:id/process)
  console.log('\n[Step 7] Testing Text Extraction & Status Update...');
  const processRes = await fetch(`${BASE_URL}/papers/${paperId}/process`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const processData = await processRes.json();
  if (processRes.status !== 200 || processData.data.status !== 'completed') {
    throw new Error('Paper processing failed: ' + JSON.stringify(processData));
  }
  console.log(`✔ Paper processed. Words extracted: ${processData.data.wordCount}, Status: ${processData.data.status}`);

  // 8. Test AI Summary Generation (POST /api/papers/:id/summarize)
  console.log('\n[Step 8] Generating Structured AI Summary...');
  const sumRes = await fetch(`${BASE_URL}/papers/${paperId}/summarize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const sumData = await sumRes.json();
  if (sumRes.status !== 200 || !sumData.data.objective) {
    throw new Error('AI Summarization failed: ' + JSON.stringify(sumData));
  }
  console.log('✔ AI Summary generated successfully:');
  console.log('  - Objective:', sumData.data.objective.slice(0, 80) + '...');
  console.log('  - Key Findings count:', sumData.data.keyFindings.length);
  console.log('  - Conclusion:', sumData.data.conclusion.slice(0, 80) + '...');
  console.log('  - Model Used:', sumData.data.modelUsed);

  // 9. Test Summary Retrieval (GET /api/papers/:id/summary)
  console.log('\n[Step 9] Retrieving Stored Summary...');
  const getSumRes = await fetch(`${BASE_URL}/papers/${paperId}/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getSumData = await getSumRes.json();
  if (getSumRes.status !== 200 || getSumData.data.paperId !== paperId) {
    throw new Error('GET summary failed: ' + JSON.stringify(getSumData));
  }
  console.log('✔ Successfully retrieved saved summary from DB.');

  // 10. Test Download Summary as PDF & Text (GET /api/papers/:id/summary/download)
  console.log('\n[Step 10] Testing Summary Download as PDF and Text...');
  const dlPdfRes = await fetch(`${BASE_URL}/papers/${paperId}/summary/download?format=pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (dlPdfRes.status === 200 && dlPdfRes.headers.get('content-type') === 'application/pdf') {
    const pdfBuf = await dlPdfRes.arrayBuffer();
    console.log(`✔ Download Summary PDF successful (${pdfBuf.byteLength} bytes).`);
  } else {
    throw new Error('Download Summary PDF failed: ' + dlPdfRes.status);
  }

  const dlTxtRes = await fetch(`${BASE_URL}/papers/${paperId}/summary/download?format=txt`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (dlTxtRes.status === 200) {
    const txtContent = await dlTxtRes.text();
    console.log('✔ Download Summary Text successful. Contains header:', txtContent.includes('SUMMARY'));
  } else {
    throw new Error('Download Summary Text failed: ' + dlTxtRes.status);
  }

  // 11. Test Raw PDF Viewing (GET /api/papers/:id/pdf)
  console.log('\n[Step 11] Testing Raw PDF Stream Viewing...');
  const viewPdfRes = await fetch(`${BASE_URL}/papers/${paperId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (viewPdfRes.status === 200 && viewPdfRes.headers.get('content-type') === 'application/pdf') {
    const rawPdf = await viewPdfRes.arrayBuffer();
    console.log(`✔ Raw PDF stream received (${rawPdf.byteLength} bytes).`);
  } else {
    throw new Error('Raw PDF view failed: ' + viewPdfRes.status);
  }

  // 12. Test Suggested Questions (GET /api/papers/:id/questions)
  console.log('\n[Step 12] Testing Suggested Questions...');
  const qRes = await fetch(`${BASE_URL}/papers/${paperId}/questions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const qData = await qRes.json();
  if (qRes.status === 200 && Array.isArray(qData.data.questions) && qData.data.questions.length > 0) {
    console.log(`✔ Retrieved ${qData.data.questions.length} suggested questions:`);
    qData.data.questions.slice(0, 3).forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
  } else {
    throw new Error('Suggested questions failed: ' + JSON.stringify(qData));
  }

  // 13. Test Empty Chat Message Rejection (Failure Case)
  console.log('\n[Step 13] Testing Empty Chat Message Rejection...');
  const emptyChatRes = await fetch(`${BASE_URL}/papers/${paperId}/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: '   ' }),
  });
  if (emptyChatRes.status === 400) {
    console.log('✔ Empty chat question correctly rejected with 400 Bad Request.');
  } else {
    throw new Error('Empty chat message was not rejected!');
  }

  // 14. Test Grounded Ask AI / Chat (POST /api/papers/:id/chat)
  console.log('\n[Step 14] Testing Ask AI Grounded Q&A...');
  const chatRes = await fetch(`${BASE_URL}/papers/${paperId}/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'What architecture does this paper propose?' }),
  });
  const chatData = await chatRes.json();
  if (chatRes.status === 200 && chatData.data.answer) {
    console.log('✔ Grounded AI response received:');
    console.log(`   "${chatData.data.answer.slice(0, 100)}..."`);
  } else {
    throw new Error('Chat failed: ' + JSON.stringify(chatData));
  }

  // 15. Test Chat History (GET /api/papers/:id/chat)
  console.log('\n[Step 15] Verifying Chat History Session...');
  const histRes = await fetch(`${BASE_URL}/papers/${paperId}/chat`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const histData = await histRes.json();
  if (histRes.status === 200 && histData.data.messages.length >= 2) {
    console.log(`✔ Chat history verified (${histData.data.messages.length} messages in session).`);
  } else {
    throw new Error('Chat history failed: ' + JSON.stringify(histData));
  }

  // 16. Test Dashboard Papers List & Statistics (GET /api/papers)
  console.log('\n[Step 16] Testing Dashboard Papers List & Pagination...');
  const dashRes = await fetch(`${BASE_URL}/papers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dashData = await dashRes.json();
  if (dashRes.status === 200 && dashData.data.papers.length > 0) {
    console.log(`✔ User dashboard returned ${dashData.data.papers.length} papers. Total count: ${dashData.data.pagination.total}`);
  } else {
    throw new Error('Dashboard fetch failed: ' + JSON.stringify(dashData));
  }

  // 17. Test Forgot Password
  console.log('\n[Step 17] Testing Forgot Password Request...');
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email }),
  });
  const forgotData = await forgotRes.json();
  if (forgotRes.status === 200 && forgotData.success) {
    console.log('✔ Forgot password email dispatch triggered successfully.');
  } else {
    throw new Error('Forgot password failed: ' + JSON.stringify(forgotData));
  }

  // 18. Cross-User Isolation Security Check
  console.log('\n[Step 18] Testing Multi-Tenant Data Isolation (Cross-User Security)...');
  const userBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Other User',
      email: `other_${timestamp}@example.edu`,
      password: 'Password123!',
    }),
  });
  const userBData = await userBRes.json();
  const tokenB = userBData.data.token;

  const crossAccessRes = await fetch(`${BASE_URL}/papers/${paperId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (crossAccessRes.status === 403) {
    console.log('✔ Cross-user access to paper metadata strictly blocked with 403 Forbidden.');
  } else {
    throw new Error('Security flaw: User B could access User A paper!');
  }

  const crossSummaryRes = await fetch(`${BASE_URL}/papers/${paperId}/summary`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (crossSummaryRes.status === 403) {
    console.log('✔ Cross-user summary access strictly blocked with 403 Forbidden.');
  } else {
    throw new Error('Security flaw: User B could access User A summary!');
  }

  // 19. Paper Deletion & Cascade Cleanup (DELETE /api/papers/:id)
  console.log('\n[Step 19] Testing Paper Deletion with Cascade Cleanup...');
  const delRes = await fetch(`${BASE_URL}/papers/${paperId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (delRes.status === 200) {
    console.log('✔ Paper and all associated records deleted successfully.');
  } else {
    throw new Error('Paper delete failed: ' + delRes.status);
  }

  console.log('\n====================================================');
  console.log('   🎉 ALL 19 END-TO-END FLOW TESTS PASSED!          ');
  console.log('====================================================\n');
}

runFullE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  });
