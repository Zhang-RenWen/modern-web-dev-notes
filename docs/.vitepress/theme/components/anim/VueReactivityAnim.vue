<script setup>
import AnimStepper from './AnimStepper.vue'

const code = [
  "const state = reactive({ count: 0, name: 'Vue' })",
  'effect(A) // render：<p>{{ state.count }}</p>',
  'effect(B) // computed：double = state.count * 2',
  'effect(C) // render：<h1>{{ state.name }}</h1>',
  'state.count++',
  "state.name = 'Vue 3'",
]
// deps：targetMap 裡 state 的 key → Set(effect)
let s = { line: 0, active: '', op: '', deps: {}, run: [], state: { count: 0, name: "'Vue'" } }
const steps = [
  ['<code>reactive()</code> 用 <code>Proxy</code> 包住物件：之後每次讀（get）、寫（set）都會被攔截。', { line: 0 }],
  ['執行 effect A：把 A 設成 <code>activeEffect</code>，A 讀了 <code>state.count</code> → <b>get 攔截 → track</b>：記錄「count 被 A 用到」。', { line: 1, active: 'A', op: 'get count → track', deps: { count: ['A'] } }],
  ['effect B 也讀了 <code>count</code>：count 的依賴集合變成 {A, B}。', { line: 2, active: 'B', op: 'get count → track', deps: { count: ['A', 'B'] } }],
  ['effect C 只讀了 <code>name</code>：name 的依賴是 {C}。依賴是「執行時讀到什麼」自動收集的，不用手動宣告。', { line: 3, active: 'C', op: 'get name → track', deps: { count: ['A', 'B'], name: ['C'] } }],
  ['<code>state.count++</code>：<b>set 攔截 → trigger</b>，找出 count 的依賴 {A, B} 重新執行；C 沒用到 count，不動。', { line: 4, active: '', op: 'set count → trigger', run: ['A', 'B'], state: { count: 1, name: "'Vue'" } }],
  ['改 <code>name</code>：只有 C 重跑。這就是精準更新。Vue 2 用 <code>Object.defineProperty</code> 逐一改寫 getter／setter，偵測不到新增屬性與陣列索引；Vue 3 改用 Proxy 解決。', { line: 5, op: 'set name → trigger', run: ['C'], state: { count: 1, name: "'Vue 3'" } }],
].map(([caption, patch]) => (s = { ...s, run: [], ...patch, caption }))
</script>

<template>
  <AnimStepper title="Vue 3 響應式：track 與 trigger" :steps="steps" :interval="2200">
    <template #default="{ step }">
      <pre class="a-code"><span v-for="(l, k) in code" :key="k" :class="{ cur: k === step.line, done: k < step.line }">{{ l }}</span></pre>
      <div class="a-grid vr-grid">
        <div class="a-panel" :class="{ hl: step.op }">
          <span class="a-label">Proxy 攔截</span>
          <span v-if="step.op" class="a-chip" :class="step.op.includes('trigger') ? 'warn' : 'brand'">{{ step.op }}</span>
          <div class="a-mono vr-state">count: {{ step.state.count }}, name: {{ step.state.name }}</div>
        </div>
        <div class="a-panel">
          <span class="a-label">依賴表 targetMap → state</span>
          <div v-for="key in ['count', 'name']" :key="key" class="vr-dep">
            <span class="a-mono">{{ key }} →</span>
            <TransitionGroup name="a-list" tag="span" class="a-chips">
              <span v-for="e in step.deps[key] || []" :key="e" class="a-chip" :class="step.run.includes(e) ? 'warn hl' : 'purple'">{{ e }}</span>
            </TransitionGroup>
          </div>
        </div>
        <div class="a-panel">
          <span class="a-label">effects</span>
          <div class="a-chips">
            <span v-for="e in ['A', 'B', 'C']" :key="e" class="a-chip" :class="step.active === e ? 'brand hl' : step.run.includes(e) ? 'warn hl' : ''">{{ e }}{{ step.run.includes(e) ? ' 重新執行' : step.active === e ? ' 執行中' : '' }}</span>
          </div>
        </div>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.vr-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 10px; }
.vr-dep { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.vr-state { margin-top: 6px; }
@media (max-width: 640px) { .vr-grid { grid-template-columns: 1fr; } }
</style>
