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
      <View>
        <Text style={[pal.text, styles.title]}>Welcome to </Text>
        <Text style={[pal.text, pal.link, styles.title]}>Bluesky</Text>

        <View style={styles.spacer} />

        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'globe'} size={48} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is a public social network.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              All posts, likes, and profiles here are public, so even though
              we're currently invite-only, treat everything here like it's a
              public blog.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'gear'} size={48} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky gives you more choice.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              You get to choose the algorithms that power your timeline. Want
              cat pics or only posts from your mutuals? That’s what custom feeds
              are for.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'at'} size={48} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is open.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              You’ll never lose access to your followers and data. You can take
              them to any app that supports the AT protocol.
            </Text>
          </View>
        </View>
      </View>

      <Button onPress={next} label="Continue" labelStyle={styles.buttonText} />
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
    marginTop: 20,
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
