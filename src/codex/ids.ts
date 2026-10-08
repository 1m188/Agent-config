/** Codex 接入点 id 的规则 */

/**
 * Codex 内置的接入点。
 *
 * 自己再定义同名的**不会报错、会被静默丢掉**（源码里是
 * `model_providers.entry(key).or_insert(provider)`），所以只能提前拦住。
 */
export const BUILT_IN_PROVIDER_IDS = [
  'openai',
  'ollama',
  'lmstudio',
  'amazon-bedrock',
  'amazon-bedrock-runtime',
]

/** 已经废弃的 id，写了 Codex 会直接报错 */
const REMOVED_PROVIDER_IDS = ['ollama-chat']

/**
 * 接入点 id 的规则。
 *
 * id 同时是 config.toml 里的表名，限定成裸键能用的字符，
 * 输出里就不会出现 `[model_providers."..."]` 这种带引号的形式。
 */
export function checkProviderId(id: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return '只能用英文字母、数字、下划线和连字符'
  }
  if (BUILT_IN_PROVIDER_IDS.includes(id)) {
    return `「${id}」是 Codex 内置的，自己定义同名的会被忽略`
  }
  if (REMOVED_PROVIDER_IDS.includes(id)) {
    return `「${id}」已经被 Codex 移除了`
  }
  return null
}
