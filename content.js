// 等待DOM完全載入
document.addEventListener('DOMContentLoaded', () => {
  // 延遲執行，確保DOM完全載入
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'checkCurrentURL' }, (response) => {
      if (response && response.isBookmarked) {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.textContent = 'This page is bookmarked!';
        notification.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          padding: 10px;
          background-color: #4CAF50;
          color: white;
          border-radius: 5px;
          z-index: 9999;
          transition: opacity 0.5s ease-out;
        `;
        document.body.appendChild(notification);

        // 設置定時器，3秒後淡出通知
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 3000);
      }
    });
  }, 500); // 延遲500毫秒
});
