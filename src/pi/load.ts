/** 读取 pi 的 models.json
 *
 * 规矩和 OpenCode / Codex 那边一致：
 * - 我们会在界面上编辑的字段取出来；
 * - 其余字段原样留在 extras 里，输出时原样带回去，一个不丢
 *   （provider 层的 modelOverrides / headers / compat，模型层的 cost /
 *   inputLimits / samplingParams，全靠这个活着）。
 *
 * 解析用 jsonc-parser：pi 读这个文件时也是先剥注释再 JSON.parse，
 * 所以注释和尾逗号都要认。
 */

import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser'
import type { PiModel, PiModelCompat, PiProvider } from './store'

/** 选项显式写出来：库的文档没把默认值列全，写出来也说明了我们要的宽松程度。 */
const PARSE_OPTIONS = {
  disallowComments: false,
  allowTrailingComma: true,
  allowEmptyContent: false,
}

/** 错误码是封闭的一小撮，翻成中文比甩一句 ValueExpected 有用。 */
const ERROR_REASONS: Partial<
  Record<ReturnType<typeof printParseErrorCode>, string>
> = {
  InvalidSymbol: '这里有一个无法识别的符号',
  InvalidNumberFormat: '数字的格式不对',
  PropertyNameExpected: '这里应该是一个属性名，而且要用双引号包起来',
  ValueExpected: '这里应该有一个值',
  ColonExpected: '属性名后面少了一个冒号',
  CommaExpected: '这里少了一个逗号',
  CloseBraceExpected: '少了一个右花括号 }',
  CloseBracketExpected: '少了一个右方括号 ]',
  EndOfFileExpected: '最后一个花括号后面还有多余的内容',
  InvalidCommentToken: '注释符号不对',
  UnexpectedEndOfComment: '注释没有结束，少了 */',
  UnexpectedEndOfString: '字符串没有结束，少了引号',
  UnexpectedEndOfNumber: '数字没有写完',
  InvalidUnicode: '转义里的 Unicode 写法不对',
  InvalidEscapeCharacter: '转义符不对',
  InvalidCharacter: '这里有一个不该出现的字符',
}

