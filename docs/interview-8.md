# 模擬面試 8：效能優化 {#interview-8}

::: info 新增（2026-11）
Core Web Vitals、SSR／ISR 策略、頁面操作流程與大量資料的效能。資深面試一定會追問「怎麼量測」與「改善了多少」。
:::

### Q1. Core Web Vitals 有哪些指標？標準是多少？怎麼改善？ <Badge type="tip" text="高頻" /> {#interview-8-1}

::: details 標準答案與過程
| 指標 | 量什麼 | 良好 | 常見原因 | 改善 |
| --- | --- | --- | --- | --- |
| **LCP**（Largest Contentful Paint） | 最大內容出現的時間 | ≤ 2.5 秒 | 主圖太大、TTFB 慢、阻塞渲染的 CSS／JS | 主圖 `fetchpriority="high"`、預載、WebP/AVIF、CDN、SSR／SSG、關鍵 CSS 內嵌 |
| **INP**（Interaction to Next Paint） | 互動到下一次畫面更新的延遲 | ≤ 200 毫秒 | 長任務佔住主執行緒、事件處理太重 | 拆分長任務、`scheduler.yield()`、Web Worker、減少重新渲染 |
| **CLS**（Cumulative Layout Shift） | 版面意外位移 | ≤ 0.1 | 圖片沒寫尺寸、廣告／字型晚載入、動態插入內容 | `width`/`height` 或 `aspect-ratio`、骨架屏預留空間、`font-display` 與字型預載 |

INP 在 2024 年 3 月取代 FID。標準以第 75 百分位數的真實使用者資料為準。

**量測**：
- 實驗室資料：Lighthouse、Chrome DevTools Performance。
- 真實使用者（RUM）：`web-vitals` 套件回報到監控系統、Chrome UX Report、PageSpeed Insights。

```js
import { onLCP, onINP, onCLS } from 'web-vitals'
const report = (metric) => navigator.sendBeacon('/rum', JSON.stringify(metric))
onLCP(report); onINP(report); onCLS(report)
```
:::

**相關筆記**：[1-6-1 效能監控和錯誤收集與回報](./1-6-1.md)、[1-6-4 HTTP-網頁效能入門](./1-6-4.md)

### Q2. 使用者說頁面很慢，你怎麼排查？ <Badge type="tip" text="高頻" /> {#interview-8-2}

::: details 解題思路
不要直接列優化手段。先釐清「哪裡慢、對誰慢」，再分層量測，最後才改。
:::

::: details 標準答案與過程
1. **釐清**：首次載入慢、切頁慢、還是操作卡？所有人都慢還是特定裝置／地區／網路？
2. **重現與量測**：DevTools Network（節流 Fast 4G、停用快取）、Performance 錄製、Lighthouse；看 RUM 資料確認影響範圍。
3. **分層判斷**：

| 現象 | 可能位置 | 工具 |
| --- | --- | --- |
| TTFB 高 | 後端、DB、沒有快取、離 CDN 遠 | Network Timing、後端 APM |
| 下載久 | Bundle 太大、圖片未壓縮 | Coverage、bundle analyzer |
| 白畫面久 | 阻塞渲染資源、CSR 要等 JS | Performance 的 FCP／LCP |
| 操作卡頓 | 長任務、過度渲染 | Performance Long Tasks、框架 Profiler |
| 越用越慢 | 記憶體洩漏 | Memory Heap Snapshot |
| API 多次往返 | N+1 請求、瀑布式依賴 | Network 瀑布圖 |

4. **改善後再量一次**，留下前後數據，加入效能預算（bundle 大小、LCP）到 CI 防止退步。
:::

**相關筆記**：[1-5-3 瀏覽器渲染流程與除錯](./1-5-3.md)

### Q3. 前端要顯示 10 萬筆資料，怎麼做？ <Badge type="tip" text="高頻" /> {#interview-8-3}

**考點**：大數據量渲染與複雜計算處理（Virtual Scroll、Web Worker、Wasm）。

::: details 解題思路
先問需求：真的要一次看到 10 萬筆嗎？能不能伺服器分頁或彙總？然後依瓶頸（DOM、計算、傳輸）分別處理。
:::

