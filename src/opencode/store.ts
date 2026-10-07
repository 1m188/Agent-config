/** Opencode配置对象
 * 全局单例
 * 界面显示、复制导出等功能全从这唯一数据源算出来
 */

import { create } from 'zustand'

/** 模型的一个思考档位。id 就是档位名，settings.reasoningEffort 用同一个值。 */
export type ModelVariant = {
  id: string
  settings: { reasoningEffort: string }
}

/** 一个模型在配置里的样子。只列出我们目前会写入的字段。 */
export type ModelConfig = {
  /** 真正发给上游的模型/部署 ID。不写就沿用键名。 */
  modelID?: string
  name?: string
  limit?: {
    context?: number
    output?: number
  }
  capabilities?: {
    tools?: boolean
    input?: string[]
    output?: string[]
  }
  settings?: {
    reasoningEffort?: string
  }
  variants?: ModelVariant[]
  compatibility?: {
    reasoningField?: string
  }
}

/** 一个 provider 在配置里的样子。 */
export type ProviderConfig = {
  name?: string
  /** 运行时包，例如 @opencode/ai/providers/openai-compatible */
  package?: string
  settings?: {
    baseURL?: string
  }
  models?: Record<string, ModelConfig>
}

/** 整份 OpenCode v2 配置。$schema 固定带一行，其余按需出现。 */
export type OpencodeConfig = {
  $schema: string
  model?: string
  providers?: Record<string, ProviderConfig>
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
 *
 * 注意 `capabilities.tools` 不走这里：它的缺省含义是"支持"，
 * 所以"不写"不等于"假"，那个字段由 updateModel 单独写显式的 true/false。
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
 * `{ baseURL: '' }` 表示只清 baseURL，而同一层的另一个键这时根本不在补丁里，
 * 不能被顺手一起清掉。
 */
function pickMentioned(patch: object, keys: string[]): Record<string, unknown> {
  const source = patch as Record<string, unknown>
  const picked: Record<string, unknown> = {}
  for (const key of keys) {
    if (key in source) picked[key] = source[key]
  }
  return picked
}

/** 把补丁里的键换成配置里的真实键名。 */
function remap(
  patch: Record<string, unknown>,
  mapping: Record<string, string>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    next[mapping[key] ?? key] = value
  }
  return next
}

/**
 * 把 value 写进 target[key]；如果 value 是空的（空对象或空数组），就改成把这个键删掉。
 *
 * 只用在**内置容器**上（providers / models / settings / capabilities / limit /
 * compatibility / variants）——它们空了就没有存在的意义。代表界面卡片的条目本身
 * 不适用：一张刚添加、还没填内容的卡片就是空对象，但它必须留着，否则卡片会当场消失。
 */
function setOrDrop(target: object, key: string, value: object | unknown[]): void {
  const record = target as Record<string, unknown>
  const isEmpty = Array.isArray(value)
    ? value.length === 0
    : Object.keys(value).length === 0
  if (isEmpty) delete record[key]
  else record[key] = value
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

  setGlobal: (patch: { model?: string }) => void

  addProvider: () => void
  removeProvider: (id: string) => void
  renameProvider: (oldId: string, newId: string) => void
  updateProvider: (
    id: string,
    patch: { name?: string; package?: string; baseURL?: string },
  ) => void

  addModel: (providerId: string) => void
  removeModel: (providerId: string, modelId: string) => void
  renameModel: (providerId: string, oldId: string, newId: string) => void
  updateModel: (
    providerId: string,
    modelId: string,
    patch: {
      modelID?: string
      name?: string
      limitContext?: number | undefined
      limitOutput?: number | undefined
      tools?: boolean
      inputMedia?: string[]
      outputMedia?: string[]
      reasoningField?: string
    },
  ) => void

  setModelTiers: (providerId: string, modelId: string, tiers: string[]) => void
  setModelDefaultTier: (providerId: string, modelId: string, tier: string) => void
}

