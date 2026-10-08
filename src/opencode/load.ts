/** 读取一份 OpenCode 配置文件的内容。
 *
 * 只做两件事：把文本变成配置对象，以及把失败讲成人话。
 * 解析用微软的 jsonc-parser（VS Code 读 settings.json、tsconfig.json 用的就是它），
 * 它比 JSON.parse 多认注释和尾逗号，正好就是 OpenCode 对 jsonc 的支持范围。
 */

import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser'
import type { OpencodeConfig } from './store'

/** 选项显式写出来：库的文档没把默认值列全，写出来也说明了我们要的宽松程度。 */
const PARSE_OPTIONS = {
  disallowComments: false,
  allowTrailingComma: true,
  allowEmptyContent: false,
}

/** 错误码是封闭的一小撮，翻成中文比甩一句 ValueExpected 有用。 */
const ERROR_REASONS: Partial<
  Record<ReturnType<typeof printParseErrorCode>, string>
> = {
  InvalidSymbol: '这里有一个无法识别的符号',
  InvalidNumberFormat: '数字的格式不对',
  PropertyNameExpected: '这里应该是一个属性名，而且要用双引号包起来',
  ValueExpected: '这里应该有一个值',
  ColonExpected: '属性名后面少了一个冒号',
  CommaExpected: '这里少了一个逗号',
  CloseBraceExpected: '少了一个右花括号 }',
  CloseBracketExpected: '少了一个右方括号 ]',
  EndOfFileExpected: '最后一个花括号后面还有多余的内容',
  InvalidCommentToken: '注释符号不对',
  UnexpectedEndOfComment: '注释没有结束，少了 */',
  UnexpectedEndOfString: '字符串没有结束，少了引号',
  UnexpectedEndOfNumber: '数字没有写完',
  InvalidUnicode: '转义里的 Unicode 写法不对',
  InvalidEscapeCharacter: '转义符不对',
  InvalidCharacter: '这里有一个不该出现的字符',
}

/** 把字符偏移换算成给用户看的行列号，都从 1 开始。 */
function positionOf(text: string, offset: number): string {
  const before = text.slice(0, offset)
  const line = before.split('\n').length
  const column = offset - before.lastIndexOf('\n')
  return `第 ${line} 行第 ${column} 列`
}

/**
 * 解析配置文件的内容。出错就抛异常，调用方直接把 message 拿给用户看。
 *
 * 这个解析器是容错的：内容坏了它也尽力给出一个结果，所以必须自己检查 errors，
 * 一条都不能放过——否则会把半份配置塞进界面，静默丢掉用户文件里的东西。
 */
export function parseConfig(text: string): OpencodeConfig {
  const errors: ParseError[] = []
  const value = parse(text, errors, PARSE_OPTIONS)

  if (errors.length > 0) {
    const { error, offset } = errors[0]
    const code = printParseErrorCode(error)
    throw new Error(`${positionOf(text, offset)}：${ERROR_REASONS[code] ?? code}`)
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('这个文件的内容不是一个 JSON 对象')
  }

  // 文件里我们不认识的字段一并带回去：store 只替换它动过的那一层，其余的原地不动
  return value as OpencodeConfig
}
