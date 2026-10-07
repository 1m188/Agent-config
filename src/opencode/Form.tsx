/** Opencode配置表单 */

import { useOpencodeStore } from './store'
import { TextField } from '../components/Field'
import { ProviderCard } from './ProviderCard'

export function Form() {
  const config = useOpencodeStore((state) => state.config)
  const setGlobal = useOpencodeStore((state) => state.setGlobal)
  const addProvider = useOpencodeStore((state) => state.addProvider)

  const providers = config.providers ?? {}
  const providerIds = Object.keys(providers)

  return (
    <div className="form">
      <section className="card">
        <h3 className="card__title">全局设置</h3>
        <TextField
          label="默认模型"
          value={config.model ?? ''}
          placeholder="myprovider/my-model"
          onChange={(model) => setGlobal({ model })}
        />
      </section>

      <h2 className="section-title">Provider</h2>

      {providerIds.length === 0 && (
        <p className="empty-hint">
          还没有 Provider。第三方 API 是通过 Provider 接入的，点下面的按钮加一个。
        </p>
      )}

      {providerIds.map((id) => (
        <ProviderCard key={id} id={id} provider={providers[id]} allIds={providerIds} />
      ))}

      <button type="button" className="button--primary" onClick={addProvider}>
        添加 Provider
      </button>
    </div>
  )
}
