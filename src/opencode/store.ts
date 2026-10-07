/** Opencode配置对象
 * 全局单例
 * 界面显示、复制导出等功能全从这唯一数据源算出来
 */

import { create } from 'zustand'

/** 一个模型在配置里的样子。只列出我们目前会写入的字段。 */
export type ModelConfig = {
  id?: string
  name?: string
  limit?: {
    context?: number
    output?: number
  }
  attachment?: boolean
  reasoning?: boolean
  tool_call?: boolean
}

/** 一个 provider 在配置里的样子。 */
export type ProviderConfig = {
  name?: string
  npm?: string
  options?: {
    baseURL?: string
    apiKey?: string
  }
  models?: Record<string, ModelConfig>
}

/** 整份 OpenCode 配置。$schema 固定带一行，其余按需出现。 */
export type OpencodeConfig = {
  $schema: string
  model?: string
  small_model?: string
  provider?: Record<string, ProviderConfig>
}

const SCHEMA_URL = 'https://opencode.ai/config.json'

function createInitialConfig(): OpencodeConfig {
  return { $schema: SCHEMA_URL }
}

/**
 * 把补丁合并进一个对象。
 *
 * - 补丁里**没提到**的键，原样不动；
 * - 补丁里值为 `undefined` / 空字符串 / `false` 的，表示"这个字段是空的"，对应的键会被删掉。
 */
function mergePatch<T extends object>(base: T, patch: object): T {
  const next = { ...base } as Record<string, unknown>
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === '' || value === false) {
      delete next[key]
    } else {
      next[key] = value
    }
  }
  return next as unknown as T
}

/**
 * 从补丁里挑出**确实被提到**的键。
 *
 * 必须按"键在不在"判断，不能按"值是不是 undefined"判断：调用方写
 * `{ apiKey: '' }` 表示只清 apiKey，而 `updateProvider` 关心的另一个键
 * `baseURL` 这时根本不在补丁里，不能被顺手一起清掉。
 */
function pickMentioned(patch: object, keys: string[]): Record<string, unknown> {
  const source = patch as Record<string, unknown>
  const picked: Record<string, unknown> = {}
  for (const key of keys) {
    if (key in source) picked[key] = source[key]
  }
  return picked
}

/**
 * 把 value 写进 target[key]；如果 value 是个空对象，就改成把这个键删掉。
 *
 * 只用在**内置容器**上（provider / models / options / limit）——它们空了就没有
 * 存在的意义。代表界面卡片的条目本身不适用：一张刚添加、还没填任何内容的卡片
 * 就是空对象，但它必须留着，否则卡片会当场消失。
 */
function setOrDrop(target: object, key: string, value: object): void {
  const record = target as Record<string, unknown>
  if (Object.keys(value).length > 0) record[key] = value
  else delete record[key]
}

/** 取一个还没被占用的名字，形如 prefix-1、prefix-2…… */
function nextName(used: Set<string>, prefix: string): string {
  let n = 1
  while (used.has(`${prefix}-${n}`)) n += 1
  return `${prefix}-${n}`
}

/** 改名时保持键在原来的位置上，免得卡片在界面上跳来跳去。 */
function renameKey<T>(
  record: Record<string, T>,
  oldKey: string,
  newKey: string,
): Record<string, T> {
  const next: Record<string, T> = {}
  for (const [key, value] of Object.entries(record)) {
    next[key === oldKey ? newKey : key] = value
  }
  return next
}

type OpencodeStore = {
  /** 唯一的配置对象。界面和预览都由它算出来。 */
  config: OpencodeConfig

  setGlobal: (patch: { model?: string; small_model?: string }) => void

  addProvider: () => void
  removeProvider: (id: string) => void
  renameProvider: (oldId: string, newId: string) => void
  updateProvider: (
    id: string,
    patch: { name?: string; npm?: string; baseURL?: string; apiKey?: string },
  ) => void

  addModel: (providerId: string) => void
  removeModel: (providerId: string, modelId: string) => void
  renameModel: (providerId: string, oldId: string, newId: string) => void
  updateModel: (
    providerId: string,
    modelId: string,
    patch: {
      name?: string
      attachment?: boolean
      reasoning?: boolean
      tool_call?: boolean
      context?: number | undefined
      output?: number | undefined
    },
  ) => void
}

