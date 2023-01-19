import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {usePalette} from '../../lib/hooks/usePalette'

export function ComposePrompt({
  text = "What's up?",
  btn = 'Post',
  isReply = false,
  onPressCompose,
}: {
  text?: string
  btn?: string
  isReply?: boolean
  onPressCompose: (imagesOpen?: boolean) => void
}) {
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      testID="composePromptButton"
      style={[
        pal.view,
        pal.border,
        styles.container,
        isReply ? styles.containerReply : undefined,
      ]}
      onPress={() => onPressCompose()}>
      {!isReply && (
        <FontAwesomeIcon
          icon={['fas', 'pen-nib']}
          size={18}
          style={[pal.textLight, styles.iconLeft]}
        />
      )}
      <View style={styles.textContainer}>
        <Text type={isReply ? 'lg' : 'lg-medium'} style={pal.textLight}>
          {text}
        </Text>
      </View>
      {isReply ? (
        <View
          style={[styles.btn, {backgroundColor: pal.colors.backgroundLight}]}>
          <Text type="button" style={pal.textLight}>
            {btn}
          </Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => onPressCompose(true)}>
          <FontAwesomeIcon
            icon={['far', 'image']}
            size={18}
            style={[pal.textLight, styles.iconRight]}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  iconLeft: {
    marginLeft: 22,
    marginRight: 2,
  },
  iconRight: {
    marginRight: 20,
  },
  container: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  containerReply: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  avatar: {
    width: 50,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
})
