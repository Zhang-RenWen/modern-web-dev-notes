# 模擬面試 5：Vue {#interview-5}

::: info 新增（2026-11）
對應職缺：凱基人壽（Vue）、台達電 VueJS（Vuex、Vue Router、共用模組）、國泰 DDT、台達全端（Vue 3 或 React）。
:::

### Q1. Vue 2 和 Vue 3 的響應式原理差在哪？ <Badge type="tip" text="高頻" /> {#interview-5-1}

::: details 解題思路
分「怎麼攔截」和「怎麼追蹤依賴」兩層。再講 Vue 2 的限制如何被 Proxy 解決。
:::

::: details 標準答案與過程
**共同骨架**：讀取時收集依賴（track），寫入時通知依賴更新（trigger）。依賴就是用到這個資料的 effect（元件渲染函式、computed、watch）。

| | Vue 2 | Vue 3 |
| --- | --- | --- |
| 攔截方式 | `Object.defineProperty` 改寫每個屬性的 getter/setter | `Proxy` 代理整個物件 |
| 初始化 | 遞迴走訪所有屬性，資料大時慢 | 惰性：讀到巢狀物件才代理 |
| 新增／刪除屬性 | 偵測不到，要 `Vue.set` / `Vue.delete` | 可偵測 |
| 陣列 | 改寫 7 個變更方法；`arr[0] = x` 偵測不到 | 索引賦值、length 都能偵測 |
| Map / Set | 不支援 | 支援 |

```js
// Vue 3 響應式的極簡版
const targetMap = new WeakMap()
let activeEffect = null

function track(target, key) {
  if (!activeEffect) return
  let deps = targetMap.get(target)
  if (!deps) targetMap.set(target, (deps = new Map()))
  let dep = deps.get(key)
  if (!dep) deps.set(key, (dep = new Set()))
  dep.add(activeEffect)
}

function trigger(target, key) {
  targetMap.get(target)?.get(key)?.forEach(effect => effect())
}

function reactive(obj) {
  return new Proxy(obj, {
    get(t, k, r) { track(t, k); return Reflect.get(t, k, r) },
    set(t, k, v, r) { const ok = Reflect.set(t, k, v, r); trigger(t, k); return ok },
  })
}

function effect(fn) { activeEffect = fn; fn(); activeEffect = null }
```
:::

**相關筆記**：[1-6-1 響應式架構設計](./1-6-1.md)、[6-1 代理器初探](./6-1.md)、[5-2 弱映射](./5-2.md)

### Q2. `ref` 和 `reactive` 怎麼選？ <Badge type="tip" text="高頻" /> {#interview-5-2}

::: details 標準答案與過程
- `reactive`：只接受物件，回傳 Proxy。**解構或整個替換會失去響應性**。
- `ref`：任何值都可以，用 `.value` 存取（模板中自動解包）；物件會在內部轉成 reactive。

```js
const state = reactive({ count: 0 })
let { count } = state  // ❌ count 只是數字，失去響應
state = reactive({})   // ❌ 原本的引用斷掉

const list = ref([])
list.value = await fetchList() // ✅ 整個替換沒問題
```

Vue 官方建議以 `ref` 為主；要解構 reactive 用 `toRefs`。大型且不需深層追蹤的資料（圖表資料、大型列表）用 `shallowRef` 減少代理成本。
:::

### Q3. `computed`、`watch`、`watchEffect` 差在哪？ <Badge type="tip" text="高頻" /> {#interview-5-3}

::: details 標準答案與過程
| | computed | watch | watchEffect |
| --- | --- | --- | --- |
| 目的 | 衍生出新值 | 資料變化時執行副作用 | 自動追蹤依賴的副作用 |
| 快取 | 有，依賴不變不重算 | 無 | 無 |
| 依賴 | 自動追蹤 | 明確指定來源 | 自動追蹤 |
| 拿得到舊值 | 不需要 | 可以 | 不行 |
| 首次執行 | 被讀取時 | 預設不執行（`immediate: true` 才會） | 立即執行 |

原則：能用 `computed` 表達的就不要用 `watch` 去同步另一個 ref（那會變成兩份狀態）。`watch` 用在打 API、寫 localStorage、操作 DOM 這類副作用；搜尋框打 API 要搭配 debounce 和取消舊請求（`onCleanup` / `onWatcherCleanup`）。
:::

