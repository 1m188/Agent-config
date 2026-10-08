/** 页面主体：左边表单，右边预览。
 *
 * 所有 agent 共用这一份布局，各 agent 只负责把表单和预览文本交进来。
 */

import type { ReactNode } from 'react'
import { PreviewPanel } from './PreviewPanel'

type AgentBodyProps = {
  form: ReactNode
  text: string
  issues: string[]
}

export function AgentBody({ form, text, issues }: AgentBodyProps) {
  return (
    <div className="app__body">
      <main>{form}</main>
      <aside>
        <PreviewPanel text={text} issues={issues} />
      </aside>
    </div>
  )
}
