/** 页面外壳：吸顶顶栏（标题、agent 的 tab、主题切换），以及当前 agent 的页面。
 *
 * 页面主体由各 agent 自己渲染，外壳只负责选哪个。
 * 各 agent 的 store 是各自独立的单例，切 tab 不会丢另一边的东西。
 */

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { CodexPage } from './codex/Page'
import { OpencodePage } from './opencode/Page'
import { PiPage } from './pi/Page'
import {
  applyTheme,
  loadPreference,
  resolveTheme,
  savePreference,
  type ThemePreference,
} from './theme'

const TABS = [
  { label: 'OpenCode', Page: OpencodePage },
  { label: 'Codex', Page: CodexPage },
  { label: 'Pi', Page: PiPage },
]

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '白天' },
  { value: 'dark', label: '黑夜' },
]

export default function App() {
  const [current, setCurrent] = useState(TABS[0])
  const [preference, setPreference] = useState<ThemePreference>(loadPreference)
  const Page = current.Page

  // 偏好是 system 时监听系统深浅变化，页面即时跟着变；手动选定后只应用一次
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => applyTheme(resolveTheme(preference, media.matches))
    apply()
    if (preference !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  const pickTheme = (value: ThemePreference) => {
    savePreference(value)
    setPreference(value)
  }

  // 切 tab 走 View Transitions 交叉淡入；不支持的浏览器退化为即时切换
  const switchTab = (tab: (typeof TABS)[number]) => {
    document.startViewTransition?.(() => {
      flushSync(() => setCurrent(tab))
    })
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <h1 className="topbar__title">Agent Config</h1>
          <nav className="tabs" aria-label="Agent">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                className={tab === current ? 'tab tab--current' : 'tab'}
                onClick={() => switchTab(tab)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="theme-switch" role="group" aria-label="主题">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  option.value === preference
                    ? 'theme-switch__option theme-switch__option--current'
                    : 'theme-switch__option'
                }
                onClick={() => pickTheme(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="app">
        <Page />
      </div>
    </>
  )
}
