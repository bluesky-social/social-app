export function useWelcomeModal(): {
  isOpen: boolean
  open: () => void
  close: () => void
} {
  throw new Error('useWelcomeModal is web only')
}
