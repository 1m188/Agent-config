/** pi 配置表单 */

import { useRef, useState } from 'react'
import { parseModelsJson } from './load'
import { ProviderCard } from './ProviderCard'
import { usePiStore } from './store'

type FileStatus = {
  text: string
  bad: boolean
}

export function Form() {
  const providers = usePiStore((state) => state.providers)
  const addProvider = usePiStore((state) => state.addProvider)
  const loadProviders = usePiStore((state) => state.loadProviders)

  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<FileStatus | null>(null)

  const providerIds = Object.keys(providers)

  /** 读一个 models.json 进来，整体替换当前配置。失败了只报错，现在的配置一动不动。 */
  async function readFile(file: File) {
    try {
      const parsed = parseModelsJson(await file.text())
      loadProviders(parsed.providers)
      setStatus({ text: `已读取 ${file.name}`, bad: false })
    } catch (error) {
      setStatus({ text: `${file.name}：${(error as Error).message}`, bad: true })
    }
  }

  return (
    <div className="form">
      <p className="form__status">
        生成 ~/.pi/agent/models.json 的内容：第三方 provider、模型和 key（$变量名 形式）都在这一个文件里。
        pi 内置的 provider（DeepSeek、Anthropic 这些）用 /login 或环境变量就行，不用这里配。
      </p>

      <div className="form__read">
        <button
          type="button"
          className="button--ghost"
          onClick={() => fileInput.current?.click()}
        >
          读取配置文件
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.jsonc"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            // 立刻清空，否则再选同一个文件不会再触发 change
            event.target.value = ''
            if (file) void readFile(file)
          }}
        />
        {status && (
          <p className={status.bad ? 'form__status form__status--bad' : 'form__status'}>
            {status.text}
          </p>
        )}
      </div>

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
