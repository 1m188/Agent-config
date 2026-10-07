/** 模型配置卡片 */

import type { ModelConfig } from './store'
import { useOpencodeStore } from './store'
import { CheckboxField, CheckboxGroup, NumberField, TextField } from '../components/Field'
import { IdField } from '../components/IdField'
import { ReasoningField } from './ReasoningField'

/** v1 schema 里 modalities 的枚举，v2 把它改名成了 capabilities.input / output */
const MEDIA_TYPES = ['text', 'audio', 'image', 'video', 'pdf']

/** OpenCode 认得这三种推理字段名，也接受别的字符串 */
const REASONING_FIELDS = ['reasoning', 'reasoning_content', 'reasoning_text']

type ModelCardProps = {
  providerId: string
  modelId: string
  model: ModelConfig
  /** 同一个 provider 下所有模型的 id，用来拦重名 */
  allIds: string[]
}

export function ModelCard({ providerId, modelId, model, allIds }: ModelCardProps) {
  const renameModel = useOpencodeStore((state) => state.renameModel)
  const removeModel = useOpencodeStore((state) => state.removeModel)
  const updateModel = useOpencodeStore((state) => state.updateModel)
  const setModelTiers = useOpencodeStore((state) => state.setModelTiers)
  const setModelDefaultTier = useOpencodeStore((state) => state.setModelDefaultTier)

  const tiers = (model.variants ?? []).map((variant) => variant.id)

  return (
    <div className="card card--model">
      <header className="card__header">
        <h4 className="card__title">模型</h4>
        <button
          type="button"
          className="card__remove"
          onClick={() => removeModel(providerId, modelId)}
        >
          删除
        </button>
      </header>

      <IdField
        label="模型 ID"
        value={modelId}
        takenIds={allIds.filter((other) => other !== modelId)}
        // 模型 ID 允许含 /（例如 deepseek/deepseek-v4.1-flash），但不能含 #
        forbidden={['#']}
        onCommit={(next) => renameModel(providerId, modelId, next)}
      />

      <TextField
        label="上游模型 ID"
        value={model.modelID ?? ''}
        placeholder="不填就跟上面的模型 ID 一样"
        onChange={(modelID) => updateModel(providerId, modelId, { modelID })}
      />

      <TextField
        label="显示名称"
        value={model.name ?? ''}
        onChange={(name) => updateModel(providerId, modelId, { name })}
      />

      <div className="card__group">
        <span className="card__group-title">上下文限制</span>
        <NumberField
          label="上下文窗口"
          value={model.limit?.context}
          onChange={(limitContext) => updateModel(providerId, modelId, { limitContext })}
        />
        <NumberField
          label="最大输出"
          value={model.limit?.output}
          onChange={(limitOutput) => updateModel(providerId, modelId, { limitOutput })}
        />
      </div>

      <div className="card__group">
        <span className="card__group-title">能力</span>
        <CheckboxField
          label="支持工具调用"
          checked={model.capabilities?.tools ?? true}
          onChange={(tools) => updateModel(providerId, modelId, { tools })}
        />
        <CheckboxGroup
          label="接受的输入类型"
          options={MEDIA_TYPES}
          selected={model.capabilities?.input ?? []}
          onChange={(inputMedia) => updateModel(providerId, modelId, { inputMedia })}
        />
        <CheckboxGroup
          label="能输出的类型"
          options={MEDIA_TYPES}
          selected={model.capabilities?.output ?? []}
          onChange={(outputMedia) => updateModel(providerId, modelId, { outputMedia })}
        />
      </div>

      <div className="card__group">
        <span className="card__group-title">推理</span>
        <ReasoningField
          tiers={tiers}
          defaultTier={model.settings?.reasoningEffort ?? ''}
          onChangeTiers={(next) => setModelTiers(providerId, modelId, next)}
          onChangeDefault={(tier) => setModelDefaultTier(providerId, modelId, tier)}
        />
        <TextField
          label="推理字段名"
          value={model.compatibility?.reasoningField ?? ''}
          suggestions={REASONING_FIELDS}
          placeholder="reasoning_content"
          onChange={(reasoningField) => updateModel(providerId, modelId, { reasoningField })}
        />
      </div>
    </div>
  )
}
