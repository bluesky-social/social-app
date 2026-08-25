import {type ButtonProps} from '#/components/Button'
import {Header} from '#/components/Layout'

// TEMP: Web needs a much more comprehensive layout change to support the new design
// so to do this incrementally, we'll do native only and migrate to web later

export const Slot = Header.Slot

export function Outer({}: {children: React.ReactNode}) {
  return null
}

export function Content({}: {children?: React.ReactNode}) {
  return null
}

export function Logo() {
  return null
}

export function BackButton({}: Partial<ButtonProps>) {
  return null
}
