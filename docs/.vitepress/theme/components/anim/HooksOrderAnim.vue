<script setup>
import AnimStepper from './AnimStepper.vue'

const code = [
  'function Profile({ showAge }) {',
  "  const [name, setName] = useState('Ann')",
  '  if (showAge) {',
  '    const [age, setAge] = useState(18)   // ❌ 放在條件裡',
  '  }',
  "  useEffect(() => { document.title = name }, [name])",
  '}',
]
const slots = [
  { k: 0, label: "useState → 'Ann'" },
  { k: 1, label: 'useState → 18' },
  { k: 2, label: 'useEffect → [name]' },
]
// render：第幾次渲染；calls：這次呼叫到第幾個 hook 與它讀到的格子
let s = { render: 1, show: true, line: 0, calls: [], cursor: -1, error: false }
const steps = [
  ['React 不認 hook 的名字，只認<b>呼叫順序</b>：每個元件的 Fiber 上有一條鏈結串列，第 n 個 hook 對應第 n 格。第 1 次渲染，<code>showAge = true</code>。', { line: 0 }],
  ['第 1 個 hook：<code>useState(\'Ann\')</code> 建立第 0 格。', { line: 1, calls: [{ want: 'name', slot: 0 }], cursor: 0 }],
  ['條件成立，第 2 個 hook：<code>useState(18)</code> 建立第 1 格。', { line: 3, calls: [{ want: 'name', slot: 0 }, { want: 'age', slot: 1 }], cursor: 1 }],
  ['第 3 個 hook：<code>useEffect</code> 建立第 2 格。鏈結串列：name → age → effect。', { line: 5, calls: [{ want: 'name', slot: 0 }, { want: 'age', slot: 1 }, { want: 'effect', slot: 2 }], cursor: 2 }],
  ['第 2 次渲染，<code>showAge</code> 變成 false。React 從第 0 格開始依序讀取。', { render: 2, show: false, line: 0, calls: [], cursor: -1 }],
  ['第 1 個 hook <code>useState</code> 讀第 0 格 → name，對得上。', { line: 1, calls: [{ want: 'name', slot: 0 }], cursor: 0 }],
  ['條件不成立，<code>useState(18)</code> 沒被呼叫。下一個呼叫的是 <code>useEffect</code>，但 React 給它的是<b>第 1 格（age 的 state）</b>：錯位了。', { line: 5, calls: [{ want: 'name', slot: 0 }, { want: 'effect', slot: 1, bad: true }], cursor: 1, error: true }],
  ['React 會丟出「Rendered fewer hooks than expected」之類的錯誤；更糟的是錯位卻沒報錯時，狀態會對錯人。所以 hook 只能放在元件頂層，條件寫在 hook <b>裡面</b>（<code>useEffect(() => { if (showAge) … })</code>）。ESLint 的 <code>rules-of-hooks</code> 會擋。', { line: -1 }],
].map(([caption, patch]) => (s = { ...s, ...patch, caption }))
</script>

<template>
  <AnimStepper title="Hooks 為什麼不能放在條件裡" :steps="steps" :interval="2200">
    <template #default="{ step }">
      <pre class="a-code"><span v-for="(l, k) in code" :key="k" :class="{ cur: k === step.line, done: !step.show && (k === 3) }">{{ l }}</span></pre>
      <p class="a-muted ho-render">第 {{ step.render }} 次渲染 · showAge = {{ step.show }}</p>
      <div class="ho-list">
        <template v-for="sl in slots" :key="sl.k">
          <div class="a-panel ho-slot" :class="{ hl: step.cursor === sl.k, dim: step.cursor >= 0 && sl.k > step.cursor && step.render === 2 }">
            <span class="a-label">hook #{{ sl.k }}</span>
            <span class="a-mono">{{ sl.label }}</span>
          </div>
          <span v-if="sl.k < 2" class="a-arrow">→</span>
        </template>
      </div>
      <div class="a-chips ho-calls">
        <span v-for="(c, k) in step.calls" :key="step.render + '-' + k" class="a-chip" :class="c.bad ? 'bad hl' : 'ok'">
          第 {{ k + 1 }} 個呼叫（{{ c.want }}）→ 讀 #{{ c.slot }}{{ c.bad ? '（拿到 age！）' : '' }}
        </span>
      </div>
    </template>
  </AnimStepper>
</template>

<style scoped>
.ho-render { margin: 8px 0; }
.ho-list { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.ho-slot { min-width: 150px; }
.ho-calls { margin-top: 10px; }
</style>
