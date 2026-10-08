/** 预览面板 */

import { useState } from 'react'

/** 预览里的一个文件。有的 agent（比如 Codex）一次产出不止一份 */
export type PreviewFile = {
  name: string
  text: string
}

type PreviewPanelProps = {
  files: PreviewFile[]
  issues: string[]
}

export function PreviewPanel({ files, issues }: PreviewPanelProps) {
  const [buttonLabel, setButtonLabel] = useState('复制')
  const [active, setActive] = useState(0)
  // 文件被删掉时，选中的下标可能越界，夹到合法范围里
  const index = Math.min(active, files.length - 1)
  const current = files[index]
  const hasIssues = issues.length > 0
  // 还没填任何东西的 agent（比如 Codex）产出的就是空文本
  const isEmpty = !current || current.text.trim() === ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(current?.text ?? '')
      setButtonLabel('已复制')
    } catch {
      setButtonLabel('复制失败')
    }
    window.setTimeout(() => setButtonLabel('复制'), 1500)
  }

  return (
    <section className="preview">
      {hasIssues && (
        <ul className="preview__issues">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      {isEmpty ? (
        <p className="empty-hint">还没有内容。</p>
      ) : (
        <>
          {files.length > 1 && (
            <nav className="tabs">
              {files.map((file, i) => (
                <button
                  key={file.name}
                  type="button"
                  className={i === index ? 'tab tab--current' : 'tab'}
                  onClick={() => setActive(i)}
                >
                  {file.name}
                </button>
              ))}
            </nav>
          )}
          <pre className="preview__text">{current.text}</pre>
        </>
      )}

      <button
        type="button"
        className="button--primary preview__copy"
        onClick={copy}
        disabled={hasIssues || isEmpty}
      >
        {buttonLabel}
      </button>
    </section>
  )
}
