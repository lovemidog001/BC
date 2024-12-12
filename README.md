<div align="center">

# 🔖 Bookmark Checker (BC)

<img src="icons/icon128.png" alt="BC Logo" width="128" height="128">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/lovemidog001/BC/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**優雅且高效的 Chrome 書籤管理工具，讓您的書籤永遠保持整潔！**

[✨ 功能特點](#-功能特點) •
[📦 安裝說明](#-安裝說明) •
[🚀 使用指南](#-使用指南) •
[🔄 更新日誌](#-更新日誌) •
[🤝 參與貢獻](#-參與貢獻)

<p align="center">
  <img src="screenshots/preview.gif" alt="使用預覽" width="600">
</p>

</div>

## ✨ 功能特點

### 核心功能
- 🔍 **智能檢測**
  - 自動識別並檢查所有書籤連結
  - 支援 HTTP/HTTPS 協議
  - 精確檢測頁面存活狀態
  
- ��� **一鍵清理**
  - 清理前自動提示備份
  - 快速移除失效書籤
  - 批量處理功能
  - 操作可撤銷保護
  - 書籤備份還原功能

### 使用體驗
- 💻 **優雅界面**
  - 現代化設計風格
  - 深色模式支援
  - 流暢的動畫效果
  
- ⚡ **極致性能**
  - 非阻塞式檢測
  - 智能並發控制
  - 極低資源佔用

### 進階特性
- 📊 **詳細報告**
  - 失效原因分析
  - 檢測歷史記錄
  - 統計數據展示

## 📦 安裝說明

### 方法一：Chrome 線上商店安裝
1. 訪問 [Chrome Web Store](https://chrome.google.com/webstore)
2. 搜尋 "Bookmark Checker BC"
3. 點擊「新增至 Chrome」

### 方法二：開發者模式安裝
```bash
# 1. 克隆專案
git clone https://github.com/lovemidog001/BC.git

# 2. 進入專案目錄
cd BC
```

然後：
1. 打開 Chrome 瀏覽器
2. 進入擴充功能頁面：`chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇已克隆的專案資料夾

## 🚀 使用指南

### 基本操作
1. 點擊工具列中的 BC 圖示
2. 在彈出視窗中選擇操作：
   - 「開始檢查」：執行完整掃描
   - 「停止檢查」：隨時中斷操作
3. 查看檢測結果：
   - 紅色標記：失效書籤
   - 點擊可查看詳細資訊
4. 處理失效書籤：
   - 系統會自動詢問是否需要備份
   - 支援一鍵備份所有書籤
   - 單個刪除
   - 批量清理
   - 導出報告

### 進階技巧
- 使用快捷鍵：`Ctrl+Shift+B`（Windows/Linux）或 `⌘+Shift+B`（macOS）
- 自訂檢查間隔
- 匯出/匯入設定

## 🔄 更新日誌

### v1.1.0 (2024-03-xx)
- ✨ 新增功能
  - 一鍵備份所有書籤
  - 支援匯出HTML格式書籤檔案
  - 智能處理未命名書籤
- 🛠️ 優化改進
  - 改進書籤匯出格式
  - 優化備份檔案命名方式
  - 提升資料處理效能

### v1.0.0 (2024-03-xx)
- ✨ 首次發布
- 🎉 核心功能完整實現
  - 智能書籤檢測
  - 一鍵清理（含備份提醒）
  - 書籤備份還原
- 🌈 全新界面設計
- ⚡️ 性能優化提升

### 開發中功能
- [ ] 書籤分類管理
- [ ] 雲端同步支援
- [ ] 多語言本地化
- [ ] 進階篩選功能
- [ ] 批量還原功能

## 🛠️ 技術實現

```
bookmark-checker/
├── manifest.json     # 擴充功能配置
├── background.js     # 後台服務
├── popup/           # 前端介面
│   ├── popup.html   # 彈窗結構
│   ├── popup.js     # 交互邏輯
│   └── popup.css    # 樣式定義
└── icons/           # 圖示資源
```

## 🤝 參與貢獻

我們歡迎所有形式的貢獻，無論是新功能、bug 修復還是文檔改進！

1. Fork 本專案
2. 建立特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📝 許可證

本專案採用 MIT 許可證 - 詳情請見 [LICENSE](LICENSE) 檔案

## 📮 聯絡方式

- Email：lovepulga@gmail.com
- GitHub：[@lovemidog001](https://github.com/lovemidog001)
- Twitter：[@lovemidog001](https://twitter.com/lovemidog001)

---

<div align="center">
  
**用 ❤️ 打造，為所有 Chrome 使用者服務**

<br>

[⬆ 返回頂部](#-bookmark-checker-bc)

</div>