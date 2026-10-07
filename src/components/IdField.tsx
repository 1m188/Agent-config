/** ID专用输入框 */

import { useRef, useState } from 'react'

type IdFieldProps = {
  label: string
  /** 当前真正的 id（也就是配置里的键名） */
  value: string
  /** 已经被其它条目占用的 id，用来拦重复 */
  takenIds: string[]
  onCommit: (next: string) => void
}

/**
 * id 输入框。
 *
 * id 同时是配置里的键名，所以每敲一个字就改键名会让 React 把整张卡片当成新的重建、
 * 光标丢失。这里用本地暂存文字、离开输入框时再提交的办法绕开。
 */
export function IdField({ label, value, takenIds, onCommit }: IdFieldProps) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function commit() {
    const next = draft.trim()

    if (next === value) {
      setError('')
      return
    }
    if (next === '') {
      // id 不能为空，退回原来的值
      setDraft(value)
      setError('')
      return
    }
    if (takenIds.includes(next)) {
      setError(`「${next}」已经被占用了`)
      return
    }

    setError('')
    onCommit(next)
  }

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        ref={inputRef}
        className="field__input"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') inputRef.current?.blur()
        }}
      />
      {error !== '' && <span className="field__error">{error}</span>}
    </label>
  )
}
