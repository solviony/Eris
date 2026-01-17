export type UpdateStatus =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'not-available' }
  | { status: 'progress'; percent?: number }
  | { status: 'downloaded' }
  | { status: 'error'; message: string }

let current: UpdateStatus = { status: 'idle' }
const listeners = new Set<(s: UpdateStatus) => void>()

export function subscribeUpdates(cb: (s: UpdateStatus) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function emit(state: UpdateStatus) {
  current = state
  listeners.forEach((l) => l(state))
}

export function initUpdaterBridge() {
  window.erisUpdater.onStatus((payload) => {
    switch (payload.status) {
      case 'checking':
        emit({ status: 'checking' })
        break
      case 'available':
        emit({ status: 'available' })
        break
      case 'not-available':
        emit({ status: 'not-available' })
        break
      case 'progress':
        emit({
          status: 'progress',
          percent: payload.progress?.percent,
        })
        break
      case 'downloaded':
        emit({ status: 'downloaded' })
        break
      case 'error':
        emit({ status: 'error', message: payload.message })
        break
    }
  })
}

export function checkForUpdates() {
  window.erisUpdater.checkForUpdates()
}

export function downloadUpdate() {
  window.erisUpdater.downloadUpdate()
}

export function installUpdate() {
  window.erisUpdater.quitAndInstall()
}
