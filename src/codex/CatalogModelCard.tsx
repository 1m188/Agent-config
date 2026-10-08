/** Codex 的一个模型目录条目卡片 */

import { CheckboxGroup, NumberField, SelectField, TextField } from '../components/Field'
import { IdField } from '../components/IdField'
import { CATALOG_LEVELS, INPUT_MODALITIES, type CatalogModel } from './catalog'
import { useCodexStore } from './store'

type CatalogModelCardProps = {
  slug: string
  model: CatalogModel
  /** 所有条目的 slug，用来拦重名 */
  allSlugs: string[]
}

export function CatalogModelCard({ slug, model, allSlugs }: CatalogModelCardProps) {
  const renameCatalogModel = useCodexStore((state) => state.renameCatalogModel)
  const removeCatalogModel = useCodexStore((state) => state.removeCatalogModel)
  const updateCatalogModel = useCodexStore((state) => state.updateCatalogModel)

  return (
    <section className="card card--model">
      <header className="card__header">
        <h3 className="card__title">目录模型</h3>
        <button type="button" className="card__remove" onClick={() => removeCatalogModel(slug)}>
          删除
        </button>
      </header>

      <IdField
        label="模型 ID"
        value={slug}
        takenIds={allSlugs.filter((other) => other !== slug)}
        onCommit={(next) => renameCatalogModel(slug, next)}
      />

      <TextField
        label="显示名称"
        value={model.displayName}
        placeholder="例如 DeepSeek V4"
        onChange={(displayName) => updateCatalogModel(slug, { displayName })}
      />

      <NumberField
        label="上下文窗口（tokens）"
        value={model.contextWindow}
        onChange={(contextWindow) => updateCatalogModel(slug, { contextWindow })}
      />

      <CheckboxGroup
        label="接受的输入"
        options={INPUT_MODALITIES}
        selected={model.inputModalities}
        onChange={(inputModalities) => updateCatalogModel(slug, { inputModalities })}
      />

      <CheckboxGroup
        label="支持的思考档位"
        options={CATALOG_LEVELS}
        selected={model.levels}
        onChange={(levels) => updateCatalogModel(slug, { levels })}
      />

      <SelectField
        label="默认档位"
        value={model.defaultLevel ?? ''}
        options={model.levels}
        emptyLabel="（不设默认）"
        disabled={model.levels.length === 0}
        onChange={(defaultLevel) => updateCatalogModel(slug, { defaultLevel })}
      />
    </section>
  )
}
