/** Provider 配置卡片 */

import type { ProviderConfig } from './store'
import { useOpencodeStore } from './store'
import { TextField } from '../components/Field'
import { IdField } from '../components/IdField'
import { ModelCard } from './ModelCard'

type ProviderCardProps = {
  id: string
  provider: ProviderConfig
  /** 所有 provider 的 id，用来拦重名 */
  allIds: string[]
}

export function ProviderCard({ id, provider, allIds }: ProviderCardProps) {
  const renameProvider = useOpencodeStore((state) => state.renameProvider)
  const removeProvider = useOpencodeStore((state) => state.removeProvider)
  const updateProvider = useOpencodeStore((state) => state.updateProvider)
  const addModel = useOpencodeStore((state) => state.addModel)

  const models = provider.models ?? {}
  const modelIds = Object.keys(models)

  return (
    <section className="card">
      <header className="card__header">
        <h3 className="card__title">Provider</h3>
        <button type="button" className="card__remove" onClick={() => removeProvider(id)}>
          删除
        </button>
      </header>

      <IdField
        label="Provider ID"
        value={id}
        takenIds={allIds.filter((other) => other !== id)}
        onCommit={(next) => renameProvider(id, next)}
      />

      <TextField
        label="显示名称"
        value={provider.name ?? ''}
        onChange={(name) => updateProvider(id, { name })}
      />

      <TextField
        label="npm 包名"
        value={provider.npm ?? ''}
        placeholder="@ai-sdk/openai-compatible"
        onChange={(npm) => updateProvider(id, { npm })}
      />

      <TextField
        label="API 地址"
        value={provider.options?.baseURL ?? ''}
        onChange={(baseURL) => updateProvider(id, { baseURL })}
      />

      <TextField
        label="API 密钥"
        value={provider.options?.apiKey ?? ''}
        onChange={(apiKey) => updateProvider(id, { apiKey })}
      />

      <div className="card__models">
        <h4 className="card__subtitle">模型</h4>

        {modelIds.map((modelId) => (
          <ModelCard
            key={modelId}
            providerId={id}
            modelId={modelId}
            model={models[modelId]}
            allIds={modelIds}
          />
        ))}

        <button type="button" className="button--ghost" onClick={() => addModel(id)}>
          添加模型
        </button>
      </div>
    </section>
  )
}
