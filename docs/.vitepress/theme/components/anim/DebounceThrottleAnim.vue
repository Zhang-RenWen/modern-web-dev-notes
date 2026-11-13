<script setup>
import AnimStepper from './AnimStepper.vue'

// 一串事件（例如打字），wait = 300ms。全部用演算法算出來，避免手寫時間點出錯。
const WAIT = 300
const END = 2000
const events = [100, 220, 330, 450, 900, 1000, 1150, 1700]

function debounceCalls(ev) {
  // 最後一次觸發後安靜 WAIT 才執行
  return ev.filter((t, k) => k === ev.length - 1 || ev[k + 1] - t >= WAIT).map((t) => t + WAIT)
}
function throttleCalls(ev) {
  // leading：立刻執行，之後 WAIT 內的觸發都忽略
  const out = []
  let last = -Infinity
  for (const t of ev) if (t - last >= WAIT) { out.push(t); last = t }
  return out
}
const deb = debounceCalls(events)
const thr = throttleCalls(events)

const times = [0, 100, 220, 330, 450, 750, 900, 1000, 1150, 1450, 1700, 2000]
const captions = {
  0: '同一串事件（例如使用者打字、捲動），分別交給 <b>debounce</b> 與 <b>throttle</b>，等待時間都是 300ms。',
  100: '第 1 次觸發。throttle：立刻執行一次，接下來 300ms 內的都忽略。debounce：開始倒數 300ms。',
  220: '連續觸發：debounce <b>每次都重新倒數</b>；throttle 還在冷卻中，忽略。',
  330: 'debounce 又重設計時。',
  450: '距離 throttle 上次執行已超過 300ms → throttle 再執行一次。debounce 繼續被重設。',
  750: '安靜了 300ms，debounce 終於執行<b>最後那一次</b>（450 的那筆）。',
  900: '新一波觸發：throttle 立刻執行，debounce 重新倒數。',
  1000: '冷卻中，throttle 忽略；debounce 重設。',
  1150: 'debounce 重設；throttle 還在 900 的冷卻期內（到 1200）。',
  1450: '安靜 300ms → debounce 執行。',
  1700: '單獨一次觸發：兩者都會處理（throttle 立刻、debounce 300ms 後）。',
  2000: 'debounce「等你講完再回」：只回最後一次，適合搜尋輸入、resize 結束、自動儲存。throttle「固定節奏回」：適合捲動、拖曳、滑鼠移動。',
}
const steps = times.map((t) => ({
  t,
  caption: captions[t],
  ev: events.filter((x) => x <= t),
  deb: deb.filter((x) => x <= t),
  thr: thr.filter((x) => x <= t),
  pending: (() => {
    const lastEv = events.filter((x) => x <= t).at(-1)
    return lastEv !== undefined && lastEv + WAIT > t ? lastEv : null
  })(),
}))
const pct = (x) => (x / END) * 100 + '%'
</script>

<template>
  <AnimStepper title="debounce vs throttle（wait = 300ms）" :steps="steps" :interval="1300">
    <template #default="{ step }">
      <div class="dt-rows">
        <span class="a-muted">事件</span>
        <div class="a-track">
          <div v-for="x in step.ev" :key="'e' + x" class="a-dot" :style="{ left: pct(x), background: 'var(--vp-c-text-2)' }" />
          <div class="dt-now" :style="{ left: pct(step.t) }" />
        </div>
        <span class="a-muted">debounce</span>
        <div class="a-track">
          <div v-if="step.pending !== null" class="a-bar" :style="{ left: pct(step.pending), width: pct(WAIT), background: 'var(--vp-c-yellow-soft)' }" />
          <div v-for="x in step.deb" :key="'d' + x" class="a-dot" :style="{ left: pct(x), background: 'var(--vp-c-brand-1)' }" />
          <div class="dt-now" :style="{ left: pct(step.t) }" />
        </div>
        <span class="a-muted">throttle</span>
        <div class="a-track">
          <div v-for="x in step.thr" :key="'t' + x" class="a-bar" :style="{ left: pct(x), width: pct(WAIT), background: 'var(--vp-c-green-soft)' }" />
          <div v-for="x in step.thr" :key="'td' + x" class="a-dot" :style="{ left: pct(x), background: 'var(--vp-c-green-1)' }" />
          <div class="dt-now" :style="{ left: pct(step.t) }" />
        </div>
      </div>
      <p class="a-muted dt-legend">t = {{ step.t }}ms · 觸發 {{ step.ev.length }} 次 · debounce 執行 {{ step.deb.length }} 次 · throttle 執行 {{ step.thr.length }} 次（黃色＝debounce 倒數中，綠色＝throttle 冷卻期）</p>
    </template>
  </AnimStepper>
</template>

<style scoped>
.dt-rows { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: center; gap: 8px; }
.dt-now { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--vp-c-brand-1); transition: left 0.35s ease; }
.dt-legend { margin: 10px 0 0; }
</style>
