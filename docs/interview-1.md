# 模擬面試

## 面試題地圖與動畫解析 {#interview-1}

::: info 更新（2026-11）
題庫依主題分頁，每題附解題思路、標準答案與相關筆記；核心原理題另外附上可以逐步播放的動畫，把 Event Loop、原型鏈、渲染管線、快取、CORS 這類「看不見的過程」畫出來。
:::

### 怎麼用這一章 {#interview-1-1}

每題固定四段：

- **考點**：面試官想確認什麼。
- **解題思路**（點開）：先自己想，再對照拆解方式。
- **標準答案與過程**（點開）：可以直接講出口的版本，附程式碼。
- **相關筆記**：本站已有的完整說明，用來補細節。

建議練法：先蓋住答案、計時 2 分鐘口頭回答，再點開對照；原理題接著看動畫，確認自己腦中的過程和實際一樣。回答骨架：**定義 → 實際案例 → 為什麼這樣選 → Trade-off → 什麼情況不用**。

### 面試準備的兩層記憶 {#interview-1-6}

> 整理自 Notion「學習規劃與筆記」第三節〈面試策略〉。

- **第一層：面試最低記憶集**：高頻定義與基本原理，必須能快速說出口。
- **第二層：長期能力**：架構、Trade-off、故障模式、成本、商業需求、技術決策。
- 不要因為「八股文長期價值低」就推論「完全不用準備」。面試題容易標準化、可以快速評分，是另一套遊戲，要另外建立「面試快取」：
  - HTTP／REST → Cookie／Session／JWT → CORS／XSS／CSRF
  - Promise／Event Loop／Closure
  - TCP／HTTP／DNS
  - SQL／Index／Transaction／ACID
  - Cache／Queue → Process／Thread → Load Balancer／Reverse Proxy → Big-O
  - OOP、後端框架、API 與認證、系統設計、部署，以及**自己的真實專案案例**
- 不死背定義，從「為什麼存在」推導。例如 RESTful：問題是「Client 與 Server 如何建立可預測、低耦合的互動」→ 推出資源導向、無狀態、統一介面、HTTP 語意。被問到時是從系統設計重新推導，而不是背課本的句子。
- 例「多型」：我在哪個專案用過？解決了什麼擴充問題？不用會變成什麼設計？引入它又增加了什麼複雜度？

### 公司類型與考法 {#interview-1-7}

- **大公司**（大廠、金控、大電商）：仍考 JS 細節 + LeetCode。
- **SaaS／新創**：偏實務 trade-off（bundle size、SSR/CSR、race condition、memory leak）。
- **新興領域**：偏架構與整合。
- 大公司常說框架進公司再學，但**瀏覽器原理與效能調校**一定要熟。

### JS 必懂清單 {#interview-1-8}

| 名詞 | 一句話剖析 |
| --- | --- |
| Closure | 函式記住建立時的外層變數，離開外層後仍能存取 |
| Hoisting | 宣告被提升到作用域頂端：var 提升且初始為 undefined；let／const 提升但在宣告前存取會報錯（暫時性死區） |
| this | 由「怎麼被呼叫」決定：物件方法 → 該物件；一般函式 → undefined（strict）；箭頭函式沿用外層 this；call／apply／bind 可指定 |
| Prototype 繼承 | 物件找不到屬性時沿 `[[Prototype]]` 鏈往上找；class 只是這套機制的語法糖 |
| IIFE | 立即執行函式，舊時代用來隔離作用域；ES module 普及後已少用 |
| Promise | 代表未來才會完成的值，狀態 pending → fulfilled／rejected；then 的回呼排進 microtask |
| Event loop | 呼叫堆疊清空後，先清 microtask（Promise）再取一個 task（setTimeout、事件）執行 |
| reduce | 把陣列累積成一個值：`arr.reduce((acc, x) => …, 初始值)`；一定要給初始值 |

### Web 必懂名詞 {#interview-1-9}

| 名詞 | 一句話剖析 |
| --- | --- |
| SPA | 單頁應用：只載入一個 HTML，換頁由 JS 改寫畫面與網址，不重新整理 |
| Virtual DOM | 在記憶體中用 JS 物件描述畫面，狀態變化時比對新舊樹（diff）只更新差異的真實 DOM |
| React hooks | 讓函式元件擁有狀態與生命週期的函式，只能在元件頂層呼叫 |
| Webpack | 老牌打包工具：從入口追依賴，把 JS／CSS／圖片打包成瀏覽器可用的檔案；新專案多改用 Vite |
| REST | 以「資源 + HTTP 方法」設計 API 的風格：GET /users/1 讀、POST /users 建、PUT/PATCH 改、DELETE 刪 |
| Lazy loading | 用到才載入程式碼（動態 import）或圖片（`loading="lazy"`），縮短首屏時間 |
| JWT | header.payload.signature 三段 Base64URL，伺服器簽章、客戶端帶著當身分證明；內容可被解碼，不能放機密 |
| CSRF | 惡意網站讓瀏覽器帶著你的 Cookie 對目標站送出請求；用 SameSite Cookie、CSRF token 防 |
| XSS | 攻擊者的腳本被注入頁面執行；輸出要跳脫、用 textContent、設 CSP |
| CORS | 瀏覽器預設不讓 JS 讀跨源回應，伺服器回 `Access-Control-Allow-*` 標頭才放行；是瀏覽器的保護，不是伺服器防火牆 |

