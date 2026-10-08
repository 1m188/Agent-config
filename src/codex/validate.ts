/** Codex 这边的校验规则 */

import type { CatalogModel } from './catalog'
import type { CodexConfig } from './store'

/**
 * 找出配置里说得通但不合法的地方。
 *
 * 接入点 / 目录模型 的 id 重复不用在这里管：它们就是键名，重名天然不可能，
 * 字符问题在改名那一刻就拦住了（见 IdField / checkProviderId）。
 */
export function findIssues(config: CodexConfig, catalogModels: CatalogModel[]): string[] {
  const issues: string[] = []

  if (catalogModels.length > 0 && !config.model_catalog_json) {
    issues.push('加了目录模型，但没填模型目录的保存路径——models.json 要存成一个完整路径，config.toml 里的 model_catalog_json 指向它')
  }

  for (const model of catalogModels) {
    if (model.levels.length === 0) {
      issues.push(`目录模型「${model.slug}」一个思考档位都没选，这样它在 /model 里没有档位可选`)
    }
  }

  return issues
}
