/** pi 页：读自己的 store，表单和预览的布局也归自己管。
 *
 * pi 只需要一份 models.json，预览里只有一个文件。
 */

import { PreviewPanel } from '../components/PreviewPanel'
import { Form } from './Form'
import { toPreviewText } from './preview'
import { usePiStore } from './store'
import { findIssues } from './validate'

export function PiPage() {
  const providers = usePiStore((state) => state.providers)

  return (
    <div className="app__body">
      <main>
        <Form />
      </main>
      <aside>
        <PreviewPanel
          files={[{ name: 'models.json', text: toPreviewText(providers) }]}
          issues={findIssues(providers)}
        />
      </aside>
    </div>
  )
}
