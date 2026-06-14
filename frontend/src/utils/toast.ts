/**
 * Global Toast Notification System
 * 
 * Usage:
 *   import { showToast } from '@/utils/toast'
 *   showToast('操作成功！', 'success')
 *   showToast('发生错误', 'error')
 *   showToast('提示信息', 'info')
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastEvent {
  message: string
  type: ToastType
}

type ToastListener = (event: ToastEvent) => void

const listeners: Set<ToastListener> = new Set()

/**
 * Subscribe to toast events (used by App.vue)
 */
export function onToast(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Show a toast notification globally
 */
export function showToast(message: string, type: ToastType = 'info'): void {
  listeners.forEach(fn => fn({ message, type }))
}

/**
 * Auto-detect toast type from message content
 */
export function showAutoToast(message: string): void {
  const lower = message.toLowerCase()
  let type: ToastType = 'info'

  if (
    lower.includes('success') ||
    lower.includes('成功') ||
    lower.includes('恢复') ||
    lower.includes('saved') ||
    lower.includes('published')
  ) {
    type = 'success'
  } else if (
    lower.includes('fail') ||
    lower.includes('error') ||
    lower.includes('expire') ||
    lower.includes('invalid') ||
    lower.includes('失败') ||
    lower.includes('错误') ||
    lower.includes('过期') ||
    lower.includes('not found')
  ) {
    type = 'error'
  } else if (
    lower.includes('warning') ||
    lower.includes('注意') ||
    lower.includes('警告')
  ) {
    type = 'warning'
  }

  showToast(message, type)
}
