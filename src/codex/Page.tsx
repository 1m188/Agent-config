/** Codex 页：读自己的 store，表单和预览的布局也归自己管。
 *
 * 这份配置是两个文件：config.toml + 模型目录 models.json（后者加了目录模型才有），
 * 所以预览里会出现两个标签。
 */

import { PreviewPanel, type PreviewFile } from '../components/PreviewPanel'
import { Form } from './Form'
import { toPreviewText } from './preview'
import { toCatalogJson, useCodexStore } from './store'
import { findIssues } from './validate'

export function CodexPage() {
  const config = useCodexStore((state) => state.config)
  const extras = useCodexStore((state) => state.extras)
  const catalogModels = useCodexStore((state) => state.catalogModels)

  const files: PreviewFile[] = [
    { name: 'config.toml', text: toPreviewText(config, extras) },
    { name: 'models.json', text: toCatalogJson(catalogModels) ?? '' },
  ].filter((file) => file.text.trim() !== '')

  return (
    <div className="app__body">
      <main>
        <Form />
      </main>
      <aside>
        <PreviewPanel files={files} issues={findIssues(config, catalogModels)} />
      </aside>
    </div>
  )
}
