<script setup>
import AnimStepper from './AnimStepper.vue'

// A：1 秒成功、B：2 秒失敗、C：3 秒成功
const inputs = [
  { id: 'A', at: 1, ok: true, value: 'a' },
  { id: 'B', at: 2, ok: false, value: 'Error b' },
  { id: 'C', at: 3, ok: true, value: 'c' },
]
const status = (p, t) => (t < p.at ? 'pending' : p.ok ? 'fulfilled' : 'rejected')

function combine(t) {
  const st = inputs.map((p) => status(p, t))
  const settled = inputs.filter((p, k) => st[k] !== 'pending').sort((a, b) => a.at - b.at)
  const firstOk = settled.find((p) => p.ok)
  const firstBad = settled.find((p) => !p.ok)
  return {
    all: firstBad ? ['rejected', firstBad.value] : st.every((x) => x === 'fulfilled') ? ['fulfilled', "['a','b','c']"] : ['pending', ''],
    allSettled: st.every((x) => x !== 'pending') ? ['fulfilled', '[{fulfilled:a}, {rejected:b}, {fulfilled:c}]'] : ['pending', ''],
    race: settled[0] ? [settled[0].ok ? 'fulfilled' : 'rejected', settled[0].value] : ['pending', ''],
    any: firstOk ? ['fulfilled', firstOk.value] : ['pending', ''],
  }
}
const captions = [
  '三個請求同時發出：A 會在 1 秒成功、B 在 2 秒失敗、C 在 3 秒成功。四種組合方法都還在等。',
  't = 1s，A 成功：<code>race</code> 取「第一個結束的」→ 成功 a；<code>any</code> 取「第一個成功的」→ 也是 a。',
  't = 2s，B 失敗：<code>all</code> 只要有一個失敗就<b>立刻 reject</b>，不等 C。',
  't = 3s，C 成功：<code>allSettled</code> 等到<b>全部結束</b>才完成，而且不會 reject，每個結果各自標示成功或失敗。',
]
const steps = [0, 1, 2, 3].map((t) => ({ t, caption: captions[t], st: inputs.map((p) => status(p, t)), out: combine(t) }))
const cls = (x) => ({ pending: '', fulfilled: 'ok', rejected: 'bad' })[x]
</script>

<template>
  <AnimStepper title="Promise.all／allSettled／race／any" :steps="steps" :interval="2000">
    <template #default="{ step }">
      <div class="a-col">
        <div v-for="(p, k) in inputs" :key="p.id" class="pa-row">
          <span class="a-mono pa-name">{{ p.id }}</span>
          <div class="a-track pa-track">
            <div class="a-bar" :style="{ left: '0', width: (Math.min(step.t, p.at) / 3) * 100 + '%', background: step.st[k] === 'rejected' ? 'var(--vp-c-red-soft)' : 'var(--vp-c-brand-soft)' }" />
            <div class="a-dot" :style="{ left: (p.at / 3) * 100 + '%', background: step.st[k] === 'pending' ? 'var(--vp-c-divider)' : p.ok ? 'var(--vp-c-green-1)' : 'var(--vp-c-red-1)' }" />
          </div>
          <span class="a-chip" :class="cls(step.st[k])">{{ step.st[k] }}</span>
        </div>
        <p class="a-muted pa-t">時間 t = {{ step.t }}s</p>
        <div class="a-grid pa-out">
          <div v-for="(v, name) in step.out" :key="name" class="a-panel" :class="{ hl: v[0] !== 'pending' }">
            <span class="a-label">Promise.{{ name }}</span>
            <span class="a-chip" :class="cls(v[0])">{{ v[0] }}</span>
            <div v-if="v[1]" class="a-mono pa-val">{{ v[1] }}</div>
          </div>
        </div>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.pa-row { display: grid; grid-template-columns: 24px minmax(0, 1fr) 84px; align-items: center; gap: 8px; }
.pa-row .a-chip { justify-content: center; }
.pa-t { margin: 0; text-align: right; }
.pa-out { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.pa-val { margin-top: 6px; font-size: 0.75em; word-break: break-all; }
@media (max-width: 640px) { .pa-out { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
