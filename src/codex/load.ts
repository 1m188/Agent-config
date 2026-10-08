/** 读取 Codex 的配置文件
 *
 * 两个入口：parseConfig 读 config.toml（TOML），parseCatalog 读它指向的
 * models.json（JSON）。规矩和 OpenCode 那边一致：
 * - 我们会在界面上编辑的字段取出来；
 * - 其余字段原样留在 extras 里，输出时原样带回去，一个不丢
 *   （config.toml 里的 plugins / desktop / marketplaces，目录条目里的
 *   comp_hash / base_instructions，全靠这个活着）。
 */

import { parse } from 'smol-toml'
import type { CatalogModel } from './catalog'
import type { CodexConfig, CodexProvider } from './store'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** 我们会在界面上编辑的顶层字段；其余的进 extras */
const TOP_KEYS = ['model', 'model_provider', 'model_reasoning_effort', 'model_catalog_json']
/** 我们会在界面上编辑的接入点字段；其余的进 extras（wire_api、http_headers 这些） */
const PROVIDER_KEYS = [
  'name',
  'base_url',
  'env_key',
  'env_key_instructions',
  'experimental_bearer_token',
]
/** 我们会在界面上编辑的目录条目字段；其余的进 extras（comp_hash、base_instructions 这些） */
const ENTRY_KEYS = [
  'slug',
  'display_name',
  'context_window',
  'input_modalities',
  'default_reasoning_level',
  'supported_reasoning_levels',
  'model_messages',
]

/** 把认识的字段挑出来，剩下的归入 extras */
function splitKnown(
  record: Record<string, unknown>,
  keys: string[],
): { known: Record<string, unknown>; extras: Record<string, unknown> } {
  const known: Record<string, unknown> = {}
  const extras: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (keys.includes(key)) known[key] = value
    else extras[key] = value
  }
  return { known, extras }
}

function toProvider(entry: Record<string, unknown>): CodexProvider {
  const { known, extras } = splitKnown(entry, PROVIDER_KEYS)
  const provider = known as CodexProvider
  if (Object.keys(extras).length > 0) provider.extras = extras
  return provider
}

function toCatalogModel(entry: Record<string, unknown>): CatalogModel | null {
  const { known, extras } = splitKnown(entry, ENTRY_KEYS)
  // 没有 slug 的条目没法在界面上表示，跳过
  if (typeof known.slug !== 'string' || known.slug === '') return null

  const model: CatalogModel = {
    slug: known.slug,
    displayName: typeof known.display_name === 'string' ? known.display_name : '',
    contextWindow: typeof known.context_window === 'number' ? known.context_window : undefined,
    inputModalities: Array.isArray(known.input_modalities)
      ? known.input_modalities.filter((item): item is string => typeof item === 'string')
      : ['text'],
    levels: Array.isArray(known.supported_reasoning_levels)
      ? known.supported_reasoning_levels
          .map((preset) =>
            isRecord(preset) && typeof preset.effort === 'string' ? preset.effort : '',
          )
          .filter((effort) => effort !== '')
      : [],
    defaultLevel:
      typeof known.default_reasoning_level === 'string' ? known.default_reasoning_level : undefined,
    modelMessages: known.model_messages,
  }
  if (Array.isArray(known.supported_reasoning_levels)) {
    const descriptions: Record<string, string> = {}
    for (const preset of known.supported_reasoning_levels) {
      if (isRecord(preset) && typeof preset.effort === 'string' && typeof preset.description === 'string') {
        descriptions[preset.effort] = preset.description
      }
    }
    if (Object.keys(descriptions).length > 0) model.levelDescriptions = descriptions
  }
  if (Object.keys(extras).length > 0) model.extras = extras
  return model
}

/** 解析 config.toml。认识的字段进配置，其余原样放进 extras。 */
export function parseConfig(text: string): {
  config: CodexConfig
  extras: Record<string, unknown>
} {
  let value: unknown
  try {
    value = parse(text)
  } catch (error) {
    throw new Error(`这不是一份合法的 TOML：${message(error)}`)
  }
  if (!isRecord(value)) throw new Error('这个文件的内容不是一个 TOML 表')

  const { known, extras } = splitKnown(value, [...TOP_KEYS, 'model_providers'])
  const config = known as CodexConfig

  if ('model_providers' in value) {
    const raw = value.model_providers
    if (!isRecord(raw)) throw new Error('config.toml 里的 model_providers 不是一个表')
    const providers: Record<string, CodexProvider> = {}
    for (const [id, entry] of Object.entries(raw)) {
      if (!isRecord(entry)) throw new Error(`model_providers.${id} 不是一个表`)
      providers[id] = toProvider(entry)
    }
    config.model_providers = providers
  }

  return { config, extras }
}

/** 解析模型目录 models.json */
export function parseCatalog(text: string): CatalogModel[] {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    throw new Error(`这不是一份合法的 JSON：${message(error)}`)
  }
  if (!isRecord(value) || !Array.isArray(value.models)) {
    throw new Error('模型目录里没有 models 数组')
  }

  const models: CatalogModel[] = []
  for (const entry of value.models) {
    if (!isRecord(entry)) continue
    const model = toCatalogModel(entry)
    if (model) models.push(model)
  }
  if (models.length === 0) throw new Error('目录里没有带 slug 的模型条目')
  return models
}
