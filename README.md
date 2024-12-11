# Bookmark Checker (BC)

**Bookmark Checker** 是一款 Chrome 插件，用於檢查書籤是否失效並自動分類，幫助你更好地管理你的書籤。

## 概述

這個插件提供以下功能：

- **檢查書籤是否失效**：當用戶手動按下按鈕時，插件會檢查你的書籤，確保它們仍然有效。
- **簡單的用戶界面**：提供一個彈出窗口界面，讓你可以查看失效的書籤。

### 用戶界面

- 點擊插件圖標，彈出窗口將顯示：
  - 所有失效書籤列表
  - 開始檢查按鈕
  - 檢查進度條
  - 失效書籤列表 
    - 失效連結名稱  >  網址(超連結)  >  刪除書籤按鈕

## 安裝

1. **克隆或下載這個項目**：
   ```bash
   git clone https://github.com/your-username/bookmark-checker.git
   ```
2. 打開 Chrome 瀏覽器並進入 chrome://extensions/。
3. 啟用 "開發者模式"。
4. 點擊 "載入未打包的擴展功能"，選擇下載的 bookmark-checker 文件夾。

## GitHub
查看項目源碼 https://github.com/lovemidog001/BC

## 插件結構
bookmark-checker/
├── background.js  // 後台腳本，處理按鈕觸發的檢查邏輯
├── content.js     // 內容腳本，用於頁面內容的操作
├── popup/
│   ├── popup.html  // 插件的 popup 界面，包含檢查按鈕
│   ├── popup.js    // 控制 popup 界面的邏輯，包括與背景腳本的通信
│   └── popup.css   // 為 popup 界面添加樣式
├── icons/         // 插件圖標
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── manifest.json  // 插件配置文件

## 使用
點擊插件圖標打開彈出窗口。
點擊 "開始檢查" 按鈕，插件將開始檢查所有書籤的有效性。
檢查完成後，彈出窗口會顯示失效書籤的列表。
你可以選擇查看失效書籤的詳細信息或直接刪除失效的書籤。

## 開發者
[lovemidog001]

## 貢獻
歡迎任何形式的貢獻！如果你有任何建議、問題或錯誤修復，請：

提交 PR：確保你的代碼遵循我們的代碼風格，並附上詳細的提交信息。
報告問題：在 issue 中詳細描述問題，包括如何重現、期望的行為等。

## 許可證
此項目遵循 MIT 許可證。

## 聯繫方式
如果你有任何疑問或需要幫助，請聯繫：lovepulga@gmail.com