/* =========================================================================
   UPLOAD PAGE JAVASCRIPT (PaperMind.AI Phase 3.4.1)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- ROUTE GUARD: Redirect unauthenticated users to login ---
    if (!window.requireAuth || !window.requireAuth()) return;

    // --- DOM Elements ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseTrigger = document.getElementById('browseTrigger');
    const uploadEmptyState = document.getElementById('uploadEmptyState');
    const uploadSelectedState = document.getElementById('uploadSelectedState');
    
    const selectedFileName = document.getElementById('selectedFileName');
    const selectedFileSize = document.getElementById('selectedFileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const generateBtn = document.getElementById('generateBtn');

    let selectedFile = null;

    // --- Drag & Drop Handlers ---
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Dragover visual & text change
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
                document.getElementById('uploadZoneTitle').textContent = "Drop your PDF here";
                document.getElementById('uploadZoneSubtitle').style.opacity = '0';
                const uploadIcon = document.getElementById('uploadIcon');
                if (uploadIcon) uploadIcon.style.transform = 'scale(1.15)';
            }, false);
        });

        // Dragleave restore text
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
                document.getElementById('uploadZoneTitle').textContent = "Drag & Drop your Research Paper";
                document.getElementById('uploadZoneSubtitle').style.opacity = '1';
                const uploadIcon = document.getElementById('uploadIcon');
                if (uploadIcon) uploadIcon.style.transform = 'scale(1)';
            }, false);
        });

        dropZone.addEventListener('drop', handleDrop, false);
        
        dropZone.addEventListener('click', (e) => {
            if (e.target.closest('#uploadSelectedState') || e.target.closest('.file-actions-row')) {
                return;
            }
            fileInput.click();
        });
    }

    if (browseTrigger) {
        browseTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // --- Action Buttons ---
    const previewFileBtn = document.getElementById('previewFileBtn');
    const replaceFileBtn = document.getElementById('replaceFileBtn');
    const removeFileBtnElement = document.getElementById('removeFileBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const progressOverlay = document.getElementById('progressOverlay');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressStatusTitle = document.getElementById('progressStatusTitle');
    const processingStepsList = document.getElementById('processingStepsList');
    const successState = document.getElementById('successState');

    let uploadInterval = null;
    let stepTimeouts = [];

    const pdfPreviewModal = document.getElementById('pdfPreviewModal');
    const closePreviewModal = document.getElementById('closePreviewModal');
    const pdfPreviewFrame = document.getElementById('pdfPreviewFrame');
    const previewModalTitle = document.getElementById('previewModalTitle');

    if (previewFileBtn) {
        previewFileBtn.addEventListener('click', () => {
            if (!selectedFile) return;
            
            const fileURL = URL.createObjectURL(selectedFile);
            pdfPreviewFrame.src = fileURL;
            previewModalTitle.textContent = selectedFile.name;
            pdfPreviewModal.style.display = 'flex';
        });
    }
    
    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', () => {
            pdfPreviewModal.style.display = 'none';
            const currentSrc = pdfPreviewFrame.src;
            pdfPreviewFrame.src = '';
            URL.revokeObjectURL(currentSrc);
        });
    }

    if (replaceFileBtn) {
        replaceFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (removeFileBtnElement) {
        removeFileBtnElement.addEventListener('click', () => {
            resetUploadState();
        });
    }

    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => {
            cancelUploadFlow();
        });
    }

    // --- Segmented Control (Summary Length) ---
    const segmentBtns = document.querySelectorAll('.segment-btn');
    segmentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            segmentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            if (!selectedFile) return;
            startUploadFlow();
        });
    }

    async function startUploadFlow() {
        if (!selectedFile) return;

        // Check authentication
        if (window.authAPI && !window.authAPI.isAuthenticated()) {
            showToast('Please sign in to upload research papers.', 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 1000);
            return;
        }

        // Disable forms and buttons
        generateBtn.disabled = true;
        generateBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Generating...</span>
        `;
        
        // Hide details form, show progress overlay
        progressOverlay.style.display = 'flex';
        successState.style.display = 'none';
        processingStepsList.style.display = 'none';
        document.querySelector('.progress-ai-animation').style.display = 'flex';
        progressStatusTitle.style.display = 'block';
        progressStatusTitle.textContent = "Uploading PDF...";
        
        // Reset progress bar
        progressBarFill.style.width = '10%';
        progressPercentage.textContent = '10%';
        document.querySelector('.progress-bar-container').style.display = 'block';
        progressPercentage.style.display = 'block';
        cancelUploadBtn.style.display = 'block';

        let uploadProgress = 10;
        uploadInterval = setInterval(() => {
            if (uploadProgress < 85) {
                uploadProgress += 10;
                progressBarFill.style.width = uploadProgress + '%';
                progressPercentage.textContent = uploadProgress + '%';
            }
        }, 150);

        try {
            // Real Upload API Call
            const uploadRes = await window.paperAPI.upload(selectedFile);
            clearInterval(uploadInterval);

            progressBarFill.style.width = '100%';
            progressPercentage.textContent = '100%';

            const paperId = uploadRes.data.paperId;
            const uploadData = {
                paperId: paperId,
                fileName: selectedFile.name,
                fileSize: formatBytes(selectedFile.size),
                uploadTime: new Date().toISOString()
            };
            window.setActivePaperId(paperId, uploadData);

            setTimeout(() => {
                startAiProcessingSteps(paperId, uploadData);
            }, 400);

        } catch (err) {
            clearInterval(uploadInterval);
            cancelUploadFlow();
            showToast(err.message || 'Upload failed. Please try again.', 'error');
        }
    }

    async function startAiProcessingSteps(paperId, uploadData) {
        // Hide progress elements
        document.querySelector('.progress-bar-container').style.display = 'none';
        progressPercentage.style.display = 'none';
        progressStatusTitle.textContent = "Processing PDF...";
        
        // Show steps
        processingStepsList.style.display = 'flex';
        
        // Reset all steps UI
        const steps = [
            document.getElementById('step1'),
            document.getElementById('step2'),
            document.getElementById('step3'),
            document.getElementById('step4'),
            document.getElementById('step5')
        ];
        
        steps.forEach((step, idx) => {
            if (idx === 0) {
                step.className = 'active';
                step.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Reading PDF...`;
            } else {
                step.className = '';
                step.innerHTML = `<i class="fa-regular fa-circle"></i> ${step.textContent.trim()}`;
            }
        });

        try {
            // Step 1 -> Step 2: Extract text
            await new Promise(r => setTimeout(r, 600));
            markStepDone(steps[0], 'Reading PDF...');
            makeStepActive(steps[1], 'Extracting Text...');

            await window.paperAPI.process(paperId);
            markStepDone(steps[1], 'Extracting Text...');

            // Step 3 -> Step 4: AI Summarization
            makeStepActive(steps[2], 'Finding Key Points...');
            await new Promise(r => setTimeout(r, 600));
            markStepDone(steps[2], 'Finding Key Points...');
            makeStepActive(steps[3], 'Generating AI Summary...');

            const summaryRes = await window.paperAPI.summarize(paperId);
            if (summaryRes && summaryRes.data) {
                sessionStorage.setItem('papermind_summary_data', JSON.stringify(summaryRes.data));
            }

            markStepDone(steps[3], 'Generating AI Summary...');
            makeStepActive(steps[4], 'Almost Ready...');
            await new Promise(r => setTimeout(r, 500));
            markStepDone(steps[4], 'Almost Ready...');

            showSuccessState();

        } catch (err) {
            cancelUploadFlow();
            showToast(err.message || 'AI processing failed. Please try again.', 'error');
        }
    }

    function runStepTimer(index, delay, callback) {
        const timeout = setTimeout(callback, delay);
        stepTimeouts.push(timeout);
    }

    function markStepDone(element, text) {
        element.className = 'done';
        element.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${text}`;
    }

    function makeStepActive(element, text) {
        element.className = 'active';
        element.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${text}`;
    }

    function showSuccessState() {
        cancelUploadBtn.style.display = 'none';
        processingStepsList.style.display = 'none';
        document.querySelector('.progress-ai-animation').style.display = 'none';
        progressStatusTitle.style.display = 'none';
        
        successState.style.display = 'flex';
        
        // Save metadata to sessionStorage for the Summary page
        if (selectedFile) {
            const uploadData = {
                fileName: selectedFile.name,
                fileSize: formatBytes(selectedFile.size),
                uploadTime: new Date().toISOString()
            };
            sessionStorage.setItem('papermind_upload_data', JSON.stringify(uploadData));
        }
        
        setTimeout(() => {
            window.location.href = 'summary.html';
        }, 2000);
    }

    function cancelUploadFlow() {
        // Clear all timers
        clearInterval(uploadInterval);
        stepTimeouts.forEach(t => clearTimeout(t));
        stepTimeouts = [];

        // Hide overlay
        progressOverlay.style.display = 'none';
        
        // Reset generate button
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span class="btn-text">Generate AI Summary</span>
        `;
        showToast('Upload and analysis cancelled.', 'info');
    }

    // --- Helpers ---
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            validateAndSelectFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            validateAndSelectFile(files[0]);
        }
    }

    function validateAndSelectFile(file) {
        fileInput.value = '';

        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            showToast('Invalid File Type. Please upload a PDF file only.', 'error');
            return;
        }

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('File size exceeds the 20 MB limit.', 'error');
            return;
        }

        selectedFile = file;
        
        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = formatBytes(file.size);
        
        // Show upload time
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('selectedUploadTime').textContent = `Uploaded at ${timeStr}`;

        uploadEmptyState.style.display = 'none';
        uploadSelectedState.style.display = 'block';

        generateBtn.disabled = false;
        dropZone.style.borderColor = 'rgba(52, 211, 153, 0.4)';
    }

    function resetUploadState() {
        selectedFile = null;
        fileInput.value = '';
        
        uploadEmptyState.style.display = 'block';
        uploadSelectedState.style.display = 'none';

        generateBtn.disabled = true;
        dropZone.style.borderColor = 'rgba(129, 140, 248, 0.25)';
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = 'glass-card toast-alert';
        
        const isError = type === 'error';
        const iconClass = isError ? 'fa-solid fa-triangle-exclamation text-danger' : 'fa-solid fa-circle-info text-primary';
        const borderColor = isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)';
        
        toast.style.borderColor = borderColor;
        toast.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${message}</span>
        `;
        
        // Add toast styling dynamically to document if not present
        if (!document.getElementById('toastStyle')) {
            const style = document.createElement('style');
            style.id = 'toastStyle';
            style.textContent = `
                .toast-alert {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    padding: 1rem 1.5rem;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: rgba(17, 24, 39, 0.9) !important;
                    border: 1px solid rgba(239, 68, 68, 0.3) !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                    color: #fff;
                    font-size: 0.9rem;
                    border-radius: 12px;
                    animation: toastIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes toastIn {
                    from { transform: translateY(-20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ── URL IMPORT TAB LOGIC ────────────────────────────────────────────────

    const tabPdf      = document.getElementById('tabPdf');
    const tabUrl      = document.getElementById('tabUrl');
    const urlImportCard = document.getElementById('urlImportCard');
    const urlInput    = document.getElementById('urlInput');
    const clearUrlBtn = document.getElementById('clearUrlBtn');
    const generateUrlBtn = document.getElementById('generateUrlBtn');
    const urlErrorMsg  = document.getElementById('urlErrorMsg');
    const urlErrorText = document.getElementById('urlErrorText');

    // Tab switcher
    if (tabPdf && tabUrl) {
        tabPdf.addEventListener('click', () => {
            tabPdf.classList.add('active');
            tabUrl.classList.remove('active');
            tabPdf.setAttribute('aria-pressed', 'true');
            tabUrl.setAttribute('aria-pressed', 'false');
            if (urlImportCard) urlImportCard.style.display = 'none';
            if (dropZone) dropZone.style.display = '';
        });

        tabUrl.addEventListener('click', () => {
            tabUrl.classList.add('active');
            tabPdf.classList.remove('active');
            tabUrl.setAttribute('aria-pressed', 'true');
            tabPdf.setAttribute('aria-pressed', 'false');
            if (urlImportCard) urlImportCard.style.display = '';
            if (dropZone) dropZone.style.display = 'none';
            if (urlInput) urlInput.focus();
        });
    }

    // URL input: enable button when valid URL entered
    if (urlInput) {
        urlInput.addEventListener('input', () => {
            const val = urlInput.value.trim();
            if (clearUrlBtn) clearUrlBtn.style.display = val ? '' : 'none';

            // Hide any previous error
            if (urlErrorMsg) urlErrorMsg.style.display = 'none';

            // Enable submit button if input looks like a URL
            if (generateUrlBtn) {
                generateUrlBtn.disabled = !(val.startsWith('http://') || val.startsWith('https://'));
            }
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && generateUrlBtn && !generateUrlBtn.disabled) {
                generateUrlBtn.click();
            }
        });
    }

    if (clearUrlBtn) {
        clearUrlBtn.addEventListener('click', () => {
            if (urlInput) { urlInput.value = ''; urlInput.focus(); }
            clearUrlBtn.style.display = 'none';
            if (generateUrlBtn) generateUrlBtn.disabled = true;
            if (urlErrorMsg) urlErrorMsg.style.display = 'none';
        });
    }

    // URL Import & Summarize button
    if (generateUrlBtn) {
        generateUrlBtn.addEventListener('click', async () => {
            const rawUrl = urlInput ? urlInput.value.trim() : '';
            if (!rawUrl) return;

            // Basic client-side validation
            if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
                showUrlError('Please enter a valid URL starting with http:// or https://');
                return;
            }

            // Show progress overlay (same as PDF upload)
            if (progressOverlay) progressOverlay.style.display = 'flex';
            progressStatusTitle.textContent = 'Fetching paper from URL...';

            const origHtml = generateUrlBtn.innerHTML;
            generateUrlBtn.disabled = true;
            generateUrlBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Importing...</span>`;

            if (urlErrorMsg) urlErrorMsg.style.display = 'none';

            try {
                // Step 1: Import from URL
                if (processingStepsList) processingStepsList.style.display = 'flex';
                const steps = [
                    document.getElementById('step1'),
                    document.getElementById('step2'),
                    document.getElementById('step3'),
                    document.getElementById('step4'),
                    document.getElementById('step5'),
                ];

                if (steps[0]) makeStepActive(steps[0], 'Fetching URL...');

                const importRes = await window.paperAPI.importFromUrl(rawUrl);
                if (!importRes || !importRes.data || !importRes.data.paperId) {
                    throw new Error('URL import failed — no paper ID returned.');
                }

                const paperId = importRes.data.paperId;

                // Store paper metadata in session
                const uploadData = {
                    paperId,
                    fileName: importRes.data.fileName || 'imported-paper.html',
                    fileSize: `${Math.round((importRes.data.wordCount || 0) * 5 / 1024)} KB`,
                    uploadTime: new Date().toISOString(),
                    sourceType: 'url',
                    sourceUrl: rawUrl,
                    title: importRes.data.title,
                };
                window.setActivePaperId(paperId, uploadData);

                if (steps[0]) markStepDone(steps[0], 'Fetching URL...');
                if (steps[1]) markStepDone(steps[1], 'Extracting Text...');
                if (steps[2]) makeStepActive(steps[2], 'Finding Key Points...');
                await new Promise(r => setTimeout(r, 600));
                if (steps[2]) markStepDone(steps[2], 'Finding Key Points...');
                if (steps[3]) makeStepActive(steps[3], 'Generating AI Summary...');

                // Step 2: Summarize the imported paper
                const summaryRes = await window.paperAPI.summarize(paperId);
                if (summaryRes && summaryRes.data) {
                    sessionStorage.setItem('papermind_summary_data', JSON.stringify(summaryRes.data));
                }

                if (steps[3]) markStepDone(steps[3], 'Generating AI Summary...');
                if (steps[4]) makeStepActive(steps[4], 'Almost Ready...');
                await new Promise(r => setTimeout(r, 500));
                if (steps[4]) markStepDone(steps[4], 'Almost Ready...');

                // Navigate to summary page
                showSuccessState();

            } catch (err) {
                if (progressOverlay) progressOverlay.style.display = 'none';
                generateUrlBtn.disabled = false;
                generateUrlBtn.innerHTML = origHtml;
                showUrlError(err.message || 'Failed to import paper from URL. Please check the URL and try again.');
                showToast(err.message || 'URL import failed', 'error');
            }
        });
    }

    function showUrlError(msg) {
        if (urlErrorMsg && urlErrorText) {
            urlErrorText.textContent = msg;
            urlErrorMsg.style.display = '';
        }
    }
});
