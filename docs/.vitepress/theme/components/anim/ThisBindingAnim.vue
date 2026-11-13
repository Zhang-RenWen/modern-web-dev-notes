<script setup>
import AnimStepper from './AnimStepper.vue'

const rules = [
  { id: 'arrow', name: '箭頭函式？', desc: '沒有自己的 this，用外層的' },
  { id: 'new', name: '1. new 呼叫？', desc: 'this ＝ 新建立的物件' },
  { id: 'explicit', name: '2. call／apply／bind？', desc: 'this ＝ 指定的物件' },
  { id: 'implicit', name: '3. obj.fn() 呼叫？', desc: 'this ＝ 點前面的物件' },
  { id: 'default', name: '4. 直接呼叫 fn()', desc: '嚴格模式 undefined，否則 globalThis' },
]
const order = rules.map((r) => r.id)
const calls = [
  { code: 'new Person("A")', hit: 'new', result: '新的 Person 物件', note: '<code>new</code> 優先權最高，就算 <code>bind</code> 過也會被 <code>new</code> 蓋過。' },
  { code: 'greet.call(user)', hit: 'explicit', result: 'user', note: '<code>call</code>／<code>apply</code> 指定 this；<code>bind</code> 回傳的函式之後再 <code>call</code> 也改不了。' },
  { code: 'obj.normal()', hit: 'implicit', result: 'obj', note: '看<b>呼叫當下</b>點前面是誰，不看函式定義在哪裡。' },
  { code: 'const fn = obj.normal; fn()', hit: 'default', result: 'undefined（ES module 為嚴格模式）', note: '方法被取出來單獨呼叫，<b>隱式綁定遺失</b>，掉到預設綁定。' },
  { code: 'setTimeout(obj.normal)', hit: 'default', result: 'undefined／globalThis', note: '傳 callback 一樣只傳了函式本身，obj 不見了。修法：<code>() =&gt; obj.normal()</code> 或 <code>obj.normal.bind(obj)</code>。' },
  { code: 'obj.arrow()', hit: 'arrow', result: '外層作用域的 this', note: '箭頭函式先判斷：它根本沒有自己的 this，四條規則都不適用，<code>call</code>／<code>bind</code> 也改不了。' },
]
const steps = calls.flatMap((c) => {
  const idx = order.indexOf(c.hit)
  const checks = c.hit === 'arrow' ? ['arrow'] : order.slice(0, idx + 1)
  return [
    { caption: `呼叫 <code>${c.code}</code>：由上往下檢查規則，第一個符合的決定 this。`, code: c.code, checked: checks.slice(0, -1), hit: '', result: '' },
    { caption: c.note, code: c.code, checked: checks.slice(0, -1), hit: c.hit, result: c.result },
  ]
})
</script>

<template>
  <AnimStepper title="this 由「怎麼呼叫」決定" :steps="steps" :interval="1900">
    <template #default="{ step }">
      <p class="a-mono tb-call">{{ step.code }}</p>
      <div class="a-col">
        <div
          v-for="r in rules"
          :key="r.id"
          class="a-panel tb-rule"
          :class="{ hl: step.hit === r.id, dim: step.checked.includes(r.id) }"
        >
          <b>{{ r.name }}</b><span class="a-muted">　{{ step.checked.includes(r.id) ? '不符合，往下' : r.desc }}</span>
        </div>
      </div>
      <p class="tb-result">this ＝ <span class="a-chip ok" :class="{ dim: !step.result }">{{ step.result || '…' }}</span></p>
    </template>
  </AnimStepper>
</template>

<style scoped>
.tb-call { margin: 0 0 10px; padding: 6px 10px; border-radius: 6px; background: var(--vp-c-bg); }
.tb-rule { padding: 6px 10px; }
.tb-result { margin: 10px 0 0; }
</style>
