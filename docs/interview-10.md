# 模擬面試 10：前端資安 {#interview-10}

::: info 新增（2026-11）
對應職缺：「Attention to security」（台達電）、金融業職缺普遍重視。前端資安題的核心是：知道前端能擋什麼、不能擋什麼。
:::

### Q1. XSS 有哪幾種？怎麼防？ <Badge type="tip" text="高頻" /> {#interview-10-1}

::: details 標準答案與過程
XSS 是攻擊者讓惡意腳本在受害者的瀏覽器、以網站的身分執行。

| 類型 | 來源 | 例子 |
| --- | --- | --- |
| 儲存型 | 惡意內容存進資料庫，所有看到的人都中招 | 留言板存 `<img src=x onerror=...>` |
| 反射型 | 惡意內容在 URL 參數，伺服器原樣輸出 | `?q=<script>...` |
| DOM 型 | 前端 JS 把不可信資料寫進 DOM | `el.innerHTML = location.hash` |

防禦：

1. **輸出編碼**：框架預設會跳脫（Vue 的雙大括號插值、React 的 JSX）。避免 `v-html`、`dangerouslySetInnerHTML`、`innerHTML`；真的要顯示使用者 HTML 時先用 DOMPurify 消毒。
2. **注意 URL 與屬性**：`href` 可能是 `javascript:` 協定，要白名單檢查 `http(s):`。
3. **CSP**：限制腳本來源，即使注入成功也無法執行（見 Q3）。
4. **HttpOnly Cookie**：讓腳本讀不到 session。
5. **後端驗證與編碼**：前端不是唯一防線。
:::

**相關筆記**：[1-19-1 資安實作建議](./1-19-1.md)、[1-19-7 HTTP Security Headers](./1-19-7.md)

### Q2. CSRF 是什麼？SameSite 怎麼幫忙？ <Badge type="tip" text="高頻" /> {#interview-10-2}

::: details 標準答案與過程
CSRF 是攻擊者讓已登入的使用者，在不知情下從**別的網站**對你的網站發出請求；因為瀏覽器會自動帶 cookie，伺服器以為是本人操作。

防禦：

1. **SameSite Cookie**：`Lax`（現代瀏覽器預設）擋住跨站的 POST 與子資源請求，但頂層導覽的 GET 會帶；`Strict` 全部不帶。所以 **GET 不能有副作用**。
2. **CSRF Token**：表單或標頭帶一個伺服器簽發、攻擊者拿不到的 token（同步 token 或 double submit cookie）。
3. **檢查 `Origin` / `Referer`**。
4. **改用 `Authorization` 標頭帶 token**：不是自動附帶的，天然不受 CSRF 影響（但要防 XSS）。
5. 敏感操作要求重新驗證（Step-up）。

CORS 不能防 CSRF：簡單請求（form POST）不會觸發 preflight，請求照樣送到伺服器並執行。
:::

