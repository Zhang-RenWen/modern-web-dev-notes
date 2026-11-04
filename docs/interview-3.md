# 模擬面試 3：JavaScript 核心 {#interview-3}

::: info 新增（2026-11）
所有職缺都要求熟悉 JavaScript（ES6+），這些是一面最常出現的觀念題。手寫實作題另見 [模擬面試 12](./interview-12.md)。
:::

### Q1. JavaScript 有哪些型別？怎麼準確判斷？ <Badge type="tip" text="基礎" /> {#interview-3-1}

::: details 標準答案與過程
- **原始型別（7 種）**：`string`、`number`、`bigint`、`boolean`、`undefined`、`symbol`、`null`。
- **物件型別**：`Object`（含 Array、Function、Date、Map…）。

判斷方式與坑：

| 方法 | 適合 | 坑 |
| --- | --- | --- |
| `typeof` | 原始型別、function | `typeof null === 'object'`（歷史 bug）；陣列也是 `'object'` |
| `instanceof` | 判斷原型鏈 | 跨 iframe／realm 失效；原始型別不能用 |
| `Array.isArray()` | 陣列 | — |
| `Object.prototype.toString.call(x)` | 最通用 | 可被 `Symbol.toStringTag` 改寫 |

```js
const typeOf = x => Object.prototype.toString.call(x).slice(8, -1).toLowerCase()
typeOf(null)        // 'null'
typeOf([])          // 'array'
typeOf(new Date())  // 'date'
```
:::

**相關筆記**：[1-2-4 高頻考點及基礎題庫](./1-2-4.md)

### Q2. `==` 和 `===` 差在哪？ <Badge type="tip" text="基礎" /> {#interview-3-2}

::: details 標準答案與過程
- `===` 不做型別轉換，型別不同直接 `false`。
- `==` 會先做隱式轉換再比較，規則複雜：`'' == 0` 為 true、`null == undefined` 為 true、`null == 0` 為 false、`[] == ![]` 為 true。

例外：`NaN === NaN` 為 false，判斷要用 `Number.isNaN()`；`+0 === -0` 為 true，要區分用 `Object.is()`。

實務：一律用 `===`，唯一常見例外是 `x == null` 同時判斷 null 與 undefined（更現代的寫法是 `x ?? 預設值`）。
:::

**相關筆記**：[3-3 物件的內建功能強化（Object.is）](./3-3.md)、[14-7 Nullish coalescing](./14-7.md)

### Q3. `var`、`let`、`const` 差在哪？什麼是 TDZ？ <Badge type="tip" text="基礎" /> {#interview-3-3}

::: details 標準答案與過程
| | var | let | const |
| --- | --- | --- | --- |
| 作用域 | 函式 | 區塊 | 區塊 |
| 提升（hoisting） | 提升並初始化為 `undefined` | 提升但未初始化 | 同 let |
| 重複宣告 | 可 | 不可 | 不可 |
| 重新賦值 | 可 | 可 | 不可（物件內容仍可改） |
| 掛到 `window` | 全域時會 | 不會 | 不會 |

**TDZ（暫時性死區）**：從區塊開始到 `let/const` 宣告那一行之間，存取該變數會丟 `ReferenceError`。

```js
console.log(a) // undefined
var a = 1

console.log(b) // ReferenceError: Cannot access 'b' before initialization
let b = 2
```

實務：預設 `const`，需要重新賦值才 `let`，不用 `var`。
:::

**相關筆記**：[2-6 let 和 const 敘述](./2-6.md)、[9-1 變數宣告](./9-1.md)

### Q4. 什麼是閉包？下面程式輸出什麼？ <Badge type="tip" text="高頻" /> {#interview-3-4}

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
```

::: details 解題思路
1. `var` 是函式作用域，三個 callback 共用同一個 `i`。
2. setTimeout 的 callback 在迴圈跑完後才執行，那時 `i` 已是 3。
3. 再說明修法與閉包的實務用途。
:::

::: details 標準答案與過程
輸出 `3 3 3`。

**閉包**：函式記住並能存取它被**建立時**的外層作用域，即使外層函式已經執行完。

修法：

```js
// 1. let：每次迭代都是新的區塊作用域
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0) // 0 1 2

