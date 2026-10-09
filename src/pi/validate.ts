/** pi 的配置校验规则 */

import type { PiProvider } from './store'

/**
 * 这些键出现在 extras 里时，pi 也把 provider 当作"不是空的"
 * （源码 applyModelsJson：全空会直接抛错拒载整份文件）。
 */
const NON_EMPTY_EXTRA_KEYS = ['headers', 'compat', 'modelOverrides', 'oauth', 'authHeader']

/**
 * 找出配置里说得通但不合法的地方。
 *
 * 只列 pi 会拒绝或会静默丢数据的问题（来源都是 pi 的加载源码）；
 * "能用但不完整"的事（比如没填 API Key、模型不会出现在 /model 里）
 * 归表单里的提示管，不拦复制。
 */
export function findIssues(providers: Record<string, PiProvider>): string[] {
  const issues: string[] = []

  for (const [id, provider] of Object.entries(providers)) {
    const models = provider.models
    const hasContent =
      models.length > 0 ||
      provider.baseUrl !== undefined ||
      provider.apiKey !== undefined ||
      Object.keys(provider.extras ?? {}).some((key) => NON_EMPTY_EXTRA_KEYS.includes(key))

    if (!hasContent) {
      issues.push(
        `Provider「${id}」是空的：至少要有 API 地址、API Key 或模型，否则 pi 会拒绝整份 models.json`,
      )
      continue
    }

    // 自定义模型的硬规则（源码 modelFromJson）：api 和 baseUrl 必须能在这一层取到
    if (
      models.length > 0 &&
      provider.api === undefined &&
      models.some((model) => model.extras?.api === undefined)
    ) {
      issues.push(`Provider「${id}」没选接口协议（api）——自定义模型必须指定，否则 pi 会拒绝加载`)
    }
    if (
      models.length > 0 &&
      provider.baseUrl === undefined &&
      models.some((model) => model.extras?.baseUrl === undefined)
    ) {
      issues.push(`Provider「${id}」没写 API 地址（baseUrl）——自定义模型必须有`)
    }

    const seen = new Set<string>()
    for (const model of models) {
      if (seen.has(model.id)) {
        issues.push(
          `Provider「${id}」有重复的模型 ID「${model.id}」——pi 会静默用后面的覆盖前面的`,
        )
        continue
      }
      seen.add(model.id)
      if (model.contextWindow !== undefined && model.contextWindow <= 0) {
        issues.push(`Provider「${id}」的模型「${model.id}」：上下文窗口必须是正数`)
      }
      if (model.maxTokens !== undefined && model.maxTokens <= 0) {
        issues.push(`Provider「${id}」的模型「${model.id}」：最大输出必须是正数`)
      }
    }
  }

  return issues
}
