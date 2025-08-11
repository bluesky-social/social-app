// Web-safe stub for isOnlyEmoji
export function isOnlyEmoji(text: string) {
  text
  // Simple regex for emoji, or always return false for web
  return false
}

// Web-safe stub for normalizeTextStyles
export function normalizeTextStyles() {
  // Just return the styles as-is for web
  return styles
}

// Safe web shim for UITextView
export function UITextView(props: any) {
  return <span {...props}>{props.children}</span>
}
