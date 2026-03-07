import {type ViewStyle} from 'react-native'

export type ScrollEdgeInteractionEdge = 'top' | 'bottom' | 'left' | 'right'

export interface ExpoScrollEdgeInteractionViewProps {
  nodeHandle: number | null
  scrollViewTag: number | null
  edge?: ScrollEdgeInteractionEdge
  children: React.ReactNode
  style?: ViewStyle
}
