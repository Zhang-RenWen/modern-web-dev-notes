<script setup>
// 逐步動畫播放器：每一步是一份完整狀態（snapshot），上一步、下一步、自動播放都只是切換索引。
// 視覺由各動畫元件透過 slot 依目前的 step 畫出來，CSS transition 負責補間。
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  steps: { type: Array, required: true },
  interval: { type: Number, default: 1800 },
})

const i = ref(0)
const playing = ref(false)
let timer = null

const step = computed(() => props.steps[i.value])
const last = computed(() => props.steps.length - 1)

function stop() {
  playing.value = false
  clearInterval(timer)
  timer = null
}
function go(n) {
  stop()
  i.value = Math.max(0, Math.min(last.value, n))
}
function tick() {
  if (i.value < last.value) i.value++
  else stop()
}
function toggle() {
  if (playing.value) return stop()
  if (i.value >= last.value) i.value = 0
  playing.value = true
  timer = setInterval(tick, props.interval)
}
function onKey(e) {
  if (e.key === 'ArrowRight') go(i.value + 1)
  else if (e.key === 'ArrowLeft') go(i.value - 1)
  else return
  e.preventDefault()
}
onBeforeUnmount(stop)
</script>

<template>
  <figure class="anim" tabindex="0" :aria-label="`動畫：${title}，可用左右方向鍵逐步播放`" @keydown="onKey">
    <figcaption class="anim-head">
      <span class="anim-title">{{ title }}</span>
      <span class="anim-count">{{ i + 1 }} / {{ steps.length }}</span>
    </figcaption>
    <div class="anim-stage">
      <slot :step="step" :index="i" />
    </div>
    <p class="anim-caption" aria-live="polite" v-html="step.caption" />
    <div class="anim-controls">
      <button type="button" class="anim-btn" aria-label="從頭開始" @click="go(0)">⏮</button>
      <button type="button" class="anim-btn" aria-label="上一步" :disabled="i === 0" @click="go(i - 1)">◀</button>
      <button type="button" class="anim-btn anim-play" @click="toggle">{{ playing ? '⏸ 暫停' : '▶ 播放' }}</button>
      <button type="button" class="anim-btn" aria-label="下一步" :disabled="i === last" @click="go(i + 1)">▶</button>
      <div class="anim-progress">
        <button
          v-for="(s, k) in steps"
          :key="k"
          type="button"
          :class="{ on: k <= i }"
          :aria-label="`跳到第 ${k + 1} 步`"
          @click="go(k)"
        />
      </div>
    </div>
  </figure>
</template>
