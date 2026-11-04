# 模擬面試 4：TypeScript {#interview-4}

::: info 新增（2026-11）
對應職缺關鍵字：TypeScript「strong proficiency — generics, utility types, modeling complex domain logic」（台達電）、國泰 DDT 必要條件。
:::

系統化的觀念整理見 [1-25 TypeScript 與物件導向](./1-25.md)。

### Q1. `any`、`unknown`、`never` 差在哪？ <Badge type="tip" text="高頻" /> {#interview-4-1}

::: details 標準答案與過程
- `any`：關掉型別檢查，可以做任何事，會「污染」用到它的地方。
- `unknown`：任何值都能賦給它，但**使用前必須先縮小型別**。適合外部輸入（API 回應、`JSON.parse`、`catch (e)`）。
- `never`：不可能存在的值。出現在丟錯的函式回傳型別、窮舉檢查、條件型別過濾。

```ts
function parse(input: unknown) {
  if (typeof input === 'string') return input.toUpperCase() // 縮小後才能用
  throw new Error('not string')
}
```

原則：`明確型別 > unknown > any`；非用 `any` 不可時加註解說明原因。
:::

**相關筆記**：[1-2-8 TypeScript 真正要深挖的](./1-2-8.md#1-2-8-4)

### Q2. `type` 和 `interface` 怎麼選？ <Badge type="tip" text="基礎" /> {#interview-4-2}

::: details 標準答案與過程
| | interface | type |
| --- | --- | --- |
| 物件形狀 | 可以 | 可以 |
| Union、Tuple、Mapped、Conditional | 不行 | 可以 |
| 同名宣告合併（declaration merging） | 會合併 | 重複宣告會報錯 |
| 擴充 | `extends` | `&` 交集 |

選擇：要被外部擴充的公開 API（例如擴充 `Window`、套件的設定型別）用 `interface`；其餘團隊統一一種即可，需要 union 或運算時用 `type`。重點是團隊一致。
:::

### Q3. 泛型是什麼？寫一個安全取物件屬性的函式 <Badge type="tip" text="高頻" /> {#interview-4-3}

::: details 解題思路
泛型＝型別的參數。關鍵是 `K extends keyof T` 限制 key，回傳型別用索引存取 `T[K]`。
:::

::: details 標準答案與過程
```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { id: 1, name: 'Amy' }
getProp(user, 'name') // string
getProp(user, 'age')  // ❌ 編譯錯誤：'age' 不在 'id' | 'name'
```

再舉一個實務例子，API 回應的通用包裝：

```ts
interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

async function request<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url)
  return res.json() as Promise<ApiResponse<T>>
}

const { data } = await request<{ id: number; title: string }[]>('/api/posts')
```

`extends` 在泛型裡是**約束**：`<T extends { id: number }>` 表示 T 至少要有 `id`。
:::

### Q4. 手寫 `Partial`、`Pick`、`Omit`、`ReturnType` <Badge type="tip" text="高頻" /> {#interview-4-4}

::: details 標準答案與過程
```ts
type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }
type MyPick<T, K extends keyof T> = { [P in K]: T[P] }
type MyOmit<T, K extends keyof any> = MyPick<T, Exclude<keyof T, K>>
type MyExclude<T, U> = T extends U ? never : T           // 分配式條件型別
type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
```

講解重點：

- `[K in keyof T]` 是 **mapped type**，逐一走過 T 的 key。
- `T extends U ? X : Y` 在 T 是 union 時會**分配**到每個成員，所以 `Exclude` 能從 union 中刪掉成員。
- `infer` 在條件型別中「抓出」某個位置的型別。

實務：表單編輯用 `Partial<User>`、列表只顯示部分欄位用 `Pick`、建立資料時去掉 `id` 用 `Omit<User, 'id'>`。
:::

### Q5. 有哪些縮小型別（narrowing）的方式？怎麼做窮舉檢查？ <Badge type="tip" text="高頻" /> {#interview-4-5}

::: details 標準答案與過程
方式：`typeof`、`instanceof`、`in`、相等比較、**可辨識聯合（discriminated union）**、自訂 type guard（`x is T`）、assertion function（`asserts x is T`）。

```ts
type PaymentState =
  | { status: 'idle' }
  | { status: 'pending'; requestId: string }
  | { status: 'success'; txId: string }
  | { status: 'failed'; reason: string }

function render(s: PaymentState) {
  switch (s.status) {
    case 'idle': return '尚未付款'
    case 'pending': return `處理中 ${s.requestId}`
    case 'success': return `成功 ${s.txId}`
    case 'failed': return `失敗：${s.reason}`
    default: {
      const _exhaustive: never = s // 新增狀態卻忘了處理時，這行會編譯錯誤
      return _exhaustive
    }
  }
}

function isApiError(e: unknown): e is { code: number; message: string } {
  return typeof e === 'object' && e !== null && 'code' in e && 'message' in e
}
```

這種寫法讓「不合法的狀態無法表示」，例如不可能出現 `status: 'success'` 卻沒有 `txId`。
:::

**相關筆記**：[1-22-4 資料庫與資料設計（狀態要分開建模）](./1-22-4.md)

### Q6. `satisfies` 和 `as` 差在哪？ <Badge type="warning" text="進階" /> {#interview-4-6}

::: details 標準答案與過程
- `as` 是**斷言**：告訴編譯器「相信我」，型別不符也可能通過，會隱藏錯誤。
- `satisfies`（TS 4.9+）是**檢查**：確認值符合型別，但保留值本身更精確的推導型別。

```ts
type Route = { path: string; auth: boolean }

const routes = {
  home: { path: '/', auth: false },
  admin: { path: '/admin', auth: true },
} satisfies Record<string, Route>

routes.admin       // ✅ 知道有 admin 這個 key
routes.typo        // ❌ 編譯錯誤；若寫成 `: Record<string, Route>` 就不會報錯
```

原則：能用 narrowing 或 `satisfies` 就不要用 `as`；`as` 不用 `<T>value` 寫法（和 JSX 衝突）。
:::

### Q7. `enum`、union literal、`as const` 怎麼選？ <Badge type="tip" text="基礎" /> {#interview-4-7}

::: details 標準答案與過程
- `enum` 會產生執行期程式碼；數字 enum 允許任何數字賦值（型別不夠嚴）；`const enum` 在某些建置工具（isolatedModules）有限制。
- **Union literal**：`type Status = 'draft' | 'published'`，零執行期成本，最常用。
- **`as const` 物件**：同時要執行期的值（下拉選單選項）和型別時：

```ts
export const ORDER_STATUS = {
  Draft: 'draft',
  Paid: 'paid',
  Refunded: 'refunded',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
// 'draft' | 'paid' | 'refunded'
```
:::

### Q8. 怎麼用型別建模複雜的業務規則？ <Badge type="warning" text="進階" /> {#interview-4-8}

**考點**：職缺明列「modeling complex domain logic」。

::: details 標準答案與過程
三個常用技巧：

1. **可辨識聯合**表達狀態機（見 Q5）。
2. **Branded type** 防止同為 string／number 的不同概念混用：

```ts
type Brand<T, B> = T & { readonly __brand: B }
type PolicyId = Brand<string, 'PolicyId'>
type CustomerId = Brand<string, 'CustomerId'>
type Cents = Brand<number, 'Cents'>

const toPolicyId = (s: string) => s as PolicyId // 只在驗證後的邊界轉換

function getPolicy(id: PolicyId) { /* ... */ }
getPolicy(customerId) // ❌ 編譯錯誤：不會把客戶 ID 傳錯位置
```

3. **在邊界做執行期驗證**：TS 型別在執行期消失，API 回應要用 Zod 之類的 schema 驗證後再進系統：

```ts
import { z } from 'zod'
const Policy = z.object({ id: z.string(), premium: z.number().int().nonnegative() })
type Policy = z.infer<typeof Policy> // 型別與驗證規則來自同一份定義
const policy = Policy.parse(await res.json())
```
:::

**相關筆記**：[1-6-11 去框架化的前端架構（API 資料只做一次 mapping）](./1-6-11.md#1-6-11-1)

### Q9. tsconfig 你會開哪些嚴格選項？ <Badge type="tip" text="基礎" /> {#interview-4-9}

::: details 標準答案與過程
- `strict: true`：包含 `strictNullChecks`、`noImplicitAny`、`strictFunctionTypes` 等。
- `noUncheckedIndexedAccess`：`arr[i]`、`record[key]` 的型別會加上 `| undefined`，避免假設一定存在。
- `exactOptionalPropertyTypes`：區分「沒有這個屬性」和「值是 undefined」。
- `noImplicitOverride`、`noFallthroughCasesInSwitch`。
- 建置相關：`isolatedModules`（配合 esbuild／SWC 單檔轉譯）、`verbatimModuleSyntax`（型別匯入要寫 `import type`）。

舊專案導入：先開 `strict`，用 `// @ts-expect-error` 標記既有錯誤並逐步清除，CI 擋住新增的錯誤。
:::
