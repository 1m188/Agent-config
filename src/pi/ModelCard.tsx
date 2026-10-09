/** pi 的模型配置卡片 */

import { useState } from 'react'
import { CheckboxField, CheckboxGroup, NumberField, SelectField, TextField } from '../components/Field'
import { IdField } from '../components/IdField'
import type { PiModel } from './store'
import { usePiStore } from './store'
import { ThinkingMapField } from './ThinkingMapField'

const INPUT_TYPES = ['text', 'image']

/** compat.thinkingFormat 的枚举（pi 源码 OpenAICompletionsCompatSchema 里的全集） */
const THINKING_FORMATS = [
  'openai',
  'openrouter',
  'together',
  'baseten',
  'deepseek',
  'zai',
  'qwen',
  'chat-template',
  'qwen-chat-template',
  'string-thinking',
  'ant-ling',
]

const MAX_TOKENS_FIELDS = ['max_tokens', 'max_completion_tokens']

type ModelCardProps = {
  providerId: string
  model: PiModel
  /** 同一个 provider 下所有模型的 id，用来拦重名 */
  allIds: string[]
}

export function ModelCard({ providerId, model, allIds }: ModelCardProps) {
  const removeModel = usePiStore((state) => state.removeModel)
  const renameModel = usePiStore((state) => state.renameModel)
  const updateModel = usePiStore((state) => state.updateModel)
  const setModelThinkingMap = usePiStore((state) => state.setModelThinkingMap)
  const setModelCompat = usePiStore((state) => state.setModelCompat)

  // 从文件读来的高级配置默认展开，别让用户以为内容丢了
  const mapSize = Object.keys(model.thinkingLevelMap ?? {}).length
  const [showMap, setShowMap] = useState(mapSize > 0)
  const [showCompat, setShowCompat] = useState(model.compat !== undefined)
  const compatExtrasCount = Object.keys(model.compat?.extras ?? {}).length

  return (
    <div className="card card--model">
      <header className="card__header">
        <h4 className="card__title">模型</h4>
        <button
          type="button"
          className="card__remove"
          onClick={() => removeModel(providerId, model.id)}
        >
          删除
        </button>
      </header>

      <IdField
        label="模型 ID"
        value={model.id}
        takenIds={allIds.filter((other) => other !== model.id)}
        onCommit={(next) => renameModel(providerId, model.id, next)}
      />

      <TextField
        label="显示名称"
        value={model.name ?? ''}
        onChange={(name) => updateModel(providerId, model.id, { name })}
      />

      <div className="card__group">
        <span className="card__group-title">上下文</span>
        <NumberField
          label="上下文窗口（tokens）"
          value={model.contextWindow}
          onChange={(contextWindow) => updateModel(providerId, model.id, { contextWindow })}
        />
        <NumberField
          label="最大输出（tokens）"
          value={model.maxTokens}
          onChange={(maxTokens) => updateModel(providerId, model.id, { maxTokens })}
        />
      </div>

      <div className="card__group">
        <span className="card__group-title">能力</span>
        <CheckboxField
          label="支持思考（reasoning）"
          checked={model.reasoning === true}
          onChange={(reasoning) => updateModel(providerId, model.id, { reasoning })}
        />
        <CheckboxGroup
          label="接受的输入类型"
          options={INPUT_TYPES}
          selected={model.input ?? []}
          onChange={(input) => updateModel(providerId, model.id, { input })}
        />
      </div>

      <div className="card__group">
        <button type="button" className="button--ghost" onClick={() => setShowMap(!showMap)}>
          {showMap ? '收起' : '展开'}思考档位映射（高级）
        </button>
        {showMap ? (
          <>
            {mapSize > 0 && (
              <p className="empty-hint">
                已配置 {mapSize} 档。大多数 provider 用 pi 的档位名，整个不写就是原样透传。
              </p>
            )}
            <ThinkingMapField
              value={model.thinkingLevelMap ?? {}}
              onChange={(map) => setModelThinkingMap(providerId, model.id, map)}
            />
          </>
        ) : (
          <p className="empty-hint">
            minimal~high 不配置就是可用（透传）；xhigh/max 必须显式映射才会出现在
            /thinking 里。要调档位可用性就展开。
          </p>
        )}
      </div>

      <div className="card__group">
        <button type="button" className="button--ghost" onClick={() => setShowCompat(!showCompat)}>
          {showCompat ? '收起' : '展开'}兼容性（高级）
        </button>
        {showCompat ? (
          <>
            <SelectField
              label="思考格式（thinkingFormat）"
              value={model.compat?.thinkingFormat ?? ''}
              options={THINKING_FORMATS}
              emptyLabel="不设置"
              onChange={(thinkingFormat) => setModelCompat(providerId, model.id, { thinkingFormat })}
            />
            <SelectField
              label="输出上限字段（maxTokensField）"
              value={model.compat?.maxTokensField ?? ''}
              options={MAX_TOKENS_FIELDS}
              emptyLabel="不设置"
              onChange={(maxTokensField) => setModelCompat(providerId, model.id, { maxTokensField })}
            />
            {compatExtrasCount > 0 && (
              <p className="empty-hint">
                compat 里还有 {compatExtrasCount} 个这个工具不编辑的字段，会原样保留。
              </p>
            )}
          </>
        ) : (
          <p className="empty-hint">
            DeepSeek 系的中转常需要 thinkingFormat=deepseek 和 maxTokensField=max_tokens，
            其它情况一般不用动。
          </p>
        )}
      </div>
    </div>
  )
}
