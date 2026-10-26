/**
 * AI Research Paper Summarizer - Activity History Controller
 * Populates real chronological user interactions from paper metadata and summaries.
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.authAPI || !window.authAPI.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    setTimeout(() => pageLoader.classList.add('fade-out'), 400);
  }

  const timelineContainer = document.getElementById('historyTimeline');
  const emptyState = document.getElementById('historyEmptyState');
  let allEvents = [];
  let currentFilter = 'all';

  async function loadHistory() {
    try {
      if (!window.paperAPI) return;
      const res = await window.paperAPI.getPapers(1, 100);

      if (!res || !res.data || !Array.isArray(res.data.papers)) {
        showEmpty();
        return;
      }

      const papers = res.data.papers;
      const events = [];

      papers.forEach(paper => {
        const pId = paper.paperId || paper.id;
        const title = paper.title || paper.fileName;

        // 1. Upload Event
        if (paper.uploadedAt || paper.createdAt) {
          events.push({
            type: 'upload',
            title: `Uploaded research paper`,
            details: title,
            date: new Date(paper.uploadedAt || paper.createdAt),
            paperId: pId,
            color: 'blue',
            icon: 'fa-cloud-arrow-up',
          });
        }

        // 2. Summary Completed Event
        if (paper.status === 'completed') {
          const summaryDate = new Date(paper.updatedAt || paper.createdAt);
          events.push({
            type: 'summary',
            title: `AI Summary generated`,
            details: `Structured synopsis and suggested questions ready for "${title}"`,
            date: summaryDate,
            paperId: pId,
            color: 'purple',
            icon: 'fa-wand-magic-sparkles',
          });
        }
      });

      // Sort newest first
      events.sort((a, b) => b.date - a.date);
      allEvents = events;
      renderEvents();

    } catch (err) {
      console.error('Failed to load history:', err);
      showEmpty();
    }
  }

  function renderEvents() {
    if (!timelineContainer) return;

    const filtered = allEvents.filter(e => {
      if (currentFilter === 'all') return true;
      return e.type === currentFilter;
    });

    if (filtered.length === 0) {
      showEmpty();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    timelineContainer.style.display = 'flex';
    timelineContainer.innerHTML = '';

    filtered.forEach(ev => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'flex-start';
      li.style.gap = '1.25rem';
      li.style.position = 'relative';

      const timeAgo = formatTimeAgo(ev.date);
      const dateFormatted = ev.date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      li.innerHTML = `
        <div class="timeline-dot ${ev.color}"></div>
        <div class="timeline-content" style="flex: 1;">
          <p><strong>${escapeHtml(ev.title)}</strong></p>
          <p style="color: #cbd5e1; margin-top: 0.2rem; font-size: 0.85rem;">${escapeHtml(ev.details)}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; flex-wrap: gap;">
            <span class="time" style="font-size: 0.75rem; color: #64748b;"><i class="fa-regular fa-clock"></i> ${timeAgo} • ${dateFormatted}</span>
            <div style="display: flex; gap: 0.5rem;">
              <button class="action-btn btn-view-event" title="Open Summary" data-id="${ev.paperId}">
                <i class="fa-regular fa-eye"></i>
              </button>
              <button class="action-btn btn-chat-event" title="Chat with AI" data-id="${ev.paperId}">
                <i class="fa-solid fa-message"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      li.querySelector('.btn-view-event').addEventListener('click', () => {
        window.setActivePaperId(ev.paperId);
        window.location.href = 'summary.html';
      });

      li.querySelector('.btn-chat-event').addEventListener('click', () => {
        window.setActivePaperId(ev.paperId);
        window.location.href = 'chat.html';
      });

      timelineContainer.appendChild(li);
    });
  }

  function showEmpty() {
    if (timelineContainer) timelineContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
  }

  // Filter Buttons
  document.querySelectorAll('.history-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderEvents();
    });
  });

  function formatTimeAgo(date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  await loadHistory();
});
