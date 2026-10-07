/** Provider 配置卡片 */

import type { ProviderConfig } from './store'
import { useOpencodeStore } from './store'
import { TextField } from '../components/Field'
import { IdField } from '../components/IdField'
import { ModelCard } from './ModelCard'

/** 官方文档列出的运行时包，作为建议项；也可以自己输入 npm 包名或 file:// 路径 */
const PACKAGE_OPTIONS = [
  '@opencode/ai/providers/openai-compatible',
  '@opencode/ai/providers/openai-compatible/responses',
  '@opencode/ai/providers/openai',
  '@opencode/ai/providers/openai/chat',
  '@opencode/ai/providers/openai/responses',
  '@opencode/ai/providers/anthropic',
  '@opencode/ai/providers/anthropic-compatible',
  '@opencode/ai/providers/google',
  '@opencode/ai/providers/google-vertex',
  '@opencode/ai/providers/google-vertex/gemini',
  '@opencode/ai/providers/google-vertex/chat',
  '@opencode/ai/providers/google-vertex/responses',
  '@opencode/ai/providers/google-vertex/messages',
  '@opencode/ai/providers/azure',
  '@opencode/ai/providers/azure/chat',
  '@opencode/ai/providers/azure/responses',
  '@opencode/ai/providers/amazon-bedrock',
  '@opencode/ai/providers/amazon-bedrock/mantle',
  '@opencode/ai/providers/amazon-bedrock/mantle/chat',
  '@opencode/ai/providers/amazon-bedrock/mantle/responses',
  '@opencode/ai/providers/openrouter',
  '@opencode/ai/providers/xai',
]

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
        forbidden={['/', '#']}
        onCommit={(next) => renameProvider(id, next)}
      />

      <TextField
        label="显示名称"
        value={provider.name ?? ''}
        placeholder="例如 Command Code"
        onChange={(name) => updateProvider(id, { name })}
      />

      <TextField
        label="运行时包"
        value={provider.package ?? ''}
        suggestions={PACKAGE_OPTIONS}
        placeholder="@opencode/ai/providers/openai-compatible"
        onChange={(value) => updateProvider(id, { package: value })}
      />

      <TextField
        label="API 地址"
        value={provider.settings?.baseURL ?? ''}
        placeholder="https://api.example.com/v1"
        onChange={(baseURL) => updateProvider(id, { baseURL })}
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
