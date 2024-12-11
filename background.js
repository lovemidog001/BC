// 初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.set({ 
    bookmarksChecked: false, 
    invalidBookmarks: [],
    checkInProgress: false,
    checkProgress: 0
  });
  chrome.alarms.create("checkBookmarks", { delayInMinutes: 1, periodInMinutes: 24 * 60 }); // 每天檢查一次
  console.log('Alarm created');
});

// 檢查書籤是否失效的定時任務
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkBookmarks") {
    console.log('Alarm triggered for checkBookmarks');
    startCheckBookmarks();
  }
});

// 開始檢查書籤
function startCheckBookmarks() {
  chrome.storage.local.set({ checkInProgress: true, checkProgress: 0 }, () => {
    chrome.bookmarks.getTree((bookmarks) => {
      checkAndUpdateBookmarks(bookmarks);
    });
  });
}

// 檢查並更新書籤
function checkAndUpdateBookmarks(bookmarks) {
  const invalidBookmarks = [];
  let totalBookmarks = 0;
  let checkedBookmarks = 0;
  
  // 計算總書籤數
  function countBookmarks(bookmarks) {
    bookmarks.forEach((bookmark) => {
      if (bookmark.url && bookmark.url.startsWith("http")) {
        totalBookmarks++;
      }
      if (bookmark.children) {
        countBookmarks(bookmark.children);
      }
    });
  }
  countBookmarks(bookmarks[0].children);

  // 遞歸遍歷書籤
  function traverseBookmarks(bookmarks) {
    const promises = bookmarks.map((bookmark) => {
      if (bookmark.url && bookmark.url.startsWith("http")) {
        checkedBookmarks++;
        updateProgress(checkedBookmarks / totalBookmarks * 100);
        return fetchWithTimeout(bookmark.url, 5000)
          .then(response => {
            if (!response.ok) {
              console.log(`Invalid bookmark found: ${bookmark.url}`);
              invalidBookmarks.push({
                id: bookmark.id,
                title: bookmark.title,
                url: bookmark.url
              });
            }
          })
          .catch((error) => {
            console.log(`Failed to fetch bookmark: ${bookmark.url}, Error: ${error.message}`);
            invalidBookmarks.push({
              id: bookmark.id,
              title: bookmark.title,
              url: bookmark.url
            });
          });
      } else if (!bookmark.url) {
        console.log(`Skipping folder or invalid URL: ${bookmark.title}`);
      }

      if (bookmark.children) {
        return traverseBookmarks(bookmark.children);
      }
    });

    return Promise.all(promises);
  }

  traverseBookmarks(bookmarks[0].children)
    .then(() => {
      // 保存檢查結果
      chrome.storage.local.set({ 
        bookmarksChecked: true, 
        invalidBookmarks: invalidBookmarks,
        checkInProgress: false,
        checkProgress: 100
      }, () => {
        console.log('Bookmarks check complete');
        chrome.runtime.sendMessage({ action: 'bookmarksUpdated' }).catch((error) => {
          console.log('Error sending message to popup:', error.message);
        });
      });
    });
}

// 更新檢查進度
function updateProgress(progress) {
  chrome.storage.local.set({ checkProgress: progress });
  chrome.runtime.sendMessage({ action: 'updateProgress', progress: progress }).catch((error) => {
    console.log('Error sending progress update:', error.message);
  });
}

// 超時機制的 fetch 函數
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { method: 'HEAD', signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`Fetch timed out for URL: ${url}`);
    } else {
      console.log(`Fetch failed for URL: ${url}, Error: ${error.message}`);
    }
    throw error;
  }
}

// 與 popup 通信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`Received message: ${request.action}`);
  if (request.action === 'checkBookmarks') {
    console.log('Processing checkBookmarks');
    chrome.storage.local.get('checkInProgress', (data) => {
      if (!data.checkInProgress) {
        startCheckBookmarks();
        sendResponse({ success: true, message: 'Check started' });
      } else {
        sendResponse({ success: false, message: 'Check already in progress' });
      }
    });
    return true; // 告訴 Chrome 我們將異步回應
  } else if (request.action === 'removeInvalidBookmark') {
    console.log('Processing removeInvalidBookmark');
    chrome.bookmarks.remove(request.bookmarkId, () => {
      chrome.storage.local.get('invalidBookmarks', (data) => {
        const updatedInvalidBookmarks = data.invalidBookmarks.filter(
          bookmark => bookmark.id !== request.bookmarkId
        );
        chrome.storage.local.set({ 
          invalidBookmarks: updatedInvalidBookmarks 
        }, () => {
          sendResponse({ success: true });
          chrome.runtime.sendMessage({ action: 'bookmarksUpdated' }).catch((error) => {
            console.log('Error sending message to popup:', error.message);
          });
        });
      });
    });
    return true; // 告訴 Chrome 我們將異步回應
  }
});
