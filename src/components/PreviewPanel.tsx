/** 预览面板 */

import { useState } from 'react'

type PreviewPanelProps = {
  text: string
  issues: string[]
}

export function PreviewPanel({ text, issues }: PreviewPanelProps) {
  const [buttonLabel, setButtonLabel] = useState('复制')
  const hasIssues = issues.length > 0

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
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

      <pre className="preview__text">{text}</pre>

      <button
        type="button"
        className="button--primary preview__copy"
        onClick={copy}
        disabled={hasIssues}
      >
        {buttonLabel}
      </button>
    </section>
  )
}
