import React from 'react'
export interface VisibilityViewProps {
  children: React.ReactNode
  onActiveChange: (isActive: boolean) => void
  enabled: boolean
}
