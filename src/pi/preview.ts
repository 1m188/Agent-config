/** pi 的预览文本（models.json）
 *
 * 输出成 JSON。JSON.stringify 会自动跳过值为 undefined 的键，
 * 所以"只写真值"靠这一层：字符串用 `|| undefined` 把空串收敛掉
 * （store 的动作不会产生空串，但从文件读来的空串在这里也拦住），
 * 空容器显式收敛；数字保持原样——0 是 pi 拒绝的值，要留给校验器亮红牌，
 * 不能在这里静默丢掉。
 * 预览和「复制」用的是同一份文本，两边不会不一致。
 */

import type { PiModel, PiModelCompat, PiProvider } from './store'

function toPiCompat(compat: PiModelCompat | undefined): Record<string, unknown> | undefined {
  if (!compat) return undefined
  const out: Record<string, unknown> = {}
  if (compat.thinkingFormat) out.thinkingFormat = compat.thinkingFormat
  if (compat.maxTokensField) out.maxTokensField = compat.maxTokensField
  Object.assign(out, compat.extras ?? {})
  return Object.keys(out).length > 0 ? out : undefined
}

function toPiModel(model: PiModel): Record<string, unknown> {
  return {
    id: model.id,
    name: model.name || undefined,
    // false 和"不写"对 pi 等价，统一收敛成不写
    reasoning: model.reasoning === true ? true : undefined,
    thinkingLevelMap:
      model.thinkingLevelMap && Object.keys(model.thinkingLevelMap).length > 0
        ? model.thinkingLevelMap
        : undefined,
    input: model.input && model.input.length > 0 ? model.input : undefined,
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens,
    compat: toPiCompat(model.compat),
    ...(model.extras ?? {}),
  }
}

function toPiProvider(provider: PiProvider): Record<string, unknown> {
  return {
    name: provider.name || undefined,
    baseUrl: provider.baseUrl || undefined,
    apiKey: provider.apiKey || undefined,
    api: provider.api || undefined,
    models: provider.models.length > 0 ? provider.models.map(toPiModel) : undefined,
    ...(provider.extras ?? {}),
  }
}

/** models.json 的内容。没有 provider 时返回空文本，预览面板显示"还没有内容"。 */
export function toPreviewText(providers: Record<string, PiProvider>): string {
  const ids = Object.keys(providers)
  if (ids.length === 0) return ''
  const mapped = Object.fromEntries(
    ids.map((id) => [id, toPiProvider(providers[id])]),
  )
  return JSON.stringify({ providers: mapped }, null, 2)
}
