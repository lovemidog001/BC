let isChecking = false;

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.set({ 
    bookmarksChecked: false, 
    invalidBookmarks: [],
    checkInProgress: false,
    checkProgress: 0
  });
});

// 檢查 URL 是否有效
async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      mode: 'no-cors'
    });
    
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return { valid: false, reason: '頁面不存在 (404)' };
    } else if (response.status >= 400) {
      return { valid: false, reason: `伺服器錯誤 (${response.status})` };
    } else if ([301, 302].includes(response.status)) {
      return { valid: false, reason: '頁面已被重定向' };
    }
    return { valid: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { valid: false, reason: '連接超時' };
    } else if (error.message.includes('ECONNREFUSED')) {
      return { valid: false, reason: '連接被拒絕' };
    } else if (error.message.includes('ENOTFOUND')) {
      return { valid: false, reason: '域名無法解析' };
    }
    return { valid: false, reason: `連接錯誤: ${error.message}` };
  }
}

// 開始檢查書籤
async function startCheckBookmarks() {
  if (isChecking) return;
  
  isChecking = true;
  
  try {
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = tree[0].children;
    await checkAndUpdateBookmarks(bookmarks);
  } catch (error) {
    console.error('Error starting bookmark check:', error);
  }
}

// 檢查並更新書籤
async function checkAndUpdateBookmarks(bookmarks) {
  const invalidBookmarks = [];
  let totalBookmarks = 0;
  let checkedBookmarks = 0;

  // 計算總書籤數
  function countBookmarks(items) {
    for (const item of items) {
      if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
        totalBookmarks++;
      }
      if (item.children) {
        countBookmarks(item.children);
      }
    }
  }
  countBookmarks(bookmarks);
  console.log(`Total bookmarks to check: ${totalBookmarks}`);

  // 使用並發限制的檢查函數
  async function checkBookmarksWithLimit(items, concurrency = 5) {
    const queue = [];
    
    async function processBookmark(bookmark) {
      if (!isChecking) return;
      
      if (bookmark.url && (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://'))) {
        checkedBookmarks++;
        updateProgress(Math.round((checkedBookmarks / totalBookmarks) * 100));

        console.log(`Checking: ${bookmark.title}`);
        const result = await checkUrl(bookmark.url);
        
        if (!result.valid) {
          console.log(`Invalid bookmark found: ${bookmark.url} - ${result.reason}`);
          invalidBookmarks.push({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            reason: result.reason
          });
        }
      }

      if (bookmark.children) {
        await checkBookmarksWithLimit(bookmark.children, concurrency);
      }
    }

    // 並發處理書籤
    for (const bookmark of items) {
      if (queue.length >= concurrency) {
        await Promise.race(queue);
      }
      
      const promise = processBookmark(bookmark).then(() => {
        queue.splice(queue.indexOf(promise), 1);
      });
      
      queue.push(promise);
    }

    await Promise.all(queue);
  }

  try {
    await checkBookmarksWithLimit(bookmarks);
    
    // 保存結果
    await chrome.storage.local.set({
      bookmarksChecked: true,
      invalidBookmarks,
      checkInProgress: false,
      checkProgress: 100,
      lastCheckTime: new Date().toISOString()
    });

    console.log(`Check complete. Found ${invalidBookmarks.length} invalid bookmarks`);
    chrome.runtime.sendMessage({
      action: 'bookmarksUpdated',
      invalidBookmarks
    });
    chrome.runtime.sendMessage({ action: 'checkComplete' });
  } catch (error) {
    console.error('Error during bookmark check:', error);
    chrome.runtime.sendMessage({
      action: 'checkError',
      error: error.message
    });
  } finally {
    isChecking = false;
  }
}

// 更新進度
function updateProgress(progress) {
  chrome.storage.local.set({ checkProgress: progress });
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    progress: progress
  }).catch(error => {
    console.log('Error sending progress update:', error.message);
  });
}

// 備份書籤
async function backupBookmarks() {
  try {
    const bookmarks = await chrome.bookmarks.getTree();
    
    // 將數據轉換為base64的輔助函數
    function arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    
    // 將書籤轉換為HTML格式
    function bookmarksToHTML(nodes, level = 0) {
      let html = '';
      const indent = '    '.repeat(level);
      
      for (const node of nodes) {
        if (node.url) {
          // 如果沒有標題，使用 "未命名" 作為標題
          const title = node.title.trim() || "未命名";
          html += `${indent}<DT><A HREF="${node.url}">${title}</A>\n`;
        } else {
          // 資料夾標題，如果為空則使用 "未命名資料夾"
          const folderTitle = node.title.trim() || "未命名資料夾";
          html += `${indent}<DT><H3>${folderTitle}</H3>\n`;
          html += `${indent}<DL><p>\n`;
          if (node.children) {
            html += bookmarksToHTML(node.children, level + 1);
          }
          html += `${indent}</DL><p>\n`;
        }
      }
      return html;
    }

    const htmlContent = 
`<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${bookmarksToHTML(bookmarks)}
</DL><p>`;

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(htmlContent);
    const base64Data = arrayBufferToBase64(encodedData);
    const dataUrl = `data:text/html;base64,${base64Data}`;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bookmarks-backup-${timestamp}.html`;
    
    await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    });
    
    return { success: true };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
}

// 監聽消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`Received message: ${request.action}`);
  
  switch (request.action) {
    case 'checkBookmarks':
      if (!isChecking) {
        startCheckBookmarks();
        sendResponse({ success: true, message: 'Check started' });
      } else {
        sendResponse({ success: false, message: 'Check already in progress' });
      }
      break;

    case 'stopBookmarks':
      isChecking = false;
      sendResponse({ success: true });
      break;

    case 'removeInvalidBookmark':
      chrome.bookmarks.remove(request.bookmarkId, () => {
        chrome.storage.local.get('invalidBookmarks', (data) => {
          const updatedInvalidBookmarks = data.invalidBookmarks.filter(
            bookmark => bookmark.id !== request.bookmarkId
          );
          chrome.storage.local.set({ invalidBookmarks: updatedInvalidBookmarks }, () => {
            sendResponse({ success: true });
            chrome.runtime.sendMessage({ action: 'bookmarksUpdated' });
          });
        });
      });
      break;

    case 'backupBookmarks':
      backupBookmarks().then(sendResponse);
      break;
      
    case 'confirmCleanup':
      backupBookmarks().then(backupResult => {
        if (backupResult.success) {
          // 執行清理操作
          chrome.storage.local.get('invalidBookmarks', async (data) => {
            const { invalidBookmarks } = data;
            for (const bookmark of invalidBookmarks) {
              await chrome.bookmarks.remove(bookmark.id);
            }
            chrome.storage.local.set({ invalidBookmarks: [] });
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ 
            success: false, 
            error: '備份失敗，清理操作已取消' 
          });
        }
      });
      break;
  }
  
  return true;
});
