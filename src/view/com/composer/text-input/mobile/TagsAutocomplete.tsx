import React, {useEffect} from 'react'
import {Animated, TouchableOpacity, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {TagsAutocompleteModel} from 'state/models/ui/tags-autocomplete'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {LEADING_HASH_REGEX, TAG_REGEX} from 'lib/strings/hashtags'

export function getHashtagAt(text: string, position: number) {
  let match
  while ((match = TAG_REGEX.exec(text))) {
    const [matchedString, tag] = match

    if (tag.length > 66) continue

    const from = match.index + matchedString.indexOf(tag)
    const to = from + tag.length

    if (position >= from && position <= to) {
      return {value: tag, index: from}
    }
  }

  /*
   * show autocomplete after a single # is typed
   * AND the cursor is next to the #
   */
  const hashRegex = LEADING_HASH_REGEX
  let hashMatch
  while ((hashMatch = hashRegex.exec(text))) {
    if (position >= hashMatch.index && position <= hashMatch.index + 1) {
      return {value: '', index: hashMatch.index}
    }
  }

  return undefined
}

export function insertTagAt(text: string, position: number, tag: string) {
  const target = getHashtagAt(text, position)
  if (target) {
    return `${text.slice(0, target.index)}#${tag} ${text.slice(
      target.index + target.value.length + 1, // add 1 to include the "#"
    )}`
  }
  return text
}

export const TagsAutocomplete = observer(function AutocompleteImpl({
  model,
  onSelect,
}: {
  model: TagsAutocompleteModel
  onSelect: (item: string) => void
}) {
  const pal = usePalette('default')
  const positionInterp = useAnimatedValue(0)

  useEffect(() => {
    Animated.timing(positionInterp, {
      toValue: model.isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [positionInterp, model.isActive])

  const topAnimStyle = {
    transform: [
      {
        translateY: positionInterp.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0],
        }),
      },
    ],
  }

  if (!model.suggestions.length) return null

  return (
    <Animated.View style={topAnimStyle}>
      {model.isActive ? (
        <View style={[pal.view, styles.container, pal.border]}>
          {model.suggestions.slice(0, 5).map(item => {
            return (
              <TouchableOpacity
                testID="autocompleteButton"
                key={item}
                style={[pal.border, styles.item]}
                onPress={() => onSelect(item)}
                accessibilityLabel={`Select #${item}`}
                accessibilityHint="">
                <Text type="sm" style={pal.textLight} numberOfLines={1}>
                  #{item}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : null}
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginLeft: -50, // Composer avatar width
    top: 10,
    borderTopWidth: 1,
  },
  item: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
})
