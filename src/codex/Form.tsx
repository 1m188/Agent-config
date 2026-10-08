/** Codex配置表单 */

import { SelectField, TextField } from '../components/Field'
import { BUILT_IN_PROVIDER_IDS } from './ids'
import { CatalogModelCard } from './CatalogModelCard'
import { ProviderCard } from './ProviderCard'
import { useCodexStore } from './store'

/** Codex 模型目录里实际出现的档位（gpt-5.5 到 gpt-6.1 各档的并集） */
const TIER_OPTIONS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra']

export function Form() {
  const config = useCodexStore((state) => state.config)
  const catalogModels = useCodexStore((state) => state.catalogModels)
  const setGlobal = useCodexStore((state) => state.setGlobal)
  const addProvider = useCodexStore((state) => state.addProvider)
  const addCatalogModel = useCodexStore((state) => state.addCatalogModel)

  const providers = config.model_providers ?? {}
  const providerIds = Object.keys(providers)
  const catalogSlugs = catalogModels.map((model) => model.slug)

  return (
    <div className="form">
      <p className="form__status">
        生成两份内容：一份贴进 ~/.codex/config.toml，一份存成模型目录文件
      </p>

      <section className="card">
        <h3 className="card__title">模型</h3>

        <SelectField
          label="默认模型"
          value={config.model ?? ''}
          options={catalogSlugs}
          emptyLabel="（不指定）"
          disabled={catalogSlugs.length === 0}
          onChange={(model) => setGlobal({ model })}
        />

        <SelectField
          label="走哪个接入点"
          value={config.model_provider ?? ''}
          options={[...providerIds, ...BUILT_IN_PROVIDER_IDS]}
          emptyLabel="不指定（用 openai）"
          onChange={(model_provider) => setGlobal({ model_provider })}
        />

        <TextField
          label="思考档位"
          value={config.model_reasoning_effort ?? ''}
          suggestions={TIER_OPTIONS}
          placeholder="例如 high"
          onChange={(model_reasoning_effort) => setGlobal({ model_reasoning_effort })}
        />

        <TextField
          label="模型目录存到哪（完整路径）"
          value={config.model_catalog_json ?? ''}
          placeholder="C:\Users\你\.codex\models.json"
          onChange={(model_catalog_json) => setGlobal({ model_catalog_json })}
        />
      </section>

      <h2 className="section-title">接入点</h2>

      {providerIds.length === 0 && (
        <p className="empty-hint">
          还没有接入点。第三方 API 是通过接入点接的，点下面的按钮加一个。
        </p>
      )}

      {providerIds.map((id) => (
        <ProviderCard key={id} id={id} provider={providers[id]} allIds={providerIds} />
      ))}

      <button type="button" className="button--primary" onClick={addProvider}>
        添加接入点
      </button>

      <h2 className="section-title">模型目录</h2>

      <p className="empty-hint">
        这里列出的模型会出现在 Codex 的 /model 选择器里，每个模型带自己的思考档位。
        不加的话，自定义模型不会出现在 /model 里。
      </p>

      {catalogModels.map((model) => (
        <CatalogModelCard
          key={model.slug}
          slug={model.slug}
          model={model}
          allSlugs={catalogSlugs}
        />
      ))}

      <button type="button" className="button--primary" onClick={addCatalogModel}>
        添加目录模型
      </button>
    </div>
  )
}