// 2. IIFE 建立閉包保存當下的值（舊寫法）
for (var i = 0; i < 3; i++) ((j) => setTimeout(() => console.log(j), 0))(i)
```

實務用途：私有狀態（模組模式）、debounce／throttle 保存 timer、Hooks／Composable 保存狀態、函式工廠。

風險：閉包會讓外層變數持續被引用，若長期掛在全域或事件上，可能造成記憶體洩漏。
:::

**相關筆記**：[1-2-2 閉包](./1-2-2.md)、[1-2-8 JS／TS 面試核心](./1-2-8.md#1-2-8-2)

### Q5. `this` 怎麼決定？ <Badge type="tip" text="高頻" /> {#interview-3-5}

::: details 解題思路
`this` 在**呼叫時**決定（箭頭函式例外）。依優先順序背四條規則，再講箭頭函式。
:::

::: details 標準答案與過程
優先順序由高到低：

1. **new 綁定**：`new Foo()` → 新建立的物件。
2. **顯式綁定**：`call`、`apply`、`bind` 指定的物件（`bind` 後再 `call` 改不了）。
3. **隱式綁定**：`obj.fn()` → `obj`。
4. **預設綁定**：直接呼叫 `fn()` → 嚴格模式 `undefined`，非嚴格模式 `globalThis`。

**箭頭函式**沒有自己的 `this`，取外層詞法作用域的 `this`，`call/bind` 也改不了。

```js
const obj = {
  name: 'A',
  normal() { return this.name },
  arrow: () => this?.name,
}
const fn = obj.normal
obj.normal() // 'A'（隱式綁定）
fn()         // 隱式綁定遺失 → 預設綁定：嚴格模式（ES module）this 是 undefined，丟 TypeError
obj.arrow()  // undefined（取外層模組頂層的 this，也就是 undefined）
```

常見坑：把物件方法當 callback 傳出去（`setTimeout(obj.normal)`、事件處理器）會遺失 `this`，用箭頭函式包一層或 `bind`。
:::

**相關筆記**：[1-2-1 this](./1-2-1.md)、[2-2 箭頭函式](./2-2.md)

### Q6. 原型鏈是什麼？`new` 做了哪些事？ <Badge type="tip" text="高頻" /> {#interview-3-6}

::: details 標準答案與過程
每個物件有內部連結 `[[Prototype]]`（可用 `Object.getPrototypeOf` 取得），讀取屬性時找不到就沿著原型往上找，直到 `null`，這條鏈就是原型鏈。`class` 只是原型繼承的語法糖。

`new Foo(...args)` 做四件事：

1. 建立新物件，原型指向 `Foo.prototype`。
2. 以新物件為 `this` 執行 `Foo`。
3. 若 `Foo` 回傳物件，就用那個物件。
4. 否則回傳新物件。

```js
function myNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype)
  const result = Ctor.apply(obj, args)
  return result !== null && (typeof result === 'object' || typeof result === 'function') ? result : obj
}
```
:::

**相關筆記**：[1-2-7 物件導向和原型鏈](./1-2-7.md)、[3-1 類別](./3-1.md)

### Q7. Event Loop：下面程式輸出順序？ <Badge type="tip" text="高頻" /> {#interview-3-7}

```js
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
;(async () => {
  console.log('4')
  await null
  console.log('5')
})()
queueMicrotask(() => console.log('6'))
console.log('7')
```

::: details 解題思路
1. 先跑完同步程式（Call Stack）。
2. 清空所有 microtask（Promise.then、await 之後、queueMicrotask），依加入順序。
3. 再取一個 macrotask（setTimeout）。
4. `async` 函式在第一個 `await` 之前是同步執行的。
:::

::: details 標準答案與過程
輸出：`1 4 7 3 5 6 2`

| 階段 | 執行 | 佇列狀態 |
| --- | --- | --- |
| 同步 | 印 1；setTimeout 進 task；then(3) 進 microtask；印 4；await 把後續（5）進 microtask；queueMicrotask(6) 進 microtask；印 7 | micro：3, 5, 6；task：2 |
| microtask | 印 3、5、6 | task：2 |
| macrotask | 印 2 | — |

延伸：瀏覽器在每個 macrotask 之後、清完 microtask 後才有機會渲染，所以 microtask 無限遞迴會讓畫面卡死。
:::

**相關筆記**：[1-2-5 實作非同步流程（巨任務和微任務）](./1-2-5.md)、[1-2-8 JS 單執行緒的真相](./1-2-8.md#1-2-8-1)、[4-4 非同步函式](./4-4.md)

### Q8. `Promise.all`、`allSettled`、`race`、`any` 差在哪？ <Badge type="tip" text="高頻" /> {#interview-3-8}

::: details 標準答案與過程
| 方法 | 何時 resolve | 何時 reject | 用途 |
| --- | --- | --- | --- |
| `all` | 全部成功 | 任一失敗就立即 reject | 互相依賴、缺一不可的請求 |
| `allSettled` | 全部結束（不論成敗） | 不會 reject | 儀表板多區塊，各自顯示成功或錯誤 |
| `race` | 第一個**結束**的（成功或失敗） | 第一個結束的是失敗 | 逾時控制 |
| `any` | 第一個**成功**的 | 全部失敗，丟 `AggregateError` | 多個備援來源取最快的 |

```js
// 逾時控制
const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
await Promise.race([fetch('/api/quote'), timeout(3000)])
```

注意：`race` 逾時後原本的請求還在跑，真正取消要用 `AbortController`（`fetch(url, { signal: AbortSignal.timeout(3000) })`）。金融交易類操作不能用 `allSettled` 接受部分成功，要全有全無。
:::

**相關筆記**：[4-1 Promise](./4-1.md)、[14-1 Promise.allSettled](./14-1.md)、[15-2 Promise.any](./15-2.md)、[1-2-6 Promise 深入解析](./1-2-6.md)

### Q9. 深拷貝和淺拷貝？怎麼做深拷貝？ <Badge type="tip" text="高頻" /> {#interview-3-9}

::: details 標準答案與過程
- **淺拷貝**：只複製第一層，巢狀物件仍共用參考。`{ ...obj }`、`Object.assign`、`arr.slice()`。
- **深拷貝**：遞迴複製所有層。

| 方法 | 優點 | 限制 |
| --- | --- | --- |
| `structuredClone(obj)` | 原生、支援 Date、Map、Set、循環參考 | 不能複製函式、DOM 節點、class 原型 |
| `JSON.parse(JSON.stringify(obj))` | 簡單 | 遺失 `undefined`、函式、Symbol；Date 變字串；循環參考會丟錯 |
| 手寫遞迴 + WeakMap | 可客製 | 要自己處理各種型別 |

實務：優先 `structuredClone`；框架狀態更新通常只需要「沿路徑淺拷貝」（不可變更新），不需要整棵深拷貝。手寫版本見 [模擬面試 12 Q3](./interview-12.md#interview-12-3)。
:::

**相關筆記**：[3-3 Object.assign](./3-3.md)、[2-4 展開運算子](./2-4.md)

### Q10. 什麼情況會記憶體洩漏？怎麼確認？ <Badge type="tip" text="高頻" /> {#interview-3-10}

::: details 標準答案與過程
GC 回收的條件是「從根（全域、呼叫堆疊）無法再存取到」，不是有沒有設成 null。

常見洩漏：

1. 事件監聽未移除（尤其掛在 `window`、`document`）。
2. `setInterval`、WebSocket、Observer 未清除。
3. 全域快取只增不減。
4. 閉包長期引用大物件。
5. Detached DOM：節點已從畫面移除，但 JS 變數還引用它。

確認方式：DevTools Memory → 操作前拍 Heap Snapshot → 重複操作（開關頁面 10 次）→ 再拍 → 用 Comparison 看哪些物件持續增加 → 看 **Retainers** 找出是誰在引用。

預防：元件卸載時清理（Vue `onUnmounted`、React `useEffect` 回傳 cleanup）；快取用 LRU／TTL；與物件生命週期綁定的資料用 `WeakMap`。
:::

**相關筆記**：[1-2-2 閉包（記憶體洩漏場景）](./1-2-2.md)、[1-6-12 Memory Leak 排查 SOP](./1-6-12.md#1-6-12-1)、[5-2 弱映射](./5-2.md)

### Q11. 哪些陣列方法會改變原陣列？ <Badge type="tip" text="基礎" /> {#interview-3-11}

::: details 標準答案與過程
- **會改原陣列**：`push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`、`fill`、`copyWithin`。
- **回傳新陣列**：`map`、`filter`、`slice`、`concat`、`flat`、`flatMap`，以及 ES2023 的 `toSorted`、`toReversed`、`toSpliced`、`with`。

為什麼重要：React 用參考比較判斷是否更新，直接 `arr.push()` 再 `setState(arr)` 不會重新渲染；Vuex／Pinia 雖然能偵測 mutation，但不可變更新讓狀態變化更好追蹤。

```js
const sorted = list.toSorted((a, b) => a.price - b.price) // 原 list 不變
const updated = list.with(2, { ...list[2], qty: 3 })     // 替換第 3 筆
```
:::

**相關筆記**：[17-1 toSorted](./17-1.md)、[17-3 with](./17-3.md)、[17-6 toSpliced](./17-6.md)

### Q12. 為什麼 `0.1 + 0.2 !== 0.3`？金額怎麼算？ <Badge type="tip" text="基礎" /> {#interview-3-12}

::: details 標準答案與過程
JavaScript 的 number 是 IEEE 754 雙精度浮點數，0.1、0.2 在二進位是無限循環小數，只能近似儲存，相加後是 `0.30000000000000004`。

處理方式：

1. **比較**：`Math.abs(a - b) < Number.EPSILON`。
2. **金額**：以最小單位整數計算（元 → 分），顯示時再除回；超過 `Number.MAX_SAFE_INTEGER`（約 9 千兆）用 `BigInt`。
3. **需要小數精度的計算**（匯率、利率）：用 decimal.js、big.js，或交給後端（Java `BigDecimal`）。
4. **顯示**：`Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' })`。

