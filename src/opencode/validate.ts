/** 一些配置校验规则 */

import type { OpencodeConfig } from './store'

/**
 * 找出配置里说得通但不合法的地方。
 *
 * provider / 模型 的 id 重复和非法字符不用在这里管：id 就是配置里的键名，
 * 重名天然不可能，字符问题在改名的那一刻就拦住了（见 IdField）。
 */
export function findIssues(config: OpencodeConfig): string[] {
  const issues: string[] = []

  for (const [providerId, provider] of Object.entries(config.providers ?? {})) {
    for (const [modelId, model] of Object.entries(provider.models ?? {})) {
      const limit = model.limit
      if (!limit) continue

      const hasContext = typeof limit.context === 'number'
      const hasOutput = typeof limit.output === 'number'
      if (hasContext !== hasOutput) {
        issues.push(
          `Provider「${providerId}」的模型「${modelId}」：上下文窗口和最大输出必须同时填写，或者都不填`,
        )
      }
    }
  }

  return issues
}
