/** 基础控件 */

import { useId } from 'react'

// 文本框
type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 建议项。用原生 datalist 提供下拉候选，同时仍然允许自由输入 */
  suggestions?: string[]
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
}: TextFieldProps) {
  const listId = useId()

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type="text"
        value={value}
        placeholder={placeholder}
        list={suggestions ? listId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </label>
  )
}

// 数字框
type NumberFieldProps = {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}

export function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type="number"
        min={1}
        step={1}
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value
          if (raw === '') {
            onChange(undefined)
            return
          }
          const parsed = Number(raw)
          // 只接受正整数；输入过程中不合法就忽略，输入框会停在上一个合法值
          if (Number.isInteger(parsed) && parsed > 0) {
            onChange(parsed)
          }
        }}
      />
    </label>
  )
}

// 勾选框
type CheckboxFieldProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

// 一组勾选框
type CheckboxGroupProps = {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}

export function CheckboxGroup({ label, options, selected, onChange }: CheckboxGroupProps) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="checks">
        {options.map((option) => (
          <label className="checkbox" key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => {
                // 结果按 options 的固定顺序排，跟点击顺序无关
                onChange(
                  event.target.checked
                    ? options.filter((item) => item === option || selected.includes(item))
                    : selected.filter((item) => item !== option),
                )
              }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// 下拉框
type SelectFieldProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  /** 空值选项的文案；不传就不提供空选项 */
  emptyLabel?: string
  disabled?: boolean
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  disabled,
}: SelectFieldProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select
        className="field__input"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
