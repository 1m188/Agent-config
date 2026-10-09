/** 页面外壳：标题、agent 的 tab，以及当前 agent 的页面。
 *
 * 页面主体由各 agent 自己渲染，外壳只负责选哪个。
 * 各 agent 的 store 是各自独立的单例，切 tab 不会丢另一边的东西。
 */

import { useState } from 'react'
import { CodexPage } from './codex/Page'
import { OpencodePage } from './opencode/Page'
import { PiPage } from './pi/Page'

const TABS = [
  { label: 'OpenCode', Page: OpencodePage },
  { label: 'Codex', Page: CodexPage },
  { label: 'Pi', Page: PiPage },
]

export default function App() {
  const [current, setCurrent] = useState(TABS[0])
  const Page = current.Page

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Agent Config</h1>
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={tab === current ? 'tab tab--current' : 'tab'}
              onClick={() => setCurrent(tab)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <Page />
    </div>
  )
}
