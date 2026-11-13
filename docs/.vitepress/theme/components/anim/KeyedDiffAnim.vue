<script setup>
import AnimStepper from './AnimStepper.vue'

// rows：畫面上每一列 = 一個被復用或新建的 DOM 節點；label 來自資料，input 是 DOM 自己的狀態
let s = { mode: 'index', rows: [], note: '' }
const before = [
  { node: 'n1', label: '蘋果', input: '買 3 顆' },
  { node: 'n2', label: '香蕉', input: '' },
]
const steps = [
  ['清單有「蘋果」「香蕉」兩列，使用者在蘋果那列的輸入框打了「買 3 顆」。輸入框的值是 <b>DOM 節點自己的狀態</b>，不在資料裡。先看用 <code>index</code> 當 key。', { mode: 'index', rows: before }],
  ['在最前面插入「芒果」。新資料：芒果、蘋果、香蕉，key 是 0、1、2。', { rows: before, note: '新資料：[芒果, 蘋果, 香蕉]' }],
  ['Vue 比對 key：key 0 還在 → <b>就地復用節點 n1</b>，只把文字改成「芒果」；key 1 復用 n2 改成「蘋果」；key 2 是新的，建立 n3。結果「買 3 顆」跑到芒果那列 ❌。', { rows: [{ node: 'n1', label: '芒果', input: '買 3 顆', bad: true }, { node: 'n2', label: '蘋果', input: '' }, { node: 'n3', label: '香蕉', input: '', isNew: true }] }],
  ['改用穩定的業務 ID 當 key，重來一次。', { mode: 'id', rows: before, note: '' }],
  ['插入芒果：key「apple」「banana」都還在，Vue 知道它們只是<b>移位</b>，把節點整個搬過去；只為「mango」建立新節點。「買 3 顆」留在蘋果 ✅。', { rows: [{ node: 'n3', label: '芒果', input: '', isNew: true }, { node: 'n1', label: '蘋果', input: '買 3 顆' }, { node: 'n2', label: '香蕉', input: '' }] }],
  ['結論：key 讓 diff 認得「同一個節點」。用 index 當 key，在插入、刪除、排序時會讓節點、元件狀態、動畫錯位；key 要用穩定且唯一的 ID，不要用 index 或亂數。', {}],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))
</script>

<template>
  <AnimStepper title="v-for／列表 key：index vs 穩定 ID" :steps="steps" :interval="2400">
    <template #default="{ step }">
      <p class="a-mono kd-code">&lt;li v-for="(item, i) in list" :key="{{ step.mode === 'index' ? 'i' : 'item.id' }}"&gt;{{ '{' + '{ item.name }' + '}' }} &lt;input /&gt;&lt;/li&gt;</p>
      <TransitionGroup name="a-list" tag="div" class="a-col">
        <div v-for="r in step.rows" :key="r.node" class="a-panel kd-row" :class="{ hl: r.bad || r.isNew }">
          <span class="a-chip" :class="r.isNew ? 'ok' : 'purple'">{{ r.isNew ? '新建 ' : '復用 ' }}{{ r.node }}</span>
          <b>{{ r.label }}</b>
          <span class="kd-input" :class="{ bad: r.bad }">{{ r.input || '　' }}</span>
        </div>
      </TransitionGroup>
      <p v-if="step.note" class="a-muted kd-note">{{ step.note }}</p>
    </template>
  </AnimStepper>
</template>

<style scoped>
.kd-code { margin: 0 0 10px; padding: 6px 10px; border-radius: 6px; background: var(--vp-c-bg); white-space: normal; }
.kd-row { display: grid; grid-template-columns: 96px 56px minmax(0, 1fr); align-items: center; gap: 10px; }
.kd-input { padding: 2px 8px; border: 1px solid var(--vp-c-divider); border-radius: 4px; background: var(--vp-c-bg-soft); font-size: 0.85em; }
.kd-input.bad { border-color: var(--vp-c-red-1); color: var(--vp-c-red-1); }
.kd-note { margin: 8px 0 0; }
</style>
