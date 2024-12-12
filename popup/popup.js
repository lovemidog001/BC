document.addEventListener('DOMContentLoaded', () => {
  // 等待 DOM 完全載入後再執行
  const checkBookmarksBtn = document.getElementById('check-bookmarks-btn');
  const stopCheckBtn = document.getElementById('stop-check-btn');
  const invalidList = document.getElementById('invalid-list');
  const progressFill = document.getElementById('progress-fill');

  let isChecking = false;

  // 更新按鈕狀態
  function updateButtonStates() {
    checkBookmarksBtn.disabled = isChecking;
    stopCheckBtn.disabled = !isChecking;

    checkBookmarksBtn.innerHTML = '<i class="material-icons">play_arrow</i>開始檢查';
  }

  // 開始檢查
  function startCheck() {
    isChecking = true;
    updateButtonStates();
    
    chrome.runtime.sendMessage({ 
      action: 'checkBookmarks'
    }, (response) => {
      if (response.success) {
        console.log('Bookmarks check started');
      } else {
        console.log(response.message);
      }
    });
  }

  // 停止檢查
  function stopCheck() {
    isChecking = false;
    updateButtonStates();
    
    chrome.runtime.sendMessage({ action: 'stopBookmarks' }, (response) => {
      if (response.success) {
        console.log('Bookmarks check stopped');
        updateProgressBar(0);
      }
    });
  }

  // 按鈕點擊事件
  checkBookmarksBtn.addEventListener('click', startCheck);
  stopCheckBtn.addEventListener('click', stopCheck);

  // 監聽檢查完成事件
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkComplete') {
      isChecking = false;
      updateButtonStates();
    }
  });

  // 初始化按鈕狀態
  updateButtonStates();

  // 檢查元素是否存在
  if (checkBookmarksBtn && invalidList && progressFill) {
    // 顯示失效書籤
    function displayInvalidBookmarks(invalidBookmarks) {
      invalidList.innerHTML = '';
      if (!invalidBookmarks || invalidBookmarks.length === 0) {
        const noBookmarks = document.createElement('div');
        noBookmarks.className = 'no-bookmarks';
        noBookmarks.textContent = '沒有發現失效的書籤';
        invalidList.appendChild(noBookmarks);
        return;
      }

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

        if (bookmark.reason) {
          const reasonText = document.createElement('span');
          reasonText.className = 'error-reason';
          reasonText.textContent = `錯誤原因: ${bookmark.reason}`;
          bookmarkItem.appendChild(reasonText);
        }

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '刪除書籤';
        removeBtn.onclick = () => removeInvalidBookmark(bookmark.id);
        bookmarkItem.appendChild(removeBtn);

        invalidList.appendChild(bookmarkItem);
      });
    }

    // 更新進度條
    function updateProgressBar(progress) {
      const progressFill = document.getElementById('progress-fill');
      const progressText = document.querySelector('.progress-text');
      
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `${Math.round(progress)}%`;
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