export const useOpencodeStore = create<OpencodeStore>()((set) => ({
  config: createInitialConfig(),

  setGlobal: (patch) => set((state) => ({ config: mergePatch(state.config, patch) })),

  addProvider: () =>
    set((state) => {
      const provider = state.config.provider ?? {}
      const id = nextName(new Set(Object.keys(provider)), 'provider')
      return { config: { ...state.config, provider: { ...provider, [id]: {} } } }
    }),

  removeProvider: (id) =>
    set((state) => {
      const provider = state.config.provider
      if (!provider) return {}
      const next = { ...provider }
      delete next[id]
      const config = { ...state.config }
      setOrDrop(config, 'provider', next)
      return { config }
    }),

  renameProvider: (oldId, newId) =>
    set((state) => {
      const provider = state.config.provider
      if (!provider || oldId === newId) return {}
      return { config: { ...state.config, provider: renameKey(provider, oldId, newId) } }
    }),

  updateProvider: (id, patch) =>
    set((state) => {
      const provider = state.config.provider
      const current = provider?.[id]
      if (!provider || !current) return {}

      // name / npm 在 provider 这一层，baseURL / apiKey 在 options 里
      const next = mergePatch(current, pickMentioned(patch, ['name', 'npm']))
      const optionsPatch = pickMentioned(patch, ['baseURL', 'apiKey'])
      if (Object.keys(optionsPatch).length > 0) {
        setOrDrop(next, 'options', mergePatch(current.options ?? {}, optionsPatch))
      }

      return { config: { ...state.config, provider: { ...provider, [id]: next } } }
    }),

  addModel: (providerId) =>
    set((state) => {
      const provider = state.config.provider
      const current = provider?.[providerId]
      if (!provider || !current) return {}

      const models = current.models ?? {}
      const modelId = nextName(new Set(Object.keys(models)), 'model')

      return {
        config: {
          ...state.config,
          provider: {
            ...provider,
            [providerId]: { ...current, models: { ...models, [modelId]: {} } },
          },
        },
      }
    }),

  removeModel: (providerId, modelId) =>
    set((state) => {
      const provider = state.config.provider
      const current = provider?.[providerId]
      const models = current?.models
      if (!provider || !current || !models) return {}

      const nextModels = { ...models }
      delete nextModels[modelId]

      const nextProvider = { ...current }
      setOrDrop(nextProvider, 'models', nextModels)

      return {
        config: {
          ...state.config,
          provider: { ...provider, [providerId]: nextProvider },
        },
      }
    }),

  renameModel: (providerId, oldId, newId) =>
    set((state) => {
      const provider = state.config.provider
      const current = provider?.[providerId]
      const models = current?.models
      if (!provider || !current || !models || oldId === newId) return {}

      // 键名和模型自己的 id 用同一个值，改一次两边一起改
      const renamed = renameKey(models, oldId, newId)
      renamed[newId] = { ...renamed[newId], id: newId }

      return {
        config: {
          ...state.config,
          provider: { ...provider, [providerId]: { ...current, models: renamed } },
        },
      }
    }),

  updateModel: (providerId, modelId, patch) =>
    set((state) => {
      const provider = state.config.provider
      const current = provider?.[providerId]
      const model = current?.models?.[modelId]
      if (!provider || !current || !model) return {}

      // name / 三个开关在模型这一层，context / output 在 limit 里
      const next = mergePatch(
        model,
        pickMentioned(patch, ['name', 'attachment', 'reasoning', 'tool_call']),
      )
      const limitPatch = pickMentioned(patch, ['context', 'output'])
      if (Object.keys(limitPatch).length > 0) {
        setOrDrop(next, 'limit', mergePatch(model.limit ?? {}, limitPatch))
      }

      return {
        config: {
          ...state.config,
          provider: {
            ...provider,
            [providerId]: {
              ...current,
              models: { ...current.models, [modelId]: next },
            },
          },
        },
      }
    }),
}))
