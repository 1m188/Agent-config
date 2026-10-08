/** Codex配置表单 */

import { useRef, useState } from 'react'
import { SelectField, TextField } from '../components/Field'
import { BUILT_IN_PROVIDER_IDS } from './ids'
import { CatalogModelCard } from './CatalogModelCard'
import { parseCatalog, parseConfig } from './load'
import { ProviderCard } from './ProviderCard'
import { useCodexStore } from './store'

/** Codex 模型目录里实际出现的档位（gpt-5.5 到 gpt-6.1 各档的并集） */
const TIER_OPTIONS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra']

type FileStatus = {
  text: string
  bad: boolean
}

export function Form() {
  const config = useCodexStore((state) => state.config)
  const catalogModels = useCodexStore((state) => state.catalogModels)
  const setGlobal = useCodexStore((state) => state.setGlobal)
  const addProvider = useCodexStore((state) => state.addProvider)
  const addCatalogModel = useCodexStore((state) => state.addCatalogModel)
  const loadConfig = useCodexStore((state) => state.loadConfig)
  const loadCatalogModels = useCodexStore((state) => state.loadCatalogModels)

  const configInput = useRef<HTMLInputElement>(null)
  const catalogInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<FileStatus | null>(null)

  const providers = config.model_providers ?? {}
  const providerIds = Object.keys(providers)
  const catalogSlugs = catalogModels.map((model) => model.slug)

  /** 读 config.toml，整体替换当前配置。失败了只报错，现在的配置一动不动。 */
  async function readConfig(file: File) {
    try {
      const parsed = parseConfig(await file.text())
      loadConfig(parsed.config, parsed.extras)
      setStatus({
        text: parsed.config.model_catalog_json
          ? `已读取 ${file.name}，它还指向一个模型目录，点下面的按钮把它也读进来`
          : `已读取 ${file.name}`,
        bad: false,
      })
    } catch (error) {
      setStatus({ text: `${file.name}：${(error as Error).message}`, bad: true })
    }
  }

  /** 读 config.toml 指向的那个模型目录文件 */
  async function readCatalog(file: File) {
    try {
      const models = parseCatalog(await file.text())
      loadCatalogModels(models)
      setStatus({ text: `已读取 ${file.name}（${models.length} 个模型）`, bad: false })
    } catch (error) {
      setStatus({ text: `${file.name}：${(error as Error).message}`, bad: true })
    }
  }

  return (
    <div className="form">
      <p className="form__status">
        生成两份内容：一份贴进 ~/.codex/config.toml，一份存成模型目录文件
      </p>

      <div className="form__read">
        <button
          type="button"
          className="button--ghost"
          onClick={() => configInput.current?.click()}
        >
          读取配置文件
        </button>
        <input
          ref={configInput}
          type="file"
          accept=".toml"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            // 立刻清空，否则再选同一个文件不会再触发 change
            event.target.value = ''
            if (file) void readConfig(file)
          }}
        />
        {config.model_catalog_json && (
          <>
            <button
              type="button"
              className="button--ghost"
              onClick={() => catalogInput.current?.click()}
            >
              读取它指向的模型目录
            </button>
            <input
              ref={catalogInput}
              type="file"
              accept=".json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void readCatalog(file)
              }}
            />
          </>
        )}
        {status && (
          <p className={status.bad ? 'form__status form__status--bad' : 'form__status'}>
            {status.text}
          </p>
        )}
      </div>

      <section className="card">
        <h3 className="card__title">模型</h3>

        <SelectField
          label="默认模型"
          value={config.model ?? ''}
          // 当前值可能来自刚读进来的配置，而它的目录还没读——选项里得带上它，否则下拉显示不出来
          options={[...new Set([...catalogSlugs, ...(config.model ? [config.model] : [])])]}
          emptyLabel="（不指定）"
          disabled={catalogSlugs.length === 0 && !config.model}
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
