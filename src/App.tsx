import { PreviewPanel } from './components/PreviewPanel'
import { Form } from './opencode/Form'
import { useOpencodeStore } from './opencode/store'
import { findIssues } from './opencode/validate'

export default function App() {
  const config = useOpencodeStore((state) => state.config)

  // 预览和"复制"用的是同一份文本，避免两边不一致
  const text = JSON.stringify(config, null, 2)
  const issues = findIssues(config)

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Agent Config</h1>
        <p className="app__subtitle">OpenCode 第三方 Provider 配置生成器</p>
      </header>

      <div className="app__body">
        <main>
          <Form />
        </main>
        <aside>
          <PreviewPanel text={text} issues={issues} />
        </aside>
      </div>
    </div>
  )
}
