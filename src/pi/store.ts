/** pi 的配置对象（~/.pi/agent/models.json）
 * 全局单例
 * 界面显示、复制导出等功能全从这唯一数据源算出来
 */

import { create } from 'zustand'

/**
 * 模型的兼容性设置。
 *
 * pi 的 compat 有三十多个键、分三套形态（按 api 不同），界面上只编辑
 * 第三方接入最常用的两个；其余键读文件时进 extras，原样保留。
 */
export type PiModelCompat = {
  /** 思考内容怎么放进请求，例如 deepseek、qwen、openai */
  thinkingFormat?: string
  /** 上游认哪个输出上限字段：max_tokens 或 max_completion_tokens */
  maxTokensField?: string
  /** compat 里我们不编辑的其余键，读文件时原样带进来 */
  extras?: Record<string, unknown>
}

/** 一个模型在配置里的样子。只列出我们目前会写入的字段。 */
export type PiModel = {
  /** 发给上游的模型 ID。models 是数组，id 就是身份 */
  id: string
  name?: string
  /** 支持思考。false 和不写对 pi 等价，所以只在 true 时落盘 */
  reasoning?: boolean
  /**
   * pi 的思考档位到 provider 真实值的映射。
   * 键是 pi 的档位（off/minimal/low/medium/high/xhigh/max），
   * 值为字符串是映射值、null 是该档禁用；整个映射不写表示原样透传。
   */
  thinkingLevelMap?: Record<string, string | null>
  /** 接受的输入类型：text / image */
  input?: string[]
  contextWindow?: number
  maxTokens?: number
  compat?: PiModelCompat
  /** 配置里我们不编辑的其余字段（cost、inputLimits、api、baseUrl 这些），原样保留 */
  extras?: Record<string, unknown>
}

/** 一个 provider 在配置里的样子。 */
export type PiProvider = {
  name?: string
  /** API 地址。对内置 provider 同名覆盖时，它会重定向该 provider 的全部模型 */
  baseUrl?: string
  /**
   * API Key。支持三种形态：$VAR / ${VAR} 环境变量插值、!command 命令输出、明文。
   * 自定义 provider 没有内置的环境变量映射，没有它模型不会出现在 /model 里。
   */
  apiKey?: string
  /** 接口协议：openai-completions、openai-responses、anthropic-messages 等 */
  api?: string
  models: PiModel[]
  /** 配置里我们不编辑的其余字段（headers、compat、modelOverrides、oauth 这些），原样保留 */
  extras?: Record<string, unknown>
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
 * `{ baseUrl: '' }` 表示只清 baseUrl，而同一层的另一个键这时根本不在补丁里，
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

/**
 * 把 value 写进 target[key]；如果 value 是空的（空对象或空数组），就改成把这个键删掉。
 *
 * 只用在**内置容器**上（thinkingLevelMap / compat / input）——它们空了就没有存在的意义。
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

type PiStore = {
  /** 唯一的配置对象：models.json 的 providers 部分。界面和预览都由它算出来。 */
  providers: Record<string, PiProvider>

  /** 用一份从文件读来的配置整体替换当前配置。文件里我们不认识的字段跟着一起进来，
   *  之后每个动作只替换自己动过的那一层，所以它们会一直留到预览和复制里。 */
  loadProviders: (providers: Record<string, PiProvider>) => void

  addProvider: () => void
  removeProvider: (id: string) => void
  renameProvider: (oldId: string, newId: string) => void
  updateProvider: (
    id: string,
    patch: { name?: string; baseUrl?: string; apiKey?: string; api?: string },
  ) => void

  addModel: (providerId: string) => void
  removeModel: (providerId: string, modelId: string) => void
  renameModel: (providerId: string, oldId: string, newId: string) => void
  updateModel: (
    providerId: string,
    modelId: string,
    patch: {
      name?: string
      reasoning?: boolean
      input?: string[]
      contextWindow?: number | undefined
      maxTokens?: number | undefined
    },
  ) => void

  /** 整个替换一个模型的思考档位映射；空映射等于不写 */
  setModelThinkingMap: (
    providerId: string,
    modelId: string,
    map: Record<string, string | null>,
  ) => void

  /** 更新一个模型的兼容性设置；全空时整个 compat 不写 */
  setModelCompat: (
    providerId: string,
    modelId: string,
    patch: { thinkingFormat?: string; maxTokensField?: string },
  ) => void
}