::: details 標準答案與過程
1. **先挑戰需求**：使用者不會一次看 10 萬筆。優先伺服器端分頁、篩選、彙總；匯出走後端產檔。
2. **DOM 瓶頸 → 虛擬捲動**：只渲染可視區域加緩衝區的列，捲動時回收節點。

```js
// 固定列高的虛擬捲動核心計算
const ROW = 32, BUFFER = 5
function visibleRange(scrollTop, viewportHeight, total) {
  const start = Math.max(0, Math.floor(scrollTop / ROW) - BUFFER)
  const end = Math.min(total, Math.ceil((scrollTop + viewportHeight) / ROW) + BUFFER)
  return { start, end, offsetY: start * ROW, totalHeight: total * ROW }
}
```

3. **計算瓶頸 → Web Worker**：排序、篩選、統計搬到 Worker，主執行緒只負責顯示；大陣列用 Transferable（ArrayBuffer）避免複製。
4. **響應式成本**：Vue 用 `shallowRef` / `markRaw`，React 避免把整包資料放進會頻繁更新的 state。
5. **傳輸**：分批載入（無限捲動）、壓縮（gzip／brotli）、只取需要的欄位。
6. **繪圖類**：大量點位改用 Canvas／WebGL 而非 SVG／DOM。
7. **WASM**：適合「大量運算、輸出小」的工作；若每幀都要把大量資料搬回 JS，搬運成本可能抵銷優勢。
:::

