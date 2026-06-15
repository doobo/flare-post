type ConfirmResolve = (value: boolean) => void

let activeResolve: ConfirmResolve | null = null
let confirmState = {
  visible: false,
  message: '',
}

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(fn => fn())
}

export function getConfirmState() {
  return confirmState
}

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function showConfirm(message: string): Promise<boolean> {
  confirmState = { visible: true, message }
  notify()
  return new Promise<boolean>((resolve) => {
    activeResolve = resolve
  })
}

export function confirmAction(confirmed: boolean) {
  confirmState = { visible: false, message: '' }
  notify()
  activeResolve?.(confirmed)
  activeResolve = null
}
