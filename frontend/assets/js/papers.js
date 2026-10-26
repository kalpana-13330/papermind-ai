/**
 * AI Research Paper Summarizer - My Papers Library Controller
 * Manages paper listing, search, filtering, favorites, pagination, downloading, and deletion.
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

  let allPapers = [];
  let filteredPapers = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let currentPage = 1;
  const itemsPerPage = 10;

  // Check URL params for filter (e.g. ?filter=favorites)
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam) {
    currentFilter = filterParam;
  }

  // Favorites helpers
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('papermind_favorites') || '[]');
    } catch (e) {
      return [];
    }
  }

  function toggleFavorite(paperId) {
    let favs = getFavorites();
    if (favs.includes(paperId)) {
      favs = favs.filter(id => id !== paperId);
    } else {
      favs.push(paperId);
    }
    localStorage.setItem('papermind_favorites', JSON.stringify(favs));
    applyFilters();
  }

  // Load papers from API
  async function loadPapers() {
    try {
      const res = await window.paperAPI.getPapers(1, 100);
      if (res && res.data && Array.isArray(res.data.papers)) {
        allPapers = res.data.papers;
      } else {
        allPapers = [];
      }
      applyFilters();
    } catch (err) {
      console.error('Failed to load papers:', err);
      const tbody = document.getElementById('papersTableBody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 3rem; color: #f87171;">
              <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
              Failed to load papers: ${err.message}
            </td>
          </tr>
        `;
      }
    }
  }

  function applyFilters() {
    const favs = getFavorites();

    filteredPapers = allPapers.filter(paper => {
      const pId = paper.paperId || paper.id;
      const title = (paper.title || paper.fileName || '').toLowerCase();
      const matchesSearch = !searchQuery || title.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (currentFilter === 'favorites') {
        return favs.includes(pId);
      } else if (currentFilter === 'completed') {
        return paper.status === 'completed';
      } else if (currentFilter === 'processing') {
        return paper.status === 'processing';
      }
      return true;
    });

    currentPage = 1;
    renderTable();
    updateFilterButtons();
  }

  function renderTable() {
    const tbody = document.getElementById('papersTableBody');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');

    if (!tbody) return;

    if (filteredPapers.length === 0) {
      tbody.innerHTML = '';
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      if (paginationInfo) paginationInfo.textContent = 'Showing 0 of 0 papers';
      if (paginationControls) paginationControls.innerHTML = '';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // Pagination slice
    const total = filteredPapers.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const pagePapers = filteredPapers.slice(startIdx, startIdx + itemsPerPage);

    const favs = getFavorites();
    tbody.innerHTML = '';

    pagePapers.forEach(paper => {
      const tr = document.createElement('tr');
      const pId = paper.paperId || paper.id;
      const isFav = favs.includes(pId);
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
          <button class="action-btn btn-fav ${isFav ? 'text-warning' : ''}" title="${isFav ? 'Remove Favorite' : 'Add Favorite'}" data-id="${pId}">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star" style="color: ${isFav ? '#fbbf24' : '#64748b'};"></i>
          </button>
          <i class="fa-solid fa-file-pdf pdf-icon"></i>
          <div>
            <span class="title-text" style="color: var(--primary); text-decoration: underline; text-underline-offset: 3px;">${escapeHtml(paper.title || paper.fileName)}</span>
            <span class="sub-text">${sizeFormatted} • PDF • ${paper.pageCount ? paper.pageCount + ' pages' : 'Standard'}</span>
          </div>
        </td>
        <td>${dateFormatted}</td>
        <td>${statusBadge}</td>
        <td><span class="summary-preview">${paper.status === 'completed' ? 'AI Summary generated' : 'Pending extraction...'}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn btn-view-pdf" title="View Research Paper PDF" data-id="${pId}"><i class="fa-regular fa-eye"></i></button>
            <button class="action-btn text-primary btn-view-summary" title="View AI Summary" data-id="${pId}"><i class="fa-solid fa-file-lines"></i></button>
            <button class="action-btn btn-ask-ai" title="Ask AI About This Paper" data-id="${pId}"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
            <button class="action-btn btn-download-paper" title="Download PDF" data-id="${pId}"><i class="fa-solid fa-download"></i></button>
            <button class="action-btn text-danger btn-delete-paper" title="Delete" data-id="${pId}"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </td>
      `;

      // Helper to open summary
      const openSummary = () => {
        window.setActivePaperId(pId, {
          fileName: paper.fileName,
          fileSize: sizeFormatted,
          uploadTime: paper.uploadedAt,
          title: paper.title,
        });
        window.location.href = 'summary.html';
      };

      // Event handlers
      tr.querySelector('.btn-fav').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(pId);
      });

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
          const blob = await window.paperAPI.getPdfBlob(pId);
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
        window.setActivePaperId(pId, {
          fileName: paper.fileName,
          fileSize: sizeFormatted,
          uploadTime: paper.uploadedAt,
          title: paper.title,
        });
        window.location.href = 'chat.html';
      });

      tr.querySelector('.btn-download-paper').addEventListener('click', async () => {
        try {
          const blob = await window.paperAPI.getPdfBlob(pId);
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

      tr.querySelector('.btn-delete-paper').addEventListener('click', async () => {
        if (!confirm(`Are you sure you want to delete "${paper.title || paper.fileName}"?`)) return;
        try {
          await window.paperAPI.deletePaper(pId);
          allPapers = allPapers.filter(p => (p.paperId || p.id) !== pId);
          applyFilters();
        } catch (err) {
          alert('Failed to delete paper: ' + err.message);
        }
      });

      tbody.appendChild(tr);
    });

    // Pagination info & controls
    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${startIdx + 1} to ${Math.min(startIdx + itemsPerPage, total)} of ${total} papers`;
    }

    if (paginationControls) {
      paginationControls.innerHTML = '';
      if (totalPages > 1) {
        // Prev button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            renderTable();
          }
        });
        paginationControls.appendChild(prevBtn);

        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
          const btn = document.createElement('button');
          btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
          btn.textContent = i;
          btn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
          });
          paginationControls.appendChild(btn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
          if (currentPage < totalPages) {
            currentPage++;
            renderTable();
          }
        });
        paginationControls.appendChild(nextBtn);
      }
    }
  }

  function updateFilterButtons() {
    document.querySelectorAll('.filter-pill-btn').forEach(btn => {
      const filter = btn.getAttribute('data-filter');
      if (filter === currentFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Filter Buttons Click
  document.querySelectorAll('.filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  // Search input
  const searchInput = document.getElementById('papersSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      applyFilters();
    });
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

  await loadPapers();
});
