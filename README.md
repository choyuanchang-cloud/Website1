# 硬幣價格練習

這是一個給孩子練習台幣硬幣計算的網頁遊戲，支援手機、平板與電腦操作。遊戲使用 50、10、5、1 元四種硬幣，孩子可以透過點選或拖曳硬幣來練習付錢，也可以看硬幣組合計算總金額。

## 功能特色

- 兩種練習模式：
  - 看價格付錢
  - 數硬幣總價
- 支援三種金額範圍：
  - 100 以內：1 到 99
  - 200 以內：100 到 199
  - 500 以內：1 到 499
- 硬幣面額：
  - 50 元：黃銅色，最大
  - 10 元：銀色
  - 5 元：銀色
  - 1 元：古銅色，最小
- 操作方式：
  - 點一下硬幣即可放入付款盤
  - 也可以拖曳硬幣到付款盤
  - 放錯硬幣時，可以點一下付款盤中的硬幣移除，或拖出付款盤
- 答對、答錯會有不同音效
- 顯示連續答對、答對總數、答錯總數
- 可重新計分
- 支援手機與平板版面
- 支援 PWA，可加入 iPad 或手機主畫面使用
- 不需要後端伺服器，直接部署靜態檔即可

## 使用方式

直接用瀏覽器開啟：

```text
index.html
```

或部署到 GitHub Pages、Netlify、Cloudflare Pages 等靜態網站服務。

## 檔案結構

```text
.
├── index.html
├── styles.css
├── script.js
├── manifest.webmanifest
├── service-worker.js
└── icons/
    ├── apple-touch-icon.png
    ├── icon-192.png
    └── icon-512.png
```

## 部署到 GitHub Pages

1. 建立一個新的 GitHub Repository。
2. 將本專案所有檔案上傳到 repository 根目錄。
3. 到 repository 的 `Settings`。
4. 選擇 `Pages`。
5. 在 `Build and deployment` 中選擇：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. 儲存設定。
7. 等待 GitHub Pages 完成部署。

部署完成後，GitHub 會提供一個網址，例如：

```text
https://你的帳號.github.io/你的repository名稱/
```

把這個網址分享給使用者即可。

## 在 iPad 或手機加入主畫面

建議使用 HTTPS 網址，例如 GitHub Pages 的網址。

### iPad / iPhone

1. 用 Safari 開啟遊戲網址。
2. 按分享按鈕。
3. 選擇「加入主畫面」。
4. 名稱可設定為「硬幣練習」。
5. 之後即可像 App 一樣從主畫面開啟。

### Android

1. 用 Chrome 開啟遊戲網址。
2. 按右上角選單。
3. 選擇「加入主畫面」或「安裝應用程式」。

## 離線使用

本專案包含 `service-worker.js`，部署到 HTTPS 網站後，瀏覽器會快取遊戲檔案。第一次開啟需要網路，之後通常可以離線使用。

如果更新後仍看到舊版本，可以嘗試：

- 重新整理頁面
- 關閉後重新開啟
- 刪除主畫面圖示後重新加入
- 清除瀏覽器快取

## 適合使用情境

- 小學生認識台幣硬幣
- 特教、資源班、生活數學練習
- 家庭親子練習
- 平板互動教學

## 技術說明

- 純 HTML、CSS、JavaScript
- 無需安裝套件
- 無需資料庫
- 支援 Pointer Events，滑鼠、觸控、平板都可使用
- PWA manifest 與 service worker 已設定

## 授權

可自由使用、修改與分享。若要公開發布，建議自行補上適合的開源授權，例如 MIT License。
