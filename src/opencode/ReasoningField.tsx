import { useState } from 'react'
import { SelectField, TextField } from '../components/Field'

/** 市面上常见的思考档位，作为建议项。也可以自己输入别的值。 */
export const TIER_OPTIONS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

type ReasoningFieldProps = {
  /** 已选的档位，来自配置里的 variants */
  tiers: string[]
  /** 默认档位，来自配置里的 settings.reasoningEffort */
  defaultTier: string
  onChangeTiers: (next: string[]) => void
  onChangeDefault: (next: string) => void
}

export function ReasoningField({
  tiers,
  defaultTier,
  onChangeTiers,
  onChangeDefault,
}: ReasoningFieldProps) {
  const [draft, setDraft] = useState('')

  function add() {
    const tier = draft.trim()
    setDraft('')
    // 档位名不能带 #，否则 provider/model#variant 这个引用会被截断
    if (tier === '' || tier.includes('#') || tiers.includes(tier)) return
    onChangeTiers([...tiers, tier])
  }

  return (
    <div className="reasoning">
      <div className="reasoning__add">
        <div className="reasoning__input">
          <TextField
            label="思考档位"
            value={draft}
            suggestions={TIER_OPTIONS}
            placeholder="选一个或自己输入"
            onChange={setDraft}
          />
        </div>
        <button type="button" className="button--ghost" onClick={add}>
          添加
        </button>
      </div>

      {tiers.length > 0 && (
        <div className="chips">
          {tiers.map((tier) => (
            <button
              key={tier}
              type="button"
              className="chip"
              onClick={() => onChangeTiers(tiers.filter((item) => item !== tier))}
            >
              {tier} ×
            </button>
          ))}
        </div>
      )}

      <SelectField
        label="默认档位"
        value={defaultTier}
        options={tiers}
        emptyLabel="（不设默认）"
        disabled={tiers.length === 0}
        onChange={onChangeDefault}
      />
    </div>
  )
}
