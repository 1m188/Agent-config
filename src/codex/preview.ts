/** Codex的预览文本
 *
 * 输出成 TOML。字段按这里写死的顺序摆好——TOML 里标量必须排在所有表头之前，
 * 虽然 smol-toml 自己会把标量提到前面去，但固定顺序能让预览稳定、好读。
 * 配置怎么变成文本由 agent 自己说了算，外壳不掺和。
 *
 * 注意：上下文窗口这类"模型是什么"的信息不在这里，在模型目录里
 * （catalog.ts），两份内容一起用，缺一不可。
 */

import { stringify } from 'smol-toml'
import type { CodexConfig } from './store'

export function toPreviewText(config: CodexConfig): string {
  return stringify({
    model: config.model,
    model_provider: config.model_provider,
    model_reasoning_effort: config.model_reasoning_effort,
    model_catalog_json: config.model_catalog_json,
    model_providers: config.model_providers,
  })
}
