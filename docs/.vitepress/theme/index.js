import DefaultTheme from 'vitepress/theme'
import SectionToc from './components/SectionToc.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SectionToc', SectionToc)
  }
}