**相關筆記**：[1-6-11 Source Data 與 Derived Data 分離](./1-6-11.md#1-6-11-1)

### Q4. 父子元件的生命週期執行順序？ <Badge type="tip" text="基礎" /> {#interview-5-4}

::: details 標準答案與過程
Composition API 的 hooks：`setup` → `onBeforeMount` → `onMounted` → `onBeforeUpdate` → `onUpdated` → `onBeforeUnmount` → `onUnmounted`（另有 `onActivated` / `onDeactivated` 給 KeepAlive）。

掛載順序：**父 setup → 父 beforeMount → 子 setup → 子 beforeMount → 子 mounted → 父 mounted**。子元件先完成掛載，父元件才算 mounted。

卸載順序：父 beforeUnmount → 子 beforeUnmount → 子 unmounted → 父 unmounted。

實務：需要 DOM 的操作放 `onMounted`；計時器、事件監聽、第三方實例在 `onUnmounted` 清掉；資料請求可在 `setup` 直接發，不必等 mounted。
:::

### Q5. 元件之間有哪些通訊方式？ <Badge type="tip" text="高頻" /> {#interview-5-5}

::: details 標準答案與過程
| 關係 | 方式 |
| --- | --- |
| 父 → 子 | `props` |
| 子 → 父 | `emit`；Vue 3.4+ 的 `defineModel` 做雙向綁定 |
| 父取子方法 | `ref` + 子元件 `defineExpose` |
| 跨多層 | `provide` / `inject`（適合主題、表單上下文、元件庫內部） |
| 不相關元件 | Pinia store |
| 跨分頁 | `BroadcastChannel`、`storage` 事件 |

避免：Vue 3 已移除 `$on`，不要再用全域 Event Bus（難追蹤資料流）；不要在子元件直接改 props。
:::

**相關筆記**：[1-6-2 元件通訊和封裝](./1-6-2.md)

### Q6. `v-if` 與 `v-show` 差在哪？`v-for` 為什麼要 `key`？ <Badge type="tip" text="基礎" /> {#interview-5-6}

::: details 標準答案與過程
- `v-if`：條件為假時不渲染，切換時會建立／銷毀元件（觸發生命週期）。初始成本低、切換成本高。
- `v-show`：一定渲染，只切換 `display: none`。初始成本高、切換成本低。頻繁切換用 `v-show`。

`key` 讓 diff 演算法辨識「同一個節點」。沒有 key 或用 index 當 key 時，列表插入、排序會讓 Vue 就地復用錯誤的節點，導致輸入框內容、元件狀態錯位。key 要用穩定且唯一的業務 ID。

`v-if` 與 `v-for` 同一元素：Vue 3 中 `v-if` 優先級較高（Vue 2 相反），所以 `v-if` 拿不到迴圈變數。改法：先用 computed 過濾，或把 `v-if` 移到內層／外層 `template`。
:::

**相關筆記**：[1-6-2 不是每次加上 Key 都能效能最佳化](./1-6-2.md)、[1-4-3 Vue 3 動靜結合的 DOM diff](./1-4-3.md)

### Q7. `nextTick` 是什麼？原理是？ <Badge type="tip" text="高頻" /> {#interview-5-7}

::: details 標準答案與過程
Vue 更新 DOM 是**非同步批次**的：同一個 tick 內多次改資料，只會排一次渲染任務。所以改完資料立刻讀 DOM，拿到的是舊的。`nextTick` 讓你在這次 DOM 更新完成後執行程式。

原理：Vue 把更新工作放進佇列，用 `Promise.resolve().then()`（microtask）排程 flush；`nextTick` 回傳的 Promise 排在同一個 microtask 之後。

```js
show.value = true
await nextTick()
inputRef.value.focus() // DOM 已經出現
```
:::

**相關筆記**：[1-2-5 巨任務和微任務](./1-2-5.md)、[模擬面試 3 Q7 Event Loop](./interview-3.md#interview-3-7)

### Q8. Vuex 和 Pinia 差在哪？什麼資料該放 store？ <Badge type="tip" text="高頻" /> {#interview-5-8}

::: details 標準答案與過程
| | Vuex | Pinia |
| --- | --- | --- |
| 結構 | state、getters、mutations、actions、modules | state、getters、actions（沒有 mutations） |
| TypeScript | 型別推導差 | 原生支援 |
| 模組化 | 巢狀 modules + namespace | 每個 store 獨立，按需引入 |
| 狀態 | Vue 官方已改推薦 Pinia | 官方推薦 |

什麼該放 store：跨頁共享、需要持久的**客戶端狀態**（登入使用者、權限、偏好設定）。

不該放：
- **伺服器資料的快取**：用 TanStack Query（Vue Query）處理快取、重新驗證、重試。
- 只有單一元件用的 UI 狀態（Modal 開關）。
- 可以從其他狀態算出來的值（用 getter／computed）。
- URL 能表達的狀態（篩選、分頁），放 query string 才能分享與重新整理後保留。
:::

**相關筆記**：[1-6-11 狀態先分類，再選工具](./1-6-11.md#1-6-11-3)、[1-6-3 資料狀態管理](./1-6-3.md)

### Q9. 怎麼用 Vue Router 做權限控管與動態路由？ <Badge type="tip" text="高頻" /> {#interview-5-9}

::: details 解題思路
權限分兩層：**能不能看到入口**（選單）與**能不能進入**（路由守衛）。最後強調真正的權限在後端。
:::

::: details 標準答案與過程
```ts
// 靜態路由：登入頁、404；動態路由：登入後依權限註冊
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }

  if (!auth.routesLoaded) {
    const menus = await auth.fetchMenus()      // 後端只回 key，不回檔案路徑
    menus.forEach(m => router.addRoute('Layout', {
      path: m.path, name: m.key, component: resolveView(m.key), meta: { perm: m.perm },
    }))
    auth.routesLoaded = true
    return to.fullPath                          // 重新導向，讓新路由生效
  }

  if (to.meta.perm && !auth.can(to.meta.perm)) return { name: 'forbidden' }
  return true
})
```

重點：
1. Vue Router 4 是 `addRoute` / `removeRoute`，登出時移除動態路由並重置 store。
2. `resolveView` 用 `import.meta.glob` 白名單對應，避免後端直接給檔案路徑（bundler 無法分析）。
3. 按鈕層級權限用自訂指令（`v-permission`）或 `can()` 函式。
4. **前端權限只是 UX**，API 必須在後端再驗一次。
:::

**相關筆記**：[1-6-12 Vue Router 4 動態路由 + 動態 import](./1-6-12.md#1-6-12-8)、[1-19-5 權限模型](./1-19-5.md#1-19-5-2)

### Q10. `KeepAlive` 是什麼？有什麼坑？ <Badge type="tip" text="基礎" /> {#interview-5-10}

::: details 標準答案與過程
`KeepAlive` 快取被切走的元件實例，切回來時不重新建立，保留表單輸入、捲動位置等狀態。可用 `include` / `exclude` / `max`（LRU 淘汰）控制。

被快取的元件切換時觸發 `onActivated` / `onDeactivated`，**不會**觸發 `onUnmounted`。

坑：
1. 計時器、輪詢放在 `onMounted` 開、`onUnmounted` 關，被快取時會一直跑 → 改在 `onDeactivated` 暫停。
2. 資料不會自動更新 → 在 `onActivated` 判斷是否要重新取資料。
3. `include` 比對的是元件 `name`，`<script setup>` 元件 3.2.34 起會依檔名推導，否則要用 `defineOptions({ name })`。
4. 不設 `max` 可能累積大量實例造成記憶體上升。
:::

### Q11. Composition API 比 Options API 好在哪？怎麼設計 Composable？ <Badge type="tip" text="高頻" /> {#interview-5-11}

::: details 標準答案與過程
Options API 依「選項類型」組織（data、methods、computed），一個功能的程式碼散在各處；Composition API 依「功能」組織，能抽成 composable 重用，型別推導也比較好。Mixin 的問題（命名衝突、來源不明）也一併解決。

Composable 設計原則：

1. 命名 `useXxx`，回傳 ref／computed 與方法。
2. 接受 ref 或 getter 當參數（用 `toValue()` 統一），讓呼叫端傳入響應式資料。
3. 自己清理副作用（`onScopeDispose`）。
4. 不在 composable 裡直接依賴 router、特定 store，必要時當參數傳入，方便測試。

```ts
export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = shallowRef<T | null>(null)
  const error = shallowRef<unknown>(null)
  const loading = ref(false)
  let controller: AbortController | null = null

  watchEffect(async () => {
    controller?.abort()                       // 取消上一個請求，避免舊回應覆蓋新回應
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      const res = await fetch(toValue(url), { signal: controller.signal })
      data.value = await res.json()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') error.value = e
    } finally {
      loading.value = false
    }
  })

  onScopeDispose(() => controller?.abort())
  return { data, error, loading }
}
```
:::

### Q12. 大量資料的 Vue 頁面怎麼優化？ <Badge type="warning" text="進階" /> {#interview-5-12}

::: details 標準答案與過程
先量測（Vue DevTools Performance、Chrome Performance），確認瓶頸在渲染、響應式代理還是計算。

| 瓶頸 | 手段 |
| --- | --- |
| DOM 太多 | 虛擬捲動（vue-virtual-scroller、TanStack Virtual）、分頁 |
| 響應式代理成本 | 唯讀大資料用 `shallowRef` / `markRaw`；`Object.freeze` |
| 不必要的重新渲染 | 拆小元件縮小更新範圍；`v-memo`；`v-once` 用於靜態內容 |
| 重計算 | `computed` 快取；搬到 Web Worker |
| 首次載入 | 路由懶載入 `() => import()`、`defineAsyncComponent` |
| 輸入頻繁觸發 | debounce／throttle |

Vue 3 編譯器本身有靜態提升與 Patch Flags，只 diff 動態節點，所以模板寫法盡量讓靜態部分保持靜態。
:::

**相關筆記**：[1-4-3 Vue 3 動靜結合的 DOM diff](./1-4-3.md)、[模擬面試 8 效能優化](./interview-8.md)
