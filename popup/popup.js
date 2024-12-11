document.addEventListener('DOMContentLoaded', () => {
  // 等待 DOM 完全載入後再執行
  const checkBookmarksBtn = document.getElementById('check-bookmarks-btn');
  const invalidList = document.getElementById('invalid-list');
  const progressFill = document.getElementById('progress-fill');

  // 檢查元素是否存在
  if (checkBookmarksBtn && invalidList && progressFill) {
    // 顯示失效書籤
    function displayInvalidBookmarks(invalidBookmarks) {
      invalidList.innerHTML = '';
      invalidBookmarks.forEach(bookmark => {
        const bookmarkItem = document.createElement('div');
        bookmarkItem.classList.add('bookmark-item');

        const bookmarkName = document.createElement('p');
        bookmarkName.textContent = bookmark.title;
        bookmarkItem.appendChild(bookmarkName);

        const bookmarkUrl = document.createElement('a');
        bookmarkUrl.href = bookmark.url;
        bookmarkUrl.textContent = bookmark.url;
        bookmarkUrl.target = '_blank';
        bookmarkItem.appendChild(bookmarkUrl);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeInvalidBookmark(bookmark.id);
        bookmarkItem.appendChild(removeBtn);

        invalidList.appendChild(bookmarkItem);
      });
    }

    // 更新進度條
    function updateProgressBar(progress) {
      progressFill.style.width = `${progress}%`;
    }

    // 檢查書籤
    function checkBookmarks() {
      chrome.runtime.sendMessage({ action: 'checkBookmarks' }, (response) => {
        if (response.success) {
          console.log('Bookmarks check initiated');
        } else {
          console.log(response.message);
        }
      });
    }

    // 刪除失效書籤
    function removeInvalidBookmark(bookmarkId) {
      chrome.runtime.sendMessage({ action: 'removeInvalidBookmark', bookmarkId: bookmarkId }, (response) => {
        if (response.success) {
          console.log('Invalid bookmark removed');
          // 重新獲取失效書籤列表
          chrome.storage.local.get('invalidBookmarks', (data) => {
            displayInvalidBookmarks(data.invalidBookmarks);
          });
        }
      });
    }

    // 監聽來自背景腳本的進度更新
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateProgress') {
        updateProgressBar(request.progress);
      }
    });

    // 監聽背景腳本的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'bookmarksUpdated') {
        chrome.storage.local.get(['invalidBookmarks', 'checkProgress'], (data) => {
          if (data.invalidBookmarks) {
            displayInvalidBookmarks(data.invalidBookmarks);
          }
          if (data.checkProgress) {
            updateProgressBar(data.checkProgress);
          }
        });
      }
    });

    // 檢查按鈕點擊事件
    checkBookmarksBtn.addEventListener('click', () => {
      checkBookmarks();
    });

    // 初始化時獲取書籤數據
    chrome.storage.local.get(['invalidBookmarks', 'checkProgress'], (data) => {
      if (data.invalidBookmarks) {
        displayInvalidBookmarks(data.invalidBookmarks);
      }
      if (data.checkProgress) {
        updateProgressBar(data.checkProgress);
      }
    });
  } else {
    console.error('Some elements are missing in the popup HTML');
  }
});
