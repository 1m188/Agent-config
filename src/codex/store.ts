/** Codex配置对象
 * 全局单例
 * 界面显示、复制导出等功能全从这唯一数据源算出来
 */

import { create } from 'zustand'
import type { CatalogModel } from './catalog'
import { buildModelsJson } from './catalog'

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
 * `{ base_url: '' }` 表示只清 base_url，而同一层的另一个键这时根本不在补丁里，
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
 * 只用在**内置容器**上（model_providers）——它空了就没有存在的意义。
 * 代表界面卡片的条目本身不适用：一张刚添加、还没填内容的卡片就是空对象，
 * 但它必须留着，否则卡片会当场消失。
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

/** 一个接入点在配置里的样子。只列出我们目前会写入的字段。 */
export type CodexProvider = {
  name?: string
  /** OpenAI 兼容的 API 地址 */
  base_url?: string
  /** 存 API key 的**环境变量名**。Codex 自己去读这个变量，配置里不写 key 本身 */
  env_key?: string
  /** 给用户看的说明：去哪儿拿 key、设成哪个变量 */
  env_key_instructions?: string
}

/** 整份 Codex config.toml。字段都是可选的，空配置本身就是合法的。 */
export type CodexConfig = {
  model?: string
  model_provider?: string
  model_reasoning_effort?: string
  /** 模型目录文件的完整路径。填了才会写 model_catalog_json，模型才会进 /model */
  model_catalog_json?: string
  model_providers?: Record<string, CodexProvider>
}

type CodexStore = {
  /** 唯一的配置对象。界面和预览都由它算出来。 */
  config: CodexConfig

  /** 要写进 models.json 的模型清单。空着表示不用目录 */
  catalogModels: CatalogModel[]

  setGlobal: (patch: {
    model?: string
    model_provider?: string
    model_reasoning_effort?: string
    model_catalog_json?: string
  }) => void

  addProvider: () => void
  removeProvider: (id: string) => void
  renameProvider: (oldId: string, newId: string) => void
  updateProvider: (
    id: string,
    patch: {
      name?: string
      base_url?: string
      env_key?: string
      env_key_instructions?: string
    },
  ) => void

  addCatalogModel: () => void
  removeCatalogModel: (slug: string) => void
  renameCatalogModel: (oldSlug: string, newSlug: string) => void
  updateCatalogModel: (
    slug: string,
    patch: {
      displayName?: string
      contextWindow?: number | undefined
      inputModalities?: string[]
      levels?: string[]
      defaultLevel?: string
    },
  ) => void
}

export const useCodexStore = create<CodexStore>()((set) => ({
  config: {},

  catalogModels: [],

  setGlobal: (patch) => set((state) => ({ config: mergePatch(state.config, patch) })),

  addProvider: () =>
    set((state) => {
      const providers = state.config.model_providers ?? {}
      const id = nextName(new Set(Object.keys(providers)), 'provider')
      return { config: { ...state.config, model_providers: { ...providers, [id]: {} } } }
    }),

  removeProvider: (id) =>
    set((state) => {
      const providers = state.config.model_providers
      if (!providers) return {}

      const next = { ...providers }
      delete next[id]
      const config = { ...state.config }
      setOrDrop(config, 'model_providers', next)

      // 默认模型正指向被删掉的这个接入点的话，引用也得跟着去掉：
      // 留着就是个指向不存在 id 的引用，看着完整其实已经废了
      if (state.config.model_provider === id) delete config.model_provider

      return { config }
    }),

  renameProvider: (oldId, newId) =>
    set((state) => {
      const providers = state.config.model_providers
      if (!providers || oldId === newId) return {}

      const config = {
        ...state.config,
        model_providers: renameKey(providers, oldId, newId),
      }
      // 引用是按 id 写的，改名时得跟着改
      if (state.config.model_provider === oldId) config.model_provider = newId

      return { config }
    }),

  updateProvider: (id, patch) =>
    set((state) => {
      const providers = state.config.model_providers
      const current = providers?.[id]
      if (!providers || !current) return {}

      const next = mergePatch(
        current,
        pickMentioned(patch, ['name', 'base_url', 'env_key', 'env_key_instructions']),
      )

      return { config: { ...state.config, model_providers: { ...providers, [id]: next } } }
    }),

  addCatalogModel: () =>
    set((state) => ({
      catalogModels: [
        ...state.catalogModels,
        {
          slug: nextName(new Set(state.catalogModels.map((m) => m.slug)), 'model'),
          displayName: '',
          inputModalities: ['text'],
          levels: ['low', 'high'],
          defaultLevel: 'high',
        },
      ],
    })),

  removeCatalogModel: (slug) =>
    set((state) => ({
      catalogModels: state.catalogModels.filter((model) => model.slug !== slug),
    })),

  renameCatalogModel: (oldSlug, newSlug) =>
    set((state) => {
      if (oldSlug === newSlug) return {}
      // 目录里的顺序跟着原来那张卡片的位置走
      const index = state.catalogModels.findIndex((model) => model.slug === oldSlug)
      if (index === -1) return {}
      const next = [...state.catalogModels]
      next[index] = { ...next[index], slug: newSlug }
      // 默认模型如果指的就是这个 slug，引用跟着改
      const config =
        state.config.model === oldSlug ? { ...state.config, model: newSlug } : state.config
      return { catalogModels: next, config }
    }),

  updateCatalogModel: (slug, patch) =>
    set((state) => {
      const index = state.catalogModels.findIndex((model) => model.slug === slug)
      if (index === -1) return {}
      const current = state.catalogModels[index]
      const mentioned = pickMentioned(patch, [
        'displayName',
        'contextWindow',
        'inputModalities',
        'levels',
        'defaultLevel',
      ])
      const next = { ...current, ...mentioned } as CatalogModel
      // 档位被减掉时，默认档位也得跟着去掉
      if (next.defaultLevel !== undefined && !next.levels.includes(next.defaultLevel)) {
        next.defaultLevel = undefined
      }
      const catalogModels = [...state.catalogModels]
      catalogModels[index] = next
      return { catalogModels }
    }),
}))

/** models.json 的内容。没有模型时返回 null，表示这份配置不需要目录。 */
export function toCatalogJson(models: CatalogModel[]): string | null {
  if (models.length === 0) return null
  return JSON.stringify(buildModelsJson(models), null, 2)
}
