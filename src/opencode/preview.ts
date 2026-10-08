/** Opencode的预览文本
 *
 * 配置怎么变成文本、变成什么格式，由 agent 自己说了算，外壳不掺和：
 * 这里是 JSON，换一个 agent 可能是 TOML。
 * 预览和「复制」用的是同一份文本，两边不会不一致。
 */

import type { OpencodeConfig } from './store'

export function toPreviewText(config: OpencodeConfig): string {
  return JSON.stringify(config, null, 2)
}
