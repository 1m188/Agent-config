/** Codex的预览文本
 *
 * 输出成 TOML。字段按这里写死的顺序摆好——TOML 里标量必须排在所有表头之前，
 * 虽然 smol-toml 自己会把标量提到前面去，但固定顺序能让预览稳定、好读。
 * 配置怎么变成文本由 agent 自己说了算，外壳不掺和。
 *
 * extras 是从文件读进来的、我们不编辑的其余顶层字段（plugins、desktop 那些），
 * 原样带回去，一个不丢。标量会被提到表头之前，所以放在 model_providers 前后都安全。
 */

import { stringify } from 'smol-toml'
import type { CodexConfig, CodexProvider } from './store'

/** 接入点输出成 TOML 里的表：我们编辑的字段在前，extras 里的原样跟上。
 *  不能把 provider 对象整个丢给序列化器——它身上挂着内部用的 extras 字段，
 *  会变成配置里一个多出来的 "extras" 键。 */
function toTomlProvider(provider: CodexProvider): Record<string, unknown> {
  return {
    name: provider.name,
    base_url: provider.base_url,
    env_key: provider.env_key,
    env_key_instructions: provider.env_key_instructions,
    experimental_bearer_token: provider.experimental_bearer_token,
    ...(provider.extras ?? {}),
  }
}

export function toPreviewText(
  config: CodexConfig,
  extras: Record<string, unknown>,
): string {
  return stringify({
    model: config.model,
    model_provider: config.model_provider,
    model_reasoning_effort: config.model_reasoning_effort,
    model_catalog_json: config.model_catalog_json,
    ...extras,
    model_providers: Object.fromEntries(
      Object.entries(config.model_providers ?? {}).map(([id, provider]) => [
        id,
        toTomlProvider(provider),
      ]),
    ),
  })
}
