/** Opencode配置表单 */

import { useRef, useState } from 'react'
import { useOpencodeStore } from './store'
import { TextField } from '../components/Field'
import { ProviderCard } from './ProviderCard'
import { parseConfig } from './load'

type FileStatus = {
  text: string
  bad: boolean
}

export function Form() {
  const config = useOpencodeStore((state) => state.config)
  const setGlobal = useOpencodeStore((state) => state.setGlobal)
  const addProvider = useOpencodeStore((state) => state.addProvider)
  const loadConfig = useOpencodeStore((state) => state.loadConfig)

  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<FileStatus | null>(null)

  const providers = config.providers ?? {}
  const providerIds = Object.keys(providers)

  /** 读一个文件进来，整体替换当前配置。失败了只报错，现在的配置一动不动。 */
  async function readFile(file: File) {
    try {
      loadConfig(parseConfig(await file.text()))
      setStatus({ text: `已读取 ${file.name}`, bad: false })
    } catch (error) {
      setStatus({ text: `${file.name}：${(error as Error).message}`, bad: true })
    }
  }

  return (
    <div className="form">
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
