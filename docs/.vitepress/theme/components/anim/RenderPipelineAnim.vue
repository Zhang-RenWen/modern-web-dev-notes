<script setup>
import AnimStepper from './AnimStepper.vue'

const stages = ['JS', 'Style', 'Layout', 'Paint', 'Composite']
const S = (on, extra = {}) => ({ on, layouts: 0, ...extra })
const steps = [
  { caption: '畫面更新的管線：JS 改了東西 → 重算樣式 → 排版（算位置大小）→ 繪製（產生像素指令）→ 合成圖層。改到越前面的階段，後面全部要重做。', code: '', ...S([]) },
  { caption: '改 <code>width</code>（幾何）：要重新 <b>Layout</b>，連帶 Paint、Composite 全跑一遍，而且可能牽動父、兄弟、子元素。成本最高，這就是 <b>Reflow</b>。', code: "el.style.width = '300px'", ...S(['JS', 'Style', 'Layout', 'Paint', 'Composite']) },
  { caption: '改 <code>color</code>（外觀）：位置大小不變，跳過 Layout，只要重新繪製，這是 <b>Repaint</b>。', code: "el.style.color = 'red'", ...S(['JS', 'Style', 'Paint', 'Composite']) },
  { caption: '改 <code>transform</code>／<code>opacity</code>（元素在獨立圖層上）：只要 <b>Composite</b>，在合成執行緒處理，主執行緒忙也不會卡。動畫首選。', code: "el.style.transform = 'translateX(100px)'", ...S(['JS', 'Composite']) },
  { caption: '陷阱：迴圈裡「讀 <code>offsetHeight</code> → 寫 height」交錯。每次讀都要拿到最新數字，瀏覽器被迫<b>當場重算版面</b>（強制同步佈局），4 個元素就 Layout 4 次。', code: "items.forEach(el => {\n  el.style.height = el.offsetHeight + 10 + 'px'\n})", ...S(['JS', 'Style', 'Layout', 'Paint', 'Composite'], { layouts: 4 }) },
  { caption: '改成<b>先全部讀、再全部寫</b>：寫入只是把版面標記為失效，等下一幀一起算，只 Layout 1 次。', code: "const hs = items.map(el => el.offsetHeight)\nitems.forEach((el, i) => {\n  el.style.height = hs[i] + 10 + 'px'\n})", ...S(['JS', 'Style', 'Layout', 'Paint', 'Composite'], { layouts: 1 }) },
]
const W = { JS: 5, Style: 10, Layout: 40, Paint: 20, Composite: 5 }
// 一次完整管線約 80；讀寫交錯時每多一次強制 Layout 再加 40
const cost = (st) => st.on.reduce((a, x) => a + W[x], 0) + Math.max(0, st.layouts - 1) * W.Layout
const MAX = 200
</script>

<template>
  <AnimStepper title="Reflow、Repaint 與只 Composite" :steps="steps" :interval="2300">
    <template #default="{ step }">
      <pre v-if="step.code" class="a-code"><span v-for="(l, k) in step.code.split('\n')" :key="k">{{ l }}</span></pre>
      <div class="rp-pipe">
        <template v-for="(st, k) in stages" :key="st">
          <div class="a-panel rp-stage" :class="{ hl: step.on.includes(st), dim: step.on.length && !step.on.includes(st) }">
            <b>{{ st }}</b>
            <span v-if="st === 'Layout' && step.layouts" class="a-chip bad">×{{ step.layouts }}</span>
          </div>
          <span v-if="k < stages.length - 1" class="a-arrow">→</span>
        </template>
      </div>
      <div class="rp-cost">
        <span class="a-muted">主執行緒成本<template v-if="step.on.length">（約 {{ cost(step) }}）</template></span>
        <div class="a-track"><div class="a-bar" :style="{ left: 0, width: (Math.min(cost(step), MAX) / MAX) * 100 + '%', background: cost(step) > 100 ? 'var(--vp-c-red-1)' : cost(step) > 50 ? 'var(--vp-c-yellow-1)' : 'var(--vp-c-green-1)' }" /></div>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.rp-pipe { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 10px 0; }
.rp-stage { display: flex; align-items: center; gap: 6px; padding: 6px 12px; }
.rp-cost { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 10px; }
</style>
