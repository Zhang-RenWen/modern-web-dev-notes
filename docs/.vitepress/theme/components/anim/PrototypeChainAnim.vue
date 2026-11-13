<script setup>
import AnimStepper from './AnimStepper.vue'

const chain = [
  { id: 'obj', name: 'lucky', props: ['name: "Lucky"'] },
  { id: 'proto', name: 'Dog.prototype', props: ['bark()', 'constructor'] },
  { id: 'op', name: 'Object.prototype', props: ['toString()', 'hasOwnProperty()'] },
  { id: 'null', name: 'null', props: [] },
]
let s = { show: 0, linked: false, ctor: false, visit: [], found: '', q: '', result: '' }
const steps = [
  ['<code>new Dog("Lucky")</code> 第 1 步：建立一個空物件。', { show: 1 }],
  ['第 2 步：把它的 <code>[[Prototype]]</code> 指向 <code>Dog.prototype</code>，原型鏈就接起來了。', { show: 4, linked: true }],
  ['第 3 步：以新物件為 <code>this</code> 執行 <code>Dog</code>，<code>this.name = name</code> 寫進物件自己身上。第 4 步：建構子沒回傳物件，所以回傳這個新物件。', { ctor: true }],
  ['讀 <code>lucky.name</code>：物件<b>自己</b>就有，直接回傳。', { q: 'lucky.name', visit: ['obj'], found: 'obj', result: '"Lucky"' }],
  ['讀 <code>lucky.bark</code>：自己沒有 → 沿 <code>[[Prototype]]</code> 往上，在 <code>Dog.prototype</code> 找到。', { q: 'lucky.bark', visit: ['obj', 'proto'], found: 'proto', result: 'function bark' }],
  ['讀 <code>lucky.toString</code>：再往上一層，在 <code>Object.prototype</code> 找到。', { q: 'lucky.toString', visit: ['obj', 'proto', 'op'], found: 'op', result: 'function toString' }],
  ['讀 <code>lucky.fly</code>：一路找到 <code>null</code> 都沒有 → <code>undefined</code>。這條找屬性的路線就是<b>原型鏈</b>；<code>class</code> 只是它的語法糖。', { q: 'lucky.fly', visit: ['obj', 'proto', 'op', 'null'], found: '', result: 'undefined' }],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))
</script>

<template>
  <AnimStepper title="原型鏈：new 做了什麼、屬性怎麼找" :steps="steps" :interval="2000">
    <template #default="{ step }">
      <div class="pc-wrap">
        <template v-for="(n, k) in chain" :key="n.id">
          <div
            v-if="k < step.show"
            class="a-panel pc-node"
            :class="{ hl: step.found === n.id, dim: step.visit.length && !step.visit.includes(n.id) }"
          >
            <span class="a-label">{{ n.name }}</span>
            <div class="a-chips">
              <template v-if="n.id === 'obj'">
                <span v-if="step.ctor" class="a-chip brand">name: "Lucky"</span>
                <span v-else class="a-muted">{}（空物件）</span>
              </template>
              <span v-for="p in n.id === 'obj' ? [] : n.props" :key="p" class="a-chip">{{ p }}</span>
            </div>
          </div>
          <span v-if="k < step.show - 1 && step.linked" class="a-arrow pc-link">[[Prototype]] ↓</span>
        </template>
      </div>
      <p v-if="step.q" class="a-mono pc-q">{{ step.q }} → <b>{{ step.result }}</b></p>
    </template>
  </AnimStepper>
</template>

<style scoped>
.pc-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.pc-node { min-width: 240px; }
.pc-link { align-self: flex-start; font-size: 0.75em; padding-left: 12px; }
.pc-q { margin: 10px 0 0; }
</style>
