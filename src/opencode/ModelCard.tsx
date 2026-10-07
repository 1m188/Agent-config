/** 模型配置卡片 */

import type { ModelConfig } from './store'
import { useOpencodeStore } from './store'
import { CheckboxField, NumberField, TextField } from '../components/Field'
import { IdField } from '../components/IdField'

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
        value={model.id ?? modelId}
        takenIds={allIds.filter((other) => other !== modelId)}
        onCommit={(next) => renameModel(providerId, modelId, next)}
      />

      <TextField
        label="显示名称"
        value={model.name ?? ''}
        onChange={(name) => updateModel(providerId, modelId, { name })}
      />

      <NumberField
        label="上下文窗口"
        value={model.limit?.context}
        onChange={(context) => updateModel(providerId, modelId, { context })}
      />

      <NumberField
        label="最大输出"
        value={model.limit?.output}
        onChange={(output) => updateModel(providerId, modelId, { output })}
      />

      <div className="card__checks">
        <CheckboxField
          label="支持附件"
          checked={model.attachment ?? false}
          onChange={(attachment) => updateModel(providerId, modelId, { attachment })}
        />
        <CheckboxField
          label="推理模型"
          checked={model.reasoning ?? false}
          onChange={(reasoning) => updateModel(providerId, modelId, { reasoning })}
        />
        <CheckboxField
          label="支持工具调用"
          checked={model.tool_call ?? false}
          onChange={(tool_call) => updateModel(providerId, modelId, { tool_call })}
        />
      </div>
    </div>
  )
}
