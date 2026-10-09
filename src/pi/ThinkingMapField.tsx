/** pi 的思考档位，顺序即文档顺序 */
export const THINKING_LEVELS = [
  'off',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
]

/**
 * pi 的规则（pi-ai 的 getSupportedThinkingLevels）：
 * minimal/low/medium/high 不写映射就是可用（值原样透传）；
 * xhigh 和 max 必须在映射里显式出现（字符串值），否则 /thinking 里根本没有这一档。
 * 请求时的透传语义和这里的"是否提供"语义不对称，界面上必须说破。
 */
const NEEDS_EXPLICIT = new Set(['xhigh', 'max'])

const LEVEL_LABELS: Record<string, string> = {
  off: 'off（关闭思考）',
  minimal: 'minimal（最简）',
  low: 'low（低）',
  medium: 'medium（中）',
  high: 'high（高）',
  xhigh: 'xhigh（超高）',
  max: 'max（最大）',
}

/** 一档在下拉里的三种状态：'' 不设置 / 'disabled' 禁用 / 'custom' 映射到自定义值 */
function modeOf(map: Record<string, string | null>, level: string): string {
  if (!(level in map)) return ''
  return map[level] === null ? 'disabled' : 'custom'
}

type ThinkingMapFieldProps = {
  value: Record<string, string | null>
  onChange: (next: Record<string, string | null>) => void
}

/**
 * 思考档位映射编辑器。
 *
 * 每一档三态：
 * - 不设置：minimal~high 表示可用且原样透传；xhigh/max 表示这一档不提供（pi 的判定规则）；
 * - 禁用：写 null，这一档确定不可用；
 * - 自定义：写字符串，例如把 pi 的 high 映射成上游的 effort-high。
 */
export function ThinkingMapField({ value, onChange }: ThinkingMapFieldProps) {
  function setMode(level: string, mode: string) {
    const next = { ...value }
    if (mode === '') {
      delete next[level]
    } else if (mode === 'disabled') {
      next[level] = null
    } else {
      // 切到自定义时先填档位名本身（对 minimal~high 与透传等价，对 xhigh/max 正好是需要的声明），再由用户改
      next[level] = typeof value[level] === 'string' ? value[level]! : level
    }
    onChange(next)
  }

  /** 把缺失的档位（off 除外）按同名补进映射；已禁用的档位保持禁用不动 */
  function fillMissing() {
    const next = { ...value }
    for (const level of THINKING_LEVELS) {
      if (level === 'off') continue
      if (!(level in next)) next[level] = level
    }
    onChange(next)
  }

  return (
    <div className="thinking-map">
      <p className="empty-hint">
        pi 的规则：minimal~high 不写映射就是可用（值原样透传）；xhigh 和 max
        必须显式映射，否则 /thinking 里不会出现这一档。
      </p>
      <div>
        <button type="button" className="button--ghost" onClick={fillMissing}>
          补全缺失档位（同名映射）
        </button>
      </div>
      {THINKING_LEVELS.map((level) => {
        const mode = modeOf(value, level)
        return (
          <div className="thinking-map__row" key={level}>
            <span className="thinking-map__level">
              {LEVEL_LABELS[level]}
              {NEEDS_EXPLICIT.has(level) && ' · 需显式映射'}
            </span>
            <select
              className="field__input"
              value={mode}
              onChange={(event) => setMode(level, event.target.value)}
            >
              <option value="">
                {NEEDS_EXPLICIT.has(level)
                  ? '不设置（/thinking 不出现这一档）'
                  : '不设置（可用，原样透传）'}
              </option>
              <option value="disabled">禁用（null）</option>
              <option value="custom">映射到自定义值</option>
            </select>
            {mode === 'custom' && (
              <input
                className="field__input"
                type="text"
                value={value[level] ?? ''}
                placeholder="上游的档位值，例如 high"
                onChange={(event) => {
                  const next = { ...value }
                  const text = event.target.value
                  // 清空就回到档位名本身，绝不让空串进配置
                  next[level] = text === '' ? level : text
                  onChange(next)
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
