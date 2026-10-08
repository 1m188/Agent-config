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

      <TextField
        label="给用户的说明"
        value={provider.env_key_instructions ?? ''}
        placeholder="到哪拿 key、设成哪个变量"
        onChange={(env_key_instructions) => updateProvider(id, { env_key_instructions })}
      />
    </section>
  )
}
