/* =========================================================================
   ASK AI CHAT JAVASCRIPT (Integrated with Real Backend API)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    // --- ROUTE GUARD: Redirect unauthenticated users to login ---
    if (!window.requireAuth || !window.requireAuth()) return;

    // --- DOM Elements ---
    const chatPaperContext = document.getElementById('chatPaperContext');
    const chatMessagesArea = document.getElementById('chatMessagesArea');
    const chatWelcomeState = document.getElementById('chatWelcomeState');
    const chatInput = document.getElementById('chatInput');
    const btnSendChat = document.getElementById('btnSendChat');

    let isProcessing = false;
    const paperId = window.getActivePaperId ? window.getActivePaperId() : null;

    // --- 1. Session Storage & Paper Context Initialization ---
    let currentPaperName = 'Active Research Paper';
    const uploadDataStr = sessionStorage.getItem('papermind_upload_data');
    if (uploadDataStr) {
        try {
            const uploadData = JSON.parse(uploadDataStr);
            if (uploadData.fileName) {
                currentPaperName = uploadData.fileName;
            }
        } catch (e) {}
    }

    if (chatPaperContext) {
        chatPaperContext.textContent = `Context: ${currentPaperName}`;
    }

    // Also fetch paper details if paperId exists
    if (paperId && window.paperAPI) {
        window.paperAPI.getPaper(paperId).then((res) => {
            if (res && res.data && res.data.paper) {
                const title = res.data.paper.title || res.data.paper.originalFileName;
                if (chatPaperContext) {
                    chatPaperContext.textContent = `Context: ${title}`;
                }
            }
        }).catch(() => {});
    }

    // --- 2. Load Suggested Questions from Backend ---
    async function loadSuggestedQuestions() {
        if (!paperId || !window.paperAPI) return;

        try {
            const res = await window.paperAPI.getSuggestedQuestions(paperId);
            if (res && res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
                const container = document.querySelector('.suggested-questions');
                if (container) {
                    container.innerHTML = '';
                    res.data.questions.slice(0, 4).forEach((q) => {
                        const btn = document.createElement('button');
                        btn.className = 'suggested-btn ripple-effect';
                        btn.textContent = q;
                        btn.addEventListener('click', () => {
                            chatInput.value = q;
                            sendMessage();
                        });
                        container.appendChild(btn);
                    });
                }
            }
        } catch (e) {
            console.warn('Could not load suggested questions:', e.message);
        }
    }

    // --- 3. Load Existing Chat History from Backend ---
    async function loadChatHistory() {
        if (!paperId || !window.chatAPI) return;

        try {
            const res = await window.chatAPI.getChatHistory(paperId);
            if (res && res.data && Array.isArray(res.data.messages) && res.data.messages.length > 0) {
                if (chatWelcomeState) {
                    chatWelcomeState.style.display = 'none';
                }

                res.data.messages.forEach((msg) => {
                    const sender = msg.role === 'user' ? 'user' : 'ai';
                    appendMessage(sender, msg.content);
                });

                scrollToBottom();
            }
        } catch (e) {
            console.warn('Could not load chat history:', e.message);
        }
    }

    // Wire up existing default suggested buttons as initial fallback
    document.querySelectorAll('.suggested-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            sendMessage();
        });
    });

    // Run background loaders
    loadSuggestedQuestions();
    await loadChatHistory();

    // Check for pending question passed from dashboard copilot
    const pendingQuestion = sessionStorage.getItem('papermind_pending_chat');
    if (pendingQuestion) {
        sessionStorage.removeItem('papermind_pending_chat');
        chatInput.value = pendingQuestion;
        sendMessage();
    }

    // --- 4. Input Handlers ---
    if (chatInput) {
        // Auto-resize textarea
        chatInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';

            if (this.value.trim() === '') {
                btnSendChat.disabled = true;
            } else {
                btnSendChat.disabled = false;
            }
        });

        // Enter key to send (Shift+Enter for newline)
        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (btnSendChat) {
        btnSendChat.disabled = true;
        btnSendChat.addEventListener('click', sendMessage);
    }

    // --- 5. Send Message (Real Backend Integration) ---
    async function sendMessage() {
        if (isProcessing) return;

        const text = chatInput.value.trim();
        if (!text) return;

        if (!paperId) {
            appendMessage('ai', 'No active research paper context found. Please upload or select a research paper from the dashboard first.');
            return;
        }

        // Hide Welcome State if visible
        if (chatWelcomeState) {
            chatWelcomeState.style.display = 'none';
        }

        // Append User Message
        appendMessage('user', text);

        // Clear and reset Input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        btnSendChat.disabled = true;

        // Show Loading Indicator
        isProcessing = true;
        chatInput.disabled = true;
        const loadingId = appendLoadingIndicator();
        scrollToBottom();

        try {
            // Real API Call to Backend
            const res = await window.chatAPI.askQuestion(paperId, text);
            removeLoadingIndicator(loadingId);

            const answer = (res && res.data && res.data.answer)
                ? res.data.answer
                : 'This research paper does not provide enough information to answer that question.';

            appendMessage('ai', answer);

        } catch (err) {
            removeLoadingIndicator(loadingId);
            const errorMsg = err.message || 'Failed to retrieve answer from AI copilot. Please try again.';
            appendMessage('ai', `⚠️ ${errorMsg}`);
        } finally {
            isProcessing = false;
            chatInput.disabled = false;
            chatInput.focus();
            scrollToBottom();
        }
    }

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;

        const iconHTML =
            sender === 'user'
                ? '<i class="fa-solid fa-user"></i>'
                : '<i class="fa-solid fa-brain"></i>';

        // Format Markdown bold, italic, code blocks, and linebreaks
        let formattedText = escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">$1</code>')
            .replace(/\n/g, '<br>');

        msgDiv.innerHTML = `
            <div class="msg-avatar">${iconHTML}</div>
            <div class="msg-bubble">${formattedText}</div>
        `;

        chatMessagesArea.appendChild(msgDiv);
    }

    function appendLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ai`;
        msgDiv.id = id;

        msgDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-brain"></i></div>
            <div class="msg-bubble">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;

        chatMessagesArea.appendChild(msgDiv);
        return id;
    }

    function removeLoadingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }

    function escapeHtml(string) {
        if (!string) return '';
        const entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return String(string).replace(/[&<>"']/g, (s) => entityMap[s]);
    }
});
