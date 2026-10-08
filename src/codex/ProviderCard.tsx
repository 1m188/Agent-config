/** Codex 的接入点配置卡片 */

import { TextField } from '../components/Field'
import { IdField } from '../components/IdField'
import { checkProviderId } from './ids'
import type { CodexProvider } from './store'
import { useCodexStore } from './store'

type ProviderCardProps = {
  id: string
  provider: CodexProvider
  /** 所有接入点的 id，用来拦重名 */
  allIds: string[]
}

export function ProviderCard({ id, provider, allIds }: ProviderCardProps) {
  const renameProvider = useCodexStore((state) => state.renameProvider)
  const removeProvider = useCodexStore((state) => state.removeProvider)
  const updateProvider = useCodexStore((state) => state.updateProvider)

  return (
    <section className="card">
      <header className="card__header">
        <h3 className="card__title">接入点</h3>
        <button type="button" className="card__remove" onClick={() => removeProvider(id)}>
          删除
        </button>
      </header>

      <IdField
        label="接入点 ID"
        value={id}
        takenIds={allIds.filter((other) => other !== id)}
        check={checkProviderId}
        onCommit={(next) => renameProvider(id, next)}
      />

      <TextField
        label="显示名称"
        value={provider.name ?? ''}
        placeholder="例如 DeepSeek"
        onChange={(name) => updateProvider(id, { name })}
      />

      <TextField
        label="API 地址"
        value={provider.base_url ?? ''}
        placeholder="https://api.example.com/v1"
        onChange={(base_url) => updateProvider(id, { base_url })}
      />

      <TextField
        label="API Key 的环境变量名"
        value={provider.env_key ?? ''}
        placeholder="例如 MY_API_KEY"
        onChange={(env_key) => updateProvider(id, { env_key })}
      />

      {provider.env_key ? (
        <p className="empty-hint">
          key 本身不写进配置。把它设成环境变量 {provider.env_key} 再重启 Codex：
          <br />
          setx {provider.env_key} "sk-你的key"
        </p>
      ) : (
        <p className="empty-hint">
          这里填的是环境变量的名字，不是 key 本身——key 设成那个变量就行：
          <br />
          setx MY_API_KEY "sk-你的key"
        </p>
      )}

      <TextField
        label="API Key（明文写进配置）"
        value={provider.experimental_bearer_token ?? ''}
        placeholder="sk-..."
        onChange={(experimental_bearer_token) =>
          updateProvider(id, { experimental_bearer_token })
        }
      />

      <p className="empty-hint">
        Codex 官方不建议明文存 key，和上面的环境变量二选一。填了它就不用再设环境变量，
        但这份配置里（包括预览和复制出去的内容）就会一直带着 key。
      </p>

      <TextField
        label="给用户的说明"
        value={provider.env_key_instructions ?? ''}
        placeholder="到哪拿 key、设成哪个变量"
        onChange={(env_key_instructions) => updateProvider(id, { env_key_instructions })}
      />
    </section>
  )
}
