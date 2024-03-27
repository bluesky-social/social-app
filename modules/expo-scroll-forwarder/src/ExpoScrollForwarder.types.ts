import React from 'react'

export interface ExpoScrollForwarderViewProps {
  scrollViewTag?: string
  onScrollViewRefresh?: () => Promise<void>
  scrollViewRefreshing?: boolean
  children: React.ReactNode
}
