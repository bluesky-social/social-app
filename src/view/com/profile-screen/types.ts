import {Props as FontAwesomeIconProps} from '@fortawesome/react-native-fontawesome'

export interface ProfileScreenHeaderInfo {
  href: string
  title: string
  avatar: string | undefined
  isOwner: boolean
  creator: {
    did: string
    handle: string
  }
}

export interface ProfileScreenHeaderBtn {
  inverted?: boolean
  icon?: FontAwesomeIconProps
  label?: string
  accessibilityLabel: string
  onPress: () => void
}
