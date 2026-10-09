/** 主题：偏好（跟随系统/白天/黑夜）的存取与解析。
 *
 * 偏好存 localStorage 的 theme 键；没存过或存了不认识的值都按 system（跟随系统）处理。
 * resolveTheme 把偏好解析成具体主题；applyTheme 负责落到 <html data-theme> 上。
 */

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

export function loadPreference(): ThemePreference {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'light' || raw === 'dark' ? raw : 'system'
}

export function savePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, preference)
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): 'light' | 'dark' {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light'
  }
  return preference
}

export function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = theme
}
