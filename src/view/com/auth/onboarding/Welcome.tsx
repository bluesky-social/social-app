import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Button} from 'view/com/util/forms/Button'

export const Welcome = ({next}: {next: () => void}) => {
  const pal = usePalette('default')
  return (
    <View style={[styles.container]}>
      <View testID="welcomeScreen">
        <Text style={[pal.text, styles.title]}>Welcome to </Text>
        <Text style={[pal.text, pal.link, styles.title]}>Bluesky</Text>

        <View style={styles.spacer} />

        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'globe'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is public.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Your posts, likes, and blocks are public. Mutes are private.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'at'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is open.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Never lose access to your followers and data.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'gear'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is flexible.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Choose the algorithms that power your experience with custom
              feeds.
            </Text>
          </View>
        </View>
      </View>

      <Button
        onPress={next}
        label="Continue"
        testID="continueBtn"
        labelStyle={styles.buttonText}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 60,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    columnGap: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  rowText: {
    flex: 1,
  },
  spacer: {
    height: 20,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 4,
  },
})