### 回答格式：一句原理 ＋ 一個案例 ＋ 如何避免 {#interview-1-10}

| 題目 | 一句原理 | 案例／避免 |
| --- | --- | --- |
| Memory Leak | 物件沒用但仍被引用，GC 無法回收 | listener／timer／全域 cache；卸載時 cleanup、WeakMap |
| 記憶體管理 | GC 看是否仍可被存取 | 設 null 不等於回收，要移除所有引用 |
| Closure | 函式記住建立時的外層作用域 | debounce 用閉包保存 timer；用完移除引用或 `dispose()` |
| Async | 同步 → microtask → task | 1 → 4 → 3 → 2；async/await + try/catch、Promise.all |

- 進階追問「怎麼確認真的 leak」：重複操作頁面，比對多次 Heap Snapshot，從 Retainers 找引用鏈。
- 補一句實務最加分：「Vue 元件卸載時會移除監聽、取消計時器」「debounce 用閉包保存 timer」。

### 資深前端常見題型 {#interview-1-11}

- **系統設計**：多語系 + 權限後台（i18n lazy-load、RBAC 控 router／元件、router meta 驗證）；大型 SPA 拆模組（lazy-load、monorepo、micro frontend）；[schema 驅動表單](./interview-13.md#interview-13-12)。
- **效能**：LCP（圖片壓縮、WebP、preload）、互動延遲（拆 bundle、lazy load、第三方 script 非同步）；大量資料用虛擬滾動、Web Worker、canvas。
- **視野**：SSR（SEO、首屏）／CSR（登入後、動態）／ISR（半動態）的取捨；怎麼帶 junior、怎麼 code review。

### 動畫解析目錄 {#interview-1-12}

標 <Badge type="info" text="動畫" /> 的題目，在答案下方附可以逐步播放的動畫：按「播放」自動跑完，或點進動畫後用鍵盤 ←／→ 一步一步看。

| 原理 | 題目 |
| --- | --- |
| Event Loop：同步 → microtask → task | [模擬面試 3 Q7](./interview-3.md#interview-3-7) |
| 閉包：var 與 let 的迴圈 | [模擬面試 3 Q4](./interview-3.md#interview-3-4) |
| this 由「怎麼呼叫」決定 | [模擬面試 3 Q5](./interview-3.md#interview-3-5) |
| 原型鏈：new 做了什麼、屬性怎麼找 | [模擬面試 3 Q6](./interview-3.md#interview-3-6) |
| Promise.all／allSettled／race／any | [模擬面試 3 Q8](./interview-3.md#interview-3-8) |
| Box Model 與 box-sizing | [模擬面試 2 Q4](./interview-2.md#interview-2-4) |
| Reflow、Repaint 與只 Composite | [模擬面試 2 Q9](./interview-2.md#interview-2-9) |
| Vue 3 響應式：track 與 trigger | [模擬面試 5 Q1](./interview-5.md#interview-5-1) |
| 列表 key：index vs 穩定 ID | [模擬面試 5 Q6](./interview-5.md#interview-5-6) |
| Hooks 為什麼不能放在條件裡 | [模擬面試 6 Q1](./interview-6.md#interview-6-1) |
| 強快取與協商快取 | [模擬面試 8 Q6](./interview-8.md#interview-8-6) |
| debounce vs throttle | [模擬面試 8 Q7](./interview-8.md#interview-8-7) |
| 從輸入網址到畫面出現 | [模擬面試 9 Q1](./interview-9.md#interview-9-1) |
| CORS 預檢請求 | [模擬面試 9 Q4](./interview-9.md#interview-9-4) |
| CSRF 與 SameSite Cookie | [模擬面試 10 Q2](./interview-10.md#interview-10-2) |

### 題庫目錄 {#interview-1-5}

| 頁 | 主題 | 題數 |
| --- | --- | --- |
| [模擬面試 2](./interview-2.md) | HTML、CSS、RWD 與相容性 | 10 |
| [模擬面試 3](./interview-3.md) | JavaScript 核心 | 13 |
| [模擬面試 4](./interview-4.md) | TypeScript | 10 |
| [模擬面試 5](./interview-5.md) | Vue | 16 |
| [模擬面試 6](./interview-6.md) | React 與 Next.js | 12 |
| [模擬面試 7](./interview-7.md) | Angular 與 RxJS | 7 |
| [模擬面試 8](./interview-8.md) | 效能優化 | 12 |
| [模擬面試 9](./interview-9.md) | 網路、API 與認證 | 10 |
| [模擬面試 10](./interview-10.md) | 前端資安 | 8 |
| [模擬面試 11](./interview-11.md) | 工程化、測試與部署 | 16 |
| [模擬面試 12](./interview-12.md) | 手寫程式題 | 13 |
| [模擬面試 13](./interview-13.md) | 架構、系統設計與行為面試 | 12 |
| [模擬面試 14](./interview-14.md) | 資料視覺化與圖表 | 5 |

舊有的 [1-3-8 常見面試題](./1-3-8.md)（LazyMan、中介軟體）也可一起練。
