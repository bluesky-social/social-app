import React from 'react'

export interface ExpoScrollForwarderViewProps {
  scrollViewTag?: number
  onScrollViewRefresh?: () => Promise<void>
  scrollViewRefreshing?: boolean
  children: React.ReactNode
}
