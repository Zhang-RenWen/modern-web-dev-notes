# Modern WEB Dev Notes

**Modern WEB Dev Notes** is my front-end engineering knowledge base. Wherever possible, each concept is verified by running code, and the results are recorded alongside the notes. It has 182 notes on HTML, CSS, JavaScript, TypeScript, browser internals, performance, frameworks, tooling and security, plus ECMAScript features from ES6 to ES2026 and a bank of 144 mock-interview questions. Harder mechanisms, such as the event loop and the prototype chain, come with step-by-step animations. The site is built with VitePress and deployed to GitHub Pages through GitHub Actions.

**Modern WEB Dev Notes** 是我的前端開發知識庫。讀到的觀念盡量寫程式驗證，並把結果一起記下來。目前有 182 篇筆記，內容包括 HTML、CSS、JavaScript、TypeScript、瀏覽器原理、效能、框架、工程化與資安，以及 ES6～ES2026 的新語法和 144 題模擬面試；事件循環、原型鏈這類較難懂的原理附有逐步動畫。網站以 VitePress 建置，透過 GitHub Actions 部署到 GitHub Pages。

**Website 網站：** <https://zhang-renwen.github.io/modern-web-dev-notes/>

## 內容

| 章節 | 主題 |
| --- | --- |
| 第 1 章 | 前端工程通用知識點，依主題分成 3 個部分（側邊欄的頂層分組）： |
| 　1-1～1-6 | 網頁前端基礎：HTML、CSS、JavaScript 核心、TypeScript、瀏覽器原理、效能調校 |
| 　1-7～1-10 | 前端框架與工程化：框架原理、前端架構與實戰、工程化、視覺動畫 |
| 　1-11～1-12 | 瀏覽器網路與前端資安：瀏覽器網路 API 與即時通訊、前端資安 |
| 第 2～9 章 | ES6 與實務應用：類別、符號、迭代、集合、代理器、內建功能、模組 |
| 第 10～20 章 | 新標準 ES2016（ES7）～ ES2026（ES17） |
| 模擬面試 | 依主題整理的面試題庫，附解題思路、標準答案與相關筆記連結；原理題附動畫解析 |

## 技術

- [VitePress](https://vitepress.dev/) 1.x：Markdown 寫作、Shiki 語法高亮、本地全文搜尋
- GitHub Actions + GitHub Pages：自動部署

各技術的版本、建置與部署流程、架構圖見 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 站內搜尋

網站搜尋是純前端做的，不需要伺服器。設定在 `docs/.vitepress/config.mjs` 的 `search: { provider: 'local' }`，`translations` 只是介面文字。

**建置時（`npm run build`）**：VitePress 把每頁 Markdown 渲染成文字，依標題（h1～h6）切成小段，每段記錄標題路徑、內文和網址，再用 [MiniSearch](https://github.com/lucaong/minisearch)（`minisearch@7`）建成倒排索引（「詞 → 出現在哪些段落」的對照表），序列化成 `docs/.vitepress/dist/assets/chunks/@localSearchIndexroot.*.js`（2026-11 約 1.3MB，gzip 前）。

**瀏覽器端**：索引檔不在首頁載入，按下搜尋框時才動態 `import()`。之後每打一個字都在記憶體裡查索引：

1. 把輸入切成詞（tokenize）。
2. 前綴比對（打 `Prom` 也能找到 `Promise`）與模糊比對（容許拼錯一兩個字母）。
3. 用類似 BM25 的公式計分，命中標題的權重比內文高，依分數排序。
4. 結果顯示「頁面 › 標題」與內文摘要，點下去跳到該段的錨點。

| 好處 | 代價 |
| --- | --- |
| 不用後端或第三方服務，GitHub Pages 這種靜態主機就能用 | 頁面越多索引越大，第一次打開搜尋要下載整份索引 |
| 離線也能搜、速度快 | 內容更新要重新 build，索引才會更新 |
| 沒有隱私或費用問題 | 規模大到幾萬頁時，就該換 Algolia 這類伺服器端搜尋 |

**中文的限制**：MiniSearch 預設用空白和標點斷詞，中文沒有空白，一整句會被當成一個很長的詞，所以搜中文主要靠前綴比對，搜句子中間的詞有時找不到。要改善可以在 `search.options.miniSearch` 自訂 `tokenize`，例如用瀏覽器內建的 `Intl.Segmenter('zh', { granularity: 'word' })` 做中文斷詞（目前尚未設定）。

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
ARCHITECTURE.md               # 技術與架構圖
```

## 寫作方式

### 新增一頁

1. 在 `docs/` 新增 `章-節.md`，第一行寫頁面標題，例如 `# 18-7 標題 {#18-7}`。
2. 在 `docs/.vitepress/sidebar.js` 的對應章節加上 `{ "text": "18-7 標題", "link": "/18-7" }`。第 1 章的節分在 3 個頂層分組裡（「網頁前端基礎」「前端框架與工程化」「瀏覽器網路與前端資安」），新頁要加在主題相符的節，不要塞進主題不同的節。本站只放前端與瀏覽器相關的內容；網路協定、後端、電腦科學、數學、職涯等筆記放在個人 Notion，不放進這裡。
3. 每章的第一頁以章節名稱作為 `#` 標題，頁面標題改用 `##`，例如 [docs/18-1.md](docs/18-1.md)。
4. 有子頁的節首頁（例如 [docs/1-16.md](docs/1-16.md)）只放標題與 `<SectionToc />`，元件會依 `sidebar.js` 自動列出子頁。
5. **檔名就是網址，不要因為排序改名**。第 1 章在 2026-11 依主題重新分組並重新編號過，之後又把非前端的節移出本站（舊網址已失效）；之後新增的頁面接在所屬節的最後面。編號序列只給會持續增加的章節用：新標準每年接著編（ES2027 用 `21-x`、ES2028 用 `22-x`）。固定的專區改用文字前綴，例如模擬面試是 `interview-1.md`～`interview-14.md`，錨點也用 `{#interview-3-7}`。顯示順序由 `sidebar.js` 決定。

### 常用語法

| 用途 | 寫法 |
| --- | --- |
| 自訂錨點 | `## 小節名稱 {#18-7-1}` |
| 站內連結 | `[18-1](./18-1.md)` |
| 提示框 | `::: info` / `::: tip` / `::: warning` / `::: danger` / `::: details` |
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