**相關筆記**：[1-8-2 WASM 不一定比 JS 快](./1-8-2.md#1-8-2-4)、[1-10-1 渲染技術定位](./1-10-1.md#1-10-1-1)、[模擬面試 5 Q12](./interview-5.md#interview-5-12)

### Q4. Bundle 太大怎麼辦？ <Badge type="tip" text="高頻" /> {#interview-8-4}

::: details 標準答案與過程
1. **分析**：`rollup-plugin-visualizer`、`webpack-bundle-analyzer` 找出最大的模組。
2. **Code Splitting**：路由懶載入、重型元件（圖表、編輯器）動態 `import()`。
3. **Tree Shaking**：使用 ESM 版本套件（`lodash-es`）、按需引入元件庫、確認 `sideEffects` 設定。
4. **替換肥大套件**：moment → dayjs；整包 lodash → 原生方法。
5. **共用與快取**：vendor chunk 拆分、檔名加 content hash，讓不常變的套件長期快取。
6. **現代建置**：只為現代瀏覽器輸出 ES2015+，避免不必要的 polyfill。
7. **CI 效能預算**：bundle 超過門檻就失敗。
:::

**相關筆記**：[1-9-2 webpack 前端知識點](./1-9-2.md)、[14-4 動態 import](./14-4.md)、[模擬面試 11 Q2 Tree Shaking](./interview-11.md#interview-11-2)

### Q5. 圖片怎麼優化？ <Badge type="tip" text="基礎" /> {#interview-8-5}

::: details 標準答案與過程
- **格式**：照片用 AVIF／WebP（`picture` 提供 fallback），圖示用 SVG。
- **尺寸**：`srcset` + `sizes` 讓瀏覽器挑合適解析度，不要用 CSS 縮小大圖。
- **載入**：首屏以外 `loading="lazy"`；LCP 主圖不要 lazy，改加 `fetchpriority="high"`。
- **版面穩定**：寫 `width` / `height` 或 `aspect-ratio`。
- **傳輸**：CDN、圖片服務即時轉檔、長期快取。
- **解碼**：`decoding="async"`。
:::

**相關筆記**：[1-6-2 效能最佳化（WebP、隨選載入）](./1-6-2.md)

### Q6. 瀏覽器快取策略怎麼設計？ <Badge type="tip" text="高頻" /> <Badge type="info" text="動畫" /> {#interview-8-6}

::: details 標準答案與過程
| 類型 | Header | 行為 |
| --- | --- | --- |
| 強快取 | `Cache-Control: max-age=31536000, immutable` | 期限內不發請求 |
| 協商快取 | `ETag` / `If-None-Match`、`Last-Modified` / `If-Modified-Since` | 問伺服器，未改變回 304 |
| 不快取 | `Cache-Control: no-store` | 每次都重新取（敏感資料） |
| 每次驗證 | `Cache-Control: no-cache` | 可以存，但用之前一定要驗證 |

SPA 部署的標準配置：
- `index.html`：`no-cache`（確保拿到最新的入口）。
- 帶 hash 的 JS/CSS/圖片：`max-age=31536000, immutable`（檔名變了就是新檔）。
- API：依資料性質，個人資料 `private, no-store`。

注意：部署新版時，舊版 `index.html` 引用的 chunk 若已刪除，使用者切頁會 404（ChunkLoadError）。解法：保留前一版資源一段時間，或捕捉錯誤後提示重新整理。
:::

<HttpCacheAnim />

**相關筆記**：[1-6-3 快取政策](./1-6-3.md)

### Q7. debounce 和 throttle 差在哪？各用在哪？ <Badge type="tip" text="高頻" /> <Badge type="info" text="動畫" /> {#interview-8-7}

::: details 標準答案與過程
- **debounce（防抖）**：停止觸發一段時間後才執行最後一次。適合搜尋輸入、視窗 resize 結束後重算、自動儲存。
- **throttle（節流）**：固定時間內最多執行一次。適合捲動事件、拖曳、滑鼠移動、按鈕防連點。

記法：debounce 是「等你講完再回」，throttle 是「每隔一秒回一次」。捲動判斷元素是否可見，現代做法改用 `IntersectionObserver`，不需要 throttle。

手寫實作見 [模擬面試 12 Q1、Q2](./interview-12.md#interview-12-1)。
:::

<DebounceThrottleAnim />

**相關筆記**：[1-3-10 面試四題（Closure）](./1-3-10.md#1-3-10-2)

### Q8. 怎麼讓 INP 變好？什麼是長任務？ <Badge type="warning" text="進階" /> {#interview-8-8}

::: details 標準答案與過程
超過 50 毫秒的主執行緒任務就是長任務（Long Task），期間使用者的點擊、輸入都要等。INP 量的是「互動 → 處理 → 畫面更新」的總延遲。

做法：

1. **拆分任務並讓出主執行緒**：

```js
async function processInChunks(items, handle) {
  for (let i = 0; i < items.length; i++) {
    handle(items[i])
    if (i % 200 === 0) {
      // 讓瀏覽器有機會處理輸入與繪製
      await (globalThis.scheduler?.yield?.() ?? new Promise(r => setTimeout(r, 0)))
    }
  }
}
```

2. **先回饋再處理**：點擊後先更新按鈕狀態（loading），重活放到下一幀。
3. **React** 用 `useTransition` 把篩選結果標記為非緊急；**Vue** 減少同步觸發的大範圍更新。
4. **搬到 Worker**：純計算不碰 DOM 的工作。
5. **減少第三方腳本**：廣告、追蹤碼常是長任務來源，延後或用 Partytown 移到 Worker。
:::

**相關筆記**：[1-3-6 巨任務和微任務](./1-3-6.md)

### Q9. SSR 一定比較快嗎？ <Badge type="warning" text="進階" /> {#interview-8-9}

::: details 標準答案與過程
不一定。SSR 讓 HTML 更早有內容（改善 FCP／LCP、SEO），但：

- 伺服器要先取資料再渲染，**TTFB 會變長**；後端 API 慢時，SSR 只是把等待搬到伺服器。
- 頁面要 hydrate 才能互動，JS 一樣要下載與執行；hydration 期間點擊沒反應會傷 INP。
- 個人化頁面難以 CDN 快取，伺服器負載上升。

改善方式：靜態部分 SSG／ISR、串流 SSR（先送外框、資料好了再補）、Server Components 減少 client JS、邊緣快取。選擇看頁面性質，不是一律 SSR。
:::

**相關筆記**：[模擬面試 6 Q6 CSR／SSR／SSG／ISR](./interview-6.md#interview-6-6)、[1-7-6 同構應用（效能最佳化）](./1-7-6.md)

### Q10. 前端怎麼做錯誤監控？ <Badge type="tip" text="基礎" /> {#interview-8-10}

::: details 標準答案與過程
要收集的錯誤：

1. **JS 執行錯誤**：`window.addEventListener('error')`。
2. **未處理的 Promise**：`unhandledrejection`。
3. **資源載入失敗**：`error` 事件在捕獲階段監聽（圖片、script 載入失敗不會冒泡）。
4. **框架錯誤**：Vue `app.config.errorHandler`、React Error Boundary。
5. **API 錯誤**：在 HTTP 攔截器統一回報狀態碼與 traceId。

實務：用 Sentry 之類的平台，上傳 source map 還原壓縮後的堆疊（但 source map 不要公開部署）；附上版本號、使用者操作路徑（breadcrumbs）、瀏覽器資訊；過濾雜訊並設告警門檻。跨網域 script 要加 `crossorigin` 才拿得到完整錯誤訊息。
:::

**相關筆記**：[1-6-1 效能監控和錯誤收集與回報](./1-6-1.md)

### Q11. Lighthouse 分數怎麼來的？怎麼證明改善不是誤差？ <Badge type="tip" text="高頻" /> {#interview-8-11}

::: details 標準答案與過程
**分數怎麼來**：Lighthouse 分 Performance、Accessibility、Best Practices、SEO 四類。Performance 是幾個指標加權（Lighthouse 10 起）：TBT 30%、LCP 25%、CLS 25%、FCP 10%、Speed Index 10%。

它是 **lab data**：用模擬的網路和 CPU 節流量一次。INP 要有真實互動才量得到，Lighthouse 用 TBT 代替。所以分數適合比較「同條件下的改前改後」，不適合拿絕對值跟別人比；真實使用者的體驗看 field data（見 [Q1](#interview-8-1)）。

**讓數字可信**：

1. **量 production build**：`npm run build && npm run preview`，不要量 dev server。
2. **同一台機器、同條件量基準**：改之前先用 `git stash` 或另開 worktree 跑原本的版本。
3. **多跑幾輪**：Lighthouse 單次的分數波動很大；用無痕視窗，避免擴充套件影響。
4. **驗證量測方法本身**：量的方式要跟真實使用一致（例如照真實的請求方式模擬），工具也可能有偏差（headless 沒有 vsync，見 [1-10-4](./1-10-4.md)）。
5. **講清楚範圍**：在什麼裝置、什麼螢幕更新率量的；沒量到的就不講，例如只量了資料庫耗時，就不要說頁面快了幾秒。

**要登入才能看的頁面**：在已登入的瀏覽器裡跑，或用腳本先登入；也可以做一個臨時的量測頁，只放要量的畫面，量完刪掉、不 commit。量測腳本不要帶帳密，也不要為了量測放鬆安全設定。
:::

**相關筆記**：[1-10-4 效能測試工具](./1-10-4.md)、[1-10-3 量測與驗收](./1-10-3.md#1-10-3-5)

### Q12. 一個畫面要打幾十支 API，怎麼優化？ <Badge type="warning" text="進階" /> {#interview-8-12}

::: details 解題思路
先用 Network 瀑布圖確認是前端發出的 N+1，再比較平行、快取、聚合 API 三種解法的代價。
:::

::: details 標準答案與過程
**現象**：總覽頁的每個項目各打一次 API（例如每支指標各拿一次歷史資料），一頁幾十個請求，後端每次各查一次資料庫，等於前端發出的 N+1。

| 解法 | 效果 | 不夠的地方 |
| --- | --- | --- |
| `Promise.all` 平行打 | 等待時間重疊 | 請求數、查詢次數都還在；每個請求都要過一次 token 驗證和中介層 |
| 只加快取 | 第二次之後變快 | 冷啟動時還是同時打出幾十個請求 |
| 為這個畫面做一支聚合 API | 請求數變 1，查詢可以合併成一次 | 多維護一支 API；快取鍵要設計好 |

**聚合 API 的做法**：一次查回每個項目「畫面需要的那一段」（例如最近 60 筆）、只回精簡欄位，加短時間快取；點進詳細頁才讀完整資料。這是針對畫面的聚合，跟 BFF 的想法一樣（見 [模擬面試 9 Q8](./interview-9.md#interview-9-8)）。

注意：

- 快取的 key 要包含語系、權限、資料日期，不然會拿到別人的或過期的資料。
- 單一實例、資料最快每天更新時，應用程式內的快取就夠，不一定要上 Redis。
- 報告改善時講清楚量的是什麼：資料庫耗時下降，不等於頁面載入時間下降。
:::

**相關筆記**：[1-6-5 應用程式傳輸最佳化](./1-6-5.md)、[模擬面試 8 Q2 排查頁面慢](#interview-8-2)
