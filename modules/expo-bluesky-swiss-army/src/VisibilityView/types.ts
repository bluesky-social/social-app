import React from 'react'
export interface VisibilityViewProps {
  children: React.ReactNode
  onChangeStatus: (isActive: boolean) => void
  enabled: boolean
}
