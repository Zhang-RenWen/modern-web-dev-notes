import DefaultTheme from 'vitepress/theme'
import SectionToc from './components/SectionToc.vue'
import './custom.css'
import './anim.css'

// 模擬面試的動畫解析元件：components/anim/*Anim.vue，檔名即元件名（例如 <EventLoopAnim />）
const anims = import.meta.glob('./components/anim/*Anim.vue', { eager: true })

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SectionToc', SectionToc)
    for (const [file, mod] of Object.entries(anims)) {
      app.component(file.split('/').pop().replace('.vue', ''), mod.default)
    }
  }
}
