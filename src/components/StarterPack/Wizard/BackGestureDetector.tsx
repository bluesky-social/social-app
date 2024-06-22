import React from 'react'

export function BackGestureDetector({
  onBack: _onBack,
  children,
}: {
  onBack: () => void
  children: React.ReactNode
}) {
  return children
}
