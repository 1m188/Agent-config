/** pi 的 Provider 配置卡片 */

import { useAutoAnimate } from '@formkit/auto-animate/react'
import { SelectField, TextField } from '../components/Field'
import { IdField } from '../components/IdField'
import { checkProviderId } from './ids'
import { ModelCard } from './ModelCard'
import type { PiProvider } from './store'
import { usePiStore } from './store'

/** pi 运行时按 api 字符串分发到具体实现，这里收死成内置的六种聊天协议 */
const API_OPTIONS = [
  'openai-completions',
  'openai-responses',
  'azure-openai-responses',
  'anthropic-messages',
  'google-generative-ai',
  'mistral-conversations',
]

type ProviderCardProps = {
  id: string
  provider: PiProvider
  /** 所有 provider 的 id，用来拦重名 */
  allIds: string[]
}

function ApiKeyHint({ apiKey }: { apiKey: string }) {
  const variable = /^\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?$/.exec(apiKey)
  if (variable) {
    return (
      <p className="empty-hint">
        key 本身不写进配置。把它设成环境变量 {variable[1]} 再启动 pi：
        <br />
        setx {variable[1]} "sk-你的key"
      </p>
    )
  }
  if (apiKey.startsWith('!')) {
    return (
      <p className="empty-hint">
        每次需要 key 时 pi 会运行这条命令，用它的标准输出作为 key；
        输出为空或命令失败就取不到。
      </p>
    )
  }
  if (apiKey === '') {
    return (
      <p className="empty-hint">
        第三方 provider 没有内置的环境变量映射，这里必须给一种：$变量名、!命令 或明文。
        本地端点（Ollama 等）填个占位值就行，例如 ollama。
      </p>
    )
  }
  return (
    <p className="empty-hint">
      明文 key 会一直留在这份配置里（预览和复制出去的内容都带着）。
      不想落盘就改成 $变量名 形式。
    </p>
  )
}

export function ProviderCard({ id, provider, allIds }: ProviderCardProps) {
  const renameProvider = usePiStore((state) => state.renameProvider)
  const removeProvider = usePiStore((state) => state.removeProvider)
  const updateProvider = usePiStore((state) => state.updateProvider)
  const addModel = usePiStore((state) => state.addModel)

  const modelIds = provider.models.map((model) => model.id)
  // 模型卡片的增删走平滑动画
  const [modelList] = useAutoAnimate<HTMLDivElement>()

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
        check={checkProviderId}
        onCommit={(next) => renameProvider(id, next)}
      />

      <TextField
        label="显示名称"
        value={provider.name ?? ''}
        placeholder="例如 我的中转"
        onChange={(name) => updateProvider(id, { name })}
      />

      <TextField
        label="API 地址"
        value={provider.baseUrl ?? ''}
        placeholder="https://api.example.com/v1"
        onChange={(baseUrl) => updateProvider(id, { baseUrl })}
      />

      <SelectField
        label="接口协议（api）"
        value={provider.api ?? ''}
        options={API_OPTIONS}
        emptyLabel="（必选）"
        onChange={(api) => updateProvider(id, { api })}
      />

      <TextField
        label="API Key"
        value={provider.apiKey ?? ''}
        placeholder="$MY_API_KEY、!取key的命令 或 sk-..."
        onChange={(apiKey) => updateProvider(id, { apiKey })}
      />
      <ApiKeyHint apiKey={provider.apiKey ?? ''} />

      <div className="card__models">
        <h4 className="card__subtitle">模型</h4>
        <p className="empty-hint">
          这里的模型会出现在 pi 的 /model 选择器里。provider 没有可用凭据时，模型不会出现。
        </p>

        <div className="card-list" ref={modelList}>
          {provider.models.map((model) => (
            <ModelCard key={model.id} providerId={id} model={model} allIds={modelIds} />
          ))}
        </div>

        <button type="button" className="button--ghost" onClick={() => addModel(id)}>
          添加模型
        </button>
      </div>
    </section>
  )
}
