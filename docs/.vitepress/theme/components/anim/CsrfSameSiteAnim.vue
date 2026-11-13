<script setup>
import AnimStepper from './AnimStepper.vue'

let s = { samesite: 'None', at: 'bank', cookie: false, req: null, result: '' }
const steps = [
  ['使用者登入 <code>bank.com</code>，拿到 session cookie。先看 <code>SameSite=None</code>（舊網站常見設定）的情況。', { at: 'bank', cookie: true }],
  ['使用者在另一個分頁打開 <code>evil.com</code>。頁面裡藏了一個會自動送出的表單，目標是 <code>bank.com/transfer</code>。', { at: 'evil' }],
  ['表單送出：瀏覽器<b>自動帶上 bank.com 的 cookie</b>，即使請求是從 evil.com 發起的。', { req: { cookie: true } }],
  ['伺服器看到有效 session，以為是本人操作：轉帳成功 ❌。這就是 CSRF：攻擊者<b>讀不到</b>任何資料，但能<b>借你的身分送出請求</b>。', { result: 'bad' }],
  ['改成 <code>SameSite=Lax</code>（現代瀏覽器的預設）：同樣的攻擊流程再來一次。', { samesite: 'Lax', at: 'evil', req: null, result: '' }],
  ['跨站的 POST 表單：瀏覽器<b>不帶 cookie</b>。（Lax 只在頂層導覽的 GET 才帶，所以 GET 絕不能有副作用。）', { req: { cookie: false } }],
  ['伺服器沒看到 session → 401，攻擊失敗 ✅。再加上 CSRF token、檢查 <code>Origin</code>、敏感操作重新驗證，形成多層防護。CORS 擋不了這種攻擊：表單 POST 不會觸發預檢。', { result: 'ok' }],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))
</script>

<template>
  <AnimStepper title="CSRF 與 SameSite Cookie" :steps="steps" :interval="2300">
    <template #default="{ step }">
      <div class="a-grid cs-grid">
        <div class="a-panel" :class="{ hl: step.at === 'bank' }">
          <span class="a-label">分頁：bank.com</span>
          <span v-if="step.cookie" class="a-chip brand">🍪 session=abc; SameSite={{ step.samesite }}</span>
        </div>
        <div class="a-panel" :class="{ hl: step.at === 'evil' }">
          <span class="a-label">分頁：evil.com</span>
          <span v-if="step.at === 'evil'" class="a-mono cs-form">&lt;form action="https://bank.com/transfer" method="POST"&gt;<br />&lt;input name="to" value="attacker"&gt;<br />&lt;/form&gt;&lt;script&gt;form.submit()&lt;/script&gt;</span>
        </div>
        <div class="a-panel" :class="{ hl: step.result }">
          <span class="a-label">bank.com 伺服器</span>
          <template v-if="step.req">
            <span class="a-chip" :class="step.req.cookie ? 'bad' : 'ok'">POST /transfer {{ step.req.cookie ? '＋ 🍪 session=abc' : '（沒有 cookie）' }}</span>
          </template>
          <p v-if="step.result" class="cs-res"><span class="a-chip" :class="step.result">{{ step.result === 'bad' ? '轉帳成功：被攻擊了' : '401 未登入：攻擊失敗' }}</span></p>
        </div>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.cs-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.cs-grid .a-chip { white-space: normal; border-radius: 6px; }
.cs-form { display: block; word-break: break-all; font-size: 0.72em; line-height: 1.5; color: var(--vp-c-red-1); }
.cs-res { margin: 6px 0 0; }
@media (max-width: 640px) { .cs-grid { grid-template-columns: 1fr; } }
</style>
