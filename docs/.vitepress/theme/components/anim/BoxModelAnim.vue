<script setup>
import AnimStepper from './AnimStepper.vue'

// 所有尺寸以 CSS px 計，畫面上等比縮小 0.8 倍
let s = { sizing: 'content-box', padding: 0, border: 0, margin: 0 }
const steps = [
  ['<code>width: 200px</code>，還沒有 padding 和 border：畫面上的寬度就是 200px。', {}],
  ['加上 <code>padding: 20px</code>：<code>content-box</code>（預設）時 width 只算內容，盒子變成 200 + 20×2 ＝ <b>240px</b>。', { padding: 20 }],
  ['再加 <code>border: 5px</code>：又多 5×2，變成 <b>250px</b>。設計稿寫 200，實際卻是 250，版面就爆了。', { border: 5 }],
  ['改成 <code>box-sizing: border-box</code>：width 改成包含 content + padding + border，外框固定 <b>200px</b>，內容區自動縮成 150px。', { sizing: 'border-box' }],
  ['<code>margin</code> 永遠不算在 width 裡，它是盒子外面的空白；相鄰區塊的垂直 margin 還可能合併。實務上全域設 <code>*, *::before, *::after { box-sizing: border-box }</code>。', { margin: 20 }],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))

const k = 0.8
const content = (st) => (st.sizing === 'content-box' ? 200 : 200 - st.padding * 2 - st.border * 2)
const outer = (st) => content(st) + st.padding * 2 + st.border * 2
</script>

<template>
  <AnimStepper title="Box Model 與 box-sizing" :steps="steps" :interval="2200">
    <template #default="{ step }">
      <p class="a-mono bm-css">.box { box-sizing: {{ step.sizing }}; width: 200px; padding: {{ step.padding }}px; border: {{ step.border }}px solid; margin: {{ step.margin }}px }</p>
      <div class="bm-canvas">
        <div class="bm-ruler" :style="{ width: 200 * k + 'px' }"><span>width: 200px</span></div>
        <div class="bm-margin" :style="{ padding: step.margin * k + 'px' }">
          <div
            class="bm-border"
            :style="{ borderWidth: step.border * k + 'px', padding: step.padding * k + 'px' }"
          >
            <div class="bm-content" :style="{ width: content(step) * k + 'px' }">content<br />{{ content(step) }}px</div>
          </div>
        </div>
      </div>
      <p class="bm-total">實際佔寬 <span class="a-chip" :class="outer(step) === 200 ? 'ok' : 'bad'">{{ outer(step) }}px</span>
        <span class="a-muted">＝ content {{ content(step) }} ＋ padding {{ step.padding * 2 }} ＋ border {{ step.border * 2 }}</span>
        <span v-if="step.margin" class="a-muted">（外加 margin {{ step.margin * 2 }}）</span>
      </p>
    </template>
  </AnimStepper>
</template>

<style scoped>
.bm-css { margin: 0 0 10px; padding: 6px 10px; border-radius: 6px; background: var(--vp-c-bg); white-space: normal; }
.bm-canvas { position: relative; padding: 24px 0 0 16px; }
.bm-ruler { position: absolute; top: 0; left: 16px; height: 14px; border: 1px solid var(--vp-c-text-3); border-bottom: none; transition: all 0.35s; }
.bm-ruler span { position: absolute; top: -2px; left: 50%; transform: translateX(-50%); padding: 0 4px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); font-size: 0.7em; white-space: nowrap; }
.bm-margin { display: inline-block; background: repeating-linear-gradient(45deg, var(--vp-c-yellow-soft) 0 6px, transparent 6px 12px); transition: all 0.35s; }
.bm-border { border-style: solid; border-color: var(--vp-c-text-2); background: linear-gradient(var(--vp-c-green-soft), var(--vp-c-green-soft)) var(--vp-c-bg); transition: all 0.35s; }
.bm-content { box-sizing: border-box; padding: 18px 0; background: linear-gradient(var(--vp-c-brand-soft), var(--vp-c-brand-soft)) var(--vp-c-bg); color: var(--vp-c-brand-1); font-size: 0.75em; text-align: center; transition: all 0.35s; }
.bm-total { margin: 12px 0 0; }
</style>
