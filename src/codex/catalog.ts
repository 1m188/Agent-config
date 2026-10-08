/** Codex 的模型目录（models.json）
 *
 * /model 选择器里的列表、以及每个模型能选哪些思考档位，都来自这里；
 * 不写目录，自定义模型就不会出现在 /model 里（这是 Codex 的设计）。
 *
 * 要害：目录条目必须带一份系统提示词。Codex 解析时会
 * `render_model_instructions` —— 条目缺 model_messages 就直接给"空提示词"，
 * 模型收不到任何工具指令（源码 model_instructions.rs，缺失时只打一条 warning）。
 * 所以这里把 Codex 自带的那份提示词（default-instructions.md）原样带上。
 */

import instructions from './default-instructions.md?raw'

/** 目录里的一个模型。只列出我们会写的字段。 */
export type CatalogModel = {
  /** 模型 ID，/model 里显示的就是它 */
  slug: string
  displayName: string
  /** 上下文窗口（tokens）。模型元数据归目录管，不再放 config.toml */
  contextWindow?: number
  /** 能收什么输入 */
  inputModalities: string[]
  /** 支持的思考档位 */
  levels: string[]
  /** 默认档位，必须是 levels 里的一个 */
  defaultLevel?: string
  /** 从文件读进来的条目里，我们不编辑的字段原样留在这里（comp_hash、base_instructions 这些） */
  extras?: Record<string, unknown>
  /** 各档位的说明文字。从文件读进来的原样保留；新加的档位用自带的默认文案 */
  levelDescriptions?: Record<string, string>
  /** 从文件读进来的 model_messages 原样保留；新加的模型用自带的默认提示词 */
  modelMessages?: unknown
}

/** Codex 自家模型在用的档位（gpt-5.5 到 gpt-6.1 的并集） */
export const CATALOG_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultra']

/** 档位在选择器里的说明文字。没收录的档位给空串。 */
const LEVEL_DESCRIPTIONS: Record<string, string> = {
  low: 'Fast responses with lighter reasoning',
  medium: 'Balanced reasoning depth for everyday tasks',
  high: 'Extra high reasoning depth for complex problems',
  xhigh: 'Very deep reasoning for hard problems',
  max: 'Maximum reasoning depth for the hardest problems',
  ultra: 'The deepest reasoning available on this model',
}

/** 输入模态的可选项 */
export const INPUT_MODALITIES = ['text', 'image']

/**
 * 把界面上的模型列表变成 models.json 的内容。
 *
 * 字段顺序是刻意排的：用户填的东西在前，那段提示词压在最后，
 * 免得预览里一打开就是两万字的提示词。
 * 每个字段都对过 ModelInfo 的定义（codex-rs/protocol/src/openai_models.rs），
 * 没有 serde 默认值的字段一个不落。
 */
export function buildModelsJson(models: CatalogModel[]): { models: unknown[] } {
  return {
    models: models.map((model) => ({
      slug: model.slug,
      display_name: model.displayName,
      context_window: model.contextWindow,
      max_context_window: model.contextWindow,
      effective_context_window_percent: 95,
      input_modalities: model.inputModalities,
      default_reasoning_level: model.defaultLevel,
      supported_reasoning_levels: model.levels.map((effort) => ({
        effort,
        description: model.levelDescriptions?.[effort] ?? LEVEL_DESCRIPTIONS[effort] ?? '',
      })),
      shell_type: 'shell_command',
      visibility: 'list',
      supported_in_api: true,
      priority: 1,
      support_verbosity: false,
      truncation_policy: { mode: 'tokens', limit: 10000 },
      experimental_supported_tools: [],
      // 从文件读进来的条目，我们没编辑的字段在这里原样带回去，一个不丢
      ...(model.extras ?? {}),
      model_messages: model.modelMessages ?? { instructions_template: instructions },
    })),
  }
}