金融系統原則：計算以後端為準，前端只負責顯示與輸入驗證。
:::

**相關筆記**：[7-1 數值（Number.EPSILON、安全整數）](./7-1.md)、[14-5 BigInt](./14-5.md)、[20-3 Math.sumPrecise](./20-3.md)

### Q13. ES Module 和 CommonJS 差在哪？ <Badge type="tip" text="基礎" /> {#interview-3-13}

::: details 標準答案與過程
| | CommonJS | ES Module |
| --- | --- | --- |
| 語法 | `require` / `module.exports` | `import` / `export` |
| 載入時機 | 執行期、同步 | 編譯期靜態分析（`import()` 為動態） |
| 輸出 | 值的拷貝（匯出當下的值） | **即時綁定**（live binding） |
| Tree Shaking | 難 | 可以（因為靜態） |
| 頂層 `this` | `module.exports` | `undefined` |
| 頂層 await | 不支援 | 支援 |

Node.js 以 `package.json` 的 `"type": "module"` 或副檔名 `.mjs` / `.cjs` 區分。新專案用 ESM。
:::

**相關筆記**：[1-23-2 Node.js 模組系統（含瀏覽器只認 ESM）](./1-23-2.md#1-23-2-5)、[8-1 CommonJS](./8-1.md)、[8-2 JavaScript 模組](./8-2.md)、[1-6-7 前端模組化發展](./1-6-7.md)、[16-5 頂層 await](./16-5.md)
