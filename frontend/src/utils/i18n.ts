import { ref } from 'vue'
import zhCN from '../locales/zh-CN'
import en from '../locales/en'

type Messages = Record<string, string>

const locales: Record<string, Messages> = {
  'zh-CN': zhCN,
  'en': en,
}

const currentLocale = ref(localStorage.getItem('locale') || 'zh-CN')

export function t(key: string, params?: Record<string, string | number>): string {
  const msg = locales[currentLocale.value]?.[key]
  if (msg === undefined) return key
  if (!params) return msg
  return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}

export function setLocale(l: string) {
  currentLocale.value = l
  localStorage.setItem('locale', l)
}

export function getLocale(): string {
  return currentLocale.value
}
