/**
 * Clipboard utility with modern API fallback
 */

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      return true
    } finally {
      document.body.removeChild(ta)
    }
  }
}
