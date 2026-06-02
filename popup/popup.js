document.addEventListener('DOMContentLoaded', () => {
  const checkBtn = document.getElementById('check-bookmarks-btn');
  const stopBtn = document.getElementById('stop-check-btn');
  const backupBtn = document.getElementById('backup-btn');
  const cleanupBtn = document.getElementById('cleanup-btn');
  const invalidList = document.getElementById('invalid-list');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.querySelector('.progress-text');
  const bulkActions = document.getElementById('bulk-actions-container');
  const selectAllCheckbox = document.getElementById('select-all');
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  const statsInfo = document.getElementById('stats-info');

  let isChecking = false;

  // 初始化資料
  function init() {
    chrome.storage.local.get(['invalidBookmarks', 'checkProgress', 'checkInProgress'], (data) => {
      if (data.invalidBookmarks) {
        renderInvalidList(data.invalidBookmarks);
      }
      if (data.checkProgress !== undefined) {
        updateProgressUI(data.checkProgress);
      }
      if (data.checkInProgress) {
        setCheckingState(true);
      }
    });
  }

  // 設定檢查狀態 UI
  function setCheckingState(checking) {
    isChecking = checking;
    checkBtn.disabled = checking;
    stopBtn.disabled = !checking;
    checkBtn.innerHTML = checking ? 
      '<i class="material-icons">sync</i>檢查中...' : 
      '<i class="material-icons">search</i>開始檢查';
  }

  // 更新進度 UI
  function updateProgressUI(progress) {
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
  }

  // 渲染失效列表
  function renderInvalidList(bookmarks) {
    if (!bookmarks || bookmarks.length === 0) {
      invalidList.innerHTML = '<div class="no-bookmarks">目前沒有發現失效書籤</div>';
      bulkActions.style.display = 'none';
      statsInfo.textContent = '';
      return;
    }

    bulkActions.style.display = 'flex';
    statsInfo.textContent = `共 ${bookmarks.length} 個失效`;
    
    const fragment = document.createDocumentFragment();
    bookmarks.forEach(bookmark => {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.dataset.id = bookmark.id;
      item.innerHTML = `
        <input type="checkbox" class="item-checkbox" value="${bookmark.id}">
        <div class="item-content">
          <p class="item-title" title="${bookmark.title}">${bookmark.title}</p>
          <a href="${bookmark.url}" class="item-url" target="_blank" title="${bookmark.url}">${bookmark.url}</a>
          <div class="item-path">${bookmark.path || '根目錄'}</div>
          <div class="item-reason">${bookmark.reason}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn delete-single" title="刪除書籤">
            <i class="material-icons">delete</i>
          </button>
        </div>
      `;
      fragment.appendChild(item);
    });

    invalidList.innerHTML = '';
    invalidList.appendChild(fragment);
    
    // 重設全選勾選框
    selectAllCheckbox.checked = false;
  }

  // 監聽消息
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateProgress') {
      updateProgressUI(request.progress);
    } else if (request.action === 'bookmarksUpdated') {
      chrome.storage.local.get('invalidBookmarks', (data) => {
        renderInvalidList(data.invalidBookmarks);
      });
    } else if (request.action === 'checkComplete') {
      setCheckingState(false);
      updateProgressUI(100);
    }
  });

  // 事件綁定
  checkBtn.addEventListener('click', () => {
    setCheckingState(true);
    chrome.runtime.sendMessage({ action: 'checkBookmarks' });
  });

  stopBtn.addEventListener('click', () => {
    setCheckingState(false);
    chrome.runtime.sendMessage({ action: 'stopBookmarks' });
  });

  backupBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'backupBookmarks' }, (res) => {
      if (res?.success) alert('備份完成，請檢查下載目錄');
    });
  });

  cleanupBtn.addEventListener('click', () => {
    if (confirm('此操作將自動備份並刪除所有失效書籤，確定嗎？')) {
      chrome.runtime.sendMessage({ action: 'confirmCleanup' }, (res) => {
        if (res?.success) alert('清理完成');
      });
    }
  });

  // 列表委託點擊
  invalidList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-single');
    if (deleteBtn) {
      const id = deleteBtn.closest('.bookmark-item').dataset.id;
      chrome.runtime.sendMessage({ action: 'removeInvalidBookmark', bookmarkId: id });
    }
  });

  // 全選邏輯
  selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = invalidList.querySelectorAll('.item-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
  });

  // 批量刪除
  bulkDeleteBtn.addEventListener('click', () => {
    const selectedIds = Array.from(invalidList.querySelectorAll('.item-checkbox:checked'))
      .map(cb => cb.value);
    
    if (selectedIds.length === 0) return;
    
    if (confirm(`確定要刪除選中的 ${selectedIds.length} 個書籤嗎？`)) {
      chrome.runtime.sendMessage({ 
        action: 'removeMultipleBookmarks', 
        bookmarkIds: selectedIds 
      });
    }
  });

  init();
});
