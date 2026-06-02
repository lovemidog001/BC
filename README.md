<div align="center">

# 🔖 Bookmark Checker (BC) - Pro 版

<img src="icons/icon128.png" alt="BC Logo" width="128" height="128">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/lovemidog001/BC/releases)

**優雅且高效的 Chrome 書籤管理工具，現已全面優化！**

[✨ 功能特點](#-功能特點) •
[📦 安裝說明](#-安裝說明) •
[🚀 使用指南](#-使用指南) •
[🔄 更新日誌](#-更新日誌) •
[🛠️ 技術優化](#-技術優化)

</div>

## ✨ 功能特點

### 🚀 核心優化
- 🔍 **智能深度檢測**
  - 採用 **並發隊列控制**，即使有數千個書籤也能穩定運行。
  - 智能模擬 `User-Agent`，大幅減少被伺服器誤判的機率。
  - 精確識別 404, 410, 50x 等多種失效狀態。
  
- 🛠️ **高效批量管理**
  - **批量選擇**：一鍵選取多個失效書籤，快速清理。
  - **路徑顯示**：清楚顯示失效書籤所在的資料夾路徑，方便定位。
  - **自動備份**：清理前自動導出 HTML 備份，確保數據萬無一失。

### 🎨 優雅體驗
- 💻 **現代化 UI**
  - 全新的卡片式佈局，視覺更清晰。
  - 實時進度展示與流暢的動畫反饋。
  - 適配標準 Netscape 書籤格式，備份文件可完美遷移。

## 📦 安裝說明

1. 打開 Chrome 瀏覽器，進入 `chrome://extensions/`
2. 開啟右上角的「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇本專案的 `BC-main` 資料夾

## 🚀 使用指南

### 快速清理流程
1. 點擊 **「開始檢查」**，系統將並發掃描所有書籤。
2. 在失效列表中查看結果，可以看到每個書籤的 **錯誤原因** 與 **所在路徑**。
3. 勾選想要刪除的項目，點擊 **「刪除選中項」**。
4. 或者使用 **「自動清理」**，一鍵完成備份與全量清理。

## 🔄 更新日誌

### v1.2.0 (2026-06-02)
- ✨ **新功能**：增加書籤批量選擇與刪除功能。
- ✨ **新功能**：列表顯示書籤父級資料夾路徑。
- 🛠️ **架構重構**：將遞迴檢查改為 Promise 隊列模式，提升穩定性。
- 🛠️ **網絡優化**：優化 HEAD 請求邏輯，增加對 403/405 狀態的降級處理。
- 💄 **介面美化**：重設計 popup 佈局，優化進度條與按鈕視覺。

## 🛠️ 技術優化細節

- **並發控制**：使用 `workers` 隊列模式，限制並發數為 5，避免瀏覽器請求過載。
- **錯誤診斷**：針對不同 HTTP 狀態碼提供人性化的中文描述。
- **數據持久化**：使用 `chrome.storage.local` 同步檢查進度，popup 關閉後背景任務持續執行。
- **標準兼容**：備份功能生成的 HTML 嚴格遵循 Netscape 格式，支持各種瀏覽器匯入。

