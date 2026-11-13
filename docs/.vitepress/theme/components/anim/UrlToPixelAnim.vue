<script setup>
import AnimStepper from './AnimStepper.vue'

const stages = [
  { id: 'cache', label: '快取', group: 'net' },
  { id: 'dns', label: 'DNS', group: 'net' },
  { id: 'tcp', label: 'TCP', group: 'net' },
  { id: 'tls', label: 'TLS', group: 'net' },
  { id: 'http', label: 'HTTP', group: 'net' },
  { id: 'dom', label: 'DOM', group: 'render' },
  { id: 'cssom', label: 'CSSOM', group: 'render' },
  { id: 'layout', label: 'Layout', group: 'render' },
  { id: 'paint', label: 'Paint', group: 'render' },
  { id: 'composite', label: 'Composite', group: 'render' },
]
const msgs = {
  cache: { from: 'browser', to: 'browser', text: '查 Service Worker、HTTP 快取；命中就不發請求' },
  dns: { from: 'browser', to: 'dns', text: 'example.com 的 IP？→ 93.184.x.x' },
  tcp: { from: 'browser', to: 'server', text: 'SYN → SYN-ACK → ACK（1 RTT）' },
  tls: { from: 'browser', to: 'server', text: 'ClientHello → ServerHello + 憑證（TLS 1.3：1 RTT）' },
  http: { from: 'browser', to: 'server', text: 'GET / → 200 OK（HTML 串流回來）' },
}
const captions = {
  cache: '解析網址後先查快取：Service Worker、記憶體、磁碟快取。命中強快取就完全不走網路。',
  dns: 'DNS 解析：瀏覽器快取 → OS → 遞迴解析器 → Root → TLD → 權威 DNS，拿到 IP。<code>dns-prefetch</code> 可以提早做。',
  tcp: 'TCP 三向交握建立連線。HTTP/3 改走 QUIC（UDP），把連線和 TLS 合併成 1 個 RTT。',
  tls: 'TLS 握手：協商金鑰、驗證憑證。<code>preconnect</code> 可以提早做完 DNS + TCP + TLS。',
  http: '送出請求，經過 CDN、負載平衡到伺服器，HTML 邊收邊解析，不用等全部下載完。',
  dom: '解析 HTML 建 DOM。遇到同步 <code>&lt;script&gt;</code> 會停下來（<code>defer</code>／<code>module</code> 不會）。',
  cssom: '解析 CSS 建 CSSOM。CSS 會<b>阻塞渲染</b>：CSSOM 好之前不會畫第一幀，所以 CSS 放 head、越早下載越好。',
  layout: 'DOM + CSSOM → Render Tree（只留要顯示的節點）→ Layout 算出每個盒子的位置與大小。',
  paint: 'Paint 產生繪製指令，再切成圖層點陣化。',
  composite: 'Composite 把圖層疊成畫面送到螢幕。之後 JS 改 DOM／CSS，會依改動回到 Layout、Paint 或只 Composite。',
}
const steps = stages.map((st, k) => ({ caption: captions[st.id], cur: st.id, done: stages.slice(0, k).map((x) => x.id), msg: msgs[st.id] ?? null }))
const lanes = [
  { id: 'browser', label: '瀏覽器' },
  { id: 'dns', label: 'DNS 解析器' },
  { id: 'server', label: 'CDN／伺服器' },
]
</script>

<template>
  <AnimStepper title="從輸入網址到畫面出現" :steps="steps" :interval="1900">
    <template #default="{ step }">
      <div class="up-stages">
        <span
          v-for="st in stages"
          :key="st.id"
          class="a-chip"
          :class="[st.id === step.cur ? (st.group === 'net' ? 'warn' : 'brand') : step.done.includes(st.id) ? 'ok' : 'dim', { hl: st.id === step.cur }]"
        >{{ st.label }}</span>
      </div>
      <div class="a-grid up-lanes">
        <div v-for="l in lanes" :key="l.id" class="a-panel" :class="{ hl: step.msg && (step.msg.from === l.id || step.msg.to === l.id), dim: !step.msg }">
          <span class="a-label">{{ l.label }}</span>
        </div>
      </div>
      <Transition name="a-list" mode="out-in">
        <p :key="step.cur" class="a-mono up-msg">{{ step.msg ? step.msg.text : '渲染段：在瀏覽器的 Renderer 進程裡進行' }}</p>
      </Transition>
    </template>
  </AnimStepper>
</template>

<style scoped>
.up-stages { display: flex; flex-wrap: wrap; gap: 6px; }
.up-lanes { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 12px; }
.up-msg { margin: 10px 0 0; padding: 6px 10px; border-radius: 6px; background: var(--vp-c-bg); }
</style>
