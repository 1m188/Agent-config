/** OpenCode 页：读自己的 store，把表单和预览文本交给外壳的布局。 */

import { AgentBody } from '../components/AgentBody'
import { Form } from './Form'
import { toPreviewText } from './preview'
import { useOpencodeStore } from './store'
import { findIssues } from './validate'

export function OpencodePage() {
  const config = useOpencodeStore((state) => state.config)

  return (
    <AgentBody form={<Form />} text={toPreviewText(config)} issues={findIssues(config)} />
  )
}
