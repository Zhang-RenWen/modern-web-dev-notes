# Modern WEB Dev Notes

我的前端開發個人筆記，整理前端工程知識點與 ECMAScript 各版本的新語法，並盡量附上實際驗證過的範例。

**網站：** <https://zhang-renwen.github.io/modern-web-dev-notes/>

## 內容

| 章節 | 主題 |
| --- | --- |
| 第 1 章 | 前端工程通用知識點：HTML5 & CSS3、JavaScript 核心、瀏覽器、效能、設計模式、架構、資料結構與演算法、網路、資安、面試題 |
| 第 2～9 章 | ES6 與實務應用：類別、符號、迭代、集合、代理器、內建功能、模組 |
| 第 10～20 章 | 新標準 ES2016（ES7）～ ES2026（ES17） |

## 技術

- [VitePress](https://vitepress.dev/) 1.x：Markdown 寫作、Shiki 語法高亮、本地全文搜尋
- MathJax（`markdown-it-mathjax3`）：數學式
- GitHub Actions + GitHub Pages：自動部署

## 本機開發

建議使用 Node.js 22（與部署環境相同，VitePress 最低需求為 Node.js 18）。

```bash
npm install
npm run dev       # 開發伺服器
npm run build     # 建置到 docs/.vitepress/dist
npm run preview   # 預覽建置結果
```

## 專案結構

```text
docs/
├── index.md              # 首頁
├── 1-1-1.md … 20-7.md    # 筆記，檔名即網址（例如 18-1.md → /18-1.html）
├── public/assets/        # 圖片與圖示
└── .vitepress/
    ├── config.mjs        # 站台設定（base、GA、搜尋、Markdown 選項）
    ├── sidebar.js        # 側邊欄
    └── theme/            # 主題擴充與自訂樣式
.github/workflows/deploy.yml  # 部署流程
```

## 寫作方式

### 新增一頁

1. 在 `docs/` 新增 `章-節.md`，第一行寫頁面標題，例如 `# 18-7 標題 {#18-7}`。
2. 在 `docs/.vitepress/sidebar.js` 的對應章節加上 `{ "text": "18-7 標題", "link": "/18-7" }`。
3. 每章的第一頁以章節名稱作為 `#` 標題，頁面標題改用 `##`，例如 [docs/18-1.md](docs/18-1.md)。

### 常用語法

| 用途 | 寫法 |
| --- | --- |
| 自訂錨點 | `## 小節名稱 {#18-7-1}` |
| 站內連結 | `[18-1](./18-1.md)` |
| 提示框 | `::: info` / `::: tip` / `::: warning` / `::: danger` / `::: details` |
| 數學式 | 行內 `$...$`，獨立區塊 `$$...$$` |
| 互動示範 | `<div class="demo-block" v-pre>...</div>`，需要 JS 時在頁面中使用 `<script setup>` |

### 標示過時內容

舊內容過時時保留原文，加上標示說明現況：

```markdown
~~過時的說法~~

::: warning 更新備註（2026-11）
目前的狀況……
:::
```

內容正確、只是要補充現況時，改用：

```markdown
::: info 補充說明（2026-11）
補充說明……
:::
```

### 注意事項

VitePress 會把 Markdown 當成 Vue 範本編譯：

- 一般文字中的 `{{ }}` 會被當成 Vue 插值，請放進行內程式碼，或用 `<span v-pre>` 包起來。
- 段落結尾的 `{...}` 會被當成 HTML 屬性，請放進行內程式碼。
- 刪除線緊鄰中文標點時 `~~` 可能失效，改用 `<s>...</s>`。

## 部署

push 到 `main` 後，GitHub Actions 會自動建置並部署到 GitHub Pages（repo 的 Pages 來源需設為「GitHub Actions」）。

## 參考資料

第 2～9 章整理自 Nicolas Bevacqua《Practical Modern JavaScript》（中文版《現代 JavaScript 實務應用》，2018）。新語法參考 [TC39](https://github.com/tc39)、[ECMA-262](https://tc39.es/ecma262/) 與 [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)。