export const useOpencodeStore = create<OpencodeStore>()((set) => {
  /** 把一个新的模型对象写回它所属的 provider。 */
  const writeModel = (
    state: OpencodeStore,
    providerId: string,
    modelId: string,
    model: ModelConfig,
  ) => {
    const providers = state.config.providers
    const provider = providers?.[providerId]
    if (!providers || !provider) return {}
    return {
      config: {
        ...state.config,
        providers: {
          ...providers,
          [providerId]: {
            ...provider,
            models: { ...provider.models, [modelId]: model },
          },
        },
      },
    }
  }

  return {
    config: createInitialConfig(),

    setGlobal: (patch) => set((state) => ({ config: mergePatch(state.config, patch) })),

    addProvider: () =>
      set((state) => {
        const providers = state.config.providers ?? {}
        const id = nextName(new Set(Object.keys(providers)), 'provider')
        return { config: { ...state.config, providers: { ...providers, [id]: {} } } }
      }),

    removeProvider: (id) =>
      set((state) => {
        const providers = state.config.providers
        if (!providers) return {}
        const next = { ...providers }
        delete next[id]
        const config = { ...state.config }
        setOrDrop(config, 'providers', next)
        return { config }
      }),

    renameProvider: (oldId, newId) =>
      set((state) => {
        const providers = state.config.providers
        if (!providers || oldId === newId) return {}
        return { config: { ...state.config, providers: renameKey(providers, oldId, newId) } }
      }),

    updateProvider: (id, patch) =>
      set((state) => {
        const providers = state.config.providers
        const current = providers?.[id]
        if (!providers || !current) return {}

        // name / package 在 provider 这一层，baseURL 在 settings 里
        const next = mergePatch(current, pickMentioned(patch, ['name', 'package']))
        const settingsPatch = pickMentioned(patch, ['baseURL'])
        if (Object.keys(settingsPatch).length > 0) {
          setOrDrop(next, 'settings', mergePatch(current.settings ?? {}, settingsPatch))
        }

        return { config: { ...state.config, providers: { ...providers, [id]: next } } }
      }),

    addModel: (providerId) =>
      set((state) => {
        const providers = state.config.providers
        const current = providers?.[providerId]
        if (!providers || !current) return {}

        const models = current.models ?? {}
        const modelId = nextName(new Set(Object.keys(models)), 'model')

        return {
          config: {
            ...state.config,
            providers: {
              ...providers,
              [providerId]: {
                ...current,
                models: {
                  ...models,
                  // 工具调用是 OpenCode 场景下的默认能力，新卡片直接按"支持"起步
                  [modelId]: { capabilities: { tools: true } },
                },
              },
            },
          },
        }
      }),

    removeModel: (providerId, modelId) =>
      set((state) => {
        const providers = state.config.providers
        const current = providers?.[providerId]
        const models = current?.models
        if (!providers || !current || !models) return {}

        const nextModels = { ...models }
        delete nextModels[modelId]

        const nextProvider = { ...current }
        setOrDrop(nextProvider, 'models', nextModels)

        return {
          config: {
            ...state.config,
            providers: { ...providers, [providerId]: nextProvider },
          },
        }
      }),

    renameModel: (providerId, oldId, newId) =>
      set((state) => {
        const providers = state.config.providers
        const current = providers?.[providerId]
        const models = current?.models
        if (!providers || !current || !models || oldId === newId) return {}

        // 键名是 OpenCode 用的模型 ID，modelID 是发给上游的 ID。
        // 改键只改引用名，不动 modelID——这正是 v2 把两者分开的意义。
        const renamed = renameKey(models, oldId, newId)

        return {
          config: {
            ...state.config,
            providers: { ...providers, [providerId]: { ...current, models: renamed } },
          },
        }
      }),

    updateModel: (providerId, modelId, patch) =>
      set((state) => {
        const providers = state.config.providers
        const provider = providers?.[providerId]
        const model = provider?.models?.[modelId]
        if (!providers || !provider || !model) return {}

        const next = mergePatch(model, pickMentioned(patch, ['modelID', 'name']))

        const limitPatch = pickMentioned(patch, ['limitContext', 'limitOutput'])
        if (Object.keys(limitPatch).length > 0) {
          setOrDrop(
            next,
            'limit',
            mergePatch(
              model.limit ?? {},
              remap(limitPatch, { limitContext: 'context', limitOutput: 'output' }),
            ),
          )
        }

        const capPatch = pickMentioned(patch, ['inputMedia', 'outputMedia'])
        if ('tools' in patch || Object.keys(capPatch).length > 0) {
          const capabilities = mergePatch(
            model.capabilities ?? {},
            remap(capPatch, { inputMedia: 'input', outputMedia: 'output' }),
          )
          // tools 缺省含义是"支持"，所以必须写显式的真/假
          if ('tools' in patch) capabilities.tools = patch.tools === true
          setOrDrop(next, 'capabilities', capabilities)
        }

        const compatPatch = pickMentioned(patch, ['reasoningField'])
        if (Object.keys(compatPatch).length > 0) {
          setOrDrop(
            next,
            'compatibility',
            mergePatch(model.compatibility ?? {}, compatPatch),
          )
        }

        return writeModel(state, providerId, modelId, next)
      }),

    setModelTiers: (providerId, modelId, tiers) =>
      set((state) => {
        const providers = state.config.providers
        const provider = providers?.[providerId]
        const model = provider?.models?.[modelId]
        if (!providers || !provider || !model) return {}

        const next: ModelConfig = { ...model }
        setOrDrop(
          next,
          'variants',
          tiers.map((tier) => ({ id: tier, settings: { reasoningEffort: tier } })),
        )

        // 默认档位必须来自已选档位；档位被去掉时，默认也要跟着去掉
        const currentDefault = model.settings?.reasoningEffort
        if (currentDefault !== undefined && !tiers.includes(currentDefault)) {
          setOrDrop(next, 'settings', mergePatch(model.settings ?? {}, {
            reasoningEffort: '',
          }))
        }

        return writeModel(state, providerId, modelId, next)
      }),

    setModelDefaultTier: (providerId, modelId, tier) =>
      set((state) => {
        const providers = state.config.providers
        const provider = providers?.[providerId]
        const model = provider?.models?.[modelId]
        if (!providers || !provider || !model) return {}

        const next: ModelConfig = { ...model }
        setOrDrop(
          next,
          'settings',
          mergePatch(model.settings ?? {}, { reasoningEffort: tier }),
        )

        return writeModel(state, providerId, modelId, next)
      }),
  }
})
