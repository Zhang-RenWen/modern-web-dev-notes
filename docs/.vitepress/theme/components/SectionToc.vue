<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

// 依目前頁面路徑，從 sidebar 找出同 link 的節點，列出它的子項目
const { page, theme } = useData()

const findNode = (items, link) => {
  for (const item of items || []) {
    if (!item) continue
    if (item.link === link) return item
    const found = findNode(item.items, link)
    if (found) return found
  }
}

const children = computed(() => {
  const link = '/' + page.value.relativePath.replace(/\.md$/, '')
  return (findNode(theme.value.sidebar, link)?.items || []).filter(Boolean)
})
</script>

<template>
  <nav v-if="children.length" class="section-toc" aria-label="本節目錄">
    <a v-for="item in children" :key="item.link" class="section-toc-item" :href="withBase(item.link)">
      {{ item.text }}
    </a>
  </nav>
</template>

<style scoped>
.section-toc {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin: 24px 0;
}

.vp-doc .section-toc-item {
  display: block;
  padding: 12px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  font-weight: 500;
  text-decoration: none;
  transition: border-color 0.2s, background-color 0.2s;
}

.vp-doc .section-toc-item:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
}
</style>
