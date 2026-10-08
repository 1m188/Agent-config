/** OpenCode 页：读自己的 store，表单和预览的布局也归自己管。 */

import { PreviewPanel } from '../components/PreviewPanel'
import { Form } from './Form'
import { toPreviewText } from './preview'
import { useOpencodeStore } from './store'
import { findIssues } from './validate'

export function OpencodePage() {
  const config = useOpencodeStore((state) => state.config)

  return (
    <div className="app__body">
      <main>
        <Form />
      </main>
      <aside>
        <PreviewPanel
          files={[{ name: 'opencode.jsonc', text: toPreviewText(config) }]}
          issues={findIssues(config)}
        />
      </aside>
    </div>
  )
}
