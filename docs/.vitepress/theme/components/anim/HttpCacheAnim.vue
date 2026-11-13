<script setup>
import AnimStepper from './AnimStepper.vue'

// entry：瀏覽器快取裡 app.js 的紀錄；net：這一步有沒有走網路
let s = { t: 0, entry: null, net: null, from: '' }
const steps = [
  ['第一次載入 <code>/api/quote</code>：快取裡沒有，發請求。回應帶 <code>Cache-Control: max-age=60</code> 和 <code>ETag: "v1"</code>，瀏覽器把它存起來。', { t: 0, entry: { etag: 'v1', age: 0, fresh: true }, net: { req: 'GET /api/quote', res: '200 OK · max-age=60 · ETag "v1"' }, from: 'network' }],
  ['30 秒後再請求：還在 60 秒有效期內，<b>強快取命中</b>，完全不發請求，DevTools 顯示 <code>200 (from disk cache)</code>。', { t: 30, entry: { etag: 'v1', age: 30, fresh: true }, net: null, from: 'cache' }],
  ['90 秒後：超過 max-age，快取「過期」但還留著。瀏覽器帶上 <code>If-None-Match: "v1"</code> 問伺服器：這份還能用嗎？（<b>協商快取</b>）', { t: 90, entry: { etag: 'v1', age: 90, fresh: false }, net: { req: 'GET /api/quote · If-None-Match: "v1"', res: '' }, from: '' }],
  ['伺服器比對 ETag 沒變，回 <code>304 Not Modified</code>（沒有 body，只有標頭）。瀏覽器沿用本地這份，並重新計時。', { entry: { etag: 'v1', age: 0, fresh: true }, net: { req: 'GET /api/quote · If-None-Match: "v1"', res: '304 Not Modified' }, from: 'cache-304' }],
  ['資料更新後，再次過期時去問：ETag 對不上，伺服器回 <code>200</code> 帶新內容與 <code>ETag: "v2"</code>。', { t: 200, entry: { etag: 'v2', age: 0, fresh: true }, net: { req: 'GET /api/quote · If-None-Match: "v1"', res: '200 OK · ETag "v2"' }, from: 'network' }],
  ['SPA 部署的標準配置：<code>index.html</code> 用 <code>no-cache</code>（每次都驗證，確保拿到新入口）；檔名帶 hash 的 JS／CSS 用 <code>max-age=31536000, immutable</code>（內容一改檔名就變，可以快取一年）；個資 API 用 <code>private, no-store</code>。', { entry: null, net: null, from: 'config' }],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))
const label = { network: '來自網路（下載完整內容）', cache: '來自快取（0 個請求）', 'cache-304': '來自快取（只問了一次，沒下載內容）' }
</script>

<template>
  <AnimStepper title="強快取與協商快取" :steps="steps" :interval="2400">
    <template #default="{ step }">
      <div v-if="step.from !== 'config'" class="a-grid hc-grid">
        <div class="a-panel" :class="{ hl: step.from === 'cache' || step.from === 'cache-304' }">
          <span class="a-label">瀏覽器快取 · t = {{ step.t }}s</span>
          <div v-if="step.entry" class="a-col">
            <span class="a-mono">/api/quote · ETag "{{ step.entry.etag }}"</span>
            <div class="a-track">
              <div class="a-bar" :style="{ left: 0, width: Math.min(step.entry.age / 60, 1) * 100 + '%', background: step.entry.fresh ? 'var(--vp-c-green-1)' : 'var(--vp-c-yellow-1)' }" />
            </div>
            <span class="a-chip" :class="step.entry.fresh ? 'ok' : 'warn'">{{ step.entry.fresh ? `新鮮（${step.entry.age}／60 秒）` : '過期，要先驗證' }}</span>
          </div>
        </div>
        <div class="a-panel" :class="{ hl: step.net, dim: !step.net }">
          <span class="a-label">網路</span>
          <template v-if="step.net">
            <div class="a-chip brand hc-msg">→ {{ step.net.req }}</div>
            <div v-if="step.net.res" class="a-chip hc-msg" :class="step.net.res.startsWith('304') ? 'ok' : 'warn'">← {{ step.net.res }}</div>
          </template>
          <span v-else class="a-muted">沒有發出任何請求</span>
        </div>
      </div>
      <p v-if="label[step.from]" class="a-muted hc-from">這次的回應：{{ label[step.from] }}</p>
      <div v-if="step.from === 'config'" class="a-col">
        <span class="a-chip warn hc-msg">index.html → Cache-Control: no-cache</span>
        <span class="a-chip ok hc-msg">app.3f9a1c.js → Cache-Control: max-age=31536000, immutable</span>
        <span class="a-chip bad hc-msg">/api/me → Cache-Control: private, no-store</span>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.hc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.hc-msg { white-space: normal; border-radius: 6px; margin-top: 4px; }
.hc-from { margin: 8px 0 0; }
@media (max-width: 640px) { .hc-grid { grid-template-columns: 1fr; } }
</style>
