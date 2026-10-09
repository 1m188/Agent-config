/** pi 接入点 id 的规则 */

/**
 * pi 内置的 provider 清单（来自 pi-ai 包的 KnownProvider 类型定义）。
 *
 * models.json 里写同名的 id 是**合法的**——那是在给内置 provider 追加/覆盖模型，
 * 读文件时遇到同名我们不拦。但本工具的定位是"引入第三方 provider"，
 * 新建/改名时仍然拦住：provider 级 baseUrl 会重定向内置 provider 的全部内置模型，
 * 误操作代价太大。
 */
export const BUILT_IN_PROVIDER_IDS = [
  'amazon-bedrock',
  'ant-ling',
  'anthropic',
  'google',
  'google-vertex',
  'openai',
  'azure',
  'openai-codex',
  'radius',
  'typesafe',
  'nvidia',
  'deepseek',
  'github-copilot',
  'xai',
  'groq',
  'cerebras',
  'openrouter',
  'vercel-ai-gateway',
  'zai',
  'zai-coding-cn',
  'mistral',
  'minimax',
  'minimax-cn',
  'moonshotai',
  'moonshotai-cn',
  'huggingface',
  'fireworks',
  'together',
  'baseten',
  'opencode',
  'opencode-go',
  'kimi-coding',
  'meta',
  'cloudflare-workers-ai',
  'cloudflare-ai-gateway',
  'qwen-token-plan',
  'qwen-token-plan-cn',
  'qwen-token-plan-individual',
  'xiaomi',
  'xiaomi-token-plan-cn',
  'xiaomi-token-plan-ams',
  'xiaomi-token-plan-sgp',
]

/**
 * 接入点 id 的规则。
 *
 * id 会出现在 provider/model 这种引用里，限定成这一小撮字符，
 * 引用和文件里都不会出现需要转义的写法。
 */
export function checkProviderId(id: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return '只能用英文字母、数字、下划线和连字符'
  }
  if (BUILT_IN_PROVIDER_IDS.includes(id)) {
    return `「${id}」是 pi 内置的 provider，往内置 provider 里加模型不在这个工具的范围内`
  }
  return null
}
