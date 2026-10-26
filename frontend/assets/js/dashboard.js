/* =========================================================================
   DASHBOARD JAVASCRIPT (PaperMind.AI Clean Production Logic)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- ROUTE GUARD: Redirect unauthenticated users to login ---
    if (!window.requireAuth || !window.requireAuth()) return;

    // --- 1. NUMBER COUNTER ANIMATION ---
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    counters.forEach(counter => {
        const animate = () => {
            const value = +counter.getAttribute('data-target');
            const data = +counter.innerText;
            const time = value / speed;

            if (data < value) {
                counter.innerText = Math.ceil(data + time);
                setTimeout(animate, 15);
            } else {
                counter.innerText = value;
            }
        };
        animate();
    });

    // --- 2. MOBILE SIDEBAR TOGGLE ---
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');

    if (openSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // --- 3. THEME TOGGLE WITH LOCALSTORAGE ---
    const themeBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('papermind_theme');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeBtn) {
            const icon = themeBtn.querySelector('i');
            icon.className = 'fa-solid fa-sun';
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('papermind_theme', isLight ? 'light' : 'dark');

            const icon = themeBtn.querySelector('i');
            if (isLight) {
                icon.className = 'fa-solid fa-sun';
            } else {
                icon.className = 'fa-solid fa-moon';
            }
        });
    }

    // --- 4. PAGE LOADER FADE OUT ---
    const pageLoader = document.getElementById('pageLoader');
    if (pageLoader) {
        setTimeout(() => {
            pageLoader.classList.add('fade-out');
        }, 500);
    }

    // --- 5. REALTIME CLOCK ---
    const liveClock = document.getElementById('liveClock');
    function updateClock() {
        if (!liveClock) return;
        const now = new Date();
        liveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 10000);

    // --- 6. NOTIFICATIONS DROPDOWN ---
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBadge = document.getElementById('notifBadge');
    const markAllReadBtn = document.getElementById('markAllRead');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            notifDropdown.classList.toggle('open');
        });
    }

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            const unreads = document.querySelectorAll('.notif-item.unread');
            unreads.forEach(item => item.classList.remove('unread'));
            const dots = document.querySelectorAll('.unread-dot');
            dots.forEach(dot => dot.remove());
            if (notifBadge) notifBadge.style.display = 'none';
        });
    }

    // --- 7. USER PROFILE DROPDOWN ---
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (userProfileBtn && profileDropdown) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            profileDropdown.classList.toggle('open');
        });
    }

    function closeAllDropdowns() {
        if (notifDropdown) notifDropdown.classList.remove('open');
        if (profileDropdown) profileDropdown.classList.remove('open');
    }

    document.addEventListener('click', (e) => {
        if (notifDropdown && !notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.classList.remove('open');
        }
        if (profileDropdown && !profileDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
            profileDropdown.classList.remove('open');
        }
    });

    // --- 8. GLOBAL SEARCH COMMAND PALETTE (Ctrl + K / Cmd + K) ---
    const searchModal = document.getElementById('searchModal');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const headerSearchBar = document.getElementById('headerSearchBar');

    function openSearchModal() {
        if (searchModal) {
            searchModal.classList.add('open');
            if (modalSearchInput) modalSearchInput.focus();
        }
    }

    function closeSearchModal() {
        if (searchModal) {
            searchModal.classList.remove('open');
        }
    }

    if (headerSearchBar) {
        headerSearchBar.addEventListener('click', openSearchModal);
    }

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (searchModal && searchModal.classList.contains('open')) {
                closeSearchModal();
            } else {
                openSearchModal();
            }
        }
        if (e.key === 'Escape') {
            closeSearchModal();
            closeAllDropdowns();
        }
    });

    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                closeSearchModal();
            }
        });
    }

    // Command Palette Quick Commands Wiring
    const quickCmdItems = document.querySelectorAll('.modal-results-list li');
    if (quickCmdItems.length >= 5) {
        quickCmdItems[2].addEventListener('click', () => { window.location.href = 'upload.html'; });
        quickCmdItems[3].addEventListener('click', () => { window.location.href = 'upload.html'; });
        quickCmdItems[4].addEventListener('click', () => { window.location.href = 'settings.html'; });
    }

    // Modal Search Enter key handler
    if (modalSearchInput) {
        modalSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = modalSearchInput.value.trim();
                window.location.href = query ? `papers.html?search=${encodeURIComponent(query)}` : 'papers.html';
            }
        });
    }

    // --- 9. FLOATING AI ASSISTANT WIDGET ---
    const aiAssistantBtn = document.getElementById('aiAssistantBtn');
    const aiAssistantPanel = document.getElementById('aiAssistantPanel');
    const closeAiPanel = document.getElementById('closeAiPanel');

    if (aiAssistantBtn && aiAssistantPanel) {
        aiAssistantBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            aiAssistantPanel.classList.toggle('open');
        });
    }

    if (closeAiPanel && aiAssistantPanel) {
        closeAiPanel.addEventListener('click', () => {
            aiAssistantPanel.classList.remove('open');
        });
    }

    // Copilot Chips & Input Wiring
    const copilotChips = document.querySelectorAll('.copilot-chip');
    if (copilotChips.length >= 3) {
        copilotChips[0].addEventListener('click', () => { window.location.href = 'upload.html'; });
        copilotChips[1].addEventListener('click', () => { window.location.href = 'upload.html'; });
        copilotChips[2].addEventListener('click', () => { window.location.href = 'chat.html'; });
    }

    const copilotInput = document.querySelector('.copilot-input-box input');
    const copilotSend = document.querySelector('.copilot-input-box .send-btn');
    function submitCopilot() {
        if (!copilotInput) return;
        const msg = copilotInput.value.trim();
        if (msg) {
            sessionStorage.setItem('papermind_pending_chat', msg);
            window.location.href = 'chat.html';
        }
    }
    if (copilotSend) copilotSend.addEventListener('click', submitCopilot);
    if (copilotInput) {
        copilotInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitCopilot();
        });
    }

    // --- 10. STORAGE PROGRESS RING ANIMATION ---
    const circle = document.querySelector('.progress-ring-circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        
        const setProgress = (percent) => {
            const offset = circumference - (percent / 100 * circumference);
            circle.style.strokeDashoffset = offset;
        };

        setTimeout(() => {
            setProgress(78);
        }, 300);
    }

    // --- 11. REAL BACKEND INTEGRATION (Papers, Stats, User Profile) ---
    async function initDashboardData() {
        if (!window.authAPI) return;

        // Verify authentication
        if (!window.authAPI.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // 1. Fetch current user profile
            await window.authAPI.getMe();
            if (window.updateHeaderUserInfo) {
                window.updateHeaderUserInfo();
            }

            // 2. Fetch user's papers from backend
            if (!window.paperAPI) return;
            const res = await window.paperAPI.getPapers(1, 20);
            if (!res || !res.data || !Array.isArray(res.data.papers)) return;

            const papers = res.data.papers;
            const pagination = res.data.pagination || {};

            // 3. Update Statistics Counters
            const statCards = document.querySelectorAll('.stat-card');
            if (statCards.length >= 3) {
                // Papers Uploaded Counter
                const papersCounter = statCards[0].querySelector('.counter');
                if (papersCounter) {
                    papersCounter.setAttribute('data-target', pagination.total || papers.length);
                    papersCounter.innerText = pagination.total || papers.length;
                }

                // AI Summaries Counter (completed count)
                const completedCount = papers.filter(p => p.status === 'completed').length;
                const summariesCounter = statCards[1].querySelector('.counter');
                if (summariesCounter) {
                    summariesCounter.setAttribute('data-target', completedCount);
                    summariesCounter.innerText = completedCount;
                }

                // Reading Time Saved
                const totalWords = papers.reduce((acc, p) => acc + (p.wordCount || 0), 0);
                const hoursSaved = Math.max(1, Math.round((totalWords / 200) / 60));
                const hoursCounter = statCards[2].querySelector('.counter');
                if (hoursCounter) {
                    hoursCounter.setAttribute('data-target', hoursSaved);
                    hoursCounter.innerText = hoursSaved;
                }
            }

            // 4. Update Recent Papers Table
            const tbody = document.querySelector('.dash-table tbody');
            const paginationInfo = document.querySelector('.pagination-info');

            if (paginationInfo) {
                paginationInfo.textContent = `Showing ${papers.length > 0 ? 1 : 0} to ${papers.length} of ${pagination.total || papers.length} papers`;
            }

            if (tbody && papers.length > 0) {
                tbody.innerHTML = '';

                papers.forEach(paper => {
                    const tr = document.createElement('tr');
                    const uploadDate = new Date(paper.uploadedAt || paper.createdAt || Date.now());
                    const dateFormatted = uploadDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const sizeFormatted = formatBytes(paper.fileSize || 0);

                    let statusBadge = '<span class="status-badge badge-pending"><i class="fa-regular fa-clock"></i> Uploaded</span>';
                    if (paper.status === 'completed') {
                        statusBadge = '<span class="status-badge badge-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>';
                    } else if (paper.status === 'processing') {
                        statusBadge = '<span class="status-badge badge-processing"><i class="fa-solid fa-spinner fa-spin"></i> Processing</span>';
                    } else if (paper.status === 'failed') {
                        statusBadge = '<span class="status-badge badge-failed"><i class="fa-solid fa-circle-exclamation"></i> Failed</span>';
                    }

                    tr.innerHTML = `
                        <td class="paper-title-cell" style="cursor: pointer;" title="Click to view AI Summary">
                            <i class="fa-solid fa-file-pdf pdf-icon"></i>
                            <div>
                                <span class="title-text" style="color: var(--primary); text-decoration: underline; text-underline-offset: 3px;">${escapeHtml(paper.title || paper.fileName)}</span>
                                <span class="sub-text">${sizeFormatted} • PDF</span>
                            </div>
                        </td>
                        <td>Author / Self</td>
                        <td>${dateFormatted}</td>
                        <td>${statusBadge}</td>
                        <td><span class="summary-preview">${paper.status === 'completed' ? 'AI Summary generated' : 'Pending extraction...'}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="action-btn btn-view-pdf" title="View Research Paper PDF" data-id="${paper.paperId || paper.id}"><i class="fa-regular fa-eye"></i></button>
                                <button class="action-btn text-primary btn-view-summary" title="View AI Summary" data-id="${paper.paperId || paper.id}"><i class="fa-solid fa-file-lines"></i></button>
                                <button class="action-btn btn-ask-ai" title="Ask AI About This Paper" data-id="${paper.paperId || paper.id}"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                                <button class="action-btn btn-download-paper" title="Download PDF" data-id="${paper.paperId || paper.id}"><i class="fa-solid fa-download"></i></button>
                                <button class="action-btn text-danger btn-delete-paper" title="Delete" data-id="${paper.paperId || paper.id}"><i class="fa-regular fa-trash-can"></i></button>
                            </div>
                        </td>
                    `;

                    // Helper to open summary
                    const openSummary = () => {
                        window.setActivePaperId(paper.paperId || paper.id, {
                            fileName: paper.fileName,
                            fileSize: sizeFormatted,
                            uploadTime: paper.uploadedAt,
                            title: paper.title
                        });
                        window.location.href = 'summary.html';
                    };

                    // Wire row action buttons
                    const titleCell = tr.querySelector('.paper-title-cell');
                    titleCell.addEventListener('click', openSummary);

                    const viewSummaryBtn = tr.querySelector('.btn-view-summary');
                    viewSummaryBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openSummary();
                    });

                    // Eye button: View Research Paper PDF directly in new tab
                    const viewPdfBtn = tr.querySelector('.btn-view-pdf');
                    viewPdfBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const origHtml = viewPdfBtn.innerHTML;
                        viewPdfBtn.disabled = true;
                        viewPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        try {
                            const blob = await window.paperAPI.getPdfBlob(paper.paperId || paper.id);
                            const url = window.URL.createObjectURL(blob);
                            window.open(url, '_blank');
                        } catch (err) {
                            alert('Failed to load PDF for viewing: ' + err.message);
                        } finally {
                            viewPdfBtn.disabled = false;
                            viewPdfBtn.innerHTML = origHtml;
                        }
                    });

                    // Ask AI button: Select paper and go to chat
                    const askAiBtn = tr.querySelector('.btn-ask-ai');
                    askAiBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.setActivePaperId(paper.paperId || paper.id, {
                            fileName: paper.fileName,
                            fileSize: sizeFormatted,
                            uploadTime: paper.uploadedAt,
                            title: paper.title
                        });
                        window.location.href = 'chat.html';
                    });

                    const downloadBtn = tr.querySelector('.btn-download-paper');
                    downloadBtn.addEventListener('click', async () => {
                        try {
                            const blob = await window.paperAPI.getPdfBlob(paper.paperId || paper.id);
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = paper.fileName || 'paper.pdf';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        } catch (err) {
                            alert('Failed to download PDF: ' + err.message);
                        }
                    });

                    const deleteBtn = tr.querySelector('.btn-delete-paper');
                    deleteBtn.addEventListener('click', async () => {
                        if (!confirm(`Are you sure you want to delete "${paper.title || paper.fileName}"?`)) return;
                        try {
                            await window.paperAPI.deletePaper(paper.paperId || paper.id);
                            tr.remove();
                            // Refresh stats
                            initDashboardData();
                        } catch (err) {
                            alert('Failed to delete paper: ' + err.message);
                        }
                    });

                    tbody.appendChild(tr);
                });
            }

            // 5. Wire Quick Action Links & View All
            const actionCards = document.querySelectorAll('.quick-actions-grid .action-card');
            if (actionCards.length >= 4) {
                actionCards[0].href = 'upload.html'; // Upload New Paper
                actionCards[1].href = 'upload.html'; // Generate Summary
                actionCards[2].href = 'chat.html';   // Ask Paper AI
                actionCards[3].href = 'papers.html'; // Export Reports
            } else if (actionCards.length >= 2) {
                actionCards[0].href = 'upload.html';
                actionCards[1].href = 'upload.html';
            }

            const viewAllLink = document.querySelector('.view-all-link');
            if (viewAllLink) viewAllLink.href = 'papers.html';

            // 6. Update Cloud Storage Widget
            const totalBytes = papers.reduce((acc, p) => acc + (p.fileSize || 0), 0);
            const totalFormatted = formatBytes(totalBytes);
            const maxStorageBytes = 50 * 1024 * 1024; // 50MB quota
            const percentUsed = Math.min(100, Math.max(1, Math.round((totalBytes / maxStorageBytes) * 100)));

            const storagePercentEl = document.querySelector('.storage-center-text h4');
            if (storagePercentEl) storagePercentEl.textContent = `${percentUsed}%`;

            const storageTextInfo = document.querySelector('.storage-text-info p');
            if (storageTextInfo) storageTextInfo.innerHTML = `<strong>${totalFormatted}</strong> of 50 MB used`;

            const storageRemaining = document.querySelector('.storage-text-info span');
            if (storageRemaining) {
                const remBytes = Math.max(0, maxStorageBytes - totalBytes);
                storageRemaining.textContent = `${formatBytes(remBytes)} remaining`;
            }

            const upgradeBtn = document.querySelector('.upgrade-btn');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    window.location.href = 'settings.html';
                });
            }

            // 7. Update Recent Activity Widget with Real Events
            const activityTimeline = document.querySelector('.activity-timeline');
            if (activityTimeline && papers.length > 0) {
                activityTimeline.innerHTML = '';
                const recentSlice = papers.slice(0, 4);
                const colors = ['blue', 'purple', 'green', 'orange'];

                recentSlice.forEach((p, idx) => {
                    const li = document.createElement('li');
                    const color = colors[idx % colors.length];
                    const uploadDate = new Date(p.uploadedAt || p.createdAt || Date.now());
                    const timeAgo = formatTimeAgo(uploadDate);

                    li.innerHTML = `
                        <div class="timeline-dot ${color}"></div>
                        <div class="timeline-content">
                            <p>${p.status === 'completed' ? 'AI completed analysis for' : 'Uploaded'} <strong>${escapeHtml(p.title || p.fileName)}</strong></p>
                            <span class="time"><i class="fa-regular fa-clock"></i> ${timeAgo}</span>
                        </div>
                    `;
                    activityTimeline.appendChild(li);
                });
            }

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    }

    function formatTimeAgo(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    }

    function formatBytes(bytes, decimals = 1) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize real data
    initDashboardData();

});
