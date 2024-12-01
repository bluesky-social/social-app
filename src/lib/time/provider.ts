export interface TimeProvider {
  now(): Date
}

class SystemTimeProvider implements TimeProvider {
  now(): Date {
    return new Date()
  }
}

class CustomTimeProvider implements TimeProvider {
  private customTime: Date

  constructor(time: Date) {
    this.customTime = time
  }

  now(): Date {
    return new Date(this.customTime)
  }
}

let currentProvider: TimeProvider = new SystemTimeProvider()

export function setCustomTime(time: Date) {
  currentProvider = new CustomTimeProvider(time)
}

export function resetToSystemTime() {
  currentProvider = new SystemTimeProvider()
}

export function getCurrentTime(): Date {
  return currentProvider.now()
}
