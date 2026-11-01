import { defineConfig } from 'vitepress'
import { sidebar } from './sidebar.js'

const GA_ID = 'G-BEVZJDBC7Z'

export default defineConfig({
  base: '/modern-web-dev-notes/',
  lang: 'zh-TW',
  title: 'Modern WEB Dev Notes',
  description: '前端工程知識點與現代 JavaScript 開發筆記',
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', href: '/modern-web-dev-notes/favicon.ico' }],
    ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` }],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`
    ]
  ],
  markdown: {
    lineNumbers: true,
    math: true
  },
  themeConfig: {
    sidebar,
    outline: { level: [2, 4], label: '本頁目錄' },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜尋', buttonAriaLabel: '搜尋' },
          modal: {
            noResultsText: '找不到結果',
            resetButtonTitle: '清除',
            footer: { selectText: '選擇', navigateText: '切換', closeText: '關閉' }
          }
        }
      }
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Zhang-RenWen/modern-web-dev-notes' }],
    docFooter: { prev: '上一頁', next: '下一頁' },
    sidebarMenuLabel: '目錄',
    returnToTopLabel: '回到頂部',
    darkModeSwitchLabel: '外觀',
    lightModeSwitchTitle: '切換至淺色模式',
    darkModeSwitchTitle: '切換至深色模式'
  }
})
