<script setup>
import AnimStepper from './AnimStepper.vue'

const code = [
  "console.log('1')",
  "setTimeout(() => console.log('2'), 0)",
  "Promise.resolve().then(() => console.log('3'))",
  ';(async () => {',
  "  console.log('4')",
  '  await null',
  "  console.log('5')",
  '})()',
  "queueMicrotask(() => console.log('6'))",
  "console.log('7')",
]

let s = { line: -1, stack: [], api: [], micro: [], task: [], out: [], phase: '' }
const steps = [
  ['整段 script 本身就是第一個 <b>task</b>，放上 Call Stack 開始同步執行。', { stack: ['script'], phase: 'sync' }],
  ['同步印出 <code>1</code>。', { line: 0, out: ['1'] }],
  ['<code>setTimeout</code> 交給瀏覽器的計時器（Web API），JS 不等它，繼續往下。', { line: 1, api: ['timer 0ms → log 2'] }],
  ['0ms 到期，callback 被放進 <b>Task Queue</b>。它要等 Call Stack 清空、microtask 也清空才輪得到。', { api: [], task: ['log 2'] }],
  ['<code>.then</code> 的 callback 放進 <b>Microtask Queue</b>。', { line: 2, micro: ['log 3'] }],
  ['async 函式在第一個 <code>await</code> 之前是<b>同步</b>執行的：印出 <code>4</code>。', { line: 4, stack: ['script', 'async fn'], out: ['1', '4'] }],
  ['<code>await</code> 讓函式暫停，剩下的部分（印 5）排進 Microtask Queue，控制權回到 script。', { line: 5, stack: ['script'], micro: ['log 3', 'log 5'] }],
  ['<code>queueMicrotask</code> 直接排進 Microtask Queue。', { line: 8, micro: ['log 3', 'log 5', 'log 6'] }],
  ['同步印出 <code>7</code>。', { line: 9, out: ['1', '4', '7'] }],
  ['script 跑完，Call Stack 清空。Event Loop 規則：<b>先把 Microtask Queue 全部清空</b>。', { line: -1, stack: [], phase: 'micro' }],
  ['執行 microtask：印出 <code>3</code>。', { stack: ['log 3'], micro: ['log 5', 'log 6'], out: ['1', '4', '7', '3'] }],
  ['繼續清：async 函式恢復，印出 <code>5</code>。', { stack: ['log 5'], micro: ['log 6'], out: ['1', '4', '7', '3', '5'] }],
  ['繼續清：印出 <code>6</code>。Microtask Queue 空了，瀏覽器在這裡才有機會渲染畫面。', { stack: ['log 6'], micro: [], out: ['1', '4', '7', '3', '5', '6'] }],
  ['取出<b>一個</b> task 執行：印出 <code>2</code>。', { stack: ['log 2'], task: [], phase: 'task', out: ['1', '4', '7', '3', '5', '6', '2'] }],
  ['完成：<code>1 4 7 3 5 6 2</code>。口訣：同步 → 清空 microtask →（渲染）→ 一個 task → 再清 microtask…', { stack: [], phase: 'done' }],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))
</script>

<template>
  <AnimStepper title="Event Loop：同步 → microtask → task" :steps="steps" :interval="1600">
    <template #default="{ step }">
      <div class="a-grid el-grid">
        <pre class="a-code el-code"><span v-for="(l, k) in code" :key="k" :class="{ cur: k === step.line }">{{ l }}</span></pre>
        <div class="a-panel" :class="{ hl: step.stack.length }">
          <span class="a-label">CALL STACK</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips stack">
            <span v-for="f in step.stack" :key="f" class="a-chip brand">{{ f }}</span>
          </TransitionGroup>
        </div>
        <div class="a-panel">
          <span class="a-label">WEB APIs（瀏覽器）</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips">
            <span v-for="f in step.api" :key="f" class="a-chip warn">{{ f }}</span>
          </TransitionGroup>
        </div>
        <div class="a-panel" :class="{ hl: step.phase === 'micro' }">
          <span class="a-label">MICROTASK QUEUE（每次全部清空）</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips">
            <span v-for="f in step.micro" :key="f" class="a-chip purple">{{ f }}</span>
          </TransitionGroup>
        </div>
        <div class="a-panel" :class="{ hl: step.phase === 'task' }">
          <span class="a-label">TASK QUEUE（一次取一個）</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips">
            <span v-for="f in step.task" :key="f" class="a-chip warn">{{ f }}</span>
          </TransitionGroup>
        </div>
        <div class="a-panel">
          <span class="a-label">CONSOLE</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips">
            <span v-for="(o, k) in step.out" :key="o" class="a-chip" :class="k === step.out.length - 1 ? 'ok' : ''">{{ o }}</span>
          </TransitionGroup>
        </div>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.el-grid { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); }
.el-code { grid-row: span 3; font-size: 0.72em; }
@media (max-width: 640px) {
  .el-grid { grid-template-columns: 1fr; }
  .el-code { grid-row: auto; }
}
</style>