/** 把字符偏移换算成给用户看的行列号，都从 1 开始。 */
function positionOf(text: string, offset: number): string {
  const before = text.slice(0, offset)
  const line = before.split('\n').length
  const column = offset - before.lastIndexOf('\n')
  return `第 ${line} 行第 ${column} 列`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** pi 读文件时先剥 BOM，我们保持一致。 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/** 我们会在界面上编辑的接入点字段；其余的进 extras（modelOverrides、headers、compat 这些） */
const PROVIDER_KEYS = ['name', 'baseUrl', 'apiKey', 'api', 'models']
/** 我们会在界面上编辑的模型字段；其余的进 extras（cost、inputLimits、samplingParams 这些） */
const MODEL_KEYS = [
  'id',
  'name',
  'reasoning',
  'thinkingLevelMap',
  'input',
  'contextWindow',
  'maxTokens',
  'compat',
]
/** 我们会在界面上编辑的 compat 字段；其余的进 compat.extras */
const COMPAT_KEYS = ['thinkingFormat', 'maxTokensField']

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

/** 可选字符串字段：在就必须是字符串（pi 校验会拒绝别的类型），否则给出人话错误。 */
function optionalString(
  known: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined {
  if (!(key in known)) return undefined
  if (typeof known[key] !== 'string') throw new Error(`${path}.${key} 不是字符串`)
  return known[key] as string
}

function toModel(path: string, entry: Record<string, unknown>): PiModel | null {
  const { known, extras } = splitKnown(entry, MODEL_KEYS)
  // 没有 id 的条目没法在界面上表示，跳过
  if (typeof known.id !== 'string' || known.id === '') return null
  const where = `${path}.${known.id}`

  const model: PiModel = { id: known.id }
  const name = optionalString(known, 'name', where)
  if (name !== undefined) model.name = name

  if ('reasoning' in known) {
    if (typeof known.reasoning !== 'boolean') throw new Error(`${where}.reasoning 必须是布尔`)
    model.reasoning = known.reasoning
  }

  if ('thinkingLevelMap' in known) {
    if (!isRecord(known.thinkingLevelMap)) {
      throw new Error(`${where}.thinkingLevelMap 不是对象`)
    }
    const map: Record<string, string | null> = {}
    for (const [level, value] of Object.entries(known.thinkingLevelMap)) {
      if (typeof value !== 'string' && value !== null) {
        throw new Error(`${where}.thinkingLevelMap.${level} 的值只能是字符串或 null`)
      }
      map[level] = value
    }
    model.thinkingLevelMap = map
  }

  if ('input' in known) {
    if (!Array.isArray(known.input)) throw new Error(`${where}.input 不是数组`)
    for (const item of known.input) {
      if (item !== 'text' && item !== 'image') {
        throw new Error(`${where}.input 里只能有 text 和 image`)
      }
    }
    model.input = known.input as string[]
  }

  if ('contextWindow' in known) {
    if (typeof known.contextWindow !== 'number') {
      throw new Error(`${where}.contextWindow 不是数字`)
    }
    model.contextWindow = known.contextWindow
  }
  if ('maxTokens' in known) {
    if (typeof known.maxTokens !== 'number') {
      throw new Error(`${where}.maxTokens 不是数字`)
    }
    model.maxTokens = known.maxTokens
  }

  if ('compat' in known) {
    if (!isRecord(known.compat)) throw new Error(`${where}.compat 不是对象`)
    const { known: compatKnown, extras: compatExtras } = splitKnown(known.compat, COMPAT_KEYS)
    const compat: PiModelCompat = {}
    const thinkingFormat = optionalString(compatKnown, 'thinkingFormat', `${where}.compat`)
    if (thinkingFormat !== undefined) compat.thinkingFormat = thinkingFormat
    const maxTokensField = optionalString(compatKnown, 'maxTokensField', `${where}.compat`)
    if (maxTokensField !== undefined) compat.maxTokensField = maxTokensField
    if (Object.keys(compatExtras).length > 0) compat.extras = compatExtras
    if (Object.keys(compat).length > 0) model.compat = compat
  }

  if (Object.keys(extras).length > 0) model.extras = extras
  return model
}

function toProvider(id: string, entry: Record<string, unknown>): PiProvider {
  const { known, extras } = splitKnown(entry, PROVIDER_KEYS)
  const where = `providers.${id}`

  const provider: PiProvider = { models: [] }
  const name = optionalString(known, 'name', where)
  if (name !== undefined) provider.name = name
  const baseUrl = optionalString(known, 'baseUrl', where)
  if (baseUrl !== undefined) provider.baseUrl = baseUrl
  const apiKey = optionalString(known, 'apiKey', where)
  if (apiKey !== undefined) provider.apiKey = apiKey
  const api = optionalString(known, 'api', where)
  if (api !== undefined) provider.api = api

  if ('models' in known) {
    if (!Array.isArray(known.models)) throw new Error(`${where}.models 不是数组`)
    const models: PiModel[] = []
    for (const item of known.models) {
      if (!isRecord(item)) continue
      const model = toModel(`${where}.models`, item)
      if (model) models.push(model)
    }
    if (known.models.length > 0 && models.length === 0) {
      throw new Error(`${where}.models 里没有带 id 的模型条目`)
    }
    provider.models = models
  }

  if (Object.keys(extras).length > 0) provider.extras = extras
  return provider
}

/**
 * 解析 models.json 的内容。出错就抛异常，调用方直接把 message 拿给用户看。
 *
 * jsonc 解析器是容错的：内容坏了它也尽力给出结果，所以必须自己检查 errors，
 * 一条都不能放过——否则会把半份配置塞进界面，静默丢掉用户文件里的东西。
 */
export function parseModelsJson(text: string): {
  providers: Record<string, PiProvider>
} {
  const errors: ParseError[] = []
  const value = parse(stripBom(text), errors, PARSE_OPTIONS)

  if (errors.length > 0) {
    const { error, offset } = errors[0]
    const code = printParseErrorCode(error)
    throw new Error(`${positionOf(text, offset)}：${ERROR_REASONS[code] ?? code}`)
  }

  if (!isRecord(value)) throw new Error('这个文件的内容不是一个 JSON 对象')
  if (!('providers' in value)) throw new Error('models.json 里没有 providers 字段')
  const raw = value.providers
  if (!isRecord(raw)) throw new Error('providers 不是一个对象')

  const providers: Record<string, PiProvider> = {}
  for (const [id, entry] of Object.entries(raw)) {
    if (!isRecord(entry)) throw new Error(`providers.${id} 不是一个对象`)
    providers[id] = toProvider(id, entry)
  }
  return { providers }
}
