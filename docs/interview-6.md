# 模擬面試 6：React 與 Next.js {#interview-6}

::: info 新增（2026-11）
對應職缺：台達電前端軟體開發（Next.js App Router + Pages Router、SSR／ISR、Core Web Vitals、i18n）、國泰（React + Angular）、台達全端。Next.js 改版頻繁，回答時說清楚你用的版本。
:::

### Q1. Hooks 為什麼不能放在條件或迴圈裡？ <Badge type="tip" text="高頻" /> {#interview-6-1}

::: details 解題思路
從實作講：React 用「呼叫順序」對應每個 hook 的狀態，而不是名稱。
:::

::: details 標準答案與過程
React 在每個元件的 Fiber 上，用一條依**呼叫順序**排列的鏈結串列保存 hooks 的狀態。每次渲染都依序讀取：第 1 個 `useState` 對第 1 格、第 2 個對第 2 格。

如果把 hook 放在 `if` 裡，某次渲染少呼叫一個，後面全部錯位，狀態就對錯人。所以規則是：只在元件或自訂 hook 的**頂層**呼叫，不放在條件、迴圈、巢狀函式裡。ESLint 的 `react-hooks/rules-of-hooks` 會擋。

React 19 的 `use()` 是例外，可以在條件中呼叫。
:::

**相關筆記**：[1-6-4 顛覆性的 React hook](./1-6-4.md)

### Q2. `useEffect` 的依賴陣列與 cleanup 怎麼運作？為什麼開發時會執行兩次？ <Badge type="tip" text="高頻" /> {#interview-6-2}

::: details 標準答案與過程
- 不給依賴：每次渲染後都執行。
- `[]`：只在掛載後執行一次，卸載時跑 cleanup。
- `[a, b]`：a 或 b 改變（`Object.is` 比較）時，先跑上一次的 cleanup，再跑新的 effect。

```jsx
useEffect(() => {
  const controller = new AbortController()
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => { if (e.name !== 'AbortError') setError(e) })
  return () => controller.abort() // id 改變或卸載時取消，避免舊回應覆蓋新資料
}, [id])
```

開發模式的 `StrictMode` 會**故意掛載 → 卸載 → 再掛載**一次，用來檢查 effect 是否正確清理。正式環境只會執行一次。看到「打了兩次 API」應該補 cleanup，而不是拿掉 StrictMode。

常見誤用：用 effect 同步衍生狀態（`useEffect(() => setFullName(first + last))`），應該直接在渲染時計算。資料抓取在正式專案建議交給 TanStack Query／SWR 或框架的資料層。
:::

