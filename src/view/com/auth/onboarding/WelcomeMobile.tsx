import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Button} from 'view/com/util/forms/Button'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {Trans} from '@lingui/macro'

type Props = {
  next: () => void
  skip: () => void
}

export function WelcomeMobile({next, skip}: Props) {
  const pal = usePalette('default')

  return (
    <View style={[styles.container]} testID="welcomeOnboarding">
      <ViewHeader
        showOnDesktop
        showBorder={false}
        showBackButton={false}
        title=""
        renderButton={() => {
          return (
            <Pressable
              accessibilityRole="button"
              style={[s.flexRow, s.alignCenter]}
              onPress={skip}>
              <Text style={[pal.link]}>
                <Trans>Skip</Trans>
              </Text>
              <FontAwesomeIcon
                icon={'chevron-right'}
                size={14}
                color={pal.colors.link}
              />
            </Pressable>
          )
        }}
      />
      <View>
        <Text style={[pal.text, styles.title]}>
          Welcome to{' '}
          <Text style={[pal.text, pal.link, styles.title]}>
            <Trans>Bluesky</Trans>
          </Text>
        </Text>
        <View style={styles.spacer} />
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'globe'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              <Trans>Bluesky is public.</Trans>
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              <Trans>
                Your posts, likes, and blocks are public. Mutes are private.
              </Trans>
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'at'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              <Trans>Bluesky is open.</Trans>
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              <Trans>Never lose access to your followers and data.</Trans>
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'gear'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              <Trans>Bluesky is flexible.</Trans>
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              <Trans>
                Choose the algorithms that power your experience with custom
                feeds.
              </Trans>
            </Text>
          </View>
        </View>
      </View>

      <Button
        onPress={next}
        label="Continue"
        testID="continueBtn"
        style={[styles.buttonContainer]}
        labelStyle={styles.buttonText}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 60,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 42,
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
  buttonContainer: {
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 4,
  },
})
