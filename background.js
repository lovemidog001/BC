let isChecking = false;
let checkController = null;

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

/**
 * 檢查 URL 是否有效
 * 優化點：增加 User-Agent，處理更多狀態碼，支持超時
 */
async function checkUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 增加到 15 秒
  
  try {
    // 優先使用 HEAD 請求以節省流量
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // 如果伺服器不支援 HEAD，嘗試 GET 但不下載 Body
    if (response.status === 405 || response.status === 403 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    }

    clearTimeout(timeoutId);

    if (response.ok) {
      return { valid: true };
    }

    // 細化錯誤類型
    switch (response.status) {
      case 404: return { valid: false, reason: '頁面不存在 (404)' };
      case 410: return { valid: false, reason: '頁面已永久移除 (410)' };
      case 500: case 502: case 503: case 504:
        return { valid: false, reason: `伺服器故障 (${response.status})` };
      default:
        return { valid: false, reason: `請求失敗 (${response.status})` };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { valid: false, reason: '連接超時' };
    }
    const msg = error.message.toLowerCase();
    if (msg.includes('dns') || msg.includes('not_found')) {
      return { valid: false, reason: '域名無法解析' };
    } else if (msg.includes('refused')) {
      return { valid: false, reason: '連接被拒絕' };
    }
    return { valid: false, reason: `網絡錯誤: ${error.message}` };
  }
}

/**
 * 開始檢查書籤
 */
async function startCheckBookmarks() {
  if (isChecking) return;
  
  isChecking = true;
  checkController = new AbortController();
  
  try {
    const tree = await chrome.bookmarks.getTree();
    await processBookmarks(tree);
  } catch (error) {
    console.error('Error starting bookmark check:', error);
    isChecking = false;
  }
}

/**
 * 處理並檢查書籤列表
 */
async function processBookmarks(tree) {
  const flatBookmarks = [];
  
  // 1. 扁平化書籤樹並記錄路徑
  function flatten(nodes, path = '') {
    for (const node of nodes) {
      const currentPath = path ? `${path} > ${node.title}` : node.title;
      if (node.url && (node.url.startsWith('http'))) {
        flatBookmarks.push({
          id: node.id,
          title: node.title || '未命名',
          url: node.url,
          path: path // 記錄父級路徑
        });
      }
      if (node.children) {
        flatten(node.children, currentPath);
      }
    }
  }
  
  flatten(tree[0].children);
  
  const total = flatBookmarks.length;
  const invalidBookmarks = [];
  let checked = 0;
  const CONCURRENCY = 5;
  
  // 2. 使用隊列進行並發檢查
  const queue = [...flatBookmarks];
  const workers = Array(Math.min(CONCURRENCY, queue.length)).fill(null).map(async () => {
    while (queue.length > 0 && isChecking) {
      const bookmark = queue.shift();
      try {
        const result = await checkUrl(bookmark.url);
        if (!result.valid) {
          invalidBookmarks.push({
            ...bookmark,
            reason: result.reason
          });
        }
      } catch (e) {
        console.error(`Failed to check ${bookmark.url}`, e);
      } finally {
        checked++;
        updateProgress(Math.round((checked / total) * 100));
      }
    }
  });

  await Promise.all(workers);

  // 3. 儲存結果
  if (isChecking) {
    await chrome.storage.local.set({
      bookmarksChecked: true,
      invalidBookmarks,
      checkInProgress: false,
      checkProgress: 100,
      lastCheckTime: new Date().toISOString()
    });

    chrome.runtime.sendMessage({ action: 'bookmarksUpdated', invalidBookmarks });
    chrome.runtime.sendMessage({ action: 'checkComplete' });
  }
  
  isChecking = false;
}

// 更新進度
function updateProgress(progress) {
  chrome.storage.local.set({ checkProgress: progress });
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    progress: progress
  }).catch(() => {}); // 忽略 popup 關閉時的錯誤
}

/**
 * 備份書籤為 HTML (NETSCAPE 格式)
 */
async function backupBookmarks() {
  try {
    const tree = await chrome.bookmarks.getTree();
    
    function nodesToHTML(nodes, level = 0) {
      let html = '';
      const indent = '    '.repeat(level);
      
      for (const node of nodes) {
        if (node.url) {
          const title = (node.title || '未命名').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
          html += `${indent}<DT><A HREF="${node.url}" ADD_DATE="${addDate}">${title}</A>\n`;
        } else if (node.children) {
          const title = (node.title || '新資料夾').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
          html += `${indent}<DT><H3 ADD_DATE="${addDate}">${title}</H3>\n`;
          html += `${indent}<DL><p>\n`;
          html += nodesToHTML(node.children, level + 1);
          html += `${indent}</DL><p>\n`;
        }
      }
      return html;
    }

    const htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${nodesToHTML(tree[0].children)}
</DL><p>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = async () => {
        const timestamp = new Date().toISOString().slice(0, 10);
        await chrome.downloads.download({
          url: reader.result,
          filename: `bookmarks_backup_${timestamp}.html`,
          saveAs: true
        });
        resolve({ success: true });
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
}

// 消息監聽
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'checkBookmarks':
      startCheckBookmarks();
      sendResponse({ success: true });
      break;
    case 'stopBookmarks':
      isChecking = false;
      sendResponse({ success: true });
      break;
    case 'removeInvalidBookmark':
      chrome.bookmarks.remove(request.bookmarkId, async () => {
        const data = await chrome.storage.local.get('invalidBookmarks');
        const updated = data.invalidBookmarks.filter(b => b.id !== request.bookmarkId);
        await chrome.storage.local.set({ invalidBookmarks: updated });
        chrome.runtime.sendMessage({ action: 'bookmarksUpdated' });
        sendResponse({ success: true });
      });
      break;
    case 'removeMultipleBookmarks':
      (async () => {
        for (const id of request.bookmarkIds) {
          try { await chrome.bookmarks.remove(id); } catch(e) {}
        }
        const data = await chrome.storage.local.get('invalidBookmarks');
        const updated = data.invalidBookmarks.filter(b => !request.bookmarkIds.includes(b.id));
        await chrome.storage.local.set({ invalidBookmarks: updated });
        chrome.runtime.sendMessage({ action: 'bookmarksUpdated' });
        sendResponse({ success: true });
      })();
      break;
    case 'backupBookmarks':
      backupBookmarks().then(sendResponse);
      break;
    case 'confirmCleanup':
      (async () => {
        const backup = await backupBookmarks();
        if (backup.success) {
          const data = await chrome.storage.local.get('invalidBookmarks');
          for (const b of data.invalidBookmarks) {
            try { await chrome.bookmarks.remove(b.id); } catch(e) {}
          }
          await chrome.storage.local.set({ invalidBookmarks: [] });
          chrome.runtime.sendMessage({ action: 'bookmarksUpdated' });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: '備份失敗' });
        }
      })();
      break;
  }
  return true;
});
