/* =========================================================================
   SUMMARY PAGE JAVASCRIPT
   - Renders all six academic sections from real backend data
   - Populates real paper metadata (pages, words, model, processing time)
   - Download as PDF or TXT
   - Copy full summary to clipboard
   - View original PDF
   - Suggested questions linking to Chat page
   ========================================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    // ── Route guard ──────────────────────────────────────────────────────────
    if (!window.requireAuth || !window.requireAuth()) return;

    // ── DOM refs ─────────────────────────────────────────────────────────────
    const btnCopy      = document.getElementById('btnCopy');
    const btnViewPdf   = document.getElementById('btnViewPdf');
    const btnDownload  = document.getElementById('btnDownload');         // legacy button in header
    const btnDownloadPdf = document.getElementById('btnDownloadPdf');   // sidebar PDF button
    const btnDownloadTxt = document.getElementById('btnDownloadTxt');   // sidebar TXT button

    const paperTitle    = document.getElementById('paperTitle');
    const paperSubtitle = document.getElementById('paperSubtitle');

    // Metadata sidebar
    const metaTitle    = document.getElementById('metaTitle');
    const metaFileName = document.getElementById('metaFileName');
    const metaStatus   = document.getElementById('metaStatus');
    const metaPages    = document.getElementById('metaPages');
    const metaWords    = document.getElementById('metaWords');
    const metaReadingTime = document.getElementById('metaReadingTime');
    const metaModel    = document.getElementById('metaModel');
    const metaProcessingTime = document.getElementById('metaProcessingTime');
    const timeSavedTip  = document.getElementById('timeSavedTip');
    const timeSavedVal  = document.getElementById('timeSavedVal');

    // Seven-section content divs
    const executiveOverviewContent = document.getElementById('executiveOverviewContent');
    const objectiveContent   = document.getElementById('objectiveContent');
    const backgroundContent  = document.getElementById('backgroundContent');
    const methodsContent     = document.getElementById('methodsContent');
    const resultsContent     = document.getElementById('resultsContent');
    const conclusionsContent = document.getElementById('conclusionsContent');
    const limitationsContent = document.getElementById('limitationsContent');

    // Executive summary & expand-all controls
    const executiveSummaryCard        = document.getElementById('executiveSummaryCard');
    const executiveSummaryBody        = document.getElementById('executiveSummaryBody');
    const btnScrollToCompleteSummary  = document.getElementById('btnScrollToCompleteSummary');
    const btnToggleAllSections        = document.getElementById('btnToggleAllSections');
    const toggleAllText               = document.getElementById('toggleAllText');
    const toggleAllIcon               = document.getElementById('toggleAllIcon');

    // Insights + questions
    const insightsGrid          = document.getElementById('insightsGrid');
    const questionsCard         = document.getElementById('questionsCard');
    const suggestedQuestionsList = document.getElementById('suggestedQuestionsList');

    const paperId = window.getActivePaperId ? window.getActivePaperId() : null;

    // ── Helpers ──────────────────────────────────────────────────────────────
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Extracts a concise short preview (1-2 sentences, max ~200 chars).
     */
    function extractShortPreview(text, maxLength = 210) {
        if (!text) return '';
        const clean = text.trim();
        // If already short, return as is
        if (clean.length <= maxLength) return clean;

        // Try breaking at first sentence boundary
        const firstSentenceMatch = clean.match(/^([^.!?]+[.!?])/);
        if (firstSentenceMatch && firstSentenceMatch[1].length >= 50 && firstSentenceMatch[1].length <= maxLength) {
            return firstSentenceMatch[1].trim();
        }

        // Otherwise break cleanly at last space before maxLength
        const sliced = clean.slice(0, maxLength);
        const lastSpace = sliced.lastIndexOf(' ');
        const boundary = lastSpace > 50 ? lastSpace : maxLength;
        return clean.slice(0, boundary).trim() + '...';
    }

    /**
     * Renders a section with Short Summary preview and an interactive "Read More" button.
     * Expands to reveal the full text with paragraphs preserved.
     */
    function renderSectionWithReadMore(el, rawText, sectionName = 'Section') {
        if (!el) return;
        if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
            el.innerHTML = `<p style="color: var(--text-muted); font-style: italic;">
                Not explicitly reported in this paper.
            </p>`;
            return;
        }

        const trimmed = rawText.trim();
        const paragraphs = trimmed
            .split(/\n\s*\n|\n/)
            .map(p => p.trim())
            .filter(Boolean);

        const isLong = trimmed.length > 210 || paragraphs.length > 1;

        if (!isLong) {
            // Already short enough; render directly in full
            el.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
            return;
        }

        const previewText = extractShortPreview(paragraphs[0] || trimmed, 210);
        const fullHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');

        el.innerHTML = `
            <div class="expandable-section-container" data-expanded="false">
                <div class="summary-short-preview">
                    <p>${escapeHtml(previewText)} <span class="preview-ellipsis">...</span></p>
                </div>
                <div class="summary-full-content" style="display: none;">
                    ${fullHtml}
                </div>
                <button type="button" class="btn-read-more" aria-label="Toggle full ${escapeHtml(sectionName)} summary">
                    <span class="btn-read-more-text">Read More</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
            </div>
        `;

        const container = el.querySelector('.expandable-section-container');
        const btn = el.querySelector('.btn-read-more');
        const previewEl = el.querySelector('.summary-short-preview');
        const fullEl = el.querySelector('.summary-full-content');
        const btnText = el.querySelector('.btn-read-more-text');
        const icon = btn.querySelector('i');

        btn.addEventListener('click', () => {
            const isExpanded = container.getAttribute('data-expanded') === 'true';
            setContainerExpanded(container, previewEl, fullEl, btnText, icon, btn, !isExpanded);
            updateGlobalExpandAllState();
        });
    }

    /**
     * Helper to expand/collapse a single section container.
     */
    function setContainerExpanded(container, previewEl, fullEl, btnText, icon, btn, expand) {
        if (!container) return;
        if (expand) {
            container.setAttribute('data-expanded', 'true');
            if (previewEl) previewEl.style.display = 'none';
            if (fullEl) fullEl.style.display = 'block';
            if (btnText) btnText.textContent = 'Show Less';
            if (icon) icon.className = 'fa-solid fa-chevron-up';
            if (btn) btn.classList.add('active');
        } else {
            container.setAttribute('data-expanded', 'false');
            if (previewEl) previewEl.style.display = 'block';
            if (fullEl) fullEl.style.display = 'none';
            if (btnText) btnText.textContent = 'Read More';
            if (icon) icon.className = 'fa-solid fa-chevron-down';
            if (btn) btn.classList.remove('active');
        }
    }

    /**
     * Renders Section 4 (Results / Findings) with bullet support and Read More.
     */
    function renderResultsSection(el, resultsText, keyFindingsArr) {
        if (!el) return;

        // If structured findings array exists
        if (Array.isArray(keyFindingsArr) && keyFindingsArr.length > 0) {
            const findings = keyFindingsArr.map(f => String(f).trim()).filter(Boolean);
            if (findings.length <= 2) {
                el.innerHTML = `<ul style="padding-left:1.25rem; margin:0;">
                    ${findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>`;
                return;
            }

            const previewItems = findings.slice(0, 2);
            const hiddenCount = findings.length - previewItems.length;

            el.innerHTML = `
                <div class="expandable-section-container" data-expanded="false">
                    <div class="summary-short-preview">
                        <ul style="padding-left:1.25rem; margin:0;">
                            ${previewItems.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="summary-full-content" style="display: none;">
                        <ul style="padding-left:1.25rem; margin:0;">
                            ${findings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                        </ul>
                    </div>
                    <button type="button" class="btn-read-more" aria-label="Toggle all findings">
                        <span class="btn-read-more-text">Read More (${hiddenCount} more findings)</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            `;

            const container = el.querySelector('.expandable-section-container');
            const btn = el.querySelector('.btn-read-more');
            const previewEl = el.querySelector('.summary-short-preview');
            const fullEl = el.querySelector('.summary-full-content');
            const btnText = el.querySelector('.btn-read-more-text');
            const icon = btn.querySelector('i');

            btn.addEventListener('click', () => {
                const isExpanded = container.getAttribute('data-expanded') === 'true';
                setContainerExpanded(container, previewEl, fullEl, btnText, icon, btn, !isExpanded);
                if (!isExpanded && btnText) btnText.textContent = 'Show Less';
                updateGlobalExpandAllState();
            });
            return;
        }

        // Otherwise render standard text results
        renderSectionWithReadMore(el, resultsText, 'Results');
    }

    /**
     * Updates global "Expand All" / "Collapse All" button state based on child containers.
     */
    function updateGlobalExpandAllState() {
        if (!btnToggleAllSections || !toggleAllText || !toggleAllIcon) return;
        const containers = document.querySelectorAll('.expandable-section-container');
        if (containers.length === 0) return;

        const allExpanded = Array.from(containers).every(c => c.getAttribute('data-expanded') === 'true');
        if (allExpanded) {
            toggleAllText.textContent = 'Collapse All';
            toggleAllIcon.className = 'fa-solid fa-down-left-and-up-right-to-center';
        } else {
            toggleAllText.textContent = 'Expand All';
            toggleAllIcon.className = 'fa-solid fa-up-right-and-down-left-from-center';
        }
    }

    /**
     * Renders Executive Short Summary synthesized card at top of summary view.
     */
    function renderExecutiveSummary(summaryData) {
        if (!executiveSummaryCard || !executiveSummaryBody) return;

        const objText = summaryData.objective || '';
        const conclText = summaryData.conclusions || summaryData.conclusion || '';
        const topFinding = Array.isArray(summaryData.keyFindings) && summaryData.keyFindings.length > 0
            ? summaryData.keyFindings[0]
            : (summaryData.results || '').split('.')[0];

        // Synthesize short summary paragraphs
        let synthHtml = '';
        if (objText) {
            synthHtml += `<p><strong>Core Objective:</strong> ${escapeHtml(extractShortPreview(objText, 250))}</p>`;
        }
        if (topFinding) {
            synthHtml += `<p><strong>Key Takeaway:</strong> ${escapeHtml(extractShortPreview(topFinding, 220))}</p>`;
        }
        if (conclText && conclText !== objText) {
            synthHtml += `<p><strong>Implication:</strong> ${escapeHtml(extractShortPreview(conclText, 220))}</p>`;
        }

        if (synthHtml) {
            executiveSummaryBody.innerHTML = synthHtml;
            executiveSummaryCard.style.display = 'block';
        }

        // Scroll to complete summary button
        if (btnScrollToCompleteSummary) {
            btnScrollToCompleteSummary.onclick = () => {
                expandAllSections();
                const mainCard = document.getElementById('summaryMainCard');
                if (mainCard) {
                    mainCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            };
        }
    }

    /**
     * Expand all section containers to full view.
     */
    function expandAllSections() {
        const containers = document.querySelectorAll('.expandable-section-container');
        containers.forEach(container => {
            const previewEl = container.querySelector('.summary-short-preview');
            const fullEl = container.querySelector('.summary-full-content');
            const btn = container.querySelector('.btn-read-more');
            const btnText = container.querySelector('.btn-read-more-text');
            const icon = btn ? btn.querySelector('i') : null;
            setContainerExpanded(container, previewEl, fullEl, btnText, icon, btn, true);
        });
        updateGlobalExpandAllState();
    }

    /**
     * Collapse all section containers to short summary preview.
     */
    function collapseAllSections() {
        const containers = document.querySelectorAll('.expandable-section-container');
        containers.forEach(container => {
            const previewEl = container.querySelector('.summary-short-preview');
            const fullEl = container.querySelector('.summary-full-content');
            const btn = container.querySelector('.btn-read-more');
            const btnText = container.querySelector('.btn-read-more-text');
            const icon = btn ? btn.querySelector('i') : null;
            setContainerExpanded(container, previewEl, fullEl, btnText, icon, btn, false);
        });
        updateGlobalExpandAllState();
    }

    // Wire up Global "Expand All / Collapse All" button
    if (btnToggleAllSections) {
        btnToggleAllSections.addEventListener('click', () => {
            const containers = document.querySelectorAll('.expandable-section-container');
            const anyCollapsed = Array.from(containers).some(c => c.getAttribute('data-expanded') !== 'true');
            if (anyCollapsed) {
                expandAllSections();
            } else {
                collapseAllSections();
            }
        });
    }

    /**
     * Smoothly scroll to a section and expand its full content.
     */
    window.scrollToSection = function(sectionId) {
        const target = document.getElementById(sectionId);
        if (!target) return;

        // Expand target container if collapsed
        const container = target.querySelector('.expandable-section-container');
        if (container) {
            const previewEl = container.querySelector('.summary-short-preview');
            const fullEl = container.querySelector('.summary-full-content');
            const btn = container.querySelector('.btn-read-more');
            const btnText = container.querySelector('.btn-read-more-text');
            const icon = btn ? btn.querySelector('i') : null;
            setContainerExpanded(container, previewEl, fullEl, btnText, icon, btn, true);
            updateGlobalExpandAllState();
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.transition = 'box-shadow 0.3s ease';
        target.style.boxShadow = '0 0 0 2px var(--primary)';
        setTimeout(() => { target.style.boxShadow = ''; }, 1800);
    };

    // ── 1. Read metadata from session storage (set by upload flow) ───────────
    const uploadDataStr = sessionStorage.getItem('papermind_upload_data');
    let uploadData = null;
    if (uploadDataStr) {
        try {
            uploadData = JSON.parse(uploadDataStr);
            const cleanTitle = (uploadData.fileName || 'Research Paper').replace(/\.pdf$/i, '');
            if (paperTitle)    paperTitle.textContent = cleanTitle;
            if (metaTitle)     metaTitle.textContent  = cleanTitle;
            if (metaFileName)  metaFileName.textContent = uploadData.fileName || '—';
            if (paperSubtitle) {
                const uploadDate = new Date(uploadData.uploadTime || Date.now());
                const timeStr = uploadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                paperSubtitle.textContent = `${uploadData.fileName || ''} • Uploaded at ${timeStr}`;
            }
        } catch (e) {
            console.error('Failed to parse upload session data:', e);
        }
    }

    // ── 2. Fetch or load summary from cache / API ────────────────────────────
    let summary = null;
    const cachedSummaryStr = sessionStorage.getItem('papermind_summary_data');
    if (cachedSummaryStr) {
        try {
            const parsed = JSON.parse(cachedSummaryStr);
            if (parsed && (String(parsed.paperId) === String(paperId) || String(parsed.summaryId) === String(paperId))) {
                summary = parsed;
            } else {
                sessionStorage.removeItem('papermind_summary_data');
            }
        } catch (e) {}
    }

    const summaryLoadingState = document.getElementById('summaryLoadingState');
    const summaryMainCard = document.getElementById('summaryMainCard');

    if (!summary && paperId && window.paperAPI) {
        if (summaryLoadingState) summaryLoadingState.style.display = 'block';
        if (summaryMainCard) summaryMainCard.style.opacity = '0.5';

        try {
            // First try to fetch saved summary
            const res = await window.paperAPI.getSummary(paperId);
            if (res && res.data) {
                summary = res.data;
                sessionStorage.setItem('papermind_summary_data', JSON.stringify(summary));
            }
        } catch (err) {
            console.warn('Saved summary not found on backend. Generating AI summary now...', err.message);
            try {
                // If not generated yet, generate it on the fly!
                const genRes = await window.paperAPI.summarizePaper(paperId);
                if (genRes && genRes.data) {
                    summary = genRes.data;
                    sessionStorage.setItem('papermind_summary_data', JSON.stringify(summary));
                }
            } catch (genErr) {
                console.error('Failed to generate summary:', genErr.message);
                if (window.showToast) {
                    window.showToast('Could not load summary: ' + (genErr.message || 'Error'), 'error');
                }
            }
        } finally {
            if (summaryLoadingState) summaryLoadingState.style.display = 'none';
            if (summaryMainCard) summaryMainCard.style.opacity = '1';
        }
    }

    // ── 3. Render six academic sections with Short Summary + Read More ───────
    if (summary) {
        // Render Executive Summary Box
        renderExecutiveSummary(summary);

        // Section 1: Executive Overview
        renderSectionWithReadMore(executiveOverviewContent, summary.executiveOverview || summary.fullSummary || '', 'Executive Overview');

        // Section 2: Objective and Purpose
        renderSectionWithReadMore(objectiveContent, summary.objective, 'Objective and Purpose');

        // Section 3: Background and Context
        renderSectionWithReadMore(backgroundContent, summary.background || '', 'Background and Context');

        // Section 4: Methodology
        renderSectionWithReadMore(methodsContent, summary.methods, 'Methodology');

        // Section 5: Key Findings and Results
        renderResultsSection(resultsContent, summary.results, summary.keyFindings);

        // Section 6: Conclusions and Implications
        renderSectionWithReadMore(conclusionsContent, summary.conclusions || summary.conclusion || '', 'Conclusions and Implications');

        // Section 7: Limitations and Future Directions
        renderSectionWithReadMore(limitationsContent, summary.limitations, 'Limitations and Future Directions');

        // Initial check of global Expand All button
        updateGlobalExpandAllState();

        // Key Insights grid with click-to-expand links
        if (insightsGrid) {
            const topFinding = Array.isArray(summary.keyFindings) && summary.keyFindings.length > 0
                ? summary.keyFindings[0]
                : (summary.results || '').split('.')[0];

            insightsGrid.innerHTML = `
                <div class="insight-item" onclick="scrollToSection('sectionExecutiveOverview')" title="Click to read complete Executive Overview">
                    <div class="insight-icon indigo"><i class="fa-solid fa-compass"></i></div>
                    <div class="insight-content">
                        <h4>Overview</h4>
                        <p>${escapeHtml(extractShortPreview(summary.executiveOverview || summary.fullSummary || '', 140))}</p>
                        <span class="insight-link-hint">Read full section <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </div>
                <div class="insight-item" onclick="scrollToSection('sectionObjective')" title="Click to read complete Objective and Purpose">
                    <div class="insight-icon blue"><i class="fa-solid fa-bullseye"></i></div>
                    <div class="insight-content">
                        <h4>Objective</h4>
                        <p>${escapeHtml(extractShortPreview(summary.objective || '', 140))}</p>
                        <span class="insight-link-hint">Read full section <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </div>
                <div class="insight-item" onclick="scrollToSection('sectionResults')" title="Click to read complete Key Findings and Results">
                    <div class="insight-icon orange"><i class="fa-solid fa-chart-bar"></i></div>
                    <div class="insight-content">
                        <h4>Top Finding</h4>
                        <p>${escapeHtml(extractShortPreview(topFinding || '', 140))}</p>
                        <span class="insight-link-hint">Read full section <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </div>
                <div class="insight-item" onclick="scrollToSection('sectionConclusions')" title="Click to read complete Conclusions and Implications">
                    <div class="insight-icon teal"><i class="fa-solid fa-lightbulb"></i></div>
                    <div class="insight-content">
                        <h4>Conclusions</h4>
                        <p>${escapeHtml(extractShortPreview(summary.conclusions || summary.conclusion || '', 140))}</p>
                        <span class="insight-link-hint">Read full section <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </div>
                <div class="insight-item" onclick="scrollToSection('sectionLimitations')" title="Click to read complete Limitations and Future Directions">
                    <div class="insight-icon red"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div class="insight-content">
                        <h4>Limitations</h4>
                        <p>${escapeHtml(extractShortPreview(summary.limitations || 'Not explicitly reported.', 140))}</p>
                        <span class="insight-link-hint">Read full section <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </div>
            `;
        }

        // Metadata: AI model + processing time
        if (metaModel && summary.modelUsed) {
            metaModel.textContent = summary.modelUsed;
        }
        if (metaProcessingTime && summary.processingTimeMs) {
            metaProcessingTime.textContent = `${(summary.processingTimeMs / 1000).toFixed(1)}s`;
        }

        // Suggested questions
        if (Array.isArray(summary.suggestedQuestions) && summary.suggestedQuestions.length > 0 && questionsCard && suggestedQuestionsList) {
            questionsCard.style.display = '';
            suggestedQuestionsList.innerHTML = summary.suggestedQuestions.map(q => `
                <li onclick="navigateToChat(${JSON.stringify(q)})">
                    <i class="fa-solid fa-arrow-right"></i>
                    <span>${escapeHtml(q)}</span>
                </li>
            `).join('');
        }
    }

    // ── 4. Fetch paper metadata ──────────────────────────────────────────────
    if (paperId && window.paperAPI) {
        try {
            const paperRes = await window.paperAPI.getPaper(paperId);
            if (paperRes && paperRes.data && paperRes.data.paper) {
                const paper = paperRes.data.paper;

                const titleDisplay = paper.title || paper.originalFileName || 'Research Paper';
                if (paperTitle)    paperTitle.textContent = titleDisplay;
                if (metaTitle)     metaTitle.textContent  = titleDisplay;
                if (metaFileName)  metaFileName.textContent = paper.originalFileName || '—';
                if (metaStatus)    metaStatus.textContent  = paper.status ? paper.status.charAt(0).toUpperCase() + paper.status.slice(1) : '—';

                if (metaPages)     metaPages.textContent  = paper.pageCount ? `${paper.pageCount} pages` : '—';
                if (metaWords)     metaWords.textContent  = paper.wordCount ? paper.wordCount.toLocaleString() + ' words' : '—';

                if (paper.wordCount && metaReadingTime) {
                    const readMins = Math.max(1, Math.round(paper.wordCount / 200));
                    metaReadingTime.textContent = `~ ${readMins} min`;

                    // Time saved (full paper vs. summary reading ~60 words/min scan)
                    if (timeSavedTip && timeSavedVal) {
                        const savedMins = Math.max(1, readMins - 2);
                        timeSavedVal.textContent = `${savedMins} minutes`;
                        timeSavedTip.style.display = 'flex';
                    }
                }

                if (paperSubtitle) {
                    paperSubtitle.textContent = `${paper.originalFileName || ''} • ${paper.status || ''}`;
                }
            }
        } catch (e) {
            console.warn('Could not fetch paper metadata:', e.message);
        }
    }

    // ── 5. Navigate to chat with a pre-filled question ───────────────────────
    window.navigateToChat = function(question) {
        if (question) {
            sessionStorage.setItem('papermind_chat_prefill', question);
        }
        window.location.href = 'chat.html';
    };

    // ── 6. COPY SUMMARY ──────────────────────────────────────────────────────
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            if (!summary) {
                showToast('No summary loaded yet.', 'warning');
                return;
            }

            const sections = [
                { label: '1. EXECUTIVE OVERVIEW', text: summary.executiveOverview || summary.fullSummary },
                { label: '2. OBJECTIVE AND PURPOSE', text: summary.objective },
                { label: '3. BACKGROUND AND CONTEXT', text: summary.background },
                { label: '4. METHODOLOGY', text: summary.methods },
                { label: '5. KEY FINDINGS AND RESULTS', text: summary.results || (summary.keyFindings || []).join('\n• ') },
                { label: '6. CONCLUSIONS AND IMPLICATIONS', text: summary.conclusions || summary.conclusion },
                { label: '7. LIMITATIONS AND FUTURE DIRECTIONS', text: summary.limitations },
            ].filter(s => s.text && s.text.trim().length > 0)
             .map(s => `${s.label}\n${s.text.trim()}`)
             .join('\n\n');

            navigator.clipboard.writeText(sections).then(() => {
                const origHtml = btnCopy.innerHTML;
                btnCopy.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                btnCopy.style.background = 'rgba(34, 197, 94, 0.2)';
                btnCopy.style.color = '#4ade80';
                showToast('Summary copied to clipboard', 'info');
                setTimeout(() => {
                    btnCopy.innerHTML = origHtml;
                    btnCopy.style.background = '';
                    btnCopy.style.color = '';
                }, 2000);
            }).catch(() => showToast('Failed to copy summary', 'error'));
        });
    }

    // ── 7. DOWNLOAD HELPERS ──────────────────────────────────────────────────
    async function downloadSummary(format = 'pdf') {
        if (!paperId || !window.paperAPI) {
            showToast('No active research paper to download.', 'warning');
            return;
        }
        const btn = format === 'pdf' ? (btnDownloadPdf || btnDownload) : btnDownloadTxt;
        const origHtml = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Downloading...`; }

        try {
            const blob = await window.paperAPI.downloadSummaryBlob(paperId, format);
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            const base = (metaFileName && metaFileName.textContent !== '—')
                ? metaFileName.textContent.replace(/\.pdf$/i, '')
                : 'Paper';
            a.download = `${base}_Summary.${format === 'txt' ? 'txt' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`Summary download started!`, 'info');
        } catch (err) {
            showToast(err.message || `Failed to download summary`, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
        }
    }

    if (btnDownload)    btnDownload.addEventListener('click',    () => downloadSummary('pdf'));
    if (btnDownloadPdf) btnDownloadPdf.addEventListener('click', () => downloadSummary('pdf'));
    if (btnDownloadTxt) btnDownloadTxt.addEventListener('click', () => downloadSummary('txt'));

    // ── 8. VIEW ORIGINAL PDF ─────────────────────────────────────────────────
    if (btnViewPdf) {
        btnViewPdf.addEventListener('click', async () => {
            if (!paperId || !window.paperAPI) {
                showToast('No active research paper to view.', 'warning');
                return;
            }
            const origHtml = btnViewPdf.innerHTML;
            btnViewPdf.disabled = true;
            btnViewPdf.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading...`;
            try {
                const blob   = await window.paperAPI.getPdfBlob(paperId);
                const pdfUrl = URL.createObjectURL(blob);
                window.open(pdfUrl, '_blank');
            } catch (err) {
                showToast(err.message || 'Failed to load PDF for viewing', 'error');
            } finally {
                btnViewPdf.disabled = false;
                btnViewPdf.innerHTML = origHtml;
            }
        });
    }

    // ── 10. RELATED PAPERS (Semantic Scholar + OpenAlex) ──────────────────────
    const relatedPapersCard    = document.getElementById('relatedPapersCard');
    const relatedPapersList    = document.getElementById('relatedPapersList');
    const relatedPapersSubtitle = document.getElementById('relatedPapersSubtitle');

    async function loadRelatedPapers() {
        if (!paperId || !window.paperAPI || !relatedPapersCard) return;

        // Show the card with a loading skeleton
        relatedPapersCard.style.display = '';
        if (relatedPapersList) {
            relatedPapersList.innerHTML = `
                <div class="related-paper-item" style="opacity:0.5;">
                    <div style="height:14px; background:rgba(255,255,255,0.07); border-radius:4px; width:80%;"></div>
                    <div style="height:10px; background:rgba(255,255,255,0.05); border-radius:4px; width:50%; margin-top:6px;"></div>
                    <div style="height:9px; background:rgba(255,255,255,0.04); border-radius:4px; width:95%; margin-top:8px;"></div>
                </div>
                <div class="related-paper-item" style="opacity:0.3;">
                    <div style="height:14px; background:rgba(255,255,255,0.07); border-radius:4px; width:70%;"></div>
                    <div style="height:10px; background:rgba(255,255,255,0.05); border-radius:4px; width:40%; margin-top:6px;"></div>
                </div>
            `;
        }

        try {
            const res = await window.paperAPI.getRelatedPapers(paperId);
            const papers = res?.data?.relatedPapers || [];
            const sources = res?.data?.sources || [];
            const query   = res?.data?.query || '';

            if (!relatedPapersList) return;

            if (papers.length === 0) {
                relatedPapersCard.style.display = 'none';
                return;
            }

            // Update subtitle
            if (relatedPapersSubtitle) {
                const sourceStr = sources.length > 0 ? ` via ${sources.join(' + ')}` : '';
                relatedPapersSubtitle.textContent = `Found ${papers.length} related paper${papers.length === 1 ? '' : 's'}${sourceStr} for "${query}"`;
            }

            // Render paper cards
            relatedPapersList.innerHTML = papers.map(paper => {
                const authorsStr = paper.authors && paper.authors.length > 0
                    ? paper.authors.join(', ') + (paper.authors.length >= 3 ? ' et al.' : '')
                    : 'Authors not listed';

                const citesStr = paper.citationCount > 0
                    ? `<span class="rp-cites"><i class="fa-solid fa-quote-left" style="font-size:0.65rem;"></i> ${paper.citationCount.toLocaleString()}</span>`
                    : '';

                const openAccessBadge = paper.openAccess
                    ? `<span class="rp-oa"><i class="fa-solid fa-lock-open"></i> Open Access</span>`
                    : '';

                const titleLink = paper.url
                    ? `<a href="${escapeHtml(paper.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(paper.title)}</a>`
                    : escapeHtml(paper.title);

                const abstractHtml = paper.abstract
                    ? `<div class="related-paper-abstract">${escapeHtml(paper.abstract)}</div>`
                    : '';

                const safeTitle = (paper.title || 'this related paper').replace(/"/g, '&quot;');
                const askAiBtn = `
                    <div class="related-paper-actions" style="margin-top: 0.6rem;">
                        <button type="button" class="btn btn-sm btn-glass btn-ask-related" onclick='window.navigateToChat("How does this research paper compare with the related work: ${safeTitle}?")' style="font-size: 0.78rem; padding: 0.3rem 0.75rem; border-radius: 6px;">
                            <i class="fa-solid fa-wand-magic-sparkles text-gradient-primary"></i> Ask AI About This Related Paper
                        </button>
                    </div>
                `;

                return `
                    <div class="related-paper-item">
                        <div class="related-paper-title">${titleLink}</div>
                        <div class="related-paper-meta">
                            <span class="rp-authors" title="${escapeHtml(authorsStr)}">${escapeHtml(authorsStr)}</span>
                            ${paper.year ? `<span class="rp-year">${paper.year}</span>` : ''}
                            <span class="rp-source">${escapeHtml(paper.source)}</span>
                            ${openAccessBadge}
                            ${citesStr}
                        </div>
                        ${abstractHtml}
                        ${askAiBtn}
                    </div>
                `;
            }).join('');

            // Source attribution line
            if (sources.length > 0) {
                relatedPapersList.insertAdjacentHTML('beforeend', `
                    <div class="related-papers-source-line">
                        <i class="fa-solid fa-database" style="font-size:0.7rem;"></i>
                        <span>Results from: ${sources.map(s => `<strong>${escapeHtml(s)}</strong>`).join(' + ')}</span>
                    </div>
                `);
            }

        } catch (err) {
            console.warn('Related papers lookup failed:', err.message);
            // Silently hide the card — don't show an error to the user for non-critical feature
            if (relatedPapersCard) relatedPapersCard.style.display = 'none';
        }
    }

    // Load related papers after a short delay (non-blocking, lower priority)
    setTimeout(loadRelatedPapers, 1500);


    function showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = 'glass-card toast-alert';

        const isError   = type === 'error';
        const isWarning = type === 'warning';
        let iconClass   = 'fa-solid fa-circle-info text-primary';
        let borderColor = 'rgba(99, 102, 241, 0.3)';

        if (isError) {
            iconClass   = 'fa-solid fa-triangle-exclamation text-danger';
            borderColor = 'rgba(239, 68, 68, 0.3)';
        } else if (isWarning) {
            iconClass   = 'fa-solid fa-triangle-exclamation text-warning';
            borderColor = 'rgba(245, 158, 11, 0.3)';
        }

        toast.style.borderColor = borderColor;
        toast.innerHTML = `<i class="${iconClass}"></i><span>${escapeHtml(message)}</span>`;

        if (!document.getElementById('toastStyle')) {
            const style = document.createElement('style');
            style.id = 'toastStyle';
            style.textContent = `
                .toast-alert {
                    position: fixed; top: 2rem; right: 2rem;
                    padding: 1rem 1.5rem; z-index: 9999;
                    display: flex; align-items: center; gap: 0.75rem;
                    background: rgba(17, 24, 39, 0.9) !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                    color: #fff; font-size: 0.9rem; border-radius: 12px;
                    animation: toastIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
                    max-width: 360px; word-break: break-word;
                }
                @keyframes toastIn {
                    from { transform: translateY(-20px) scale(0.95); opacity: 0; }
                    to   { transform: translateY(0) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