**相關筆記**：[1-19-6 寫入 API 防護（CSRF）](./1-19-6.md#1-19-6-1)

### Q3. CSP 是什麼？怎麼導入不會把網站弄壞？ <Badge type="warning" text="進階" /> {#interview-10-3}

::: details 標準答案與過程
Content-Security-Policy 用回應標頭告訴瀏覽器「哪些來源的資源可以載入或執行」。

```txt
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-r4nd0m' 'strict-dynamic';
  style-src 'self';
  img-src 'self' https: data:;
  connect-src 'self' https://api.example.com;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none'
```

導入步驟：

1. 先用 `Content-Security-Policy-Report-Only` + `report-to` 觀察違規，不阻擋。
2. 清掉行內 `onclick`、行內 `<script>`；必要的行內腳本用 nonce（每次請求隨機）或 hash。
3. 列出第三方來源（分析、字型、CDN），逐一加白名單。
4. 確認沒有違規後切換成正式標頭。

避免：`'unsafe-inline'`、`'unsafe-eval'` 會讓 CSP 對 XSS 幾乎沒有效果。`frame-ancestors` 取代 `X-Frame-Options` 防點擊劫持。
:::

**相關筆記**：[1-19-7 傳輸層與 HTTP Security Headers](./1-19-7.md)

### Q4. 前端可以防止使用者竄改資料或繞過權限嗎？ <Badge type="tip" text="高頻" /> {#interview-10-4}

::: details 標準答案與過程
不行。前端程式碼與請求都在使用者手上，DevTools 可以改 payload、改 JS、直接呼叫 API。前端的檢查（隱藏按鈕、禁用欄位、表單驗證）只是 **UX**，不是防線。

後端必須：
1. 從驗證後的 session／token 取得使用者身分，不信任前端傳入的 `userId`。
2. 檢查資源所有權（防 BOLA：改 URL 中的 ID 看到別人的資料）。
3. 欄位白名單（防 Mass Assignment：多塞 `role: 'admin'`）。
4. 金額、價格由後端計算，不信任前端傳入的總價。
5. 業務規則與狀態機驗證、限流、稽核紀錄。

前端能做的：減少錯誤操作、不在前端放密鑰、不把不該看的資料傳下來（遮罩要在後端做）。
:::

**相關筆記**：[1-19-3 資安五條底層原則](./1-19-3.md#1-19-3-1)、[1-19-6 寫入 API 防護與資料遮罩](./1-19-6.md)

### Q5. 點擊劫持（Clickjacking）是什麼？ <Badge type="tip" text="基礎" /> {#interview-10-5}

::: details 標準答案與過程
攻擊者把你的網站放進透明 `iframe`，疊在誘騙用的按鈕上，使用者以為點的是攻擊者頁面，實際點到你網站的「確認轉帳」。

防禦：回應標頭 `Content-Security-Policy: frame-ancestors 'none'`（或 `'self'`），舊瀏覽器補 `X-Frame-Options: DENY`。敏感操作加二次確認。
:::

**相關筆記**：[1-19-7 HTTP Security Headers](./1-19-7.md)

### Q6. npm 套件的供應鏈風險怎麼管？ <Badge type="warning" text="進階" /> {#interview-10-6}

::: details 標準答案與過程
風險：惡意套件、維護者帳號被盜後發布惡意版本、typosquatting（名字很像的假套件）、postinstall 腳本執行任意程式。

做法：

1. **鎖版本**：提交 lockfile，CI 用 `npm ci`。
2. **掃描**：`npm audit`、Dependabot／Renovate、Snyk；CI 設定高風險就擋。
3. **減少依賴**：新增套件前看維護狀況、下載量、權限需求；能用原生 API 就不要裝。
4. **限制安裝腳本**：`npm ci --ignore-scripts` 或 pnpm 的 allowlist。
5. **私有 registry 代理**：企業用 Artifactory／Nexus 鏡像並審查。
6. **SBOM**：產出依賴清單，事件發生時能快速查影響範圍。
7. **CI 中第三方 Action 固定 commit SHA**，不要用浮動 tag。
:::

**相關筆記**：[1-19-3 XZ Utils 後門（供應鏈攻擊）](./1-19-3.md#1-19-3-2)、[1-22-3 開源專案怎麼選](./1-22-3.md#1-22-3-3)

### Q7. 個資要在前端遮罩嗎？ <Badge type="tip" text="高頻" /> {#interview-10-7}

::: details 標準答案與過程
遮罩要在**伺服器**做。如果 API 回傳完整身分證號，前端只用 CSS 或字串處理遮住，使用者打開 DevTools Network 就看得到。

正確做法：
1. API 預設回傳遮罩後的值（`A12****789`）。
2. 需要看完整值時，另一支 API 經過權限檢查、二次驗證、填寫理由，回傳短效原文，並記錄稽核紀錄。
3. 回應加 `Cache-Control: no-store`；前端只放記憶體，不寫入 localStorage。
4. Log 與錯誤回報（Sentry）也要過濾敏感欄位。
:::

**相關筆記**：[1-19-6 資料遮罩 / 去識別化](./1-19-6.md#1-19-6-2)

### Q8. 前端要產生不可猜的 ID 或 token，用 `Math.random()` 可以嗎？ <Badge type="tip" text="基礎" /> {#interview-10-8}

::: details 標準答案與過程
不行。`Math.random()` 是一般的偽隨機數，不保證不可預測。安全用途要用密碼學安全的亂數：

```js
crypto.randomUUID()                              // v4 UUID
crypto.getRandomValues(new Uint8Array(32))      // 256 bits 隨機位元組
```

而且真正的安全 token（session、重設密碼連結）應該由**後端**產生。前端產生的值只適合當作冪等鍵、追蹤 ID、PKCE 的 code_verifier 這類用途。
:::

**相關筆記**：[1-19-4 隨機數](./1-19-4.md#1-19-4-1)
