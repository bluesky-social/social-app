import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Button} from '../util/forms/Button'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'

export const ListActions = ({
  muted,
  onToggleSubscribed,
  onPressEditList,
  isOwner,
  onPressDeleteList,
  onPressShareList,
  reversed = false, // Default value of reversed is false
}: {
  isOwner: boolean
  muted?: boolean
  onToggleSubscribed?: () => void
  onPressEditList?: () => void
  onPressDeleteList?: () => void
  onPressShareList?: () => void
  reversed?: boolean // New optional prop
}) => {
  const pal = usePalette('default')

  let buttons = [
    <Button
      key="subscribeListBtn"
      testID={muted ? 'unsubscribeListBtn' : 'subscribeListBtn'}
      type={muted ? 'inverted' : 'primary'}
      label={muted ? 'Unsubscribe' : 'Subscribe & Mute'}
      accessibilityLabel={muted ? 'Unsubscribe' : 'Subscribe and mute'}
      accessibilityHint=""
      onPress={onToggleSubscribed}
    />,
    isOwner && (
      <Button
        key="editListBtn"
        testID="editListBtn"
        type="default"
        label="Edit List"
        accessibilityLabel="Edit list"
        accessibilityHint=""
        onPress={onPressEditList}
      />
    ),
    isOwner && (
      <Button
        key="deleteListBtn"
        testID="deleteListBtn"
        type="default"
        accessibilityLabel="Delete list"
        accessibilityHint=""
        onPress={onPressDeleteList}>
        <FontAwesomeIcon icon={['far', 'trash-can']} style={[pal.text]} />
      </Button>
    ),
    <Button
      key="shareListBtn"
      testID="shareListBtn"
      type="default"
      accessibilityLabel="Share list"
      accessibilityHint=""
      onPress={onPressShareList}>
      <FontAwesomeIcon icon={'share'} style={[pal.text]} />
    </Button>,
  ]

  // If reversed is true, reverse the array to reverse the order of the buttons
  if (reversed) {
    buttons = buttons.filter(Boolean).reverse() // filterting out any falsey values and reversing the array
  } else {
    buttons = buttons.filter(Boolean) // filterting out any falsey values
  }

  return <View style={styles.headerBtns}>{buttons}</View>
}

const styles = StyleSheet.create({
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
})
