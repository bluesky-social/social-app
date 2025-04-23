import {StyleSheet, View} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from '#/lib/hooks/usePalette'
import {s} from '#/lib/styles'
import {Button} from './forms/Button'
import {Text} from './text/Text'

interface Props {
  testID?: string
  icon: IconProp
  message: string
  buttonLabel: string
  onPress: () => void
}

export function EmptyStateWithButton(props: Props) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')

  return (
    <View testID={props.testID} style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesomeIcon
          icon={props.icon}
          style={[styles.icon, pal.text]}
          size={62}
        />
      </View>
      <Text type="xl-medium" style={[s.textCenter, pal.text]}>
        {props.message}
      </Text>
      <View style={styles.btns}>
        <Button
          testID={props.testID ? `${props.testID}-button` : undefined}
          type="inverted"
          style={styles.btn}
          onPress={props.onPress}>
          <FontAwesomeIcon
            icon="plus"
            style={palInverted.text as FontAwesomeIconStyle}
            size={14}
          />
          <Text type="lg-medium" style={palInverted.text}>
            {props.buttonLabel}
          </Text>
        </Button>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btn: {
    gap: 10,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  notice: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 30,
  },
})
