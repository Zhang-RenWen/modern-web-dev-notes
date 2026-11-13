<script setup>
import AnimStepper from './AnimStepper.vue'

// msgs：時序圖上已出現的訊息；dir：→ 往伺服器、← 回瀏覽器
const steps = [
  { caption: '頁面在 <code>app.example.com</code>，要對 <code>api.example.com</code> 送 <code>PUT</code>＋JSON＋Authorization。Origin 不同（主機不同）＝跨源。', js: "fetch('https://api.example.com/orders/1', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization } })", msgs: [], verdict: '' },
  { caption: '瀏覽器檢查：PUT、JSON、自訂標頭都不是「簡單請求」，所以<b>先自動送一個 OPTIONS 預檢</b>，問伺服器准不准。JS 完全看不到這一步。', msgs: [{ dir: '→', text: 'OPTIONS /orders/1\nOrigin: https://app.example.com\nAccess-Control-Request-Method: PUT\nAccess-Control-Request-Headers: authorization, content-type', kind: 'warn' }], verdict: '' },
  { caption: '伺服器回 204，用 <code>Access-Control-Allow-*</code> 標頭宣告允許的來源、方法、標頭，<code>Max-Age</code> 讓瀏覽器快取這個答案 600 秒。', msgs: [{ dir: '←', text: '204 No Content\nAccess-Control-Allow-Origin: https://app.example.com\nAccess-Control-Allow-Methods: GET, POST, PUT\nAccess-Control-Allow-Headers: authorization, content-type\nAccess-Control-Max-Age: 600', kind: 'ok' }], verdict: '' },
  { caption: '瀏覽器比對通過，才送出<b>真正的 PUT</b>。', msgs: [{ dir: '→', text: 'PUT /orders/1\nOrigin: https://app.example.com\nAuthorization: Bearer …', kind: 'brand' }], verdict: '' },
  { caption: '回應也要帶 <code>Access-Control-Allow-Origin</code>，瀏覽器才把結果交給 JS。✅', msgs: [{ dir: '←', text: '200 OK\nAccess-Control-Allow-Origin: https://app.example.com', kind: 'ok' }], verdict: 'ok' },
  { caption: '對照：如果是<b>簡單請求</b>（例如表單 POST），瀏覽器<b>不預檢、直接送出</b>，伺服器也照常執行了。', js: "fetch('https://api.example.com/orders', { method: 'POST', body: formData })", msgs: [{ dir: '→', text: 'POST /orders\nOrigin: https://app.example.com', kind: 'brand' }], verdict: '' },
  { caption: '伺服器回應沒帶 Allow-Origin → 瀏覽器<b>不讓 JS 讀</b>，console 報 CORS 錯誤。但請求<b>已經執行過了</b>：CORS 保護的是「讀取」，不是伺服器，所以它也擋不了 CSRF。', msgs: [{ dir: '←', text: '201 Created（訂單已建立）\n（沒有 Access-Control-Allow-Origin）', kind: 'bad' }], verdict: 'bad' },
]
// 第 1～5 步累積同一段對話，第 6、7 步是另一段
let acc = []
let js = ''
for (const [k, st] of steps.entries()) {
  if (st.js) { js = st.js; if (k === 5) acc = [] }
  acc = [...acc, ...st.msgs]
  st.js = js
  st.all = acc
}
</script>

<template>
  <AnimStepper title="CORS 預檢請求" :steps="steps" :interval="2400">
    <template #default="{ step }">
      <p class="a-mono co-js">{{ step.js }}</p>
      <div class="co-head"><span class="a-label">瀏覽器（app.example.com）</span><span class="a-label">api.example.com</span></div>
      <TransitionGroup name="a-list" tag="div" class="a-col">
        <div v-for="(m, k) in step.all" :key="step.js + k" class="co-msg" :class="m.dir === '→' ? 'right' : 'left'">
          <pre class="a-chip co-bubble" :class="[m.kind, { hl: k === step.all.length - 1 }]">{{ m.dir === '→' ? m.text + '  →' : '←  ' + m.text }}</pre>
        </div>
      </TransitionGroup>
      <p v-if="step.verdict" class="co-verdict">JS 拿得到回應嗎？<span class="a-chip" :class="step.verdict">{{ step.verdict === 'ok' ? '可以' : '不行（但伺服器已經執行）' }}</span></p>
    </template>
  </AnimStepper>
</template>

<style scoped>
.co-js { margin: 0 0 10px; padding: 6px 10px; border-radius: 6px; background: var(--vp-c-bg); white-space: normal; word-break: break-all; }
.co-head { display: flex; justify-content: space-between; }
.co-msg { display: flex; }
.co-msg.right { justify-content: flex-start; }
.co-msg.left { justify-content: flex-end; }
.co-bubble { margin: 0; max-width: 92%; border-radius: 8px; white-space: pre-wrap; line-height: 1.5; padding: 6px 10px; }
.co-verdict { margin: 10px 0 0; }
</style>
