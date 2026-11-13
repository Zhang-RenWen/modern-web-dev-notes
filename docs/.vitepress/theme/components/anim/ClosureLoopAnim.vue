<script setup>
import AnimStepper from './AnimStepper.vue'

// envs：作用域裡的 i；cbs：排進 task queue 的 callback，ref 指向它閉包到的那個 i
let s = { mode: 'var', envs: [], cbs: [], out: [], running: -1 }
const steps = [
  ['<code>var</code> 版：<code>var i</code> 是<b>函式作用域</b>，整個迴圈只有<b>一個</b> <code>i</code>。', { mode: 'var', envs: [{ id: 'v', v: 0 }] }],
  ['第 1 圈：建立 callback，它閉包到的是「那個 <code>i</code>」這個變數本身，不是當下的值 0。', { cbs: [{ id: 'a', ref: 'v' }] }],
  ['第 2、3 圈：同一個 <code>i</code> 變成 1、2；三個 callback 都指向它。', { envs: [{ id: 'v', v: 2 }], cbs: [{ id: 'a', ref: 'v' }, { id: 'b', ref: 'v' }, { id: 'c', ref: 'v' }] }],
  ['<code>i++</code> 變成 3，條件不成立，迴圈結束。<code>setTimeout</code> 的 callback 要等同步程式跑完才執行。', { envs: [{ id: 'v', v: 3 }] }],
  ['三個 callback 依序執行，讀到的都是同一個 <code>i</code>：印出 <code>3 3 3</code>。', { running: 3, out: ['3', '3', '3'] }],
  ['<code>let</code> 版：<code>let</code> 是<b>區塊作用域</b>，而且 for 迴圈<b>每一圈都建立新的 <code>i</code></b>。', { mode: 'let', envs: [{ id: 'l0', v: 0 }], cbs: [{ id: 'd', ref: 'l0' }], out: [], running: -1 }],
  ['第 2 圈：新的作用域、新的 <code>i = 1</code>，callback 閉包到這一個。', { envs: [{ id: 'l0', v: 0 }, { id: 'l1', v: 1 }], cbs: [{ id: 'd', ref: 'l0' }, { id: 'e', ref: 'l1' }] }],
  ['第 3 圈同理。三個 callback 各自記住自己那一圈的 <code>i</code>。', { envs: [{ id: 'l0', v: 0 }, { id: 'l1', v: 1 }, { id: 'l2', v: 2 }], cbs: [{ id: 'd', ref: 'l0' }, { id: 'e', ref: 'l1' }, { id: 'f', ref: 'l2' }] }],
  ['執行時各讀各的：印出 <code>0 1 2</code>。閉包＝函式＋它被建立時的作用域；作用域被 callback 引用就不會被回收。', { running: 3, out: ['0', '1', '2'] }],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))

const color = (ref) => ({ v: 'warn', l0: 'brand', l1: 'ok', l2: 'purple' })[ref]
</script>

<template>
  <AnimStepper title="閉包：var 與 let 的迴圈" :steps="steps" :interval="2000">
    <template #default="{ step }">
      <pre class="a-code"><span>for ({{ step.mode }} i = 0; i &lt; 3; i++) {</span><span>  setTimeout(() =&gt; console.log(i), 0)</span><span>}</span></pre>
      <div class="a-grid cl-grid">
        <div class="a-panel">
          <span class="a-label">{{ step.mode === 'var' ? '函式作用域（只有一個 i）' : '每一圈的區塊作用域' }}</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips">
            <span v-for="e in step.envs" :key="e.id" class="a-chip" :class="color(e.id)">i = {{ e.v }}</span>
          </TransitionGroup>
        </div>
        <div class="a-panel">
          <span class="a-label">TASK QUEUE 裡的 callback（顏色＝閉包到哪個 i）</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips">
            <span v-for="c in step.cbs" :key="c.id" class="a-chip" :class="[color(c.ref), { hl: step.running > 0 }]">() =&gt; log(i)</span>
          </TransitionGroup>
        </div>
        <div class="a-panel">
          <span class="a-label">CONSOLE</span>
          <TransitionGroup name="a-list" tag="div" class="a-chips">
            <span v-for="(o, k) in step.out" :key="step.mode + k" class="a-chip ok">{{ o }}</span>
          </TransitionGroup>
        </div>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.cl-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 10px; }
@media (max-width: 640px) { .cl-grid { grid-template-columns: 1fr; } }
</style>