**相關筆記**：[1-2-8 React 現代主線](./1-2-8.md#1-2-8-5)

### Q3. 元件什麼時候會重新渲染？`memo`、`useMemo`、`useCallback` 何時用？ <Badge type="tip" text="高頻" /> {#interview-6-3}

::: details 標準答案與過程
重新渲染的原因：自己的 state 改變、父元件重新渲染（不論 props 有沒有變）、用到的 Context 值改變。

| 工具 | 作用 | 何時用 |
| --- | --- | --- |
| `React.memo` | props 淺比較相同就跳過渲染 | 渲染成本高、且父元件常重新渲染的子元件 |
| `useMemo` | 快取計算結果 | 計算昂貴；或要傳給 memo 子元件的物件／陣列 |
| `useCallback` | 快取函式參考 | 傳給 memo 子元件、或當作其他 hook 的依賴 |

原則：先用 React DevTools Profiler 確認真的慢，再加；到處包反而增加比較成本與閱讀負擔。結構上的優化通常更有效：把會變的 state 往下移到用它的元件、把不變的部分當 `children` 傳進來。

React Compiler（2025 年 10 月釋出 1.0）可以自動做記憶化，啟用後大多數手動 `useMemo`/`useCallback` 可省略。
:::

**相關筆記**：[1-4-3 架構與效能：React](./1-4-3.md)、[1-6-2 單向數據流架構 React 解析](./1-6-2.md)

### Q4. 受控元件和非受控元件差在哪？ <Badge type="tip" text="基礎" /> {#interview-6-4}

::: details 標準答案與過程
- **受控**：表單值由 React state 決定（`value` + `onChange`），每次輸入都觸發渲染。容易做即時驗證、格式化、連動。
- **非受控**：值存在 DOM，用 `ref` 或 `FormData` 在送出時讀取（`defaultValue`）。效能好、程式碼少。

大型表單常用 React Hook Form：預設非受控以減少渲染，搭配 Zod 驗證。檔案上傳 `input type="file"` 一定是非受控。
:::

### Q5. React 的狀態管理怎麼選？ <Badge type="tip" text="高頻" /> {#interview-6-5}

::: details 標準答案與過程
先分類，再選工具：

| 狀態 | 工具 |
| --- | --- |
| 伺服器資料（快取、重新驗證） | TanStack Query、SWR、RTK Query |
| 元件內部 UI 狀態 | `useState`、`useReducer` |
| 低頻全域設定（主題、語系、登入者） | Context |
| 高頻更新的全域客戶端狀態 | Zustand、Jotai、Redux Toolkit |
| 表單 | React Hook Form |
| 篩選、分頁 | URL search params |

Context 的坑：value 改變時所有消費者都重新渲染，不適合放高頻變動的資料；可拆成多個 Context，或改用 Zustand 的 selector 訂閱。
:::

**相關筆記**：[1-6-3 React：資料狀態管理](./1-6-3.md)、[1-6-11 狀態先分類，再選工具](./1-6-11.md#1-6-11-3)

### Q6. CSR、SSR、SSG、ISR 差在哪？怎麼選？ <Badge type="tip" text="高頻" /> {#interview-6-6}

::: details 標準答案與過程
| 模式 | HTML 何時產生 | 優點 | 缺點 | 適合 |
| --- | --- | --- | --- | --- |
| CSR | 瀏覽器執行 JS 後 | 伺服器簡單、互動流暢 | 首屏慢、SEO 差 | 登入後的後台 |
| SSR | 每次請求時在伺服器 | 首屏快、SEO 好、資料即時 | 伺服器成本、TTFB 增加 | 個人化且要 SEO 的頁面 |
| SSG | 建置時 | 最快、可放 CDN | 資料更新要重新建置 | 文件、行銷頁 |
| ISR | 建置時產生，過期後背景重新產生 | 兼具 SSG 速度與資料更新 | 會短暫看到舊資料 | 商品頁、新聞、企業官網 |

選擇依據：是否需要 SEO、資料多久變一次、是否個人化、流量與成本。企業官網多語系內容通常 SSG／ISR；登入後的系統用 CSR 或 SSR + 快取。

注意：SSR 的個人化頁面不能被 CDN 快取，否則會把 A 使用者的資料給 B。
:::

**相關筆記**：[1-6-5 同構應用](./1-6-5.md)、[1-6-12 SSR（Hydration）的登入](./1-6-12.md#1-6-12-7)

### Q7. Next.js App Router 和 Pages Router 差在哪？ <Badge type="tip" text="高頻" /> {#interview-6-7}

::: details 標準答案與過程
| | Pages Router（`pages/`） | App Router（`app/`） |
| --- | --- | --- |
| 元件預設 | Client Component | **Server Component** |
| 資料取得 | `getServerSideProps`、`getStaticProps`、`getStaticPaths` | 元件內直接 `async` / `await fetch`；`generateStaticParams` |
| 版面 | `_app`、`_document` | 巢狀 `layout.tsx`，切頁時保留狀態 |
| 載入與錯誤 | 自己處理 | `loading.tsx`、`error.tsx`、`not-found.tsx` |
| 串流 | 有限 | Suspense 串流 |
| API | `pages/api/*` | `route.ts`（Route Handlers）、Server Actions |
| Metadata | `next/head` | `metadata` / `generateMetadata` |

兩者可以並存，方便漸進遷移。快取行為在 Next.js 各版本變動很大（例如 15 版起 `fetch` 預設不快取），面試時要說明以哪個版本為準。
:::

### Q8. Server Component 和 Client Component 怎麼分？ <Badge type="tip" text="高頻" /> {#interview-6-8}

::: details 標準答案與過程
- **Server Component**：只在伺服器執行，程式碼不送到瀏覽器。可直接存取資料庫、密鑰。不能用 state、effect、瀏覽器 API、事件處理器。
- **Client Component**：檔案頂端寫 `'use client'`，會打包送到瀏覽器並 hydrate。

切分原則：**預設 Server，只把需要互動的「葉子」做成 Client**。`'use client'` 是邊界，它匯入的所有模組都會進 client bundle，所以邊界放越深越好。

```tsx
// app/products/[id]/page.tsx（Server Component）
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)          // 伺服器直接取資料
  return (
    <>
      <h1>{product.name}</h1>
      <AddToCartButton productId={id} />       {/* 只有按鈕是 Client */}
    </>
  )
}
```

傳給 Client Component 的 props 必須可序列化（不能傳函式，Server Actions 例外）。
:::

### Q9. Hydration mismatch 是什麼？怎麼解決？ <Badge type="tip" text="高頻" /> {#interview-6-9}

::: details 標準答案與過程
Hydration 是瀏覽器拿到伺服器產生的 HTML 後，React 把事件與狀態接上去。如果客戶端第一次渲染的結果和伺服器 HTML 不同，就會出現 mismatch 警告，React 可能丟掉伺服器 HTML 重新渲染。

常見原因：

1. 渲染時用了 `Date.now()`、`Math.random()`、時區不同的日期格式化。
2. 讀 `window`、`localStorage`（伺服器沒有）。
3. 不合法的 HTML 巢狀（`p` 裡放 `div`），瀏覽器會自動修正 DOM。
4. 瀏覽器擴充套件修改了 DOM。

解法：

```tsx
'use client'
function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => setText(new Date(iso).toLocaleString()), [iso]) // 只在客戶端計算
  return <time dateTime={iso}>{text ?? iso}</time>
}
```

或日期在伺服器以固定時區格式化；必要時 `next/dynamic` 搭配 `ssr: false`；確定無害的差異才用 `suppressHydrationWarning`。
:::

**相關筆記**：[1-6-5 同構應用（注水和脫水）](./1-6-5.md)

### Q10. Next.js 怎麼做 i18n 與多區域部署？ <Badge type="warning" text="進階" /> {#interview-6-10}

::: details 標準答案與過程
1. **路由**：App Router 用 `app/[locale]/...` 動態區段；Middleware 依 cookie、`Accept-Language` 導向預設語系。
2. **字典**：依語系懶載入 JSON；用 next-intl 之類的套件處理 ICU 格式（複數、性別、插值）。
3. **格式化**：日期、數字、貨幣用 `Intl`，不要自己拼字串；時區明確指定。
4. **SEO**：`<html lang>`、`hreflang` 替代連結、各語系獨立 URL（不要只靠 cookie 切換）。
5. **靜態化**：`generateStaticParams` 產生各語系頁面，搭配 ISR。
6. **版面**：文字長度差異（德文很長）、RTL 語系用 CSS 邏輯屬性（`margin-inline-start`）。
7. **流程**：翻譯 key 的命名規範、缺字檢查放 CI、與 CMS 或翻譯平台串接。
:::

**相關筆記**：[模擬面試 11 Q12 i18n 實作](./interview-11.md#interview-11-12)

### Q11. React 18／19 新增了哪些重要能力？ <Badge type="tip" text="基礎" /> {#interview-6-11}

::: details 標準答案與過程
**React 18**：
- 並行渲染（Concurrent Rendering）與自動批次更新（Promise、setTimeout 內也會批次）。
- `useTransition` / `startTransition`：把非緊急更新標記為可中斷，輸入不卡。
- `useDeferredValue`：延遲顯示昂貴的衍生結果。
- Suspense 支援 SSR 串流。

**React 19**：
- **Actions**：`useActionState`、`useFormStatus`、`<form action={fn}>` 處理送出、pending、錯誤。
- `useOptimistic`：樂觀更新。
- `use()`：在渲染中讀取 Promise 或 Context。
- `ref` 可以直接當 prop 傳，不用 `forwardRef`。
- 元件內可直接寫 `<title>`、`<meta>`。
:::

**相關筆記**：[1-6-4 React：新一代特性](./1-6-4.md)

### Q12. React 和 Vue 的核心差異？ <Badge type="tip" text="高頻" /> {#interview-6-12}

::: details 標準答案與過程
| | React | Vue |
| --- | --- | --- |
| 更新觸發 | 呼叫 setState，元件函式重新執行 | 響應式系統追蹤依賴，精準通知 |
| 預設更新範圍 | 元件及其子樹（需 memo 優化） | 依賴到的元件 |
| 模板 | JSX（就是 JavaScript） | 模板語法，可編譯期優化（也支援 JSX） |
| 狀態 | 不可變更新 | 可直接修改（Proxy 攔截） |
| 生態 | 官方只管核心，路由、狀態由社群 | 官方維護 Router、Pinia |

兩者都是「資料驅動視圖 + 虛擬 DOM + 元件化」。選型重點不在誰比較好，而是團隊經驗、生態需求（React Native、Next.js）、招募市場。
:::

**相關筆記**：[1-6-6 前端架構類別庫之間的比較](./1-6-6.md)、[1-6-1 響應式架構設計](./1-6-1.md)
