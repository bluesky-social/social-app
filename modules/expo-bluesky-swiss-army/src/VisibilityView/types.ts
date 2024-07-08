import React from 'react'
export interface VisibilityViewProps {
  children: React.ReactNode
  onVisibilityChange: (isVisible: boolean) => void
  enabled: boolean
}