export const usePiStore = create<PiStore>()((set) => {
  /** 把替换后的模型数组写回它所属的 provider。 */
  const writeModels = (
    state: PiStore,
    providerId: string,
    models: PiModel[],
  ): Partial<PiStore> => {
    const providers = state.providers
    const provider = providers?.[providerId]
    if (!providers || !provider) return {}
    return {
      providers: { ...providers, [providerId]: { ...provider, models } },
    }
  }

  /** 按模型 id 找下标并原地替换（id 重复时操作第一个）。找不到返回 null。 */
  const replaceModel = (
    provider: PiProvider,
    modelId: string,
    next: PiModel,
  ): PiModel[] | null => {
    const index = provider.models.findIndex((model) => model.id === modelId)
    if (index === -1) return null
    const models = [...provider.models]
    models[index] = next
    return models
  }

  return {
    providers: {},

    loadProviders: (providers) => set({ providers }),

    addProvider: () =>
      set((state) => {
        const id = nextName(new Set(Object.keys(state.providers)), 'provider')
        return { providers: { ...state.providers, [id]: { models: [] } } }
      }),

    removeProvider: (id) =>
      set((state) => {
        const providers = state.providers
        if (!providers) return {}
        const next = { ...providers }
        delete next[id]
        return { providers: next }
      }),

    renameProvider: (oldId, newId) =>
      set((state) => {
        if (oldId === newId) return {}
        return { providers: renameKey(state.providers, oldId, newId) }
      }),

    updateProvider: (id, patch) =>
      set((state) => {
        const provider = state.providers[id]
        if (!provider) return {}
        const next = mergePatch(
          provider,
          pickMentioned(patch, ['name', 'baseUrl', 'apiKey', 'api']),
        )
        return { providers: { ...state.providers, [id]: next } }
      }),

    addModel: (providerId) =>
      set((state) => {
        const provider = state.providers[providerId]
        if (!provider) return {}
        const model: PiModel = {
          id: nextName(new Set(provider.models.map((m) => m.id)), 'model'),
          // 思考和文本输入是编码模型的事实默认，新卡片按这个起步
          reasoning: true,
          input: ['text'],
        }
        return writeModels(state, providerId, [...provider.models, model])
      }),

    removeModel: (providerId, modelId) =>
      set((state) => {
        const provider = state.providers[providerId]
        if (!provider) return {}
        return writeModels(
          state,
          providerId,
          provider.models.filter((model) => model.id !== modelId),
        )
      }),

    renameModel: (providerId, oldId, newId) =>
      set((state) => {
        const provider = state.providers[providerId]
        if (!provider || oldId === newId) return {}
        const current = provider.models.find((model) => model.id === oldId)
        if (!current) return {}
        const models = replaceModel(provider, oldId, { ...current, id: newId })
        if (!models) return {}
        return writeModels(state, providerId, models)
      }),

    updateModel: (providerId, modelId, patch) =>
      set((state) => {
        const provider = state.providers[providerId]
        const model = provider?.models.find((m) => m.id === modelId)
        if (!provider || !model) return {}

        // reasoning 的 false 等价于不写（pi 运行时同样按 false 处理），mergePatch 正好是这个语义
        let next = mergePatch(model, pickMentioned(patch, ['name', 'contextWindow', 'maxTokens', 'reasoning']))

        const inputPatch = pickMentioned(patch, ['input'])
        if ('input' in inputPatch) {
          setOrDrop(next, 'input', inputPatch.input as string[])
        }

        const models = replaceModel(provider, modelId, next as PiModel)
        if (!models) return {}
        return writeModels(state, providerId, models)
      }),

    setModelThinkingMap: (providerId, modelId, map) =>
      set((state) => {
        const provider = state.providers[providerId]
        const model = provider?.models.find((m) => m.id === modelId)
        if (!provider || !model) return {}
        const next: PiModel = { ...model }
        setOrDrop(next, 'thinkingLevelMap', map)
        const models = replaceModel(provider, modelId, next)
        if (!models) return {}
        return writeModels(state, providerId, models)
      }),

    setModelCompat: (providerId, modelId, patch) =>
      set((state) => {
        const provider = state.providers[providerId]
        const model = provider?.models.find((m) => m.id === modelId)
        if (!provider || !model) return {}
        const next: PiModel = { ...model }
        const compat = mergePatch(
          model.compat ?? {},
          pickMentioned(patch, ['thinkingFormat', 'maxTokensField']),
        )
        setOrDrop(next, 'compat', compat)
        const models = replaceModel(provider, modelId, next)
        if (!models) return {}
        return writeModels(state, providerId, models)
      }),
  }
})
